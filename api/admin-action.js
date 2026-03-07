const admin = require('firebase-admin');
const crypto = require('crypto');

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
        console.error('[admin-action] Firebase admin init error:', err);
    }
}

const hashPhrase = (text) => crypto.createHash('sha256').update(text).digest('hex');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { groupId, adminToken, action, payload } = req.body ?? {};

    if (!groupId || !adminToken || !action) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const db = admin.database();
        const groupRef = db.ref(`groups/${groupId}`);

        // Fetch only the hash to prevent downloading entire massive subtrees
        let adminTokenHash = null;
        const rootHashSnap = await groupRef.child('adminTokenHash').get();
        if (rootHashSnap.exists()) {
            adminTokenHash = rootHashSnap.val();
        } else {
            // Fallback for transition phase before all nodes have root hashes synced
            const metaHashSnap = await groupRef.child('meta/adminTokenHash').get();
            if (metaHashSnap.exists()) {
                adminTokenHash = metaHashSnap.val();
            } else {
                // Pre-PRP3 old locations
                const oldHashSnap = await groupRef.child('adminTokenHash').get();
                if (oldHashSnap.exists()) adminTokenHash = oldHashSnap.val();
            }
        }

        if (!adminTokenHash) {
            return res.status(404).json({ error: 'Group not found or missing admin token hash' });
        }

        const providedHash = hashPhrase(adminToken);

        // Constant-time string comparison to prevent timing attacks
        if (providedHash.length !== adminTokenHash.length ||
            !crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(adminTokenHash))) {
            return res.status(403).json({ error: 'Invalid admin token' });
        }

        // Token is valid, perform the requested action bypassing Client RTDB rules
        if (action === 'updateGroup') {
            const { adminTokenHash: _unused, ...safeUpdates } = payload || {};
            if (Object.keys(safeUpdates).length === 0) {
                return res.status(400).json({ error: 'No updates provided' });
            }
            await groupRef.child('meta').update(safeUpdates);
            return res.status(200).json({ success: true });

        } else if (action === 'deleteGroup') {
            await groupRef.remove();
            return res.status(200).json({ success: true });

        } else if (action === 'deleteParticipant') {
            const { participantId } = payload || {};
            if (!participantId) {
                return res.status(400).json({ error: 'Missing participantId for deleteParticipant' });
            }

            // Read participant data first to release name reservation
            const partSnap = await db.ref(`groups/${groupId}/participants/${participantId}`).get();
            if (partSnap.exists() && partSnap.val().name) {
                const normalizedName = partSnap.val().name.trim().toLowerCase();
                if (normalizedName) {
                    await db.ref(`groups/${groupId}/participantNames/${normalizedName}`).remove();
                }
            }

            await db.ref(`groups/${groupId}/participants/${participantId}`).remove();
            return res.status(200).json({ success: true });

        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

    } catch (err) {
        console.error(`[admin-action] Error performing ${action}:`, err);
        return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
