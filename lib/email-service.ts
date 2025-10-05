/**
 * Email Service using Resend
 *
 * Handles sending transactional emails (magic links, assessment notifications, etc.)
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Digital Modenhet <noreply@updates.rastla.us>';
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'https://digital-modenhet.rastla.us';

interface MagicLinkEmailParams {
  email: string;
  token: string;
  surveyCount: number;
  expiryDate: Date;
}

interface AssessmentCompleteEmailParams {
  email: string;
  surveyId: string;
  retrievalToken: string;
  overallScore?: number;
}

/**
 * Send magic link email for multi-survey access
 */
export async function sendMagicLinkEmail(
  params: MagicLinkEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { email, token, surveyCount, expiryDate } = params;

  const magicLinkUrl = `${BASE_URL}/access?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(email)}`;

  const expiryTime = expiryDate.toLocaleTimeString('no-NO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tilgang til dine Digital Modenhet vurderinger</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Digital Modenhet</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Tilgang til dine vurderinger</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

    <p style="font-size: 16px; margin-bottom: 20px;">Hei!</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Du har bedt om tilgang til dine Digital Modenhet vurderinger. Klikk på knappen nedenfor for å se alle dine ${surveyCount} ${surveyCount === 1 ? 'vurdering' : 'vurderinger'}:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLinkUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Se mine vurderinger
      </a>
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 25px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⏰ Viktig:</strong> Denne lenken utløper kl. ${expiryTime} i dag. Be om en ny lenke hvis denne har utløpt.
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      Når du får tilgang kan du:
    </p>
    <ul style="font-size: 14px; color: #6b7280; margin-top: 10px;">
      <li>Se alle dine fullførte vurderinger</li>
      <li>Laste ned PDF-rapporter</li>
      <li>Sammenligne resultater over tid</li>
      <li>Administrere synlighet på resultattavlen</li>
    </ul>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Hvis du ikke ba om denne lenken, kan du trygt ignorere denne e-posten.
      </p>
      <p style="font-size: 12px; color: #9ca3af; margin: 10px 0 0 0;">
        Direkte lenke (kopier hvis knappen ikke virker):<br>
        <a href="${magicLinkUrl}" style="color: #667eea; word-break: break-all;">${magicLinkUrl}</a>
      </p>
    </div>

  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">Digital Modenhet - EU/JRC Digital Maturity Assessment</p>
    <p style="margin: 5px 0 0 0;">
      <a href="${BASE_URL}" style="color: #667eea; text-decoration: none;">digital-modenhet.rastla.us</a>
    </p>
  </div>

</body>
</html>
  `;

  const textContent = `
Digital Modenhet - Tilgang til dine vurderinger

Hei!

Du har bedt om tilgang til dine Digital Modenhet vurderinger.

Klikk på lenken nedenfor for å se alle dine ${surveyCount} ${surveyCount === 1 ? 'vurdering' : 'vurderinger'}:

${magicLinkUrl}

⏰ VIKTIG: Denne lenken utløper kl. ${expiryTime} i dag.

Når du får tilgang kan du:
- Se alle dine fullførte vurderinger
- Laste ned PDF-rapporter
- Sammenligne resultater over tid
- Administrere synlighet på resultattavlen

Hvis du ikke ba om denne lenken, kan du trygt ignorere denne e-posten.

---
Digital Modenhet - EU/JRC Digital Maturity Assessment
${BASE_URL}
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Tilgang til dine ${surveyCount} Digital Modenhet ${surveyCount === 1 ? 'vurdering' : 'vurderinger'}`,
      html: htmlContent,
      text: textContent,
    });

    if (result.data?.id) {
      console.log(`✅ Magic link email sent to ${email} (ID: ${result.data.id})`);
      return { success: true, messageId: result.data.id };
    } else {
      console.error('❌ Failed to send magic link email:', result.error);
      return { success: false, error: result.error?.message || 'Unknown error' };
    }
  } catch (error) {
    console.error('❌ Error sending magic link email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send assessment completion notification (optional feature)
 */
export async function sendAssessmentCompleteEmail(
  params: AssessmentCompleteEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { email, surveyId, retrievalToken, overallScore } = params;

  const resultsUrl = `${BASE_URL}/results?id=${surveyId}&token=${encodeURIComponent(
    retrievalToken
  )}`;

  const scoreText = overallScore
    ? `Din totale poengsum er ${Math.round(overallScore)}/100.`
    : 'Se dine resultater for detaljer.';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Din Digital Modenhet vurdering er klar</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Vurderingen er fullført!</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

    <p style="font-size: 16px; margin-bottom: 20px;">Gratulerer med fullført Digital Modenhet vurdering!</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      ${scoreText}
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resultsUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Se resultater
      </a>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 5px; margin: 25px 0;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>📋 RapportID:</strong> <code style="background: white; padding: 2px 8px; border-radius: 3px; font-family: monospace;">${surveyId}</code>
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #1e40af;">
        Lagre denne ID-en for å hente rapporten senere.
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      Dine resultater inkluderer:
    </p>
    <ul style="font-size: 14px; color: #6b7280; margin-top: 10px;">
      <li>Total modenhet poengsum og klassifisering</li>
      <li>Detaljert analyse av alle 6 dimensjoner</li>
      <li>Bransjebenchmarks</li>
      <li>Anbefalinger for forbedring</li>
      <li>Nedlastbar PDF-rapport</li>
    </ul>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Du kan når som helst be om tilgang til alle dine vurderinger ved å bruke din e-postadresse på siden "Mine vurderinger".
      </p>
    </div>

  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">Digital Modenhet - EU/JRC Digital Maturity Assessment</p>
    <p style="margin: 5px 0 0 0;">
      <a href="${BASE_URL}" style="color: #667eea; text-decoration: none;">digital-modenhet.rastla.us</a>
    </p>
  </div>

</body>
</html>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '🎉 Din Digital Modenhet vurdering er klar!',
      html: htmlContent,
    });

    if (result.data?.id) {
      console.log(
        `✅ Assessment complete email sent to ${email} (ID: ${result.data.id})`
      );
      return { success: true, messageId: result.data.id };
    } else {
      console.error('❌ Failed to send assessment email:', result.error);
      return { success: false, error: result.error?.message || 'Unknown error' };
    }
  } catch (error) {
    console.error('❌ Error sending assessment email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
