# PRP-04: Enriched Link Previews

**Priority:** High — Execute after PRP-03 (Calendar Event)
**Estimated Effort:** 10-14 hours
**Dependencies:** PRP-01 (Rebrand), PRP-1.5 (SEO Landing Pages) must be completed first. PRP-02 and PRP-03 are recommended but not blocking.

---

## Context & Background

FindADate (formerly "Vacation Scheduler") is a group date-coordination platform. The primary distribution channel is link sharing — admins create an event and share the link in WhatsApp, iMessage, Slack, Discord, or email. The research document (`docs/findAdate.pdf`, page 7-8) explicitly identifies **link preview quality** as a make-or-break product risk:

> "Most polls will be shared via WhatsApp, iMessage, or Slack. If the shared link doesn't generate an attractive, descriptive preview (with title, description, and image), click-through rates from group chats will be significantly lower."

Currently, ALL shared links show the same static preview: "Vacation Scheduler — Plan group vacations with ease" regardless of context. This is a critical problem because:
- Participant links (`?group=xxx`) should show "You're invited to [Group Name]"
- Admin links (`?group=xxx&admin=xxx`) should show "[Group Name] — Admin Dashboard"
- Landing pages should show their specific SEO-optimized titles
- The old "Vacation Scheduler" branding is still in the static meta tags

### Required Reading Before Starting

Before writing any code, the implementing agent MUST read:
1. `docs/FindADate-PRD-Strategy.md` — Section 3.7 (OpenGraph & Twitter Card Setup) and Section 4.6 (Enriched Link Previews) for the full specification
2. `docs/findAdate.pdf` — Pages 7-8 discuss link preview quality as a product risk
3. `public/index.html` — The current static meta tags (updated in PRP-01 to say FindADate, but still static)
4. `firebase.json` — Current hosting/rewrite configuration
5. `src/App.js` — Current routing (updated in PRP-1.5 with react-router-dom)
6. `src/services/firebaseConfig.js` — Firebase project configuration
7. The `api/` directory — Existing serverless functions (Vercel/Firebase Cloud Functions)

---

## Objective

Make every shared FindADate link generate a **rich, contextual preview** in messaging apps (WhatsApp, iMessage, Slack, Discord, Twitter/X) and social media.

Three types of previews:

| Link Type | Example URL | Preview Title | Preview Description |
|-----------|-------------|---------------|---------------------|
| **Homepage** | findadate.app | FindADate — Find the Best Date for Any Group Event | Everyone marks their availability. The algorithm finds the overlap. Free, no sign-up. |
| **Landing pages** | findadate.app/vacation-planner | Group Vacation Planner — Find When Everyone's Free | Planning a group trip? FindADate finds the best overlapping vacation window instantly. |
| **Participant link** | findadate.app?group=abc123 | You're invited to pick dates for "Summer Trip 2026" | Mark your available dates for Summer Trip 2026. No sign-up needed. |
| **Admin link** | findadate.app?group=abc123&admin=xyz | Summer Trip 2026 — Admin Dashboard | Manage your event and see availability results on FindADate. |

---

## The Core Problem: Client-Side Rendering vs. Crawlers

FindADate is a React SPA (Single Page Application). When WhatsApp, Slack, or Twitter fetch a URL to generate a preview, they do NOT execute JavaScript. They read the raw HTML returned by the server and look for `<meta>` tags.

Because the app uses client-side routing (react-router-dom), ALL URLs return the same `public/index.html` with the same static meta tags. This means:
- `findadate.app?group=abc123` shows "FindADate — Find the Best Date for Any Group Event" (wrong — should show group name)
- `findadate.app/vacation-planner` shows the same generic title (wrong — should show vacation-specific title)

**Solution:** A serverless middleware function that intercepts requests from crawlers/preview-generators and returns custom HTML with the correct `<meta>` tags, while passing normal browser requests through to the SPA.

---

## Implementation Steps

### Step 1: Understand the Hosting Architecture (30 min)

The project deploys to Firebase Hosting with Vercel as an alternative. Check both:

**Firebase Hosting** (`firebase.json`):
- Currently rewrites all non-API routes to `/index.html`
- Can add a Cloud Function rewrite for dynamic meta tags

**Vercel** (`vercel.json` + `api/` directory):
- Already has serverless functions in `api/`
- Can add an API route or Edge Middleware for meta tag injection

Read both config files and the `api/` directory to determine which deployment target to build for. **Build for BOTH** if possible, or prioritize whichever is the current production deployment.

### Step 2: Create the Dynamic Meta Tag Function (3-4h)

Create a serverless function that:
1. Checks if the request is from a crawler/preview bot (by User-Agent)
2. If YES: reads the URL, fetches group data if needed, and returns HTML with correct meta tags
3. If NO: serves the normal `index.html` (SPA)

**Crawler detection:**
```javascript
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',  // Facebook, WhatsApp, Instagram
  'Facebot',
  'Twitterbot',           // Twitter/X
  'LinkedInBot',          // LinkedIn
  'Slackbot',             // Slack
  'Discordbot',           // Discord
  'TelegramBot',          // Telegram
  'WhatsApp',             // WhatsApp direct
  'Googlebot',            // Google
  'bingbot',              // Bing
  'Applebot',             // Apple/iMessage
  'pinterest',
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(bot => ua.includes(bot.toLowerCase()));
}
```

