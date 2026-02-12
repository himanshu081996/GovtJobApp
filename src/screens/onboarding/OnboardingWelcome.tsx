import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../../utils/theme';
import { useAppStore } from '../../store';

interface OnboardingWelcomeProps {
  onNext: () => void;
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ onNext }) => {
  const { theme } = useAppStore();
  const themeColors = colors[theme];

  const handlePrivacyPolicy = async () => {
    try {
      const url = 'https://youthnaukri.com/privacy-policy/';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening privacy policy URL:', error);
    }
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
          <View style={styles.content}>
            <View style={styles.titleContainer}>
              <Text style={[styles.icon, { color: themeColors.primary }]}>
                🏛️
              </Text>
              <Text style={[styles.title, { color: themeColors.text }]}>
                Youth Naukri
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                Find your dream job with latest notifications and exam alerts
              </Text>
            </View>

            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Text style={[styles.featureIcon, { color: themeColors.primary }]}>
                  🔔
                </Text>
                <Text style={[styles.featureText, { color: themeColors.text }]}>
                  Latest job notifications
                </Text>
              </View>

              <View style={styles.feature}>
                <Text style={[styles.featureIcon, { color: themeColors.primary }]}>
                  📊
                </Text>
                <Text style={[styles.featureText, { color: themeColors.text }]}>
                  Exam preparation resources
                </Text>
              </View>

              <View style={styles.feature}>
                <Text style={[styles.featureIcon, { color: themeColors.primary }]}>
                  💼
                </Text>
                <Text style={[styles.featureText, { color: themeColors.text }]}>
                  Save favorite jobs
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.getStartedButton, { backgroundColor: themeColors.primary }]}
              onPress={onNext}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Get Started
              </Text>
            </TouchableOpacity>

            <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
              Personalize your job search experience
            </Text>

            <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
              By continuing, you agree to our{' '}
              <Text
                style={[styles.privacyLink, { color: themeColors.primary }]}
                onPress={handlePrivacyPolicy}
              >
                Privacy Policy
              </Text>
            </Text>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body1,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    gap: spacing.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.lg,
  },
  featureText: {
    ...typography.body1,
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  getStartedButton: {
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
    fontSize: 18,
  },
  footerText: {
    ...typography.caption,
    textAlign: 'center',
    fontSize: 14,
  },
  privacyText: {
    ...typography.caption,
    textAlign: 'center',
    fontSize: 12,
    marginTop: spacing.md,
  },
  privacyLink: {
    textDecorationLine: 'underline',
  },
});