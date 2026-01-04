import axios from 'axios';
import { sihotMock, } from './sihot-mock.js';
function resolveConfig() {
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
    config;
    client;
    mock;
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
    isMock() {
        return this.config.useMock || !this.client;
    }
    async listProperties() {
        if (this.isMock()) {
            return this.mock.listProperties();
        }
        const response = await this.client.get('/properties');
        return response.data;
    }
    async listReservations(filters = {}) {
        if (this.isMock()) {
            return this.mock.listReservations(filters);
        }
        const response = await this.client.get('/reservations', {
            params: filters,
        });
        return response.data;
    }
    async getReservation(reservationId) {
        if (this.isMock()) {
            return this.mock.getReservation(reservationId);
        }
        const response = await this.client.get(`/reservations/${reservationId}`);
        return response.data;
    }
    async getFolio(reservationId) {
        if (this.isMock()) {
            return this.mock.getFolio(reservationId);
        }
        const response = await this.client.get(`/reservations/${reservationId}/folio`);
        return response.data;
    }
    async createReservation(input) {
        if (this.isMock()) {
            return this.mock.createReservation(input);
        }
        const response = await this.client.post('/reservations', input);
        return response.data;
    }
    async updateReservation(reservationId, input) {
        if (this.isMock()) {
            return this.mock.updateReservation(reservationId, input);
        }
        const response = await this.client.patch(`/reservations/${reservationId}`, input);
        return response.data;
    }
    async checkInReservation(reservationId) {
        if (this.isMock()) {
            return this.mock.checkInReservation(reservationId);
        }
        const response = await this.client.post(`/reservations/${reservationId}/check-in`);
        return response.data;
    }
    async checkOutReservation(reservationId) {
        if (this.isMock()) {
            return this.mock.checkOutReservation(reservationId);
        }
        const response = await this.client.post(`/reservations/${reservationId}/check-out`);
        return response.data;
    }
    async cancelReservation(reservationId) {
        if (this.isMock()) {
            return this.mock.cancelReservation(reservationId);
        }
        const response = await this.client.post(`/reservations/${reservationId}/cancel`);
        return response.data;
    }
    async addCharge(reservationId, charge) {
        if (this.isMock()) {
            return this.mock.addCharge(reservationId, charge);
        }
        const response = await this.client.post(`/reservations/${reservationId}/charges`, charge);
        return response.data;
    }
    async listGuests() {
        if (this.isMock()) {
            return this.mock.listGuests();
        }
        const response = await this.client.get('/guests');
        return response.data;
    }
    async getGuest(guestId) {
        if (this.isMock()) {
            return this.mock.getGuest(guestId);
        }
        const response = await this.client.get(`/guests/${guestId}`);
        return response.data;
    }
    async findGuestByEmail(email) {
        if (this.isMock()) {
            return this.mock.findGuestByEmail(email);
        }
        const response = await this.client.get('/guests/search', {
            params: { email },
        });
        return response.data || undefined;
    }
    async getReservationsByGuest(guestId) {
        if (this.isMock()) {
            return this.mock.getReservationsByGuest(guestId);
        }
        const response = await this.client.get(`/guests/${guestId}/reservations`);
        return response.data;
    }
    async reset(seed) {
        if (this.isMock()) {
            return this.mock.reset(seed);
        }
        await this.client.post('/reset', seed ?? {});
    }
    setLatency(latencyMs) {
        if (this.isMock()) {
            this.mock.setLatency(latencyMs);
            return;
        }
        // No-op for real integration. Could be used to call a test endpoint if available.
    }
}
export const sihot = new SihotIntegration();
//# sourceMappingURL=sihot.js.map