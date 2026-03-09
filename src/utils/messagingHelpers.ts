/**
 * Safely converts a messaging value to a string for display.
 * Handles both string and object formats.
 */
export function formatMessaging(messaging: unknown): string {
  // Already a string
  if (typeof messaging === 'string') {
    return messaging;
  }

  // Object format: {primaryMessage, supportingMessages, toneAndVoice}
  if (messaging && typeof messaging === 'object' && !Array.isArray(messaging)) {
    const m = messaging as Record<string, unknown>;

    // Prefer primaryMessage if available
    if (m.primaryMessage && typeof m.primaryMessage === 'string') {
      return m.primaryMessage;
    }

    // Otherwise, combine toneAndVoice and supportingMessages
    const parts: string[] = [];

    if (m.toneAndVoice && typeof m.toneAndVoice === 'string') {
      parts.push(m.toneAndVoice);
    }

    if (Array.isArray(m.supportingMessages)) {
      parts.push(...m.supportingMessages.filter((msg): msg is string => typeof msg === 'string'));
    } else if (m.supportingMessages && typeof m.supportingMessages === 'string') {
      parts.push(m.supportingMessages);
    }

    const combined = parts.filter(Boolean).join('. ');
    return combined || '';
  }

  // Fallback: empty string
  return '';
}
