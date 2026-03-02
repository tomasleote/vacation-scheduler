# Vacation Scheduler — Full Architectural Audit & Refactor Plan

**Created**: 2026-03-02
**Status**: IN PROGRESS
**Branch**: feat--admin-edit-participants-capability

---

## 1. Architecture Audit Findings

### Current State Summary
- **Tech Stack**: React 18 (CRA) + Firebase Realtime DB + TailwindCSS + Framer Motion + Vercel Serverless
- **Language**: JavaScript (no TypeScript)
- **Total source files**: ~15 (.js/.jsx in src/) + 5 serverless API routes + 1 Cloud Functions file
- **Largest file**: AdminPanel.js (1,040 lines, 27 state variables)
- **Test coverage**: Test files exist for major components but coverage depth unknown

### Critical Findings

| # | Finding | Severity | Location |
|---|---------|----------|----------|
| 1 | **Monolithic AdminPanel** — 1,040 lines, 27 useState vars, mixed concerns (group settings, participant CRUD, availability, overlap calc, CSV export, reminders) | CRITICAL | `src/components/AdminPanel.js` |
| 2 | **Oversized App.js** — 625 lines, contains 4 inline components (HomePage, CreateGroupForm, JoinGroupForm, GroupCreatedScreen) | HIGH | `src/App.js` |
| 3 | **No TypeScript** — zero type safety across Firebase calls, props, and API boundaries | HIGH | Entire codebase |
| 4 | **Heavy code duplication** — 40+ instances (localStorage wrappers, copy-to-clipboard, input classes, modal overlays, error handling) | HIGH | Throughout |
| 5 | **Prop drilling** — groupId/adminToken/onBack threaded through 3+ levels | MEDIUM | App → HomePage → children |
| 6 | **No shared UI component library** — buttons, inputs, modals, cards all inlined with duplicated Tailwind classes | MEDIUM | All components |
| 7 | **Firebase calls directly in components** — no service abstraction layer | MEDIUM | AdminPanel, ParticipantView, App.js |
| 8 | **No memoization** — all children re-render on any parent state change | MEDIUM | AdminPanel, ParticipantView |
| 9 | **Mixed date handling** — ISO strings, Date objects, month/year numbers used inconsistently | LOW | CalendarView, overlap.js |
| 10 | **Hardcoded constants** — magic numbers (100 char limit, 365 day limit, 500 char desc) scattered | LOW | firebase.js, validation utils |

---

## 2. Anti-Patterns Detected

1. **God Component** — AdminPanel handles group CRUD, participant CRUD, availability, overlap calculation, CSV export, reminder sending, invite sending, link copying — all in one file
2. **Inline Component Definitions** — App.js defines 4 components inside itself instead of separate files
3. **State Explosion** — 27 individual useState calls in AdminPanel instead of useReducer or state grouping
4. **Duplicated UI Patterns** — Modal wrappers, input styling, copy buttons, error handling repeated across files
5. **Prop Threading** — Core identifiers (groupId, adminToken) manually passed through component tree
6. **Direct Infrastructure Coupling** — Firebase SDK called directly from UI components instead of through a service layer
7. **No Custom Hooks** — Business logic (subscriptions, form handling, auth validation) lives inside components instead of extracted hooks
8. **Hardcoded CSS Class Strings** — 15+ repetitions of identical Tailwind utility strings like `"w-full px-3 py-2.5 bg-dark-800 border border-dark-700..."`
9. **Lazy Error Handling** — Some catch blocks swallow errors silently, inconsistent notification vs console.error usage
10. **No Loading/Error State Abstraction** — Each component manages its own loading/error states independently

---

## 3. Architecture Scorecard

