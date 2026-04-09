/**
 * Marketo Forms2 hidden-form integration.
 *
 * Loads the Marketo script, manages a hidden form instance,
 * and provides email domain validation + submission helpers.
 */

const MARKETO_BASE_URL = '//get.treasuredata.com';
const MARKETO_MUNCHKIN_ID = '714-XIJ-402';
const MARKETO_FORM_ID = 2740;
const MARKETO_SCRIPT_URL = `${MARKETO_BASE_URL}/js/forms2/js/forms2.min.js`;

// Marketo field API names — update these after confirming with marketing ops
export const FIELD_MAP = {
  firstName: 'FirstName',
  lastName: 'LastName',
  email: 'Email',
  company: 'Company',
  role: 'Title',
  message: 'Description',
  gaClientId: 'GA_Client_ID__c',
} as const;

// ---------------------------------------------------------------------------
// Email domain validation (from treasuredata.com Marketo snippet)
// ---------------------------------------------------------------------------

const INVALID_EMAIL_DOMAINS = [
  '@gmail.', '@yahoo.', '@hotmail.', '@live.', '@aol.', '@outlook.',
  '@qq.', '@163.', '@127.', '@inbox.ru.', '@mail.ru.', '@list.ru.',
  '@bk.ru.', '@me.com', '@test.', '@tester.', '@123.com', '@testco.',
  '@att.net', '@comcast.net', '@icloud.com', '@yahoo.co.jp', '@ymail.com',
  '@protonmail.com', '@proton.me', '@zoho.com',
  // Competitor domains
  'actioniq.com', 'agilone.com', 'ascent360.com', 'blueconic.com',
  'ensighten.com', 'hull.io', 'ignitionone.com', 'getlytics.com',
  'mparticle.com', 'ngdata.com', 'redpointglobal.com', 'redpoint.net',
  'segment.com', 'signal.co', 'tealium.com', 'umbel.com', 'altiscale.com',
  'qubole.com', 'amazon.com', 'fivetran.com', 'stitchdata.com',
  'alooma.com', 'snaplogic.com', 'mulesoft.com', 'informatica.com',
  'talend.com', 'snowflake.com', 'google.com', 'panoply.com',
  'snowplow.com', 'databricks.com', 'oracle.com', 'salesforce.com',
  'simondata.com', 'firsthive.com', 'microsoft.com', 'adobe.com',
  'optimove.com', 'sitecore.com', 'cheetahdigital.com', 'amperity.com',
  'bluevenn.com', 'lexer.io', 'exponea.com',
];

export function isValidWorkEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return !INVALID_EMAIL_DOMAINS.some((d) => lower.includes(d));
}

// ---------------------------------------------------------------------------
// Script loader
// ---------------------------------------------------------------------------

let scriptPromise: Promise<void> | null = null;

export function loadMarketoScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.MktoForms2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = MARKETO_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Marketo Forms2 script'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

// ---------------------------------------------------------------------------
// Hidden form loader
// ---------------------------------------------------------------------------

let formPromise: Promise<MktoForm> | null = null;

export function loadHiddenForm(): Promise<MktoForm> {
  if (formPromise) return formPromise;

  formPromise = loadMarketoScript().then(
    () =>
      new Promise<MktoForm>((resolve, reject) => {
        if (!window.MktoForms2) {
          reject(new Error('MktoForms2 not available'));
          return;
        }

        // Required for cross-domain form submission on non-Marketo domains
        window.MktoForms2.setOptions({
          formXDPath: '/rs/714-XIJ-402/images/marketo-xdframe-relative.html',
        });

        // Container must NOT use display:none — the cross-domain iframe
        // won't initialise if the parent element is hidden that way.
        // Instead push it offscreen so it's in the DOM but invisible.
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = '1px';
        container.style.height = '1px';
        container.style.overflow = 'hidden';
        const formEl = document.createElement('form');
        formEl.id = `mktoForm_${MARKETO_FORM_ID}`;
        container.appendChild(formEl);
        document.body.appendChild(container);

        window.MktoForms2.loadForm(MARKETO_BASE_URL, MARKETO_MUNCHKIN_ID, MARKETO_FORM_ID);

        // whenReady fires after the form AND cross-domain iframe are fully set up.
        // The loadForm callback only means the form DOM is ready, not the XD bridge.
        window.MktoForms2.whenReady((form) => {
          console.log('[Marketo] Form ready (whenReady)');
          resolve(form);
        });
      }),
  );

  return formPromise;
}

// ---------------------------------------------------------------------------
// Submit helper
// ---------------------------------------------------------------------------

const SUBMIT_TIMEOUT_MS = 15_000;

export function submitMarketoForm(form: MktoForm, data: Record<string, string>): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      console.warn('[Marketo] Submission timed out after', SUBMIT_TIMEOUT_MS, 'ms');
      reject(new Error('Marketo submission timed out'));
    }, SUBMIT_TIMEOUT_MS);

    // Register onSuccess BEFORE setting values / submitting
    form.onSuccess(() => {
      console.log('[Marketo] onSuccess fired — submission successful');
      clearTimeout(timer);
      resolve();
      return false; // prevent Marketo redirect
    });

    // Populate field values
    form.vals(data);
    form.addHiddenFields(data);
    form.submittable(true);

    console.log('[Marketo] Calling form.submit() with data:', Object.keys(data));
    form.submit();
  });
}
