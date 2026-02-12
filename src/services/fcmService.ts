import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class FCMService {
  private static token: string | null = null;
  private static subscribedTopics: Set<string> = new Set();

  // Initialize FCM and get push token
  static async initialize(): Promise<string | null> {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      });

      this.token = tokenData.data;
      console.log('FCM Token:', this.token);

      return this.token;
    } catch (error) {
      console.error('Error initializing FCM:', error);
      return null;
    }
  }

  // Get current token
  static getToken(): string | null {
    return this.token;
  }

  // Subscribe to a topic (category-based)
  static async subscribeToTopic(categoryId: string): Promise<boolean> {
    try {
      const topicName = `jobs-${categoryId}`;

      // Note: For Expo managed workflow, topic subscriptions are handled server-side
      // We simulate this by storing the subscription locally and handling it in our backend
      this.subscribedTopics.add(topicName);

      console.log(`Subscribed to topic: ${topicName}`);

      // In a real implementation with Firebase SDK, you would do:
      // await messaging().subscribeToTopic(topicName);

      return true;
    } catch (error) {
      console.error(`Error subscribing to topic jobs-${categoryId}:`, error);
      return false;
    }
  }

  // Unsubscribe from a topic
  static async unsubscribeFromTopic(categoryId: string): Promise<boolean> {
    try {
      const topicName = `jobs-${categoryId}`;

      this.subscribedTopics.delete(topicName);

      console.log(`Unsubscribed from topic: ${topicName}`);

      // In a real implementation with Firebase SDK, you would do:
      // await messaging().unsubscribeFromTopic(topicName);

      return true;
    } catch (error) {
      console.error(`Error unsubscribing from topic jobs-${categoryId}:`, error);
      return false;
    }
  }

  // Subscribe to general notifications
  static async subscribeToGeneralNotifications(): Promise<boolean> {
    try {
      this.subscribedTopics.add('all-jobs');
      console.log('Subscribed to general notifications');
      return true;
    } catch (error) {
      console.error('Error subscribing to general notifications:', error);
      return false;
    }
  }

  // Unsubscribe from general notifications
  static async unsubscribeFromGeneralNotifications(): Promise<boolean> {
    try {
      this.subscribedTopics.delete('all-jobs');
      console.log('Unsubscribed from general notifications');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from general notifications:', error);
      return false;
    }
  }

  // Get list of subscribed topics
  static getSubscribedTopics(): string[] {
    return Array.from(this.subscribedTopics);
  }

  // Handle notification received while app is running
  static addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Handle notification tapped
  static addNotificationResponseReceivedListener(listener: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Send a local test notification
  static async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Clear all notifications
  static async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Get notification permissions status
  static async getPermissionsStatus(): Promise<Notifications.PermissionStatus> {
    const settings = await Notifications.getPermissionsAsync();
    return settings.status;
  }

  // For Expo managed workflow - simulate topic subscription via server
  static async syncTopicSubscriptionsWithServer(): Promise<void> {
    if (!this.token) return;

    try {
      // In a real implementation, you would call your backend API
      // to register this device token with the subscribed topics
      const subscribedTopics = Array.from(this.subscribedTopics);

      console.log('Syncing topic subscriptions with server:', {
        token: this.token,
        topics: subscribedTopics
      });

      // Call your backend API here
      // await fetch('/api/subscribe-topics', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     token: this.token,
      //     topics: subscribedTopics
      //   })
      // });

    } catch (error) {
      console.error('Error syncing topic subscriptions:', error);
    }
  }
}