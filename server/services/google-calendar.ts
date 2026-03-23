/**
 * Google Calendar integration using a service account.
 *
 * Setup: Share your Google Calendar with the service account email
 * (treasureai-experience@treasureai-experience.iam.gserviceaccount.com)
 * and give it "Make changes to events" permission.
 */

import { google } from 'googleapis';

function getAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const credentials = keyJson ? JSON.parse(keyJson) : {
    type: 'service_account',
    project_id: 'treasureai-experience',
    private_key_id: '8f52e9990f22b49c4293ed138501d51c0401dfc1',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC655DTWJ218iee\nl6E2b2h3sBWeVaKswicGDVFc19cHKJo9e19qHD6pd2toN8dGUCCl9doI8ziJ3qut\nVOLrSNMaeXftq1b0o/3GEVcfO2OP3EaVD3nAlFaFmhCLxRkEGDhQsZWwhcD0wOEA\nY9ZvnIMSKmmYgbPWKPXQgUfAVfsfbQ4RCRaWzA7gedtLJEEqHEG4VDxyAb4G+Tlr\nQwmZu2Fc77hEukmEj+oIDTSKpa+g83Jn7jVfwzFnXizvr0sFO7XXBP0xsbEbASAW\nQjWvveyj0OQycXua9lNQST7oiukSneYbm1zDEeG84UYPpnHf0uI8i+Z6OuSV9DG/\n1dwQjyUDAgMBAAECggEAPvvsFRymwPqimVIVtKdkd/jxwBKxqDAhQGvagEQIJVRs\nbc2WgMaV4zvoCQ3K7InyBptL53o3ElbkWZvigFFhOmm2nXQA8J4W1dlgF5lG2uLr\nMi4t5FTYt1sMul0oKfYTfDXr8LmSJaid6ii6yY/fp459WTRUKxZQh/wY9trCrnrZ\nHKd0ULNPKNLZREg22oM3Ul8jup1vZ5w7RJT5IxryqCNGji4zqV7jNCgxnlQ90rMR\njMu/OwXJ8dT5DlhnrHMIdEwCw1gzvnWncNH8jAcR442v8h51Jcympjfq59q4X0GI\nTrM/u4Ce5LBelGGGUeCDZOdK8RPRl/9BNozaz+0KIQKBgQDi9VwdK+5nPzex36VM\n2pb6dp8Oxwj34E1LXQ15V48VCli5A779eK9fXi4/C8Jr+ca8Ojn78pcN3MVL1fOM\n68C5cDlUNaoRQ8K6kRCxT8km5hBloPoEzvlqalkBQ2fVMaFznFIvrVJew67wA6t1\nXvnjPUDCfjaLuuPoHhZFcgVSEwKBgQDS0iHUT55O9uKladseDhjRYAakkMXdFCQR\nAZs8iw9VYuB021CRCGelfGd2yDTDTNe+Eu+D0ulWQko1ZAqoZtuLfumH6NuTSoF6\nahZdiAJto1P62AIhiazCqLp0VjbcojgFfMCfT62/rMgqbjq7XZaG3m9dtModZJ9l\nEkRdnUy/UQKBgQDA7/ZzsiIEUYCmTMp4UCcjGu5SoK8mEd+DnsJSkjXHnDkaZ23Y\nit0DRMwpunR4WCkzYIhkf7EcDr8GngZimRQIULfbt5cxABqtgZ7gLUSCNfhgfP2u\nUslDRs8NPOErIvrujkhr0XsBpna0AVqj966VGEBSVvtFxAX1EIa8WJbfUwKBgCcK\n5Vr1V8MV88lgfkTlpXD5EKHfcdVMipVfr8kZk8BjbGAX0abaYJ+EF4Em+KaGj5nS\n1eqa372qzyVuHo8rZVNDMKqL1EZF0Q7DoNq3eoOlcMMOx+5AGe9+4fDzmntny2ow\nvVeDoRDTRcqd2WCjp2HYxdUbyyaAYQiNxn1zySfRAoGBALCWhc6/jUICPAf/SqH7\nIHVjEflotTC/kuxqEgMl7oGBVtFwkwsLLRTrgFvOBZxdZIVr3J2zLTauDvZcHYLn\nvHe4ataYkDAKN9VQ4uIC/MQQRvXkBOZnZUJayHeeu/B06O7lQeQbkxb9aHyhk3RM\nXmYDWTB37M3GQD6F/O/xfKVS\n-----END PRIVATE KEY-----\n',
    client_email: 'treasureai-experience@treasureai-experience.iam.gserviceaccount.com',
    client_id: '108237494806615292177',
  };

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'],
  });
}

/** Check if calendar service is available */
export function isCalendarAuthorized(): boolean {
  return true; // Service account is always available
}

/** Get free/busy for a date range */
export async function getAvailability(
  calendarId: string,
  startDate: string,
  endDate: string,
): Promise<{ success: true; busySlots: Array<{ start: string; end: string }> } | { success: false; error: string }> {
  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate,
        timeMax: endDate,
        items: [{ id: calendarId }],
      },
    });

    const busy = res.data.calendars?.[calendarId]?.busy || [];
    return {
      success: true,
      busySlots: busy.map(b => ({ start: b.start || '', end: b.end || '' })),
    };
  } catch (err) {
    console.error('[Calendar] Availability error:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Create a calendar event */
export async function createBooking(
  calendarId: string,
  booking: {
    date: string;
    time: string;
    email: string;
    firstName: string;
    company: string;
    role: string;
    context?: { goal?: string; industry?: string; scenario?: string };
  },
): Promise<{ success: true; eventId: string; htmlLink: string } | { success: false; error: string }> {
  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    // Parse time
    const [hourStr, minutePart] = booking.time.split(':');
    const isPM = minutePart.includes('PM');
    let hour = parseInt(hourStr);
    const minute = parseInt(minutePart) || 0;
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    const startDate = new Date(booking.date);
    startDate.setHours(hour, minute, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30);

    const contextLines = [];
    if (booking.context?.goal) contextLines.push(`Goal: ${booking.context.goal}`);
    if (booking.context?.industry) contextLines.push(`Industry: ${booking.context.industry}`);
    if (booking.context?.scenario) contextLines.push(`Scenario: ${booking.context.scenario}`);

    const description = [
      'Treasure AI Experience Center — Walkthrough',
      '',
      `Contact: ${booking.firstName} (${booking.email})`,
      booking.company ? `Company: ${booking.company}` : '',
      booking.role ? `Role: ${booking.role}` : '',
      '',
      contextLines.length > 0 ? 'Experience Context:' : '',
      ...contextLines,
    ].filter(Boolean).join('\n');

    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `Treasure AI Walkthrough — ${booking.firstName}${booking.company ? ` (${booking.company})` : ''}`,
        description,
        start: { dateTime: startDate.toISOString() },
        end: { dateTime: endDate.toISOString() },
        reminders: { useDefault: true },
      },
    });

    return {
      success: true,
      eventId: res.data.id || '',
      htmlLink: res.data.htmlLink || '',
    };
  } catch (err) {
    console.error('[Calendar] Booking error:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
