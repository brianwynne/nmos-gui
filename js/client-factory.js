/**
 * Client Factory
 * Creates appropriate protocol client (NMOS or AES67) based on node configuration
 */

export class ClientFactory {
    /**
     * Create a client based on node protocol
     * @param {Object} node - Node configuration object with protocol field
     * @returns {Promise<NMOSClient|AES67Client>}
     * @throws {Error} If protocol is unknown or required URL is missing
     */
    static async createClient(node) {
        const protocol = node.protocol || 'nmos';

        switch (protocol) {
            case 'nmos':
                if (!node.is04_url) {
                    throw new Error('NMOS node requires is04_url');
                }
                const { NMOSClient } = await import('./nmos-api.js');
                return new NMOSClient(node.is04_url);

            case 'aes67':
            case 'calrec':  // Alias for backwards compatibility
                if (!node.aes67_server_url && !node.sap_server_url) {
                    throw new Error('AES67 node requires aes67_server_url or sap_server_url');
                }
                const serverUrl = node.aes67_server_url || node.sap_server_url;
                const { AES67Client } = await import('./aes67-client.js');
                return new AES67Client(serverUrl);

            default:
                throw new Error(`Unknown protocol: ${protocol}. Supported: nmos, aes67`);
        }
    }

    /**
     * Get protocol-specific URL field name
     * @param {string} protocol - Protocol name ('nmos' or 'aes67')
     * @returns {string} URL field name
     */
    static getUrlField(protocol) {
        switch (protocol) {
            case 'nmos':
                return 'is04_url';
            case 'aes67':
            case 'calrec':
                return 'aes67_server_url';
            default:
                return 'is04_url';
        }
    }

    /**
     * Get protocol display name for UI
     * @param {string} protocol - Protocol name
     * @returns {string} Human-readable protocol name
     */
    static getDisplayName(protocol) {
        switch (protocol) {
            case 'nmos':
                return 'NMOS';
            case 'aes67':
                return 'AES67';
            case 'calrec':
                return 'Calrec SAP';
            default:
                return 'Unknown';
        }
    }

    /**
     * Get protocol badge emoji for UI
     * @param {string} protocol - Protocol name
     * @returns {string} Emoji badge
     */
    static getBadge(protocol) {
        switch (protocol) {
            case 'nmos':
                return '📡';
            case 'aes67':
            case 'calrec':
                return '🎙️';
            default:
                return '❓';
        }
    }

    /**
     * Validate node configuration for protocol
     * @param {Object} node - Node configuration
     * @returns {boolean} True if valid
     * @throws {Error} If invalid
     */
    static validateNode(node) {
        if (!node.protocol) {
            throw new Error('Node missing protocol field');
        }

        if (!node.name) {
            throw new Error('Node missing name field');
        }

        const protocol = node.protocol;
        const urlField = this.getUrlField(protocol);

        if (!node[urlField]) {
            throw new Error(`${protocol.toUpperCase()} node missing ${urlField} field`);
        }

        return true;
    }
}
