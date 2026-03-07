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

const metadataFields = ['name', 'description', 'startDate', 'endDate',
    'eventType', 'adminEmail', 'createdAt', 'id',
    'adminTokenHash', 'location', 'recoveryPasswordHash'];

async function migrateMeta() {
    console.log("Starting Meta Migration...");

    try {
        const groupsRef = db.ref('groups');
        const snapshot = await groupsRef.once('value');
        if (!snapshot.exists()) {
            console.log("No groups found to migrate.");
            return;
        }

        const groups = snapshot.val();
        let totalGroupsMigrated = 0;

        for (const [groupId, groupData] of Object.entries(groups)) {
            // Optional optimization: check if they already have `meta` mapped.
            if (groupData.meta) {
                console.log(`Skipping Group ${groupId} - already has meta mapped.`);
                continue;
            }

            const metaPayload = {};
            let hasDataToMigrate = false;

            for (const field of metadataFields) {
                if (groupData[field] !== undefined) {
                    metaPayload[field] = groupData[field];
                    hasDataToMigrate = true;
                }
            }

            if (hasDataToMigrate) {
                console.log(`Migrating Group ${groupData?.name || groupId} meta object...`);
                await db.ref(`groups/${groupId}/meta`).set(metaPayload);
                totalGroupsMigrated++;
            }
        }

        console.log("==========================================");
        console.log(`Migration Complete.`);
        console.log(`Groups Updated: ${totalGroupsMigrated}`);
        console.log("==========================================");

    } catch (e) {
        console.error("Migration failed:", e);
    }

    process.exit(0);
}

migrateMeta();
