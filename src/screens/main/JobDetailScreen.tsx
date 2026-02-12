import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { RootStackParamList } from '../../../App';
import { BannerAd } from '../../components/BannerAd';
import { AnalyticsService } from '../../services/analyticsService';
import { InterstitialService } from '../../services/interstitialService';
import { FacebookTrackingService } from '../../services/facebookTrackingService';

type JobDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'JobDetail'>;
type JobDetailScreenRouteProp = RouteProp<RootStackParamList, 'JobDetail'>;

export const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation<JobDetailScreenNavigationProp>();
  const route = useRoute<JobDetailScreenRouteProp>();
  const { job } = route.params;

  const { theme, savedJobs, addToSaved, removeFromSaved, categories } = useAppStore();
  const themeColors = colors[theme];

  const isSaved = savedJobs.some(saved => saved.jobId === job.id);
  const category = categories.find(cat => cat.id === job.category);

  useEffect(() => {
    // Track screen view
    AnalyticsService.logScreenView('JobDetail', 'JobDetailScreen');
    // Track that this specific job was viewed
    AnalyticsService.logJobViewed(job);
    // Track job view for Meta ads attribution
    FacebookTrackingService.trackJobViewed(job.id, job.title, job.category);
  }, [job.id]);

  const handleSaveToggle = () => {
    if (isSaved) {
      removeFromSaved(job.id);
      AnalyticsService.logJobUnsaved(job.id, job.title);
    } else {
      addToSaved(job.id);
      AnalyticsService.logJobSaved(job);
    }
  };

  const handleApplyNow = async () => {
    try {
      // Track Apply Now click - THIS IS THE KEY METRIC!
      AnalyticsService.logApplyNowClicked(job);
      // Track job application for Meta ads attribution
      FacebookTrackingService.trackJobApplication(job.id, job.title, job.category);

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
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Failed to open application URL');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Announced Soon";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
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

  const deadlineSoon = isDeadlineSoon(job.applicationEndDate);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={[styles.backIcon, { color: themeColors.text }]}>←</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSaveToggle} style={styles.saveButton}>
        <Text style={[styles.saveIcon, { color: isSaved ? themeColors.error : themeColors.textSecondary }]}>
          {isSaved ? '❤️' : '🤍'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderJobTitleCard = () => (
    <Card theme={theme} style={styles.titleCard} elevation="md">
      <View style={styles.titleHeader}>
        {category && (
          <View style={[styles.categoryBadge, { backgroundColor: category.color + '15' }]}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[styles.categoryText, { color: category.color }]}>
              {category.name}
            </Text>
          </View>
        )}

        <View style={styles.statusBadges}>
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

      <Text style={[styles.jobTitle, { color: themeColors.text }]}>
        {job.title}
      </Text>

      <Text style={[styles.organization, { color: themeColors.primary }]}>
        {job.organization}
      </Text>

      <Text style={[styles.location, { color: themeColors.textSecondary }]}>
        📍 {job.location}
      </Text>

      {job.totalVacancies > 0 && (
        <View style={styles.keyStats}>
          <View style={[styles.statCard, { backgroundColor: themeColors.cardBackground }]}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>👥</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {job.totalVacancies}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                Vacancies
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.feeSection}>
        <View style={[styles.feeCard, { backgroundColor: themeColors.cardBackground }]}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>💰</Text>
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: themeColors.text }]}>
              {job.applicationFee}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
              Application Fee
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );

  const renderInfoSection = (title: string, content: string | React.ReactNode, icon?: string) => (
    <Card theme={theme} style={styles.sectionCard} elevation="sm">
      <View style={styles.sectionHeader}>
        {icon && <Text style={styles.sectionIcon}>{icon}</Text>}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          {title}
        </Text>
      </View>
      {typeof content === 'string' ? (
        <Text style={[styles.sectionContent, { color: themeColors.textSecondary }]}>
          {content}
        </Text>
      ) : (
        content
      )}
    </Card>
  );

  const renderEligibilityContent = () => (
    <View>
      <View style={styles.eligibilityRow}>
        <Text style={[styles.eligibilityLabel, { color: themeColors.textSecondary }]}>
          Age Limit:
        </Text>
        <Text style={[styles.eligibilityValue, { color: themeColors.text }]}>
          {job.ageLimit}
        </Text>
      </View>

      <View style={styles.eligibilityRow}>
        <Text style={[styles.eligibilityLabel, { color: themeColors.textSecondary }]}>
          Education:
        </Text>
        <Text style={[styles.eligibilityValue, { color: themeColors.text }]}>
          {job.qualification}
        </Text>
      </View>

      {job.eligibilityCriteria && job.eligibilityCriteria.length > 0 && (
        <View style={styles.criteriaList}>
          <Text style={[styles.criteriaHeader, { color: themeColors.text }]}>
            Additional Criteria:
          </Text>
          {job.eligibilityCriteria.map((criteria, index) => (
            <Text key={index} style={[styles.criteriaItem, { color: themeColors.textSecondary }]}>
              • {criteria}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  const renderDatesContent = () => (
    <View style={styles.datesContainer}>
      <View style={styles.dateRow}>
        <Text style={[styles.dateLabel, { color: themeColors.textSecondary }]}>
          Notification Date:
        </Text>
        <Text style={[styles.dateValue, { color: themeColors.text }]}>
          {formatDate(job.createdAt)}
        </Text>
      </View>

      <View style={styles.dateRow}>
        <Text style={[styles.dateLabel, { color: themeColors.textSecondary }]}>
          Application Start:
        </Text>
        <Text style={[styles.dateValue, { color: themeColors.text }]}>
          {formatDate(job.applicationStartDate)}
        </Text>
      </View>

      <View style={styles.dateRow}>
        <Text style={[styles.dateLabel, { color: themeColors.textSecondary }]}>
          Last Date to Apply:
        </Text>
        <Text style={[styles.dateValue, { color: deadlineSoon ? themeColors.error : themeColors.text }]}>
          {formatDate(job.applicationEndDate)}
        </Text>
      </View>

      {deadlineSoon && (
        <View style={[styles.urgentNotice, { backgroundColor: themeColors.error + '15' }]}>
          <Text style={[styles.urgentText, { color: themeColors.error }]}>
            ⚠️ Application deadline is approaching soon!
          </Text>
        </View>
      )}
    </View>
  );

  const renderAdBanner = () => {
    return <BannerAd placement="detail" onLog={(msg) => console.log(msg)} />;
  };

  return (
    <LinearGradient colors={themeColors.gradient} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderJobTitleCard()}

          {renderInfoSection('Job Description', job.description, '📝')}

          {renderInfoSection('Eligibility Criteria', renderEligibilityContent(), '✅')}

          {renderInfoSection('Important Dates', renderDatesContent(), '📅')}

          {job.selectionProcess && (
            renderInfoSection('Selection Process', job.selectionProcess, '📋')
          )}

          {job.salary && (
            renderInfoSection('Salary', job.salary, '💰')
          )}

          {renderAdBanner()}
        </ScrollView>

        <View style={[styles.applySection, { backgroundColor: themeColors.cardBackground }]}>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: category?.color || themeColors.primary }]}
            onPress={handleApplyNow}
          >
            <Text style={styles.applyButtonText}>Apply Now</Text>
            <Text style={styles.applyButtonIcon}>🚀</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  saveButton: {
    padding: spacing.sm,
  },
  saveIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  titleCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  titleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    flex: 1,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  categoryText: {
    ...typography.body2,
    fontWeight: '600',
  },
  statusBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
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
    fontSize: 11,
    fontWeight: '600',
  },
  urgentBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  jobTitle: {
    ...typography.h2,
    lineHeight: 32,
    marginBottom: spacing.md,
  },
  organization: {
    ...typography.h4,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  location: {
    ...typography.body1,
    marginBottom: spacing.lg,
  },
  keyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  statIconContainer: {
    marginRight: spacing.sm,
  },
  statIcon: {
    fontSize: 24,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    ...typography.h4,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
  },
  feeSection: {
    paddingTop: spacing.md,
  },
  feeCard: {
    padding: spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  sectionCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    flex: 1,
  },
  sectionContent: {
    ...typography.body1,
    lineHeight: 22,
  },
  eligibilityRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  eligibilityLabel: {
    ...typography.body2,
    fontWeight: '600',
    width: 100,
  },
  eligibilityValue: {
    ...typography.body2,
    flex: 1,
  },
  criteriaList: {
    marginTop: spacing.md,
  },
  criteriaHeader: {
    ...typography.body2,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  criteriaItem: {
    ...typography.body2,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  datesContainer: {
    gap: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dateLabel: {
    ...typography.body2,
    fontWeight: '600',
  },
  dateValue: {
    ...typography.body2,
  },
  urgentNotice: {
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  urgentText: {
    ...typography.body2,
    fontWeight: '600',
    textAlign: 'center',
  },
  adBanner: {
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: spacing.lg,
  },
  adText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  applySection: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    ...shadows.lg,
  },
  applyButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: 12,
    ...shadows.md,
  },
  applyButtonText: {
    ...typography.h4,
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  applyButtonIcon: {
    fontSize: 18,
  },
});