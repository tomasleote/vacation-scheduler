# API Documentation 🚀

Internal services and data models for **Find A Day**.

## 🏗️ Core Services

### Group Service (`src/services/groupService.js`)

Used for creating and managing group events.

#### Create Group
```javascript
import { createGroup } from './services/groupService';

const { groupId, adminToken } = await createGroup({
  name: 'Summer Trip 2026',
  description: 'Optional group description',
  startDate: '2026-06-01',
  endDate: '2026-08-31',
  eventType: 'vacation', // 'vacation'|'dinner'|'party'|'gamenight'|'team'|'other'
  adminEmail: 'admin@example.com',
  location: {
    name: 'Beach Resort',
    formattedAddress: '123 Ocean Drive, Miami, FL',
    lat: 25.7617,
    lng: -80.1918
  }
});
```

#### Update Group
```javascript
import { updateGroup } from './services/groupService';

await updateGroup(groupId, {
  name: 'Revised Trip Name',
  description: 'Updated details...'
});
```

---

### Participant Service (`src/services/participantService.js`)

Handles participant availability and basic profile data.

#### Add Participant
```javascript
import { addParticipant } from './services/participantService';

const participantId = await addParticipant(groupId, {
  name: 'John Doe',
  email: 'john@example.com',
  duration: 5,           // Days intended to stay
  blockType: 'flexible', // 'flexible' or exact continuous block
  availableDays: ['2026-06-10', '2026-06-11', '2026-06-12']
});
```

---

## 📊 Data Models

### Group
```typescript
interface Group {
  id: string;               // UUID
  name: string;             // Max 100 chars
  description?: string;     // Max 1000 chars
  startDate: string;        // YYYY-MM-DD
  endDate: string;          // YYYY-MM-DD
  eventType: string;        // e.g., 'vacation'
  adminEmail?: string;
  adminTokenHash: string;   // SHA-256 hash of adminToken
  createdAt: string;        // ISO 8601
  location?: {
    placeId?: string;
    name?: string;
    formattedAddress: string;
    lat?: number;
    lng?: number;
  };
}
```

### Participant
```typescript
interface Participant {
  id: string;               // UUID
  name: string;             // Unique within group
  email?: string;
  duration: number;         // Suggested trip length
  blockType: string;        // 'flexible' or specific number
  availableDays: string[];  // Array of YYYY-MM-DD
  createdAt: string;        // ISO 8601
}
```

---

## 🌩️ Serverless API (`/api`)

These routes handle sensitive operations like emailing and recovery.

### Send Welcome/Invite
**Endpoint**: `POST /api/send-welcome`
**Payload**: `{ groupId, adminToken, groupName, startDate, endDate, adminEmail, baseUrl }`

### Recover Admin Links
**Endpoint**: `POST /api/recover`
**Payload**: `{ email, baseUrl }` or `{ groupId, email, baseUrl }`

---

## 🧮 Calculation Logic (`src/utils/overlap.js`)

The core algorithm finds the best overlapping window by:
1. Identifying all unique start dates within the group window.
2. For each date, checking how many participants have a contiguous block of availability starting there.
3. Ranking results by the highest number of available participants.
4. Returning a sorted array of the best windows for the admin to review.
