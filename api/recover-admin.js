// Vercel Serverless Function — POST /api/recover-admin
// Verifies identity (passphrase OR email) and issues a new adminToken.
// Env vars needed: REACT_APP_FIREBASE_DATABASE_URL, EMAIL_USER, EMAIL_PASSWORD

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const DB_URL = process.env.REACT_APP_FIREBASE_DATABASE_URL;

// SHA-256 hex hash (server-side, same algorithm as the browser-side hashPhrase)
function sha256(text) {
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
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

async function readGroup(groupId) {
    const url = `${DB_URL.replace(/\/$/, '')}/groups/${groupId}.json`;
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) return null;
        const data = await res.json();
        return data ?? null;
    } catch (err) {
        console.error(`[recover-admin] readGroup fetch error:`, err.message);
        if (err.name === 'AbortError' || err.name === 'TimeoutError') {
            throw new Error('Database timeout while reading group, please try again later.');
        }
        throw new Error('Failed to reach database while reading group.');
    }
}

async function writeNewAdminToken(groupId, newHash) {
    const url = `${DB_URL.replace(/\/$/, '')}/groups/${groupId}.json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminTokenHash: newHash }),
            signal: controller.signal
        });
        clearTimeout(timeout);
        return res.ok;
    } catch (err) {
        clearTimeout(timeout);
        console.error(`[recover-admin] writeNewAdminToken fetch error:`, err.message);
        if (err.name === 'AbortError') {
            throw new Error('Database timeout while updating admin token.');
        }
        return false;
    }
}

async function sendRecoveryEmail(adminEmail, groupName, adminLink) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return;
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    });
    await transporter.sendMail({
        from: `"Vacation Scheduler" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `🔑 Admin link recovered for "${escapeHtml(groupName || 'your group')}"`,
        html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:12px;overflow:hidden;">
        <div style="background:#1e3a5f;padding:28px 28px 20px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#60a5fa;">Vacation Scheduler</h1>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Admin link recovery</p>
        </div>
        <div style="padding:28px;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#f1f5f9;">🔑 Your new admin link</h2>
          <p style="color:#cbd5e1;line-height:1.6;margin:0 0 20px;">
            Your admin token has been reset. Use the link below to access your admin panel.<br>
            <strong>The old link is now invalid.</strong>
          </p>
          <a href="${escapeHtml(adminLink)}" style="display:block;padding:12px 16px;background:#1e293b;border-radius:8px;color:#60a5fa;text-decoration:none;font-size:13px;word-break:break-all;">${escapeHtml(adminLink)}</a>
          <p style="color:#475569;font-size:12px;margin:24px 0 0;border-top:1px solid #1e293b;padding-top:16px;">
            If you didn't request this, your admin link may be compromised. Contact support.<br>
            Sent by Vacation Scheduler.
          </p>
        </div>
      </div>
    `,
    });
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!DB_URL) {
        return res.status(500).json({ error: 'Database not configured' });
    }

    const { groupId, passphrase, email } = req.body ?? {};

    if (!groupId || (!passphrase && !email)) {
        return res.status(400).json({ error: 'groupId and either passphrase or email are required' });
    }

    let group;
    try {
        group = await readGroup(groupId.trim());
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
    } catch (err) {
        return res.status(err.message.includes('timeout') ? 504 : 502).json({ error: err.message });
    }

    // ── Verify identity ──────────────────────────────────────────────────────────
    if (passphrase) {
        const providedHash = passphrase.trim();
        if (!group.recoveryPasswordHash || providedHash !== group.recoveryPasswordHash) {
            return res.status(401).json({ error: 'Incorrect recovery passphrase' });
        }
    } else {
        const providedEmail = email.trim().toLowerCase();
        const storedEmail = (group.adminEmail || '').toLowerCase();
        if (!storedEmail || providedEmail !== storedEmail) {
            return res.status(401).json({ error: 'Email does not match the admin email for this group' });
        }
    }

    // ── Issue new admin token ────────────────────────────────────────────────────
    const newAdminToken = crypto.randomUUID();
    const newAdminHash = sha256(newAdminToken);

    let updated;
    try {
        updated = await writeNewAdminToken(groupId, newAdminHash);
        if (!updated) {
            return res.status(500).json({ error: 'Failed to update admin token in database' });
        }
    } catch (err) {
        return res.status(err.message.includes('timeout') ? 504 : 502).json({ error: err.message });
    }

    // ── Email recovery: also send the link by email ──────────────────────────────
    if (email && group.adminEmail) {
        const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://vacation-scheduler.vercel.app';
        const adminLink = `${origin}?group=${groupId}&admin=${newAdminToken}`;
        try {
            await sendRecoveryEmail(group.adminEmail, group.name, adminLink);
        } catch (err) {
            console.error('[recover-admin] Failed to send recovery email:', err.message);
            // Don't fail the request — token is already updated, client has it
        }
    }

    return res.status(200).json({ adminToken: newAdminToken });
};
