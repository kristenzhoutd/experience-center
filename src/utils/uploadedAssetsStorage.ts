import { storage } from './storage';

const STORAGE_KEY = 'pm_uploaded_assets';

export interface UploadedAsset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'file';
  category: string;
  dimensions?: string | { width: number; height: number };
}

export function loadUploadedAssets(): UploadedAsset[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUploadedAssets(assets: UploadedAsset[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(assets));
}
