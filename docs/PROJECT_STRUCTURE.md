# Project Structure

Complete file organization and purpose of each file.

## Directory Tree

```text
vacation-scheduler/
│
├── src/                          # React application source code
│   ├── App.js                    # Main component, routing logic (7.8 KB)
│   ├── index.js                  # React entry point
│   ├── index.css                 # Tailwind CSS imports & base styles
│   ├── firebase.js               # Firebase config & API methods (2.4 KB)
│   │
│   ├── components/               # React components
│   │   ├── AdminPanel.js         # Admin dashboard & controls (12.7 KB)
│   │   ├── ParticipantView.js    # Participant page wrapper (5.2 KB)
│   │   ├── CalendarView.js       # Calendar UI & date selection (10 KB)
│   │   ├── SlidingOverlapCalendar.jsx # Advanced calendar with voting (18 KB)
│   │   ├── VotePanel.jsx         # Vote display & voting controls (3.5 KB)
│   │   ├── ResultsDisplay.js     # Overlap results visualization (2.5 KB)
│   │   └── ParticipantForm.js    # Form component wrapper (128 B)
│   │
│   ├── features/                 # Feature-specific components
│   │   ├── admin/
│   │   │   ├── AdminPage.jsx     # Admin layout & voting management (15 KB)
│   │   │   ├── VotingSetup.jsx   # Propose candidate periods (4 KB)
│   │   │   └── VotingResults.jsx # Live vote tracking & results (5 KB)
│   │   ├── landing/
│   │   │   └── landingPageContent.js # SEO landing page content (8 KB)
│   │
│   ├── services/
│   │   └── pollService.js        # Firebase poll operations (3 KB)
│   │
│   └── utils/                    # Utility functions
│       ├── overlap.js            # Overlap calculation algorithm (2.4 KB)
│       ├── export.js             # CSV export functionality (1.5 KB)
│       └── dateUtils.js          # Date formatting & range utilities (2 KB)
│
├── functions/                    # Firebase Cloud Functions (legacy)
│   ├── index.js                  # Email reminders & scheduled tasks (2.6 KB)
│   └── package.json              # Functions dependencies
│
├── api/                          # Vercel Serverless Functions
│   ├── send-vote-invite.js       # Send voting invitation emails (3.2 KB)
│   └── send-vote-result.js       # Send result email with calendar ICS (4.1 KB)
│
├── public/                       # Static files
│   └── index.html                # HTML entry point
│
├── Documentation Files
│   ├── README.md                 # Main documentation (5.5 KB)
│   ├── QUICKSTART.md             # 5-minute setup guide (3.3 KB)
│   ├── DEPLOYMENT.md             # Step-by-step deployment (5.4 KB)
│   ├── API.md                    # Complete API reference (6.8 KB)
│   ├── ARCHITECTURE.md           # System design & algorithms (9.1 KB)
│   └── PROJECT_STRUCTURE.md      # This file
│
├── Configuration Files
│   ├── package.json              # Frontend dependencies
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── postcss.config.js         # PostCSS configuration
│   ├── firebase.json             # Firebase deployment config
│   ├── .firebaserc               # Firebase project mapping
│   ├── database.rules.json       # Firebase security rules
│   ├── .env.example              # Environment variables template
│   ├── .env.local                # Local environment variables (dev)
│   └── .gitignore                # Git ignore patterns
```

## File Sizes

| File | Size | Purpose |
|------|------|---------|
| src/App.js | 7.8 KB | Main routing & UI shell |
| src/components/AdminPanel.js | 12.7 KB | Admin dashboard |
| src/components/CalendarView.js | 10.0 KB | Calendar interaction |
| ARCHITECTURE.md | 9.1 KB | System design |
| functions/index.js | 2.6 KB | Cloud functions |
| API.md | 6.8 KB | API documentation |
| DEPLOYMENT.md | 5.4 KB | Deployment guide |
| **Total Code** | **~60 KB** | Production ready |

## Component Purposes

