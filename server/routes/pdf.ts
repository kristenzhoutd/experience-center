/**
 * PDF routes — replaces electron/ipc/pdf-handlers.ts
 */

import { Router } from 'express';

let pdfParse: ((buffer: Buffer) => Promise<{ text: string }>) | null = null;

async function loadPdfParse() {
  if (pdfParse) return pdfParse;
  try {
    const mod = await import('pdf-parse');
    pdfParse = (mod as any).default || mod;
    return pdfParse;
  } catch {
    return null;
  }
}

export const pdfRouter = Router();

// POST /api/pdf/extract — extract text from base64-encoded PDF
pdfRouter.post('/extract', async (req, res) => {
  const parser = await loadPdfParse();
  if (!parser) {
    res.json({ success: false, error: 'PDF extraction not available.' });
    return;
  }

  const { base64Data } = req.body;
  if (!base64Data || typeof base64Data !== 'string') {
    res.json({ success: false, error: 'No PDF data provided.' });
    return;
  }

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length === 0) {
      res.json({ success: false, error: 'PDF data is empty.' });
      return;
    }
    const parsed = await parser(buffer);
    res.json({ success: true, text: parsed.text?.trim() || '' });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : 'Failed to parse PDF.' });
  }
});