| Category | Score (1-10) | Notes |
|----------|:---:|-------|
| **React App Structure** | 4 | Flat components folder, no feature grouping, inline components in App.js |
| **Component Layering** | 3 | No distinction between pages/features/shared UI, AdminPanel is a god component |
| **State Management** | 4 | Context for notifications is good, but 27 useState vars in AdminPanel, no reducers, no server state library |
| **Data Access** | 5 | firebase.js provides reasonable abstraction, but called directly from components with no service layer |
| **Side-Effect Handling** | 5 | useEffect for subscriptions works, but cleanup patterns inconsistent, no custom hooks |
| **Scalability** | 3 | Adding features means growing already-oversized files, no clear feature boundaries |
| **Testability** | 4 | Pure utils are testable, but components mix logic+UI making unit testing hard |
| **Maintainability** | 4 | Code duplication means changes need updating in 5+ places, no conventions documented |
| **Performance** | 5 | useMemo in SlidingOverlapCalendar is good, but no memoization elsewhere, no lazy loading |
| **Code Quality** | 5 | Clean naming, good validation utils, but inconsistent patterns and heavy duplication |
| **Overall Current Grade** | **4.2/10** | Functional MVP but not production-grade architecture |

---

## 4. Recommended Architecture Blueprint

### Target Architecture: Feature-Based with Service Layer

```
src/
├── app/                          # App shell & routing
│   ├── App.jsx                   # Router + layout shell (< 80 lines)
│   ├── routes.jsx                # Route definitions
│   └── providers.jsx             # Composed context providers
│
├── features/                     # Feature modules (self-contained)
│   ├── home/
│   │   ├── HomePage.jsx
│   │   ├── CreateGroupForm.jsx
│   │   ├── JoinGroupForm.jsx
│   │   └── GroupCreatedScreen.jsx
│   │
│   ├── admin/
│   │   ├── AdminPage.jsx         # Page wrapper (auth + layout)
│   │   ├── GroupSettings.jsx     # Group info display + edit
│   │   ├── ParticipantTable.jsx  # Participant list + actions
│   │   ├── ParticipantForm.jsx   # Add/edit participant modal
│   │   ├── AdminAvailability.jsx # Admin's own availability
│   │   ├── OverlapResults.jsx    # Overlap display + export
│   │   └── hooks/
│   │       ├── useAdminAuth.js   # Token validation + redirect
│   │       ├── useGroupData.js   # Subscribe to group + participants
│   │       └── useParticipantActions.js  # CRUD with optimistic updates
│   │
│   ├── participant/
│   │   ├── ParticipantPage.jsx
│   │   ├── ParticipantDashboard.jsx
│   │   └── hooks/
│   │       └── useParticipantForm.js
│   │
│   ├── calendar/
│   │   ├── CalendarView.jsx
│   │   ├── SlidingOverlapCalendar.jsx
│   │   └── components/
│   │       ├── CalendarGrid.jsx
│   │       ├── DayCell.jsx
│   │       └── MonthNavigation.jsx
│   │
│   └── recovery/
│       ├── RecoverAdminForm.jsx
│       └── hooks/
│           └── useRecovery.js
│
├── shared/                       # Shared across features
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── CopyButton.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Table.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ConfirmDialog.jsx
│   │
│   ├── hooks/                    # Shared custom hooks
│   │   ├── useLocalStorage.js
│   │   ├── useCopyToClipboard.js
│   │   └── useFirebaseSubscription.js
│   │
│   └── context/
│       ├── NotificationContext.jsx
│       └── GroupContext.jsx       # Global group/admin state
│
├── services/                     # Data access layer
│   ├── firebase/
│   │   ├── config.js             # Firebase initialization
│   │   ├── groupService.js       # Group CRUD operations
│   │   ├── participantService.js # Participant CRUD operations
│   │   └── authService.js        # Token hashing + validation
│   │
│   └── api/
│       ├── emailService.js       # /api/send-* endpoints
│       └── recoveryService.js    # /api/recover-admin endpoint
│
├── utils/                        # Pure utility functions
│   ├── overlap.js                # Overlap calculation (keep as-is)
│   ├── export.js                 # CSV export (keep as-is)
│   ├── validation.js             # Input validation (keep as-is)
│   ├── dates.js                  # Date formatting helpers
│   └── constants.js              # Magic numbers, limits, class strings
│
└── types/                        # (Future: TypeScript types)
    └── index.js                  # JSDoc type definitions for now
```

---

## 5. Component Layering Strategy

### Layer Definitions

