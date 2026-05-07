import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Routes } from '../constants/routes';
import { HomeScreen } from '../screens/home/HomeScreen';
import { VoiceVerificationScreen } from '../screens/home/VoiceVerificationScreen';
import { AccountScreen } from '../screens/account/AccountScreen';
import { ConversationScreen } from '../screens/conversation/ConversationScreen';
import { PersonalInfoScreen } from '../screens/account/PersonalInfoScreen';
import { HistoryScreen } from '../screens/account/HistoryScreen';
import { ChangePasswordScreen } from '../screens/account/ChangePasswordScreen';
import { ChangeLanguageScreen } from '../screens/account/ChangeLanguageScreen';
import { ChangeThemeScreen } from '../screens/account/ChangeThemeScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: { paddingBottom: 8, height: 60 },
      }}
    >
      <Tab.Screen
        name={Routes.Home}
        component={HomeScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text>,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name={Routes.Account}
        component={AccountScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>👤</Text>,
          tabBarLabel: 'Account',
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.HomeTabs} component={HomeTabs} />
      <Stack.Screen name="VoiceVerification" component={VoiceVerificationScreen} />
      <Stack.Screen name={Routes.Conversation} component={ConversationScreen} />
      <Stack.Screen name={Routes.PersonalInfo} component={PersonalInfoScreen} />
      <Stack.Screen name={Routes.History} component={HistoryScreen} />
      <Stack.Screen name={Routes.ChangePassword} component={ChangePasswordScreen} />
      <Stack.Screen name={Routes.ChangeLanguage} component={ChangeLanguageScreen} />
      <Stack.Screen name={Routes.ChangeTheme} component={ChangeThemeScreen} />
    </Stack.Navigator>
  );
}
