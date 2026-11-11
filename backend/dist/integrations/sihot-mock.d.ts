export type ReservationStatus = 'reserved' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export interface Address {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
}
export interface SihotProperty {
    propertyId: string;
    name: string;
    timezone: string;
    currency: string;
    address: Address;
    contactEmail?: string;
    phone?: string;
}
export interface SihotGuest {
    guestId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    loyaltyLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
    language?: string;
    notes?: string;
    preferences?: string[];
}
export interface SihotFolioEntry {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'charge' | 'payment';
    reference?: string;
}
export interface SihotReservation {
    reservationId: string;
    confirmationNumber: string;
    propertyId: string;
    roomNumber: string;
    status: ReservationStatus;
    arrivalDate: string;
    departureDate: string;
    primaryGuestId: string;
    adults: number;
    children: number;
    rateCode?: string;
    travelAgent?: string;
    balance: number;
    notes?: string;
    folio: SihotFolioEntry[];
}
export interface ReservationFilters {
    propertyId?: string;
    status?: ReservationStatus;
    arrivalDateFrom?: string;
    arrivalDateTo?: string;
    departureDateFrom?: string;
    departureDateTo?: string;
    search?: string;
}
export interface GuestCreateInput extends Omit<SihotGuest, 'guestId'> {
    guestId?: string;
}
export interface GuestUpdateInput extends Partial<Omit<SihotGuest, 'guestId'>> {
    guestId?: string;
}
export interface CreateReservationInput {
    propertyId: string;
    roomNumber: string;
    arrivalDate: string;
    departureDate: string;
    primaryGuest: GuestCreateInput;
    adults?: number;
    children?: number;
    rateCode?: string;
    travelAgent?: string;
    status?: ReservationStatus;
    notes?: string;
}
export interface UpdateReservationInput {
    roomNumber?: string;
    arrivalDate?: string;
    departureDate?: string;
    adults?: number;
    children?: number;
    rateCode?: string;
    travelAgent?: string;
    status?: ReservationStatus;
    notes?: string;
    primaryGuest?: GuestUpdateInput;
}
export interface ChargeInput {
    description: string;
    amount: number;
    type?: 'charge' | 'payment';
    reference?: string;
    date?: string;
}
interface SeedData {
    properties?: SihotProperty[];
    guests?: SihotGuest[];
    reservations?: SihotReservation[];
}
export declare class SihotMockService {
    private properties;
    private guests;
    private reservations;
    private latencyMs;
    constructor(seed?: SeedData);
    listProperties(): Promise<SihotProperty[]>;
    listReservations(filters?: ReservationFilters): Promise<SihotReservation[]>;
    getReservation(reservationId: string): Promise<SihotReservation | undefined>;
    createReservation(input: CreateReservationInput): Promise<SihotReservation>;
    updateReservation(reservationId: string, input: UpdateReservationInput): Promise<SihotReservation | undefined>;
    checkInReservation(reservationId: string): Promise<SihotReservation | undefined>;
    checkOutReservation(reservationId: string): Promise<SihotReservation | undefined>;
    cancelReservation(reservationId: string): Promise<SihotReservation | undefined>;
    getFolio(reservationId: string): Promise<SihotFolioEntry[] | undefined>;
    addCharge(reservationId: string, charge: ChargeInput): Promise<SihotReservation | undefined>;
    listGuests(): Promise<SihotGuest[]>;
    getGuest(guestId: string): Promise<SihotGuest | undefined>;
    findGuestByEmail(email: string): Promise<SihotGuest | undefined>;
    getReservationsByGuest(guestId: string): Promise<SihotReservation[]>;
    reset(seed?: SeedData): Promise<void>;
    setLatency(latencyMs: number): void;
    private delay;
    private upsertGuest;
    private updateStatus;
    private generateConfirmationNumber;
    private buildDefaultSeed;
}
export declare const sihotMock: SihotMockService;
export {};
//# sourceMappingURL=sihot-mock.d.ts.map