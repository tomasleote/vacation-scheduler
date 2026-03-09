// Vercel Serverless Function — POST /api/send-reminder
// Sends a reminder to all participants who have an email address.
// Required env vars: EMAIL_USER, EMAIL_PASSWORD (Gmail App Password)

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { groupId, groupName, startDate, participants, baseUrl } = req.body ?? {};

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('[send-reminder] EMAIL_USER or EMAIL_PASSWORD is not set');
    return res.status(500).json({ error: 'Email service is not configured' });
  }

  const DB_URL = process.env.REACT_APP_FIREBASE_DATABASE_URL;

  // Fetch participants from RTDB instead of trusting client-provided data
  let allParticipants = [];
  if (DB_URL && groupId) {
    try {
      const url = `${DB_URL.replace(/\/$/, '')}/groups/${groupId}/participants.json`;
      const dbRes = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (dbRes.ok) {
        const data = await dbRes.json();
        allParticipants = data ? Object.values(data) : [];
      }
    } catch (err) {
      console.error('[send-reminder] Failed to fetch participants from RTDB:', err.message);
    }
  }

  console.log(`[send-reminder] group="${groupName || groupId}", recipientCount=${allParticipants.filter(p => p.email && p.email.includes('@')).length}`);
  const recipients = [...new Set(
    allParticipants.filter((p) => p.email && p.email.includes('@')).map((p) => p.email)
  )];

  if (recipients.length === 0) {
    return res.status(400).json({
      error: 'No participants with email addresses found',
    });
  }

  const origin = baseUrl || 'https://vacation-scheduler.vercel.app';
  const groupLink = `${origin}?group=${groupId}`;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const dateLabel = startDate ? ` starting ${formatDate(startDate)}` : '';

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:12px;overflow:hidden;">
      <div style="background:#1e3a5f;padding:32px 32px 24px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#60a5fa;">Vacation Scheduler</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">A reminder from the trip organizer</p>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 16px;font-size:20px;color:#f1f5f9;">
          📅 ${groupName || 'Your upcoming trip'}${dateLabel}
        </h2>

        <p style="color:#cbd5e1;line-height:1.6;margin:0 0 24px;">
          The organizer has sent you a reminder to check the vacation planning page.
        </p>

        <ul style="color:#cbd5e1;line-height:1.8;margin:0 0 28px;padding-left:20px;">
          <li>Update your <strong>availability</strong> if you haven't already</li>
          <li>Check the <strong>heatmap</strong> to see when most people overlap</li>
          <li>View the <strong>top overlap periods</strong> with the best match</li>
        </ul>

        <a href="${groupLink}"
           style="display:inline-block;padding:14px 28px;background:#3b82f6;color:#fff;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;">
          Open Vacation Planner →
        </a>

        <p style="color:#475569;font-size:12px;margin:32px 0 0;border-top:1px solid #1e293b;padding-top:20px;">
          You're receiving this because you're a participant in a vacation planning group.<br>
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
      to: recipients,
      subject: `Reminder: update your availability for "${groupName || 'the trip'}"`,
      html,
    });

    return res.status(200).json({ success: true, sentTo: recipients.length });
  } catch (err) {
    console.error('[send-reminder] Failed to send email:', err.message);
    return res.status(500).json({ error: 'Failed to send email', detail: err.message });
  }
};
