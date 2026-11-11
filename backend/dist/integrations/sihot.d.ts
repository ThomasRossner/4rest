import { SihotGuest, SihotProperty, SihotReservation, ReservationFilters, CreateReservationInput, UpdateReservationInput, ChargeInput, SihotFolioEntry, SihotMockService } from './sihot-mock.js';
declare class SihotIntegration {
    private config;
    private client?;
    private mock;
    constructor();
    isMock(): boolean;
    listProperties(): Promise<SihotProperty[]>;
    listReservations(filters?: ReservationFilters): Promise<SihotReservation[]>;
    getReservation(reservationId: string): Promise<SihotReservation | undefined>;
    getFolio(reservationId: string): Promise<SihotFolioEntry[] | undefined>;
    createReservation(input: CreateReservationInput): Promise<SihotReservation>;
    updateReservation(reservationId: string, input: UpdateReservationInput): Promise<SihotReservation | undefined>;
    checkInReservation(reservationId: string): Promise<SihotReservation | undefined>;
    checkOutReservation(reservationId: string): Promise<SihotReservation | undefined>;
    cancelReservation(reservationId: string): Promise<SihotReservation | undefined>;
    addCharge(reservationId: string, charge: ChargeInput): Promise<SihotReservation | undefined>;
    listGuests(): Promise<SihotGuest[]>;
    getGuest(guestId: string): Promise<SihotGuest | undefined>;
    findGuestByEmail(email: string): Promise<SihotGuest | undefined>;
    getReservationsByGuest(guestId: string): Promise<SihotReservation[]>;
    reset(seed?: Parameters<SihotMockService['reset']>[0]): Promise<void>;
    setLatency(latencyMs: number): void;
}
export declare const sihot: SihotIntegration;
export type { SihotGuest, SihotProperty, SihotReservation };
//# sourceMappingURL=sihot.d.ts.map