import { Platform, Alert } from 'react-native';

// Gracefully handle when notifications are not available (Expo Go)
let Notifications: any = null;
let Device: any = null;
let Constants: any = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  Constants = require('expo-constants');
} catch (error) {
  console.log('Notifications not available in this environment');
}

// Configure notification handler (only if available)
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export class NotificationService {
  private static subscribedTopics: Set<string> = new Set();

  // Subscribe to FCM topic for category notifications
  static async subscribeToCategoryNotifications(categoryId: string): Promise<boolean> {
    try {
      const topicName = `jobs-${categoryId}`;
      this.subscribedTopics.add(topicName);

      console.log(`Subscribed to topic: ${topicName}`);

      // In production with native FCM:
      // await messaging().subscribeToTopic(topicName);

      return true;
    } catch (error) {
      console.error(`Error subscribing to category ${categoryId}:`, error);
      return false;
    }
  }

  // Unsubscribe from FCM topic
  static async unsubscribeFromCategoryNotifications(categoryId: string): Promise<boolean> {
    try {
      const topicName = `jobs-${categoryId}`;
      this.subscribedTopics.delete(topicName);

      console.log(`Unsubscribed from topic: ${topicName}`);

      // In production with native FCM:
      // await messaging().unsubscribeFromTopic(topicName);

      return true;
    } catch (error) {
      console.error(`Error unsubscribing from category ${categoryId}:`, error);
      return false;
    }
  }

  // Subscribe to general job notifications
  static async subscribeToGeneralNotifications(): Promise<boolean> {
    try {
      this.subscribedTopics.add('all-jobs');
      console.log('Subscribed to general job notifications');
      return true;
    } catch (error) {
      console.error('Error subscribing to general notifications:', error);
      return false;
    }
  }

  // Unsubscribe from general job notifications
  static async unsubscribeFromGeneralNotifications(): Promise<boolean> {
    try {
      this.subscribedTopics.delete('all-jobs');
      console.log('Unsubscribed from general job notifications');
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
  static async requestPermissions(): Promise<boolean> {
    try {
      if (!Notifications || !Device) {
        console.log('Notifications not available in Expo Go. Use development build for push notifications.');
        return false;
      }

      if (!Device.isDevice) {
        console.warn('Push notifications require a physical device');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission for push notifications was denied');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Notifications || !Constants) {
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        console.warn('Project ID not found for push notifications');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async scheduleJobNotification(
    categoryName: string,
    jobTitle: string,
    organizationName: string,
    delay: number = 0
  ): Promise<void> {
    try {
      if (!Notifications) {
        console.log(`Would notify: New ${categoryName} job - ${jobTitle} at ${organizationName}`);
        // Show a simple alert instead when notifications aren't available
        setTimeout(() => {
          Alert.alert(
            `New ${categoryName} Job! 🎯`,
            `${jobTitle} at ${organizationName}. Apply now!`,
            [{ text: 'OK' }]
          );
        }, delay * 1000);
        return;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `New ${categoryName} Job Posted! 🎯`,
          body: `${jobTitle} at ${organizationName}. Apply now!`,
          data: {
            category: categoryName,
            jobTitle,
            organizationName,
          },
        },
        trigger: delay > 0 ? { type: 'timeInterval', seconds: delay } : null,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  static async scheduleTestNotification(categoryName: string): Promise<void> {
    try {
      if (!Notifications) {
        // Show alert instead when notifications aren't available
        Alert.alert(
          `${categoryName} Job Alerts Enabled! ✅`,
          `You'll now receive notifications for new ${categoryName} job postings. Stay updated!`,
          [{ text: 'Got it!' }]
        );
        return;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

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
    } catch (error) {
      console.error('Error scheduling test notification:', error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      if (Notifications) {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  static async getBadgeCount(): Promise<number> {
    try {
      if (Notifications) {
        return await Notifications.getBadgeCountAsync();
      }
      return 0;
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  static async setBadgeCount(count: number): Promise<void> {
    try {
      if (Notifications) {
        await Notifications.setBadgeCountAsync(count);
      }
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Android specific notification channel setup
  static async setupAndroidNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android' && Notifications) {
      try {
        await Notifications.setNotificationChannelAsync('job-alerts', {
          name: 'Job Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1976D2',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('app-updates', {
          name: 'App Updates',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#388E3C',
          sound: 'default',
        });
      } catch (error) {
        console.error('Error setting up notification channels:', error);
      }
    }
  }
}

// Notification response handler
export const handleNotificationResponse = (response: any) => {
  if (!Notifications) return;

  const data = response.notification.request.content.data;

  if (data?.category && data?.jobTitle) {
    // Handle navigation to job details or category
    console.log('User tapped notification for:', data.category, data.jobTitle);
    // You can implement navigation logic here
  }
};