const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Category mapping for proper display names
const categoryMapping = {
  'defence': 'Defence',
  'railway': 'Railway',
  'banking': 'Banking',
  'ssc': 'SSC',
  'upsc': 'UPSC',
  'state-govt': 'State Government',
  'police': 'Police',
  'teaching': 'Teaching'
};

// Helper function to get category display name
const getCategoryDisplayName = (categoryId) => {
  return categoryMapping[categoryId] || categoryId.toUpperCase();
};

// Triggered when a new job is added to Firestore
exports.onJobAdded = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snap, context) => {
    const job = snap.data();
    const jobId = context.params.jobId;

    try {
      console.log(`New job added: ${job.title} in category: ${job.category}`);
      console.log(`Job data:`, JSON.stringify(job, null, 2));

      // Prepare notification payload
      const notification = {
        title: `🚀 New ${getCategoryDisplayName(job.category)} Job Available!`,
        body: `${job.title} - ${job.organization}`,
      };

      // Add image if available
      console.log(`Checking for notification image URL: ${job.notificationImageUrl}`);
      if (job.notificationImageUrl && job.notificationImageUrl.trim() !== '') {
        notification.image = job.notificationImageUrl;
        console.log(`✅ Adding notification image: ${job.notificationImageUrl}`);
      } else {
        console.log(`❌ No notification image URL provided or empty`);
      }

      // Prepare data payload for app handling
      const data = {
        jobId: jobId,
        category: job.category,
        title: job.title,
        organization: job.organization,
        type: 'new_job'
      };

      // Send to category-specific topic
      const topicName = `jobs-${job.category}`;

      const message = {
        notification: notification,
        data: data,
        topic: topicName,
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_notification',
            color: '#2196F3', // Blue color
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              category: 'NEW_JOB'
            }
          }
        }
      };

      // Send notification to topic
      const response = await admin.messaging().send(message);
      console.log(`Successfully sent notification to topic ${topicName}:`, response);

      // Also send to general "all-jobs" topic if exists
      const generalMessage = {
        ...message,
        topic: 'all-jobs'
      };

      try {
        const generalResponse = await admin.messaging().send(generalMessage);
        console.log('Successfully sent to general topic:', generalResponse);
      } catch (generalError) {
        console.log('General topic notification failed (topic might not exist):', generalError.message);
      }

      return { success: true, messageId: response };

    } catch (error) {
      console.error('Error sending notification:', error);
      return { error: error.message };
    }
  });

// Optional: Function to send custom notifications (for testing)
exports.sendTestNotification = functions.https.onCall(async (data, context) => {
  const { topic, title, body } = data;

  if (!topic || !title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      topic: topic,
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

// Function to get topic subscription count (for debugging)
exports.getTopicInfo = functions.https.onCall(async (data, context) => {
  const { topic } = data;

  try {
    // Note: Firebase doesn't provide direct subscription count API
    // This is mainly for testing topic functionality
    return {
      topic: topic,
      message: `Topic ${topic} is active. Subscription count not available via API.`
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});