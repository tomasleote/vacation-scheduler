# Architecture Overview

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Browser (React)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐           │
│  │   Admin Panel    │         │ Participant View │           │
│  │  (Create Group)  │         │  (Join Group)    │           │
│  │  (Start Poll)    │         │  (Vote)          │           │
│  └────────┬─────────┘         └────────┬─────────┘           │
│           │                            │                     │
│           │    ┌──────────────────────┤                      │
│           │    │                      │                      │
│  ┌────────▼────▼────────────────────────┐                   │
│  │     Firebase Realtime Database       │                   │
│  │  - Groups & Participants             │                   │
│  │  - Polls & Votes (real-time)         │                   │
│  │  - Real-time sync                    │                   │
│  └──────────────┬───────────────────────┘                   │
│                 │                                             │
│  ┌──────────────▼───────────────────────┐                   │
│  │    Overlap Calculation Engine        │                   │
│  │  - Period matching algorithm         │                   │
│  │  - Availability percentage calc      │                   │
│  │  - Vote counting & results           │                   │
│  └──────────────┬───────────────────────┘                   │
│                 │                                             │
│  ┌──────────────▼───────────────────────┐                   │
│  │      Results & Export                │                   │
│  │  - CSV generation                    │                   │
│  │  - Vote results visualization        │                   │
│  │  - Calendar invite generation        │                   │
│  └──────────────────────────────────────┘                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌─────▼──────┐    ┌────▼────┐
   │ Hosting │      │ Database   │    │Functions│
   └─────────┘      └────────────┘    └─────────┘
                                    (Email: Invites
                                     & Results)
```

## Data Flow

### Creating a Group

1. Admin fills in GroupForm
2. Firebase `createGroup()` is called
3. Group stored in Realtime Database
4. Group ID returned to admin
5. Admin shares Group ID with participants

### Adding Availability

1. Participant joins with Group ID
2. Selects dates (flexible or blocks)
3. `addParticipant()` writes to Firebase
4. Stored under `groups/{groupId}/participants/{participantId}`
5. Admin Panel automatically updates (real-time listener)

### Calculating Overlaps

1. Admin panel fetches all participants
2. `calculateOverlap()` algorithm runs:
   - For each possible date range of requested duration
   - Count how many participants are available
   - Calculate percentage (available/total)
   - Sort by highest percentage
3. Results displayed in ResultsDisplay component
4. Can be exported to CSV

### Starting a Poll (Voting)

1. Admin proposes 2-5 candidate date ranges from overlap results
2. Admin clicks "Start Poll" to activate voting
3. `poll` object created in Firebase with:
   - Status: "active"
   - Candidates array with date ranges
   - Empty votes object
4. Participants see voting banner and highlighted candidates on calendar
5. Poll syncs in real-time as Firebase data updates

### Casting Votes

1. Participant clicks on highlighted candidate period
2. VotePanel displays with vote count and voter list
3. Participant clicks "Vote for this period"
4. `submitVote()` writes to Firebase `poll.votes[participantId]`
5. Vote count and percentage bar update in real-time
6. All other participants see updated vote counts immediately
7. (Optional) Auto-close poll when all participants have voted

### Closing Poll & Sending Results

1. Admin clicks "Close Poll" to set status to "closed"
2. Winning candidate determined by vote count
3. Admin clicks "Send Results"
4. POST request to `/api/send-vote-result` with winner date
5. Cloud Function:
   - Generates ICS calendar file
   - Sends HTML email to all participants
   - Includes calendar invite attachment
6. Participants can import event directly into calendar

### Sending Reminders

1. Admin clicks "Send Reminder"
2. POST request to Cloud Function endpoint
3. Function uses Nodemailer to send email
4. Confirmation shown to admin

## Component Hierarchy

```
App
├── HomePage
│   ├── CreateGroupForm
│   └── JoinGroupForm
├── AdminPanel
│   ├── GroupSettings (edit mode)
│   ├── ActionButtons
│   │   ├── Export CSV
│   │   ├── Send Reminder
│   │   └── Delete Group
│   ├── VotingSetup (propose candidates)
│   │   ├── SlidingOverlapCalendar
│   │   └── Candidate List
│   ├── VotingResults (live vote tracking)
│   │   ├── SlidingOverlapCalendar
│   │   ├── VotePanel (click to see votes)
│   │   └── Vote Counts
│   ├── ParticipantTable
│   └── ResultsDisplay
└── ParticipantView
    ├── GroupHeader
    ├── SlidingOverlapCalendar (voting mode)
    │   ├── MonthCalendar
    │   ├── DaySelection
    │   ├── BlockTypeSelector
    │   └── SubmitButton
    ├── VotePanel (vote for candidates)
    │   ├── Vote Counter
    │   ├── Voter List
    │   └── Vote Button
    ├── CalendarEventButton
    └── ParticipantList
