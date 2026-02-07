/**
 * AES67/Calrec SAP Client
 * Handles communication with AES67 SAP discovery backend
 * Implements same interface as NMOSClient for protocol abstraction
 */

export class AES67Client {
    constructor(aes67ServerUrl) {
        this.aes67ServerUrl = aes67ServerUrl.replace(/\/$/, ''); // Remove trailing slash
        this.version = null;
        this.connectionBaseUrl = null;
    }

    /**
     * Initialize the client by checking backend health and discovering version
     */
    async initialize() {
        try {
            // Check backend health first
            const health = await this.fetchJSON('/health', this.aes67ServerUrl);
            if (health.status !== 'healthy') {
                throw new Error(`AES67 backend unhealthy: ${health.status}. Check if SAP server is running.`);
            }

            console.log('✅ AES67 backend healthy:', {
                database: health.database,
                redis: health.redis,
                sap_listener: health.sap_listener,
                active_streams: health.active_streams
            });

            // Get API version
            const versions = await this.fetchJSON('/aes67/sap/');
            this.version = versions.sort().reverse()[0].replace(/\//g, '');

            // Set connection endpoint base URL
            this.connectionBaseUrl = `${this.aes67ServerUrl}/aes67/connection/${this.version}`;

            console.log(`✅ AES67 client initialized: version ${this.version}`);
            return true;
        } catch (error) {
            console.error('Failed to initialize AES67 client:', error);
            throw new Error(`Failed to connect to AES67 backend: ${error.message}`);
        }
    }

    /**
     * Get all senders from AES67 SAP discovery
     */
    async getSenders() {
        const senders = await this.fetchJSON(`/aes67/sap/${this.version}/senders/`);

        return senders.map(s => {
            // Parse format (default to audio for AES67)
            let format = s.format || 'audio';

            return {
                id: s.id,
                label: s.label || s.session_name || s.id,
                description: s.description || '',
                format: format,
                manifest_href: s.manifest_href,

                // AES67-specific fields
                multicast_ip: s.multicast_ip,
                destination_port: s.destination_port,
                source_ip: s.source_ip,
                channels: s.channels,
                sample_rate: s.sample_rate,

                // Standard fields
                device_id: s.device_id,
                transport: s.transport || 'urn:x-nmos:transport:rtp'
            };
        });
    }

    /**
     * Get all receivers from AES67 SAP discovery
     */
    async getReceivers() {
        const receivers = await this.fetchJSON(`/aes67/sap/${this.version}/receivers/`);

        return receivers.map(r => {
            // Parse format (default to audio for AES67)
            let format = r.format || 'audio';

            return {
                id: r.id,
                label: r.label || r.id,
                description: r.description || '',
                format: format,

                // Device info
                device_id: r.device_id,
                device_label: r.device_label,

                // Standard fields
                transport: r.transport || 'urn:x-nmos:transport:rtp',
                caps: r.caps || {}
            };
        });
    }

    /**
     * Get SDP from sender's manifest_href
     */
    async getSenderSDP(sender) {
        if (!sender.manifest_href) {
            throw new Error('Sender does not have manifest_href');
        }

        try {
            const response = await fetch(sender.manifest_href);
            if (!response.ok) {
                throw new Error(`Failed to fetch SDP: ${response.status} ${response.statusText}`);
            }

            const sdp = await response.text();

            // Validate SDP has required fields
            if (!sdp.includes('v=0')) {
                throw new Error('Invalid SDP: missing version field');
            }

            return sdp;
        } catch (error) {
            console.error('Failed to fetch SDP:', error);
            throw new Error(`Failed to fetch SDP from ${sender.manifest_href}: ${error.message}`);
        }
    }

    /**
     * Patch receiver with sender's SDP
     * Backend proxies the configuration to actual AES67 device
     */
    async patchReceiver(receiverId, senderId, sdpText) {
        if (!this.connectionBaseUrl) {
            throw new Error('AES67 connection endpoint not available. Did you call initialize()?');
        }

        try {
            // Import SDP parser (REUSE existing parser!)
            const { SDPParser } = await import('./sdp-parser.js');
            const parser = new SDPParser();

            // Parse SDP to get transport params
            // AES67 typically uses 1 port (no redundancy by default)
            const patchBody = parser.parseToJSON(sdpText, senderId, 1);

            // Send PATCH to Go backend (which proxies to AES67 device)
            const stagedPath = `/receivers/${receiverId}/staged`;
            const fullUrl = `${this.connectionBaseUrl}${stagedPath}`;

            console.log('Sending AES67 PATCH:', {
                url: fullUrl,
                receiverId,
                senderId,
                transport_params: patchBody.transport_params
            });

            const response = await fetch(fullUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(patchBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
            }

            // Wait for activation to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get active state from backend
            const activePath = `/receivers/${receiverId}/active`;
            const activeUrl = `${this.connectionBaseUrl}${activePath}`;

            let activeState = null;
            try {
                activeState = await this.fetchJSON(activePath, this.connectionBaseUrl);
            } catch (error) {
                console.warn('Could not fetch active state:', error);
                // Non-fatal - patch may have succeeded even if we can't read active state
            }

            return {
                success: true,
                patchBody,
                activeState,
                paths: {
                    stagedPath: fullUrl,
                    activePath: activeUrl
                }
            };

        } catch (error) {
            console.error('Failed to patch AES67 receiver:', error);
            throw new Error(`Failed to configure AES67 receiver: ${error.message}`);
        }
    }

    /**
     * Get receiver's current active connection
     * @param {string} receiverId - Receiver ID
     * @returns {Object|null} Active connection info or null
     */
    async getReceiverActiveConnection(receiverId) {
        if (!this.connectionBaseUrl || !this.version) {
            return null;
        }

        try {
            const activePath = `/receivers/${receiverId}/active`;
            const fullUrl = `${this.connectionBaseUrl}${activePath}`;

            console.log(`Fetching active connection from: ${fullUrl}`);

            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.warn(`Failed to fetch active connection for receiver ${receiverId}:`, error);
            return null;
        }
    }

    /**
     * Get sender's current active connection/status
     * @param {string} senderId - Sender ID
     * @returns {Object|null} Active connection info or null
     */
    async getSenderActiveConnection(senderId) {
        if (!this.connectionBaseUrl || !this.version) {
            return null;
        }

        try {
            const activePath = `/senders/${senderId}/active`;
            const fullUrl = `${this.connectionBaseUrl}${activePath}`;

            console.log(`Fetching sender active state from: ${fullUrl}`);

            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.warn(`Failed to fetch active connection for sender ${senderId}:`, error);
            return null;
        }
    }

    /**
     * Fetch JSON from AES67 backend API
     */
    async fetchJSON(path, baseUrl = null) {
        const url = (baseUrl || this.aes67ServerUrl) + path;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error(`Network error: Cannot reach ${url}. Is the AES67 SAP server running?`);
            }
            throw error;
        }
    }

    /**
     * Static method to discover from AES67 registry (if available)
     * Similar to NMOS RDS discovery
     */
    static async discoverFromRegistry(registryUrl) {
        // Placeholder for future AES67 registry discovery
        // Most AES67 networks use SAP multicast, not centralized registry
        throw new Error('AES67 registry discovery not yet implemented. Use direct SAP server URL.');
    }
}
