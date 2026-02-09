# Deployment Guide

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Active Firebase project
- Node.js 18+

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it (e.g., "vacation-scheduler")
4. Enable Google Analytics (optional)
5. Create project

## Step 2: Set Up Firebase Services

### Realtime Database

1. In Firebase Console, go to **Realtime Database**
2. Click **Create Database**
3. Choose region (closest to your users)
4. Start in **Test Mode** (for development)
5. Copy the database URL (you'll need this)

### Authentication (Optional, for future enhancements)

1. Go to **Authentication**
2. Click **Set up sign-in method**
3. Enable methods you want (Google, Email/Password, etc.)

## Step 3: Configure Project Locally

```bash
# Navigate to project
cd vacation-scheduler

# Login to Firebase
firebase login

# Link to your Firebase project
firebase use --add
# Choose your project and give it an alias (e.g., "default")
```

## Step 4: Set Environment Variables

```bash
# Copy example config
cp .env.example .env.local

# Edit .env.local with your Firebase credentials
# Go to Project Settings → Web App → Firebase SDK snippet
# Copy the config values
```

**Your .env.local should look like:**

```
REACT_APP_FIREBASE_API_KEY=AIzaSyD...
REACT_APP_FIREBASE_AUTH_DOMAIN=vacation-scheduler-xxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=vacation-scheduler-xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=vacation-scheduler-xxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_DATABASE_URL=https://vacation-scheduler-xxx.firebaseio.com
```

## Step 5: Test Locally

```bash
# Install dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..

# Start development server
npm start
```

Visit `http://localhost:3000` and test the app locally.

## Step 6: Prepare for Deployment

```bash
# Build the React app
npm run build

# Check the build output
ls -la build/
```

## Step 7: Deploy to Firebase

### Option A: Deploy Everything

```bash
firebase deploy
```

This deploys:
- Hosting (React app)
- Functions (email reminders)
- Database rules

### Option B: Deploy Separately

```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only database rules
firebase deploy --only database
```

### Option C: Preview Before Deploy

```bash
# Deploy to preview channel
firebase hosting:channel:deploy preview

# Get preview URL from output
```

## Step 8: Verify Deployment

1. Visit your Firebase hosting URL (shown after deployment)
2. Test the app:
   - Create a group
   - Add participants
   - Verify data appears in Firebase Realtime Database
   - Test CSV export

## Step 9: Set Up Email Reminders (Optional)

### Using Gmail

1. Enable 2-Factor Authentication on your Gmail account
2. Generate App Password at [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Set Firebase environment variables:

```bash
firebase functions:config:set \
  email.service="gmail" \
  email.user="your-email@gmail.com" \
  email.password="your-app-password"
```

4. Redeploy functions:

```bash
firebase deploy --only functions
```

## Step 10: Monitor Your Deployment

```bash
# View function logs
firebase functions:log

# View hosting logs
firebase hosting:log

# View real-time database
# Visit Firebase Console → Realtime Database → Data tab
```

## Production Checklist

- [ ] Firebase project created
- [ ] Realtime Database configured
- [ ] Environment variables set
- [ ] Build successful (`npm run build`)
- [ ] Local testing passed
- [ ] App deployed to Firebase Hosting
- [ ] Email configuration (if using reminders)
- [ ] Database backup strategy
- [ ] Custom domain (optional)
- [ ] Security rules reviewed

## Security Rules (Production)

For production, update `database.rules.json`:

```json
{
  "rules": {
    "groups": {
      "$groupId": {
        ".read": "data.child('id').val() === $groupId",
        ".write": "data.child('id').val() === $groupId",
        "participants": {
          ".read": "root.child('groups').child($groupId).exists()",
          ".write": "newData.child('id').exists()"
        }
      }
    }
  }
}
```

Then redeploy:

```bash
firebase deploy --only database
```

## Troubleshooting

### "Cannot find module 'firebase-functions'"

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

### Database URL not found

Check your `.env.local` file has the correct `REACT_APP_FIREBASE_DATABASE_URL`.

### Email not sending

- Verify email credentials in Cloud Functions config
- Check function logs: `firebase functions:log`
- Ensure Gmail has 2FA enabled and app password is used

### Slow deployment

Firebase deployment can take 5-10 minutes. Wait for completion before checking results.

## After Deployment

1. **Share your app**: Give participants the Firebase hosting URL
2. **Monitor usage**: Check Firebase Console for database growth
3. **Backup**: Enable Firebase backups in settings
4. **Scale**: Firebase free tier supports ~100 concurrent users
5. **Analytics**: Enable Analytics in Firebase Console

## Support

- Firebase Docs: https://firebase.google.com/docs
- React Docs: https://react.dev
- GitHub Issues: Create an issue in your repo
