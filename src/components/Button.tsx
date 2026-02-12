import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';
import { Theme } from '../types';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  theme: Theme;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  theme,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  icon,
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const themeColors = colors[theme];

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.paddingHorizontal = spacing.md;
        break;
      case 'large':
        baseStyle.paddingVertical = spacing.lg;
        baseStyle.paddingHorizontal = spacing.xl;
        break;
      default: // medium
        baseStyle.paddingVertical = spacing.md;
        baseStyle.paddingHorizontal = spacing.lg;
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = disabled ? themeColors.textTertiary : themeColors.primary;
        break;
      case 'secondary':
        baseStyle.backgroundColor = disabled ? themeColors.surfaceVariant : themeColors.secondary;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = disabled ? themeColors.textTertiary : themeColors.primary;
        break;
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...typography.button,
    };

    switch (size) {
      case 'small':
        baseStyle.fontSize = 14;
        break;
      case 'large':
        baseStyle.fontSize = 18;
        break;
    }

    switch (variant) {
      case 'primary':
      case 'secondary':
        baseStyle.color = '#FFFFFF';
        break;
      case 'outline':
        baseStyle.color = disabled ? themeColors.textTertiary : themeColors.primary;
        break;
    }

    if (disabled && variant !== 'outline') {
      baseStyle.color = themeColors.background;
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyles(),
        !disabled && shadows.sm,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.9}
      {...props}
    >
      {icon && <>{icon}</>}
      <Text style={[getTextStyles(), textStyle, icon && { marginLeft: spacing.sm }]}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};