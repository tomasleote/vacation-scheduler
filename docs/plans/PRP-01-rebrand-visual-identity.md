# PRP-01: Complete Rebrand & Visual Identity

**Priority:** Critical — Must be completed first
**Estimated Effort:** 15-20 hours
**Dependencies:** None (this is the foundation for all other PRPs)

---

## Context & Background

We are rebranding "Vacation Scheduler" to **FindADate** — a smart group availability planner that works for vacations, dinners, parties, game nights, cinema trips, team outings, birthdays, and any event requiring date coordination.

### Required Reading Before Starting

Before writing any code, the implementing agent MUST read these documents:
1. `docs/FindADate-PRD-Strategy.md` — Full PRD with positioning, SEO strategy, branding decisions
2. `docs/findAdate.pdf` — Research document with competitive analysis, market positioning, and visual direction guidelines

These documents contain critical decisions about:
- Color palette rationale (why coral/orange, why NOT blue)
- Typography decisions (Inter font — already in use)
- Brand voice and personality
- Competitive positioning against Doodle, When2Meet
- Target audience segments

---

## Objective

Transform every user-facing element of the application from "Vacation Scheduler" (a narrow vacation tool) to **FindADate** (a universal group date-coordination platform), including:
1. All copy and string replacements
2. New color palette (coral/warm orange primary accent, replacing blue)
3. Unified design token system
4. Logo/favicon/brand assets
5. Updated homepage messaging
6. localStorage key migration

The vacation use case remains the **primary showcased use case** but the tool is now positioned for any group event.

---

## Using the Anthropic Frontend Design Skill

This PRP MUST use the official Anthropic frontend design skill for all visual/UI decisions.

### How to Install & Use the Skill

The skill is built into Claude Code as a plugin. To use it:

1. **Invoke the skill** at the start of implementation by calling:
   ```
   /frontend-design
   ```
   This loads the skill's design system guidelines, color theory principles, and component patterns.

2. **What the skill provides:**
   - Design philosophy: distinctive, non-generic aesthetics
   - Color palette generation with proper contrast ratios
   - Typography hierarchy guidelines
   - Component design patterns (hero sections, cards, CTAs)
   - Layout and spacing systems
   - Animation and interaction guidelines
   - Accessibility requirements

3. **When to invoke it:**
   - Before designing the color palette
   - Before building the homepage hero section
   - Before creating any new UI components
   - When making visual hierarchy decisions

4. **The skill enforces:**
   - No generic "AI-looking" designs
   - Proper visual hierarchy
   - Conversion-oriented layouts
   - Accessibility-first approach
   - Modern SaaS aesthetics

### Design Agent Usage

For the color palette specifically, use a **design specialist agent** to:
- Analyze the competitive landscape colors (Doodle: blue, Calendly: blue, When2Meet: green)
- Generate a distinctive palette that avoids competitor colors
- Ensure WCAG AA contrast ratios on dark backgrounds
- Create a cohesive heatmap gradient (gray → amber → coral for availability visualization)
- Test the palette against the existing dark theme (dark-950: `hsl(224, 71%, 4%)`)

---

## Design Token System

### Step 1: Create a Unified Design Tokens File

Create `src/styles/design-tokens.js` as the single source of truth for ALL colors, typography, spacing, and brand values.