### src/App.js
- **Role**: Application shell
- **Responsibilities**:
  - Route between home, admin, participant pages
  - Manage URL-based group navigation
  - Pass props to child components
- **Key Functions**:
  - `HomePage()` - Create/Join group modal
  - `CreateGroupForm()` - Group creation
  - `JoinGroupForm()` - Group joining
- **Line Count**: ~250 lines

### src/components/AdminPanel.js
- **Role**: Admin control center
- **Responsibilities**:
  - Display group settings (editable)
  - Show participant list & stats
  - Manage group lifecycle (edit, delete)
  - Trigger exports & reminders
  - Display overlap results
- **Key Features**:
  - Real-time participant count
  - Availability filtering by duration
  - Copy group ID to clipboard
  - Email reminder integration
- **Line Count**: ~350 lines

### src/components/ParticipantView.js
- **Role**: Participant wrapper
- **Responsibilities**:
  - Load group information
  - Display participant list
  - Manage form submission
  - Show confirmation messages
- **Line Count**: ~150 lines

### src/components/CalendarView.js
- **Role**: Interactive calendar UI
- **Responsibilities**:
  - Render calendar grid
  - Handle day/block selection
  - Form submission
  - Date validation
- **Key Features**:
  - Month navigation
  - Flexible day selection
  - Pre-set block selection (3/4/5 days)
  - Visual feedback
- **Line Count**: ~280 lines

### src/components/SlidingOverlapCalendar.jsx
- **Role**: Advanced calendar with heatmap & voting
- **Responsibilities**:
  - Display availability heatmap (color-coded by participation %)
  - Show candidate periods during voting
  - Handle period selection
  - Render vote counts and participant details
- **Key Features**:
  - Heatmap visualization
  - Candidate highlighting during polls
  - Spotlight fade effect for non-selected periods
  - Responsive details panel with vote tracking
  - forwardRef to support imperative `clearSelection()` from parent
- **Line Count**: ~550 lines

### src/components/VotePanel.jsx
- **Role**: Vote casting interface
- **Responsibilities**:
  - Display vote count & percentage bar
  - Show list of voters
  - Handle vote submission
  - Provide visual feedback on voted status
- **Key Features**:
  - Real-time vote counts
  - Voter identification
  - Single vs. multiple choice voting modes
  - Vote toggle/removal
- **Line Count**: ~113 lines

### src/components/ResultsDisplay.js
- **Role**: Results visualization
- **Responsibilities**:
  - Display overlap periods
  - Show availability percentages
  - Render progress bars
  - Helpful tips
- **Line Count**: ~60 lines

### src/firebase.js
- **Role**: Firebase API wrapper
- **Responsibilities**:
  - Initialize Firebase app
  - Export database reference
  - Provide CRUD methods for groups & participants
- **Methods**:
  - `createGroup()` - Create new group
  - `getGroup()` - Fetch group
  - `updateGroup()` - Modify group
  - `deleteGroup()` - Remove group
  - `addParticipant()` - Add participant
  - `getParticipants()` - Fetch participants
  - `deleteParticipant()` - Remove participant
- **Line Count**: ~70 lines

### src/utils/overlap.js
- **Role**: Overlap calculation engine
- **Responsibilities**:
  - Calculate availability percentages
  - Find best matching periods
  - Format date ranges
- **Algorithms**:
  - `calculateOverlap()` - O(n*d*p) complexity
  - `countAvailable()` - Check participant availability
  - `getBestOverlapPeriods()` - Sort & limit results
- **Line Count**: ~95 lines

### src/utils/export.js
- **Role**: CSV export utility
- **Responsibilities**:
  - Format data for export
  - Generate CSV string
  - Trigger browser download
- **Line Count**: ~55 lines

### src/features/admin/AdminPage.jsx
- **Role**: Admin dashboard wrapper
- **Responsibilities**:
  - Manage voting setup and results display
  - Handle poll lifecycle (start, close, send results)
  - Auto-scroll to voting results when poll starts
  - Coordinate admin voting actions
