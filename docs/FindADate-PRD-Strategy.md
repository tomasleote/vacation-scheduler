# FindADate: Complete PRD + SEO + Branding Strategy Plan

**Version:** 1.0
**Date:** March 2026
**Status:** Strategic Blueprint — Pre-Implementation

---

## 1. Executive Summary

FindADate is the rebrand of Vacation Scheduler into a broader group date-coordination platform. The product solves the universal "when is everyone free?" problem — starting with vacations (where no strong competitor exists for multi-day heatmap scheduling) and expanding to dinners, parties, game nights, team offsites, cinema trips, birthdays, and any event requiring group date alignment.

**The strategic thesis:** Lead with the vacation niche (low competition, high emotional resonance, unique multi-day capability), expand messaging to capture the 10-20x larger group scheduling market, and position directly against Doodle's declining trust and When2Meet's frozen UI — without diluting the core value proposition.

**Key numbers from research:**
- Vacation scheduling keyword cluster: 200-500 monthly searches (low competition)
- Group scheduling keyword cluster: 10,000-30,000+ monthly searches
- "Doodle alternative": 8,000-15,000 monthly searches
- Doodle: 93% one-star reviews on Trustpilot, 1.5/5 rating
- When2Meet: no mobile support, no post-poll workflow, 2008 UI
- TAM: $5B online scheduling + $5.2B trip planning = viable SaaS economics

**What changes:** Brand name, domain, messaging, SEO architecture, visual identity, landing pages, link previews.
**What stays:** Core architecture, Firebase backend, overlap algorithm, no-account participation, heatmap UI.

---

## 2. Repositioning Blueprint

### 2.1 Core Positioning Statement

> **FindADate** is the fastest way for any group to find the best date for anything — from week-long vacations to Tuesday dinners. Everyone marks their availability, the algorithm finds the overlap, and you go from "when works?" to "see you there" in minutes.

### 2.2 Unique Selling Proposition

