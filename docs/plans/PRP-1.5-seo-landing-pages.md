# PRP-1.5: SEO Landing Pages + Static Meta Tags

**Priority:** Critical — Execute immediately after PRP-01 (Rebrand)
**Estimated Effort:** 12-16 hours
**Dependencies:** PRP-01 (Rebrand & Visual Identity) must be completed first
**Prerequisite assumption:** The app has already been rebranded to "FindADate" with coral/orange brand colors (brand-500: `#F97316`), design tokens exist in `src/styles/design-tokens.js`, and all "Vacation Scheduler" references have been replaced.

---

## Context & Background

FindADate is a group date-coordination platform (formerly "Vacation Scheduler"). It helps groups find the best date for any event — vacations, dinners, parties, game nights, team offsites, birthdays.

### Required Reading Before Starting

Before writing any code, the implementing agent MUST read these documents:
1. `docs/FindADate-PRD-Strategy.md` — Sections 3 (SEO Architecture), 6 (Landing Page Structure), and 7 (Technical Implementation) contain the full SEO strategy, keyword targets, page hierarchy, meta descriptions, schema markup specifications, and internal linking rules.
2. `docs/findAdate.pdf` — The research paper contains competitive intelligence, keyword volume data, and market positioning that inform the landing page content.
3. `src/styles/design-tokens.js` — The design token system created in PRP-01. All new components must use these tokens.
4. `src/features/home/HomePage.jsx` — The updated homepage (post-rebrand). Landing pages share the same CTA flow (create/join modals).
5. `tailwind.config.js` — Contains the brand color palette added in PRP-01.

---

## Objective

Build 8 SEO-optimized landing pages and install react-router-dom to replace the current manual `window.location` routing. Each page targets a distinct keyword cluster, avoids cannibalization, and funnels users to the core create-event flow.

---

## Current Architecture Problem

The current `src/App.js` uses manual `window.location.pathname` parsing and `pushState` for navigation. There is NO client-side router. Adding 8+ landing pages to this pattern is unmanageable.

**Current routing in App.js (to be replaced):**
```javascript
const path = window.location.pathname;
if (path === '/docs') { setCurrentPage('docs'); return; }
if (path === '/privacy') { setCurrentPage('privacy'); return; }
if (path === '/terms') { setCurrentPage('terms'); return; }
// ... URL params for group/admin/participant
```

---

## Implementation Steps

### Step 1: Install react-router-dom (30 min)

```bash
npm install react-router-dom
```

### Step 2: Refactor App.js Routing (3-4h)

Replace the entire manual routing system in `src/App.js` with react-router-dom.

**New App.js structure:**

```javascript
import { BrowserRouter, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';

// Lazy-loaded pages
const HomePage = React.lazy(() => import('./features/home/HomePage'));
const AdminPage = React.lazy(() => import('./features/admin/AdminPage'));
const ParticipantView = React.lazy(() => import('./components/ParticipantView'));
const GroupCreatedScreen = React.lazy(() => import('./features/home/GroupCreatedScreen'));
const DocumentationPage = React.lazy(() => import('./features/docs/DocumentationPage'));
const PrivacyPolicy = React.lazy(() => import('./features/legal/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./features/legal/TermsOfService'));
const LandingPage = React.lazy(() => import('./features/landing/LandingPage'));

function AppRoutes() {
  // Handle ?group=xxx&admin=xxx query params at root
  // This logic replaces the old useEffect URL parsing
  return (
    <Routes>
      <Route path="/" element={<RootHandler />} />
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
    </Routes>
  );
}
```

**Key considerations:**
- The `RootHandler` component handles the `?group=xxx&admin=xxx` query parameter logic that currently lives in App.js's `useEffect`
- All `window.history.pushState` calls throughout the app must be replaced with `useNavigate()` hooks
- The `onBack` callbacks that call `window.history.pushState({}, '', '/')` become `navigate('/')`
- The `GroupProvider` wrapper stays — it wraps the entire app
- The `Footer` component stays in the layout — render it on all routes
- The `StorageConsent` component stays global

