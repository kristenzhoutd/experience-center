/**
 * Campaign Chat Page -- Route-level wrapper.
 * Shows the landing page when the user hasn't started a conversation yet.
 * Once a brief is submitted (via query param or direct message), shows the chat.
 * Also activates immediately when reopening a program (programId in location state).
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import CampaignChatPageComponent from '../components/campaign/CampaignChatPage';
import CampaignLandingPage from '../components/campaign/CampaignLandingPage';

export default function CampaignChatPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const hasBrief = searchParams.has('brief');
  const hasBlueprintId = searchParams.has('blueprintId');
  const hasSessionId = searchParams.has('sessionId');
  const hasAdsetForCampaign = searchParams.has('adsetForCampaign');
  const hasBriefId = !!(location.state as { briefId?: string } | null)?.briefId;
  const hasProgramId = !!(location.state as { programId?: string } | null)?.programId;
  const storeMessages = useChatStore((s) => s.messages);

  const [chatActivated, setChatActivated] = useState(
    () => hasBrief || hasBlueprintId || hasSessionId || hasAdsetForCampaign || hasBriefId || hasProgramId || storeMessages.length > 0
  );

  useEffect(() => {
    const shouldBeActive = hasBrief || hasBlueprintId || hasSessionId || hasAdsetForCampaign || hasBriefId || hasProgramId || storeMessages.length > 0;
    if (shouldBeActive && !chatActivated) {
      setChatActivated(true);
    }
  }, [hasBrief, hasBlueprintId, hasSessionId, hasAdsetForCampaign, hasBriefId, hasProgramId, storeMessages.length, chatActivated]);

  if (!chatActivated) {
    return <CampaignLandingPage />;
  }

  return <CampaignChatPageComponent />;
}
