import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

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
      },
      register: async (email: string, password: string, name: string, role: UserRole = 'guest') => {
        const data = await api.register(email, password, name, role);
        if (!data || !data.token || !data.user) {
          throw new Error('Registration failed');
        }
        set({ user: data.user, token: data.token, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
      setUser: (user: User) => set({ user }),
      setToken: (token: string) => set({ token, isAuthenticated: true }),
      incrementPoints: (delta: number) =>
        set((state) => {
          if (!state.user) return state;
          return { user: { ...state.user, points: Math.max(0, (state.user.points || 0) + (delta || 0)) } };
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
