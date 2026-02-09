# Vacation Scheduler

A full-featured vacation scheduling app built with React and Firebase. Perfect for coordinating group vacations and finding the best dates when everyone is available.

## Features

✅ **Admin Panel** - Create and manage vacation groups  
✅ **Flexible Date Selection** - Pick individual days or select fixed-duration blocks (3/4/5 days)  
✅ **Overlap Calculation** - Automatically calculates best matching periods by availability %  
✅ **Participant Tracking** - See who's available and for how long  
✅ **CSV Export** - Download all results and participant data  
✅ **Email Reminders** - Send reminders to admin for follow-ups  
✅ **Mobile Responsive** - Clean, modern UI that works on all devices  
✅ **Real-time Updates** - Firebase Realtime Database for instant sync  

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: Firebase (Realtime Database, Cloud Functions, Hosting)
- **Email**: Nodemailer + Cloud Functions
- **Export**: PapaParse for CSV generation

## Local Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account

### Installation

```bash
# Clone or navigate to project
cd vacation-scheduler

# Install dependencies
npm install

# Install Firebase tools globally
npm install -g firebase-tools

# Install Cloud Functions dependencies
cd functions && npm install && cd ..
```

### Configuration

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)

2. Set up:
   - Realtime Database (Start in test mode)
   - Enable Hosting
   - Create Cloud Functions

3. Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

4. Get your Firebase config:
   - Go to Project Settings → Service Accounts → Web app credentials
   - Copy the config values to `.env.local`

5. Initialize Firebase locally:

```bash
firebase login
firebase init
```

### Running Locally

```bash
# Start the React dev server
npm start

# In another terminal, start Firebase emulator (optional)
firebase emulators:start
```

Visit `http://localhost:3000`

## Deployment

### Deploy to Firebase Hosting

```bash
# Build the React app
npm run build

# Deploy to Firebase
firebase deploy

# Or deploy only hosting
firebase deploy --only hosting
```

### Deploy Cloud Functions

```bash
cd functions

# Set environment variables
firebase functions:config:set \
  email.service="gmail" \
  email.user="your-email@gmail.com" \
  email.password="your-app-password"

cd ..

# Deploy
firebase deploy --only functions
```

## Usage

### Create a Group (Admin)

1. Click "Create Group"
2. Enter group name, start/end dates
3. Share the resulting **Group ID** with participants
4. View results in Admin Panel

### Join a Group (Participant)

1. Click "Join Group"
2. Paste the Group ID
3. Enter your name and email
4. Select available dates (flexible or fixed blocks)
5. Submit

### Admin Panel

- View all participants and their availability
- Filter results by duration (1-10 days)
- See overlap statistics
- Export results to CSV
- Send email reminders
- Edit group settings

## Overlap Algorithm

The app calculates the best vacation periods by:

1. Checking all possible date ranges of the selected duration
2. Counting how many participants are available for each range
3. Calculating availability percentage (available / total participants)
4. Ranking by highest availability %

**No date wrapping**: If a block spans a month boundary, it's capped at month end.

## File Structure

```
vacation-scheduler/
├── src/
│   ├── App.js                 # Main app component
│   ├── firebase.js            # Firebase config & API
│   ├── index.css              # Tailwind styles
│   ├── components/
│   │   ├── AdminPanel.js      # Admin dashboard
│   │   ├── ParticipantView.js # Participant interface
│   │   ├── CalendarView.js    # Calendar & selection
│   │   ├── ResultsDisplay.js  # Results visualization
│   │   └── ParticipantForm.js # Form wrapper
│   └── utils/
│       ├── overlap.js         # Overlap calculation logic
│       └── export.js          # CSV export utilities
├── functions/
│   └── index.js               # Cloud Functions
├── public/
│   └── index.html             # HTML entry point
├── firebase.json              # Firebase config
├── database.rules.json        # Firestore rules
├── tailwind.config.js         # Tailwind config
└── package.json               # Dependencies
```

## Database Schema

```
groups/
  {groupId}/
    id: string
    name: string
    startDate: string (YYYY-MM-DD)
    endDate: string (YYYY-MM-DD)
    adminEmail: string (optional)
    createdAt: string (ISO)
    participants/
      {participantId}/
        id: string
        name: string
        email: string (optional)
        duration: number (days)
        blockType: string (flexible|3|4|5)
        availableDays: array of strings (YYYY-MM-DD)
        createdAt: string (ISO)
```

## Environment Variables

```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_DATABASE_URL
EMAIL_SERVICE
EMAIL_USER
EMAIL_PASSWORD
```

## Email Reminders

To enable email reminders:

1. Use Gmail with [App Passwords](https://support.google.com/accounts/answer/185833)
2. Set email environment variables in Cloud Functions
3. Call `POST /api/send-reminder` from the admin panel

## License

MIT

## Support

For issues or questions, create an issue in the GitHub repository.
