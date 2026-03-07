// Vercel Serverless Function — POST /api/send-welcome
// Sends a welcome email to the admin after a group is created.
// Required env vars: EMAIL_USER, EMAIL_PASSWORD (Gmail App Password)

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { groupId, adminToken, groupName, startDate, endDate, adminEmail, baseUrl } = req.body ?? {};

  if (!adminEmail) {
    return res.status(200).json({ success: true, skipped: true });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[send-welcome] RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email service is not configured' });
  }

  const origin = baseUrl || 'https://vacation-scheduler.vercel.app';
  const participantLink = `${origin}?group=${groupId}`;
  const adminLink = `${origin}?group=${groupId}&admin=${adminToken}`;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:12px;overflow:hidden;">
      <div style="background:#1e3a5f;padding:32px 32px 24px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#60a5fa;">Vacation Scheduler</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Your group has been created 🎉</p>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 8px;font-size:20px;color:#f1f5f9;">${groupName || 'Your Trip'}</h2>
        <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">
          ${formatDate(startDate)} → ${formatDate(endDate)}
        </p>

        <p style="color:#cbd5e1;line-height:1.6;margin:0 0 24px;">
          Here are your important links — <strong>save this email</strong>. The admin link is the only way to access your admin panel.
        </p>

        <div style="margin-bottom:16px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Share with participants</p>
          <a href="${participantLink}" style="display:block;padding:12px 16px;background:#1e293b;border-radius:8px;color:#60a5fa;text-decoration:none;font-size:13px;word-break:break-all;">${participantLink}</a>
        </div>

        <div style="margin-bottom:16px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Your admin link (keep private)</p>
          <a href="${adminLink}" style="display:block;padding:12px 16px;background:#1e293b;border-radius:8px;color:#60a5fa;text-decoration:none;font-size:13px;word-break:break-all;">${adminLink}</a>
        </div>

        <div style="margin-bottom:28px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Group ID</p>
          <code style="display:block;padding:12px 16px;background:#1e293b;border-radius:8px;color:#818cf8;font-size:13px;">${groupId}</code>
        </div>

        <p style="color:#475569;font-size:12px;margin:0;border-top:1px solid #1e293b;padding-top:20px;">
          You're receiving this because you created a vacation planning group.<br>
          Sent by Vacation Scheduler.
        </p>
      </div>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });

    await transporter.sendMail({
      from: `"Vacation Scheduler" <${process.env.EMAIL_FROM || 'noreply@findaday.app'}>`,
      to: adminEmail,
      subject: `🎉 Your group "${groupName || 'Trip'}" is ready — save your admin link`,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[send-welcome] Failed to send email:', err.message);
    return res.status(500).json({ error: 'Failed to send email', detail: err.message });
  }
};
