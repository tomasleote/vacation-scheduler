# Findings — Vacation Scheduler Architecture Audit

**Updated**: 2026-03-02

---

## Codebase Statistics

| Metric | Value |
|--------|-------|
| Total source files (src/) | ~15 |
| Total lines of code (src/) | ~3,500 |
| Largest file | AdminPanel.js — 1,040 lines |
| Second largest | App.js — 625 lines |
| Test files | 7 (.test.js files) |
| API routes (api/) | 5 serverless functions |
| Cloud Functions | 3 (functions/index.js) |

---

## File-by-File Analysis

### Critical Files (need decomposition)

**AdminPanel.js (1,040 lines)**
- 27 useState variables
- Imports 15+ icons, all Firebase CRUD, all utils
- Mixed concerns: group settings editing, participant CRUD (add/edit/delete), availability calendar, overlap calculation, CSV export, reminder/invite sending, link copying
- Optimistic update + rollback pattern duplicated 3 times
- Copy-to-clipboard + notification duplicated 4 times
- Modal overlay pattern duplicated 2 times
- Input class strings duplicated 10+ times
- Error handling (console.error + addNotification) duplicated 10+ times

**App.js (625 lines)**
- Contains 4 inline components: HomePage, CreateGroupForm, JoinGroupForm, GroupCreatedScreen
- Props drilled: groupId, adminToken, onBack, onCreateGroup, onJoinGroup
- Modal overlay wrapper repeated 3 times
- localStorage try-catch blocks repeated 5+ times
- Lazy Firebase imports in form handlers

### Well-Structured Files (keep mostly as-is)

- **overlap.js** (106 lines) — Pure utility, O(D×N) sliding window, well-optimized
- **export.js** (50 lines) — Simple CSV export using PapaParse
- **participantValidation.js** (85 lines) — Pure validation, no dependencies
- **NotificationContext.js** (90 lines) — Clean Context API usage
- **ErrorBoundary.js** (60 lines) — Standard class component error boundary
- **ResultsDisplay.js** (74 lines) — Pure presentational component
- **SlidingOverlapCalendar.js** (439 lines) — Complex but well-structured, uses useMemo

### Moderate Files (need some refactoring)

- **ParticipantView.js** (332 lines) — Reasonable size but has Firebase coupling
- **CalendarView.js** (384 lines) — Complex conditional logic, hardcoded class strings
- **RecoverAdminForm.js** (252 lines) — Clean tab pattern, but direct API fetch calls
- **firebase.js** (236 lines) — Good abstractions but should split into domain services

---

## Duplication Inventory

| Pattern | Count | Locations |
|---------|:---:|-----------|
| localStorage try-catch wrapper | 5+ | App.js, AdminPanel.js, ParticipantView.js |
| Copy-to-clipboard + notification | 6 | AdminPanel.js (×4), ParticipantView.js, GroupCreatedScreen (in App.js) |
| Modal overlay wrapper (AnimatePresence + motion.div backdrop + motion.div content) | 5 | App.js (×3), AdminPanel.js (×2) |
| Input class string `"w-full px-3 py-2.5 bg-dark-800 border border-dark-700..."` | 15+ | All form components |
| Label class string `"block text-sm font-medium text-gray-300 mb-1.5"` | 10+ | All form components |
| Error handling `catch (err) { console.error(...); addNotification({ type: 'error', ... })` | 10+ | AdminPanel.js, ParticipantView.js, App.js |
| Optimistic update + rollback try-catch | 3 | AdminPanel.js (create, edit, delete participant) |

---

## Dependency Graph (Current)

```
index.js
  └─ App.js
       ├─ firebase.js (direct)
       ├─ NotificationContext.js (context)
       ├─ RecoverAdminForm.js
       │    └─ firebase.js (hashPhrase)
       ├─ AdminPanel.js
       │    ├─ firebase.js (all CRUD)
       │    ├─ utils/overlap.js
       │    ├─ utils/export.js
       │    ├─ utils/participantValidation.js
       │    ├─ CalendarView.js
       │    │    └─ utils/overlap.js (getDatesBetween)
       │    └─ SlidingOverlapCalendar.js
       │         └─ utils/overlap.js
       └─ ParticipantView.js
            ├─ firebase.js (CRUD + subscriptions)
            ├─ utils/overlap.js
            ├─ CalendarView.js
            └─ SlidingOverlapCalendar.js
```

---

## Database Schema (Firebase RTDB)

```
groups/
  {groupId}/
    id, name, description, startDate, endDate
    adminEmail, adminTokenHash, recoveryPasswordHash
    createdAt
    participants/
      {participantId}/
        id, name, email, duration, blockType
        availableDays: [YYYY-MM-DD, ...]
        createdAt
```

---

## API Endpoints

| Endpoint | Method | Location |
|----------|--------|----------|
| /api/send-welcome | POST | api/send-welcome.js |
| /api/send-reminder | POST | api/send-reminder.js |
| /api/send-invite | POST | api/send-invite.js |
| /api/recover-admin | POST | api/recover-admin.js |
| /api/find-groups | GET | api/find-groups.js |

---

## Strengths to Preserve

1. **Overlap algorithm** — Well-optimized O(D×N) sliding window with Set-based lookups
2. **Firebase subscription pattern** — onValue with cleanup in useEffect
3. **Input validation/sanitization** — Centralized in participantValidation.js
4. **Client-side crypto** — SHA-256 hashing via Web Crypto API
5. **Notification system** — Clean Context API toast implementation
6. **Error boundary** — Proper React error catching
7. **Optimistic updates** — Good UX pattern (needs centralization, not removal)
8. **Transaction-based uniqueness** — runTransaction for concurrent name checks
