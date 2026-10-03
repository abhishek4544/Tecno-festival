type Grecaptcha = {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export const ENTRY_RECAPTCHA_ACTION = 'submit_entry';

export const RECAPTCHA_ERROR_MESSAGE =
  'We couldn’t verify your submission. Please refresh the page and try again.';

export const RECAPTCHA_SCRIPT_URL = RECAPTCHA_SITE_KEY
  ? `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
  : null;

const RECAPTCHA_TIMEOUT_MS = 10_000;
const SCRIPT_POLL_MS = 100;

// Resolves once the script has defined `window.grecaptcha`, so a submit right
// after page load waits for it instead of failing.
function waitForGrecaptcha(): Promise<Grecaptcha> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    function check() {
      if (window.grecaptcha) return resolve(window.grecaptcha);
      if (Date.now() - startedAt >= RECAPTCHA_TIMEOUT_MS) {
        return reject(new Error('reCAPTCHA script did not load'));
      }
      setTimeout(check, SCRIPT_POLL_MS);
    }

    check();
  });
}

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(message)),
      RECAPTCHA_TIMEOUT_MS,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// Returns null only when reCAPTCHA isn't configured. Otherwise it resolves to
// a token or throws, so callers can block the submission on any failure.
export async function getRecaptchaToken(
  action: string,
): Promise<string | null> {
  const siteKey = RECAPTCHA_SITE_KEY;
  if (!siteKey) return null;

  const grecaptcha = await waitForGrecaptcha();
  const token = await withTimeout(
    new Promise<string>((resolve, reject) => {
      grecaptcha.ready(() => {
        grecaptcha.execute(siteKey, { action }).then(resolve, reject);
      });
    }),
    'reCAPTCHA did not return a token',
  );

  if (!token) throw new Error('reCAPTCHA returned an empty token');
  return token;
}
