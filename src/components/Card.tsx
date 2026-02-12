import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, shadows, borderRadius } from '../utils/theme';
import { Theme } from '../types';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  theme: Theme;
  style?: ViewStyle;
  elevation?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  theme,
  style,
  elevation = 'md',
  onPress,
  disabled = false,
  ...props
}) => {
  const themeColors = colors[theme];

  const cardStyles = [
    styles.container,
    {
      backgroundColor: themeColors.cardBackground,
      borderColor: themeColors.border,
    },
    shadows[elevation],
    style,
  ];

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.95}
        disabled={disabled}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
});