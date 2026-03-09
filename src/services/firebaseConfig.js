import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const _dbUrl = (() => {
  if (process.env.REACT_APP_FIREBASE_DATABASE_URL) {
    return process.env.REACT_APP_FIREBASE_DATABASE_URL;
  }
  if (process.env.NODE_ENV !== 'production') {
    return `https://${process.env.REACT_APP_FIREBASE_PROJECT_ID || "vacation-scheduler-demo"}-default-rtdb.firebaseio.com`;
  }
  throw new Error(
    '[firebaseConfig.js] REACT_APP_FIREBASE_DATABASE_URL must be set in production. ' +
    'Add it to your Vercel environment variables and redeploy.'
  );
})();

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDemoKey123456789",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "vacation-scheduler-demo.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "vacation-scheduler-demo",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "vacation-scheduler-demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  databaseURL: _dbUrl
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
