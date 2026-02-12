import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Theme, UserPreferences, Job, JobCategory, SavedJob } from '../types';
import { jobCategories } from '../data/categories';
import { sampleJobs } from '../data/jobs';
import { NotificationService } from '../services/notificationService';
import { FCMNotificationService } from '../services/fcmNotificationService';
import { FirebaseService } from '../services/firebaseService';
import { logger } from '../components/DebugConsole';

const defaultUserPreferences: UserPreferences = {
  hasCompletedOnboarding: false,
  theme: 'light',
  preferredLanguage: 'en',
  notifications: {
    newJobs: true,
    applicationReminders: true,
    examAlerts: true,
  },
  notificationCategories: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User preferences and onboarding
      userPreferences: defaultUserPreferences,
      updateUserPreferences: (preferences) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...preferences },
        })),
      setOnboardingComplete: async () => {
        set((state) => ({
          userPreferences: { ...state.userPreferences, hasCompletedOnboarding: true },
        }));
        // Note: Notification permission will be requested by OnboardingPreferences
      },
      resetOnboarding: () =>
        set((state) => ({
          userPreferences: {
            ...defaultUserPreferences,
            theme: state.userPreferences.theme, // Keep theme preference
          },
        })),

      // Theme
      theme: 'light',
      setTheme: (theme) =>
        set((state) => ({
          theme,
          userPreferences: { ...state.userPreferences, theme },
        })),

      // Jobs
      jobs: sampleJobs, // Fallback data
      savedJobs: [],
      isLoadingJobs: false,
      setJobs: (jobs) => set({ jobs }),
      fetchJobs: async () => {
        set({ isLoadingJobs: true });
        try {
          console.log('Fetching jobs from Firebase...');
          const firebaseJobs = await FirebaseService.fetchJobs();
          console.log('Firebase jobs fetched:', firebaseJobs.length);

          // Only show Firebase jobs, no sample data
          set({ jobs: firebaseJobs, isLoadingJobs: false });
          console.log('Jobs set in store:', firebaseJobs.length);
        } catch (error) {
          console.error('Error fetching jobs from Firebase:', error);
          // Show empty list on error, no fallback to sample data
          set({ jobs: [], isLoadingJobs: false });
        }
      },
      addNewJob: async (job) => {
        // Add to Firebase first
        const jobId = await FirebaseService.addJob(job);
        if (jobId) {
          // Add to local state with the Firebase ID
          const jobWithId = { ...job, id: jobId, createdAt: new Date().toISOString() };
          set((state) => ({
            jobs: [jobWithId, ...state.jobs],
          }));

          // Send notifications for users subscribed to this category
          const { userPreferences } = get();
          if (
            userPreferences.notifications.newJobs &&
            userPreferences.notificationCategories?.includes(job.category)
          ) {
            const category = jobCategories.find(cat => cat.id === job.category);
            if (category) {
              await NotificationService.scheduleJobNotification(
                category.name,
                job.title,
                job.organization,
                1 // 1 second delay
              );
            }
          }
        }
      },
      findJobById: (jobId) => {
        const state = get();
        return state.jobs.find(job => job.id === jobId) || null;
      },
      addToSaved: (jobId) =>
        set((state) => ({
          savedJobs: [
            ...state.savedJobs.filter(saved => saved.jobId !== jobId),
            { jobId, savedAt: new Date().toISOString() }
          ],
        })),
      removeFromSaved: (jobId) =>
        set((state) => ({
          savedJobs: state.savedJobs.filter(saved => saved.jobId !== jobId),
        })),

      // Categories
      categories: jobCategories,
      setCategories: (categories) => set({ categories }),

      // App state
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),

      // Search and filters
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      selectedCategory: null,
      setSelectedCategory: (category) => set({ selectedCategory: category }),

      // Push notifications
      pushToken: null,
      setPushToken: (token) => set({ pushToken: token }),
      addNotificationCategory: async (categoryId) => {
        logger.log(`📋 Adding notification category: ${categoryId}`, 'info');

        // Update UI immediately (optimistic update)
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            notificationCategories: [
              ...state.userPreferences.notificationCategories!.filter(id => id !== categoryId),
              categoryId
            ],
          },
        }));

        logger.log(`📋 UI updated immediately, subscribing in background`, 'info');

        // Subscribe to FCM topic in background
        try {
          const success = await FCMNotificationService.subscribeToTopic(categoryId);

          if (success) {
            logger.log(`📋 Background subscription successful for ${categoryId}`, 'success');
          } else {
            logger.log(`📋 Background subscription failed for ${categoryId}, reverting UI`, 'error');
            // Revert the UI change if subscription failed
            set((state) => ({
              userPreferences: {
                ...state.userPreferences,
                notificationCategories: state.userPreferences.notificationCategories!.filter(id => id !== categoryId),
              },
            }));
          }
        } catch (error) {
          logger.log(`📋 Background subscription error for ${categoryId}: ${error}`, 'error');
          // Revert the UI change if subscription failed
          set((state) => ({
            userPreferences: {
              ...state.userPreferences,
              notificationCategories: state.userPreferences.notificationCategories!.filter(id => id !== categoryId),
            },
          }));
        }
      },

      addMultipleNotificationCategories: async (categoryIds: string[]) => {
        logger.log(`📋 Adding multiple notification categories: ${categoryIds.join(', ')}`, 'info');

        // Subscribe to all categories
        const subscriptionPromises = categoryIds.map(categoryId =>
          FCMNotificationService.subscribeToTopic(categoryId)
        );
        const results = await Promise.all(subscriptionPromises);

        // Update store with successfully subscribed categories
        const successfulCategories = categoryIds.filter((_, index) => results[index]);

        if (successfulCategories.length > 0) {
          set((state) => ({
            userPreferences: {
              ...state.userPreferences,
              notificationCategories: [
                ...state.userPreferences.notificationCategories!.filter(id => !categoryIds.includes(id)),
                ...successfulCategories
              ],
            },
          }));

          // Send ONE consolidated test notification for all selected categories
          const selectedCategoryNames = successfulCategories.map(id => {
            const category = jobCategories.find(cat => cat.id === id);
            return category?.name || id;
          }).join(', ');

          logger.log(`📋 Sending consolidated test notification for: ${selectedCategoryNames}`, 'info');
          await FCMNotificationService.scheduleTestNotification(
            `You'll get notifications for: ${selectedCategoryNames}`
          );
        } else {
          logger.log(`📋 All subscriptions failed`, 'error');
        }
      },
      removeNotificationCategory: (categoryId) => {
        // Update UI immediately
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            notificationCategories: state.userPreferences.notificationCategories!.filter(
              id => id !== categoryId
            ),
          },
        }));

        // Unsubscribe from FCM topic in background (no await = non-blocking)
        FCMNotificationService.unsubscribeFromTopic(categoryId).catch(error => {
          console.error(`Failed to unsubscribe from ${categoryId}:`, error);
        });
      },
      initializeNotifications: async () => {
        try {
          logger.log('🏁 Starting notification initialization', 'info');

          await FCMNotificationService.setupAndroidNotificationChannel();
          const token = await FCMNotificationService.initialize();

          if (token) {
            logger.log('🏁 Notification init success, setting token in store', 'success');
            set({ pushToken: token });
          } else {
            logger.log('🏁 Notification init failed - no token', 'error');
          }
        } catch (error) {
          logger.log(`🏁 Notification init error: ${error}`, 'error');
        }
      },
    }),
    {
      name: 'govt-job-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userPreferences: state.userPreferences,
        savedJobs: state.savedJobs,
        theme: state.theme,
      }),
    }
  )
);