- **Key Features**:
  - VotingSetup component for proposing candidates
  - VotingResults component for live vote tracking
  - Heatmap scroll management via useRef
- **Line Count**: ~300 lines

### src/features/admin/VotingSetup.jsx
- **Role**: Candidate period proposal interface
- **Responsibilities**:
  - Allow admin to select & propose 2-5 date ranges as voting candidates
  - Add candidates to poll
  - Clear selection after adding
  - Persist candidates to Firebase
- **Key Features**:
  - Calendar period selection
  - Candidate list display
  - "Add as Candidate" button
  - Auto-clear selection via ref
- **Line Count**: ~150 lines

### src/features/admin/VotingResults.jsx
- **Role**: Real-time voting results display
- **Responsibilities**:
  - Show live vote counts per candidate
  - Display voter identities and their choices
  - Allow admin to close poll
  - Trigger result email sending
- **Key Features**:
  - Real-time Firebase subscription
  - Vote count visualization
  - Voter participation tracking
  - "Send Results" button with email integration
- **Line Count**: ~200 lines

### src/services/pollService.js
- **Role**: Firebase poll operations
- **Responsibilities**:
  - Subscribe to active polls
  - Submit votes to Firebase
  - Close polls
  - Fetch poll status
- **Methods**:
  - `subscribeToPoll()` - Real-time poll listener
  - `submitVote()` - Cast or update vote
  - `closePoll()` - End voting session
  - `startPoll()` - Create new poll
- **Line Count**: ~120 lines

### functions/index.js (Firebase Cloud Functions)
- **Role**: Cloud Functions
- **Responsibilities**:
  - Handle email reminders
  - Clean up old groups
  - Log events
- **Functions**:
  - `sendReminder()` - HTTP endpoint for reminder emails
  - `onGroupCreated()` - Trigger on group creation
  - `cleanupOldGroups()` - Scheduled cleanup job
- **Line Count**: ~100 lines

### api/send-vote-invite.js (Vercel Serverless Function)
- **Role**: Voting invitation email sender
- **Responsibilities**:
  - Send email invitations when poll starts
  - Include voting link and candidate information
  - Use Nodemailer with Gmail SMTP
- **Input**:
  - `groupId`: Group identifier
  - `groupName`: Group name for email
  - `participants`: Array of participant emails
  - `baseUrl`: Frontend base URL for voting link
- **Output**: Success/error response with sent count
- **Line Count**: ~80 lines

### api/send-vote-result.js (Vercel Serverless Function)
- **Role**: Voting result email with calendar invite
- **Responsibilities**:
  - Send winning date to all participants
  - Generate ICS calendar file (RFC 5545 format)
  - Attach calendar invite to email
  - Format results email with brand styling
- **Input**:
  - `groupId`: Group identifier
  - `winnerStartDate`, `winnerEndDate`: Winning date range
  - `participants`: Array of participant objects with emails
  - `baseUrl`: Frontend URL for link
- **Output**: Success/error response with sent count
- **Key Logic**:
  - `formatICSDate()` - Convert dates to ICS format
  - `generateICS()` - Create VCALENDAR RFC 5545 structure
  - Exclusive end date for all-day events
- **Line Count**: ~137 lines

## Configuration Files Explained

### package.json
- Dependencies: react, firebase, tailwindcss, lucide-react, papaparse, nodemailer
- Scripts: start, build, deploy
- Free tier compatible

### tailwind.config.js
- Minimal config, uses defaults
- Purge CSS enabled for production

### firebase.json
- Routes all 404s to index.html (SPA support)
- Defines hosting, functions, and database configs

### .firebaserc
- Project alias mapping
- Simplifies CLI commands

### database.rules.json
- Test mode rules (allow all reads/writes)
- Production rules should restrict by group ID

## Environment Variables

### Development (.env.local)
```env
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_DATABASE_URL=...
```

