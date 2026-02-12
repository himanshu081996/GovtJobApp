import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { colors, typography, spacing, shadows } from '../../utils/theme';
import { useAppStore } from '../../store';
import { Job } from '../../types';
import { RootStackParamList } from '../../../App';
import { InterstitialService } from '../../services/interstitialService';
import { BannerAd } from '../../components/BannerAd';
import { AnalyticsService } from '../../services/analyticsService';

type CategoryJobsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CategoryJobs'>;
type CategoryJobsScreenRouteProp = RouteProp<RootStackParamList, 'CategoryJobs'>;

export const CategoryJobsScreen: React.FC = () => {
  const navigation = useNavigation<CategoryJobsScreenNavigationProp>();
  const route = useRoute<CategoryJobsScreenRouteProp>();
  const { category } = route.params;

  const { jobs, theme, savedJobs, addToSaved, removeFromSaved, fetchJobs, isLoadingJobs } = useAppStore();
  const themeColors = colors[theme];
  const [searchQuery, setSearchQuery] = useState('');

  const handleJobPress = async (job: Job) => {
    console.log(`🎯 Job pressed: ${job.title}`);

    // Show interstitial ad before navigation
    const adShown = await InterstitialService.showAd();
    if (adShown) {
      console.log('🎬 Interstitial ad shown, delaying navigation');
      // Navigate after a short delay to let ad play
      setTimeout(() => {
        navigation.navigate('JobDetail', { job });
      }, 500);
    } else {
      console.log('🚫 No interstitial ad, navigating immediately');
      navigation.navigate('JobDetail', { job });
    }
  };

  useEffect(() => {
    // Fetch jobs from Firebase when CategoryJobsScreen loads
    fetchJobs();
  }, []);

  const categoryJobs = useMemo(() => {
    console.log('CategoryJobs: Filtering for category:', category.id);
    console.log('CategoryJobs: Available jobs:', jobs.map(job => `${job.title} (category: ${job.category})`));

    const filtered = jobs.filter(job => job.category === category.id);
    console.log('CategoryJobs: Filtered jobs:', filtered.length);

    if (!searchQuery.trim()) {
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered
      .filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [jobs, category.id, searchQuery]);

  const handleSaveToggle = (jobId: string) => {
    const isSaved = savedJobs.some(saved => saved.jobId === jobId);
    if (isSaved) {
      removeFromSaved(jobId);
    } else {
      addToSaved(jobId);
    }
  };

  const handleApplyNow = async (job: Job) => {
    try {
      // Track Apply Now click
      AnalyticsService.logApplyNowClicked(job);

      if (job.applyUrl) {
        const supported = await Linking.canOpenURL(job.applyUrl);
        if (supported) {
          // Show interstitial ad before redirect
          console.log('🎯 Showing interstitial ad before job application redirect');
          const adShown = await InterstitialService.showAd();

          // Redirect after ad (whether shown or not)
          setTimeout(async () => {
            await Linking.openURL(job.applyUrl);
          }, adShown ? 1000 : 0); // 1 second delay if ad was shown
        } else {
          Alert.alert('Error', 'Cannot open this URL');
        }
      } else {
        Alert.alert('Info', 'Application URL not available');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open application link');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Announced Soon";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isDeadlineSoon = (endDate?: string) => {
    if (!endDate) return false;
    const deadline = new Date(endDate);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const renderJobCard = ({ item: job }: { item: Job }) => {
    const isSaved = savedJobs.some(saved => saved.jobId === job.id);
    const deadlineSoon = isDeadlineSoon(job.applicationEndDate);

    return (
      <Card
        theme={theme}
        style={styles.jobCard}
        elevation="md"
        onPress={() => handleJobPress(job)}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobHeaderLeft}>
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '15' }]}>
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                {category.name}
              </Text>
            </View>
            <View style={styles.jobBadges}>
              {job.isNew && (
                <View style={[styles.badge, styles.newBadge]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
              {deadlineSoon && (
                <View style={[styles.badge, styles.urgentBadge]}>
                  <Text style={styles.urgentBadgeText}>URGENT</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleSaveToggle(job.id)}
            style={styles.saveButton}
          >
            <Text style={[styles.saveIcon, { color: isSaved ? themeColors.error : themeColors.textSecondary }]}>
              {isSaved ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.jobTitle, { color: themeColors.text }]} numberOfLines={2}>
          {job.title}
        </Text>

        <Text style={[styles.jobOrganization, { color: themeColors.primary }]} numberOfLines={1}>
          {job.organization}
        </Text>

        <Text style={[styles.jobDescription, { color: themeColors.textSecondary }]} numberOfLines={3}>
          {job.description}
        </Text>

        <View style={styles.jobMetrics}>
          <View style={styles.jobMetricRow}>
            <View style={styles.jobMetricItem}>
              <Text style={[styles.jobMetricLabel, { color: themeColors.textSecondary }]}>
                Total Vacancies
              </Text>
              <Text style={[styles.jobMetricValue, { color: themeColors.text }]}>
                {job.totalVacancies}
              </Text>
            </View>

            <View style={styles.jobMetricItem}>
              <Text style={[styles.jobMetricLabel, { color: themeColors.textSecondary }]}>
                Age Limit
              </Text>
              <Text style={[styles.jobMetricValue, { color: themeColors.text }]}>
                {job.ageLimit}
              </Text>
            </View>
          </View>

          <View style={styles.jobMetricRow}>
            <View style={styles.jobMetricItem}>
              <Text style={[styles.jobMetricLabel, { color: themeColors.textSecondary }]}>
                Application Fee
              </Text>
              <Text style={[styles.jobMetricValue, { color: themeColors.text }]}>
                ₹{job.applicationFee}
              </Text>
            </View>

            <View style={styles.jobMetricItem}>
              <Text style={[styles.jobMetricLabel, { color: themeColors.textSecondary }]}>
                Last Date
              </Text>
              <Text style={[
                styles.jobMetricValue,
                {
                  color: deadlineSoon ? themeColors.error : themeColors.text
                }
              ]}>
                {formatDate(job.applicationEndDate)}
              </Text>
            </View>
          </View>

          <View style={styles.jobLocationRow}>
            <Text style={[styles.jobMetricLabel, { color: themeColors.textSecondary }]}>
              Location:
            </Text>
            <Text style={[styles.jobLocationValue, { color: themeColors.text }]} numberOfLines={1}>
              {job.location}
            </Text>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <View style={styles.jobDateInfo}>
            <Text style={[styles.jobPostedDate, { color: themeColors.textSecondary }]}>
              Posted: {formatDate(job.createdAt)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: category.color }]}
            onPress={() => handleApplyNow(job)}
          >
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderAdBanner = () => {
    return <BannerAd placement="category" onLog={(msg) => console.log(msg)} />;
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={[styles.backIcon, { color: themeColors.text }]}>←</Text>
      </TouchableOpacity>

      <View style={styles.headerContent}>
        <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '15' }]}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.categoryTitle, { color: themeColors.text }]}>
            {category.name} Jobs
          </Text>
          <Text style={[styles.categorySubtitle, { color: themeColors.textSecondary }]}>
            {categoryJobs.length} positions available
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={themeColors.gradient}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.cardBackground }]}>
            <Text style={[styles.searchIcon, { color: themeColors.textSecondary }]}>
              🔍
            </Text>
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search jobs in this category..."
              placeholderTextColor={themeColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={[styles.clearIcon, { color: themeColors.textSecondary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={categoryJobs}
          renderItem={renderJobCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListHeaderComponent={renderAdBanner}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingJobs}
              onRefresh={fetchJobs}
              colors={[themeColors.primary]}
              tintColor={themeColors.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No jobs found in {category.name} category
              </Text>
            </View>
          )}
        />
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
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  categoryIcon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  categoryTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  categorySubtitle: {
    ...typography.body2,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    ...shadows.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body1,
  },
  clearIcon: {
    fontSize: 16,
    paddingHorizontal: spacing.sm,
  },
  adBanner: {
    height: 60,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  adText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  jobCard: {
    padding: spacing.lg,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  jobHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  jobBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadge: {
    backgroundColor: '#4CAF50',
  },
  urgentBadge: {
    backgroundColor: '#FF5722',
  },
  newBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  urgentBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  saveButton: {
    padding: spacing.xs,
  },
  saveIcon: {
    fontSize: 20,
  },
  jobTitle: {
    ...typography.h4,
    marginBottom: spacing.sm,
    lineHeight: 26,
  },
  jobOrganization: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  jobDescription: {
    ...typography.body2,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  jobMetrics: {
    marginBottom: spacing.lg,
  },
  jobMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  jobMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  jobMetricLabel: {
    ...typography.caption,
    fontSize: 11,
    marginBottom: 2,
    textAlign: 'center',
  },
  jobMetricValue: {
    ...typography.body2,
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  jobLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  jobLocationValue: {
    ...typography.body2,
    fontWeight: '600',
    marginLeft: spacing.xs,
    flex: 1,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  jobDateInfo: {
    flex: 1,
  },
  jobPostedDate: {
    ...typography.caption,
    fontSize: 11,
  },
  applyButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    ...typography.body2,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.body1,
    textAlign: 'center',
  },
});