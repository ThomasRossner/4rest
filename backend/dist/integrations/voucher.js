import axios from 'axios';
class VoucherIntegration {
    config;
    client;
    constructor() {
        this.config = {
            apiUrl: process.env.VOUCHER_API_URL || '',
            apiKey: process.env.VOUCHER_API_KEY || '',
        };
        this.client = axios.create({
            baseURL: this.config.apiUrl,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 second timeout
        });
    }
    /**
     * Generate a voucher code from external system
     */
    async generateVoucher(rewardType, pointsValue) {
        // If no external API is configured, generate a simple code locally
        if (!this.config.apiUrl || !this.config.apiKey) {
            return this.generateLocalVoucher(rewardType, pointsValue);
        }
        try {
            const response = await this.client.post('/vouchers/generate', {
                type: rewardType,
                value: pointsValue,
                metadata: {
                    source: 'roots-of-impact',
                    timestamp: new Date().toISOString(),
                },
            });
            return response.data.voucherCode || response.data.code;
        }
        catch (error) {
            console.error('Voucher generation error:', error.message);
            // Fallback to local generation on error
            return this.generateLocalVoucher(rewardType, pointsValue);
        }
    }
    /**
     * Validate a voucher code
     */
    async validateVoucher(voucherCode) {
        // If no external API, assume local vouchers are valid
        if (!this.config.apiUrl || !this.config.apiKey) {
            return true;
        }
        try {
            const response = await this.client.get(`/vouchers/validate/${voucherCode}`);
            return response.data.valid === true || response.data.status === 'active';
        }
        catch (error) {
            console.error('Voucher validation error:', error.message);
            // On error, assume valid to prevent blocking legitimate redemptions
            return true;
        }
    }
    /**
     * Generate a local voucher code when external API is not available
     */
    generateLocalVoucher(rewardType, pointsValue) {
        const prefix = rewardType.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }
    /**
     * Mark a voucher as used in external system
     */
    async markVoucherUsed(voucherCode) {
        if (!this.config.apiUrl || !this.config.apiKey) {
            return true; // Assume success if no external API
        }
        try {
            const response = await this.client.post(`/vouchers/${voucherCode}/mark-used`, {
                usedAt: new Date().toISOString(),
            });
            return response.data.success !== false;
        }
        catch (error) {
            console.error('Error marking voucher as used:', error.message);
            return false;
        }
    }
    /**
     * Get voucher details from external system
     */
    async getVoucherDetails(voucherCode) {
        if (!this.config.apiUrl || !this.config.apiKey) {
            return null;
        }
        try {
            const response = await this.client.get(`/vouchers/${voucherCode}`);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching voucher details:', error.message);
            return null;
        }
    }
}
export const voucherSystem = new VoucherIntegration();
//# sourceMappingURL=voucher.js.map