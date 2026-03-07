// Vercel Serverless Function — POST /api/send-vote-invite
// Notifies participants that a vote is open for them to cast.
// Required env vars: EMAIL_USER, EMAIL_PASSWORD (Gmail App Password)

const nodemailer = require('nodemailer');

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { groupId, groupName, participants, baseUrl } = req.body ?? {};

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('[send-vote-invite] EMAIL credentials not set');
    return res.status(500).json({ error: 'Email service is not configured' });
  }

  const allParticipants = Array.isArray(participants) ? participants : [];
  const recipients = [...new Set(
    allParticipants.filter(p => p.email && p.email.includes('@')).map(p => p.email)
  )];

  if (recipients.length === 0) {
    return res.status(400).json({ error: 'No participants with email addresses' });
  }

  const origin = baseUrl || 'https://vacation-scheduler.vercel.app';
  const groupLink = `${origin}?group=${groupId}`;

  const safeGroupName = escapeHtml(groupName || 'your event');

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:12px;overflow:hidden;">
      <div style="background:#1e3a5f;padding:32px 32px 24px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#f97316;">Find A Day</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Time to vote!</p>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 16px;font-size:20px;color:#f1f5f9;">
          🗳️ Vote on the best date for "${safeGroupName}"
        </h2>
        <p style="color:#cbd5e1;line-height:1.6;margin:0 0 24px;">
          The organizer has proposed a few date options and wants your vote.
          Head to the planning page and click the highlighted periods to cast your vote.
        </p>
        <a href="${groupLink}"
           style="display:inline-block;padding:14px 28px;background:#f97316;color:#fff;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;">
          Vote Now →
        </a>
        <p style="color:#475569;font-size:12px;margin:32px 0 0;border-top:1px solid #1e293b;padding-top:20px;">
          You're receiving this because you're a participant in a group event planning session.
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
      from: `"Find A Day" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER || 'noreply@findaday.app',
      bcc: recipients,
      subject: `Vote now — "${safeGroupName}"`,
      html,
    });

    return res.status(200).json({ success: true, sentTo: recipients.length });
  } catch (err) {
    console.error('[send-vote-invite] Failed:', err.message);
    return res.status(500).json({ error: 'Failed to send email', detail: err.message });
  }
};
