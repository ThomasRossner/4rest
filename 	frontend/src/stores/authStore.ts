import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

const WS_RECONNECT_DELAY = 5000;
let sihotSocket: WebSocket | null = null;
let reconnectTimer: number | null = null;

function deriveWebSocketUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicit) {
    return explicit;
  }

  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl) {
    try {
      const url = new URL(apiUrl, window.location.origin);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.pathname = '/ws';
      url.search = '';
      return url.toString();
    } catch (error) {
      console.warn('[SIHOT] Failed to derive WebSocket URL from VITE_API_URL:', error);
    }
  }

  return 'ws://localhost:5000/ws';
}

function scheduleReconnect() {
  if (reconnectTimer || typeof window === 'undefined') {
    return;
  }
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    startSihotSocket();
  }, WS_RECONNECT_DELAY);
}

function handleSihotMessage(event: MessageEvent) {
  if (!event.data) {
    return;
  }

  try {
    const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (!payload || payload.type !== 'sihot:update') {
      return;
    }

    const state = useAuthStore.getState();
    if (!state.user || state.user.id !== payload.userId) {
      return;
    }

    useAuthStore.setState((current) => {
      if (!current.user) {
        return current;
      }

      const updated: User = {
        ...current.user,
        role: payload.role ?? current.user.role,
        sihotGuestId: payload.payload?.guest?.guestId ?? current.user.sihotGuestId ?? null,
        sihotGuest: payload.payload?.guest ?? current.user.sihotGuest ?? null,
        sihotReservations: payload.payload?.reservations ?? current.user.sihotReservations ?? [],
      };

      return { ...current, user: updated };
    });
  } catch (error) {
    console.warn('[SIHOT] Failed to process realtime message:', error);
  }
}

function startSihotSocket() {
  if (typeof window === 'undefined') {
    return;
  }
  if (sihotSocket || !useAuthStore.getState().token) {
    return;
  }

  const url = deriveWebSocketUrl();

  try {
    sihotSocket = new WebSocket(url);
  } catch (error) {
    console.warn('[SIHOT] Failed to establish WebSocket connection:', error);
    scheduleReconnect();
    return;
  }

  sihotSocket.onopen = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  sihotSocket.onmessage = handleSihotMessage;

  sihotSocket.onerror = (error) => {
    console.warn('[SIHOT] WebSocket error:', error);
  };

  sihotSocket.onclose = () => {
    sihotSocket = null;
    scheduleReconnect();
  };
}

function stopSihotSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (sihotSocket) {
    try {
      sihotSocket.close();
    } catch (error) {
      console.warn('[SIHOT] Error while closing WebSocket:', error);
    }
    sihotSocket = null;
  }
}

export type UserRole = 'guest' | 'employee' | 'stakeholder';

export interface SihotGuestProfile {
  guestId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  loyaltyLevel: string | null;
  preferences: string[];
  language: string | null;
  notes: string | null;
}

export interface SihotReservationSummary {
  reservationId: string;
  confirmationNumber: string;
  propertyId: string;
  roomNumber: string;
  status: string;
  arrivalDate: string;
  departureDate: string;
  balance: number;
}

export interface User {
  id: string;
  email: string | null;
  name: string;
  role: UserRole;
  points: number;
  avatar?: string;
  sihotGuestId?: string | null;
  sihotGuest?: SihotGuestProfile | null;
  sihotReservations?: SihotReservationSummary[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  incrementPoints: (delta: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        const data = await api.login(email, password);
        if (!data || !data.token || !data.user) {
          throw new Error('Invalid credentials');
        }
        set({ user: data.user, token: data.token, isAuthenticated: true });
        startSihotSocket();
      },
      register: async (email: string, password: string, name: string, role: UserRole = 'stakeholder') => {
        const data = await api.register(email, password, name, role);
        if (!data || !data.token || !data.user) {
          throw new Error('Registration failed');
        }
        set({ user: data.user, token: data.token, isAuthenticated: true });
        startSihotSocket();
      },
      logout: () => {
        stopSihotSocket();
        set({ user: null, token: null, isAuthenticated: false });
      },
      setUser: (user: User) => set({ user }),
      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
        startSihotSocket();
      },
      incrementPoints: (delta: number) =>
        set((state) => {
          if (!state.user) return state;
          return { user: { ...state.user, points: Math.max(0, (state.user.points || 0) + (delta || 0)) } };
        }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          startSihotSocket();
        }
      },
    }
  )
);
