export const USER_ROLES = ['guest', 'employee', 'stakeholder', 'administrator'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_TYPES = ['explorer', 'guest_in_house', 'observer', 'advocate'] as const;
export type UserType = (typeof USER_TYPES)[number];

export const HOTEL_IDS = ['ROI-BER', 'ROI-VIE'] as const;
export type HotelId = (typeof HOTEL_IDS)[number];
