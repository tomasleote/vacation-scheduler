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
│  └────────┬─────────┘         └────────┬─────────┘           │
│           │                            │                     │
│           │    ┌──────────────────────┤                      │
│           │    │                      │                      │
│  ┌────────▼────▼────────────────────────┐                   │
│  │     Firebase Realtime Database       │                   │
│  │  - Groups & Participants             │                   │
│  │  - Real-time sync                    │                   │
│  └──────────────┬───────────────────────┘                   │
│                 │                                             │
│  ┌──────────────▼───────────────────────┐                   │
│  │    Overlap Calculation Engine        │                   │
│  │  - Period matching algorithm         │                   │
│  │  - Availability percentage calc      │                   │
│  └──────────────┬───────────────────────┘                   │
│                 │                                             │
│  ┌──────────────▼───────────────────────┐                   │
│  │      Results & Export                │                   │
│  │  - CSV generation                    │                   │
│  │  - Visualization                     │                   │
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
│   ├── ParticipantTable
│   └── ResultsDisplay
└── ParticipantView
    ├── GroupHeader
    ├── CalendarView
    │   ├── MonthCalendar
    │   ├── DaySelection
    │   ├── BlockTypeSelector
    │   └── SubmitButton
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

### Participant View State
- `group`: Group object
- `loading`: Fetch status
- `submitted`: Form submission confirmation
- `participants`: Other participants list

### Calendar View State
- `name`: Participant name
- `email`: Participant email
- `duration`: Trip duration selection
- `blockType`: Selection mode
- `selectedDays`: Array of selected dates
- `currentMonth/Year`: Calendar navigation

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
- Easily swap Nodemailer for SendGrid, AWS SES, etc.
- Add email templates
- Implement scheduled reminders

### Authentication
- Add Firebase Auth for admin login
- Implement group ownership verification
- Role-based access control

### Analytics
- Track group creation/participation
- Monitor overlap accuracy
- Measure usage patterns

### Mobile App
- Share same Firebase backend
- Native iOS/Android clients
- Offline sync support

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
