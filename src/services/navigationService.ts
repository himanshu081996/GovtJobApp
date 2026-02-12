import { NavigationContainerRef } from '@react-navigation/native';
import { createRef } from 'react';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UTMTrackingService } from './utmTrackingService';

// Navigation reference
export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();

export class NavigationService {
  // Navigate to any screen with onboarding check
  static navigate(name: keyof RootStackParamList, params?: any) {
    console.log(`🎯 NavigationService.navigate called: ${name}`, params || '(no params)');

    if (navigationRef.current?.isReady()) {
      // Check if trying to navigate to MainTabs but onboarding not completed
      const store = useAppStore.getState();
      if (name === 'MainTabs' && !store.userPreferences.hasCompletedOnboarding) {
        console.log(`🎯 Cannot navigate to MainTabs - onboarding not completed, navigating to Onboarding`);
        navigationRef.current.navigate('Onboarding');
        return;
      }

      console.log(`🎯 Navigation is ready, navigating to: ${name}`);
      navigationRef.current.navigate(name, params);
      console.log(`🎯 Navigation command sent successfully to: ${name}`);
    } else {
      console.warn(`🎯 Navigation is not ready yet for: ${name}`);
    }
  }

  // Navigate to job detail from notification
  static async navigateToJobFromNotification(jobId: string, category: string) {
    console.log(`🎯 Navigation requested for job: ${jobId} in category: ${category}`);

    try {
      // Get the current store state
      const store = useAppStore.getState();

      // First, try to find the job locally
      let job = store.findJobById(jobId);

      if (job) {
        console.log(`🎯 Job found locally: ${job.title} - Navigating to JobDetail`);
        this.navigate('JobDetail', { job });
        return;
      }

      // If not found locally, fetch from Firebase
      console.log(`🎯 Job not found locally, fetching from Firebase...`);
      try {
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));

        if (jobDoc.exists()) {
          const jobData = { id: jobDoc.id, ...jobDoc.data() } as any;
          console.log(`🎯 Job fetched from Firebase: ${jobData.title} - Navigating to JobDetail`);

          // Navigate to the job detail with the fetched data
          this.navigate('JobDetail', { job: jobData });

          // Optionally refresh the local jobs store to include this job
          await store.fetchJobs();
        } else {
          console.log(`🎯 Job not found in Firebase either - Navigating to default screen`);
          // Navigate to default screen since the specific job doesn't exist
          this.navigateToDefault();
        }
      } catch (firebaseError) {
        console.error('🎯 Error fetching job from Firebase:', firebaseError);
        console.log(`🎯 Fallback - Navigating to default screen`);
        this.navigateToDefault();
      }
    } catch (error) {
      console.error('🎯 Error navigating to job:', error);
      // Fallback to default screen on any error
      this.navigateToDefault();
    }
  }

  // Navigate to category jobs
  static navigateToCategoryJobs(categoryName: string) {
    // This would require mapping category ID to category object
    this.navigateToDefault();
  }

  // Check if navigator is ready
  static isReady(): boolean {
    return navigationRef.current?.isReady() ?? false;
  }

  // Handle deep link with UTM tracking
  static async handleDeepLink(url: string): Promise<void> {
    try {
      console.log(`🔗 Deep link received: ${url}`);

      // Parse UTM parameters from the deep link
      const utmParams = await UTMTrackingService.parseDeepLinkUTM(url);

      // Handle the deep link navigation based on URL pattern
      const urlObj = new URL(url);

      // Handle different deep link patterns
      if (urlObj.pathname.includes('/job/')) {
        // Extract job ID from path
        const jobId = urlObj.pathname.split('/job/')[1];
        const category = urlObj.searchParams.get('category') || 'unknown';

        if (jobId) {
          await this.navigateToJobFromNotification(jobId, category);
        } else {
          this.navigateToDefault();
        }
      } else if (urlObj.pathname.includes('/category/')) {
        // Extract category name from path
        const categoryName = urlObj.pathname.split('/category/')[1];
        this.navigateToCategoryJobs(categoryName);
      } else {
        // Default navigation based on onboarding status
        this.navigateToDefault();
      }

      console.log(`✅ Deep link handled successfully: ${url}`);

    } catch (error) {
      console.error('❌ Error handling deep link:', error);
      // Fallback to default navigation on error
      this.navigateToDefault();
    }
  }

  // Navigate to default screen based on app state
  static navigateToDefault() {
    const store = useAppStore.getState();
    if (store.userPreferences.hasCompletedOnboarding) {
      this.navigate('MainTabs');
    } else {
      this.navigate('Onboarding');
    }
  }
}