**Files that need navigation updates (pushState → useNavigate):**
- `src/App.js` — Complete rewrite of routing
- `src/features/home/HomePage.jsx` — Remove internal `window.history.pushState` if any
- `src/features/admin/AdminPage.jsx` — `onBack` uses navigate
- `src/components/ParticipantView.js` — `onBack` uses navigate
- `src/features/docs/DocumentationPage.jsx` — Back button
- `src/features/legal/PrivacyPolicy.jsx` — Back button
- `src/features/legal/TermsOfService.jsx` — Back button
- `src/shared/ui/Footer.js` — Navigation links should use `<Link>` or `useNavigate`
- `src/shared/ui/StorageConsent.js` — Privacy/terms links

### Step 3: Create the LandingPage Component Template (2-3h)

Create `src/features/landing/LandingPage.jsx` — a reusable, data-driven component that renders SEO landing pages.

**Structure:**
```
┌─────────────────────────────────────────┐
│  NAV: [FindADate logo]  [Create Event]  │
├─────────────────────────────────────────┤
│  HERO: H1 (primary keyword)            │
│  Subtitle (secondary keywords)          │
│  [Create Event →]  [Join Event]         │
├─────────────────────────────────────────┤
│  PROBLEM SECTION: 2-3 paragraphs       │
│  specific to this use case              │
├─────────────────────────────────────────┤
│  HOW IT WORKS: 3-step cards             │
│  (reuse from homepage)                  │
├─────────────────────────────────────────┤
│  COMPARISON TABLE (if applicable):      │
│  FindADate vs Doodle vs When2Meet       │
├─────────────────────────────────────────┤
│  FAQ SECTION: 3-5 questions             │
│  (with JSON-LD schema)                  │
├─────────────────────────────────────────┤
│  INTERNAL LINKS: Related pages          │
├─────────────────────────────────────────┤
│  FINAL CTA: [Create Event — Free →]    │
├─────────────────────────────────────────┤
│  FOOTER                                 │
└─────────────────────────────────────────┘
```

The LandingPage component receives a `type` prop and pulls content from a config object.

### Step 4: Create Landing Page Content Config (3-4h)

Create `src/features/landing/landingPageContent.js` with all 8 landing page configurations.

Each config must include:
- `slug` — URL path
- `title` — HTML `<title>` tag
- `metaDescription` — meta description
- `h1` — primary H1 keyword
- `subtitle` — secondary keyword-rich text
- `problemSection` — use-case-specific pain point description (2-3 paragraphs)
- `comparisonTable` — boolean (only for /doodle-alternative and /when2meet-alternative)
- `faqs` — array of {question, answer} for FAQ schema
- `relatedPages` — array of slugs for internal linking
- `ogImage` — OG image path (can be placeholder initially)

**Here are the 8 landing page configurations with full SEO content:**

#### Page 1: /vacation-planner

```javascript
{
  slug: 'vacation-planner',
  title: 'Group Vacation Planner — Find When Everyone\'s Free | FindADate',
  metaDescription: 'Planning a group trip? Everyone marks their free dates on the calendar. FindADate finds the best overlapping vacation window instantly. Free, no account needed.',
  h1: 'Plan Your Group Vacation Without the Chaos',
  subtitle: 'Everyone marks their available travel dates. The algorithm finds the perfect window where the most people overlap. From weekend getaways to two-week adventures.',
  problemSection: [
    'You want to plan a trip with friends. You send "when works for everyone?" in the group chat. Twenty messages and three days later, half the group hasn\'t replied and the other half gave conflicting dates. Sound familiar?',
    'Traditional scheduling tools like Doodle are built for one-hour meetings, not week-long vacations. When you\'re coordinating a multi-day trip across 8-15 people with different vacation schedules, work commitments, and travel constraints, you need a tool that understands date ranges — not time slots.',
    'FindADate was built for exactly this. Set your potential travel window (say, June through August), share one link, and let everyone mark which days they\'re free. The heatmap instantly shows you where the most people overlap. No sign-up, no ads, no back-and-forth.'
  ],
  showComparison: false,
  faqs: [
    { question: 'How does FindADate work for vacation planning?', answer: 'Create an event with your travel date range, share the link with your group, and everyone marks their available days on a visual calendar. The algorithm calculates the best overlapping window where the most people are free.' },
    { question: 'Do participants need to create an account?', answer: 'No. Participants only need the shared link. They enter their name, mark their available days, and submit. No sign-up, no email required.' },
    { question: 'Can FindADate handle multi-day vacation windows?', answer: 'Yes — this is FindADate\'s core strength. Unlike Doodle or When2Meet which focus on single time slots, FindADate is built for multi-day date ranges. It finds the best 3-day, 5-day, 7-day, or any-length window across your group.' },
    { question: 'Is FindADate free for vacation planning?', answer: 'Yes, completely free. No ads, no premium tier required, no participant limits. Create unlimited events.' }
  ],
  relatedPages: ['doodle-alternative', 'group-event-planner', 'team-scheduling'],
}
```

