/**
 * Type definitions for Digital Asset Management (DAM) integration.
 * Supports Adobe AEM and Bynder providers.
 */

export interface DAMProvider {
  id: 'aem' | 'bynder';
  name: string;
  connected: boolean;
  instanceUrl: string;
}

export interface DAMAsset {
  id: string;
  name: string;
  type: 'image' | 'video';
  provider: 'aem' | 'bynder';
  thumbnailUrl: string;
  fullUrl: string;
  dimensions: { width: number; height: number };
  aspectRatio: string;
  fileSize: number;
  format: string;
  uploadDate: string;
  tags: string[];
  collection: string;
  usageRights: 'approved' | 'restricted' | 'pending';
  description: string;
}

export interface DAMFilter {
  type: 'image' | 'video' | null;
  aspectRatio: string | null;
  usageRights: 'approved' | 'restricted' | 'pending' | null;
  collection: string | null;
}