| Dimension | FindADate | Doodle | When2Meet | WhatsApp Group |
|-----------|-----------|--------|-----------|----------------|
| Multi-day date ranges | Native heatmap for 1-90 day windows | Time-slot polls only | Grid, but single-day only | Chaos |
| Account required | No (participants) | Required for organizers | No | Yes (phone #) |
| Mobile experience | Responsive-first | Ad-cluttered, broken | Essentially unusable | Native but unstructured |
| Post-poll workflow | Voting + Calendar event (planned) | None in free tier | None | Manual |
| Price | Free core, forever | $6.95+/mo for basics | Free | Free |
| Visual result quality | Color-coded heatmap | Checkmark table | Green grid | Screenshots of texts |
| Ad-free | Yes | No (heavy ads in free) | Yes | N/A |

### 2.3 Primary Audience Segments

1. **Friend Groups (18-35)** — Planning vacations, weekend trips, dinner parties, cinema nights, birthday celebrations. Currently drowning in WhatsApp/iMessage threads. Viral loop driver.
2. **Young Professionals (25-40)** — Coordinating social events alongside busy work schedules. Value speed and polish. Higher willingness to share tools.
3. **Remote/Distributed Teams** — Planning offsites, quarterly meetups, all-hands timing across timezones. B2B wedge. Higher willingness to pay.

### 2.4 Secondary Audience Segments

4. **Students & University Clubs** — Group project meetings, club events, Greek life coordination. Very high viral density (each org = 20-100 members).
5. **Wedding Planners & Family Coordinators** — Bachelor/ette parties, reunion weekends, holiday gatherings. Emotional, high-stakes scheduling.
6. **Board Game / Hobby Groups** — Recurring session scheduling. Known pain point in r/boardgames (5M+ members).

### 2.5 The Dual-Positioning Strategy: Vacation + Everything

The key insight from the research: the vacation niche is the **entry wedge**, not the ceiling.

**How to hold both positions without confusion:**

```
Homepage:        "Find the best date for any group event"
                           ↓
           [Vacation] [Dinner] [Party] [Team Offsite] [Game Night]
                           ↓
           "Whether it's a week-long trip or a Tuesday dinner,
            everyone marks their dates. We find the overlap."
```

- **Homepage** leads with the universal message, but **vacation is the first and most prominent use case** shown
- **SEO landing pages** target each niche independently (no cannibalization)
- **The product itself** remains use-case-agnostic — the create-group form already supports any date range
- **The overlap algorithm** works identically for 2-day dinners and 14-day vacations

This is the Calendly model in reverse: Calendly started B2B and added personal; FindADate starts social and adds professional. The product doesn't change — only the framing.

---

## 3. SEO Architecture Plan

### 3.1 Keyword Strategy

#### Tier 1 — High-Volume Capture (Homepage + Primary Landing Pages)

| Keyword Cluster | Monthly Searches | Competition | Target Page |
|----------------|-----------------|-------------|-------------|
| doodle alternative | 8,000-15,000 | Medium | /doodle-alternative |
| group scheduling tool | 1,000-3,000 | Medium | Homepage |
| free group scheduling | 2,000-5,000 | Low-Medium | Homepage |
| when2meet alternative | 3,000-8,000 | Low | /when2meet-alternative |
| group availability tool | 500-1,500 | Low | Homepage |
| find best date for group | 200-600 | Very Low | Homepage |

#### Tier 2 — Niche Dominance (Dedicated Landing Pages)

| Keyword Cluster | Monthly Searches | Competition | Target Page |
|----------------|-----------------|-------------|-------------|
| plan trip with friends app | 200-500 | Very Low | /vacation-planner |
| vacation planner with friends | 200-500 | Very Low | /vacation-planner |
| group vacation scheduling | 100-300 | Very Low | /vacation-planner |
| schedule group event | 500-1,500 | Low | /group-event-planner |
| plan dinner with friends | 300-800 | Low | /find-a-date-for-dinner |
| team offsite planner | 100-400 | Very Low | /team-scheduling |
| group date finder | 100-300 | Very Low | Homepage |

#### Tier 3 — Long-Tail Capture (Content + Use Case Pages)

| Keyword | Target Page |
|---------|-------------|
| how to find the best date for a group vacation | /vacation-planner |
| best free alternative to doodle 2026 | /doodle-alternative |
| when2meet for mobile | /when2meet-alternative |
| plan a bachelor party date | /party-planner |
| coordinate team retreat dates | /team-scheduling |
| schedule board game night | /game-night-planner |
| birthday party date finder | /party-planner |

### 3.2 Page Architecture

```
findadate.app (Homepage)
├── /vacation-planner          ← "Plan Your Group Vacation"
├── /doodle-alternative        ← "The Free Doodle Alternative"
├── /when2meet-alternative     ← "When2Meet, But Modern"
├── /find-a-date-for-dinner    ← "Find a Date for Dinner"
├── /group-event-planner       ← "Group Event Date Finder"
├── /team-scheduling           ← "Team Offsite & Retreat Planner"
├── /party-planner             ← "Party & Birthday Date Finder"
├── /game-night-planner        ← "Game Night Scheduler"
├── /docs                      ← Documentation (existing)
├── /privacy                   ← Privacy Policy (existing)
├── /terms                     ← Terms of Service (existing)
└── ?group=xxx                 ← App routes (existing)
```

### 3.3 Anti-Cannibalization Rules

Each landing page must:
1. Target a **distinct primary keyword** (no two pages share the same H1 keyword)
2. Have **unique H1, title tag, and meta description**
3. Link to homepage and to 2-3 related landing pages (not all of them)
4. Include a clear CTA that routes to the same create-group flow
5. **Not duplicate** homepage content — each tells a use-case-specific story

### 3.4 Internal Linking Structure

```
Homepage ←→ /vacation-planner ←→ /doodle-alternative
    ↕              ↕                      ↕
/team-scheduling ←→ /group-event-planner ←→ /when2meet-alternative
    ↕                      ↕
/game-night-planner ←→ /find-a-date-for-dinner ←→ /party-planner
```

Every page links back to homepage. Comparison pages (/doodle-alternative, /when2meet-alternative) link to each other. Use case pages link to 2 related use case pages. This creates a tight topical cluster without dilution.

### 3.5 Meta Description Strategy

| Page | Title Tag | Meta Description |
|------|-----------|-----------------|
| Homepage | FindADate — Find the Best Date for Any Group Event | Everyone marks their availability. The algorithm finds when the most people overlap. Free, no sign-up required. Stop texting. Start planning. |
| /vacation-planner | Group Vacation Planner — Find When Everyone's Free \| FindADate | Planning a group trip? Everyone marks their free dates on the calendar. FindADate finds the best overlapping vacation window instantly. Free, no account needed. |
| /doodle-alternative | Best Free Doodle Alternative 2026 \| FindADate | Tired of Doodle's ads and paywalls? FindADate is a free, ad-free group scheduling tool with visual heatmaps, multi-day support, and zero sign-up. |
| /when2meet-alternative | When2Meet Alternative That Works on Mobile \| FindADate | When2Meet, but modern. FindADate works on every device, supports multi-day events, and doesn't abandon you after the poll. |
| /find-a-date-for-dinner | Find a Date for Dinner With Friends \| FindADate | Stop going back and forth in the group chat. Everyone marks their free evenings. FindADate shows you the best night for dinner in seconds. |
| /team-scheduling | Team Offsite & Retreat Date Planner \| FindADate | Coordinate team offsite dates across timezones. Visual availability heatmap shows the best window for your retreat. Free for teams of any size. |
| /party-planner | Birthday & Party Date Finder \| FindADate | Planning a birthday party or celebration? Find the date that works for the most guests. Share a link, collect availability, see the best match. |
| /game-night-planner | Game Night Scheduler — Find the Best Date \| FindADate | Coordinating game night with 6+ players? Skip the group chat chaos. Everyone marks their availability, FindADate finds the overlap. |

### 3.6 Schema Markup Recommendations

**Homepage — SoftwareApplication schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "FindADate",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Free group scheduling tool. Everyone marks their availability, the algorithm finds the best overlapping dates.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "120"
  }
}
```

**Comparison pages — FAQPage schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is FindADate really free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. FindADate's core features are completely free with no ads, no account required for participants, and unlimited groups."
      }
    },
    {
      "@type": "Question",
      "name": "How is FindADate different from Doodle?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "FindADate supports multi-day date ranges with visual heatmaps, requires no account for participants, is completely ad-free, and works beautifully on mobile."
      }
    }
  ]
}
```

**Use case pages — HowTo schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Find the Best Date for a Group Vacation",
  "step": [
    { "@type": "HowToStep", "text": "Create a group and set your travel date range" },
    { "@type": "HowToStep", "text": "Share the link with your group" },
    { "@type": "HowToStep", "text": "Everyone marks their available dates on the calendar" },
    { "@type": "HowToStep", "text": "The algorithm finds the best overlapping vacation window" }
  ]
}
```

### 3.7 OpenGraph & Twitter Card Setup

**Default (Homepage):**
```html
<meta property="og:type" content="website" />
<meta property="og:title" content="FindADate — Find the Best Date for Any Group Event" />
<meta property="og:description" content="Everyone marks their availability. The algorithm finds the overlap. Free, no sign-up." />
<meta property="og:image" content="https://findadate.app/og-image-default.png" />
<meta property="og:url" content="https://findadate.app" />
<meta property="og:site_name" content="FindADate" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="FindADate — Find the Best Date for Any Group Event" />
<meta name="twitter:description" content="Stop texting. Start planning. Free group date finder." />
<meta name="twitter:image" content="https://findadate.app/og-image-default.png" />
```

**Dynamic (Shared Group Links):**
```html
<!-- For participant links: ?group=xxx -->
<meta property="og:title" content="You're invited to pick dates for [Group Name]" />
<meta property="og:description" content="Mark your available dates for [Group Name]. No sign-up needed." />
<meta property="og:image" content="https://findadate.app/og-image-invite.png" />

