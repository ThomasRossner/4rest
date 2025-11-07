import { Router } from 'express';
import { sihotMock } from '../integrations/sihot-mock.js';

const router = Router();

router.get('/properties', async (_req, res) => {
  try {
    const properties = await sihotMock.listProperties();
    res.json({ properties });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/guests', async (_req, res) => {
  try {
    const guests = await sihotMock.listGuests();
    res.json({ guests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/guests/:guestId', async (req, res) => {
  try {
    const guest = await sihotMock.getGuest(req.params.guestId);
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    res.json(guest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reservations', async (req, res) => {
  try {
    const reservations = await sihotMock.listReservations({
      propertyId: req.query.propertyId as string | undefined,
      status: req.query.status as any,
      arrivalDateFrom: req.query.arrivalDateFrom as string | undefined,
      arrivalDateTo: req.query.arrivalDateTo as string | undefined,
      departureDateFrom: req.query.departureDateFrom as string | undefined,
      departureDateTo: req.query.departureDateTo as string | undefined,
      search: req.query.search as string | undefined,
    });
    res.json({ reservations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reservations/:reservationId', async (req, res) => {
  try {
    const reservation = await sihotMock.getReservation(req.params.reservationId);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reservations/:reservationId/folio', async (req, res) => {
  try {
    const folio = await sihotMock.getFolio(req.params.reservationId);
    if (!folio) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json({ folio });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reservations', async (req, res) => {
  try {
    const reservation = await sihotMock.createReservation(req.body);
    res.status(201).json(reservation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/reservations/:reservationId', async (req, res) => {
  try {
    const updated = await sihotMock.updateReservation(req.params.reservationId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/reservations/:reservationId/check-in', async (req, res) => {
  try {
    const updated = await sihotMock.checkInReservation(req.params.reservationId);
    if (!updated) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reservations/:reservationId/check-out', async (req, res) => {
  try {
    const updated = await sihotMock.checkOutReservation(req.params.reservationId);
    if (!updated) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reservations/:reservationId/cancel', async (req, res) => {
  try {
    const updated = await sihotMock.cancelReservation(req.params.reservationId);
    if (!updated) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reservations/:reservationId/charges', async (req, res) => {
  try {
    const updated = await sihotMock.addCharge(req.params.reservationId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/reset', async (req, res) => {
  try {
    await sihotMock.reset(req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/latency', (req, res) => {
  const latency = Number(req.body?.latencyMs ?? req.body?.latency);
  if (Number.isNaN(latency)) {
    return res.status(400).json({ error: 'latencyMs must be a number' });
  }

  sihotMock.setLatency(latency);
  res.json({ success: true, latencyMs: latency });
});

export default router;