| Layer | Purpose | Rules | Examples |
|-------|---------|-------|---------|
| **Pages** | Route entry points | Compose features, handle auth guards, define layout | AdminPage, ParticipantPage, HomePage |
| **Features** | Self-contained business logic + UI | Can import shared/ and services/, NOT other features | GroupSettings, ParticipantTable, CalendarView |
| **Shared UI** | Reusable presentational components | Zero business logic, prop-driven, no Firebase imports | Button, Modal, Input, CopyButton, Table |
| **Hooks** | Encapsulated stateful logic | Return data + actions, no JSX | useGroupData, useAdminAuth, useLocalStorage |
| **Services** | Data access abstraction | Pure functions, return promises, no React imports | groupService.createGroup(), emailService.sendInvite() |
| **Utils** | Pure computation | No side effects, no imports from src/ | calculateOverlap(), formatDateRange() |

### Dependency Rules (Strict)
```
Pages → Features → Shared UI
Pages → Hooks → Services → Firebase SDK
Features → Hooks → Services
Shared UI → (nothing from src/)
Utils → (nothing)
```

---

## 6. State Management Strategy

### Recommended Approach

| State Type | Solution | Examples |
|------------|----------|---------|
| **Server state** (group data, participants) | Custom hooks with Firebase subscriptions | `useGroupData(groupId)` returns `{ group, participants, loading, error }` |
| **Global app state** (groupId, adminToken, current user) | React Context (`GroupContext`) | Eliminates prop drilling of groupId/adminToken |
| **Feature-local complex state** (AdminPanel form states) | `useReducer` | Replaces 27 useState calls with structured dispatch |
| **UI state** (modals, tabs, expanded sections) | Local `useState` | Keep simple, co-located with component |
| **Persisted state** (localStorage preferences) | Custom `useLocalStorage` hook | Centralizes try-catch, provides consistent API |
| **Derived state** (overlaps, filtered results) | `useMemo` | Compute from source data, don't store separately |

### GroupContext Design
```javascript
// Provides: { groupId, adminToken, group, participants, loading, isAdmin }
// Eliminates: prop drilling of groupId/adminToken through 3+ levels
// Consumed by: AdminPage, ParticipantPage, any feature needing group data
```

### AdminPanel State Reduction
```
BEFORE: 27 individual useState calls
AFTER:  useReducer with ~5 state slices:
  - groupEdit: { editing, editData }
  - participantForm: { mode, name, email, loading }
  - deleteConfirm: { show, participant, loading }
  - ui: { copiedId, expandedSection }
  + useGroupData() hook for group/participants (server state)
  + useMemo for overlaps (derived state)
```

---

## 7. Data Access Layer

### Service Abstraction Pattern

**Current** (called directly in components):
```javascript
// Inside AdminPanel.jsx
import { updateGroup, deleteParticipant } from '../firebase';
await updateGroup(groupId, data);
```

**Target** (through service layer):
```javascript
// services/firebase/groupService.js
import { ref, update, get } from 'firebase/database';
import { database } from './config';

export const groupService = {
  async update(groupId, data) { /* validation + Firebase call */ },
  async delete(groupId) { /* cleanup + Firebase call */ },
  subscribe(groupId, callback) { /* onValue listener + cleanup */ },
};
```

```javascript
// hooks/useGroupData.js
import { groupService } from '../services/firebase/groupService';

export function useGroupData(groupId) {
  // Manages subscription lifecycle, loading, error states
  // Returns { group, participants, loading, error }
}
```

```javascript
// features/admin/AdminPage.jsx
const { group, participants, loading } = useGroupData(groupId);
// Clean — no Firebase imports in UI components
```

### Rules
- **Components** never import Firebase SDK directly
- **Hooks** call services, manage React lifecycle
- **Services** wrap Firebase SDK, handle validation, return clean data
- **firebase.js** splits into `config.js` + domain services

---

## 8. Component Decomposition Plan

### AdminPanel.js (1,040 lines → 7 files)

