// api/og.js — Vercel Serverless Function approach
const fs = require('fs');
const path = require('path');

// Initialize Firebase (use REST API to avoid SDK dependency weight in serverless)
// Use the same config as the rest of the application
const DB_URL = process.env.REACT_APP_FIREBASE_DATABASE_URL;

const CRAWLER_USER_AGENTS = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'Slackbot',
    'Discordbot',
    'TelegramBot',
    'WhatsApp',
    'Googlebot',
    'bingbot',
    'Applebot',
    'pinterest',
];

function isCrawler(userAgent) {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    return CRAWLER_USER_AGENTS.some(bot => ua.includes(bot.toLowerCase()));
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildMetaHTML({ title, description, image, url }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:site_name" content="FindADate" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <meta name="theme-color" content="#F97316" />
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
    const userAgent = req.headers['user-agent'] || '';

    // Only intercept crawlers
    if (!isCrawler(userAgent)) {
        // Serve the normal SPA index.html
        try {
            const indexPath = path.join(process.cwd(), 'build', 'app.html');
            const html = fs.readFileSync(indexPath, 'utf8');
            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(html);
        } catch (err) {
            console.error('Failed to read build/app.html:', err);
            return res.status(500).send('Application failed to load properly.');
        }
    }

    const host = req.headers.host || 'vacation-scheduler.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    // Attempt to parse query string manually because req.url might just be the path
    const fullUrl = `${protocol}://${host}${req.url}`;
    let urlObj;
    try {
        urlObj = new URL(fullUrl);
    } catch (e) {
        urlObj = { pathname: '/', searchParams: new URLSearchParams() };
    }

    const p = urlObj.searchParams.get('p');
    // If vercel rewrite passes p, use it as pathname to support nested routes properly
    const pathname = p ? (p.startsWith('/') ? p : `/${p}`) : urlObj.pathname;
    const groupId = urlObj.searchParams.get('group');
    const isAdmin = urlObj.searchParams.has('admin');

    let title = 'FindADate — Find the Best Date for Any Group Event';
    let description = 'Everyone marks their availability. The algorithm finds the overlap. Free, no sign-up required.';
    let image = `${protocol}://${host}/og-image-default.png`;

    // Dynamic meta for group links
    if (groupId) {
        // Sanitize groupId to prevent traversal or malicious input
        if (typeof groupId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(groupId)) {
            console.warn(`[api/og] Rejected invalid groupId: ${groupId}`);
        } else if (DB_URL) {
            try {
                const dbUrl = `${DB_URL.replace(/\/$/, '')}/groups/${encodeURIComponent(groupId)}.json`;
                const groupRes = await fetch(dbUrl, { signal: AbortSignal.timeout(5000) });

                if (groupRes.ok) {
                    const group = await groupRes.json();
                    if (group && group.name) {
                        // Truncate name safely to max 60 chars to avoid preview bugs
                        const cleanName = group.name.length > 60 ? group.name.substring(0, 60) + '...' : group.name;
                        if (isAdmin) {
                            title = `${cleanName} — Admin Dashboard | FindADate`;
                            description = `Manage your event and see availability results for "${cleanName}" on FindADate.`;
                        } else {
                            title = `You're invited to pick dates for "${cleanName}"`;
                            description = `Mark your available dates for ${cleanName}. No sign-up needed. Powered by FindADate.`;
                            image = `${protocol}://${host}/og-image-invite.png`;
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch group for OG tags:', err);
            }
        }
    } else {
        // Static meta for landing pages
        const LANDING_PAGE_META = {
            '/vacation-planner': {
                title: "Group Vacation Planner — Find When Everyone's Free | FindADate",
                description: "Planning a group trip? Everyone marks their free dates. FindADate finds the best overlapping vacation window instantly. Free, no account needed.",
                image: '/og-image-vacation.png',
            },
            '/doodle-alternative': {
                title: 'Best Free Doodle Alternative 2026 | FindADate',
                description: "Tired of Doodle's ads and paywalls? FindADate is a free, ad-free group scheduling tool with visual heatmaps, multi-day support, and zero sign-up.",
            },
            '/when2meet-alternative': {
                title: 'When2Meet Alternative That Works on Mobile | FindADate',
                description: "When2Meet, but modern. FindADate works on every device, supports multi-day events, and doesn't abandon you after the poll.",
            },
            '/find-a-date-for-dinner': {
                title: 'Find a Date for Dinner With Friends | FindADate',
                description: 'Stop going back and forth in the group chat. Everyone marks their free evenings. FindADate shows you the best night for dinner in seconds.',
            },
            '/group-event-planner': {
                title: 'Group Event Date Finder | FindADate',
                description: "Find the best date for any group event. Everyone marks availability, FindADate finds the overlap.",
            },
            '/team-scheduling': {
                title: 'Team Offsite & Retreat Date Planner | FindADate',
                description: 'Coordinate team offsite dates across timezones. Visual availability heatmap shows the best window. Free for teams of any size.',
            },
            '/party-planner': {
                title: 'Birthday & Party Date Finder | FindADate',
                description: 'Planning a birthday or celebration? Find the date that works for the most guests. Share a link, collect availability, see the best match.',
            },
            '/game-night-planner': {
                title: 'Game Night Scheduler | FindADate',
                description: "Coordinating game night with 6+ players? Skip the group chat chaos. Everyone marks availability, FindADate finds the overlap.",
            },
        };

        if (LANDING_PAGE_META[pathname]) {
            const meta = LANDING_PAGE_META[pathname];
            title = meta.title;
            description = meta.description;
            if (meta.image) image = `${protocol}://${host}${meta.image}`;
        }
    }

    const html = buildMetaHTML({ title, description, image, url: fullUrl });
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
};