```javascript
// src/styles/design-tokens.js
// FindADate Design Token System
// This file is the SINGLE SOURCE OF TRUTH for all visual properties.
// All components should reference these tokens. Never hardcode colors.

export const tokens = {
  colors: {
    brand: {
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316',  // Primary accent — CTAs, buttons, brand highlight
      600: '#EA580C',
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12',
    },
    amber: {
      400: '#FBBF24',
      500: '#F59E0B',  // Secondary accent — heatmap peak, hover states
    },
    dark: {
      950: 'hsl(224, 71%, 4%)',   // Page background
      900: 'hsl(222, 47%, 11%)',  // Card/surface background
      800: 'hsl(223, 30%, 16%)',  // Elevated surface
      700: 'hsl(223, 22%, 22%)',  // Borders
    },
    success: '#10B981',   // Emerald — confirmations
    error: '#EF4444',     // Red — errors
    warning: '#F59E0B',   // Amber — warnings
    info: '#3B82F6',      // Blue — info (sparingly)
    text: {
      primary: 'hsl(210, 40%, 98%)',    // Near white
      secondary: 'hsl(215, 20%, 65%)',  // Gray
      muted: 'hsl(215, 15%, 45%)',      // Dimmed
    },
    heatmap: {
      empty: '#374151',     // No availability
      low: '#92400E',       // Low overlap
      medium: '#F59E0B',    // Medium overlap (amber)
      high: '#FB923C',      // High overlap (orange)
      full: '#F97316',      // Full overlap (coral/brand)
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    sizes: {
      hero: '3rem',        // 48px — H1 hero
      h1: '2.25rem',       // 36px
      h2: '1.875rem',      // 30px
      h3: '1.5rem',        // 24px
      h4: '1.25rem',       // 20px
      body: '1rem',        // 16px
      small: '0.875rem',   // 14px
      caption: '0.75rem',  // 12px
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    section: '5rem',      // Between major page sections
    card: '1.5rem',       // Card internal padding
    element: '1rem',      // Between elements
    tight: '0.5rem',      // Tight spacing
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  brand: {
    name: 'FindADate',
    tagline: 'Find the best date for anything.',
    taglineAlt: 'Stop texting. Start planning.',
    email: 'hello@findadate.app',
    github: 'https://github.com/tomasleote/vacation-scheduler',
  },
};

export default tokens;
```

### Step 2: Update Tailwind Config

Update `tailwind.config.js` to include the new brand colors alongside existing dark colors:

```javascript
// Add to tailwind.config.js theme.extend.colors:
brand: {
  50: '#FFF7ED',
  100: '#FFEDD5',
  200: '#FED7AA',
  300: '#FDBA74',
  400: '#FB923C',
  500: '#F97316',
  600: '#EA580C',
  700: '#C2410C',
  800: '#9A3412',
  900: '#7C2D12',
},
```

---

## Implementation Steps

### Phase 1: Design Token System (2-3h)

1. Create `src/styles/design-tokens.js` with the full token system above
2. Update `tailwind.config.js` to add `brand` color palette
3. Verify the design tokens file is importable from all components

### Phase 2: Global String Replacements (2-4h)

Replace ALL instances across the codebase. Use search-and-replace carefully.

**File-by-file checklist:**

| File | What to Change |
|------|----------------|
| `public/index.html` | `<title>FindADate — Find the Best Date for Any Group Event</title>`, update `<meta name="description">`, add `<meta name="theme-color" content="#F97316">` |
| `package.json` | `"name": "findadate"` |
| `src/features/home/HomePage.jsx` | Nav: "FindADate", Hero H1: "Find the best date for **anything.**", Subtitle: "Vacation. Dinner. Party. Game night. Everyone marks their dates. We find the overlap.", CTAs: "Create Event →" / "Join Event", How It Works step 1: "Set a date range and share the link with your group." |
| `src/features/home/CreateGroupForm.jsx` | Placeholder: "e.g., Summer Trip 2026, Friday Dinner, Game Night...", Description placeholder: "What are you planning? A beach vacation, birthday dinner, team offsite..." |
| `src/features/home/GroupCreatedScreen.jsx` | Title: "Event created!", labels updated from "trip" language |
| `src/features/home/JoinGroupForm.jsx` | Any "trip" or "vacation" specific language |
| `src/features/docs/DocumentationPage.jsx` | All "Vacation Scheduler" → "FindADate", update intro to reflect broader positioning |
| `src/features/legal/PrivacyPolicy.jsx` | All "Vacation Scheduler" → "FindADate" |
| `src/features/legal/TermsOfService.jsx` | All "Vacation Scheduler" → "FindADate" |
| `src/shared/ui/Footer.js` | Brand name: "FindADate", description updated, email updated |
| `src/features/admin/AdminPage.jsx` | Any "vacation" specific labels |
| `src/components/ParticipantView.js` | Any "vacation" or "trip" specific labels |
| `src/features/admin/GroupSettings.jsx` | Any "vacation" specific labels |
| `src/features/admin/OverlapResults.jsx` | Any "vacation" specific labels |
| `src/features/recovery/RecoverAdminForm.jsx` | Any "vacation" specific labels |

