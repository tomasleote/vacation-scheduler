// Vercel Serverless Cron Job — GET /api/cron-cleanup
// Automatically triggered by Vercel on a schedule (e.g. 1st and 15th of the month).
// Must have authentication from Vercel via CRON_SECRET header to run.
// Environment requirements:
// - CRON_SECRET: Automatically injected by Vercel for Cron authorization
// - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY: Credentials for Firebase Admin
// - REACT_APP_FIREBASE_DATABASE_URL: Standard app DB URL

const admin = require('firebase-admin');

// Ensure the Admin SDK is correctly initialized exactly once
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace literal literal \n blocks with actual newlines in private key if they exist
                privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
        });
    } catch (err) {
        console.error('[cron-cleanup] Firebase admin init error:', err);
    }
}

module.exports = async function handler(req, res) {
    // 1. Validate Cron Secret Header (Vercel security requirement)
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        console.error('[cron-cleanup] Unauthorized attempt to run cron job');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Validate Firebase Admin Configuration
    if (!process.env.REACT_APP_FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
        console.error('[cron-cleanup] Missing Firebase Admin credentials');
        return res.status(500).json({ error: 'Internal Server Error: Missing DB Credentials' });
    }

    try {
        const db = admin.database();

        // We want to delete groups older than 90 days.
        const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        // Query only the metadata nodes to avoid downloading massive participant arrays
        // for every group in the database during the cron sweep
        const snapshot = await db.ref('groups').orderByChild('meta/createdAt').endAt(cutoffDate.toISOString()).get();

        const updates = {};
        let deletedCount = 0;

        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const group = child.val();
                const createdAt = group.meta?.createdAt || group.createdAt;
                if (createdAt && new Date(createdAt) < cutoffDate) {
                    updates[child.key] = null; // Setting a node to null deletes it in RTDB
                    deletedCount++;
                }
            });

            // Apply mass deletion all at once if there are expirations
            if (Object.keys(updates).length > 0) {
                await db.ref('groups').update(updates);
            }
        }

        console.log(`[cron-cleanup] Sweep complete. Cleaned up ${deletedCount} old groups.`);
        return res.status(200).json({ success: true, deleted: deletedCount });

    } catch (err) {
        console.error('[cron-cleanup] Error running cleanup sweep:', err);
        return res.status(500).json({ error: 'Failed to run sweep', details: err.message });
    }
};
