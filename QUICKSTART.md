# Quick Start Guide

Get up and running with Vacation Scheduler in 5 minutes.

## 1. Clone/Download the Project

```bash
cd vacation-scheduler
```

## 2. Install Dependencies

```bash
npm install
cd functions && npm install && cd ..
```

## 3. Set Up Firebase

### Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it `vacation-scheduler`
4. Click "Create"

### Get Your Firebase Credentials

1. Go to Project Settings (gear icon)
2. Click "Service Accounts" tab
3. Click "Generate a new private key" (save this file)
4. Scroll to "Web apps" section
5. Copy the Firebase config (the object with `apiKey`, `authDomain`, etc.)

### Create `.env.local`

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste your Firebase config:

```
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

## 4. Start the App

```bash
npm start
```

Visit `http://localhost:3000`

## 5. Test It

### Create a Group

1. Click "Create Group"
2. Fill in:
   - Group Name: "Test Vacation"
   - Start Date: Pick a date in the future
   - End Date: Pick a date 30 days later
   - Admin Email: (optional)
3. Click "Create"
4. Copy the **Group ID** shown

### Add Participants

1. Open the link in another browser tab/window (or private/incognito)
2. Click "Join Group"
3. Paste the Group ID
4. Click "Join"
5. Enter your name
6. Select some dates
7. Click "Submit Availability"

### View Results

1. Go back to the first tab (Admin Panel)
2. Refresh the page
3. You should see:
   - Your participant listed
   - A calendar showing your selected dates
   - Overlap periods ranked by availability %

## 6. Deploy to Firebase (Optional)

```bash
# Login to Firebase
firebase login

# Link project
firebase use --add
# Select your project

# Build the app
npm run build

# Deploy
firebase deploy
```

Your app will be live at: `https://your-project.web.app`

## Next Steps

- Check out the full [README.md](README.md)
- Read the [DEPLOYMENT.md](DEPLOYMENT.md) guide
- Review the [API.md](API.md) documentation
- Enable email reminders (see DEPLOYMENT.md)

## Troubleshooting

**Error: "Cannot find module 'firebase'"**

```bash
npm install
```

**Error: "Database URL is not set"**

- Make sure `.env.local` exists with all Firebase credentials
- Restart the dev server: `npm start`

**Firebase Console shows no data**

- Check that you're in the Realtime Database section
- Make sure database is in "Test mode" (allows reads/writes)

**My changes aren't showing up**

- Refresh the browser
- Check browser console for errors (F12)
- Try in a different browser

## Tips

- Share the **Group ID** with participants, not your admin link
- Participants don't need accounts - just their name
- Results update in real-time as people join
- Export CSV from Admin Panel anytime

## Need Help?

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment issues
- Review [API.md](API.md) for code examples
- See [README.md](README.md) for full documentation

Happy planning! 🎉
