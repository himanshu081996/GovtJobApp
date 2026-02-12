# Firebase Cloud Functions for Push Notifications

This directory contains Firebase Cloud Functions that handle push notifications for the Government Job App.

## Setup Instructions

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase Project
```bash
# From the main app directory
firebase init functions
# Select your existing Firebase project
# Choose JavaScript
# Install dependencies: Yes
```

### 4. Install Dependencies
```bash
cd firebase-functions
npm install
```

### 5. Deploy Functions
```bash
# From main app directory
firebase deploy --only functions
```

## Functions Overview

### `onJobAdded`
- **Trigger**: Firestore document creation in `jobs/{jobId}`
- **Purpose**: Sends push notifications when new jobs are added
- **Topics**: Sends to `jobs-{categoryId}` and `all-jobs` topics

### `sendTestNotification` (Callable)
- **Purpose**: Send test notifications for debugging
- **Usage**: Call from app or test scripts

### `getTopicInfo` (Callable)
- **Purpose**: Get information about FCM topics
- **Usage**: Debugging topic subscriptions

## How It Works

1. **Admin adds job** → Firestore document created
2. **Cloud Function triggered** → `onJobAdded` function runs
3. **Function sends notification** → To FCM topics based on job category
4. **Users receive push notifications** → On devices subscribed to topics

## Topic Structure

- `jobs-defence` - Defence category jobs
- `jobs-railway` - Railway category jobs
- `jobs-banking` - Banking category jobs
- `jobs-ssc` - SSC category jobs
- `jobs-upsc` - UPSC category jobs
- `jobs-state-govt` - State Government category jobs
- `jobs-police` - Police category jobs
- `jobs-teaching` - Teaching category jobs
- `all-jobs` - General job notifications

## Mobile App Integration

The mobile app subscribes/unsubscribes to topics when users:
- Enable/disable category notifications
- Enable/disable general notifications

## Testing

### Test via Firebase Console
1. Go to Firebase Console → Cloud Messaging
2. Send test message to topic (e.g., `jobs-defence`)

### Test via Function
```javascript
// Call sendTestNotification function
const testNotification = firebase.functions().httpsCallable('sendTestNotification');
testNotification({
  topic: 'jobs-defence',
  title: 'Test Notification',
  body: 'This is a test notification'
});
```

## Production Deployment

1. Ensure Firebase project is in production mode
2. Verify Firestore security rules allow Cloud Function access
3. Deploy functions:
   ```bash
   firebase deploy --only functions
   ```

## Logs and Monitoring

View function logs:
```bash
firebase functions:log
```

Monitor in Firebase Console:
- Functions → Logs
- Functions → Metrics

## Environment Variables

The functions use these environment variables (automatically available):
- Project ID
- Firebase Admin SDK credentials

No additional configuration needed for basic functionality.

## Security

- Functions use Firebase Admin SDK with elevated privileges
- Only deployed functions can send notifications
- Topic subscriptions are managed client-side
- No user data is stored server-side