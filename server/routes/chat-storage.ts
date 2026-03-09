/**
 * Chat storage routes — replaces electron/ipc/chat-handlers.ts storage portion
 */

import { Router } from 'express';
import { saveChat, loadChat, listChats, deleteChat } from '../services/storage.js';

export const chatStorageRouter = Router();

// POST /api/chats — save a chat
chatStorageRouter.post('/', async (req, res) => {
  try {
    await saveChat(req.body);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// GET /api/chats — list all chats
chatStorageRouter.get('/', async (_req, res) => {
  try {
    const chats = await listChats();
    res.json({ success: true, data: chats });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// GET /api/chats/:id — load a chat
chatStorageRouter.get('/:id', async (req, res) => {
  try {
    const chat = await loadChat(req.params.id);
    res.json({ success: true, data: chat });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// DELETE /api/chats/:id — delete a chat
chatStorageRouter.delete('/:id', async (req, res) => {
  try {
    await deleteChat(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});
