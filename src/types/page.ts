export interface Spot {
  id: string;
  name: string;
  type: string;
  selector: string;
}

export interface SavedPage {
  id: string;
  websiteUrl: string;
  websiteName: string;
  pageName: string;
  spots: Spot[];
  description?: string;
  thumbnailDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}
