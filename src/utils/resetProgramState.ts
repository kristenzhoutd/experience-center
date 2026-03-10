import { useCampaignLaunchStore } from '../stores/campaignLaunchStore';
import { useBlueprintStore } from '../stores/blueprintStore';
import { useBriefEditorStore } from '../stores/briefEditorStore';
import { useBriefStore } from '../stores/briefStore';
import { useAdSetConfigStore } from '../stores/adSetConfigStore';
import { useChatStore } from '../stores/chatStore';

/**
 * Safe reset for program switching — clears all program-specific stores
 * but preserves the chat session and IPC stream listener.
 *
 * Use this when navigating between programs so the AI edit stream
 * isn't killed (resetChat() tears down the IPC listener).
 */
export function resetProgramStores(): void {
  useCampaignLaunchStore.getState().reset();
  useBlueprintStore.getState().clearAll();
  useBriefEditorStore.getState().reset();
  useBriefStore.getState().clearActiveBrief();
  useAdSetConfigStore.getState().clearAll();
  // Clear messages but keep the session alive
  useChatStore.setState({
    messages: [],
    streamingSegments: [],
    isStreaming: false,
    isWaitingForResponse: false,
    pendingThinkingStart: false,
  });
}

/**
 * Nuclear reset — kills everything including the chat session.
 * Only for "New Chat" or full app reset scenarios.
 */
export function resetAllProgramState(): void {
  resetProgramStores();
  useChatStore.getState().resetChat();
}
