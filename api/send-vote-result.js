// Vercel Serverless Function — POST /api/send-vote-result
// Sends result email with a Google Calendar ICS attachment.
// Required env vars: EMAIL_USER, EMAIL_PASSWORD

const nodemailer = require('nodemailer');

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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { groupId, groupName, winnerStartDate, winnerEndDate, participants, baseUrl } = req.body ?? {};

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return res.status(500).json({ error: 'Email service is not configured' });
  }

  if (!winnerStartDate || !winnerEndDate) {
    return res.status(400).json({ error: 'winnerStartDate and winnerEndDate are required' });
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

  const dateDisplay = winnerStartDate === winnerEndDate
    ? formatDate(winnerStartDate)
    : `${formatDate(winnerStartDate)} – ${formatDate(winnerEndDate)}`;

  const icsContent = generateICS({
    title: groupName || 'Group Event',
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
          🎉 "${groupName || 'Your event'}" is happening!
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
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Find A Day" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject: `Date confirmed — "${groupName || 'your event'}"`,
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