**For Vercel — create `api/og.js` or use Edge Middleware:**

```javascript
// api/og.js — Vercel Serverless Function approach
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

// Initialize Firebase (use same config as client)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';

  // Only intercept crawlers
  if (!isCrawler(userAgent)) {
    // Serve the normal SPA index.html
    // This requires reading the built index.html and returning it
    // OR using a rewrite to let the static hosting serve it
    return res.redirect(307, req.url); // fallback
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathname = url.pathname;
  const groupId = url.searchParams.get('group');
  const isAdmin = url.searchParams.has('admin');

  let title = 'FindADate — Find the Best Date for Any Group Event';
  let description = 'Everyone marks their availability. The algorithm finds the overlap. Free, no sign-up required.';
  let image = `https://${req.headers.host}/og-image-default.png`;

  // Dynamic meta for group links
  if (groupId) {
    try {
      const snapshot = await get(ref(db, `groups/${groupId}`));
      const group = snapshot.val();

      if (group) {
        if (isAdmin) {
          title = `${group.name} — Admin Dashboard | FindADate`;
          description = `Manage your event and see availability results for "${group.name}" on FindADate.`;
        } else {
          title = `You're invited to pick dates for "${group.name}"`;
          description = `Mark your available dates for ${group.name}. No sign-up needed. Powered by FindADate.`;
          image = `https://${req.headers.host}/og-image-invite.png`;
        }
      }
    } catch (err) {
      console.error('Failed to fetch group for OG tags:', err);
      // Fall through to defaults
    }
  }

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
    if (meta.image) image = `https://${req.headers.host}${meta.image}`;
  }

  // Return HTML with meta tags
  const html = buildMetaHTML({ title, description, image, url: `https://${req.headers.host}${req.url}` });
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
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
  <script>window.location.href = "${escapeHtml(url)}";</script>
</body>
</html>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

### Step 3: Alternative — Vercel Edge Middleware (Recommended) (2-3h)

If using Vercel, **Edge Middleware** is the cleanest approach because it runs before the request reaches the static files, without needing a separate API route.

Create `middleware.js` in the project root:

```javascript
// middleware.js — Vercel Edge Middleware
import { NextResponse } from 'next/server';
// NOTE: Vercel Edge Middleware uses a subset of the Web API
// Firebase Admin SDK cannot be used directly in Edge — use REST API instead

export const config = {
  matcher: ['/', '/((?!api|_next|static|favicon|og-image|.*\\..*).*)'],
};

export default async function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';

  if (!isCrawler(userAgent)) {
    return NextResponse.next(); // Normal browser — serve SPA
  }

  // Crawler detected — generate custom meta tag response
  const url = new URL(request.url);
  // ... (same logic as Step 2 for building meta tags)
  // For group data: use Firebase REST API instead of SDK:
  // const groupData = await fetch(`${FIREBASE_DB_URL}/groups/${groupId}.json`).then(r => r.json());

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

**Important:** Edge Middleware cannot use the Firebase SDK directly. Use the Firebase REST API:
```javascript
const FIREBASE_DB_URL = process.env.REACT_APP_FIREBASE_DATABASE_URL;
const groupData = await fetch(`${FIREBASE_DB_URL}/groups/${groupId}.json`).then(r => r.json());
```

### Step 4: Firebase Cloud Function Alternative (2-3h)

For Firebase Hosting deployments, create a Cloud Function:

Create `functions/dynamicMeta.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.database();

exports.dynamicMeta = functions.https.onRequest(async (req, res) => {
  // Same crawler detection and meta generation logic as Step 2
  // Uses admin.database() instead of client SDK
  // Reads group data with: await db.ref(`groups/${groupId}`).once('value')
  // Returns HTML with meta tags for crawlers
  // For non-crawlers: serves the static build/index.html
});
```

Update `firebase.json` to route through the function:
```json
{
  "hosting": {
    "rewrites": [
      { "source": "/api/send-reminder", "function": "sendReminder" },
      { "source": "/api/send-welcome", "function": "sendWelcome" },
      { "source": "**", "function": "dynamicMeta" }
    ]
  }
}
```

**Note:** This means ALL requests go through the Cloud Function, which checks if it's a crawler. If not, it serves the static `index.html`. This adds latency (~50-100ms) for normal users. Consider using Firebase Hosting's `i18n` or header-based rewrites if available, or only route `?group=` URLs through the function.

### Step 5: Create OG Image Assets (2-3h)

Design and create the following OG images at 1200x630px:

| Image | File | Content |
|-------|------|---------|
| Default | `public/og-image-default.png` | FindADate logo + tagline "Find the best date for anything" + mini heatmap calendar visual + coral brand color |
| Invite | `public/og-image-invite.png` | "You're invited!" text + calendar icon + "Mark your available dates" + FindADate brand |
| Vacation | `public/og-image-vacation.png` | "Plan Your Group Vacation" + travel/calendar visual + FindADate brand |

**Design guidelines (from research doc):**
- Use coral/orange (`#F97316`) as primary accent
- Clean, modern typography (Inter)
- Dark background (`hsl(224, 71%, 4%)`) or white background — test both
- No stock photos — use abstract/illustrated visuals
- Include the FindADate logo/wordmark
- Text must be readable at small preview sizes (WhatsApp shows ~300px wide)