#### Page 2: /doodle-alternative

```javascript
{
  slug: 'doodle-alternative',
  title: 'Best Free Doodle Alternative 2026 | FindADate',
  metaDescription: 'Tired of Doodle\'s ads and paywalls? FindADate is a free, ad-free group scheduling tool with visual heatmaps, multi-day support, and zero sign-up.',
  h1: 'The Free Doodle Alternative You\'ve Been Looking For',
  subtitle: 'No ads. No account required. No paywalled features. FindADate is what Doodle used to be — but better, with visual heatmaps and multi-day event support.',
  problemSection: [
    'Doodle was once the go-to tool for group scheduling. But with 93% one-star reviews on Trustpilot, an ad-cluttered free tier, and formerly free features now locked behind a $6.95/month paywall, users are actively searching for alternatives.',
    'The core problem Doodle solves — "when is everyone free?" — is still valid. But Doodle\'s execution has deteriorated. You shouldn\'t need a subscription to schedule a dinner with friends. You shouldn\'t have to watch ads while trying to coordinate a team offsite.',
    'FindADate takes Doodle\'s original promise and does it properly. Visual availability heatmaps show overlap at a glance. Multi-day date ranges support vacations and retreats, not just one-hour meetings. And it\'s genuinely free — no ads, no account for participants, no limits.'
  ],
  showComparison: true,
  faqs: [
    { question: 'Why switch from Doodle to FindADate?', answer: 'FindADate is completely free with no ads, supports multi-day date ranges (not just time slots), requires no account for participants, and shows visual heatmaps of group availability. Doodle\'s free tier is ad-heavy and increasingly limited.' },
    { question: 'Is FindADate really free?', answer: 'Yes. FindADate\'s core features are completely free — unlimited events, unlimited participants, no ads, no account required for voters. No bait-and-switch.' },
    { question: 'Does FindADate work for meetings like Doodle?', answer: 'FindADate excels at finding the best date for any group event. For single-day events like meetings, dinners, or game nights, it works perfectly. For multi-day events like vacations and retreats, it\'s significantly better than Doodle.' },
    { question: 'Can I import my Doodle polls into FindADate?', answer: 'There\'s no direct import, but creating a new FindADate event takes under 60 seconds. Share the link in the same group chat and you\'re up and running.' }
  ],
  relatedPages: ['when2meet-alternative', 'vacation-planner', 'group-event-planner'],
}
```

#### Page 3: /when2meet-alternative

```javascript
{
  slug: 'when2meet-alternative',
  title: 'When2Meet Alternative That Works on Mobile | FindADate',
  metaDescription: 'When2Meet, but modern. FindADate works on every device, supports multi-day events, and doesn\'t abandon you after the poll.',
  h1: 'When2Meet, But Built for 2026',
  subtitle: 'Same zero-friction approach you love. Modern UI that actually works on phones. Plus multi-day event support and a workflow that doesn\'t end at the heatmap.',
  problemSection: [
    'When2Meet has survived for over 15 years for one reason: it\'s dead simple. No account, no sign-up, just mark your availability on a grid. That simplicity is worth preserving.',
    'But When2Meet\'s interface was built in the late 2000s and it shows. It\'s essentially unusable on mobile phones — where most group chat links are opened. It has no calendar integration, no reminders, and once you see the green overlap grid, you\'re on your own to create the actual event.',
    'FindADate keeps what makes When2Meet great (zero friction, no account, instant availability grid) and fixes everything that\'s broken: responsive mobile design, visual heatmaps with multi-day support, and a path from "when works" to "see you there."'
  ],
  showComparison: true,
  faqs: [
    { question: 'How is FindADate different from When2Meet?', answer: 'FindADate works on mobile, supports multi-day date ranges (not just hourly grids), shows color-coded heatmaps, and is designed to take you beyond just finding overlap — to actually confirming and scheduling the event.' },
    { question: 'Does FindADate require an account like When2Meet?', answer: 'No. Like When2Meet, participants don\'t need an account. Just open the link, enter your name, and mark your dates. The organizer doesn\'t need an account either.' },
    { question: 'Can I use FindADate for finding meeting times like When2Meet?', answer: 'Yes. FindADate handles both single-day and multi-day scheduling. For weekly meetings, you can set a one-week range and everyone marks their free days.' },
    { question: 'Is FindADate as fast as When2Meet?', answer: 'Creating an event takes under 60 seconds. Sharing is one link. Responding is tap-to-select on a visual calendar. It\'s designed to be just as frictionless.' }
  ],
  relatedPages: ['doodle-alternative', 'group-event-planner', 'game-night-planner'],
}
```