```

## Database Schema

```
vacation-scheduler/
└── groups/
    └── {groupId}/
        ├── id: "1707000000000"
        ├── name: "Summer Vacation 2024"
        ├── startDate: "2024-06-01"
        ├── endDate: "2024-08-31"
        ├── adminEmail: "admin@example.com"
        ├── createdAt: "2024-02-04T10:00:00Z"
        ├── poll: {                          # Voting data (if poll active)
        │   ├── status: "active" | "closed"
        │   ├── mode: "single" | "multiple"
        │   ├── startedAt: "2024-02-04T11:00:00Z"
        │   ├── closedAt: "2024-02-04T12:00:00Z"
        │   ├── candidates: [
        │   │   {
        │   │     id: "cand_1",
        │   │     startDate: "2024-06-15",
        │   │     endDate: "2024-06-22"
        │   │   }
        │   │ ]
        │   └── votes: {                     # Real-time vote tracking
        │       {participantId}: {
        │         candidateIds: ["cand_1"],
        │         votedAt: "2024-02-04T11:30:00Z"
        │       }
        │     }
        │ }
        └── participants/
            └── {participantId}/
                ├── id: "1707000000001"
                ├── name: "John Doe"
                ├── email: "john@example.com"
                ├── duration: 5
                ├── blockType: "flexible"
                ├── availableDays: [
                │   "2024-06-05",
                │   "2024-06-06",
                │   "2024-06-07"
                │ ]
                └── createdAt: "2024-02-04T10:30:00Z"
```

## Algorithm: Overlap Calculation

```
calculateOverlap(participants, startDate, endDate, durationDays):
  results = []

  for each day in [startDate ... endDate - durationDays]:
    periodStart = day
    periodEnd = day + durationDays - 1

    availableCount = 0
    for each participant:
      if participant.availableDays contains ALL days in period:
        availableCount++

    percentAvailable = (availableCount / totalParticipants) * 100

    results.append({
      startDate: periodStart,
      endDate: periodEnd,
      availableCount: availableCount,
      availabilityPercent: percentAvailable
    })

  sort results by availabilityPercent (descending)
  return results
```

**Time Complexity**: O(n * d * p) where:
- n = number of possible periods
- d = duration days
- p = number of participants

**Space Complexity**: O(n) for results array

## Algorithm: Vote Tallying & Results

```
tallyVotes(poll):
  voteCounts = {}

  for each candidateId in poll.candidates:
    voteCounts[candidateId] = 0

  for each (participantId, voteData) in poll.votes:
    for each candidateId in voteData.candidateIds:
      voteCounts[candidateId]++

  // Find winner
  winner = max(voteCounts) by count
  winnerPercent = (voteCounts[winner] / totalParticipants) * 100

  return {
    winner: winner,
    voteCount: voteCounts[winner],
    percentage: winnerPercent,
    allCounts: voteCounts
  }
