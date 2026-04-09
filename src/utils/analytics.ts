export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

let gaInitialized = false;

export const initializeGA = () => {
  if (!GA_MEASUREMENT_ID || gaInitialized) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });

  gaInitialized = true;
};

export const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

export const getClientId = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('get', GA_MEASUREMENT_ID, 'client_id', (clientId: string) => {
        resolve(clientId);
      });
    } else {
      reject(new Error('GA not initialized'));
    }
  });
};

export const AnalyticsEvents = {
  GOAL_SELECT: 'goal_select',
  EXPERIENCE_START: 'experience_start',
  INDUSTRY_SELECT: 'industry_select',
  SCENARIO_SELECT: 'scenario_select',
  INPUT_COMPLETE: 'input_complete',
  GENERATION_START: 'generation_start',
  GENERATION_COMPLETE: 'generation_complete',
  REFINEMENT_CLICK: 'refinement_click',
  BRANCH_CHOICE: 'branch_choice',
  SLIDE_DECK_REQUEST: 'slide_deck_request',
  OUTPUT_TAB_VIEW: 'output_tab_view',
  WALKTHROUGH_CTA_CLICK: 'walkthrough_cta_click',
  WALKTHROUGH_FORM_SUBMIT: 'walkthrough_form_submit',
} as const;

const DEMO_BASE_URL = 'https://www.treasuredata.com/custom-demo/?utm_source=experience-center&utm_medium=product&utm_campaign=plg';

/** Opens the TD custom-demo page in a new tab, appending the GA client ID. */
export const openDemoPage = async () => {
  let url = DEMO_BASE_URL;
  try {
    const clientId = await getClientId();
    url += `&EC_GC_ID=${encodeURIComponent(clientId)}`;
  } catch {
    // GA not initialized — open without client ID
  }
  window.open(url, '_blank');
};