#### Page 4: /find-a-date-for-dinner

```javascript
{
  slug: 'find-a-date-for-dinner',
  title: 'Find a Date for Dinner With Friends | FindADate',
  metaDescription: 'Stop going back and forth in the group chat. Everyone marks their free evenings. FindADate shows you the best night for dinner in seconds.',
  h1: 'Find the Perfect Dinner Date for Your Group',
  subtitle: 'Planning dinner with 6+ friends? Skip the 47-message group chat debate. Everyone marks their free evenings, and you see the best night instantly.',
  problemSection: [
    '"Who\'s free Friday?" "Not me, how about Saturday?" "Saturday works but not next Saturday." "What about the week after?" Sound familiar? Coordinating dinner with friends shouldn\'t take more effort than cooking the meal itself.',
    'The bigger the group, the worse it gets. With 6-8 people, there are dozens of possible evenings and everyone has a different schedule. Group chats turn into scheduling chaos that nobody wants to manage.',
    'FindADate cuts through the noise in 30 seconds. Create an event, set the date range (this week, this month, whenever), share the link, and everyone taps their free evenings. The heatmap shows you the evening that works for the most people. Done.'
  ],
  showComparison: false,
  faqs: [
    { question: 'How do I find a dinner date for a large group?', answer: 'Create a FindADate event with your preferred date range, share the link in your group chat, and everyone marks their free evenings. The visual heatmap shows which nights have the most availability overlap.' },
    { question: 'Can I use FindADate for weekly dinner planning?', answer: 'Absolutely. Set a one or two-week range and let your group mark which evenings work. It\'s perfect for recurring dinner clubs or friend groups that meet regularly.' },
    { question: 'Do my friends need to download an app?', answer: 'No. FindADate works in any mobile or desktop browser. Just share the link — no app download, no account creation needed.' }
  ],
  relatedPages: ['party-planner', 'group-event-planner', 'vacation-planner'],
}
```

#### Page 5: /group-event-planner

```javascript
{
  slug: 'group-event-planner',
  title: 'Group Event Date Finder — Schedule Any Group Activity | FindADate',
  metaDescription: 'Find the best date for any group event. Weddings, reunions, meetups, outings — everyone marks availability, FindADate finds the overlap.',
  h1: 'Find the Best Date for Any Group Event',
  subtitle: 'Whether it\'s a reunion, a meetup, a workshop, or a celebration — stop guessing and start coordinating. Visual availability for groups of any size.',
  problemSection: [
    'Every group event starts the same way: someone needs to find a date that works for everyone. Whether it\'s a family reunion, a neighborhood meetup, a club outing, or a workshop — the coordination problem is universal.',
    'Existing tools either force everyone to create accounts (Doodle) or offer a dated interface that barely works on phones (When2Meet). Most people default to group chats, which inevitably devolve into a scheduling nightmare.',
    'FindADate handles the universal "when is everyone free?" problem with zero friction. One link, visual calendar, instant overlap results. Works for 4 people or 40.'
  ],
  showComparison: false,
  faqs: [
    { question: 'What types of events can I plan with FindADate?', answer: 'Any event where you need to find a date that works for a group. Vacations, dinners, parties, game nights, team offsites, weddings, reunions, club meetings — if multiple people need to agree on a date, FindADate helps.' },
    { question: 'How many participants can join?', answer: 'There is no hard limit on participants. FindADate works for small groups of 3-5 and large groups of 20+.' },
    { question: 'Is FindADate good for recurring events?', answer: 'Yes. Create a new event each time you need to find the next date. It\'s designed to be fast enough that creating a fresh event takes under a minute.' }
  ],
  relatedPages: ['vacation-planner', 'doodle-alternative', 'team-scheduling'],
}
```

