import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox, Linking } from 'react-native';
import { OnboardingFlow } from './src/navigation/OnboardingFlow';
import { MainAppTabs } from './src/navigation/MainAppTabs';
import { CategoryJobsScreen } from './src/screens/main/CategoryJobsScreen';
import { JobDetailScreen } from './src/screens/main/JobDetailScreen';
import { NotificationSettingsScreen } from './src/screens/main/NotificationSettingsScreen';
import { useAppStore } from './src/store';
import { Job, JobCategory } from './src/types';
import { NavigationService, navigationRef } from './src/services/navigationService';
import { AdsService } from './src/services/adsService';
import { AnalyticsService } from './src/services/analyticsService';
import { FacebookTrackingService } from './src/services/facebookTrackingService';
import { UTMTrackingService } from './src/services/utmTrackingService';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  CategoryJobs: { category: JobCategory };
  JobDetail: { job: Job };
  NotificationSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Hide deprecation warnings in development
if (__DEV__) {
  LogBox.ignoreLogs([
    'This method is deprecated', // Firebase deprecation warnings
    'shouldShowAlert is deprecated', // Expo notifications warning
    'expo-notifications', // All expo-notifications warnings
    'React Native Firebase', // All Firebase warnings
    'namespaced API', // Firebase API warnings
  ]);
}

export default function App() {
  const { userPreferences, initializeNotifications } = useAppStore();

  useEffect(() => {
    // Initialize app services when app starts
    const initializeApp = async () => {
      try {
        // Initialize analytics first
        await AnalyticsService.initialize();

        // Initialize Facebook tracking for Meta ads
        await FacebookTrackingService.initialize();

        // Initialize UTM tracking service
        await UTMTrackingService.initialize();

        // Handle initial app link for UTM tracking
        await UTMTrackingService.handleInitialLink();

        // Initialize notifications (will be gracefully handled)
        initializeNotifications();

        // Initialize ads service
        AdsService.initialize();

        // Setup deep link handling
        setupDeepLinkHandling();

      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  // Setup deep link handling
  const setupDeepLinkHandling = () => {
    // Handle deep link when app is opened from a link
    const handleDeepLink = (event: { url: string }) => {
      NavigationService.handleDeepLink(event.url);
    };

    // Listen for incoming links when app is already open
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Handle initial deep link when app is opened from a cold start
    Linking.getInitialURL().then((url) => {
      if (url) {
        NavigationService.handleDeepLink(url);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      linkingSubscription?.remove();
    };
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_right',
          }}
        >
          {!userPreferences.hasCompletedOnboarding ? (
            <Stack.Screen name="Onboarding" component={OnboardingFlow} />
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainAppTabs} />
              <Stack.Screen
                name="CategoryJobs"
                component={CategoryJobsScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="JobDetail"
                component={JobDetailScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="NotificationSettings"
                component={NotificationSettingsScreen}
                options={{ animation: 'slide_from_right' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
