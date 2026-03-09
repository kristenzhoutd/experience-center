/**
 * Launch routes — replaces electron/ipc/launch-handlers.ts
 *
 * Handles image upload, stock search, image fetch, etc.
 * File selection uses web upload instead of native dialog.
 */

import { Router } from 'express';

export const launchRouter = Router();

// POST /api/launch/stock-search — search Unsplash
launchRouter.post('/stock-search', async (req, res) => {
  const { query } = req.body;
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

  if (!UNSPLASH_ACCESS_KEY) {
    res.json({ success: false, error: 'Unsplash API key not configured' });
    return;
  }

  try {
    const encoded = encodeURIComponent(query);
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encoded}&per_page=12&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          'Accept-Version': 'v1',
        },
      }
    );

    if (!response.ok) {
      res.json({ success: false, error: `Unsplash API error: ${response.status}` });
      return;
    }

    const data = await response.json() as { results?: any[] };
    const photos = (data.results || []).map((img: any) => ({
      id: img.id,
      src: img.urls?.regular || img.urls?.small,
      thumb: img.urls?.thumb || img.urls?.small,
      alt: img.alt_description || img.description || query,
      photographer: img.user?.name || 'Unsplash',
    }));

    res.json({ success: true, photos });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : 'Search failed' });
  }
});

// POST /api/launch/fetch-image — fetch image from URL (CORS bypass)
launchRouter.post('/fetch-image', async (req, res) => {
  const { url } = req.body;
  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) {
      res.json({ success: false, error: `HTTP ${response.status}` });
      return;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    const previewUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const fileName = url.split('/').pop()?.split('?')[0] || 'image.jpg';

    res.json({
      success: true,
      file: { fileName, filePath: url, fileSize: buffer.length, mimeType, previewUrl },
    });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch' });
  }
});

// POST /api/launch/upload-file — web file upload (replaces native dialog)
// The frontend will send files via multipart/form-data or base64
launchRouter.post('/upload-file', (req, res) => {
  const { fileName, base64Data, mimeType } = req.body;

  if (!base64Data) {
    res.json({ success: false, error: 'No file data provided' });
    return;
  }

  const buffer = Buffer.from(base64Data, 'base64');
  const previewUrl = `data:${mimeType};base64,${base64Data}`;

  res.json({
    success: true,
    file: {
      fileName: fileName || 'upload',
      filePath: '', // no local path in web mode
      fileSize: buffer.length,
      mimeType: mimeType || 'application/octet-stream',
      previewUrl,
    },
  });
});
