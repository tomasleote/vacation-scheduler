# Vacation Scheduler

A web application designed to eliminate the headache of scheduling group vacations. Built with React and Firebase, this tool automatically calculates the optimal travel dates by finding the best overlap based on every participant's unique availability and desired trip duration.

## ✨ Core Features

✅ **Smart Overlap Engine**  
Automatically analyzes all participant calendars to find the absolute best travel windows (ranked by highest availability percentage).

✅ **Flexible Scheduling Options**  
Participants can choose exact dates or indicate they need a continuous block of time (e.g., any 3, 4, or 5 consecutive days within a month).

✅ **Admin Dashboard & Management**  
Group creators get an exclusive Admin Panel to edit group details, remove participants, copy personal invite links, or send email reminders with a single click.

✅ **Real-Time Synchronization**  
Powered by Firebase Realtime Database, once a participant saves their availability, the group's results update instantly for any Admin or participant viewing the dashboard.

✅ **Robust Access Recovery**  
Lost your admin link? Recover access securely via a hashed passphrase or an email link. You can also securely search for all groups tied to your email.

✅ **Data Export & Analytics**  
Export participant lists, individual availability, and the top overlap periods directly to CSV for offline coordination.

✅ **Offline Resistance & Error Handling**  
Built with resilient offline detection, optimistic UI updates, and strict error boundaries. You won't lose your data if your network drops on a train or a plane.

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Framer Motion
- **Database**: Firebase Realtime Database
- **API & Serverless**: Vercel Serverless Functions (`/api/*` routes)
- **Emails**: Nodemailer (via Serverless API endpoints)
- **Data Export**: PapaParse

## 🚀 How It Works

### 1. Create a Group (Admin Flow)
- Set a **Group Name**, **Start Date**, and **End Date** (the total possible window for the trip).
- Provide an **Admin Email** and **Passphrase** (highly recommended for recovering your admin privileges later).
- Share the generated **Group ID** or **Invite Link** with your friends.

### 2. Add Availability (Participant Flow)
- Users join via the group link.
- They enter their name and email (optional).
- Using the interactive calendar, they paint the days they are free to travel.

### 3. Review Results & Finalize
- The admin accesses the dashboard and views the **Overlap Results** tab.
- The system highlights the top periods where the highest percentage of the group can travel together.
- Once a date is decided, the Admin can export the data to CSV and book the trip!

## 💻 Local Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn
- A Firebase project (Realtime Database enabled)
- A Gmail account with App Passwords (for email notifications)

### 1. Clone & Install
```bash
git clone https://github.com/your-repo/vacation-scheduler.git
cd vacation-scheduler
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and populate it with your Firebase and Email credentials:

```env
REACT_APP_FIREBASE_API_KEY="your-api-key"
REACT_APP_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
REACT_APP_FIREBASE_DATABASE_URL="https://your-app-default-rtdb.firebaseio.com"
REACT_APP_FIREBASE_PROJECT_ID="your-project-id"
REACT_APP_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
REACT_APP_FIREBASE_MESSAGING_SENDER_ID="123456789"
REACT_APP_FIREBASE_APP_ID="1:123456789:web:abcdef123456"

# Email Configuration (for API routes)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
```

### 3. Run the Development Server
```bash
npm start
```
The app will be available at `http://localhost:3000`. API routes (like `/api/send-invite`) will run via `react-scripts` proxy if configured, or can be tested natively when deployed.

## 🚢 Deployment

This application is optimized for deployment on **Vercel** or **Netlify**, as it relies on Serverless Functions located in the `api/` directory.

### Deploying to Vercel
1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Add all the environment variables from your `.env.local` file into the Vercel project settings.
4. Deploy! Vercel will automatically host the React frontend and map the `api/` folder to serverless endpoints.

## 📄 License

MIT License. See the `LICENSE` file for more details.

## 🤝 Support & Contributions

Found a bug or want to suggest an improvement? Please open an issue or submit a pull request!
