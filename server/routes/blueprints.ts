/**
 * Blueprint routes — replaces electron/ipc/blueprint-handlers.ts
 */

import { Router } from 'express';
import { saveBlueprint, loadBlueprint, listBlueprints, deleteBlueprint } from '../services/storage.js';

export const blueprintRouter = Router();

// POST /api/blueprints — save blueprint
blueprintRouter.post('/', (req, res) => {
  try {
    saveBlueprint(req.body);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// GET /api/blueprints — list all blueprints
blueprintRouter.get('/', (_req, res) => {
  try {
    const blueprints = listBlueprints();
    res.json({ success: true, data: blueprints });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// GET /api/blueprints/:id
blueprintRouter.get('/:id', (req, res) => {
  const blueprint = loadBlueprint(req.params.id);
  if (!blueprint) {
    res.json({ success: false, error: `Blueprint not found: ${req.params.id}` });
    return;
  }
  res.json({ success: true, data: blueprint });
});

// DELETE /api/blueprints/:id
blueprintRouter.delete('/:id', (req, res) => {
  const deleted = deleteBlueprint(req.params.id);
  if (!deleted) {
    res.json({ success: false, error: `Blueprint not found: ${req.params.id}` });
    return;
  }
  res.json({ success: true });
});

// POST /api/blueprints/:id/export
blueprintRouter.post('/:id/export', (req, res) => {
  const blueprint = loadBlueprint(req.params.id);
  if (!blueprint) {
    res.json({ success: false, error: `Blueprint not found: ${req.params.id}` });
    return;
  }
  res.json({ success: true, data: JSON.stringify(blueprint, null, 2) });
});