| New Component | Lines (est.) | Responsibility | State Owned |
|---------------|:---:|----------------|-------------|
| **AdminPage.jsx** | ~60 | Auth guard + layout + compose children | isAuthorized |
| **GroupSettings.jsx** | ~150 | Display/edit group name, desc, dates, passphrase | editing, editData |
| **ParticipantTable.jsx** | ~200 | List participants, actions (edit/delete/invite/copy link) | copiedId, inviteSendingId |
| **ParticipantForm.jsx** | ~120 | Modal for add/edit participant (shared form) | name, email, loading |
| **ConfirmDialog.jsx** (shared) | ~60 | Generic confirmation modal | — (controlled by parent) |
| **AdminAvailability.jsx** | ~120 | Admin's own calendar + save | savedDays, showAvailability |
| **OverlapResults.jsx** | ~100 | Duration filter + SlidingOverlapCalendar + CSV export | durationFilter |
| **useParticipantActions.js** | ~100 | Create/update/delete with optimistic updates + rollback | — (returns functions) |

### App.js (625 lines → 5 files)

| New File | Lines (est.) | Responsibility |
|----------|:---:|----------------|
| **app/App.jsx** | ~50 | Router shell + navigation |
| **app/providers.jsx** | ~20 | NotificationProvider + GroupProvider + ErrorBoundary |
| **features/home/HomePage.jsx** | ~80 | Landing page with modal triggers |
| **features/home/CreateGroupForm.jsx** | ~150 | Group creation form (extracted as-is) |
| **features/home/JoinGroupForm.jsx** | ~100 | Join group form (extracted as-is) |
| **features/home/GroupCreatedScreen.jsx** | ~120 | Success screen with links |

---

## 9. Reusability Strategy — Shared Component Library

### Components to Extract

| Component | Used In | Current State |
|-----------|---------|---------------|
| **Modal** | AdminPanel (×2), App.js (×3), RecoverAdminForm | 5 duplicate overlay wrappers |
| **Input** | Every form (AdminPanel, CalendarView, CreateGroupForm, JoinGroupForm, RecoverAdminForm) | 15+ duplicate class strings |
| **Button** | Everywhere | Inconsistent styling, no variants |
| **CopyButton** | AdminPanel (×4), ParticipantView, GroupCreatedScreen | 6 duplicate copy-to-clipboard implementations |
| **Table** | AdminPanel participant list, ResultsDisplay | Could be generic |
| **Card** | Multiple info display sections | Repeated border/padding patterns |
| **Badge** | Status indicators (available/unavailable counts) | Inline colored spans |
| **LoadingSpinner** | Multiple loading states | Repeated SVG spinner |
| **ConfirmDialog** | AdminPanel delete confirmation | Should be generic |

### Shared Hooks to Extract

| Hook | Replaces | Used In |
|------|----------|---------|
| **useLocalStorage(key, default)** | 5+ try-catch localStorage blocks | AdminPanel, ParticipantView, App.js |
| **useCopyToClipboard()** | 6 duplicate copy+notification patterns | AdminPanel, ParticipantView, GroupCreatedScreen |
| **useFirebaseSubscription(ref)** | Repeated onValue/off patterns | AdminPanel, ParticipantView |

---

## 10. Performance Opportunities

| Opportunity | Location | Impact | Effort |
|-------------|----------|--------|--------|
| **React.memo on ParticipantTable rows** | AdminPanel → ParticipantTable | Prevents re-render of all rows when one changes | Low |
| **useMemo for overlap calculations** | AdminPanel (currently recalculates on every render) | Eliminates O(D×N) recalculation on unrelated state changes | Low |
| **useCallback for event handlers** | AdminPanel, CalendarView (27+ inline handlers) | Prevents child re-renders from new function references | Low |
| **Lazy load AdminPanel & ParticipantView** | App.js route rendering | Faster initial load, code-split by route | Medium |
| **Virtualize participant list** | AdminPanel (if >50 participants) | Reduces DOM nodes for large groups | Low (future) |
| **Debounce duration filter** | SlidingOverlapCalendar, AdminPanel | Prevents rapid recalculation on slider/input changes | Low |
| **Extract static Tailwind classes** | All components | Reduces JSX noise (not a perf issue, but readability) | Low |

---

## 11. Step-by-Step Refactor Roadmap

