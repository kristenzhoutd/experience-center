/**
 * Web extraction routes — replaces electron/ipc/web-handlers.ts
 *
 * Uses cheerio for HTML parsing (same as the Electron version).
 */

import { Router } from 'express';

export const webRouter = Router();

// POST /api/web/extract — extract personalization slots from URL
webRouter.post('/extract', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    res.json({ success: false, error: 'No URL provided.' });
    return;
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AI-Suites-Web/1.0' },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      res.json({ success: false, error: `HTTP ${response.status} fetching URL` });
      return;
    }
    const html = await response.text();

    // Dynamic import cheerio
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    const title = $('title').text().trim() || url;
    const spots: Array<{ id: string; selector: string; type: string; content: string }> = [];

    // Find common personalization targets
    $('[data-slot], [data-personalization], .hero-banner, .hero, .banner, .cta-section, .product-recommendation, .content-block').each((i, el) => {
      const $el = $(el);
      spots.push({
        id: `spot-${i}`,
        selector: $el.attr('data-slot') || $el.attr('class')?.split(' ')[0] || `element-${i}`,
        type: $el.attr('data-slot') ? 'data-slot' : 'semantic',
        content: $el.text().trim().slice(0, 200),
      });
    });

    res.json({
      success: true,
      data: {
        pageName: title,
        url,
        spots,
        rawHtmlLength: html.length,
      },
    });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : 'Failed to extract.' });
  }
});

// GET /api/web/proxy — proxy a webpage for iframe embedding
webRouter.get('/proxy', async (req, res) => {
  const url = req.query.url as string;
  if (!url || typeof url !== 'string') {
    res.status(400).send('No URL provided.');
    return;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      res.status(response.status).send(`Failed to fetch: HTTP ${response.status}`);
      return;
    }

    const html = await response.text();
    const contentType = response.headers.get('content-type') || 'text/html';

    // Inject a <base> tag so relative URLs resolve correctly
    const baseTag = `<base href="${url}">`;
    const modifiedHtml = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);

    res.setHeader('Content-Type', contentType);
    // Remove X-Frame-Options to allow iframe embedding
    res.removeHeader('X-Frame-Options');
    res.send(modifiedHtml);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : 'Failed to proxy page.');
  }
});

// POST /api/web/extract-text — extract visible text from URL
webRouter.post('/extract-text', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    res.json({ success: false, error: 'No URL provided.' });
    return;
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AI-Suites-Web/1.0' },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      res.json({ success: false, error: `HTTP ${response.status}` });
      return;
    }
    const html = await response.text();
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    // Remove non-content elements
    $('script, style, nav, footer, header, iframe, noscript').remove();

    const title = $('title').text().trim() || url;
    const headings = $('h1, h2, h3').map((_, el) => $(el).text().trim()).get();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 10000);
    const metaDescription = $('meta[name="description"]').attr('content') || '';

    res.json({
      success: true,
      data: {
        title,
        url,
        headings,
        bodyText,
        metaDescription,
        _method: 'direct',
      },
    });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : 'Failed to extract.' });
  }
});
