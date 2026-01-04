import axios, { AxiosInstance } from 'axios';
import {
  SihotGuest,
  SihotProperty,
  SihotReservation,
  ReservationFilters,
  CreateReservationInput,
  UpdateReservationInput,
  ChargeInput,
  SihotFolioEntry,
  SihotMockService,
  sihotMock,
} from './sihot-mock.js';

interface SihotConfig {
  apiUrl?: string;
  apiKey?: string;
  useMock: boolean;
  timeoutMs: number;
}

function resolveConfig(): SihotConfig {
  const apiUrl = process.env.SIHOT_API_URL;
  const apiKey = process.env.SIHOT_API_KEY;
  const timeoutMs = Number.parseInt(process.env.SIHOT_TIMEOUT_MS || '15000', 10);
  const forceMock = process.env.SIHOT_USE_MOCK === 'true';
  const forceReal = process.env.SIHOT_USE_MOCK === 'false';

  const hasCredentials = Boolean(apiUrl && apiKey);
  const useMock = forceMock || (!forceReal && !hasCredentials);

  if (!useMock && !hasCredentials) {
    console.warn('SIHOT_USE_MOCK is set to false but SIHOT_API_URL/SIHOT_API_KEY are missing. Falling back to mock.');
  }

  return {
    apiUrl,
    apiKey,
    useMock: useMock || !hasCredentials,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 15000,
  };
}

class SihotIntegration {
  private config: SihotConfig;
  private client?: AxiosInstance;
  private mock: SihotMockService;

  constructor() {
    this.config = resolveConfig();
    this.mock = sihotMock;

    if (this.config.useMock) {
      console.log('[SIHOT] Using in-memory mock service');
      return;
    }

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: this.config.timeoutMs,
    });
  }

  public isMock(): boolean {
    return this.config.useMock || !this.client;
  }

  public async listProperties(): Promise<SihotProperty[]> {
    if (this.isMock()) {
      return this.mock.listProperties();
    }
    const response = await this.client!.get<SihotProperty[]>('/properties');
    return response.data;
  }

  public async listReservations(filters: ReservationFilters = {}): Promise<SihotReservation[]> {
    if (this.isMock()) {
      return this.mock.listReservations(filters);
    }
    const response = await this.client!.get<SihotReservation[]>('/reservations', {
      params: filters,
    });
    return response.data;
  }

  public async getReservation(reservationId: string): Promise<SihotReservation | undefined> {
    if (this.isMock()) {
      return this.mock.getReservation(reservationId);
    }
    const response = await this.client!.get<SihotReservation>(`/reservations/${reservationId}`);
    return response.data;
  }

  public async getFolio(reservationId: string): Promise<SihotFolioEntry[] | undefined> {
    if (this.isMock()) {
      return this.mock.getFolio(reservationId);
    }
    const response = await this.client!.get<SihotFolioEntry[]>(`/reservations/${reservationId}/folio`);
    return response.data;
  }

  public async createReservation(input: CreateReservationInput): Promise<SihotReservation> {
    if (this.isMock()) {
      return this.mock.createReservation(input);
    }
    const response = await this.client!.post<SihotReservation>('/reservations', input);
    return response.data;
  }

  public async updateReservation(
    reservationId: string,
    input: UpdateReservationInput
  ): Promise<SihotReservation | undefined> {
    if (this.isMock()) {
      return this.mock.updateReservation(reservationId, input);
    }
    const response = await this.client!.patch<SihotReservation>(`/reservations/${reservationId}`, input);
    return response.data;
  }

  public async checkInReservation(reservationId: string): Promise<SihotReservation | undefined> {
    if (this.isMock()) {
      return this.mock.checkInReservation(reservationId);
    }
    const response = await this.client!.post<SihotReservation>(`/reservations/${reservationId}/check-in`);
    return response.data;
  }

  public async checkOutReservation(reservationId: string): Promise<SihotReservation | undefined> {
    if (this.isMock()) {
      return this.mock.checkOutReservation(reservationId);
    }
    const response = await this.client!.post<SihotReservation>(`/reservations/${reservationId}/check-out`);
    return response.data;
  }

  public async cancelReservation(reservationId: string): Promise<SihotReservation | undefined> {
    if (this.isMock()) {
      return this.mock.cancelReservation(reservationId);
    }
    const response = await this.client!.post<SihotReservation>(`/reservations/${reservationId}/cancel`);
    return response.data;
  }

  public async addCharge(
    reservationId: string,
    charge: ChargeInput
  ): Promise<SihotReservation | undefined> {
    if (this.isMock()) {
      return this.mock.addCharge(reservationId, charge);
    }
    const response = await this.client!.post<SihotReservation>(
      `/reservations/${reservationId}/charges`,
      charge
    );
    return response.data;
  }

  public async listGuests(): Promise<SihotGuest[]> {
    if (this.isMock()) {
      return this.mock.listGuests();
    }
    const response = await this.client!.get<SihotGuest[]>('/guests');
    return response.data;
  }

  public async getGuest(guestId: string): Promise<SihotGuest | undefined> {
    if (this.isMock()) {
      return this.mock.getGuest(guestId);
    }
    const response = await this.client!.get<SihotGuest>(`/guests/${guestId}`);
    return response.data;
  }

  public async findGuestByEmail(email: string): Promise<SihotGuest | undefined> {
    if (this.isMock()) {
      return this.mock.findGuestByEmail(email);
    }
    const response = await this.client!.get<SihotGuest | null>('/guests/search', {
      params: { email },
    });
    return response.data || undefined;
  }

  public async getReservationsByGuest(guestId: string): Promise<SihotReservation[]> {
    if (this.isMock()) {
      return this.mock.getReservationsByGuest(guestId);
    }
    const response = await this.client!.get<SihotReservation[]>(`/guests/${guestId}/reservations`);
    return response.data;
  }

  public async reset(seed?: Parameters<SihotMockService['reset']>[0]): Promise<void> {
    if (this.isMock()) {
      return this.mock.reset(seed);
    }
    await this.client!.post('/reset', seed ?? {});
  }

  public setLatency(latencyMs: number): void {
    if (this.isMock()) {
      this.mock.setLatency(latencyMs);
      return;
    }
    // No-op for real integration. Could be used to call a test endpoint if available.
  }
}

export const sihot = new SihotIntegration();

export type { SihotGuest, SihotProperty, SihotReservation };

