import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.Home} component={HomeScreen} />
      <Stack.Screen name={Routes.Account} component={AccountScreen} />
      <Stack.Screen
        name="VoiceVerification"
        component={VoiceVerificationScreen}
        options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name={Routes.Conversation} component={ConversationScreen} />
      <Stack.Screen name={Routes.PersonalInfo} component={PersonalInfoScreen} />
      <Stack.Screen name={Routes.History} component={HistoryScreen} />
      <Stack.Screen name={Routes.ChangePassword} component={ChangePasswordScreen} />
      <Stack.Screen name={Routes.ChangeLanguage} component={ChangeLanguageScreen} />
      <Stack.Screen name={Routes.ChangeTheme} component={ChangeThemeScreen} />
    </Stack.Navigator>
  );
}
