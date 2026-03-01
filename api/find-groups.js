// Vercel Serverless Function — POST /api/find-groups
// Scans all groups in Firebase for the provided email (case-insensitive, adminEmail field).
// Sends a summary email listing each matching group with its ID, dates, and participant link.
// Admin links are NOT included (adminToken is never stored — only its hash is).
// Required env vars: REACT_APP_FIREBASE_DATABASE_URL, EMAIL_USER, EMAIL_PASSWORD

const nodemailer = require('nodemailer');

const DB_URL = process.env.REACT_APP_FIREBASE_DATABASE_URL;

async function getAllGroups() {
    const url = `${DB_URL.replace(/\/$/, '')}/groups.json?shallow=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return {};
    return (await res.json()) ?? {};
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!DB_URL) {
        return res.status(500).json({ error: 'Database not configured' });
    }
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        return res.status(500).json({ error: 'Email service is not configured' });
    }

    const { email, baseUrl } = req.body ?? {};
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required' });
    }

    const targetEmail = email.trim().toLowerCase();

    // Scan all groups for adminEmail match
    let allGroups;
    try {
        allGroups = await getAllGroups();
    } catch (err) {
        console.error('[find-groups] Failed to read groups:', err.message);
        return res.status(500).json({ error: 'Failed to search groups' });
    }

    const origin = baseUrl || req.headers.origin || 'https://vacation-scheduler.vercel.app';

    const matches = Object.values(allGroups || {}).filter(
        (g) => g && g.adminEmail && g.adminEmail.trim().toLowerCase() === targetEmail
    );

    // Always respond with success to prevent email enumeration attacks
    if (matches.length === 0) {
        // Send a "no groups found" email anyway so the UX feels consistent
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
        });
        await transporter.sendMail({
            from: `"Vacation Scheduler" <${process.env.EMAIL_USER}>`,
            to: targetEmail,
            subject: 'No groups found for your email — Vacation Scheduler',
            html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:12px;overflow:hidden;">
          <div style="background:#1e3a5f;padding:28px 28px 20px;">
            <h1 style="margin:0;font-size:20px;font-weight:700;color:#60a5fa;">Vacation Scheduler</h1>
          </div>
          <div style="padding:28px;">
            <p style="color:#cbd5e1;">We searched all groups but found no admin groups associated with <strong>${targetEmail}</strong>.</p>
            <p style="color:#94a3b8;font-size:13px;">If you used a different email when creating your group, try that address instead.</p>
          </div>
        </div>`,
        });
        return res.status(200).json({ found: 0 });
    }

    const formatDate = (d) => {
        if (!d) return '?';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const groupCards = matches
        .map((g) => {
            const participantLink = `${origin}?group=${g.id}`;
            return `
        <div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:12px;">
          <h3 style="margin:0 0 6px;font-size:16px;color:#f1f5f9;">${g.name || 'Unnamed group'}</h3>
          <p style="margin:0 0 10px;font-size:13px;color:#94a3b8;">${formatDate(g.startDate)} → ${formatDate(g.endDate)}</p>
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Group ID</p>
          <code style="display:block;padding:8px 10px;background:#0f172a;border-radius:6px;color:#818cf8;font-size:12px;margin-bottom:10px;">${g.id}</code>
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Participant link</p>
          <a href="${participantLink}" style="display:block;padding:8px 10px;background:#0f172a;border-radius:6px;color:#60a5fa;text-decoration:none;font-size:12px;word-break:break-all;">${participantLink}</a>
        </div>`;
        })
        .join('');

    const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:12px;overflow:hidden;">
      <div style="background:#1e3a5f;padding:28px 28px 20px;">
        <h1 style="margin:0;font-size:20px;font-weight:700;color:#60a5fa;">Vacation Scheduler</h1>
        <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Your groups</p>
      </div>
      <div style="padding:28px;">
        <p style="color:#cbd5e1;margin:0 0 20px;line-height:1.6;">
          We found <strong>${matches.length} group${matches.length !== 1 ? 's' : ''}</strong> associated with <strong>${targetEmail}</strong>:
        </p>
        ${groupCards}
        <div style="background:#1e293b;border-radius:8px;padding:14px;margin-top:16px;">
          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
            🔑 <strong style="color:#f1f5f9;">To get your admin link</strong>: go to the home page, click <em>Recover</em>, enter the Group ID above and your email. A fresh admin link will be sent to you.
          </p>
        </div>
        <p style="color:#475569;font-size:12px;margin:24px 0 0;border-top:1px solid #1e293b;padding-top:16px;">
          You're receiving this because someone looked up groups for this email address.<br>
          Sent by Vacation Scheduler.
        </p>
      </div>
    </div>`;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
        });
        await transporter.sendMail({
            from: `"Vacation Scheduler" <${process.env.EMAIL_USER}>`,
            to: targetEmail,
            subject: `Your ${matches.length} Vacation Scheduler group${matches.length !== 1 ? 's' : ''}`,
            html,
        });
        return res.status(200).json({ found: matches.length });
    } catch (err) {
        console.error('[find-groups] Failed to send email:', err.message);
        return res.status(500).json({ error: 'Failed to send email' });
    }
};
