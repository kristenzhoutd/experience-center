/**
 * Type definitions for the PaidMediaProgram — a lightweight envelope
 * that tracks a user's end-to-end paid media workflow across all four steps.
 *
 * The program holds references (IDs) to existing artifacts (briefs, blueprints,
 * launch configs) without duplicating their data.
 */

export type ProgramStepId = 1 | 2 | 3 | 4;
export type ProgramStepStatus = 'pending' | 'in_progress' | 'completed';
export type ProgramStatus = 'draft' | 'in_progress' | 'ready_to_launch' | 'launched';
export type ChannelPlatform = 'meta' | 'google' | 'tiktok' | 'snapchat' | 'pinterest';

export interface ProgramStep {
  stepId: ProgramStepId;
  label: string;
  status: ProgramStepStatus;
  completedAt?: string;
  lastEditedAt?: string;
}

export interface ProgramChannelConfig {
  platform: ChannelPlatform;
  enabled: boolean;
  /** Multiple campaigns per channel (e.g., Meta → Prospecting Campaign, Retargeting Campaign) */
  launchConfigIds: string[];
  budgetCents?: number;
  isConfigured: boolean;
}

export interface PaidMediaProgram {
  id: string;
  name: string;
  status: ProgramStatus;
  createdAt: string;
  updatedAt: string;

  // Step tracking
  currentStepId: ProgramStepId;
  /** 0 = no steps completed yet */
  furthestCompletedStep: ProgramStepId | 0;
  steps: ProgramStep[];

  // Artifact references
  briefId?: string;
  /** Serialized CampaignBriefData for restoration */
  briefSnapshot?: string;
  blueprintIds: string[];
  approvedBlueprintId?: string;

  // Channel configs (Step 3)
  channels: ProgramChannelConfig[];

  // Chat
  chatSessionId?: string;
  chatHistoryKey?: string;
}