#### Page 6: /team-scheduling

```javascript
{
  slug: 'team-scheduling',
  title: 'Team Offsite & Retreat Date Planner | FindADate',
  metaDescription: 'Coordinate team offsite dates across timezones. Visual availability heatmap shows the best window for your retreat. Free for teams of any size.',
  h1: 'Find the Best Date for Your Team Offsite or Retreat',
  subtitle: 'Distributed team? Multiple timezones? Conflicting PTO? Share one link and let everyone mark their available dates. The heatmap finds the window that works.',
  problemSection: [
    '92% of remote teams span at least two timezones. Planning a quarterly offsite, annual retreat, or all-hands meeting means coordinating across different work schedules, PTO calendars, and travel constraints. Enterprise tools like Calendly are overkill (and expensive) for what should be a simple question: when can everyone make it?',
    'FindADate gives you the answer in minutes. Set the potential date range for your offsite (e.g., Q3 2026), share the link with your team on Slack or email, and everyone marks their available days. The visual heatmap immediately shows which weeks have the highest team availability.',
    'No per-seat pricing. No SSO required. No account creation for team members. Just a link, a calendar, and a result.'
  ],
  showComparison: false,
  faqs: [
    { question: 'Can I use FindADate for team scheduling across timezones?', answer: 'Yes. FindADate focuses on date availability (not hourly time slots), which makes timezone differences irrelevant. Everyone marks which days they\'re available regardless of their timezone.' },
    { question: 'Is FindADate free for teams?', answer: 'Yes, completely free for teams of any size. No per-seat pricing, no team plan required.' },
    { question: 'How do I share FindADate with my team?', answer: 'Create an event, set your date range, and share the generated link via Slack, email, or any messaging tool. Team members click the link, mark their availability, and you see the results instantly.' }
  ],
  relatedPages: ['group-event-planner', 'vacation-planner', 'doodle-alternative'],
}
```

#### Page 7: /party-planner

```javascript
{
  slug: 'party-planner',
  title: 'Birthday & Party Date Finder | FindADate',
  metaDescription: 'Planning a birthday party or celebration? Find the date that works for the most guests. Share a link, collect availability, see the best match.',
  h1: 'Find the Best Date for a Birthday, Party, or Celebration',
  subtitle: 'Planning a surprise party? Bachelor weekend? Holiday gathering? Everyone marks their free dates and you see the best option in seconds.',
  problemSection: [
    'The hardest part of planning a party isn\'t the food, the venue, or the decorations — it\'s finding a date that actually works for everyone you want to be there. Especially for milestone birthdays, bachelor/ette parties, or holiday celebrations where specific people MUST attend.',
    'Asking "when are you free?" in a group chat gives you a mess of conflicting answers. Creating a Doodle poll means half your guests need to create an account and deal with ads just to say "Saturday works."',
    'FindADate lets you share one link. Guests tap their free dates on a visual calendar (no account needed), and you instantly see which date has the most availability. Plan the party, not the poll.'
  ],
  showComparison: false,
  faqs: [
    { question: 'Can I use FindADate for surprise party planning?', answer: 'Yes! Create the event, share the link only with the people who are in on the surprise, and find the best date without tipping off the guest of honor.' },
    { question: 'How do I find a date for a bachelor or bachelorette party?', answer: 'Create a FindADate event with the potential weekend range, share the link with the group, and everyone marks which weekends they\'re free. The heatmap shows the best weekend instantly.' },
    { question: 'Is FindADate good for large parties with 20+ guests?', answer: 'Absolutely. FindADate works with groups of any size. The visual heatmap becomes even more useful with larger groups where manual coordination is impossible.' }
  ],
  relatedPages: ['find-a-date-for-dinner', 'group-event-planner', 'vacation-planner'],
}
```

#### Page 8: /game-night-planner

