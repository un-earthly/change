import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/home/HomeScreen';
import { HistoryScreen } from '../screens/account/HistoryScreen';
import { AccountScreen } from '../screens/account/AccountScreen';
import { useTheme } from '../contexts/ThemeContext';
import { Routes } from '../constants/routes';

const Tab = createBottomTabNavigator();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [IoniconName, IoniconName]> = {
            [Routes.Home]: ['home', 'home-outline'],
            [Routes.History]: ['chatbubbles', 'chatbubbles-outline'],
            [Routes.Account]: ['person', 'person-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      })}
    >
      <Tab.Screen name={Routes.Home} component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name={Routes.History} component={HistoryScreen} options={{ tabBarLabel: 'Conversations' }} />
      <Tab.Screen name={Routes.Account} component={AccountScreen} options={{ tabBarLabel: 'Account' }} />
    </Tab.Navigator>
  );
}