> **Guiding Principle**: Each step is a mergeable PR that keeps the app fully functional. No big-bang rewrites.

### Phase 1: Foundation (Low Risk, High Leverage)
*Extract shared utilities and hooks — zero UI changes*

| Step | Goal | Files Affected | Risk | Benefit |
|------|------|----------------|:---:|---------|
| **1.1** | Create `shared/hooks/useLocalStorage.js` | New file + update 3 consumers | LOW | Eliminate 5 duplicate try-catch blocks |
| **1.2** | Create `shared/hooks/useCopyToClipboard.js` | New file + update 4 consumers | LOW | Eliminate 6 duplicate copy patterns |
| **1.3** | Create `utils/constants.js` | New file + update firebase.js, validation.js, components | LOW | Centralize magic numbers and class strings |
| **1.4** | Create `services/firebase/config.js` — extract Firebase init from firebase.js | Split firebase.js | LOW | Separate config from business logic |
| **1.5** | Create `services/firebase/groupService.js` + `participantService.js` + `authService.js` — split firebase.js | Split firebase.js → 3 service files | LOW | Clean service layer, firebase.js becomes re-exports for backward compat |

### Phase 2: Shared UI Components (Low Risk)
*Extract reusable UI — visual output identical*

| Step | Goal | Files Affected | Risk | Benefit |
|------|------|----------------|:---:|---------|
| **2.1** | Create `shared/ui/Modal.jsx` | New file + replace 5 inline modals | LOW | Single modal pattern, consistent animations |
| **2.2** | Create `shared/ui/Input.jsx` + `shared/ui/Button.jsx` | New files + update all forms | LOW | Consistent styling, eliminate 15+ class duplications |
| **2.3** | Create `shared/ui/CopyButton.jsx` | New file + uses useCopyToClipboard hook | LOW | Composable copy button with notification |
| **2.4** | Create `shared/ui/ConfirmDialog.jsx` + `shared/ui/LoadingSpinner.jsx` + `shared/ui/Card.jsx` | New files | LOW | Complete shared UI toolkit |

### Phase 3: App.js Decomposition (Medium Risk)
*Extract inline components from App.js into feature files*

| Step | Goal | Files Affected | Risk | Benefit |
|------|------|----------------|:---:|---------|
| **3.1** | Extract `features/home/CreateGroupForm.jsx` from App.js | App.js → new file | MEDIUM | App.js drops ~150 lines |
| **3.2** | Extract `features/home/JoinGroupForm.jsx` from App.js | App.js → new file | MEDIUM | App.js drops ~100 lines |
| **3.3** | Extract `features/home/GroupCreatedScreen.jsx` from App.js | App.js → new file | MEDIUM | App.js drops ~120 lines |
| **3.4** | Extract `features/home/HomePage.jsx` + create `app/App.jsx` router shell | App.js → 2 new files | MEDIUM | App.js reduced to ~50 line router |
| **3.5** | Create `shared/context/GroupContext.jsx` | New file + update App, AdminPanel, ParticipantView | MEDIUM | Eliminate prop drilling of groupId/adminToken |

### Phase 4: AdminPanel Decomposition (High Risk, Highest Value)
*Break the god component into focused modules*

| Step | Goal | Files Affected | Risk | Benefit |
|------|------|----------------|:---:|---------|
| **4.1** | Extract `features/admin/hooks/useGroupData.js` — subscription logic | AdminPanel → new hook | MEDIUM | Reusable data hook, testable independently |
| **4.2** | Extract `features/admin/hooks/useParticipantActions.js` — CRUD + optimistic updates | AdminPanel → new hook | MEDIUM | Encapsulate complex CRUD logic |
| **4.3** | Extract `features/admin/GroupSettings.jsx` — group display/edit section | AdminPanel → new component | MEDIUM | First visible decomposition |
| **4.4** | Extract `features/admin/ParticipantTable.jsx` + `ParticipantForm.jsx` | AdminPanel → 2 new components | HIGH | Largest extraction, most state movement |
| **4.5** | Extract `features/admin/AdminAvailability.jsx` — admin's own calendar section | AdminPanel → new component | MEDIUM | Isolate availability logic |
| **4.6** | Extract `features/admin/OverlapResults.jsx` — overlap display + export | AdminPanel → new component | LOW | Clean separation of results |
| **4.7** | Create `features/admin/AdminPage.jsx` — compose all sub-components | AdminPanel → orchestrator | MEDIUM | Final assembly, AdminPanel.js can be deleted |

