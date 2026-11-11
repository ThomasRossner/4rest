import { getPool } from '../database/connection.js';
import { sihot } from '../integrations/sihot.js';
// @ts-ignore -- NodeNext runtime resolves .js extension to compiled TypeScript
import { broadcastSihotUpdate } from '../ws/sihot-broadcast.js';
const DEFAULT_SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes
let syncTimer = null;
let isSyncRunning = false;
function resolveSyncInterval() {
    const raw = process.env.SIHOT_SYNC_INTERVAL_MS;
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }
    return DEFAULT_SYNC_INTERVAL;
}
async function processUserRow(pool, row) {
    try {
        if (row.role === 'administrator') {
            return;
        }
        if (row.role === 'administrator') {
            return;
        }
        const guest = await sihot.getGuest(row.sihot_guest_id);
        if (!guest) {
            await pool.query(`UPDATE users
         SET sihot_guest_data = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [row.id]);
            broadcastSihotUpdate({ userId: row.id, payload: null, role: 'guest' });
            return;
        }
        const reservations = await sihot.getReservationsByGuest(guest.guestId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hotelPropertyId = process.env.HOTEL_ID;
        const isCheckedIn = Boolean(hotelPropertyId &&
            reservations.some((reservation) => {
                if (reservation.propertyId !== hotelPropertyId) {
                    return false;
                }
                if (reservation.status !== 'checked_in') {
                    return false;
                }
                const arrivalDate = new Date(reservation.arrivalDate);
                const departureDate = new Date(reservation.departureDate);
                arrivalDate.setHours(0, 0, 0, 0);
                departureDate.setHours(0, 0, 0, 0);
                return arrivalDate <= today && today <= departureDate;
            }));
        const desiredRole = isCheckedIn ? 'guest' : 'guest';
        const payload = {
            guest: {
                guestId: guest.guestId,
                firstName: guest.firstName,
                lastName: guest.lastName,
                email: guest.email ?? null,
                phone: guest.phone ?? null,
                loyaltyLevel: guest.loyaltyLevel ?? null,
                preferences: guest.preferences ?? [],
                language: guest.language ?? null,
                notes: guest.notes ?? null,
            },
            reservations: reservations.map((reservation) => ({
                reservationId: reservation.reservationId,
                confirmationNumber: reservation.confirmationNumber,
                propertyId: reservation.propertyId,
                roomNumber: reservation.roomNumber,
                status: reservation.status,
                arrivalDate: reservation.arrivalDate,
                departureDate: reservation.departureDate,
                balance: reservation.balance,
            })),
        };
        const combinedName = `${guest.firstName} ${guest.lastName}`.trim();
        await pool.query(`UPDATE users
       SET sihot_guest_data = $1::jsonb,
           name = COALESCE($2, name),
           role = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`, [JSON.stringify(payload), combinedName || null, desiredRole, row.id]);
        broadcastSihotUpdate({ userId: row.id, payload, role: desiredRole });
    }
    catch (error) {
        console.warn('[SIHOT] Failed to refresh data for user', row.id, error);
    }
}
export async function syncSihotGuests() {
    const pool = getPool();
    const { rows } = await pool.query(`SELECT id, name, role, sihot_guest_id
     FROM users
     WHERE sihot_guest_id IS NOT NULL`);
    if (!rows.length) {
        return;
    }
    for (const row of rows) {
        await processUserRow(pool, row);
    }
}
export async function syncSihotGuestByUserId(userId) {
    const pool = getPool();
    const { rows } = await pool.query(`SELECT id, name, role, sihot_guest_id
     FROM users
     WHERE id = $1 AND sihot_guest_id IS NOT NULL`, [userId]);
    if (!rows[0]) {
        return;
    }
    await processUserRow(pool, rows[0]);
}
async function runSync() {
    if (isSyncRunning) {
        return;
    }
    isSyncRunning = true;
    try {
        await syncSihotGuests();
    }
    catch (error) {
        console.error('[SIHOT] Periodic sync failed:', error);
    }
    finally {
        isSyncRunning = false;
    }
}
export function startSihotSyncScheduler() {
    if (syncTimer) {
        return;
    }
    const interval = resolveSyncInterval();
    syncTimer = setInterval(() => {
        void runSync();
    }, interval);
    console.log(`[SIHOT] Scheduled guest data sync every ${Math.round(interval / 1000)} seconds (${interval} ms)`);
    // Perform an initial sync shortly after startup.
    setTimeout(() => {
        void runSync();
    }, 5000);
}
export function stopSihotSyncScheduler() {
    if (syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null;
    }
}
//# sourceMappingURL=sihot-sync.service.js.map