```javascript
{
  slug: 'game-night-planner',
  title: 'Game Night Scheduler — Find the Best Date | FindADate',
  metaDescription: 'Coordinating game night with 6+ players? Skip the group chat chaos. Everyone marks their availability, FindADate finds the overlap.',
  h1: 'Schedule Your Next Game Night Without the Hassle',
  subtitle: 'D&D session? Board game night? LAN party? Finding an evening that works for 4-8 players is harder than the final boss. Let the algorithm handle it.',
  problemSection: [
    'Every board gamer and D&D group knows the struggle. You need 4-8 players to all be free on the same evening, and coordinating that across busy adult schedules is a recurring headache. The r/boardgames community (5M+ members) consistently calls scheduling "the biggest barrier to playing."',
    'When2Meet\'s hourly grid is overkill for what you need — you just want to know which evenings this month work for everyone. Group chats devolve into "I can do Tuesday but not next Tuesday" spirals that nobody wants to manage.',
    'FindADate makes it simple. Set the month, share the link in your game group chat, and everyone taps which evenings they\'re free. The heatmap shows the winning night. Roll initiative.'
  ],
  showComparison: false,
  faqs: [
    { question: 'Can I use FindADate for recurring game nights?', answer: 'Yes. Create a new event each time you need to find the next game night. It takes under a minute, and you can share the same group chat link.' },
    { question: 'Does FindADate work for D&D scheduling?', answer: 'Perfectly. Set a date range, have your party mark their free evenings, and find the session that works for the most players. No more cancelled sessions.' },
    { question: 'How is FindADate better than a poll for game nights?', answer: 'Polls show you who voted for what. FindADate shows you a visual heatmap of everyone\'s availability, making it instantly clear which evening has the most overlap — especially useful when you need a minimum number of players.' }
  ],
  relatedPages: ['find-a-date-for-dinner', 'when2meet-alternative', 'group-event-planner'],
}
```

### Step 5: Implement Schema Markup (2h)

Create `src/features/landing/SchemaMarkup.jsx` — a component that injects JSON-LD structured data into the page head.

**Three schema types needed:**

1. **SoftwareApplication** (homepage only):
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "FindADate",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "description": "Free group scheduling tool. Everyone marks their availability, the algorithm finds the best overlapping dates."
}
```

2. **FAQPage** (all landing pages with FAQs):
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "question text",
      "acceptedAnswer": { "@type": "Answer", "text": "answer text" }
    }
  ]
}
```

3. **HowTo** (use case pages — vacation, dinner, team, party, gamenight):
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Find the Best Date for [Use Case]",
  "step": [
    { "@type": "HowToStep", "text": "Create an event and set your date range" },
    { "@type": "HowToStep", "text": "Share the link with your group" },
    { "@type": "HowToStep", "text": "Everyone marks their available dates" },
    { "@type": "HowToStep", "text": "See the best overlapping dates instantly" }
  ]
}
```

### Step 6: Update Meta Tags Per Page (1-2h)

Each landing page needs its own `<title>` and `<meta name="description">`. Since we're using CRA (not Next.js), use `react-helmet-async` or a simple `useEffect` to update `document.title` and meta tags dynamically.

```bash
npm install react-helmet-async
```

Wrap the app in `<HelmetProvider>` and use `<Helmet>` in each landing page to set:
- `<title>`
- `<meta name="description">`
- `<meta property="og:title">`
- `<meta property="og:description">`
- `<meta property="og:url">`
- `<link rel="canonical">`

### Step 7: Build the Comparison Table Component (1h)

Create `src/features/landing/ComparisonTable.jsx` for use on `/doodle-alternative` and `/when2meet-alternative`.

**Comparison data:**

| Feature | FindADate | Doodle | When2Meet |
|---------|-----------|--------|-----------|
| Free to use | Yes, fully | Limited free tier | Yes |
| No ads | Yes | No (heavy ads) | Yes |
| Works on mobile | Yes | Broken experience | Essentially unusable |
| Multi-day date ranges | Yes (core feature) | No (time slots only) | No (hourly grid) |
| No account needed | Yes (all users) | Organizer needs account | Yes (all users) |
| Visual heatmap | Color-coded overlap | Checkmark table | Basic green grid |
| Post-poll workflow | Planned (voting + calendar) | None in free tier | None |

Use brand-500 for checkmarks, gray for X marks. Professional, factual tone.

### Step 8: Internal Linking Component (30min)

Create a `RelatedPages` component that renders at the bottom of each landing page with links to 3 related pages.

**Linking rules (from PRD Section 3.4):**
- Every landing page links back to homepage
- Comparison pages link to each other
- Use case pages link to 2-3 related use case pages
- Use descriptive anchor text (not "click here")

### Step 9: Sitemap Generation (1h)

Create a script or static `public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://findadate.app/</loc><priority>1.0</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://findadate.app/vacation-planner</loc><priority>0.9</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://findadate.app/doodle-alternative</loc><priority>0.9</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://findadate.app/when2meet-alternative</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://findadate.app/find-a-date-for-dinner</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://findadate.app/group-event-planner</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://findadate.app/team-scheduling</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://findadate.app/party-planner</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://findadate.app/game-night-planner</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://findadate.app/docs</loc><priority>0.5</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://findadate.app/privacy</loc><priority>0.3</priority><changefreq>yearly</changefreq></url>
  <url><loc>https://findadate.app/terms</loc><priority>0.3</priority><changefreq>yearly</changefreq></url>
