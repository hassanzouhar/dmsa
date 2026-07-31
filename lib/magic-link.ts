/**
 * Magic Link Authentication Service
 *
 * Genererer og verifiserer sikre magic links for e-postbasert innlogging.
 *
 * Endringer fra Firestore-versjonen:
 *  - Tokenet lagres ikke lenger i klartekst ved siden av hashen.
 *  - `used`-feltet er borte. Det ble satt, men aldri håndhevet — lenken har
 *    alltid vært gjenbrukbar i gyldighetsperioden.
 *  - Opprydningsjobben for utløpte lenker er fjernet; utløp filtreres i
 *    spørringen (`expires_at > now()`).
 */

import crypto from 'crypto';
import { consumeMagicLink, hashEmail, insertMagicLink } from './db';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 timer (gjenbrukbar)
const SALT = process.env.DMSA_TOKEN_SALT || 'default-magic-link-salt';

export function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token + SALT).digest('hex');
}

/**
 * Opprett en magic link for en e-postadresse.
 * Returnerer tokenet som skal sendes på e-post — det lagres aldri.
 */
export async function createMagicLink(email: string): Promise<{
  token: string;
  expiry: Date;
  emailHash: string;
}> {
  const token = generateMagicLinkToken();
  const emailHash = hashEmail(email);
  const expiry = new Date(Date.now() + TOKEN_EXPIRY_MS);

  await insertMagicLink({
    tokenHash: hashToken(token),
    emailHash,
    expiresAt: expiry,
  });

  console.log(`✅ Created magic link for email hash: ${emailHash}`);

  return { token, expiry, emailHash };
}

/**
 * Verifiser et magic-link-token og registrer bruken.
 *
 * Oppslag, e-postsjekk, utløpssjekk og bruksregistrering skjer i én
 * UPDATE ... RETURNING, så det trengs ingen transaksjon.
 */
export async function verifyMagicLinkToken(
  token: string,
  email: string
): Promise<{ valid: boolean; emailHash?: string; reason?: string }> {
  try {
    const row = await consumeMagicLink({
      tokenHash: hashToken(token),
      emailHash: hashEmail(email),
    });

    if (!row) {
      // Vi skiller bevisst ikke mellom «finnes ikke», «feil e-post» og
      // «utløpt» utad — det ville lekket hvilke tokens som eksisterer.
      console.warn('❌ Magic link verification failed');
      return { valid: false, reason: 'Invalid or expired link' };
    }

    console.log(`✅ Magic link verified for email hash: ${row.email_hash}`);
    return { valid: true, emailHash: row.email_hash };
  } catch (error) {
    console.error('Failed to verify magic link:', error);
    return { valid: false, reason: 'Verification error' };
  }
}
