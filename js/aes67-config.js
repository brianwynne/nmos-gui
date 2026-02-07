/**
 * AES67 Configuration
 * Centralized configuration for AES67/SAP discovery
 */

export class AES67Config {
    static DEFAULT_SERVER_URL = 'http://localhost:8080';
    static STORAGE_KEY = 'aes67_server_url';
    static ENABLED_KEY = 'aes67_enabled';

    /**
     * Get AES67 server URL from storage or return default
     */
    static getServerUrl() {
        return localStorage.getItem(this.STORAGE_KEY) || this.DEFAULT_SERVER_URL;
    }

    /**
     * Set AES67 server URL in storage
     */
    static setServerUrl(url) {
        localStorage.setItem(this.STORAGE_KEY, url);
    }

    /**
     * Check if AES67 discovery is enabled
     */
    static isEnabled() {
        const enabled = localStorage.getItem(this.ENABLED_KEY);
        return enabled === null ? true : enabled === 'true'; // Default to enabled
    }

    /**
     * Enable or disable AES67 discovery
     */
    static setEnabled(enabled) {
        localStorage.setItem(this.ENABLED_KEY, enabled.toString());
    }

    /**
     * Reset to defaults
     */
    static reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.ENABLED_KEY);
    }
}
