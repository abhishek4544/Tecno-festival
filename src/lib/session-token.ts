// Signed admin session token: `<expiresAtMs>.<hmac-sha256 signature>`.
// Uses only Web Crypto so it runs in both proxy.ts and server code.

export const SESSION_COOKIE = "admin_session"
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

const encoder = new TextEncoder()

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set (at least 32 characters)")
  }
  return secret
}

function importKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

function toBase64Url(bytes: ArrayBuffer) {
  return Buffer.from(bytes).toString("base64url")
}

export async function signSessionToken(expiresAt: number) {
  const payload = String(expiresAt)
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importKey(),
    encoder.encode(payload),
  )
  return `${payload}.${toBase64Url(signature)}`
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return false

  const expiresAt = Number(payload)
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false

  // crypto.subtle.verify compares in constant time.
  return crypto.subtle.verify(
    "HMAC",
    await importKey(),
    Buffer.from(signature, "base64url"),
    encoder.encode(payload),
  )
}
