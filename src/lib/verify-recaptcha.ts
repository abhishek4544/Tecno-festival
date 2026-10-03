import 'server-only';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

const MIN_SCORE = 0.5;

type SiteVerifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
  'error-codes'?: string[];
};

export async function verifyRecaptcha(
  token: string | null,
  expectedAction: string,
  remoteIp: string | null,
): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('RECAPTCHA_SECRET_KEY is not set; rejecting submission');
      return false;
    }
    console.warn('RECAPTCHA_SECRET_KEY is not set; skipping verification');
    return true;
  }

  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body });
    const result = (await response.json()) as SiteVerifyResponse;

    if (!result.success) {
      console.warn('reCAPTCHA verification failed', result['error-codes']);
      return false;
    }

    return result.action === expectedAction && (result.score ?? 0) >= MIN_SCORE;
  } catch (error) {
    console.error('reCAPTCHA verification request failed', error);
    return false;
  }
}
