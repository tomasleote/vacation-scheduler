# Deployment Guide 🚢

This guide will walk you through deploying **Find A Day** to **Vercel** and **Firebase**.

## 🏗️ Prerequisites

-   [Node.js](https://nodejs.org/) (version 18 or higher)
-   [Vercel CLI](https://vercel.com/docs/cli) (optional, but recommended)
-   [Firebase CLI](https://firebase.google.com/docs/cli) (optional, if using Firebase Hosting)

---

## ☁️ Step 1: Set Up Firebase

1.  **Create Project**: Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Realtime Database**: 
    -   Select "Realtime Database" in the sidebar.
    -   Click "Create Database" and follow the steps.
    -   Choose a location and start in **Test Mode** (you should update the rules later using `database.rules.json` from this project).
3.  **Get Configuration**:
    -   Go to **Project Settings** → **General**.
    -   Click the **Web App** icon to register your app.
    -   Copy the `firebaseConfig` object values. You will need these for your environment variables.

---

## 🔑 Step 2: Environment Variables

Create a file named `.env.local` for local development or add these keys to your deployment platform (Vercel/Netlify):

```bash
# Firebase Frontend SDK (Required)
REACT_APP_FIREBASE_API_KEY="AIzaSyA..."
REACT_APP_FIREBASE_AUTH_DOMAIN="find-a-day.firebaseapp.com"
REACT_APP_FIREBASE_DATABASE_URL="https://find-a-day-default-rtdb.firebaseio.com"
REACT_APP_FIREBASE_PROJECT_ID="find-a-day"
REACT_APP_FIREBASE_STORAGE_BUCKET="find-a-day.appspot.com"
REACT_APP_FIREBASE_MESSAGING_SENDER_ID="12345678"
REACT_APP_FIREBASE_APP_ID="1:12345678:web:abcdef1234"

# Google Places (Optional, for location features)
REACT_APP_GOOGLE_PLACES_API_KEY="AIzaSyB..."

# Serverless Email Config (API/Nodemailer)
EMAIL_SERVICE="gmail"        # Or your service of choice
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
```

---

## 🔼 Step 3: Deploying to Vercel (Recommended)

**Find A Day** is optimized for Vercel out-of-the-box due to its serverless `/api` routes.

1.  Push your code to **GitHub/GitLab/Bitbucket**.
2.  Import the repository into **Vercel**.
3.  Add all environment variables from Step 2.
4.  Vercel will automatically detect the React build script and the `/api` folder.
5.  Click **Deploy**.

---

## 🔥 Step 4: Deploying to Firebase Hosting

If you prefer to host both the app and functions on Firebase:

1.  Initialize Firebase in your project:
    ```bash
    firebase init
    ```
    Choose **Hosting**, **Realtime Database**, and **Functions**.
2.  Update your `firebase.json` if needed (the project already contains one).
3.  Deploy:
    ```bash
    firebase deploy
    ```

---

## 🚀 Post-Deployment Checklist

- [ ] **Check Realtime Database Rules**: Apply the rules in `database.rules.json` to secure your data.
- [ ] **Verify APIs**: Test group creation to ensure the `/api/send-welcome` emails are delivering.
- [ ] **Verify Location**: Ensure the Google Places dropdown works in production (requires billing and authorized domain in Google Cloud).
- [ ] **Test Admin Access**: Confirm that recovering an admin link via email works correctly.

---

## 🛡️ Security Best Practices

-   **Restrict API Keys**: Go to the Google Cloud Console and restrict your API keys to only work on your domain.
-   **Email Security**: For high-volume production, switch from Gmail App Passwords to professional providers like SendGrid or Resend.
-   **Database**: Periodically backup your Firebase Realtime Database using the Firebase scheduled backups feature.