### Phase 5: Polish & Performance (Low Risk)
*Optimization pass after architecture is clean*

| Step | Goal | Files Affected | Risk | Benefit |
|------|------|----------------|:---:|---------|
| **5.1** | Add `React.memo` to ParticipantTable rows, CalendarView DayCell | Feature components | LOW | Prevent unnecessary re-renders |
| **5.2** | Add `useMemo` for overlap calculations in AdminPage | AdminPage/OverlapResults | LOW | Avoid O(D×N) recalculation |
| **5.3** | Add `useCallback` for handlers passed to children | All parent components | LOW | Stable references for memo'd children |
| **5.4** | Add `React.lazy` + `Suspense` for route-level code splitting | App.jsx routes | LOW | Faster initial page load |
| **5.5** | Move RecoverAdminForm to `features/recovery/` | File move + update imports | LOW | Complete feature-based structure |

### Phase 6: Future — TypeScript Migration (Optional, High Effort)
*Not part of this refactor, but recommended next step*

| Step | Goal | Risk |
|------|------|:---:|
| 6.1 | Add TypeScript config (tsconfig.json), rename one utility to .ts | LOW |
| 6.2 | Type the service layer (groupService, participantService) | MEDIUM |
| 6.3 | Type shared UI components (props interfaces) | MEDIUM |
| 6.4 | Type feature components and hooks incrementally | HIGH |

---

## 12. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|:---:|:---:|------------|
| **Breaking existing functionality during decomposition** | Medium | High | Each step is a separate PR with full test run. Never refactor 2 things at once. |
| **Introducing import cycle bugs** | Low | Medium | Strict dependency rules (features never import other features). ESLint import plugin. |
| **Merge conflicts with in-progress features** | Medium | Medium | Complete current feature branch first. Refactor from clean main. |
| **State migration bugs (AdminPanel → hooks)** | Medium | High | Extract hooks one-at-a-time. Test each extraction before next. Keep AdminPanel as fallback until all hooks verified. |
| **Regression in Firebase subscriptions** | Low | High | useFirebaseSubscription hook must handle mount/unmount/re-subscribe correctly. Write specific tests. |
| **Over-abstracting too early** | Medium | Low | Only extract what's duplicated today. Don't create abstractions for hypothetical features. |
| **Team learning curve** | Low | Low | Each PR includes clear commit messages explaining the structural change. |

### Critical Rule: **Never refactor and add features in the same PR.**

---

## 13. Final Architecture Grade

| Metric | Current | Projected (Post-Refactor) |
|--------|:---:|:---:|
| React App Structure | 4 | 8 |
| Component Layering | 3 | 8 |
| State Management | 4 | 7 |
| Data Access | 5 | 8 |
| Side-Effect Handling | 5 | 8 |
| Scalability | 3 | 8 |
| Testability | 4 | 8 |
| Maintainability | 4 | 9 |
| Performance | 5 | 7 |
| Code Quality | 5 | 8 |
| **Overall** | **4.2** | **7.9** |

*Projected score assumes Phases 1–5 completed. TypeScript (Phase 6) would push to ~8.5.*

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-02 | Feature-based folder structure over type-based | Features are self-contained, easier to navigate, scales with team size |
| 2026-03-02 | Custom hooks + Context over Redux/Zustand | App is small enough that Context + useReducer covers all needs without external deps |
| 2026-03-02 | Service layer over direct Firebase imports | Decouples UI from infrastructure, enables testing with mocks, future backend swaps |
| 2026-03-02 | Incremental decomposition over big-bang rewrite | Lower risk, keeps app functional, each PR is reviewable |
| 2026-03-02 | Defer TypeScript to Phase 6 | Structural refactor first, then type safety. Mixing both increases risk. |
