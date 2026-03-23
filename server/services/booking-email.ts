/**
 * Booking confirmation email via Gmail SMTP.
 *
 * Requires GMAIL_APP_PASSWORD env var (16-char app password).
 * Sends from experienceattdai@gmail.com.
 */

import nodemailer from 'nodemailer';

const SENDER_EMAIL = process.env.GMAIL_SENDER_EMAIL || 'experienceattdai@gmail.com';
const SENDER_NAME = 'Treasure AI Experience Center';

function getTransport() {
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  if (!appPassword) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SENDER_EMAIL,
      pass: appPassword,
    },
  });
}

export async function sendBookingConfirmation(booking: {
  email: string;
  firstName: string;
  company: string;
  date: string;
  time: string;
  context?: { goal?: string; industry?: string; scenario?: string };
}): Promise<{ success: boolean; error?: string }> {
  const transport = getTransport();
  if (!transport) {
    console.warn('[Email] GMAIL_APP_PASSWORD not set — skipping confirmation email');
    return { success: true }; // Don't fail the booking
  }

  const contextLines = [];
  if (booking.context?.goal) contextLines.push(`<li><strong>Goal:</strong> ${booking.context.goal}</li>`);
  if (booking.context?.industry) contextLines.push(`<li><strong>Industry:</strong> ${booking.context.industry}</li>`);
  if (booking.context?.scenario) contextLines.push(`<li><strong>Scenario:</strong> ${booking.context.scenario}</li>`);

  const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="https://www.treasuredata.com/wp-content/themes/jesuspended/img/logo/td-logo-mark.svg" alt="Treasure AI" width="40" height="40" />
      </div>

      <h2 style="font-size: 20px; font-weight: 600; color: #111; text-align: center; margin-bottom: 8px;">
        Your walkthrough is confirmed
      </h2>
      <p style="font-size: 14px; color: #666; text-align: center; margin-bottom: 24px;">
        A Treasure AI team member will reach out to confirm the details.
      </p>

      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 13px; color: #666; margin-bottom: 4px;">Scheduled for</div>
        <div style="font-size: 16px; font-weight: 600; color: #111;">${formattedDate} at ${booking.time}</div>
      </div>

      ${contextLines.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <div style="font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            What we'll cover
          </div>
          <ul style="font-size: 14px; color: #444; padding-left: 20px; margin: 0; line-height: 1.8;">
            ${contextLines.join('')}
          </ul>
        </div>
      ` : ''}

      <div style="margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          What to expect
        </div>
        <ul style="font-size: 14px; color: #444; padding-left: 20px; margin: 0; line-height: 1.8;">
          <li>A tailored walkthrough based on the outcome you explored</li>
          <li>How Treasure AI connects to real workflows and business outcomes</li>
          <li>Relevant opportunities and clear next steps tied to your goals</li>
        </ul>
      </div>

      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #999;">
          Treasure AI Experience Center<br/>
          Powered by Treasure Data
        </p>
      </div>
    </div>
  `;

  try {
    await transport.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: booking.email,
      subject: `Your Treasure AI walkthrough is confirmed — ${formattedDate}`,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('[Email] Failed to send confirmation:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
