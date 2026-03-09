/**
 * File-based storage service for the web server.
 * Replaces Electron's app.getPath('userData') with a local ./data directory.
 */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppSettings, Blueprint, StoredChat } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use /tmp on Vercel (ephemeral), ./data locally
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'ai-suites-data')
  : path.resolve(__dirname, '../../data');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ── Settings ──

const settingsPath = path.join(DATA_DIR, 'settings.json');

export function loadSettings(): AppSettings {
  ensureDir(DATA_DIR);
  try {
    const data = fs.readFileSync(settingsPath, 'utf-8');
    return { theme: 'system', ...JSON.parse(data) };
  } catch {
    return { theme: 'system' };
  }
}

export function saveSettings(settings: AppSettings): void {
  ensureDir(DATA_DIR);
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
}

export function patchSettings(patch: Partial<AppSettings>): void {
  const settings = loadSettings();
  const merged = { ...settings, ...patch };
  saveSettings(merged);
}

// ── Blueprints ──

function getBlueprintsDir(): string {
  const dir = path.join(DATA_DIR, 'blueprints');
  ensureDir(dir);
  return dir;
}

function blueprintPath(id: string): string {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getBlueprintsDir(), `${safeId}.json`);
}

export function saveBlueprint(blueprint: Blueprint): void {
  const now = new Date().toISOString();
  const existing = loadBlueprint(blueprint.id);
  const toSave: Blueprint = {
    ...blueprint,
    createdAt: existing?.createdAt || blueprint.createdAt || now,
    updatedAt: now,
    version: existing ? (existing.version || 0) + 1 : blueprint.version || 1,
  };
  fs.writeFileSync(blueprintPath(toSave.id), JSON.stringify(toSave, null, 2), 'utf-8');
}

export function loadBlueprint(id: string): Blueprint | null {
  const filePath = blueprintPath(id);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Blueprint;
  } catch {
    return null;
  }
}

export function listBlueprints(): Blueprint[] {
  const dir = getBlueprintsDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const blueprints: Blueprint[] = [];
  for (const file of files) {
    try {
      blueprints.push(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')));
    } catch {
      // skip malformed
    }
  }
  blueprints.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return blueprints;
}

export function deleteBlueprint(id: string): boolean {
  const filePath = blueprintPath(id);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

// ── Chat Storage ──

function getChatsDir(): string {
  const dir = path.join(DATA_DIR, 'chats');
  ensureDir(dir);
  return dir;
}

function chatFilePath(chatId: string): string {
  const safeId = chatId.replace(/[^a-zA-Z0-9-_]/g, '_');
  return path.join(getChatsDir(), `${safeId}.json`);
}

export async function saveChat(chat: StoredChat): Promise<void> {
  ensureDir(getChatsDir());
  await fsp.writeFile(chatFilePath(chat.id), JSON.stringify(chat, null, 2), 'utf-8');
}

export async function loadChat(chatId: string): Promise<StoredChat | null> {
  try {
    const content = await fsp.readFile(chatFilePath(chatId), 'utf-8');
    return JSON.parse(content) as StoredChat;
  } catch {
    return null;
  }
}

export async function listChats(): Promise<Omit<StoredChat, 'messages'>[]> {
  const dir = getChatsDir();
  try {
    const files = await fsp.readdir(dir);
    const chats: Omit<StoredChat, 'messages'>[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = await fsp.readFile(path.join(dir, file), 'utf-8');
        const chat = JSON.parse(content) as StoredChat;
        chats.push({
          id: chat.id, title: chat.title, summary: chat.summary,
          createdAt: chat.createdAt, updatedAt: chat.updatedAt, sessionId: chat.sessionId,
        });
      } catch { /* skip */ }
    }
    chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return chats;
  } catch {
    return [];
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  try {
    await fsp.unlink(chatFilePath(chatId));
  } catch { /* ignore */ }
}
