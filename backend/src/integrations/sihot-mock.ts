import { randomUUID } from 'crypto';

export type ReservationStatus =
  | 'reserved'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

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

function withinDateRange(
  value: string,
  from?: string,
  to?: string
): boolean {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return false;
  }

  if (from && timestamp < Date.parse(from)) {
    return false;
  }

  if (to && timestamp > Date.parse(to)) {
    return false;
  }

  return true;
}

function matchesSearch(
  reservation: SihotReservation,
  guest: SihotGuest | undefined,
  search?: string
): boolean {
  if (!search) {
    return true;
  }

  const haystack: string[] = [
    reservation.confirmationNumber,
    reservation.roomNumber,
    reservation.notes || '',
    guest?.firstName || '',
    guest?.lastName || '',
    guest?.email || '',
    guest?.phone || '',
  ];

  const token = search.toLowerCase();
  return haystack.some((value) => value.toLowerCase().includes(token));
}

export class SihotMockService {
  private properties = new Map<string, SihotProperty>();
  private guests = new Map<string, SihotGuest>();
  private reservations = new Map<string, SihotReservation>();
  private latencyMs = 0;

  constructor(seed?: SeedData) {
    this.reset(seed);
  }

  public async listProperties(): Promise<SihotProperty[]> {
    await this.delay();
    return Array.from(this.properties.values());
  }

  public async listReservations(filters: ReservationFilters = {}): Promise<SihotReservation[]> {
    await this.delay();

    const entries = Array.from(this.reservations.values());

    return entries.filter((reservation) => {
      if (filters.propertyId && reservation.propertyId !== filters.propertyId) {
        return false;
      }

      if (filters.status && reservation.status !== filters.status) {
        return false;
      }

      if (
        (filters.arrivalDateFrom || filters.arrivalDateTo) &&
        !withinDateRange(reservation.arrivalDate, filters.arrivalDateFrom, filters.arrivalDateTo)
      ) {
        return false;
      }

      if (
        (filters.departureDateFrom || filters.departureDateTo) &&
        !withinDateRange(reservation.departureDate, filters.departureDateFrom, filters.departureDateTo)
      ) {
        return false;
      }

      const guest = this.guests.get(reservation.primaryGuestId);
      return matchesSearch(reservation, guest, filters.search);
    });
  }

  public async getReservation(reservationId: string): Promise<SihotReservation | undefined> {
    await this.delay();
    return this.reservations.get(reservationId);
  }

  public async createReservation(input: CreateReservationInput): Promise<SihotReservation> {
    await this.delay();

    if (!this.properties.has(input.propertyId)) {
      throw new Error(`Unknown property: ${input.propertyId}`);
    }

    const guest = this.upsertGuest(input.primaryGuest);

    const reservation: SihotReservation = {
      reservationId: randomUUID(),
      confirmationNumber: this.generateConfirmationNumber(),
      propertyId: input.propertyId,
      roomNumber: input.roomNumber,
      status: input.status ?? 'reserved',
      arrivalDate: input.arrivalDate,
      departureDate: input.departureDate,
      primaryGuestId: guest.guestId,
      adults: input.adults ?? 2,
      children: input.children ?? 0,
      rateCode: input.rateCode,
      travelAgent: input.travelAgent,
      balance: 0,
      notes: input.notes,
      folio: [],
    };

    this.reservations.set(reservation.reservationId, reservation);
    return reservation;
  }

  public async updateReservation(
    reservationId: string,
    input: UpdateReservationInput
  ): Promise<SihotReservation | undefined> {
    await this.delay();

    const current = this.reservations.get(reservationId);
    if (!current) {
      return undefined;
    }

    let primaryGuestId = current.primaryGuestId;
    if (input.primaryGuest) {
      const updatedGuest = this.upsertGuest(
        {
          guestId: current.primaryGuestId,
          ...input.primaryGuest,
        },
        this.guests.get(current.primaryGuestId)
      );
      primaryGuestId = updatedGuest.guestId;
    }

    const next: SihotReservation = {
      ...current,
      ...input,
      primaryGuestId,
    };

    this.reservations.set(reservationId, next);
    return next;
  }

  public async checkInReservation(reservationId: string): Promise<SihotReservation | undefined> {
    await this.delay();
    return this.updateStatus(reservationId, 'checked_in');
  }

  public async checkOutReservation(reservationId: string): Promise<SihotReservation | undefined> {
    await this.delay();
    return this.updateStatus(reservationId, 'checked_out');
  }

