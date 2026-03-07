// Vercel Serverless Function — POST /api/send-vote-result
// Sends result email with a Google Calendar ICS attachment.
// Required env vars: EMAIL_USER, EMAIL_PASSWORD, REACT_APP_FIREBASE_DATABASE_URL

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const DB_URL = process.env.REACT_APP_FIREBASE_DATABASE_URL;

function hashPhrase(text) {
  if (!text) return '';
  return crypto.createHash('sha256').update(text).digest('hex');
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function getGroup(groupId) {
  if (!DB_URL || !groupId) return null;
  const url = `${DB_URL.replace(/\/$/, '')}/groups/${groupId}.json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('[send-vote-result] Failed to fetch group:', err.message);
    return null;
  }
}

function formatICSDate(dateStr) {
  // dateStr is YYYY-MM-DD; convert to YYYYMMDD for ICS all-day format
  return dateStr.replace(/-/g, '');
}

function generateICS({ title, startDate, endDate, description }) {
  // endDate in ICS all-day events is exclusive (day after last day)
  const end = new Date(endDate);
  end.setDate(end.getDate() + 1);
  const endStr = end.toISOString().split('T')[0].replace(/-/g, '');
  const startStr = formatICSDate(startDate);
  const uid = `${Date.now()}@findaday`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Find A Day//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startStr}`,
    `DTEND;VALUE=DATE:${endStr}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

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

  const { groupId, adminToken, winnerStartDate, winnerEndDate, baseUrl } = req.body ?? {};

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service is not configured' });
  }

  if (!groupId || !adminToken) {
    return res.status(400).json({ error: 'groupId and adminToken are required' });
  }

  if (!winnerStartDate || !winnerEndDate) {
    return res.status(400).json({ error: 'winnerStartDate and winnerEndDate are required' });
  }

  // 1. Fetch group data securely from Firebase
  const group = await getGroup(groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  // 2. Verify admin ownership
  if (!group.adminTokenHash || !timingSafeEqual(hashPhrase(adminToken), group.adminTokenHash)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin token' });
  }

  // 3. Sanitize and validate logic
  const candidates = group.poll?.candidates;
  if (!candidates) {
    return res.status(400).json({ error: 'No active poll candidates found for this group' });
  }
  const isValidCandidate = Object.values(candidates).some(
    c => c.startDate === winnerStartDate && c.endDate === winnerEndDate
  );
  if (!isValidCandidate) {
    return res.status(400).json({ error: 'Provided winner dates do not match any candidate in the current poll' });
  }

  const groupName = escapeHtml(group.name || 'Your event');

  // Extract participants purely server-side
  const rawParticipants = group.participants ? Object.values(group.participants) : [];
  const recipients = [...new Set(
    rawParticipants.filter(p => typeof p.email === 'string' && p.email.includes('@')).map(p => p.email)
  )];

  if (recipients.length === 0) {
    return res.status(400).json({ error: 'No participants with email addresses' });
  }

  // Derive origin
  const origin = process.env.APP_BASE_URL || baseUrl || 'https://vacation-scheduler.vercel.app';
  const groupLink = `${origin}?group=${groupId}`;

  const dateDisplay = winnerStartDate === winnerEndDate
    ? formatDate(winnerStartDate)
    : `${formatDate(winnerStartDate)} – ${formatDate(winnerEndDate)}`;

  const icsContent = generateICS({
    title: group.name || 'Group Event',
    startDate: winnerStartDate,
    endDate: winnerEndDate,
    description: `Scheduled via Find A Day. ${groupLink}`,
  });

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:12px;overflow:hidden;">
      <div style="background:#1e3a5f;padding:32px 32px 24px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#f97316;">Find A Day</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Date confirmed!</p>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 8px;font-size:20px;color:#f1f5f9;">
          🎉 "${groupName}" is happening!
        </h2>
        <p style="color:#f97316;font-size:24px;font-weight:700;margin:0 0 24px;">${dateDisplay}</p>
        <p style="color:#cbd5e1;line-height:1.6;margin:0 0 24px;">
          The group has voted and the date is set. A calendar invite is attached — add it to your calendar!
        </p>
        <a href="${groupLink}"
           style="display:inline-block;padding:14px 28px;background:#f97316;color:#fff;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;">
          View Planning Page →
        </a>
        <p style="color:#475569;font-size:12px;margin:32px 0 0;border-top:1px solid #1e293b;padding-top:20px;">
          Sent via Find A Day.
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
      from: `"Find A Day" <${process.env.EMAIL_FROM || 'noreply@findaday.app'}>`,
      to: process.env.EMAIL_FROM || 'noreply@findaday.app', // Neutral To
      bcc: recipients,
      subject: `Date confirmed — "${groupName}"`,
      html,
      attachments: [
        {
          filename: 'event.ics',
          content: icsContent,
          contentType: 'text/calendar; method=REQUEST',
        },
      ],
    });

    return res.status(200).json({ success: true, sentTo: recipients.length });
  } catch (err) {
    console.error('[send-vote-result] Failed:', err.message);
    return res.status(500).json({ error: 'Failed to send email', detail: err.message });
  }
};

