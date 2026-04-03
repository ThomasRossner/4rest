import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';
import { USER_ROLES, USER_TYPES, UserRole, UserType } from '../constants/enums';
import { resolveApiBaseUrl } from '../utils/resolveApiBaseUrl';

export type { UserRole, UserType } from '../constants/enums';

const WS_RECONNECT_DELAY = 5000;
let sihotSocket: WebSocket | null = null;
let reconnectTimer: number | null = null;

function deriveWebSocketUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicit) {
    return explicit;
  }

  const apiUrl = resolveApiBaseUrl();
  if (/^https?:\/\//i.test(apiUrl)) {
    try {
      const url = new URL(apiUrl);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.pathname = '/ws';
      url.search = '';
      return url.toString();
    } catch (error) {
      console.warn('[SIHOT] Failed to derive WebSocket URL from API base URL:', error);
    }
  }

  // Relatives /api (Vite-Proxy): WebSocket direkt auf Backend-Port
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = import.meta.env.VITE_BACKEND_PORT || '5001';
  return `${protocol}//${host}:${port}/ws`;
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
    if (!payload || !payload.type) {
      return;
    }

    // Handle SIHOT updates
    if (payload.type === 'sihot:update') {
      // Use setTimeout to avoid circular dependency during initialization
      setTimeout(() => {
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
          role: (payload.role && USER_ROLES.includes(payload.role as UserRole)
            ? (payload.role as UserRole)
            : current.user.role),
          userType: (payload.userType && USER_TYPES.includes(payload.userType as UserType)
            ? (payload.userType as UserType)
            : current.user.userType),
          sihotGuestId: payload.payload?.guest?.guestId ?? current.user.sihotGuestId ?? null,
          sihotGuest: payload.payload?.guest ?? current.user.sihotGuest ?? null,
          sihotReservations: payload.payload?.reservations ?? current.user.sihotReservations ?? [],
        };

          return { ...current, user: updated };
        });
      }, 0);
    }
    
    // Handle task, reward, and photo task updates - dispatch custom events for components to listen to
    if (payload.type === 'task:update' || payload.type === 'reward:update' || payload.type === 'photo:task:update') {
      // Dispatch custom event that components can listen to
      window.dispatchEvent(new CustomEvent('data:update', { 
        detail: { type: payload.type } 
      }));
    }
  } catch (error) {
    console.warn('[WebSocket] Failed to process realtime message:', error);
  }
}

