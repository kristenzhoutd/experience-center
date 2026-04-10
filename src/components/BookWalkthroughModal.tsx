/**
 * Book a Walkthrough — opens Marketo form #9119 via native lightbox.
 * Marketo handles rendering, validation, and cross-domain submission.
 */

import { useEffect, useRef } from 'react';
import { AnalyticsEvents } from '../utils/analytics';
import { trackAll } from '../utils/tracking';
import { loadMarketoScript } from '../utils/marketo';

interface BookWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  ctaSource?: string;
  goalId?: string;
  industryId?: string;
  scenarioId?: string;
}

const MARKETO_BASE_URL = '//get.treasuredata.com';
const MARKETO_MUNCHKIN_ID = '714-XIJ-402';
const MARKETO_FORM_ID = 9119;

export default function BookWalkthroughModal({ isOpen, onClose, ctaSource, goalId, industryId, scenarioId }: BookWalkthroughModalProps) {
  const openedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || openedRef.current) return;
    openedRef.current = true;

    trackAll(AnalyticsEvents.WALKTHROUGH_CTA_CLICK, {
      cta_source: ctaSource,
      goal_id: goalId,
      industry_id: industryId,
      scenario_id: scenarioId,
    });

    (async () => {
      try {
        await loadMarketoScript();
      } catch {
        console.warn('[BookWalkthrough] Failed to load Marketo script');
        openedRef.current = false;
        onClose();
        return;
      }

      if (!window.MktoForms2) {
        openedRef.current = false;
        onClose();
        return;
      }

      // Create a temporary form element for Marketo to bind to
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      const formEl = document.createElement('form');
      formEl.id = `mktoForm_${MARKETO_FORM_ID}`;
      container.appendChild(formEl);
      document.body.appendChild(container);

      window.MktoForms2.loadForm(MARKETO_BASE_URL, MARKETO_MUNCHKIN_ID, MARKETO_FORM_ID, (form: MktoForm) => {
        // Show Marketo's native lightbox
        window.MktoForms2!.lightbox(form).show();

        // Track submission
        form.onSuccess(() => {
          trackAll(AnalyticsEvents.WALKTHROUGH_FORM_SUBMIT, {
            cta_source: ctaSource,
            goal_id: goalId,
            industry_id: industryId,
            scenario_id: scenarioId,
          });
          return false; // prevent Marketo redirect
        });
      });

      // Watch for lightbox close to reset state
      const observer = new MutationObserver(() => {
        const overlay = document.querySelector('.mktoModalOverlay');
        if (!overlay) {
          observer.disconnect();
          openedRef.current = false;
          container.remove();
          onClose();
        }
      });
      // Start observing after a short delay so lightbox has time to appear
      setTimeout(() => {
        observer.observe(document.body, { childList: true, subtree: true });
      }, 500);
    })();
  }, [isOpen, onClose, ctaSource, goalId, industryId, scenarioId]);

  // Reset when closed externally
  useEffect(() => {
    if (!isOpen) {
      openedRef.current = false;
    }
  }, [isOpen]);

  // No custom UI — Marketo lightbox handles everything
  return null;
}
