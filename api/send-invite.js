// Vercel Serverless Function — POST /api/send-invite
// Sends a personal invite email to a single participant with their unique link.
// Required env vars: EMAIL_USER, EMAIL_PASSWORD (Gmail App Password)
// Optional env var: CANONICAL_BASE_URL (overrides client-provided baseUrl)

const nodemailer = require('nodemailer');

/**
 * Escapes HTML special characters to prevent injection.
 */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Allowed URL patterns for baseUrl whitelist.
 * Falls back to CANONICAL_BASE_URL env var, then to a safe default.
 */
function getSafeOrigin(requestBaseUrl) {
  // Always prefer server-configured canonical URL
  if (process.env.CANONICAL_BASE_URL) {
    return process.env.CANONICAL_BASE_URL.replace(/\/+$/, '');
  }

  // Whitelist: only allow HTTPS origins or localhost for dev
  if (requestBaseUrl) {
    try {
      const url = new URL(requestBaseUrl);
      const isLocalDev = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      const isSafeProtocol = url.protocol === 'https:' || (isLocalDev && url.protocol === 'http:');
      if (isSafeProtocol) {
        return url.origin;
      }
    } catch {
      // invalid URL — fall through to default
    }
  }

  return 'https://vacation-scheduler.vercel.app';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { participantName, participantEmail, groupId, groupName, participantId, baseUrl } = req.body ?? {};

  if (!participantEmail || !participantEmail.includes('@')) {
    return res.status(400).json({ error: 'A valid participant email is required' });
  }

  if (!groupId || !participantId) {
    return res.status(400).json({ error: 'groupId and participantId are required' });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('[send-invite] EMAIL_USER or EMAIL_PASSWORD is not set');
    return res.status(500).json({ error: 'Email service is not configured' });
  }

  const origin = getSafeOrigin(baseUrl);
  const params = new URLSearchParams({ group: groupId, p: participantId });
  const personalLink = `${origin}?${params.toString()}`;

  const safeName = escapeHtml(participantName || 'there');
  const safeGroupName = escapeHtml(groupName || 'a vacation planning group');
  const safeGroupNameSubject = escapeHtml(groupName || 'a trip');

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:12px;overflow:hidden;">
      <div style="background:#1e3a5f;padding:32px 32px 24px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#60a5fa;">Vacation Scheduler</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">You've been invited to join a trip! 🎉</p>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 8px;font-size:20px;color:#f1f5f9;">Hi ${safeName}!</h2>
        <p style="color:#cbd5e1;line-height:1.6;margin:0 0 24px;">
          You've been added to <strong style="color:#f1f5f9;">${safeGroupName}</strong>. 
          Use your personal link below to mark your available dates.
        </p>

        <div style="margin-bottom:24px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Your personal link</p>
          <a href="${personalLink}" style="display:block;padding:12px 16px;background:#1e293b;border-radius:8px;color:#60a5fa;text-decoration:none;font-size:13px;word-break:break-all;">${escapeHtml(personalLink)}</a>
        </div>

        <a href="${personalLink}"
           style="display:inline-block;padding:14px 28px;background:#3b82f6;color:#fff;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;">
          Mark Your Dates →
        </a>

        <p style="color:#475569;font-size:12px;margin:32px 0 0;border-top:1px solid #1e293b;padding-top:20px;">
          You're receiving this because you were added to a vacation planning group.<br>
          Sent by Vacation Scheduler.
        </p>
      </div>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Vacation Scheduler" <${process.env.EMAIL_USER}>`,
      to: participantEmail,
      subject: `You're invited to "${safeGroupNameSubject}" — mark your available dates`,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[send-invite] Failed to send email:', err.message);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
