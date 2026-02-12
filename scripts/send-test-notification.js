const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
const expo = new Expo();

async function sendTestNotification(expoPushToken) {
  // Check that the push token is valid
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`Push token ${expoPushToken} is not a valid Expo push token`);
    return;
  }

  // Create the messages that you want to send to clients
  const messages = [
    {
      to: expoPushToken,
      sound: 'default',
      title: 'New Banking Job Posted! 🎯',
      body: 'Probationary Officer at State Bank of India. Apply now!',
      data: {
        category: 'banking',
        jobTitle: 'Probationary Officer',
        organizationName: 'State Bank of India',
      },
    },
  ];

  // Send the notifications
  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log('Notification sent successfully:', ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }

    return tickets;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage example:
// node send-test-notification.js YOUR_EXPO_PUSH_TOKEN_HERE

const expoPushToken = process.argv[2];

if (!expoPushToken) {
  console.log('Usage: node send-test-notification.js <EXPO_PUSH_TOKEN>');
  console.log('You can get your push token from the notification settings screen in your dev build');
  process.exit(1);
}

sendTestNotification(expoPushToken)
  .then(() => {
    console.log('Test notification sent!');
  })
  .catch(error => {
    console.error('Failed to send test notification:', error);
  });