import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { colors, typography, spacing, shadows } from '../../utils/theme';
import { useAppStore } from '../../store';
import { Job } from '../../types';
import { RootStackParamList } from '../../../App';
import { BannerAd } from '../../components/BannerAd';
import { InterstitialService } from '../../services/interstitialService';
import { AnalyticsService } from '../../services/analyticsService';

type LatestJobsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const LatestJobsScreen: React.FC = () => {
  const { jobs, theme, savedJobs, addToSaved, removeFromSaved, fetchJobs, isLoadingJobs } = useAppStore();
  const themeColors = colors[theme];
  const navigation = useNavigation<LatestJobsScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Track screen view
    AnalyticsService.logScreenView('LatestJobs', 'LatestJobsScreen');

    // Fetch jobs from Firebase when LatestJobsScreen loads
    fetchJobs();
  }, []);

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) {
      return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return jobs
      .filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [jobs, searchQuery]);

  const handleJobPress = async (job: Job) => {
    console.log(`🎯 Job pressed: ${job.title}`);

    // Track job view
    AnalyticsService.logJobViewed(job);

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

  const handleSaveToggle = (jobId: string) => {
    const isSaved = savedJobs.some(saved => saved.jobId === jobId);
    const job = jobs.find(j => j.id === jobId);

    if (isSaved) {
      removeFromSaved(jobId);
      if (job) AnalyticsService.logJobUnsaved(jobId, job.title);
    } else {
      addToSaved(jobId);
      if (job) AnalyticsService.logJobSaved(job);
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

        <Text style={[styles.jobDescription, { color: themeColors.textSecondary }]} numberOfLines={2}>
          {job.description}
        </Text>

        <View style={styles.jobDetails}>
          <View style={styles.jobDetailItem}>
            <Text style={[styles.jobDetailLabel, { color: themeColors.textSecondary }]}>
              Vacancies
            </Text>
            <Text style={[styles.jobDetailValue, { color: themeColors.text }]}>
              {job.totalVacancies}
            </Text>
          </View>

          <View style={styles.jobDetailItem}>
            <Text style={[styles.jobDetailLabel, { color: themeColors.textSecondary }]}>
              Last Date
            </Text>
            <Text style={[
              styles.jobDetailValue,
              {
                color: deadlineSoon ? themeColors.error : themeColors.text
              }
            ]}>
              {formatDate(job.applicationEndDate)}
            </Text>
          </View>

          <View style={styles.jobDetailItem}>
            <Text style={[styles.jobDetailLabel, { color: themeColors.textSecondary }]}>
              Location
            </Text>
            <Text style={[styles.jobDetailValue, { color: themeColors.text }]} numberOfLines={1}>
              {job.location}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderAdBanner = () => {
    return <BannerAd placement="latest" onLog={(msg) => console.log(msg)} />;
  };

  return (
    <LinearGradient
      colors={themeColors.gradient}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Latest Jobs
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {filteredJobs.length} jobs available
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.cardBackground }]}>
            <Text style={[styles.searchIcon, { color: themeColors.textSecondary }]}>
              🔍
            </Text>
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search jobs, organizations..."
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
          data={filteredJobs}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
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
  jobBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
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
    marginBottom: spacing.xs,
    lineHeight: 24,
  },
  jobOrganization: {
    ...typography.body2,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  jobDescription: {
    ...typography.body2,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  jobDetailLabel: {
    ...typography.caption,
    fontSize: 10,
    marginBottom: 2,
  },
  jobDetailValue: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
});