### Phase 3: localStorage Key Migration (1h)

In `src/App.js`, add a one-time migration at the top of the `useEffect`:

```javascript
// One-time migration from old keys
try {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('vacation_admin_')) {
      const newKey = key.replace('vacation_admin_', 'fad_admin_');
      localStorage.setItem(newKey, localStorage.getItem(key));
      localStorage.removeItem(key);
    }
    if (key.startsWith('vacation_p_')) {
      const newKey = key.replace('vacation_p_', 'fad_p_');
      localStorage.setItem(newKey, localStorage.getItem(key));
      localStorage.removeItem(key);
    }
  });
} catch {}
```

Then update ALL localStorage references:
- `vacation_admin_${gId}` → `fad_admin_${gId}`
- `vacation_p_${gId}` → `fad_p_${gId}`
- `vacation_admin_p_${groupId}` → `fad_admin_p_${groupId}`

Files affected:
- `src/App.js` (lines 49, 61, 67, 83, 89, 114)
- `src/features/admin/AdminPage.jsx` (via hooks)
- `src/features/admin/hooks/useGroupData.js`
- `src/components/ParticipantView.js`

### Phase 4: Color Palette Migration (4-6h)

Replace blue accent colors with brand coral/orange across ALL components.

**Search and replace patterns:**

| Old Pattern | New Pattern | Context |
|------------|------------|---------|
| `text-blue-400` | `text-brand-400` | Text accents, links |
| `text-blue-500` | `text-brand-500` | Icon colors, emphasis |
| `bg-blue-500` | `bg-brand-500` | Primary buttons |
| `bg-blue-500/10` | `bg-brand-500/10` | Icon backgrounds |
| `hover:bg-blue-400` | `hover:bg-brand-400` | Button hover states |
| `hover:text-blue-400` | `hover:text-brand-400` | Link hover states |
| `border-blue-500` | `border-brand-500` | Focus rings |

**IMPORTANT exceptions — DO NOT replace:**
- `text-blue-300` / `text-blue-400` in info cards (`Card variant="info"`) — these should remain blue for semantic "info" meaning
- Any blue used in the `Card` component's `info` variant

**Files to update (check each one):**
- `src/shared/ui/Button.js`
- `src/shared/ui/Card.js`
- `src/shared/ui/Input.js`
- `src/shared/ui/CopyButton.js`
- `src/shared/ui/Modal.js`
- `src/shared/ui/Footer.js`
- `src/shared/ui/StorageConsent.js`
- `src/features/home/HomePage.jsx`
- `src/features/home/CreateGroupForm.jsx`
- `src/features/home/GroupCreatedScreen.jsx`
- `src/features/home/JoinGroupForm.jsx`
- `src/features/admin/AdminPage.jsx`
- `src/features/admin/GroupSettings.jsx`
- `src/features/admin/AdminAvailability.jsx`
- `src/features/admin/OverlapResults.jsx`
- `src/features/admin/ParticipantTable.jsx`
- `src/components/ParticipantView.js`
- `src/components/CalendarView.js`
- `src/components/SlidingOverlapCalendar.js`
- `src/components/ResultsDisplay.js`
- `src/features/recovery/RecoverAdminForm.jsx`
- `src/features/docs/DocumentationPage.jsx`
- `src/features/legal/PrivacyPolicy.jsx`
- `src/features/legal/TermsOfService.jsx`

### Phase 5: Homepage Redesign (4-6h)

Update `src/features/home/HomePage.jsx` with the new structure:

1. **Nav bar**: "FindADate" logo text (use brand-500 for the "A"), keep Create/Join/Recover buttons but relabel
2. **Hero section**:
   - H1: `Find the best date for <span class="text-brand-400">anything.</span>`
   - Subtitle: "Vacation. Dinner. Party. Game night. Everyone marks their dates. We find the overlap."
   - CTAs: "Create Event →" (primary) / "Join Event" (secondary)
3. **Use case pills** (new section below hero): Clickable pills showing event types
   - `[Vacation] [Dinner] [Birthday] [Game Night] [Team Offsite]`
   - These are visual only for now — they will become functional in PRP-02 (Event Templates)
