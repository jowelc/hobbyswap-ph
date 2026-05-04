import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';

const APP_URL = process.env.NEXTAUTH_URL ?? 'https://hobbyswap.vercel.app';

const NOTIFICATION_LABELS: Record<string, string> = {
  watchlist_available:    "A card you're watching is available for trade",
  watchlist_unavailable:  "A card you're watching is no longer for trade",
  watchlist_price_change: "A card you're watching changed price",
  watchlist_deleted:      "A card you're watching was removed",
  offer_accepted:         'Your trade offer was accepted',
  offer_declined:         'Your trade offer was declined',
  offer_retracted:        'A trade offer was retracted',
  offer_deleted:          'A trade offer was removed',
  deal_done:              'A trade was completed',
};

function buildHtml(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px 16px;border-bottom:1px solid #334155;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td><div style="width:32px;height:32px;background:linear-gradient(135deg,#3b82f6,#9333ea);border-radius:8px;display:inline-block;text-align:center;line-height:32px;color:#fff;font-weight:900;font-size:13px;">HS</div></td>
              <td style="padding-left:10px;vertical-align:middle;"><span style="color:#fff;font-weight:700;font-size:15px;">HobbySwap <span style="color:#60a5fa;">PH</span></span></td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#60a5fa;text-transform:uppercase;letter-spacing:0.08em;">Notification</p>
            <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#fff;line-height:1.3;">${subject}</p>
            <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">${body}</p>
            <a href="${APP_URL}/profile" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:10px;">View on HobbySwap PH</a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #334155;">
            <p style="margin:0;font-size:11px;color:#475569;line-height:1.5;">
              You're receiving this because you have email notifications enabled on HobbySwap PH.<br>
              <a href="${APP_URL}/profile" style="color:#60a5fa;text-decoration:none;">Manage your notification settings</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function parseSender(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: 'HobbySwap PH', email: raw.trim() };
}

export async function sendEmail({
  to,
  toName,
  subject,
  html,
}: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[email] BREVO_API_KEY not set — skipping email send');
    return;
  }

  const fromRaw = process.env.EMAIL_FROM ?? 'HobbySwap PH <noreply@hobbyswap.ph>';
  const sender  = parseSender(fromRaw);

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: {
      'api-key':      apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender,
      to:          [{ email: to, name: toName ?? to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error(`[email] Brevo error ${res.status}:`, detail);
  }
}

export async function maybeEmailNotification(
  recipientUserId: string,
  type: string,
  body: string,
): Promise<void> {
  if (!process.env.BREVO_API_KEY) return;

  const [user] = await db
    .select({ email: users.email, displayName: users.displayName, emailNotificationsEnabled: users.emailNotificationsEnabled })
    .from(users)
    .where(eq(users.id, recipientUserId))
    .limit(1);

  if (!user?.emailNotificationsEnabled) return;

  const subject = NOTIFICATION_LABELS[type] ?? 'New notification on HobbySwap PH';

  await sendEmail({
    to:      user.email,
    toName:  user.displayName || undefined,
    subject,
    html:    buildHtml(subject, body),
  }).catch((err: unknown) => {
    console.error('[email] Failed to send notification email:', err);
  });
}
