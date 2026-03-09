import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Parse private key correctly
let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
}

const serviceAccount = {
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error("Missing Firebase Admin credentials in environment.");
    process.exit(1);
}

initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL
});

const db = getDatabase();

async function migrateAvailability() {
    console.log("Starting Availability Migration...");

    try {
        const groupsRef = db.ref('groups');
        const snapshot = await groupsRef.once('value');
        if (!snapshot.exists()) {
            console.log("No groups found to migrate.");
            return;
        }

        const groups = snapshot.val();
        let totalParticipantsMigrated = 0;
        let totalGroupsMigrated = 0;

        for (const [groupId, groupData] of Object.entries(groups)) {
            const participants = groupData.participants || {};
            const availabilityUpdates = {};
            const dailyCountsDict = {};

            let migratedParts = 0;

            // Optional optimization: check if they already have `availability` mapped.
            if (groupData.availability) {
                console.log(`Skipping Group ${groupId} - already has availability mapped.`);
                continue;
            }

            for (const [pId, pData] of Object.entries(participants)) {
                if (!pData.availableDays || !Array.isArray(pData.availableDays)) continue;

                const daysObj = {};
                for (const d of pData.availableDays) {
                    daysObj[d] = true;
                    dailyCountsDict[d] = (dailyCountsDict[d] || 0) + 1;
                }

                availabilityUpdates[pId] = daysObj;
                migratedParts++;
                totalParticipantsMigrated++;
            }

            if (migratedParts > 0) {
                console.log(`Migrating Group ${groupData?.name || groupId} - ${migratedParts} participants`);

                // Write the availability object for this group
                if (Object.keys(availabilityUpdates).length > 0) {
                    await db.ref(`groups/${groupId}/availability`).set(availabilityUpdates);
                }

                // Write the pre-aggregated daily counts for this group
                if (Object.keys(dailyCountsDict).length > 0) {
                    await db.ref(`groups/${groupId}/dailyCounts`).set(dailyCountsDict);
                }

                totalGroupsMigrated++;
            }
        }

        console.log("==========================================");
        console.log(`Migration Complete.`);
        console.log(`Groups Updated: ${totalGroupsMigrated}`);
        console.log(`Participants Processed: ${totalParticipantsMigrated}`);
        console.log("==========================================");

    } catch (e) {
        console.error("Migration failed:", e);
    }

    process.exit(0);
}

migrateAvailability();
