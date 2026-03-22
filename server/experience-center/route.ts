/**
 * Experience Center API route.
 *
 * POST /api/experience-center/generate
 *   Body: { scenarioId, scenarioConfig? }
 *   - If scenarioConfig is provided, uses it directly
 *   - Otherwise, scenarioId is looked up (client must send config for now)
 */

import { Router } from 'express';
import { executeScenarioSkill } from './orchestration/executeSkill.js';
import type { ScenarioConfig } from './types.js';

export const experienceCenterRouter = Router();

experienceCenterRouter.post('/generate', async (req, res) => {
  const { scenarioConfig } = req.body as { scenarioConfig?: ScenarioConfig };

  if (!scenarioConfig?.scenarioId || !scenarioConfig?.industry || !scenarioConfig?.skillFamily) {
    res.status(400).json({ success: false, error: 'Missing required scenarioConfig with scenarioId, industry, and skillFamily' });
    return;
  }

  const result = await executeScenarioSkill(scenarioConfig);

  if (result.success) {
    res.json({ success: true, data: result.data, meta: result.meta });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});
