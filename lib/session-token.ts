/**
 * Signed session tokens for magic-link authenticated sessions.
 *
 * Format: base64url(payload).base64url(hmac)
 * HMAC-SHA256 over the payload using DMSA_SESSION_SECRET (or DMSA_TOKEN_SALT).
 */

import crypto from 'crypto';

export interface SessionPayload {
  email: string;
  surveyIds: string[];
  expiresAt: number;
}

function getSecret(): Buffer {
  const secret = process.env.DMSA_SESSION_SECRET || process.env.DMSA_TOKEN_SALT;
  if (!secret) {
    throw new Error(
      'DMSA_SESSION_SECRET (or DMSA_TOKEN_SALT) must be set to sign session tokens'
    );
  }
  return Buffer.from(secret, 'utf8');
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString('base64url');
}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}

export function signSessionToken(payload: SessionPayload): string {
  const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
  const mac = crypto.createHmac('sha256', getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${b64urlEncode(mac)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, macB64] = parts;

  let providedMac: Buffer;
  try {
    providedMac = b64urlDecode(macB64);
  } catch {
    return null;
  }

  const expectedMac = crypto
    .createHmac('sha256', getSecret())
    .update(payloadB64)
    .digest();

  if (
    providedMac.length !== expectedMac.length ||
    !crypto.timingSafeEqual(providedMac, expectedMac)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8')) as SessionPayload;
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.email !== 'string' ||
      !Array.isArray(payload.surveyIds) ||
      !payload.surveyIds.every((id) => typeof id === 'string') ||
      typeof payload.expiresAt !== 'number'
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
