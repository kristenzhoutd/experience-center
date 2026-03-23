/**
 * Experience Center API route.
 *
 * POST /api/experience-center/generate
 *   Body: { scenarioId, scenarioConfig? }
 *   - If scenarioConfig is provided, uses it directly
 *   - Otherwise, scenarioId is looked up (client must send config for now)
 */

import { Router } from 'express';
import { executeScenarioSkill, executeSlideSkill } from './orchestration/executeSkill.js';
import type { ScenarioConfig } from './types.js';

export const experienceCenterRouter = Router();

experienceCenterRouter.post('/generate', async (req, res) => {
  const { scenarioConfig } = req.body as { scenarioConfig?: ScenarioConfig };

  if (!scenarioConfig?.scenarioId || !scenarioConfig?.industry || !scenarioConfig?.skillFamily) {
    res.status(400).json({ success: false, error: 'Missing required scenarioConfig with scenarioId, industry, and skillFamily' });
    return;
  }

  // Pass API key from request header (browser sends it from localStorage)
  const apiKeyOverride = req.headers['x-api-key'] as string | undefined;

  const result = await executeScenarioSkill(scenarioConfig, { apiKeyOverride });

  if (result.success) {
    res.json({ success: true, data: result.data, meta: result.meta });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

experienceCenterRouter.post('/generate-slides', async (req, res) => {
  const { outputData, deckLength, deckStyle, customTitle, scenarioContext } = req.body;

  if (!outputData || !deckLength || !deckStyle) {
    res.status(400).json({ success: false, error: 'Missing required fields: outputData, deckLength, deckStyle' });
    return;
  }

  const apiKeyOverride = req.headers['x-api-key'] as string | undefined;

  const result = await executeSlideSkill(
    { outputData, deckLength, deckStyle, customTitle, scenarioContext: scenarioContext || {} },
    { apiKeyOverride },
  );

  if (result.success) {
    res.json({ success: true, data: result.data });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});
