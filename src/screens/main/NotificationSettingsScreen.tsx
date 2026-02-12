import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { colors, typography, spacing, shadows } from '../../utils/theme';
import { useAppStore } from '../../store';
import { RootStackParamList } from '../../../App';
import { NotificationService } from '../../services/notificationService';

type NotificationSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NotificationSettingsScreenNavigationProp>();
  const {
    categories,
    jobs,
    theme,
    userPreferences,
    updateUserPreferences,
    addNotificationCategory,
    removeNotificationCategory,
    initializeNotifications,
    pushToken
  } = useAppStore();
  const themeColors = colors[theme];

  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
    if (!pushToken) {
      initializeNotifications();
    }
  }, []);

  const checkNotificationPermission = async () => {
    const hasPermission = await NotificationService.requestPermissions();
    setPermissionGranted(hasPermission);
  };

  const handleToggleGeneralNotifications = (value: boolean) => {
    updateUserPreferences({
      notifications: {
        ...userPreferences.notifications,
        newJobs: value,
      }
    });
  };

  const handleToggleCategoryNotification = async (categoryId: string, enabled: boolean) => {
    if (!permissionGranted) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive job alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            // This would open device settings on a real device
            console.log('Open device notification settings');
          }}
        ]
      );
      return;
    }

    if (enabled) {
      await addNotificationCategory(categoryId);
    } else {
      removeNotificationCategory(categoryId);
    }
  };

  const isCategoryEnabled = (categoryId: string) => {
    return userPreferences.notificationCategories?.includes(categoryId) || false;
  };

  // Calculate actual job count for each category from Firebase data
  const getJobCountForCategory = (categoryId: string) => {
    return jobs.filter(job => job.category === categoryId).length;
  };

  const renderPermissionCard = () => (
    <Card theme={theme} style={styles.permissionCard} elevation="sm">
      <View style={styles.permissionHeader}>
        <Text style={styles.permissionIcon}>
          {permissionGranted ? '🔔' : '🔕'}
        </Text>
        <View style={styles.permissionContent}>
          <Text style={[styles.permissionTitle, { color: themeColors.text }]}>
            Push Notifications
          </Text>
          <Text style={[styles.permissionStatus, {
            color: permissionGranted ? '#4CAF50' : themeColors.error
          }]}>
            {permissionGranted ? 'Enabled' : 'Not Available in Expo Go'}
          </Text>
        </View>
      </View>

      {!permissionGranted && (
        <View style={styles.expoGoNotice}>
          <Text style={[styles.expoGoText, { color: themeColors.textSecondary }]}>
            📱 Push notifications require a development build. In Expo Go, you'll see in-app alerts instead.
          </Text>
          <TouchableOpacity
            style={[styles.enableButton, { backgroundColor: themeColors.primary }]}
            onPress={checkNotificationPermission}
          >
            <Text style={styles.enableButtonText}>Try Enable Notifications</Text>
          </TouchableOpacity>
        </View>
      )}

    </Card>
  );

  const renderGeneralSettings = () => (
    <Card theme={theme} style={styles.sectionCard} elevation="sm">
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
        General Notifications
      </Text>

      <View style={styles.settingRow}>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: themeColors.text }]}>
            New Job Alerts
          </Text>
          <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
            Get notified about new government job postings
          </Text>
        </View>
        <Switch
          value={userPreferences.notifications.newJobs}
          onValueChange={handleToggleGeneralNotifications}
          thumbColor={userPreferences.notifications.newJobs ? themeColors.primary : '#f4f3f4'}
          trackColor={{ false: '#767577', true: themeColors.primary + '40' }}
        />
      </View>
    </Card>
  );

  const renderCategorySettings = () => (
    <Card theme={theme} style={styles.sectionCard} elevation="sm">
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
        Category Notifications
      </Text>
      <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
        Choose which job categories you want to be notified about
      </Text>

      {categories.map((category) => {
        const isEnabled = isCategoryEnabled(category.id);
        const actualJobCount = getJobCountForCategory(category.id);

        return (
          <View key={category.id} style={styles.categoryRow}>
            <View style={styles.categoryContent}>
              <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '15' }]}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: themeColors.text }]}>
                  {category.name}
                </Text>
                <Text style={[styles.categoryJobs, { color: themeColors.textSecondary }]}>
                  {actualJobCount} jobs available
                </Text>
              </View>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={(value) => handleToggleCategoryNotification(category.id, value)}
              thumbColor={isEnabled ? themeColors.primary : '#f4f3f4'}
              trackColor={{ false: '#767577', true: themeColors.primary + '40' }}
              disabled={!permissionGranted}
            />
          </View>
        );
      })}
    </Card>
  );


  return (
    <LinearGradient colors={themeColors.gradient} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backIcon, { color: themeColors.text }]}>←</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: themeColors.text }]}>
            Notification Settings
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderPermissionCard()}
          {renderGeneralSettings()}
          {renderCategorySettings()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  title: {
    ...typography.h3,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  permissionCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  permissionIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  permissionStatus: {
    ...typography.body2,
    fontWeight: '600',
  },
  expoGoNotice: {
    marginTop: spacing.md,
  },
  expoGoText: {
    ...typography.body2,
    lineHeight: 20,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  enableButton: {
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  enableButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  sectionCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.body2,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    ...typography.body2,
    lineHeight: 18,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryJobs: {
    ...typography.caption,
    fontSize: 11,
  },
});