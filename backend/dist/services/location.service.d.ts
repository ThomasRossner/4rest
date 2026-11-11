export interface Location {
    id: string;
    name: string;
    description: string | null;
    is_online: boolean;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    active: boolean;
    category?: string | null;
    category_description?: string | null;
    image_url?: string | null;
    created_at?: string;
    updated_at?: string;
    name_i18n?: Record<string, string>;
    description_i18n?: Record<string, string>;
    address_i18n?: Record<string, string>;
    category_description_i18n?: Record<string, string>;
}
interface LocationInput {
    name: string;
    description?: string | null;
    name_i18n?: Record<string, string>;
    description_i18n?: Record<string, string>;
    address_i18n?: Record<string, string>;
    category_description_i18n?: Record<string, string>;
    is_online: boolean;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    active?: boolean;
    category?: string | null;
    category_description?: string | null;
    image_url?: string | null;
}
interface LocationUpdateInput {
    name?: string;
    description?: string | null;
    name_i18n?: Record<string, string> | null;
    description_i18n?: Record<string, string> | null;
    address_i18n?: Record<string, string> | null;
    category_description_i18n?: Record<string, string> | null;
    is_online?: boolean;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    category?: string | null;
    category_description?: string | null;
    image_url?: string | null;
}
export declare function getLocations(includeInactive?: boolean, preferredLanguage?: string): Promise<Location[]>;
export declare function getLocationById(id: string, preferredLanguage?: string): Promise<Location | null>;
export declare function createLocation(data: LocationInput & {
    active?: boolean;
}): Promise<Location>;
export declare function updateLocation(id: string, data: LocationUpdateInput & {
    active?: boolean;
}): Promise<Location>;
export declare function setLocationsActiveState(ids: string[], active: boolean): Promise<void>;
export declare function bulkDeleteLocations(ids: string[]): Promise<void>;
export declare function deleteLocation(id: string): Promise<void>;
export {};
//# sourceMappingURL=location.service.d.ts.map