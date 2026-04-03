import { UserRole, UserType } from '../constants/enums.js';
export interface User {
    id: string;
    email: string | null;
    password_hash: string | null;
    name: string;
    role: UserRole;
    points: number;
    user_type: UserType;
    avatar_url?: string | null;
    oauth_provider?: string | null;
    oauth_id?: string | null;
    oauth_email?: string | null;
    sihot_guest_id?: string | null;
    sihot_guest_data?: Record<string, any> | null;
    preferred_language?: string | null;
    email_verified?: boolean;
    email_verification_token?: string | null;
    email_verification_expires?: Date | null;
    password_reset_token?: string | null;
    password_reset_expires?: Date | null;
    email_notifications_enabled?: boolean;
    deleted_at?: Date | null;
    active?: boolean;
}
export interface CreateUserData {
    email?: string | null;
    password_hash?: string | null;
    name: string;
    role?: UserRole;
    user_type?: UserType;
    points?: number;
    avatar_url?: string | null;
    oauth_provider?: string | null;
    oauth_id?: string | null;
    oauth_email?: string | null;
    sihot_guest_id?: string | null;
    sihot_guest_data?: Record<string, any> | null;
    preferred_language?: string | null;
}
export declare function createUser(data: CreateUserData): Promise<User>;
export declare function getUserByEmail(email: string): Promise<User | null>;
export declare function getUserById(id: string): Promise<User | null>;
export declare function getUserByOAuth(provider: string, oauthId: string): Promise<User | null>;
export declare function createOrUpdateOAuthUser(data: {
    userId?: string;
    oauthProvider: string;
    oauthId: string;
    email?: string | null;
    oauthEmail?: string | null;
    name: string;
    role?: UserRole;
    userType?: UserType;
    avatarUrl?: string | null;
}): Promise<User>;
export declare function getUserProgressService(userId: string): Promise<{
    tasksCompleted: number;
    treesPlanted: number;
    totalPoints: number;
    co2Saved: number;
}>;
export declare function getPreferredLanguage(userId: string): Promise<'de' | 'en' | null>;
export type PlayerProfileStatus = 'pending' | 'skipped' | 'completed';
/** @deprecated Nutze computeDominantDyadFromScales aus onboarding-config.service */
export declare function computeDominantDyad(s1: number, s2: number, s3: number, s4: number): 1 | 2 | 3 | 4;
export declare function getMeService(userId: string): Promise<{
    playerProfile: {
        status: PlayerProfileStatus;
        dyadScales: number[];
        dyadAnswers: number[];
        dominantDyad: number;
        profileDisplayName: string;
        completedAt: string;
    };
    id: any;
    email: any;
    name: any;
    role: any;
    userType: any;
    points: any;
    forestPoints: {
        kommunikation: number;
        mensch: number;
        natur: number;
        ressourcen: number;
    };
    avatar: any;
    sihotGuestId: any;
    sihotGuest: any;
    sihotReservations: any;
    preferredLanguage: string;
}>;
export interface UpdateMyPlayerProfileBody {
    status?: 'skipped' | 'completed';
    /** Rohantworten 0–4, Länge = Dyaden × Fragen pro Dyade (empfohlen) */
    dyadAnswers?: number[];
    /** Aggregierte Werte pro Dyade (Legacy / einfache Clients) */
    dyadScales?: number[];
    /** Optionaler Anzeigename (Wald/Profil); leer wird als null gespeichert */
    profileDisplayName?: string | null;
}
export declare function updatePlayerProfileForMeService(userId: string, body: UpdateMyPlayerProfileBody): Promise<{
    playerProfile: {
        status: PlayerProfileStatus;
        dyadScales: number[];
        dyadAnswers: number[];
        dominantDyad: number;
        profileDisplayName: string;
        completedAt: string;
    };
    id: any;
    email: any;
    name: any;
    role: any;
    userType: any;
    points: any;
    forestPoints: {
        kommunikation: number;
        mensch: number;
        natur: number;
        ressourcen: number;
    };
    avatar: any;
    sihotGuestId: any;
    sihotGuest: any;
    sihotReservations: any;
    preferredLanguage: string;
}>;
export declare function getUserProfileService(userId: string): Promise<{
    id: any;
    email: any;
    name: any;
    role: any;
    userType: any;
    points: any;
    avatar_url: any;
    sihotGuestId: any;
    sihotGuest: any;
    sihotReservations: any;
    preferredLanguage: string;
}>;
export declare function updateUserProfileService(userId: string, data: Partial<User>): Promise<any>;
export declare function setUserPasswordService(userId: string, password: string): Promise<void>;
export declare function updateUserPassword(userId: string, passwordHash: string): Promise<void>;
/**
 * Delete user_tasks entries for a user (oldest first)
 */
export declare function deleteUserTasks(userId: string, count: number): Promise<number>;
/**
 * Adjust user points directly
 */
export declare function adjustUserPoints(userId: string, pointsDelta: number): Promise<number>;
export interface ListUsersFilters {
    role?: UserRole;
    active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}
export interface UserListItem {
    id: string;
    email: string | null;
    name: string;
    role: UserRole;
    user_type: UserType;
    points: number;
    active: boolean;
    created_at: Date;
    deleted_at: Date | null;
}
export declare function listUsersService(filters?: ListUsersFilters): Promise<{
    users: UserListItem[];
    total: number;
}>;
export interface UserDetails extends User {
    statistics?: {
        tasksCompleted: number;
        treesPlanted: number;
        totalPoints: number;
        co2Saved: number;
        rewardsRedeemed: number;
        firstTaskDate: Date | null;
        lastTaskDate: Date | null;
    };
}
export declare function getUserDetailsService(userId: string): Promise<UserDetails | null>;
export declare function updateUserRoleService(userId: string, role: UserRole, adminUserId: string): Promise<User>;
export declare function updateUserPointsService(userId: string, points: number): Promise<User>;
export declare function toggleUserActiveService(userId: string, adminUserId: string): Promise<User>;
export declare function resetUserPasswordService(userId: string): Promise<{
    message: string;
}>;
export declare function deleteUserService(userId: string, adminUserId: string, hardDelete?: boolean): Promise<void>;
/**
 * Ruft den zeitlichen Verlauf von Punkten, Bäumen und CO2 für einen Benutzer ab
 */
export declare function createUserByAdminService(email: string, role: UserRole, name?: string): Promise<User>;
/**
 * Täglicher Verlauf: ein Eintrag pro Kalendertag von Registrierung bis heute.
 * Punkte sind kumulativ (Summe aller bis einschließlich dieses Tages erhaltenen Punkte),
 * aufgeteilt nach Aufgaben-Kategorie (Wald-Kategorien + Sonstige).
 */
export declare function getUserTimelineService(userId: string, _days?: number): Promise<Array<{
    date: string;
    cumulativeByCategory: {
        kommunikation: number;
        mensch: number;
        natur: number;
        ressourcen: number;
        sonstige: number;
    };
    totalCumulative: number;
}>>;
export declare function getUserStatisticsService(userId: string): Promise<any>;
//# sourceMappingURL=user.service.d.ts.map