4. **How It Works**: Keep the 3-card layout, update icons to use brand color
   - "1. Create — Set a date range and share the link"
   - "2. Respond — Everyone marks their free days on the calendar"
   - "3. Match — The algorithm finds the best overlapping dates"
5. **Modal titles**: "Create a Trip" → "Create Event", "Join a Trip" → "Join Event"

### Phase 6: index.html Meta Tags (1h)

Update `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#F97316" />
    <meta name="description" content="FindADate — Find the best date for any group event. Vacations, dinners, parties, game nights. Everyone marks their dates, we find the overlap. Free, no sign-up." />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="FindADate — Find the Best Date for Any Group Event" />
    <meta property="og:description" content="Everyone marks their availability. The algorithm finds the overlap. Free, no sign-up required." />
    <meta property="og:site_name" content="FindADate" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="FindADate — Find the Best Date for Any Group Event" />
    <meta name="twitter:description" content="Stop texting. Start planning. Free group date finder." />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title>FindADate — Find the Best Date for Any Group Event</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

---

## Testing Checklist

After all changes:

- [ ] `npm start` — app loads without errors
- [ ] Homepage displays "FindADate" branding with coral accent
- [ ] "Create Event" modal opens and works
- [ ] "Join Event" modal opens and works
- [ ] "Recover" modal opens and works
- [ ] Create a new group → success screen shows "Event created!"
- [ ] Admin panel loads correctly for an existing group
- [ ] Participant view loads correctly
- [ ] Documentation page shows "FindADate" throughout
- [ ] Privacy Policy shows "FindADate" throughout
- [ ] Terms of Service shows "FindADate" throughout
- [ ] Footer shows "FindADate" branding
- [ ] No remaining instances of "Vacation Scheduler" in the UI (search all files)
- [ ] No remaining `vacation_admin_` or `vacation_p_` localStorage keys used (search all files)
- [ ] All blue accent colors replaced with brand coral (except semantic info blues)
- [ ] `npm test` — all existing tests pass (update test assertions if they check for "Vacation Scheduler" text)
- [ ] Run the existing tests and fix any that break due to string changes

---

## Files Created/Modified Summary

**New files:**
- `src/styles/design-tokens.js`

**Modified files (all):**
- `public/index.html`
- `package.json`
- `tailwind.config.js`
- `src/App.js`
- `src/features/home/HomePage.jsx`
- `src/features/home/CreateGroupForm.jsx`
- `src/features/home/GroupCreatedScreen.jsx`
- `src/features/home/JoinGroupForm.jsx`
- `src/features/docs/DocumentationPage.jsx`
- `src/features/legal/PrivacyPolicy.jsx`
- `src/features/legal/TermsOfService.jsx`
- `src/shared/ui/Footer.js`
- `src/shared/ui/Button.js`
- `src/shared/ui/Card.js`
- `src/shared/ui/Input.js`
- `src/shared/ui/CopyButton.js`
- `src/shared/ui/Modal.js`
- `src/shared/ui/StorageConsent.js`
- `src/features/admin/AdminPage.jsx`
- `src/features/admin/GroupSettings.jsx`
- `src/features/admin/AdminAvailability.jsx`
- `src/features/admin/OverlapResults.jsx`
- `src/features/admin/ParticipantTable.jsx`
- `src/features/admin/hooks/useGroupData.js`
- `src/components/ParticipantView.js`
- `src/components/CalendarView.js`
- `src/components/SlidingOverlapCalendar.js`
- `src/components/ResultsDisplay.js`
- `src/features/recovery/RecoverAdminForm.jsx`
- All test files that assert on "Vacation Scheduler" text

---

## Important Notes

- Do NOT introduce react-router-dom in this PRP. Routing changes happen in PRP-1.5 (SEO Landing Pages).
- Do NOT add new features. This PRP is purely rebrand + visual identity.
- The design tokens file becomes the reference for ALL future PRPs.
- Keep the dark theme. Only the accent color changes (blue → coral/orange).
- The heatmap visualization colors in CalendarView.js and SlidingOverlapCalendar.js should use the new heatmap gradient tokens (gray → amber → coral).
