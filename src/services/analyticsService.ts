import analytics from '@react-native-firebase/analytics';
import { Job, JobCategory } from '../types';

export class AnalyticsService {
  private static currentScreen: string | null = null;

  // Initialize analytics
  static async initialize() {
    try {
      // Reset current screen on app initialization (fresh app start)
      this.currentScreen = null;

      await analytics().setAnalyticsCollectionEnabled(true);
      console.log('📊 Analytics initialized successfully');

      // Log app open
      await analytics().logAppOpen();
    } catch (error) {
      console.error('📊 Analytics initialization failed:', error);
    }
  }

  // Track screen views
  static async logScreenView(screenName: string, screenClass?: string) {
    try {
      // Prevent duplicate screen views for the same screen
      if (this.currentScreen === screenName) {
        return;
      }

      this.currentScreen = screenName;

      // Log both standard screen_view and custom screen-specific event
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });

      // Log custom event with screen-specific name
      const customEventName = `${screenName.toLowerCase()}_screen_view`;
      await analytics().logEvent(customEventName, {
        screen_name: screenName,
        screen_class: screenClass || screenName,
        timestamp: Date.now(),
      });

      console.log(`📊 Screen view: ${screenName}`);
    } catch (error) {
      console.error('📊 Screen view tracking failed:', error);
    }
  }

  // Track job interactions
  static async logJobViewed(job: Job) {
    try {
      await analytics().logEvent('job_viewed', {
        job_id: job.id,
        job_title: job.title,
        organization: job.organization,
        category: job.category,
        job_type: job.jobType,
        location: job.location,
        is_new: job.isNew,
      });
      console.log(`📊 Job viewed: ${job.title}`);
    } catch (error) {
      console.error('📊 Job view tracking failed:', error);
    }
  }

  // Track apply button clicks
  static async logApplyNowClicked(job: Job) {
    try {
      await analytics().logEvent('apply_now_clicked', {
        job_id: job.id,
        job_title: job.title,
        organization: job.organization,
        category: job.category,
        job_type: job.jobType,
        location: job.location,
        apply_url: job.applyUrl,
        total_vacancies: job.totalVacancies,
        application_fee: job.applicationFee,
      });
      console.log(`📊 Apply clicked: ${job.title}`);
    } catch (error) {
      console.error('📊 Apply click tracking failed:', error);
    }
  }

  // Track category selections
  static async logCategorySelected(category: JobCategory) {
    try {
      await analytics().logEvent('category_selected', {
        category_id: category.id,
        category_name: category.name,
        total_jobs: category.totalJobs,
      });
      console.log(`📊 Category selected: ${category.name}`);
    } catch (error) {
      console.error('📊 Category selection tracking failed:', error);
    }
  }

  // Track job saves
  static async logJobSaved(job: Job) {
    try {
      await analytics().logEvent('job_saved', {
        job_id: job.id,
        job_title: job.title,
        organization: job.organization,
        category: job.category,
        job_type: job.jobType,
      });
      console.log(`📊 Job saved: ${job.title}`);
    } catch (error) {
      console.error('📊 Job save tracking failed:', error);
    }
  }

  // Track job unsaves
  static async logJobUnsaved(jobId: string, jobTitle?: string) {
    try {
      await analytics().logEvent('job_unsaved', {
        job_id: jobId,
        job_title: jobTitle || 'Unknown',
      });
      console.log(`📊 Job unsaved: ${jobTitle || jobId}`);
    } catch (error) {
      console.error('📊 Job unsave tracking failed:', error);
    }
  }

  // Track search actions
  static async logSearch(query: string, resultsCount: number) {
    try {
      await analytics().logEvent('search', {
        search_term: query,
        results_count: resultsCount,
      });
      console.log(`📊 Search: "${query}" (${resultsCount} results)`);
    } catch (error) {
      console.error('📊 Search tracking failed:', error);
    }
  }

  // Track notification interactions
  static async logNotificationOpened(jobId?: string, category?: string) {
    try {
      await analytics().logEvent('notification_opened', {
        job_id: jobId || 'unknown',
        category: category || 'general',
        source: 'push_notification',
      });
      console.log(`📊 Notification opened: ${jobId || 'general'}`);
    } catch (error) {
      console.error('📊 Notification tracking failed:', error);
    }
  }

  // Track notification subscriptions
  static async logNotificationSubscribe(categoryId: string, categoryName: string) {
    try {
      await analytics().logEvent('notification_subscribe', {
        category_id: categoryId,
        category_name: categoryName,
      });
      console.log(`📊 Notification subscribed: ${categoryName}`);
    } catch (error) {
      console.error('📊 Notification subscribe tracking failed:', error);
    }
  }

  // Track notification unsubscriptions
  static async logNotificationUnsubscribe(categoryId: string, categoryName: string) {
    try {
      await analytics().logEvent('notification_unsubscribe', {
        category_id: categoryId,
        category_name: categoryName,
      });
      console.log(`📊 Notification unsubscribed: ${categoryName}`);
    } catch (error) {
      console.error('📊 Notification unsubscribe tracking failed:', error);
    }
  }

  // Track app sessions
  static async logSessionStart() {
    try {
      await analytics().logEvent('session_start', {
        timestamp: Date.now(),
      });
      console.log('📊 Session started');
    } catch (error) {
      console.error('📊 Session start tracking failed:', error);
    }
  }

  // Track user engagement
  static async logEngagement(engagementTimeMs: number) {
    try {
      await analytics().logEvent('user_engagement', {
        engagement_time_msec: engagementTimeMs,
      });
      console.log(`📊 User engagement: ${engagementTimeMs}ms`);
    } catch (error) {
      console.error('📊 Engagement tracking failed:', error);
    }
  }

  // Track errors (for debugging)
  static async logError(errorType: string, errorMessage: string, screenName?: string) {
    try {
      await analytics().logEvent('app_error', {
        error_type: errorType,
        error_message: errorMessage,
        screen_name: screenName || 'unknown',
        timestamp: Date.now(),
      });
      console.log(`📊 Error logged: ${errorType}`);
    } catch (error) {
      console.error('📊 Error tracking failed:', error);
    }
  }

  // Set user properties (anonymous)
  static async setUserProperties(properties: { [key: string]: string | number | boolean }) {
    try {
      for (const [key, value] of Object.entries(properties)) {
        await analytics().setUserProperty(key, String(value));
      }
      console.log('📊 User properties set:', properties);
    } catch (error) {
      console.error('📊 User properties failed:', error);
    }
  }

  // Set single user property
  static async setUserProperty(key: string, value: string | number | boolean) {
    try {
      await analytics().setUserProperty(key, String(value));
      console.log(`📊 User property set: ${key} = ${value}`);
    } catch (error) {
      console.error('📊 User property failed:', error);
    }
  }

  // Custom event for special analytics
  static async logCustomEvent(eventName: string, parameters: { [key: string]: any }) {
    try {
      await analytics().logEvent(eventName, parameters);
      console.log(`📊 Custom event: ${eventName}`, parameters);
    } catch (error) {
      console.error('📊 Custom event tracking failed:', error);
    }
  }
}