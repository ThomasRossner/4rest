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
    created_at?: string;
    updated_at?: string;
}
interface LocationInput {
    name: string;
    description?: string | null;
    is_online: boolean;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    active?: boolean;
    category?: string | null;
    category_description?: string | null;
}
interface LocationUpdateInput {
    name?: string;
    description?: string | null;
    is_online?: boolean;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    category?: string | null;
    category_description?: string | null;
}
export declare function getLocations(includeInactive?: boolean): Promise<Location[]>;
export declare function getLocationById(id: string): Promise<Location | null>;
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