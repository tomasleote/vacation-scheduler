// Vercel Serverless Function — POST /api/send-reminder
// Sends a reminder to all participants who have an email address.
// Required env var: RESEND_API_KEY

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { groupId, groupName, startDate, participants, baseUrl } = req.body ?? {};

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('[send-reminder] RESEND_API_KEY is not set');
        return res.status(500).json({ error: 'Email service is not configured' });
    }

    // Collect participants who have an email address
    const recipients = Array.isArray(participants)
        ? participants.filter((p) => p.email && p.email.includes('@')).map((p) => p.email)
        : [];

    if (recipients.length === 0) {
        return res.status(400).json({ error: 'No participants with email addresses found' });
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
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Vacation Scheduler <onboarding@resend.dev>',
                to: recipients,
                subject: `Reminder: update your availability for "${groupName || 'the trip'}"`,
                html,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('[send-reminder] Resend API error:', data);
            return res.status(502).json({ error: data.message || 'Failed to send email' });
        }
        return res.status(200).json({ success: true, sentTo: recipients.length, id: data.id });
    } catch (err) {
        console.error('[send-reminder] Unexpected error:', err);
        return res.status(500).json({ error: 'Unexpected server error' });
    }
}
