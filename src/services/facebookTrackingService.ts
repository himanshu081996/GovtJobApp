import { Settings, AppEventsLogger } from 'react-native-fbsdk-next';
// Android-only app - no platform checks needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../components/DebugConsole';

interface FacebookEventParams {
  [key: string]: string | number;
}

export class FacebookTrackingService {
  private static readonly INSTALL_TRACKED_KEY = 'facebook_install_tracked';
  private static readonly APP_LAUNCH_TRACKED_KEY = 'facebook_launch_tracked';
  private static isInitialized = false;

  // Initialize Facebook SDK - PROPER METHOD FOR EXPO
  static async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      logger.log('📘 Initializing Facebook SDK for Meta ads tracking...', 'info');

      // Initialize Facebook SDK for Android
      Settings.initializeSDK();

      // Configure Facebook SDK settings for Android
      Settings.setAutoLogAppEventsEnabled(true);
      Settings.setAdvertiserIDCollectionEnabled(true);

      logger.log('📘 Facebook SDK configured for Android', 'info');

      this.isInitialized = true;
      logger.log('✅ Facebook SDK initialized successfully', 'success');

      // Track app install on first launch
      await this.trackAppInstall();

      // Track app launch
      await this.trackAppLaunch();

    } catch (error) {
      logger.log(`❌ Facebook SDK initialization failed: ${error}`, 'error');
      console.error('Facebook SDK initialization error:', error);

      // Continue without crashing the app
      this.isInitialized = false;
    }
  }

  // Track app install (only once) - CRITICAL FOR META ADS
  static async trackAppInstall(): Promise<void> {
    try {
      const alreadyTracked = await AsyncStorage.getItem(this.INSTALL_TRACKED_KEY);

      if (alreadyTracked) {
        logger.log('📘 App install already tracked for Meta ads', 'info');
        return;
      }

      if (!this.isInitialized) {
        logger.log('⚠️ Facebook SDK not initialized, skipping install tracking', 'warning');
        return;
      }

      // Log install event - THIS IS KEY FOR META ADS ATTRIBUTION
      AppEventsLogger.logEvent('fb_mobile_complete_registration');

      // Mark as tracked
      await AsyncStorage.setItem(this.INSTALL_TRACKED_KEY, 'true');

      logger.log('✅ App install tracked for Meta ads', 'success');

    } catch (error) {
      logger.log(`❌ Error tracking app install: ${error}`, 'error');
    }
  }

  // Track app launch
  static async trackAppLaunch(): Promise<void> {
    try {
      const today = new Date().toDateString();
      const lastTracked = await AsyncStorage.getItem(this.APP_LAUNCH_TRACKED_KEY);

      if (lastTracked === today) {
        // Already tracked today
        return;
      }

      if (!this.isInitialized) {
        logger.log('⚠️ Facebook SDK not initialized, skipping launch tracking', 'warning');
        return;
      }

      // Log app open event
      AppEventsLogger.logEvent('fb_mobile_activate_app');

      // Mark as tracked for today
      await AsyncStorage.setItem(this.APP_LAUNCH_TRACKED_KEY, today);

      logger.log('✅ App launch tracked for Meta ads', 'success');

    } catch (error) {
      logger.log(`❌ Error tracking app launch: ${error}`, 'error');
    }
  }

  // Track job view events - CRITICAL FOR META ADS OPTIMIZATION
  static async trackJobViewed(jobId: string, jobTitle: string, category: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        logger.log('⚠️ Facebook SDK not initialized, skipping job view tracking', 'warning');
        return;
      }

      AppEventsLogger.logEvent('JobViewed', {
        job_id: jobId,
        job_title: jobTitle,
        job_category: category,
        fb_content_type: 'job',
        fb_content_id: jobId,
      });

      logger.log(`📘 Job view tracked: ${jobTitle}`, 'info');

    } catch (error) {
      logger.log(`❌ Error tracking job view: ${error}`, 'error');
    }
  }

  // Track job application - HIGHEST VALUE EVENT FOR META ADS
  static async trackJobApplication(jobId: string, jobTitle: string, category: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        logger.log('⚠️ Facebook SDK not initialized, skipping job application tracking', 'warning');
        return;
      }

      // This is a high-value conversion event for Meta ads
      AppEventsLogger.logEvent('ApplyNowClicked', {
        job_id: jobId,
        job_title: jobTitle,
        job_category: category,
        fb_content_type: 'job',
        fb_content_id: jobId,
        fb_conversion: 'true', // Mark as conversion
      });

      logger.log(`📘 Job application tracked: ${jobTitle}`, 'info');

    } catch (error) {
      logger.log(`❌ Error tracking job application: ${error}`, 'error');
    }
  }

  // Track notification opened
  static async trackNotificationOpened(jobId: string, category: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        logger.log('⚠️ Facebook SDK not initialized, skipping notification tracking', 'warning');
        return;
      }

      AppEventsLogger.logEvent('NotificationOpened', {
        job_id: jobId,
        job_category: category,
        source: 'push_notification',
        fb_content_type: 'job',
        fb_content_id: jobId,
      });

      logger.log(`📘 Notification open tracked: ${jobId}`, 'info');

    } catch (error) {
      logger.log(`❌ Error tracking notification open: ${error}`, 'error');
    }
  }

  // Track user engagement events
  static async trackUserEngagement(eventName: string, params: FacebookEventParams = {}): Promise<void> {
    try {
      if (!this.isInitialized) {
        logger.log('⚠️ Facebook SDK not initialized, skipping engagement tracking', 'warning');
        return;
      }

      AppEventsLogger.logEvent(eventName, params);

      logger.log(`📘 User engagement tracked: ${eventName}`, 'info');

    } catch (error) {
      logger.log(`❌ Error tracking user engagement: ${error}`, 'error');
    }
  }

  // Track search events
  static async trackSearch(searchQuery: string, resultsCount: number): Promise<void> {
    try {
      if (!this.isInitialized) {
        logger.log('⚠️ Facebook SDK not initialized, skipping search tracking', 'warning');
        return;
      }

      AppEventsLogger.logEvent('fb_mobile_search', {
        fb_search_string: searchQuery,
        fb_num_items: resultsCount,
      });

      logger.log(`📘 Search tracked: "${searchQuery}" (${resultsCount} results)`, 'info');

    } catch (error) {
      logger.log(`❌ Error tracking search: ${error}`, 'error');
    }
  }

  // Track category selection
  static async trackCategorySelected(categoryId: string, categoryName: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        logger.log('⚠️ Facebook SDK not initialized, skipping category tracking', 'warning');
        return;
      }

      AppEventsLogger.logEvent('CategorySelected', {
        category_id: categoryId,
        category_name: categoryName,
        fb_content_type: 'category',
        fb_content_id: categoryId,
      });

      logger.log(`📘 Category selection tracked: ${categoryName}`, 'info');

    } catch (error) {
      logger.log(`❌ Error tracking category selection: ${error}`, 'error');
    }
  }

  // Track onboarding completion
  static async trackOnboardingCompleted(selectedCategories: string[]): Promise<void> {
    try {
      if (!this.isInitialized) {
        logger.log('⚠️ Facebook SDK not initialized, skipping onboarding tracking', 'warning');
        return;
      }

      AppEventsLogger.logEvent('fb_mobile_complete_tutorial', {
        fb_num_items: selectedCategories.length,
        selected_categories: selectedCategories.join(','),
      });

      logger.log('📘 Onboarding completion tracked for Meta ads', 'success');

    } catch (error) {
      logger.log(`❌ Error tracking onboarding completion: ${error}`, 'error');
    }
  }

  // Check if SDK is properly initialized
  static isSDKInitialized(): boolean {
    return this.isInitialized;
  }

  // Reset tracking (for testing)
  static async resetTracking(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.INSTALL_TRACKED_KEY);
      await AsyncStorage.removeItem(this.APP_LAUNCH_TRACKED_KEY);

      logger.log('🔄 Facebook tracking reset', 'info');

    } catch (error) {
      logger.log(`❌ Error resetting Facebook tracking: ${error}`, 'error');
    }
  }
}