  public async cancelReservation(reservationId: string): Promise<SihotReservation | undefined> {
    await this.delay();
    return this.updateStatus(reservationId, 'cancelled');
  }

  public async getFolio(reservationId: string): Promise<SihotFolioEntry[] | undefined> {
    await this.delay();
    const reservation = this.reservations.get(reservationId);
    return reservation?.folio ?? undefined;
  }

  public async addCharge(
    reservationId: string,
    charge: ChargeInput
  ): Promise<SihotReservation | undefined> {
    await this.delay();
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      return undefined;
    }

    const entry: SihotFolioEntry = {
      id: randomUUID(),
      date: charge.date ?? new Date().toISOString(),
      description: charge.description,
      amount: charge.amount,
      type: charge.type ?? 'charge',
      reference: charge.reference,
    };

    const balanceDelta = entry.type === 'payment' ? -entry.amount : entry.amount;

    const updated: SihotReservation = {
      ...reservation,
      balance: Math.round((reservation.balance + balanceDelta) * 100) / 100,
      folio: [...reservation.folio, entry],
    };

    this.reservations.set(reservationId, updated);
    return updated;
  }

  public async listGuests(): Promise<SihotGuest[]> {
    await this.delay();
    return Array.from(this.guests.values());
  }

  public async getGuest(guestId: string): Promise<SihotGuest | undefined> {
    await this.delay();
    return this.guests.get(guestId);
  }

  public async findGuestByEmail(email: string): Promise<SihotGuest | undefined> {
    await this.delay();
    const normalized = email.trim().toLowerCase();
    for (const guest of this.guests.values()) {
      if (guest.email && guest.email.toLowerCase() === normalized) {
        return guest;
      }
    }
    return undefined;
  }

  public async getReservationsByGuest(guestId: string): Promise<SihotReservation[]> {
    await this.delay();
    return Array.from(this.reservations.values()).filter(
      (reservation) => reservation.primaryGuestId === guestId
    );
  }

  public async reset(seed?: SeedData): Promise<void> {
    this.properties.clear();
    this.guests.clear();
    this.reservations.clear();

    const data = seed ?? this.buildDefaultSeed();

    data.properties?.forEach((property) => {
      this.properties.set(property.propertyId, { ...property });
    });

    data.guests?.forEach((guest) => {
      this.guests.set(guest.guestId, { ...guest });
    });

    data.reservations?.forEach((reservation) => {
      this.reservations.set(reservation.reservationId, {
        ...reservation,
        folio: reservation.folio.map((entry) => ({ ...entry })),
      });
    });
  }

  public setLatency(latencyMs: number): void {
    this.latencyMs = Math.max(0, latencyMs);
  }

  private async delay(): Promise<void> {
    if (!this.latencyMs) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }

  private upsertGuest(
    input: GuestCreateInput | GuestUpdateInput,
    fallback?: SihotGuest
  ): SihotGuest {
    if (input.guestId && this.guests.has(input.guestId)) {
      const current = this.guests.get(input.guestId)!;
      const updated: SihotGuest = {
        ...current,
        ...input,
        guestId: current.guestId,
        preferences: input.preferences ?? current.preferences,
        firstName: input.firstName ?? current.firstName,
        lastName: input.lastName ?? current.lastName,
      };
      this.guests.set(current.guestId, updated);
      return updated;
    }

    const prototype = fallback ?? undefined;
    const firstName = (input as GuestCreateInput).firstName ?? prototype?.firstName;
    const lastName = (input as GuestCreateInput).lastName ?? prototype?.lastName;

    if (!firstName || !lastName) {
      throw new Error('Guest firstName and lastName are required.');
    }

    const guestId = input.guestId ?? randomUUID();
    const guest: SihotGuest = {
      guestId,
      firstName,
      lastName,
      email: input.email ?? prototype?.email,
      phone: input.phone ?? prototype?.phone,
      loyaltyLevel: input.loyaltyLevel ?? prototype?.loyaltyLevel,
      language: input.language ?? prototype?.language,
      notes: input.notes ?? prototype?.notes,
      preferences: input.preferences ?? prototype?.preferences ?? [],
    };

    this.guests.set(guestId, guest);
    return guest;
  }

  private updateStatus(
    reservationId: string,
    status: ReservationStatus
  ): SihotReservation | undefined {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      return undefined;
    }

    const updated: SihotReservation = { ...reservation, status };
    this.reservations.set(reservationId, updated);
    return updated;
  }

  private generateConfirmationNumber(): string {
    const seed = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    return `R${seed}`;
  }

  private buildDefaultSeed(): SeedData {
    const properties: SihotProperty[] = [
      {
        propertyId: 'ROI-BER',
        name: '4rest Berlin',
        timezone: 'Europe/Berlin',
        currency: 'EUR',
        address: {
          line1: 'Alexanderstraße 7',
          city: 'Berlin',
          postalCode: '10178',
          country: 'DE',
        },
        contactEmail: 'frontdesk.berlin@example.com',
        phone: '+49 30 1234 5670',
      },
      {
        propertyId: 'ROI-VIE',
        name: '4rest Vienna',
        timezone: 'Europe/Vienna',
        currency: 'EUR',
        address: {
          line1: 'Schubertring 10-12',
          city: 'Vienna',
          postalCode: '1010',
          country: 'AT',
        },
        contactEmail: 'hello.vienna@example.com',
        phone: '+43 1 8901 2345',
      },
    ];

    const guests: SihotGuest[] = [
      {
        guestId: 'GUEST-1',
        firstName: 'Amelia',
        lastName: 'Hartmann',
        email: 'amelia.hartmann@example.com',
        phone: '+49 171 555 1234',
        loyaltyLevel: 'gold',
        language: 'de',
        preferences: ['high floor', 'vegan breakfast'],
      },
      {
        guestId: 'GUEST-2',
        firstName: 'Mateo',
        lastName: 'Silva',
        email: 'mateo.silva@example.com',
        phone: '+43 660 987 6543',
        loyaltyLevel: 'silver',
        language: 'en',
        preferences: ['king bed'],
      },
      {
        guestId: 'GUEST-3',
        firstName: 'Noor',
        lastName: 'Al-Farsi',
        email: 'noor.alfarsi@example.com',
        phone: '+49 152 345 6789',
        loyaltyLevel: 'bronze',
        language: 'en',
      },
    ];

    const reservations: SihotReservation[] = [
      {
        reservationId: 'RES-1',
        confirmationNumber: 'R820145',
        propertyId: 'ROI-BER',
        roomNumber: '504',
        status: 'reserved',
        arrivalDate: new Date().toISOString(),
        departureDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        primaryGuestId: 'GUEST-1',
        adults: 1,
        children: 0,
        rateCode: 'BAR',
        travelAgent: 'Direct',
        balance: 240,
        notes: 'Guest arrives late, prepare welcome amenity.',
        folio: [
          {
            id: 'FOLIO-1',
            date: new Date().toISOString(),
            description: 'Room Charge - Night 1',
            amount: 120,
            type: 'charge',
          },
          {
            id: 'FOLIO-2',
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            description: 'Room Charge - Night 2',
            amount: 120,
            type: 'charge',
          },
        ],
      },
      {
        reservationId: 'RES-2',
        confirmationNumber: 'R901552',
        propertyId: 'ROI-BER',
        roomNumber: '215',
        status: 'checked_in',
        arrivalDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        departureDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        primaryGuestId: 'GUEST-3',
        adults: 2,
        children: 0,
        rateCode: 'WEEKEND',
        balance: 80,
        folio: [
          {
            id: 'FOLIO-3',
            date: new Date().toISOString(),
            description: 'Bar Charge',
            amount: 30,
            type: 'charge',
          },
          {
            id: 'FOLIO-4',
            date: new Date().toISOString(),
            description: 'Spa Treatment',
            amount: 50,
            type: 'charge',
          },
        ],
      },
      {
        reservationId: 'RES-3',
        confirmationNumber: 'R745221',
        propertyId: 'ROI-VIE',
        roomNumber: '802',
        status: 'checked_out',
        arrivalDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        departureDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        primaryGuestId: 'GUEST-2',
        adults: 1,
        children: 1,
        rateCode: 'FAMILY',
        balance: 0,
        folio: [
          {
            id: 'FOLIO-5',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Room Charge - Night 1',
            amount: 150,
            type: 'charge',
          },
          {
            id: 'FOLIO-6',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Room Charge - Night 2',
            amount: 150,
            type: 'charge',
          },
          {
            id: 'FOLIO-7',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'City Tax',
            amount: 15,
            type: 'charge',
          },
          {
            id: 'FOLIO-8',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Credit Card Payment',
            amount: 315,
            type: 'payment',
          },
        ],
      },
    ];

    return { properties, guests, reservations };
  }
}

export const sihotMock = new SihotMockService();

