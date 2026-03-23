/**
 * Google Calendar API routes for booking walkthrough sessions.
 */

import { Router } from 'express';
import { getAvailability, createBooking } from '../services/google-calendar.js';
import { sendBookingConfirmation } from '../services/booking-email.js';

export const calendarRouter = Router();

// Uses the shared Google Calendar for availability and bookings
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'experienceattdai@gmail.com';

/** Get available time slots for a date range */
calendarRouter.get('/availability', async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    res.status(400).json({ success: false, error: 'Missing start and end query params' });
    return;
  }

  const result = await getAvailability(CALENDAR_ID, start as string, end as string);
  if (result.success) {
    res.json({ success: true, data: { busySlots: result.busySlots } });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

/** Create a booking */
calendarRouter.post('/book', async (req, res) => {
  const { date, time, email, firstName, company, role, context } = req.body;

  if (!date || !time || !email) {
    res.status(400).json({ success: false, error: 'Missing required fields: date, time, email' });
    return;
  }

  const result = await createBooking(CALENDAR_ID, {
    date, time, email, firstName, company, role, context,
  });

  if (result.success) {
    // Send confirmation email (non-blocking — don't fail the booking if email fails)
    sendBookingConfirmation({ date, time, email, firstName, company, context }).catch(() => {});
    res.json({ success: true, data: { eventId: result.eventId, htmlLink: result.htmlLink } });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});