<!-- For admin links: ?group=xxx&admin=xxx -->
<meta property="og:title" content="[Group Name] — Admin Dashboard" />
<meta property="og:description" content="Manage your group and see availability results." />
```

**OG Image Specs:**
- Default: 1200x630px, brand colors, tagline, visual of heatmap calendar
- Invite: 1200x630px, "You're invited!" + group name + brand
- Use case pages: Each gets a unique image matching the use case

**Implementation note:** Dynamic OG tags require server-side rendering or a Firebase Cloud Function that serves custom `<meta>` tags based on URL parameters before the React app loads. This is the highest-effort SEO item but critical for viral sharing via WhatsApp/Slack/iMessage.

---

## 4. Feature Alignment Plan

### 4.1 Current State Assessment

The existing codebase (`vacation-scheduler`) already supports:
- Group creation with date range (start/end)
- Participant join via link (no account)
- Calendar-based availability selection
- Multi-day window overlap calculation with heatmap
- Admin dashboard with participant management
- CSV export, email reminders
- Recovery passphrase for admin access
- Documentation, privacy policy, terms of service
- Firebase Realtime Database + Firebase Hosting
- Tailwind CSS dark theme with Inter font

**What already works for the expansion:**
The core `timeframe + participant availability → overlap` model is use-case-agnostic. A dinner party and a vacation use the exact same flow. The only "vacation-specific" elements are UI copy strings.

### 4.2 Rebrand Changes (Copy Only — No Architecture Changes)

These are pure string replacements across the codebase:

| Current | New |
|---------|-----|
| "Vacation Scheduler" | "FindADate" |
| "Find your perfect vacation window." | "Find the best date for anything." |
| "Create a Trip" / "Join a Trip" | "Create Event" / "Join Event" |
| "Summer Trip 2024" (placeholder) | "Summer Trip 2026, Friday Dinner, Game Night..." |
| "Beach trip to Hawaii..." (placeholder) | "What are you planning? Vacation, dinner, party..." |
| `vacation_admin_` (localStorage keys) | `fad_admin_` |
| `vacation_p_` (localStorage keys) | `fad_p_` |

**Effort:** ~2-4 hours. Zero risk.

### 4.3 New Feature: Event Type Templates

Add an optional "event type" selector to the CreateGroupForm:

```
[ Vacation ] [ Dinner ] [ Party ] [ Game Night ] [ Team Event ] [ Other ]
```

Each template pre-configures:
- **Vacation:** Multi-day range, placeholder "e.g., Summer Trip 2026"
- **Dinner:** Single evening default, placeholder "e.g., Friday Dinner"
- **Party:** Weekend day default, placeholder "e.g., Sarah's Birthday"
- **Game Night:** Evening slots, placeholder "e.g., D&D Session"
- **Team Event:** Weekday range, placeholder "e.g., Q2 Offsite"

**Effort:** ~4-6 hours. Low risk. Purely UI change — data model unchanged.

### 4.4 Voting Layer ✓ IMPLEMENTED

After availability collection, admin triggers a vote on the top N overlapping periods:

**Flow:**
1. Admin views overlap results (heatmap in AdminPage)
2. Admin clicks on periods in VotingSetup → adds 2-5 periods as candidates
3. Admin clicks "Start Poll" to activate voting
4. Participants see voting banner + highlighted candidates on calendar
5. Participants click each candidate period to vote
6. Admin sees live vote counts and voter list in VotingResults
7. Admin closes poll and clicks "Send Results" to email winner with calendar invite

**Data model (implemented):**
```json
{
  "groups/{groupId}/poll": {
    "status": "active|closed",
    "mode": "single|multi",
    "startedAt": "2026-03-07T14:30:00Z",
    "candidates": {
      "cand_1": { "startDate": "2026-07-10", "endDate": "2026-07-17", "label": 1 },
      "cand_2": { "startDate": "2026-07-20", "endDate": "2026-07-27", "label": 2 }
    },
    "votes": {
      "participantId_1": { "candidateIds": ["cand_1"], "votedAt": "2026-03-07T14:35:00Z" },
      "participantId_2": { "candidateIds": ["cand_2"], "votedAt": "2026-03-07T14:36:00Z" }
    }
  }
}
```

**Implementation:**
- **Frontend Components:**
  - `AdminPage.jsx` — Manages voting setup and results
  - `VotingSetup.jsx` — Candidate period selection
  - `VotingResults.jsx` — Live vote tracking with real-time Firebase subscription
  - `VotePanel.jsx` — Vote casting interface (shown on SlidingOverlapCalendar)
  - `SlidingOverlapCalendar.jsx` — Displays candidates and vote results in heatmap

- **Backend Services:**
  - `pollService.js` — Firebase operations (subscribeToPoll, submitVote, closePoll)
  - `api/send-vote-invite.js` — Serverless function for voting invitations
  - `api/send-vote-result.js` — Serverless function for winner email + ICS calendar

- **Features:**
  - Real-time vote count updates across all participants
  - Voter transparency — see who voted for what
  - Single vs. multiple choice voting modes
  - Auto-close poll when all participants vote
  - Calendar invite generation (ICS RFC 5545 format)
  - Email notifications at poll start and winner announcement

**Status:** ✅ Complete and deployed. Production-ready with email integration.

### 4.5 Calendar Event Creation ✓ IMPLEMENTED (as part of voting)

After a date is confirmed (via vote or manual admin selection):

1. Admin clicks "Send Results" in VotingResults panel
2. System generates:
   - RFC 5545 ICS calendar file (all-day event)
   - HTML email with branded styling
   - Group coordination link
3. Email includes:
   - ICS attachment that imports directly into any calendar
   - Winner date prominently displayed
   - Link back to group planning page
4. Participants can import the event in one click

**Implementation (in `api/send-vote-result.js`):**
```javascript
// ICS generation — RFC 5545 compliant
function generateICS({ title, startDate, endDate, description }) {
  const end = new Date(endDate);
  end.setDate(end.getDate() + 1); // exclusive end for all-day events
  const endStr = end.toISOString().split('T')[0].replace(/-/g, '');
  const startStr = startDate.replace(/-/g, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Find A Day//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@findaday`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startStr}`,
    `DTEND;VALUE=DATE:${endStr}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\\r\\n');
}

// Sent via Nodemailer with Outlook/Apple/Google calendar compatibility
await transporter.sendMail({
  from: `"Find A Day" <${process.env.EMAIL_USER}>`,
  to: recipients,
  subject: `Date confirmed — "${groupName}"`,
  html: styledEmailHTML,
  attachments: [{
    filename: 'event.ics',
    content: icsContent,
    contentType: 'text/calendar; method=REQUEST'
  }]
});
```

**Features:**
- RFC 5545 compliant ICS format
- All-day event support with correct date ranges
- Outlook, Apple Calendar, Google Calendar compatible
- One-click import for recipients
- Email branding with FindADate styling
- No API keys required — pure serverless

**Status:** ✅ Complete and deployed. Production-ready via Vercel serverless functions.

### 4.6 New Feature: Enriched Link Previews

The current `public/index.html` has static meta tags. Shared links show "Vacation Scheduler" regardless of context.

**Required:** Dynamic meta tags based on URL parameters.

**Options:**

| Approach | Complexity | Quality |
|----------|-----------|---------|
| Firebase Cloud Function as middleware | Medium (8-12h) | Best — full SSR control |
| Pre-rendered static pages per route | Low (4-6h) | Good for landing pages, not for dynamic group links |
| Client-side meta tag injection | Low (2h) | Bad — crawlers/preview generators don't execute JS |

**Recommendation:** Implement Cloud Function middleware for `?group=` URLs. For landing pages, use static HTML with correct meta tags (since they're pre-known).

**Cloud Function approach:**
```javascript
// functions/index.js
exports.dynamicMeta = functions.https.onRequest(async (req, res) => {
  const groupId = req.query.group;
  if (!groupId) return serveStaticIndex(res);

  const group = await db.ref(`groups/${groupId}`).once('value');
  const data = group.val();

  const html = indexTemplate
    .replace('__OG_TITLE__', `Join "${data.name}" on FindADate`)
    .replace('__OG_DESCRIPTION__', data.description || 'Mark your available dates')
    .replace('__OG_IMAGE__', 'https://findadate.app/og-invite.png');

  res.send(html);
});
```

**Firebase hosting rewrite:**
```json
{
  "source": "**",
  "function": "dynamicMeta"
}
```

**Effort:** ~10-14 hours (including OG image design). Medium risk — requires careful testing with WhatsApp, Slack, iMessage, Twitter, Discord preview renderers.

### 4.7 MVP Sequencing

| Phase | Feature | Effort | Priority | Status |
|-------|---------|--------|----------|--------|
| **Phase 1 (Week 1-2)** | Rebrand copy + domain + visual identity | 15-20h | Critical | ⏳ Planned |
| **Phase 2 (Week 2-3)** | SEO landing pages + static meta tags | 12-16h | Critical | ⏳ Planned |
| **Phase 3 (Week 3-4)** | Dynamic OG tags for shared links | 10-14h | High | ⏳ Planned |
| **Phase 4 (Week 4-5)** | Event type templates | 4-6h | Medium | ⏳ Planned |
| **Phase 5 (Week 5-7)** | Calendar event creation (ICS + Email) | 6-8h | High | ✅ DONE |
| **Phase 6 (Week 7-10)** | Voting layer + Real-time poll | 15-20h | High | ✅ DONE |

**Total completed effort:** ~21-28 hours
**Total remaining effort:** ~41-56 hours across 5-6 weeks

**Recent completions (March 2026):**
- ✅ Voting system with real-time Firebase sync
- ✅ Vote-based period selection with live updates
- ✅ Calendar invite generation (RFC 5545 ICS format)
- ✅ Email notifications for voting invites and results
- ✅ Voting UI components (setup, results, vote panel)
- ✅ Documentation updates across all files

---

## 5. Branding & Visual Strategy

### 5.1 Brand Personality

| Attribute | Description |
|-----------|-------------|
| **Tone** | Friendly, direct, slightly playful. Not corporate. Not childish. Think "the friend who actually makes the plan happen." |
| **Voice** | Second person ("You create, they respond, everyone wins"). Active verbs. Short sentences. |
| **Emotional core** | Relief. The feeling when the group chat chaos resolves into a confirmed date. |
| **Anti-pattern** | Never sound like enterprise software. Never use jargon. Never be passive. |

**Brand voice examples:**
- YES: "Stop texting. Start planning."
- YES: "8 friends. 3 possible weekends. Found in 10 seconds."
- NO: "Optimize your team's scheduling workflow with our availability management solution."
- NO: "FindADate leverages advanced algorithms to streamline group coordination."

### 5.2 Color Palette

The research document recommends: warm, energetic accent against clean background. Avoid blue/purple (Calendly, Doodle, Zoom territory). The current codebase uses a dark theme with blue-400/blue-500 accents.

**Proposed FindADate palette:**

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Primary Accent** | Coral/Warm Orange | `#F97316` (orange-500) | CTAs, primary buttons, brand highlight |
| **Secondary Accent** | Amber | `#F59E0B` (amber-500) | Heatmap peak, hover states, secondary highlights |
| **Success** | Emerald | `#10B981` (emerald-500) | Confirmations, availability "free" state |
| **Background (Dark)** | Deep Navy | `hsl(224, 71%, 4%)` | Keep existing dark-950 |
| **Surface (Dark)** | Dark Slate | `hsl(222, 47%, 11%)` | Keep existing dark-900 |
| **Text Primary** | Near White | `hsl(210, 40%, 98%)` | Keep existing |
| **Text Secondary** | Gray | `hsl(215, 20%, 65%)` | Keep existing gray-400 |
| **Heatmap Gradient** | Gray → Amber → Coral | `#374151 → #F59E0B → #F97316` | Availability visualization |

**Why this works:**
- Coral/orange is visually distinctive from every competitor (Doodle blue, Calendly blue, When2Meet green)
- Warm colors convey energy, social warmth, and approachability
- The dark background stays — it already signals modern SaaS
- Heatmap gradient from gray (no one free) to coral (everyone free) is intuitive and beautiful

### 5.3 Typography

**Keep Inter** — it's already in the codebase, it's the modern SaaS standard (Linear, Vercel, Raycast all use it), and it renders beautifully at all sizes. The research document also recommends Inter.

| Element | Size | Weight |
|---------|------|--------|
| H1 (Hero) | 48-56px (text-5xl/6xl) | Bold (700) |
| H2 (Section) | 32-36px (text-3xl) | Bold (700) |
| H3 (Card title) | 20-24px (text-xl) | Semibold (600) |
| Body | 16-18px (text-base/lg) | Regular (400) |
| Caption | 12-14px (text-xs/sm) | Medium (500) |

### 5.4 Logo Direction

The name "FindADate" naturally suggests a calendar-pin or map-pin visual. Recommended approach:

- **Wordmark:** "FindADate" in Inter Bold, with the "A" in the accent coral color
- **Icon mark:** Minimal calendar icon with a location/check pin — usable as favicon and app icon
- **Lockup:** Icon + wordmark side by side for nav, icon only for favicon/mobile

### 5.5 How to Avoid Looking Like a Student Project

The research specifically calls this out. Key principles:

1. **Generous whitespace.** The current homepage is already decent. Landing pages must not feel cramped.
2. **Real product screenshots.** Not mockups. Actual heatmap with realistic data. This is the #1 trust signal.
3. **Consistent component library.** Already built (`shared/ui/`). Use it everywhere.
4. **Subtle motion.** The existing Framer Motion animations are good. Don't add more.
5. **No Lorem Ipsum anywhere.** Every placeholder must be a real use case.
6. **Favicon + OG image.** These are the bare minimum for credibility. Missing either = instant student-project signal.
7. **Footer with real links.** Already exists (docs, privacy, terms). Add social links when ready.

---

## 6. Landing Page Structure

### 6.1 Homepage Redesign

```
┌─────────────────────────────────────────────────┐
│  NAV: [FindADate logo]    [Docs] [Create Event] │
├─────────────────────────────────────────────────┤
│                                                  │
│  HERO:                                           │
│  "Find the best date for anything."              │
│                                                  │
│  "Vacation. Dinner. Party. Game night.           │
│   Everyone marks their dates.                    │
│   We find the overlap."                          │
│                                                  │
│  [Create Event →]  [Join Event]                  │
│                                                  │
│  USE CASE PILLS:                                 │
│  [🏖 Vacation] [🍽 Dinner] [🎂 Birthday]          │
│  [🎮 Game Night] [👥 Team Offsite]               │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  HOW IT WORKS (3 cards — keep existing):         │
│  1. Create  →  2. Respond  →  3. Match           │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  PRODUCT SCREENSHOT:                             │
│  Full-width heatmap calendar showing overlap     │
│  with realistic multi-participant data.           │
│  Caption: "8 friends. 3 possible weekends.       │
│  Found in 10 seconds."                           │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  USE CASE STORIES (2x2 grid):                    │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ 🏖 Vacation   │  │ 🍽 Dinner     │              │
│  │ "Planning a   │  │ "Trying to   │              │
│  │  ski trip     │  │  align 6     │              │
│  │  with 12      │  │  friends for │              │
│  │  friends?"    │  │  Friday?"    │              │
│  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ 🎂 Birthday   │  │ 👥 Team       │              │
│  │ "Organizing   │  │ "Scheduling  │              │
│  │  a surprise   │  │  a Q3 offsite│              │
│  │  party?"      │  │  across 4    │              │
│  │               │  │  timezones?" │              │
│  └──────────────┘  └──────────────┘              │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  COMPARISON: "Why not just use..."               │
│                                                  │
│  ┌─────────┬─────────┬──────────┬──────────┐     │
│  │         │ FindA   │ Doodle   │ When2    │     │
│  │         │ Date    │          │ Meet     │     │
│  ├─────────┼─────────┼──────────┼──────────┤     │
│  │ Free    │ ✓       │ Limited  │ ✓        │     │
│  │ No ads  │ ✓       │ ✗       │ ✓        │     │
│  │ Mobile  │ ✓       │ Broken   │ ✗       │     │
│  │ Multi-  │ ✓       │ ✗       │ ✗       │     │
│  │ day     │         │          │          │     │
│  │ No      │ ✓       │ ✗       │ ✓        │     │
│  │ signup  │ (all)   │ (orgnzr) │ (all)    │     │
│  │ Heat-   │ ✓       │ ✗       │ Basic    │     │
│  │ map     │         │          │          │     │
│  └─────────┴─────────┴──────────┴──────────┘     │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  SOCIAL PROOF (placeholder for now):             │
│  "Trusted by 500+ groups" / testimonial quotes   │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  FINAL CTA:                                      │
│  "Ready to stop texting and start planning?"     │
│  [Create Your First Event — Free →]              │
│                                                  │
├─────────────────────────────────────────────────┤
│  FOOTER: [Docs] [Privacy] [Terms] [GitHub]       │
└─────────────────────────────────────────────────┘
```

### 6.2 Use Case Story Format (for each card)

**Template:**

> **[Scenario]** — "Planning a Christmas dinner for 12 people?"
>
> **The problem:** You send "when works for everyone?" in the group chat. 47 messages later, three people haven't replied and you still don't have a date.
>
> **The solution:** Create a FindADate event in 30 seconds. Share the link. Everyone taps their free dates on a visual calendar. The algorithm shows you the best evening instantly.
>
> **Screenshot suggestion:** Heatmap calendar showing a week of evenings, with 3 dates highlighted in coral as top overlaps.

**Five story cards to build:**

1. **Christmas Dinner** — 12 people, evening slots, 2-week window. Problem: group chat chaos. Screenshot: evening heatmap.
2. **Cinema Night** — 6 friends, single evenings, 1-week window. Problem: 3 back-and-forth polls. Screenshot: simple overlap.
3. **Birthday Party** — 15 guests, weekend dates, 1-month window. Problem: conflicting weekends. Screenshot: weekend-only heatmap.
4. **Team Offsite** — 20 team members, 3-day block, 2-month window. Problem: cross-timezone coordination. Screenshot: multi-day overlap with high participant count.
5. **Group Vacation** — 8 friends, 7-day block, 3-month window. Problem: everyone has different vacation constraints. Screenshot: full heatmap with multi-day sliding window — **this is the hero screenshot, the unique differentiator.**

### 6.3 Comparison Block: "Why Not Use Doodle?"

Tone: professional, factual, empathetic. Not attacking Doodle — acknowledging what it was and why it's no longer the best choice.

> **Doodle was great. In 2015.**
>
> Today, Doodle's free tier is cluttered with ads, requires account creation for organizers, doesn't support multi-day date ranges, and has a 1.5/5 rating on Trustpilot. If you're planning anything more complex than a one-hour meeting, you deserve a tool built for the way groups actually coordinate.
>
> FindADate was built for group events — from dinners to vacations. No ads. No account. No limits.

### 6.4 SEO Landing Page Template

Each `/vacation-planner`, `/doodle-alternative`, etc. follows this structure:

```
1. H1 with primary keyword (e.g., "Free Doodle Alternative for Group Scheduling")
2. Subtitle with secondary keywords
3. Hero CTA: [Create Event — Free →]
4. Problem section (2-3 paragraphs specific to this use case)
5. Solution section with product screenshot specific to this use case
6. How it works (3 steps — reuse homepage component)
7. Comparison table (if applicable — Doodle page, When2Meet page)
8. FAQ section with schema markup (3-5 questions)
9. Final CTA
10. Internal links to related landing pages
```

---

## 7. Technical Implementation Scope

### 7.1 Architecture Assessment

**Current stack:**
- React 18 (CRA/react-scripts)
- Firebase Realtime Database + Firebase Hosting
- Firebase Cloud Functions (email reminders)
- Tailwind CSS 3
- Framer Motion
- No router (manual `window.location` + `pushState`)

**Architecture concerns for rebrand:**

1. **No client-side router.** The current `App.js` manually parses `window.location.pathname` and `URLSearchParams`. Adding 8+ SEO landing pages to this pattern will become unmanageable. **Recommendation:** Introduce `react-router-dom` in Phase 1.

2. **No SSR/SSG.** SEO landing pages need proper server-rendering for crawler indexing. **Options:**
   - **Option A:** Keep CRA + pre-render landing pages as static HTML at build time (react-snap or similar). Simplest.
   - **Option B:** Migrate to Next.js for proper SSR/SSG. Best long-term but largest migration effort.
   - **Option C:** Build landing pages as static HTML outside React, serve from Firebase Hosting. Fastest but creates maintenance split.

   **Recommendation:** Option A for MVP. Option B when approaching product-market fit. Reason: CRA → Next.js migration is substantial (~40+ hours) and shouldn't block launch.

3. **Dynamic OG tags.** Requires Firebase Cloud Function middleware (covered in section 4.6). This is a ~10-14h addition but critical for viral loop.

4. **localStorage key migration.** Changing `vacation_admin_` → `fad_admin_` requires a one-time migration function that checks for old keys and copies them. ~1 hour.

### 7.2 Routing Migration Plan

```javascript
// New route structure with react-router-dom
<BrowserRouter>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/vacation-planner" element={<LandingPage type="vacation" />} />
    <Route path="/doodle-alternative" element={<LandingPage type="doodle" />} />
    <Route path="/when2meet-alternative" element={<LandingPage type="when2meet" />} />
    <Route path="/find-a-date-for-dinner" element={<LandingPage type="dinner" />} />
    <Route path="/group-event-planner" element={<LandingPage type="event" />} />
    <Route path="/team-scheduling" element={<LandingPage type="team" />} />
    <Route path="/party-planner" element={<LandingPage type="party" />} />
    <Route path="/game-night-planner" element={<LandingPage type="gamenight" />} />
    <Route path="/docs" element={<DocumentationPage />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms" element={<TermsOfService />} />
    {/* App routes use query params, handled by root */}
  </Routes>
</BrowserRouter>
```

**Effort:** ~8-12 hours to refactor App.js routing + update all internal navigation.

### 7.3 Firebase Hosting Configuration Updates

```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "/api/send-reminder", "function": "sendReminder" },
      { "source": "/api/send-welcome", "function": "sendWelcome" },
      { "source": "/api/og/**", "function": "dynamicMeta" },
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-Content-Type-Options", "value": "nosniff" }
        ]
      }
    ]
  }
}
```

### 7.4 Effort Summary

| Task | Hours | Risk |
|------|-------|------|
| Copy rebrand (all string replacements) | 2-4h | None |
| Color palette update (Tailwind config + components) | 4-6h | Low |
| react-router-dom integration | 8-12h | Medium |
| Homepage redesign (new sections, comparison table) | 10-14h | Low |
| 8 SEO landing pages (template + content) | 16-20h | Low |
| Dynamic OG Cloud Function | 10-14h | Medium |
| Event type templates | 4-6h | Low |
| Calendar event creation | 6-8h | Low |
| Voting layer | 15-20h | Medium |
| Favicon + OG images design | 4-6h | Low |
| localStorage migration | 1h | None |
| **Total** | **80-111h** | |

---

## 8. Domain & Migration Strategy

### 8.1 Domain Recommendation

| Domain | Pros | Cons | Recommendation |
|--------|------|------|---------------|
| **findadate.app** | .app enforces HTTPS, signals modern SaaS, likely available, memorable | Slightly longer than ideal | **Primary choice** |
| findadate.io | Tech-credible, short, popular with SaaS | Doesn't enforce HTTPS, .io has geopolitical concerns | Strong backup |
| findadate.com | Best long-term SEO equity | Likely taken or expensive ($10k+) | Acquire only if <$2,000 |

**Action plan:**
1. Check availability of `findadate.app` immediately
2. If available, register immediately (~$14/year on Google Domains)
3. Also register `findadate.io` as a defensive measure (~$30/year)
4. If `.com` is available for <$2,000, acquire and redirect to `.app`

### 8.2 Old Domain Strategy

**Do NOT abandon `vacation-scheduler` domain/URL.**

The current Firebase hosting URL and any existing links should:
1. 301 redirect all traffic to `findadate.app`
2. Preserve any existing SEO equity (even if minimal)
3. Continue working for 12+ months (long redirect grace period)

**Do NOT maintain it as a separate SEO domain.** That creates brand confusion and duplicate content issues. One domain, one brand, 301 everything.

### 8.3 Brand Transition Messaging

For existing users (if any):
> "Vacation Scheduler is now FindADate. Same tool, broader vision. Everything you created still works — same links, same data, no action needed. We just outgrew our name."

Display this as a one-time dismissable banner for 30 days post-migration.

### 8.4 DNS & Hosting Configuration

```
findadate.app → Firebase Hosting (primary)
vacation-scheduler.web.app → 301 redirect to findadate.app
www.findadate.app → 301 redirect to findadate.app (canonical non-www)
```

---

## 9. Risk & Mitigation

### 9.1 SEO Dilution Risk

**Risk:** Expanding from "vacation scheduler" to "group event planner" could weaken ranking for vacation-specific terms.

**Mitigation:**
- Dedicate `/vacation-planner` as a permanent, well-optimized landing page for all vacation keywords
- Homepage targets the broader "group scheduling" terms, not vacation
- Internal linking ensures `/vacation-planner` has strong page authority
- Vacation remains the **first** use case shown everywhere
- Monitor search console weekly for any ranking drops on vacation terms

**Likelihood:** Low. The vacation niche has almost no competition. A dedicated landing page with strong internal links will hold rankings easily.

### 9.2 Branding Confusion Risk

**Risk:** "FindADate" could be confused with dating apps.

**Mitigation:**
- Tagline immediately clarifies: "Find the best date for any group event"
- Visual identity (calendar heatmap, group avatars) has zero romantic connotation
- The `.app` domain signals utility, not social
- SEO meta descriptions always include "group scheduling" or "group event"
- If confusion persists, consider "FindADate.app" as the full spoken name (the `.app` disambiguates)

**Likelihood:** Low-Medium initially, decreasing as brand awareness builds. The research document flagged this for "Opendate" but acknowledged it can be a curiosity advantage.

### 9.3 Over-Expansion Risk

**Risk:** Trying to serve too many use cases dilutes the product experience and engineering focus.

**Mitigation:**
- The product doesn't change — only the messaging does
- Event type templates are optional UI chrome, not core changes
- The overlap algorithm is fundamentally use-case-agnostic
- Feature roadmap (voting, calendar events) serves ALL use cases equally
- Do not build use-case-specific features (e.g., budget splitting for vacations, menu planning for dinners)

**Likelihood:** Low, if discipline is maintained. The research document's "80% wording, 20% features" ratio is the right framework.

### 9.4 Competitive Retaliation Risk

**Risk:** Doodle or a well-funded competitor notices the niche and copies the multi-day heatmap feature.

**Mitigation:**
- Doodle is in decline and focused on enterprise. Their 93% negative reviews indicate organizational dysfunction, not nimble product iteration.
- When2Meet hasn't shipped a meaningful update in years.
- Speed of execution is the moat. Ship the rebrand and SEO pages in 30 days, build viral loops, establish brand before anyone reacts.
- The real competition is from indie builders (LettuceMeet, Rallly.co). Stay ahead on design quality and feature completeness.

**Likelihood:** Very low in the 12-month horizon.

### 9.5 User Clarity Risk

**Risk:** Existing vacation-focused users arrive at a broader homepage and feel the product has changed.

**Mitigation:**
- The product flow is identical. Creating a group and selecting dates works exactly the same.
- "Vacation" is always the first and most prominent use case shown.
- The `/vacation-planner` landing page serves as a dedicated entry point for vacation-intent users.
- One-time transition banner explains the change.

**Likelihood:** Very low. The product experience is unchanged.

---

## 10. 90-Day Execution Plan

### Phase 1: Foundation (Days 1-14)

**Goal:** Complete rebrand, new domain, updated visual identity.

| Day | Task | Owner |
|-----|------|-------|
| 1 | Register `findadate.app` domain | Founder |
| 1-2 | Design favicon, logo wordmark, OG images | Design |
| 2-4 | All copy replacements ("Vacation Scheduler" → "FindADate") | Dev |
| 3-5 | Color palette migration (blue → coral/orange accent) | Dev |
| 4-6 | localStorage key migration with backward compat | Dev |
| 5-7 | Update `index.html` meta tags, favicon, theme-color | Dev |
| 6-8 | Install react-router-dom, refactor App.js routing | Dev |
| 8-10 | Homepage redesign (new hero, use case pills, comparison table) | Dev |
| 10-12 | DNS configuration, Firebase custom domain setup | Dev |
| 12-14 | 301 redirects from old domain, QA pass, deploy | Dev |

**Milestone:** FindADate is live at `findadate.app` with new branding, same functionality.

### Phase 2: SEO Foundation (Days 15-30)

**Goal:** All landing pages live, indexed, meta tags complete.

| Day | Task | Owner |
|-----|------|-------|
| 15-17 | Build reusable `<LandingPage>` component template | Dev |
| 17-19 | Write content for `/vacation-planner` + `/doodle-alternative` | Content |
| 19-21 | Write content for `/when2meet-alternative` + `/find-a-date-for-dinner` | Content |
| 21-23 | Write content for `/team-scheduling` + `/party-planner` | Content |
| 23-25 | Write content for `/group-event-planner` + `/game-night-planner` | Content |
| 25-27 | Implement schema markup (JSON-LD) for all pages | Dev |
| 27-28 | Submit sitemap to Google Search Console | Dev |
| 28-30 | Internal linking audit, meta description review, deploy | Dev |

**Milestone:** 8 SEO landing pages live, sitemap submitted, structured data verified.

### Phase 3: Viral Infrastructure (Days 31-50)

**Goal:** Dynamic link previews, event templates, viral loop optimization.

| Day | Task | Owner |
|-----|------|-------|
| 31-35 | Firebase Cloud Function for dynamic OG tags on `?group=` URLs | Dev |
| 35-38 | Test link previews across WhatsApp, Slack, iMessage, Twitter, Discord | QA |
| 38-41 | Event type templates in CreateGroupForm | Dev |
| 41-43 | "Create your own event" CTA on participant result pages | Dev |
| 43-45 | Google Calendar link generation + ICS download | Dev |
| 45-48 | Post-vote CTA: "Need to plan something? Create your own event in 10 seconds." | Dev |
| 48-50 | QA pass, analytics setup, deploy | Dev |

**Milestone:** Shared links generate rich previews. Viral CTAs active. Calendar integration live.

### Phase 4: Distribution (Days 51-75)

**Goal:** Launch on Product Hunt, Reddit distribution, community building.

| Day | Task | Owner |
|-----|------|-------|
| 51-55 | Create Product Hunt "Coming Soon" page | Founder |
| 55-60 | Prepare PH launch assets (1270x760px images, video demo, maker comment) | Design/Founder |
| 60 | **Product Hunt launch** (Tuesday/Wednesday, 12:01 AM PT) | Founder |
| 60-65 | Reddit posts in r/travel, r/productivity, r/SaaS, r/boardgames | Founder |
| 65-70 | Submit to BetaList, IndieHackers, Hacker News ("Show HN") | Founder |
| 70-75 | University outreach: 10-20 student orgs | Founder |

**Milestone:** 500-2,000 signups from launch channels.

### Phase 5: Iteration (Days 76-90)

**Goal:** Voting layer, optimization based on real usage data.

| Day | Task | Owner |
|-----|------|-------|
| 76-82 | Voting layer implementation (data model, UI, Firebase rules) | Dev |
| 82-85 | Voting flow QA, edge cases (tie-breaking, late voters) | QA/Dev |
| 85-88 | Analytics review: poll creation rate, completion rate, viral coefficient | Founder |
| 88-90 | Prioritize backlog based on real user feedback, plan next 90 days | Founder |

**Milestone:** Voting layer live. First 90 days of data driving next decisions.

---

## Appendix A: File-by-File Rebrand Checklist

Files requiring string replacements for "Vacation Scheduler" → "FindADate":

| File | Changes |
|------|---------|
| `public/index.html` | `<title>`, `<meta name="description">`, theme-color |
| `src/features/home/HomePage.jsx` | Nav brand name, hero H1, hero subtitle, CTA labels |
| `src/features/home/CreateGroupForm.jsx` | Placeholder strings |
| `src/features/home/GroupCreatedScreen.jsx` | Success messaging |
| `src/features/docs/DocumentationPage.jsx` | All "Vacation Scheduler" references |
| `src/features/legal/PrivacyPolicy.jsx` | Product name references |
| `src/features/legal/TermsOfService.jsx` | Product name references |
| `src/shared/ui/Footer.js` | Brand name in footer |
| `src/App.js` | localStorage key prefixes |
| `src/features/admin/AdminPage.jsx` | localStorage key prefixes |
| `src/components/ParticipantView.js` | localStorage key prefixes |
| `package.json` | `"name": "vacation-scheduler"` → `"name": "findadate"` |
| `tailwind.config.js` | Add coral/orange color tokens |

## Appendix B: OG Image Specifications

| Image | Dimensions | Content |
|-------|-----------|---------|
| `og-image-default.png` | 1200x630 | FindADate logo + tagline + mini heatmap visual |
| `og-image-invite.png` | 1200x630 | "You're invited!" + calendar icon + brand |
| `og-image-vacation.png` | 1200x630 | Beach/travel visual + "Plan Your Group Vacation" |
| `og-image-dinner.png` | 1200x630 | Dinner table visual + "Find a Date for Dinner" |
| `og-image-team.png` | 1200x630 | Office/team visual + "Team Offsite Planner" |

All images: coral accent color, clean typography, no stock photos — illustrated or abstract.

## Appendix C: Tailwind Config Updates

```javascript
// tailwind.config.js additions
colors: {
  brand: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',  // Primary accent
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  // Keep existing dark colors
}
```
