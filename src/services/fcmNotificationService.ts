import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NavigationService } from './navigationService';
import { logger } from '../components/DebugConsole';
import { AnalyticsService } from './analyticsService';
import { FacebookTrackingService } from './facebookTrackingService';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class FCMNotificationService {
  private static subscribedTopics: Set<string> = new Set();
  private static fcmToken: string | null = null;
  private static foregroundUnsubscribe: (() => void) | null = null;
  private static recentNotifications = new Map<string, number>(); // jobId -> timestamp
  private static DEDUPLICATION_WINDOW = 10000; // 10 seconds

  // Initialize FCM - MINIMAL VERSION FOR DEBUGGING
  static async initialize(): Promise<string | null> {
    try {
      logger.log('🚀 FCM INIT START', 'info');
      console.log('🚀 FCM INITIALIZATION STARTING - THIS SHOULD ALWAYS SHOW');

      // Get permission
      const authStatus = await messaging().requestPermission();
      logger.log(`📱 Permission: ${authStatus}`, authStatus === 1 ? 'success' : 'warning');

      if (authStatus !== messaging.AuthorizationStatus.AUTHORIZED &&
          authStatus !== messaging.AuthorizationStatus.PROVISIONAL) {
        logger.log('❌ Permission denied', 'error');
        return null;
      }

      // Get token
      this.fcmToken = await messaging().getToken();
      logger.log(`🔑 Token: ${this.fcmToken ? 'GOT TOKEN' : 'NO TOKEN'}`, this.fcmToken ? 'success' : 'error');
      if (this.fcmToken) {
        logger.log(`🔑 Token (first 50): ${this.fcmToken.substring(0, 50)}...`, 'info');
      }

      // FOREGROUND message handler - now with actual notification display
      messaging().onMessage(async (message) => {
        logger.log('📱 FOREGROUND MESSAGE RECEIVED!', 'success');
        logger.log(`📱 Title: ${message.notification?.title || 'No title'}`, 'info');
        logger.log(`📱 Body: ${message.notification?.body || 'No body'}`, 'info');
        logger.log(`📱 Data: ${JSON.stringify(message.data)}`, 'info');

        try {
          // Check for duplicate notification
          const jobId = message.data?.jobId as string;
          const now = Date.now();

          if (jobId) {
            const lastSeen = this.recentNotifications.get(jobId);
            if (lastSeen && (now - lastSeen) < this.DEDUPLICATION_WINDOW) {
              logger.log(`🚫 Duplicate notification blocked for job: ${jobId}`, 'warning');
              return;
            }

            // Clean up old entries (older than deduplication window)
            for (const [id, timestamp] of this.recentNotifications.entries()) {
              if (now - timestamp > this.DEDUPLICATION_WINDOW) {
                this.recentNotifications.delete(id);
              }
            }

            // Record this notification
            this.recentNotifications.set(jobId, now);
            logger.log(`✅ New notification accepted for job: ${jobId}`, 'success');
          }

          // Show local notification when app is in foreground
          if (message.notification) {
            logger.log('📱 Scheduling local notification...', 'info');

            await Notifications.scheduleNotificationAsync({
              content: {
                title: message.notification.title || 'New Job Alert',
                body: message.notification.body || '',
                data: message.data || {},
                sound: 'default',
                priority: Notifications.AndroidImportance.HIGH,
                badge: 1,
              },
              trigger: null,
              identifier: `fcm-${Date.now()}`,
            });

            logger.log('✅ Local notification scheduled!', 'success');
          } else {
            logger.log('❌ No notification content in message', 'warning');
          }
        } catch (error) {
          logger.log(`❌ Error scheduling notification: ${error}`, 'error');
        }
      });

      // Background message handler
      messaging().setBackgroundMessageHandler((message) => {
        logger.log('📢 BACKGROUND MESSAGE RECEIVED!', 'success');
        return Promise.resolve();
      });

      // Handle notification tap when app is in background/quit state
      messaging().onNotificationOpenedApp((remoteMessage) => {
        logger.log('🎯 Notification opened app from background', 'success');
        console.log('🎯 BACKGROUND NOTIFICATION TAP - THIS SHOULD ALWAYS SHOW');
        console.log('🎯 PRODUCTION: Firebase direct notification tap detected');
        console.log('🎯 Message type: onNotificationOpenedApp (background)');
        setTimeout(() => {
          this.handleNotificationTap(remoteMessage);
        }, 500); // Small delay to ensure app is ready
      });

      // Check if app was opened from a notification (quit state)
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        logger.log('🎯 App opened from notification (quit state)', 'success');
        console.log('🎯 QUIT STATE NOTIFICATION TAP - THIS SHOULD ALWAYS SHOW');
        console.log('🎯 PRODUCTION: Firebase direct notification tap detected');
        console.log('🎯 Message type: getInitialNotification (quit state)');
        setTimeout(() => {
          this.handleNotificationTap(initialNotification);
        }, 1000); // Longer delay for quit state
      } else {
        console.log('🎯 No initial notification found on app start');
      }

      // Handle Expo notification taps (for local notifications in foreground)
      Notifications.addNotificationResponseReceivedListener(response => {
        logger.log('🎯 Expo notification tapped', 'success');
        console.log('🎯 EXPO NOTIFICATION TAPPED - THIS SHOULD ALWAYS SHOW');
        console.log('🎯 DEVELOPMENT: Expo local notification tap detected');
        console.log('🎯 Message type: Expo local notification');
        console.log('🎯 Response:', JSON.stringify(response, null, 2));

        const data = response.notification.request.content.data;
        logger.log(`🎯 Notification data: ${JSON.stringify(data)}`, 'info');

        // Use the same robust navigation approach
        const tryNavigation = async (attempts = 0) => {
          if (NavigationService.isReady()) {
            logger.log('🎯 Navigation ready for Expo notification', 'success');

            // Track Expo notification opened
            AnalyticsService.logNotificationOpened(data?.jobId as string, data?.category as string);
            // Track notification opened for Meta ads attribution
            FacebookTrackingService.trackNotificationOpened(data?.jobId as string, data?.category as string);

            if (data?.jobId && data?.category) {
              logger.log(`🎯 Navigating to job: ${data.jobId} in category: ${data.category}`, 'info');
              await NavigationService.navigateToJobFromNotification(data.jobId, data.category);
            } else {
              logger.log('🎯 No job data found, navigating to MainTabs', 'info');
              NavigationService.navigate('MainTabs');
            }
          } else if (attempts < 10) {
            logger.log(`🎯 Navigation not ready for Expo notification, retrying... (attempt ${attempts + 1})`, 'warning');
            setTimeout(() => tryNavigation(attempts + 1), 500);
          } else {
            logger.log('🎯 Expo notification: Navigation never became ready, giving up', 'error');
          }
        };

        tryNavigation();
      });

      logger.log('✅ FCM INIT COMPLETE', 'success');
      return this.fcmToken;
    } catch (error) {
      logger.log(`❌ FCM INIT ERROR: ${error}`, 'error');
      return null;
    }
  }

  // Handle notification tap
  private static handleNotificationTap(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
    const { data } = remoteMessage;
    console.log('🎯 ===== NOTIFICATION TAP HANDLER CALLED =====');
    console.log('🎯 PRODUCTION: Processing Firebase notification tap');
    console.log('🎯 Full message:', JSON.stringify(remoteMessage, null, 2));
    console.log('🎯 Notification data:', JSON.stringify(data));
    logger.log('🎯 Notification tap handler called', 'success');
    logger.log(`🎯 Data: ${JSON.stringify(data)}`, 'info');

    // Wait for navigation to be ready
    const tryNavigation = async (attempts = 0) => {
      console.log(`🎯 Checking navigation readiness... (attempt ${attempts + 1})`);
      if (NavigationService.isReady()) {
        console.log('🎯 Navigation is READY, proceeding with navigation...');
        logger.log('🎯 Navigation ready, proceeding...', 'success');

        // Track notification opened
        AnalyticsService.logNotificationOpened(data?.jobId as string, data?.category as string);
        // Track notification opened for Meta ads attribution
        FacebookTrackingService.trackNotificationOpened(data?.jobId as string, data?.category as string);

        if (data?.jobId && data?.category) {
          logger.log(`🎯 Navigating to job: ${data.jobId} in category: ${data.category}`, 'info');
          await NavigationService.navigateToJobFromNotification(data.jobId, data.category);
        } else {
          logger.log('🎯 No job data, navigating to MainTabs', 'info');
          NavigationService.navigate('MainTabs');
        }
      } else if (attempts < 10) {
        logger.log(`🎯 Navigation not ready, retrying... (attempt ${attempts + 1})`, 'warning');
        setTimeout(() => tryNavigation(attempts + 1), 500);
      } else {
        logger.log('🎯 Navigation never became ready, giving up', 'error');
      }
    };

    tryNavigation();
  }

  // Subscribe to FCM topic - MINIMAL VERSION
  static async subscribeToTopic(categoryId: string): Promise<boolean> {
    try {
      const topicName = `jobs-${categoryId}`;
      logger.log(`🔔 SUBSCRIBE: ${topicName}`, 'info');
      logger.log(`🔑 TOKEN: ${this.fcmToken ? 'YES' : 'NO'}`, this.fcmToken ? 'success' : 'error');

      await messaging().subscribeToTopic(topicName);
      this.subscribedTopics.add(topicName);
      logger.log(`✅ SUBSCRIBED: ${topicName}`, 'success');

      return true;
    } catch (error) {
      logger.log(`❌ SUBSCRIBE ERROR: ${error}`, 'error');
      return false;
    }
  }

  // Unsubscribe from FCM topic
  static async unsubscribeFromTopic(categoryId: string): Promise<boolean> {
    try {
      const topicName = `jobs-${categoryId}`;

      await messaging().unsubscribeFromTopic(topicName);
      this.subscribedTopics.delete(topicName);
      console.log(`Successfully unsubscribed from FCM topic: ${topicName}`);

      return true;
    } catch (error) {
      console.error(`Error unsubscribing from FCM topic jobs-${categoryId}:`, error);
      return false;
    }
  }

  // Subscribe to general notifications
  static async subscribeToGeneralNotifications(): Promise<boolean> {
    try {
      await messaging().subscribeToTopic('all-jobs');
      this.subscribedTopics.add('all-jobs');
      console.log('Successfully subscribed to general job notifications');
      return true;
    } catch (error) {
      console.error('Error subscribing to general notifications:', error);
      return false;
    }
  }

  // Unsubscribe from general notifications
  static async unsubscribeFromGeneralNotifications(): Promise<boolean> {
    try {
      await messaging().unsubscribeFromTopic('all-jobs');
      this.subscribedTopics.delete('all-jobs');
      console.log('Successfully unsubscribed from general notifications');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from general notifications:', error);
      return false;
    }
  }

  // Get FCM token
  static getToken(): string | null {
    return this.fcmToken;
  }

  // Get subscribed topics
  static getSubscribedTopics(): string[] {
    return Array.from(this.subscribedTopics);
  }

  // Send test notification (for testing purposes)
  static async scheduleTestNotification(categoryName: string): Promise<void> {
    try {
      logger.log(`📋 Scheduling test notification for ${categoryName}`, 'info');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${categoryName} Job Alerts Enabled! ✅`,
          body: `You'll now receive notifications for new ${categoryName} job postings. Stay updated!`,
          data: {
            category: categoryName,
            test: true,
          },
        },
        trigger: { type: 'timeInterval', seconds: 2 },
      });

      logger.log(`✅ Test notification scheduled for ${categoryName}`, 'success');
    } catch (error) {
      logger.log(`❌ Error scheduling test notification: ${error}`, 'error');
    }
  }

  // Setup Android notification channels
  static async setupAndroidNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        logger.log('📋 Setting up Android notification channel', 'info');

        await Notifications.setNotificationChannelAsync('job-alerts', {
          name: 'Job Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1976D2',
          sound: 'default',
        });

        logger.log('✅ Android notification channel set up', 'success');
      } catch (error) {
        logger.log(`❌ Error setting up notification channels: ${error}`, 'error');
      }
    } else {
      logger.log('📋 Skipping Android channel setup (not Android)', 'info');
    }
  }
}