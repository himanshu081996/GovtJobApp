import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../../utils/theme';
import { useAppStore } from '../../store';
import { NotificationService } from '../../services/notificationService';
import { logger } from '../../components/DebugConsole';

interface OnboardingPreferencesProps {
  onComplete: () => void;
}

export const OnboardingPreferences: React.FC<OnboardingPreferencesProps> = ({ onComplete }) => {
  const { theme, updateUserPreferences, addMultipleNotificationCategories, jobs, categories, initializeNotifications } = useAppStore();
  const themeColors = colors[theme];

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Calculate job counts for categories from live data
  const getJobCountForCategory = (categoryId: string) => {
    return jobs.filter(job => job.category === categoryId).length;
  };

  const handleComplete = () => {
    logger.log('🎯 Onboarding: Starting to process selected categories', 'info');
    logger.log(`🎯 Selected categories: ${selectedCategories.join(', ')}`, 'info');

    // Update preferences and complete onboarding immediately
    updateUserPreferences({
      interestedCategories: selectedCategories,
      notificationCategories: selectedCategories, // Save selected categories
    });

    // Complete onboarding first for fast UI
    onComplete();

    // Request notification permission and initialize FCM in background
    setTimeout(async () => {
      try {
        // First request actual Android permission using Expo
        logger.log('🎯 Background: Requesting Android notification permission', 'info');
        const hasPermission = await NotificationService.requestPermissions();

        if (hasPermission) {
          logger.log('🎯 Background: Permission granted, initializing FCM', 'success');
          await initializeNotifications();

          // Subscribe to ALL categories regardless of selection (user can disable later)
          logger.log('🎯 Background: Starting FCM subscriptions for ALL categories', 'info');
          const allCategoryIds = categories.map(category => category.id);
          await addMultipleNotificationCategories(allCategoryIds);
          logger.log('🎯 Background: All subscriptions complete', 'success');
        } else {
          logger.log('🎯 Background: Permission denied', 'warning');
        }
      } catch (error) {
        logger.log(`🎯 Background: Failed to setup notifications: ${error}`, 'error');
      }
    }, 1000); // 1 second delay
  };

  return (
    <LinearGradient
      colors={themeColors.gradient}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              What interests you?
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Select job categories you're interested in to get personalized recommendations and job alerts
            </Text>

            <View style={[styles.notificationInfo, { backgroundColor: themeColors.primary + '15' }]}>
              <Text style={styles.notificationIcon}>🔔</Text>
              <Text style={[styles.notificationText, { color: themeColors.primary }]}>
                You'll automatically receive notifications for new jobs in your selected categories
              </Text>
            </View>
          </View>

          <View style={styles.categoriesContainer}>
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              const actualJobCount = getJobCountForCategory(category.id);

              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: isSelected ? themeColors.primary : themeColors.cardBackground,
                      borderColor: isSelected ? themeColors.primary : themeColors.border,
                    }
                  ]}
                  onPress={() => handleCategoryToggle(category.id)}
                >
                  <Text style={[
                    styles.categoryIcon,
                    { opacity: isSelected ? 1 : 0.7 }
                  ]}>
                    {category.icon}
                  </Text>
                  <Text style={[
                    styles.categoryName,
                    {
                      color: isSelected ? '#FFFFFF' : themeColors.text,
                    }
                  ]}>
                    {category.name}
                  </Text>
                  <Text style={[
                    styles.categoryJobCount,
                    {
                      color: isSelected ? 'rgba(255,255,255,0.8)' : themeColors.textSecondary,
                    }
                  ]}>
                    {actualJobCount} jobs
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.completeButton,
                {
                  backgroundColor: selectedCategories.length > 0 ? themeColors.primary : themeColors.textTertiary,
                }
              ]}
              onPress={handleComplete}
              disabled={selectedCategories.length === 0}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Continue ({selectedCategories.length} selected)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleComplete}
            >
              <Text style={[styles.skipText, { color: themeColors.textSecondary }]}>
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body1,
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  notificationText: {
    ...typography.body2,
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
  },
  categoriesContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  categoryCard: {
    width: '48%',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  categoryName: {
    ...typography.body1,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  categoryJobCount: {
    ...typography.caption,
    fontSize: 12,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  completeButton: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  buttonText: {
    ...typography.button,
    fontSize: 16,
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.body2,
    textDecorationLine: 'underline',
  },
});