/**
 * Vercel serverless catch-all handler.
 * Routes all /api/* requests to the Express app.
 */

import { app } from '../server/index.js';

export default app;