```

**Time Complexity**: O(v * c) where:
- v = number of votes cast
- c = number of candidates per vote

**Space Complexity**: O(c) for candidate counts

## State Management

### Global State (App.js)
- `currentPage`: home | admin | participant
- `groupId`: Current group being viewed
- `urlParams`: URL-based group navigation

### Admin Panel State
- `group`: Group object
- `participants`: Array of participant objects
- `loading`: Fetch status
- `error`: Error messages
- `editing`: Edit mode toggle
- `durationFilter`: Selected duration for filtering
- `overlaps`: Calculated overlap results
- `poll`: Current poll object (if active) with candidates and votes
- `votingMode`: Object containing `{ active, poll, currentParticipantId, isReadOnly }`
- `candidates`: Array of proposed date ranges for voting

### Participant View State
- `group`: Group object
- `loading`: Fetch status
- `submitted`: Form submission confirmation
- `participants`: Other participants list
- `currentParticipantId`: User's participant ID (for voting)
- `poll`: Current poll object (if active)
- `votingMode`: Object containing `{ active, poll, currentParticipantId, isReadOnly }`

### Calendar View State (Shared between Admin & Participant)
- `name`: Participant name
- `email`: Participant email
- `duration`: Trip duration selection
- `blockType`: Selection mode
- `selectedDays`: Array of selected dates
- `currentMonth/Year`: Calendar navigation
- `activeBlock`: Currently selected date range during voting
- `highlightedCandidates`: Array of candidate date ranges to highlight

### Vote Panel State
- `currentParticipantId`: User's participant ID
- `poll`: Current poll with candidates and votes
- `candidateId`: Selected candidate to vote on
- `myVote`: Current user's vote data (candidateIds array)

## Key Algorithms

### 1. Overlap Calculation
- **Purpose**: Find date ranges when most people are available
- **Input**: Participants, date range, duration
- **Output**: Ranked list of periods by availability %
- **Optimization**: Pre-sorted for fast access

### 2. Date Validation
- **Purpose**: Ensure dates are within group range
- **No wrapping**: Month boundaries are hard stops
- **Inclusive**: Both start and end dates included

### 3. CSV Generation
- **Purpose**: Export results for external use
- **Format**: Groups data into sections
- **Ordering**: Headers → participants → overlaps

## Performance Considerations

### Firebase Queries
- Fetch entire group on load (single query)
- Real-time listeners for participant updates
- No complex queries (keep rules simple)

### Rendering Optimization
- Calendar renders only current month
- Results paginated (top 10 periods shown)
- Use React.memo for list items (future enhancement)

### Storage Limits
- Firebase free tier: 1GB per project
- Estimated: ~1KB per participant
- Supports ~1M participant records

## Security Model

### Read/Write Rules
- **Current (Test Mode)**: Allow all reads/writes
- **Production**: Restrict by group ID

### Authentication
- No user accounts required
- Group ID is the shared secret
- Email optional for admin reminders only

### Data Privacy
- No sensitive data stored
- Names and emails only
- Group data is semi-public (shared ID)

## Extensibility Points

### Email Integration
- Voting invitations sent when poll starts
- Voting result emails with calendar attachments (ICS format)
- Easily swap Nodemailer for SendGrid, AWS SES, etc.
- Add custom email templates
- Implement scheduled reminders

### Voting System Enhancements
- Weighted voting (give higher weight to certain participants)
- Multiple choice voting (rank candidates by preference)
- Anonymous voting toggle
- Voting deadlines with auto-close
- Voting notifications/reminders

### Authentication
- Add Firebase Auth for admin login
- Implement group ownership verification
- Role-based access control (admin vs. participant)
- Admin-only poll management permissions

### Analytics
- Track group creation/participation
- Monitor overlap accuracy
- Measure voting engagement (participation rate)
- Track poll duration and vote distribution

### Mobile App
- Share same Firebase backend
- Native iOS/Android clients
- Offline sync support
- Push notifications for voting invites

## Deployment Architecture

```
Developer Machine
    ↓
npm run build (creates /build folder)
    ↓
firebase deploy
    ↓
Firebase Hosting (serves React app)
    ↓
Firebase Realtime DB (stores data)
    ↓
Cloud Functions (sends emails)
```

## Error Handling Strategy

1. **Network Errors**: Catch and display user-friendly messages
2. **Firebase Errors**: Log to console, show error boundary
3. **Validation Errors**: Prevent bad data at form submission
4. **Email Errors**: Log but don't block app

## Testing Strategy

### Unit Tests (Future)
- Overlap calculation algorithm
- Date validation functions
- CSV generation

### Integration Tests (Future)
- Create group → Add participants → Calculate overlaps
- Export CSV with real data
- Email sending through Cloud Functions

### E2E Tests (Future)
- Full user workflow from home to results
- Admin and participant flows
- Multi-browser compatibility
