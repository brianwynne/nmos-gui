/**
 * NMOS RDS Configuration
 * Centralized configuration for NMOS Registry & Discovery System
 */

export class NMOSRDSConfig {
    static STORAGE_KEY_URL = 'nmosrds_registry_url';
    static STORAGE_KEY_ENABLED = 'nmosrds_enabled';

    /**
     * Get NMOS RDS registry URL from storage
     */
    static getRegistryUrl() {
        return localStorage.getItem(this.STORAGE_KEY_URL) || '';
    }

    /**
     * Set NMOS RDS registry URL in storage
     */
    static setRegistryUrl(url) {
        localStorage.setItem(this.STORAGE_KEY_URL, url);
    }

    /**
     * Check if NMOS RDS discovery is enabled
     */
    static isEnabled() {
        const enabled = localStorage.getItem(this.STORAGE_KEY_ENABLED);
        return enabled === 'true'; // Default to false
    }

    /**
     * Enable or disable NMOS RDS discovery
     */
    static setEnabled(enabled) {
        localStorage.setItem(this.STORAGE_KEY_ENABLED, enabled.toString());
    }

    /**
     * Reset to defaults
     */
    static reset() {
        localStorage.removeItem(this.STORAGE_KEY_URL);
        localStorage.removeItem(this.STORAGE_KEY_ENABLED);
    }
}
