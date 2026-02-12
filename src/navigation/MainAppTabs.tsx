import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/main/HomeScreen';
import { LatestJobsScreen } from '../screens/main/LatestJobsScreen';
import { CategoriesScreen } from '../screens/main/CategoriesScreen';
import { SavedJobsScreen } from '../screens/main/SavedJobsScreen';
import { colors, typography, spacing } from '../utils/theme';
import { useAppStore } from '../store';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const { theme } = useAppStore();
  const themeColors = colors[theme];

  const getIcon = () => {
    switch (name) {
      case 'Home': return '🏠';
      case 'Latest': return '🔔';
      case 'Categories': return '📋';
      case 'Saved': return '💼';
      default: return '🏠';
    }
  };

  return (
    <View style={styles.tabIcon}>
      <Text style={[
        styles.icon,
        {
          opacity: focused ? 1 : 0.6,
        }
      ]}>
        {getIcon()}
      </Text>
    </View>
  );
};

export const MainAppTabs: React.FC = () => {
  const { theme } = useAppStore();
  const themeColors = colors[theme];
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: themeColors.cardBackground,
          borderTopColor: themeColors.border,
          borderTopWidth: 1,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm + insets.bottom,
          height: 65 + insets.bottom,
          elevation: 8,
          shadowColor: themeColors.shadowColor,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textSecondary,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarLabelStyle: {
          ...typography.caption,
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Latest" component={LatestJobsScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Saved" component={SavedJobsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
});