# API Documentation

## Database API (Firebase Realtime Database)

### Groups

#### Create Group

```javascript
import { createGroup } from './firebase';

const groupId = await createGroup({
  name: 'Summer Vacation 2024',
  startDate: '2024-06-01',
  endDate: '2024-08-31',
  adminEmail: 'admin@example.com'
});
```

**Returns**: `string` - Group ID

#### Get Group

```javascript
import { getGroup } from './firebase';

const group = await getGroup(groupId);
// Returns:
// {
//   id: string,
//   name: string,
//   startDate: string,
//   endDate: string,
//   adminEmail: string,
//   createdAt: string
// }
```

#### Update Group

```javascript
import { updateGroup } from './firebase';

await updateGroup(groupId, {
  name: 'Updated Group Name',
  endDate: '2024-09-15'
});
```

#### Delete Group

```javascript
import { deleteGroup } from './firebase';

await deleteGroup(groupId);
```

### Participants

#### Add Participant

```javascript
import { addParticipant } from './firebase';

const participantId = await addParticipant(groupId, {
  name: 'John Doe',
  email: 'john@example.com',
  duration: 5,
  blockType: 'flexible',
  availableDays: ['2024-06-01', '2024-06-02', '2024-06-03']
});
```

**Returns**: `string` - Participant ID

#### Get Participants

```javascript
import { getParticipants } from './firebase';

const participants = await getParticipants(groupId);
// Returns: Array of participant objects
```

#### Delete Participant

```javascript
import { deleteParticipant } from './firebase';

await deleteParticipant(groupId, participantId);
```

## Utility APIs

### Overlap Calculation

#### Calculate Overlap

```javascript
import { calculateOverlap } from './utils/overlap';

const overlaps = calculateOverlap(
  participants,      // Array of participant objects
  '2024-06-01',      // Start date (YYYY-MM-DD)
  '2024-08-31',      // End date (YYYY-MM-DD)
  5                  // Duration in days
);

// Returns: Array of overlap objects
// [{
//   startDate: Date,
//   endDate: Date,
//   availableCount: number,
//   totalParticipants: number,
//   availabilityPercent: number,
//   dayCount: number
// }]
```

#### Get Best Overlap Periods

```javascript
import { getBestOverlapPeriods } from './utils/overlap';

const topPeriods = getBestOverlapPeriods(overlaps, 5);
// Returns first 5 best periods sorted by availability %
```

#### Format Date Range

```javascript
import { formatDateRange } from './utils/overlap';

const formatted = formatDateRange(
  new Date('2024-06-01'),
  new Date('2024-06-05')
);
// Returns: "Jun 1 - 5"
```

#### Get Dates Between

```javascript
import { getDatesBetween } from './utils/overlap';

const dates = getDatesBetween('2024-06-01', '2024-06-05');
// Returns: ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-05']
```

### Export

#### Export to CSV

```javascript
import { exportToCSV } from './utils/export';

exportToCSV(group, participants, overlaps);
// Triggers CSV download
```

## Cloud Functions API

### Send Reminder Email

**Endpoint**: `POST /api/send-reminder`

**Request**:

```json
{
  "groupId": "1707000000000",
  "groupName": "Summer Trip 2024",
  "adminEmail": "admin@example.com",
  "participantCount": 5,
  "daysRemaining": 45
}
```

**Response**:

```json
{
  "success": true,
  "message": "Reminder sent"
}
```

**Error Responses**:

```json
{
  "error": "Admin email required"
}
```

```json
{
  "error": "Failed to send email"
}
```

## Data Models

### Group

```typescript
interface Group {
  id: string;
  name: string;
  startDate: string;        // YYYY-MM-DD format
  endDate: string;          // YYYY-MM-DD format
  adminEmail?: string;
  createdAt: string;        // ISO 8601 timestamp
}
```

### Participant

```typescript
interface Participant {
  id: string;
  name: string;
  email?: string;
  duration: number;         // Days (1-10)
  blockType: 'flexible' | '3' | '4' | '5';
  availableDays: string[];  // Array of YYYY-MM-DD
  createdAt: string;        // ISO 8601 timestamp
}
```

### Overlap

```typescript
interface Overlap {
  startDate: Date;
  endDate: Date;
  availableCount: number;
  totalParticipants: number;
  availabilityPercent: number;
  dayCount: number;
}
```

## Error Handling

All API calls may throw errors. Wrap in try-catch:

```javascript
try {
  const group = await getGroup(groupId);
} catch (error) {
  console.error('Failed to fetch group:', error.message);
  // Handle error in UI
}
```

## Real-time Listeners

For real-time updates, use Firebase directly:

```javascript
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

const groupRef = ref(database, `groups/${groupId}`);

onValue(groupRef, (snapshot) => {
  const group = snapshot.val();
  console.log('Group updated:', group);
});
```

## Batch Operations

Update multiple fields:

```javascript
import { updateGroup } from './firebase';

await updateGroup(groupId, {
  name: 'New Name',
  endDate: '2024-09-01',
  adminEmail: 'newemail@example.com'
});
```

## Pagination & Limits

Firebase Realtime Database doesn't have built-in pagination. For large datasets:

```javascript
// Get first 100 participants
const participants = await getParticipants(groupId);
const paginated = participants.slice(0, 100);
```

## Rate Limiting

Firebase free tier has rate limits:
- Read/Write: 1 connection per 100ms
- Storage: 1GB total

## Caching

No client-side caching implemented. Consider adding:

```javascript
const cache = {};

async function getCachedGroup(groupId) {
  if (cache[groupId]) return cache[groupId];
  const group = await getGroup(groupId);
  cache[groupId] = group;
  return group;
}
```

## Examples

### Create and Populate a Group

```javascript
import { createGroup, addParticipant } from './firebase';

// Create group
const groupId = await createGroup({
  name: 'Beach Vacation',
  startDate: '2024-07-01',
  endDate: '2024-07-31',
  adminEmail: 'admin@example.com'
});

// Add participants
await addParticipant(groupId, {
  name: 'Alice',
  email: 'alice@example.com',
  duration: 5,
  blockType: 'flexible',
  availableDays: ['2024-07-05', '2024-07-06', '2024-07-07']
});

await addParticipant(groupId, {
  name: 'Bob',
  email: 'bob@example.com',
  duration: 3,
  blockType: '3',
  availableDays: ['2024-07-06', '2024-07-07', '2024-07-08']
});
```

### Calculate and Export Results

```javascript
import { calculateOverlap } from './utils/overlap';
import { exportToCSV } from './utils/export';
import { getGroup, getParticipants } from './firebase';

const group = await getGroup(groupId);
const participants = await getParticipants(groupId);

const overlaps = calculateOverlap(
  participants,
  group.startDate,
  group.endDate,
  5  // Find 5-day periods
);

exportToCSV(group, participants, overlaps);
```
