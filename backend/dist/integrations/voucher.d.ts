declare class VoucherIntegration {
    private config;
    private client;
    constructor();
    /**
     * Generate a voucher code from external system
     */
    generateVoucher(rewardType: string, pointsValue: number): Promise<string>;
    /**
     * Validate a voucher code
     */
    validateVoucher(voucherCode: string): Promise<boolean>;
    /**
     * Generate a local voucher code when external API is not available
     */
    private generateLocalVoucher;
    /**
     * Mark a voucher as used in external system
     */
    markVoucherUsed(voucherCode: string): Promise<boolean>;
    /**
     * Get voucher details from external system
     */
    getVoucherDetails(voucherCode: string): Promise<any>;
}
export declare const voucherSystem: VoucherIntegration;
export {};
//# sourceMappingURL=voucher.d.ts.map