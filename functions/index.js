const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendReminder = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { groupId, groupName, adminEmail, participantCount, daysRemaining } = req.body;

  if (!adminEmail) {
    res.status(400).json({ error: 'Admin email required' });
    return;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `Reminder: ${groupName} Vacation Planning`,
      html: `
        <h2>Vacation Planning Reminder</h2>
        <p>Hi Admin,</p>
        <p>This is a reminder about your vacation planning group: <strong>${groupName}</strong></p>
        <ul>
          <li>Group ID: ${groupId}</li>
          <li>Current participants: ${participantCount}</li>
          <li>Days until vacation: ${daysRemaining}</li>
        </ul>
        <p>Keep sharing the group ID to gather more responses!</p>
        <p>Best regards,<br>Vacation Scheduler</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Reminder sent' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

exports.onGroupCreated = functions.database
  .ref('groups/{groupId}')
  .onCreate((snapshot, context) => {
    const group = snapshot.val();
    console.log(`Group created: ${context.params.groupId}`, group);
    return Promise.resolve();
  });

exports.cleanupOldGroups = functions.pubsub
  .schedule('every 30 days')
  .onRun(async (context) => {
    const db = admin.database();
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const snapshot = await db.ref('groups').get();
    const updates = {};
    let deletedCount = 0;

    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const group = child.val();
        if (new Date(group.createdAt) < cutoffDate) {
          updates[child.key] = null;
          deletedCount++;
        }
      });

      if (Object.keys(updates).length > 0) {
        await db.ref('groups').update(updates);
      }
    }

    console.log(`Cleaned up ${deletedCount} old groups`);
    return Promise.resolve();
  });