**Option:** Use a canvas/SVG generation approach to create these programmatically, or design them manually in Figma/Canva. For MVP, static images are fine.

### Step 6: Add Favicon (30 min)

Create and add proper favicon files to `public/`:
- `favicon.ico` — 32x32 for browser tabs
- `apple-touch-icon.png` — 180x180 for iOS
- `favicon-16x16.png` — 16x16
- `favicon-32x32.png` — 32x32

Update `public/index.html` to reference them:
```html
<link rel="icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
```

The favicon should be a small calendar icon with the coral brand color, or a stylized "F" / calendar-pin mark.

---

## Testing Link Previews

Testing link previews is critical and must be done manually across platforms.

### Testing Tools

1. **Facebook Sharing Debugger:** https://developers.facebook.com/tools/debug/ — Enter URL, see what Facebook/WhatsApp will show
2. **Twitter Card Validator:** https://cards-dev.twitter.com/validator — Test Twitter card rendering
3. **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/ — Test LinkedIn preview
4. **Slack:** Paste link in a Slack channel — Slack fetches preview immediately
5. **Discord:** Paste link in a Discord channel — Discord shows embed
6. **opengraph.xyz:** https://www.opengraph.xyz/ — Universal OG tag preview tester

### Manual Test Matrix

| URL | Expected Title | Test WhatsApp | Test Slack | Test Twitter |
|-----|---------------|---------------|------------|--------------|
| findadate.app | FindADate — Find the Best Date for Any Group Event | [ ] | [ ] | [ ] |
| findadate.app/vacation-planner | Group Vacation Planner — Find When Everyone's Free | [ ] | [ ] | [ ] |
| findadate.app/doodle-alternative | Best Free Doodle Alternative 2026 | [ ] | [ ] | [ ] |
| findadate.app?group=TEST_ID | You're invited to pick dates for "[Name]" | [ ] | [ ] | [ ] |
| findadate.app?group=TEST_ID&admin=TOKEN | [Name] — Admin Dashboard | [ ] | [ ] | [ ] |

---

## Testing Checklist

- [ ] Crawler detection correctly identifies WhatsApp, Slack, Twitter, Discord, Google bots
- [ ] Normal browser requests are NOT intercepted (SPA loads normally)
- [ ] Homepage URL returns correct default OG tags to crawlers
- [ ] Landing page URLs return their specific OG tags to crawlers
- [ ] Participant link (`?group=xxx`) returns dynamic title with group name
- [ ] Admin link (`?group=xxx&admin=xxx`) returns admin-specific title
- [ ] Invalid group IDs fall back to default meta tags gracefully
- [ ] OG images exist and are accessible at their URLs
- [ ] Favicon displays correctly in browser tabs
- [ ] Apple touch icon works on iOS "Add to Home Screen"
- [ ] Facebook Sharing Debugger shows correct preview for all URL types
- [ ] Slack shows rich preview with image, title, and description
- [ ] HTML escaping prevents XSS through group names (test with `<script>` in group name)
- [ ] `npm test` — all existing tests pass
- [ ] Serverless function handles errors gracefully (Firebase down, invalid group ID, etc.)

---

## Security Considerations

**Critical:** Group names are user-generated content that gets injected into HTML meta tags. You MUST:
1. HTML-escape ALL user-generated content (group name, description) before inserting into meta tags
2. Test with XSS payloads in group names: `<script>alert('xss')</script>`, `" onload="alert(1)"`, etc.
3. Truncate excessively long group names (cap at 60 chars for OG title)
4. Never expose admin tokens in meta tags or preview content

---

## Files Created

- `api/og.js` OR `middleware.js` OR `functions/dynamicMeta.js` (depending on deployment target)
- `public/og-image-default.png`
- `public/og-image-invite.png`
- `public/og-image-vacation.png`
- `public/favicon.ico`
- `public/apple-touch-icon.png`
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`

## Files Modified

- `public/index.html` (favicon links)
- `firebase.json` (rewrite rules, if using Firebase Cloud Function)
- `vercel.json` (if using Vercel middleware)
- `package.json` (if adding dependencies for Edge Middleware)

---

## Important Notes

- **Choose ONE deployment approach** based on your hosting: Vercel Edge Middleware OR Firebase Cloud Function. Don't build both.
- The dynamic meta function must be FAST (< 200ms) — it runs on every crawler request
- Cache group data aggressively if possible (group names rarely change)
- For the MVP, static OG images are sufficient. Dynamic image generation (with group name rendered on the image) is a future enhancement
- The `<script>window.location.href</script>` redirect in the crawler HTML ensures that if a real browser somehow gets the crawler response, it redirects to the actual SPA
- Admin tokens must NEVER appear in any meta tag, OG tag, or publicly visible HTML