</urlset>
```

Also create `public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://findadate.app/sitemap.xml
```

### Step 10: Firebase Hosting Updates (30min)

Update `firebase.json` to ensure all routes properly rewrite to `index.html`:
```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "/api/send-reminder", "function": "sendReminder" },
      { "source": "/api/send-welcome", "function": "sendWelcome" },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

---

## SEO Keyword Reference (from Research Paper)

These volumes are from the research document `docs/findAdate.pdf` and should inform content priority:

| Keyword | Monthly Searches | Competition | Target Page |
|---------|-----------------|-------------|-------------|
| doodle alternative | 8,000-15,000 | Medium | /doodle-alternative |
| when2meet alternative | 3,000-8,000 | Low | /when2meet-alternative |
| free group scheduling | 2,000-5,000 | Low-Medium | Homepage |
| group scheduling tool | 1,000-3,000 | Medium | Homepage |
| schedule group event | 500-1,500 | Low | /group-event-planner |
| group availability tool | 500-1,500 | Low | Homepage |
| plan trip with friends app | 200-500 | Very Low | /vacation-planner |
| vacation planner with friends | 200-500 | Very Low | /vacation-planner |
| find best date for group | 200-600 | Very Low | Homepage |
| plan dinner with friends | 300-800 | Low | /find-a-date-for-dinner |
| team offsite planner | 100-400 | Very Low | /team-scheduling |

---

## Testing Checklist

- [ ] `npm start` — app loads without errors
- [ ] Homepage route `/` renders correctly
- [ ] All 8 landing pages render at their URLs
- [ ] `/docs`, `/privacy`, `/terms` still work
- [ ] `?group=xxx` query param still loads participant view
- [ ] `?group=xxx&admin=xxx` still loads admin panel
- [ ] Browser back/forward buttons work correctly
- [ ] All internal links navigate properly (no full page reloads)
- [ ] Footer navigation works on all pages
- [ ] Each landing page has unique `<title>` and meta description (inspect with dev tools)
- [ ] JSON-LD schema is present in page source (check with Google Rich Results Test)
- [ ] Comparison table renders on `/doodle-alternative` and `/when2meet-alternative`
- [ ] FAQ sections render on all landing pages
- [ ] Internal linking section appears at bottom of each landing page
- [ ] `sitemap.xml` and `robots.txt` are accessible at their URLs
- [ ] `npm test` — all existing tests pass
- [ ] No 404s when navigating between pages
- [ ] CTA buttons on landing pages open the create/join modals correctly

---

## Files Created

- `src/features/landing/LandingPage.jsx`
- `src/features/landing/landingPageContent.js`
- `src/features/landing/ComparisonTable.jsx`
- `src/features/landing/RelatedPages.jsx`
- `src/features/landing/SchemaMarkup.jsx`
- `public/sitemap.xml`
- `public/robots.txt`

## Files Modified

- `package.json` (add react-router-dom, react-helmet-async)
- `src/App.js` (complete routing rewrite)
- `src/features/home/HomePage.jsx` (navigation updates)
- `src/features/admin/AdminPage.jsx` (navigation updates)
- `src/components/ParticipantView.js` (navigation updates)
- `src/features/docs/DocumentationPage.jsx` (navigation updates)
- `src/features/legal/PrivacyPolicy.jsx` (navigation updates)
- `src/features/legal/TermsOfService.jsx` (navigation updates)
- `src/shared/ui/Footer.js` (use Link components)
- `src/shared/ui/StorageConsent.js` (use Link components)
- `firebase.json` (hosting rewrites)
