import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { colors, typography, spacing, shadows } from '../../utils/theme';
import { useAppStore } from '../../store';
import { JobCategory } from '../../types';
import { RootStackParamList } from '../../../App';
import { BannerAd } from '../../components/BannerAd';
import { AdsService } from '../../services/adsService';
import { InterstitialService } from '../../services/interstitialService';
import { AnalyticsService } from '../../services/analyticsService';

const { width } = Dimensions.get('window');
const cardWidth = (width - (spacing.lg * 3)) / 2;

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const { categories, theme, userPreferences, fetchJobs, jobs } = useAppStore();
  const themeColors = colors[theme];
  const navigation = useNavigation<HomeScreenNavigationProp>();
  // Debug logs removed - using console.log only

  useEffect(() => {
    // Track screen view
    AnalyticsService.logScreenView('Home', 'HomeScreen');

    // Fetch jobs from Firebase when HomeScreen loads
    fetchJobs();

    // Initial ads status
    const adsStatus = AdsService.getStatus();
    console.log(`Ads init: ${adsStatus.status}`);
  }, []);

  // Calculate job counts per category from live data
  const categoriesWithCounts = React.useMemo(() => {
    return categories.map(category => {
      const jobCount = jobs.filter(job => job.category === category.id).length;
      return { ...category, totalJobs: jobCount };
    });
  }, [categories, jobs]);

  // Show user's interested categories first, then others
  const sortedCategories = React.useMemo(() => {
    if (!userPreferences.interestedCategories?.length) {
      return categoriesWithCounts;
    }

    const interested = categoriesWithCounts.filter(cat =>
      userPreferences.interestedCategories!.includes(cat.id)
    );
    const others = categoriesWithCounts.filter(cat =>
      !userPreferences.interestedCategories!.includes(cat.id)
    );

    return [...interested, ...others];
  }, [categoriesWithCounts, userPreferences.interestedCategories]);

  const handleCategoryPress = async (category: JobCategory) => {
    console.log(`🎯 Category pressed: ${category.name}`);

    // Track category selection
    AnalyticsService.logCategorySelected(category);

    // Show interstitial ad before navigation
    const adShown = await InterstitialService.showAd();
    if (adShown) {
      console.log('🎬 Interstitial ad shown, delaying navigation');
      // Navigate after a short delay to let ad play
      setTimeout(() => {
        navigation.navigate('CategoryJobs', { category });
      }, 500);
    } else {
      console.log('🚫 No interstitial ad, navigating immediately');
      navigation.navigate('CategoryJobs', { category });
    }
  };

  const renderCategoryCard = ({ item: category }: { item: JobCategory }) => (
    <TouchableOpacity
      style={[styles.categoryCardContainer, { width: cardWidth }]}
      onPress={() => handleCategoryPress(category)}
      activeOpacity={0.95}
    >
      <Card
        theme={theme}
        style={[
          styles.categoryCard,
          {
            borderColor: category.color + '20',
            backgroundColor: themeColors.cardBackground,
          }
        ]}
        elevation="md"
      >
        <View style={[styles.iconContainer, { backgroundColor: category.color + '15' }]}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
        </View>

        <Text style={[styles.categoryName, { color: themeColors.text }]}>
          {category.name}
        </Text>

        <Text style={[styles.categoryJobCount, { color: themeColors.textSecondary }]}>
          {category.totalJobs} jobs
        </Text>

        <View style={[styles.categoryIndicator, { backgroundColor: category.color }]} />
      </Card>
    </TouchableOpacity>
  );

  const renderAdBanner = () => {
    return <BannerAd placement="home" onLog={(msg) => console.log(msg)} />;
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
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: themeColors.text }]}>
                Good {getTimeOfDay()},{' '}
                {userPreferences.name || 'Job Seeker'}
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                Find your dream job
              </Text>

              {/* Debug console removed - logs now go to terminal only */}
            </View>

            <View style={styles.headerButtons}>
              {/* Notification Settings Button */}
              <TouchableOpacity
                style={[styles.notificationButton, { backgroundColor: themeColors.primary }]}
                onPress={() => navigation.navigate('NotificationSettings')}
              >
                <Text style={styles.notificationButtonIcon}>🔔</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ad Banner */}
          {renderAdBanner()}

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: themeColors.cardBackground }]}>
              <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                {jobs.length}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                Active Jobs
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: themeColors.cardBackground }]}>
              <Text style={[styles.statNumber, { color: themeColors.secondary }]}>
                {categories.length}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                Categories
              </Text>
            </View>
          </View>

          {/* Categories Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Job Categories
            </Text>

            <FlatList
              data={sortedCategories}
              renderItem={renderCategoryCard}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.categoryRow}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body2,
  },
  adBanner: {
    height: 80,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  adText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    ...shadows.sm,
  },
  statNumber: {
    ...typography.h2,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.lg,
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  categoryCardContainer: {
    marginBottom: spacing.md,
  },
  categoryCard: {
    padding: spacing.lg,
    alignItems: 'center',
    position: 'relative',
    minHeight: 140,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    ...typography.body1,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  categoryJobCount: {
    ...typography.caption,
    textAlign: 'center',
  },
  categoryIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  notificationButtonIcon: {
    fontSize: 18,
  },
});