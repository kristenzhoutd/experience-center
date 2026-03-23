/**
 * Google Sheets integration for feedback storage.
 *
 * Uses the same service account as Google Calendar.
 * Share the spreadsheet with treasureai-experience@treasureai-experience.iam.gserviceaccount.com (Editor).
 */

import { google } from 'googleapis';

const SPREADSHEET_ID = '1_uEiHTbNSEMrFwlvV1nCgSGqrHcl2vcZKKvOQ2Pkl1E';

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
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const RATING_LABELS = ['Terrible', 'Bad', 'Okay', 'Good', 'Great'];

export async function appendFeedback(feedback: {
  rating: number | null;
  categories: string[];
  comment: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const row = [
      new Date().toISOString(),
      feedback.rating !== null ? RATING_LABELS[feedback.rating] ?? String(feedback.rating) : '',
      feedback.categories.join(', '),
      feedback.comment,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    return { success: true };
  } catch (err) {
    console.error('[Sheets] Feedback append error:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
