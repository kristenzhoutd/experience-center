/**
 * Platform routes — replaces electron/ipc/platform-handlers.ts
 *
 * Meta: real API integration via access token
 * Google / TikTok: mock stubs
 */

import { Router } from 'express';
import { loadSettings, patchSettings } from '../services/storage.js';
import type { PlatformType, PlatformConnection } from '../types.js';

export const platformRouter = Router();

// In-memory connection state
const connections: Record<PlatformType, PlatformConnection> = {
  meta: { platform: 'meta', connected: false },
  google: { platform: 'google', connected: false },
  tiktok: { platform: 'tiktok', connected: false },
};

// Restore from settings on load
const savedSettings = loadSettings();
if (savedSettings.platformConnections?.meta?.connected) {
  connections.meta = {
    platform: 'meta',
    connected: true,
    accountName: 'Meta Ad Account',
    accountId: savedSettings.platformConnections.meta.adAccountId,
    businessId: savedSettings.platformConnections.meta.businessId,
  };
}

// POST /api/platforms/connect
platformRouter.post('/connect', async (req, res) => {
  const { platform, credentials } = req.body as { platform: PlatformType; credentials?: Record<string, string> };

  if (!connections[platform]) {
    res.json({ success: false, error: `Unknown platform: ${platform}` });
    return;
  }

  if (platform === 'meta' && credentials?.accessToken) {
    // Validate token and get ad accounts
    try {
      const tokenRes = await fetch(
        `https://graph.facebook.com/v24.0/me?access_token=${credentials.accessToken}&fields=id,name`
      );
      if (!tokenRes.ok) {
        res.json({ success: false, error: 'Invalid Meta access token' });
        return;
      }

      const adAccountsRes = await fetch(
        `https://graph.facebook.com/v24.0/me/adaccounts?access_token=${credentials.accessToken}&fields=id,name,account_status,business%7Bid,name%7D&limit=100`
      );
      let adAccountId = '';
      let accountName = 'Meta Ad Account';
      let businessId = '';

      if (adAccountsRes.ok) {
        const data = await adAccountsRes.json() as any;
        const active = data.data?.find((a: any) => a.account_status === 1) || data.data?.[0];
        if (active) {
          adAccountId = active.id;
          accountName = active.name || accountName;
          businessId = active.business?.id || '';
        }
      }

      patchSettings({
        platformConnections: {
          ...loadSettings().platformConnections,
          meta: { accessToken: credentials.accessToken, adAccountId, businessId, connected: true },
        },
      });

      connections.meta = { platform: 'meta', connected: true, accountName, accountId: adAccountId, businessId, lastSyncedAt: new Date().toISOString() };
      res.json({ success: true, connection: connections.meta });
    } catch (error) {
      res.json({ success: false, error: error instanceof Error ? error.message : 'Connection failed' });
    }
    return;
  }

  // Google / TikTok mock
  connections[platform] = {
    platform,
    connected: true,
    accountName: platform === 'google' ? 'Google Ads Account' : 'TikTok Ads Account',
    accountId: credentials?.customerId || credentials?.advertiserId || `mock-${Date.now()}`,
    lastSyncedAt: new Date().toISOString(),
  };
  res.json({ success: true, connection: connections[platform] });
});

// POST /api/platforms/disconnect
platformRouter.post('/disconnect', (req, res) => {
  const { platform } = req.body as { platform: PlatformType };
  connections[platform] = { platform, connected: false };
  if (platform === 'meta') {
    patchSettings({ platformConnections: { ...loadSettings().platformConnections, meta: { connected: false } } });
  }
  res.json({ success: true });
});

// GET /api/platforms/status
platformRouter.get('/status', (_req, res) => {
  res.json({ success: true, data: { ...connections } });
});

// POST /api/platforms/metrics
platformRouter.post('/metrics', (req, res) => {
  const { platform } = req.body as { platform: PlatformType };
  if (!connections[platform]?.connected) {
    res.json({ success: false, error: `${platform} not connected` });
    return;
  }
  const impressions = Math.floor(50000 + Math.random() * 450000);
  const clicks = Math.floor(impressions * (0.01 + Math.random() * 0.04));
  const spend = Math.round((500 + Math.random() * 9500) * 100) / 100;
  const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.08));
  res.json({
    success: true,
    data: {
      impressions, clicks, spend, conversions,
      ctr: Math.round((clicks / impressions) * 10000) / 100,
      cpc: Math.round((spend / clicks) * 100) / 100,
      roas: Math.round(((conversions * 50) / spend) * 100) / 100,
    },
  });
});

// POST /api/platforms/sync-audience
platformRouter.post('/sync-audience', (req, res) => {
  const { platform } = req.body as { platform: PlatformType };
  if (!connections[platform]?.connected) {
    res.json({ success: false, error: `${platform} not connected` });
    return;
  }
  res.json({
    success: true,
    data: {
      syncId: `sync_${platform}_${Date.now()}`,
      status: 'completed',
      matchRate: Math.round((0.55 + Math.random() * 0.35) * 100) / 100,
    },
  });
});

// Campaigns CRUD (Meta Graph API passthrough)
platformRouter.get('/campaigns', async (_req, res) => {
  if (!connections.meta?.connected) {
    res.json({ success: false, error: 'Meta not connected' });
    return;
  }
  const settings = loadSettings();
  const meta = settings.platformConnections?.meta;
  if (!meta?.accessToken || !meta?.adAccountId) {
    res.json({ success: false, error: 'Meta credentials not found' });
    return;
  }
  try {
    const apiRes = await fetch(
      `https://graph.facebook.com/v24.0/${meta.adAccountId}/campaigns?access_token=${meta.accessToken}&fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time&limit=100`
    );
    const data = await apiRes.json() as any;
    res.json({ success: true, data: data.data || [] });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : 'Failed to list campaigns' });
  }
});

platformRouter.post('/campaigns', async (req, res) => {
  if (!connections.meta?.connected) {
    res.json({ success: false, error: 'Meta not connected' });
    return;
  }
  const settings = loadSettings();
  const meta = settings.platformConnections?.meta;
  if (!meta?.accessToken || !meta?.adAccountId) {
    res.json({ success: false, error: 'Meta credentials not found' });
    return;
  }
  const { name, objective, dailyBudget, status } = req.body;
  try {
    const apiRes = await fetch(
      `https://graph.facebook.com/v24.0/${meta.adAccountId}/campaigns`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: meta.accessToken,
          name,
          objective: objective?.toUpperCase(),
          daily_budget: Math.round(dailyBudget * 100),
          status: status || 'PAUSED',
          special_ad_categories: [],
        }),
      }
    );
    const data = await apiRes.json() as any;
    if (data.error) {
      res.json({ success: false, error: data.error.message });
      return;
    }
    res.json({ success: true, id: data.id });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : 'Failed to create campaign' });
  }
});
