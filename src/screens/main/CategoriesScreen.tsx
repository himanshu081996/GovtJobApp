import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { colors, typography, spacing } from '../../utils/theme';
import { useAppStore } from '../../store';
import { JobCategory } from '../../types';
import { RootStackParamList } from '../../../App';
import { BannerAd } from '../../components/BannerAd';
import { InterstitialService } from '../../services/interstitialService';

type CategoriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CategoriesScreen: React.FC = () => {
  const { categories, theme, jobs } = useAppStore();
  const themeColors = colors[theme];
  const navigation = useNavigation<CategoriesScreenNavigationProp>();

  const handleCategoryPress = async (category: JobCategory) => {
    console.log(`🎯 Category pressed: ${category.name}`);

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

  const getJobCountForCategory = (categoryId: string) => {
    return jobs.filter(job => job.category === categoryId).length;
  };

  const renderCategoryCard = ({ item: category }: { item: JobCategory }) => {
    const actualJobCount = getJobCountForCategory(category.id);

    return (
      <Card
        theme={theme}
        style={styles.categoryCard}
        elevation="md"
        onPress={() => handleCategoryPress(category)}
      >
        <View style={styles.categoryContent}>
          <View style={styles.categoryLeft}>
            <View style={[styles.iconContainer, { backgroundColor: category.color + '15' }]}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
            </View>

            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: themeColors.text }]}>
                {category.name}
              </Text>
              <Text style={[styles.categoryDescription, { color: themeColors.textSecondary }]}>
                {category.description}
              </Text>
            </View>
          </View>

          <View style={styles.categoryRight}>
            <View style={[styles.jobCountBadge, { backgroundColor: category.color + '20' }]}>
              <Text style={[styles.jobCountText, { color: category.color }]}>
                {actualJobCount}
              </Text>
            </View>
            <Text style={[styles.jobsLabel, { color: themeColors.textSecondary }]}>
              jobs
            </Text>
            <Text style={[styles.arrowIcon, { color: themeColors.textSecondary }]}>
              →
            </Text>
          </View>
        </View>

        {/* Progress bar showing job distribution */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: category.color + '30',
                width: `${Math.min((actualJobCount / 60) * 100, 100)}%`,
              }
            ]}
          />
        </View>
      </Card>
    );
  };

  const renderAdBanner = () => {
    return <BannerAd placement="categories" onLog={(msg) => console.log(msg)} />;
  };

  const totalJobs = jobs.length;
  const categoriesWithJobs = categories.filter(cat => getJobCountForCategory(cat.id) > 0);

  return (
    <LinearGradient
      colors={themeColors.gradient}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Job Categories
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Explore {categoriesWithJobs.length} categories with {totalJobs} total jobs
          </Text>
        </View>

        <FlatList
          data={categories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListHeaderComponent={renderAdBanner}
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
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body2,
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
  categoryCard: {
    padding: spacing.lg,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  categoryDescription: {
    ...typography.body2,
    lineHeight: 18,
  },
  categoryRight: {
    alignItems: 'center',
    gap: 2,
  },
  jobCountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  jobCountText: {
    ...typography.body1,
    fontWeight: '700',
  },
  jobsLabel: {
    ...typography.caption,
    fontSize: 10,
  },
  arrowIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});