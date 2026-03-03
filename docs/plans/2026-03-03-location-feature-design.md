# Location Feature Design — Vacation Scheduler

**Date:** 2026-03-03
**Status:** Design Approved
**Priority:** Optional but Emphasized

---

## Executive Summary

Add an optional location field to Groups, surfaced in:
- Admin settings (add/edit with Google Places autocomplete)
- Participant view (read-only display with Google Maps link)
- Public previews (SEO/social sharing)

**Key constraint:** Free tier Google Places API only. Gracefully degrade to manual text input if quota exceeded or API fails.

---

## Requirements

### Functional Requirements

- [ ] Optional location field (doesn't block group creation)
- [ ] Autocomplete in admin settings (GroupSettings) with fallback to manual text
- [ ] Display location in participant view with "Open in Google Maps" link
- [ ] Include location in public previews (SEO/social sharing)
- [ ] Store structured location data (placeId, address, coordinates, city, country)

### Non-Functional Requirements

- [ ] Free tier Google Places API only (no paid upgrades)
- [ ] Degrade gracefully if API quota exceeded or fails
- [ ] No direct API calls in components (service-based architecture)
- [ ] No breaking changes to existing groups (backward compatible)
- [ ] Domain-restricted API key (prevent abuse)

---

## Architecture

### Data Flow

```
Admin Input (LocationInput Component)
  ↓
locationService (Google Places API logic)
  ↓
Error handling (quota/failures) → fallback to text input
  ↓
GroupSettings state (editData.location)
  ↓
groupService.updateGroup()
  ↓
Firebase Realtime DB
  ↓
Subscriptions (ParticipantView, Public previews)
```

### Component Structure

**New Components:**
1. `LocationInput.jsx` — Autocomplete + fallback text input (admin use)
2. `LocationDisplay.jsx` — Read-only location display (participant/public use)

**Modified Components:**
1. `GroupSettings.jsx` — Integrate LocationInput field
2. `ParticipantView.js` — Add LocationDisplay
3. `SchemaMarkup.jsx` — Add location to structured data
4. Meta tags / public preview components — Include location

**New Service:**
1. `locationService.js` — Google Places API integration, free tier protection

---

## Data Model

### Firebase Schema

Location stored as optional object on group document:

```javascript
{
  groupId: "uuid",
  name: "Summer 2025",
  description: "...",
  startDate: "2025-07-01",
  endDate: "2025-07-15",
  eventType: "vacation",
  adminEmail: "...",
  createdAt: "2026-03-03T...",

  // NEW: Optional location object
  location: {
    placeId: "ChIJN1blFLsV9IIRCB33QewcLjM",           // Google Places ID
    formattedAddress: "1600 Amphitheatre Parkway, Mountain View, CA 94043",
    name: "Google Mountain View",                     // Place/business name
    country: "United States",
    city: "Mountain View",
    lat: 37.4224764,
    lng: -122.0842499,
    types: ["point_of_interest", "establishment"],    // Google place types
    street: "1600 Amphitheatre Parkway",             // Optional
    postalCode: "94043"                              // Optional
  }
  // OR minimal fallback if user enters text manually:
  // location: {
  //   formattedAddress: "Some manually entered text",
  //   name: null,
  //   placeId: null
  // }
}
```

### Backward Compatibility

- Existing groups without location: `location` field is `undefined`
- No data migration needed
- Display logic safely handles missing location

---

## API Integration

### Google Places Setup

**Free Tier Quota:**
- 28,500 requests/month at no charge
- Overage blocks further API calls (quota_exceeded error)
- No automatic paid tier upgrade

**API Key Management:**

1. Create Google Cloud project with billing enabled
2. Enable: Places API, Maps JavaScript API
3. Create API key (unrestricted initially for development)
4. Set HTTP Referrer restriction: `https://yourdomain.com/*`
5. Store in `.env.local`: `REACT_APP_GOOGLE_PLACES_API_KEY=your_key`

**Script Loading (public/index.html):**

```html
<script
  src="https://maps.googleapis.com/maps/api/js?key={REACT_APP_GOOGLE_PLACES_API_KEY}&libraries=places"
  async
  defer
></script>
```

### Free Tier Protection Strategy

**locationService.js enforces:**

```javascript
// Catches quota exceeded errors
if (response.status === 'OVER_QUERY_LIMIT') {
  throw new QuotaExceededError('Free tier quota exceeded. Using manual input.');
}

// Catches API failures
if (!window.google?.maps?.places) {
  throw new APIError('Google Places API unavailable.');
}
```

**UX consequence:** When quota exceeded or API fails, autocomplete disables, user enters location manually. **No service disruption, no paid charges.**

---

## UX & User Flows

### Admin: Adding Location

1. Admin opens GroupSettings, clicks "Edit"
2. Sees LocationInput field
3. Types location query
4. **If API available:** Dropdown shows autocomplete suggestions
   - Selects from list → full location object stored
5. **If API quota exceeded/failed:** Text input only
   - Types location manually → only `formattedAddress` + `name` stored
6. Clicks "Save" → location saved to Firebase

### Admin: Manual Fallback

- Always available as fallback
- User can enter any text: "Downtown Austin", "The Italian Restaurant on 5th St", etc.
- Minimum data saved: `{ formattedAddress: "user text", name: null, placeId: null }`

### Error States

| Scenario | Message | Behavior |
|----------|---------|----------|
| Autocomplete API call fails | "Search unavailable. Enter location manually." | Show text input only |
| Quota exceeded | "Using manual entry mode." | Show text input only |
| User selects from dropdown | (no message) | Save full location object |
| User enters text | (no message) | Save formatted text only |
| Invalid/empty input | "Please enter a location" | Show validation error |

### Participant View

Displays as:

```
📍 Mountain View, CA
[Open in Google Maps] ← clickable link
```

Google Maps link: `https://maps.google.com/?q=place_id:{placeId}` or `?q={formattedAddress}` if no placeId

### Public Previews (SEO/Social)

When group is shared (e.g., via OpenGraph):

```
Title: Summer 2025
Description: July 1-15, 2025 · 8 participants · Mountain View, CA
Image: (existing preview)
Structured Data: Include location in schema.org/Event
```

---

## Implementation Files

### Create

- `src/services/locationService.js` — Google Places integration, quota management
- `src/shared/ui/LocationInput.jsx` — Autocomplete + fallback component
- `src/shared/ui/LocationDisplay.jsx` — Read-only display component

### Modify

- `src/features/admin/GroupSettings.jsx` — Add LocationInput field in edit mode
- `src/shared/ui/index.js` — Export LocationInput, LocationDisplay
- `src/components/ParticipantView.js` — Display location if present
- `src/features/landing/SchemaMarkup.jsx` — Add location to structured data
- `public/index.html` — Load Google Maps script with API key
- `.env.local` — Add `REACT_APP_GOOGLE_PLACES_API_KEY`

---

## Testing Strategy

### Unit Tests

- `locationService.test.js` — API calls, quota handling, error cases
- `LocationInput.test.js` — Autocomplete dropdown, fallback state, selection
- `LocationDisplay.test.js` — Rendering, Google Maps link generation

### Integration Tests

- Add location in GroupSettings → verify Firebase update
- Delete location → verify removal
- Edit location → verify update
- Quota exceeded → verify fallback to text input

### Manual Testing

- [ ] Autocomplete suggests correctly
- [ ] Selection saves full location object
- [ ] Manual text entry works
- [ ] Participant sees location
- [ ] Google Maps link opens correctly
- [ ] Public preview includes location

---

## Security & Compliance

### API Key Protection

- Domain restricted to your production domain
- No sensitive data in location object (public place information only)
- Rate limited by Google's free tier quota

### No Paid Charges

- Free tier quota baked into implementation
- Quota exceeded error triggers fallback
- No automatic upgrade to paid tier possible via frontend

### Backward Compatibility

- No data migration
- Existing groups unaffected
- Graceful degradation if feature disabled

---

## Future Enhancements (Out of Scope)

- Static map image preview (after location selected)
- Interactive embedded map
- Location-based group filtering/search
- Nearby groups feature
- Location analytics/heatmaps

---

## Design Approval

- [x] Architecture approved
- [x] Data model approved
- [x] Component structure approved
- [x] API strategy (free tier only) approved
- [x] UX flow & error handling approved
- [x] Integration points approved

**Ready for implementation planning.**
