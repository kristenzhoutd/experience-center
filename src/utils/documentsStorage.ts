const STORAGE_KEY = 'pm_documents';

export interface StoredDocument {
  id: string;
  name: string;
  type?: string;
  size?: number;
  text?: string;
  content?: string;
  fileType?: string;
  fileSize?: number;
  createdAt?: string;
  uploadedAt?: string;
}

export function loadDocuments(): StoredDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDocuments(docs: StoredDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}
