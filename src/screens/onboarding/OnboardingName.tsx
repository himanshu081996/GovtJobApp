import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../../utils/theme';
import { useAppStore } from '../../store';

interface OnboardingNameProps {
  onNext: () => void;
}

export const OnboardingName: React.FC<OnboardingNameProps> = ({ onNext }) => {
  const { theme, updateUserPreferences } = useAppStore();
  const themeColors = colors[theme];
  const [name, setName] = useState('');

  const handleContinue = () => {
    if (name.trim()) {
      updateUserPreferences({ name: name.trim() });
      onNext();
    }
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <LinearGradient
      colors={themeColors.gradient}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.emoji}>👋</Text>
              <Text style={[styles.title, { color: themeColors.text }]}>
                What's your name?
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                Help us personalize your job search experience
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: themeColors.cardBackground,
                    color: themeColors.text,
                    borderColor: name.trim() ? themeColors.primary : themeColors.border,
                  }
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={themeColors.textSecondary}
                value={name}
                onChangeText={setName}
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  {
                    backgroundColor: name.trim() ? themeColors.primary : themeColors.textTertiary,
                  }
                ]}
                onPress={handleContinue}
                disabled={!name.trim()}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  Continue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={[styles.skipText, { color: themeColors.textSecondary }]}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  emoji: {
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
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: spacing.xl * 2,
  },
  nameInput: {
    fontSize: 18,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  footer: {
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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