### Cloud Functions (Set via Firebase CLI)
```env
EMAIL_SERVICE=gmail
EMAIL_USER=...
EMAIL_PASSWORD=...
```

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.2.0 | UI framework |
| firebase | 10.7.0 | Backend & database |
| tailwindcss | 3.3.0 | CSS framework |
| lucide-react | 0.263.1 | Icons |
| papaparse | 5.4.1 | CSV parsing/generation |
| nodemailer | 6.9.7 | Email sending |
| firebase-tools | 12.9.0 | CLI & local emulation |

## Build Output

When you run `npm run build`, this creates:

```text
build/
├── index.html          # Main entry point
├── static/
│   ├── css/            # Minified CSS
│   └── js/             # Minified JavaScript
└── favicon.ico         # Icon

Size: ~500 KB (gzipped ~150 KB)
```

This is what gets deployed to Firebase Hosting.

## Code Organization Principles

1. **Separation of Concerns**
   - Components: UI rendering
   - Utils: Business logic
   - Firebase: Data layer

2. **Reusability**
   - Utility functions are stateless
   - Components are composable
   - No duplicate logic

3. **Minimal Dependencies**
   - Only 6 npm packages
   - Firebase handles backend
   - No complex state management

4. **Clean Code**
   - No unnecessary comments
   - Clear variable names
   - Standard React patterns
   - ES6+ syntax

## Testing Structure (Recommended)

```text
src/
├── __tests__/
│   ├── utils/
│   │   ├── overlap.test.js
│   │   └── export.test.js
│   └── components/
│       ├── CalendarView.test.js
│       └── AdminPanel.test.js
├── setupTests.js
└── ...rest of files
```

## Deploy Workflow

```text
Local Development
  ↓
npm install (dependencies)
  ↓
npm start (dev server)
  ↓
Test features
  ↓
npm run build (production build)
  ↓
firebase deploy (push to Firebase)
  ↓
Live at your-project.web.app
```

## Performance Notes

- **Bundle Size**: ~500 KB (uncompressed)
- **First Load**: ~2-3 seconds on 3G
- **Database Queries**: Single fetch per page load
- **Real-time Updates**: Firebase listeners for admin panel
- **No Code Splitting**: All in single bundle (small enough)

## Maintenance Checklist

- [ ] Review database rules for production
- [ ] Set up Firebase backups
- [ ] Enable monitoring & logging
- [ ] Plan for data cleanup (old groups)
- [ ] Add authentication for admin access
- [ ] Implement analytics
- [ ] Set up automated testing
- [ ] Create deployment pipeline (CI/CD)

## Future Enhancement Points

1. **Voting Enhancements**:
   - Weighted voting by participant priority
   - Preference-based voting (rank candidates)
   - Anonymous voting toggle
   - Voting deadlines with auto-close
   - Voting reminders/notifications
2. **Authentication**: Add Firebase Auth for admin login
3. **Mobile App**: React Native sharing same backend
4. **Advanced Analytics**: Track poll participation, voting patterns, success rates
5. **Notifications**: Real-time push notifications for voting invites
6. **Integrations**: Calendar sync (Google Calendar, iCal)
7. **Payment**: Premium features with Stripe
8. **Localization**: Multi-language support
9. **Database Migration**: Move to Cloud Firestore if needed

## Total Project Statistics

- **Lines of Code**: ~2,100 (excluding comments)
- **Components**: 7 main components + 3 voting feature components
- **Feature Modules**: 3 (admin, landing, services)
- **Utility Functions**: 12 core functions
- **Cloud Functions**: 3 Firebase functions
- **Serverless Functions**: 2 Vercel API endpoints
- **Documentation**: 7 markdown files (~50 KB)
- **Dependencies**: 7 production, 2 dev
- **Database Collections**: 1 (groups with nested participants & polls)
- **API Endpoints**: 3 (send reminder, send vote invite, send vote result)
- **Responsive**: Yes (mobile-first)
- **Accessibility**: WCAG considerations in place