function startSihotSocket() {
  if (typeof window === 'undefined') {
    return;
  }
  // Use setTimeout to avoid circular dependency during initialization
  setTimeout(() => {
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
  }, 0);
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

export type PlayerProfileStatus = 'pending' | 'skipped' | 'completed';

export interface PlayerProfilePayload {
  status: PlayerProfileStatus;
  /** Aggregierte Skalenwerte pro Dyade (0–4) */
  dyadScales: number[] | null;
  /** Rohantworten pro Frage (optional, für erneutes Bearbeiten) */
  dyadAnswers?: number[] | null;
  dominantDyad: number | null;
  profileDisplayName: string | null;
  completedAt: string | null;
}

export interface User {
  id: string;
  email: string | null;
  name: string;
  role: UserRole;
  points: number;
  /** Kumulierte Wald-Kategoriepunkte (getrennt von users.points) */
  forestPoints?: {
    kommunikation: number;
    mensch: number;
    natur: number;
    ressourcen: number;
  };
  userType: UserType;
  avatar?: string;
  emailVerified?: boolean;
  preferredLanguage?: 'de' | 'en';
  sihotGuestId?: string | null;
  sihotGuest?: SihotGuestProfile | null;
  sihotReservations?: SihotReservationSummary[];
  /** Spielerprofilierung (Dyaden, Skip, Anzeigename) – aus GET /users/me */
  playerProfile?: PlayerProfilePayload;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role?: UserRole,
    userType?: UserType,
    teamRegistrationToken?: string,
    contestRegistrationToken?: string,
    preferredLanguage?: 'de' | 'en',
    acceptPrivacy?: boolean
  ) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string, user?: User | null) => void;
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
          return;
        }

        const normalizedRole: UserRole = USER_ROLES.includes(data.user.role as UserRole)
          ? (data.user.role as UserRole)
          : 'guest';
        const normalizedUserType: UserType = USER_TYPES.includes(data.user.userType as UserType)
          ? (data.user.userType as UserType)
          : 'explorer';

        useAuthStore.setState({
          token: data.token,
          user: {
            ...data.user,
            role: normalizedRole,
            userType: normalizedUserType,
          },
          isAuthenticated: true,
        });
        startSihotSocket();
        void api.refreshMe();
      },
      register: async (
        email: string,
        password: string,
        name: string,
        role: UserRole = 'guest',
        userType: UserType = 'explorer',
        teamRegistrationToken?: string,
        contestRegistrationToken?: string,
        preferredLanguage?: 'de' | 'en',
        acceptPrivacy?: boolean
      ) => {
        const data = await api.register(
          email,
          password,
          name,
          role,
          userType,
          teamRegistrationToken,
          contestRegistrationToken,
          preferredLanguage,
          acceptPrivacy
        );
        if (!data || !data.token || !data.user) {
          throw new Error('Registration failed');
        }
        const normalizedRole: UserRole = USER_ROLES.includes(data.user.role as UserRole)
          ? (data.user.role as UserRole)
          : 'guest';
        const normalizedUserType: UserType = USER_TYPES.includes(data.user.userType as UserType)
          ? (data.user.userType as UserType)
          : 'explorer';
        set({
          user: { ...data.user, role: normalizedRole, userType: normalizedUserType },
          token: data.token,
          isAuthenticated: true,
        });
        startSihotSocket();
        void api.refreshMe();
      },
      logout: () => {
        stopSihotSocket();
        set({ user: null, token: null, isAuthenticated: false });
      },
      setUser: (user: User) => {
        const normalizedRole: UserRole = USER_ROLES.includes(user.role) ? user.role : 'guest';
        const normalizedUserType: UserType = USER_TYPES.includes(user.userType) ? user.userType : 'explorer';
        set({ user: { ...user, role: normalizedRole, userType: normalizedUserType }, isAuthenticated: true });
        startSihotSocket();
      },
      setToken: (token: string, user?: User | null) => {
        if (user) {
          const normalizedRole: UserRole = USER_ROLES.includes(user.role)
            ? user.role
            : 'guest';
          const normalizedUserType: UserType = USER_TYPES.includes(user.userType)
            ? user.userType
            : 'explorer';
          useAuthStore.setState({
            token,
            user: { ...user, role: normalizedRole, userType: normalizedUserType },
            isAuthenticated: true,
          });
          startSihotSocket();
        } else {
          // Only set token, but not isAuthenticated if no user is provided
          useAuthStore.setState({ token, isAuthenticated: false });
        }
      },
      incrementPoints: (delta: number) =>
        set((state) => {
          if (!state.user) return state;
          return { user: { ...state.user, points: Math.max(0, (state.user.points || 0) + (delta || 0)) } };
        }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('[AuthStore] rehydrate error', error);
          // Clear state on error
          useAuthStore.setState({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return;
        }
        // Use setTimeout to avoid circular dependency during initialization
        setTimeout(() => {
          // Only set isAuthenticated to true if both token and user exist
          if (state?.user && state?.token) {
            const normalizedRole: UserRole = USER_ROLES.includes(state.user.role)
              ? state.user.role
              : 'guest';
            const normalizedUserType: UserType = USER_TYPES.includes(state.user.userType)
              ? state.user.userType
              : 'explorer';

            useAuthStore.setState({
              ...state,
              user: { ...state.user, role: normalizedRole, userType: normalizedUserType },
              isAuthenticated: true,
            });
            startSihotSocket();
          } else {
            // Clear invalid state if token exists but no user, or vice versa
            console.log('[AuthStore] Clearing invalid state - missing user or token');
            useAuthStore.setState({
              user: null,
              token: null,
              isAuthenticated: false,
            });
          }
        }, 0);
      },
    }
  )
);
