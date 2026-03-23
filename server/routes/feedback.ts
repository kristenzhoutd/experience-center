import { Router } from 'express';
import { appendFeedback } from '../services/google-sheets.js';

export const feedbackRouter = Router();

feedbackRouter.post('/', async (req, res) => {
  const { rating, categories, comment } = req.body;
  const result = await appendFeedback({ rating, categories: categories || [], comment: comment || '' });
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json(result);
  }
});
