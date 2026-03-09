import { create } from 'zustand';
import { Campaign, ContentSpot, Segment } from '../types/shared';

// Demo user/org - in production, this would come from auth
const DEMO_USER_ID = 'demo-user';
const DEMO_ORG_ID = 'demo-org';

export interface CampaignDraft {
  name?: string;
  description?: string;
  goal?: any;
  overview?: string;
  audiences?: Array<{ name: string }>;
  goalDescription?: string;
  goalMetric?: string;
  conclusion?: string;
  audienceSegments?: Array<{
    name: string;
    priority: string;
    targetingRules: Array<{ rule: string; value: string }>;
  }>;
  contentVariants?: Array<{
    name: string;
    headline: string;
    body: string;
    cta: string;
  }>;
  contentSpots?: Array<{
    page: string;
    spots: string[];
  }>;
  duration?: string;
  primaryGoal?: string;
  kpi?: string;
  segments?: Partial<Segment>[];
  contentAssignments?: Array<{
    contentSpotId: string;
    contentSpotName: string;
    segmentTempId?: string;
    variant: any;
  }>;
}

interface AppState {
  // User context
  userId: string;
  organizationId: string;

  // Campaign draft (built from chat interactions)
  campaignDraft: CampaignDraft | null;

  // Data
  campaigns: Campaign[];
  contentSpots: ContentSpot[];

  // Actions
  setCampaignDraft: (draft: CampaignDraft | null) => void;
  updateCampaignDraft: (updates: Partial<CampaignDraft>) => void;
  setCampaigns: (campaigns: Campaign[]) => void;
  setContentSpots: (spots: ContentSpot[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Demo user context
  userId: DEMO_USER_ID,
  organizationId: DEMO_ORG_ID,

  // Campaign draft
  campaignDraft: null,

  // Data
  campaigns: [],
  contentSpots: [],

  // Actions
  setCampaignDraft: (draft) => set({ campaignDraft: draft }),

  updateCampaignDraft: (updates) =>
    set((state) => ({
      campaignDraft: state.campaignDraft
        ? { ...state.campaignDraft, ...updates }
        : updates,
    })),

  setCampaigns: (campaigns) => set({ campaigns }),

  setContentSpots: (spots) => set({ contentSpots: spots }),
}));
