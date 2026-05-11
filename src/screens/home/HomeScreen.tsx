import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Flag } from 'react-native-country-picker-modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/common/Button';
import { LanguagePickerModal } from '../../components/common/LanguagePickerModal';
import { getLanguageByCode, type Language } from '../../constants/languages';
import { Routes } from '../../constants/routes';
import { createConversation } from '../../services/firestore';

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [myLanguage, setMyLanguage] = useState(user?.preferredLanguage || 'en');
  const [otherLanguage, setOtherLanguage] = useState('ar');
  const [showMyLangPicker, setShowMyLangPicker] = useState(false);
  const [showOtherLangPicker, setShowOtherLangPicker] = useState(false);
  const [starting, setStarting] = useState(false);

  const insets = useSafeAreaInsets();
  const myLang = getLanguageByCode(myLanguage);
  const otherLang = getLanguageByCode(otherLanguage);

  const openMyLanguagePicker = () => setShowMyLangPicker(true);
  const openOtherLanguagePicker = () => setShowOtherLangPicker(true);

  const handleMyLanguageSelect = useCallback(
    (lang: Language) => {
      setMyLanguage(lang.code);
      navigation.navigate('VoiceVerification', {
        languageCode: lang.code,
        onVerified: () => {},
      });
    },
    [navigation]
  );

  const handleOtherLanguageSelect = useCallback((lang: Language) => {
    setOtherLanguage(lang.code);
  }, []);

  const startConversation = async () => {
    if (!user) return;
    setStarting(true);
    try {
      const conversationId = await createConversation(user.uid, myLanguage, otherLanguage);
      navigation.navigate(Routes.Conversation, {
        conversationId,
        myLanguage,
        otherLanguage,
      });
    } catch (err) {
      console.error('Failed to create conversation:', err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate(Routes.Account)}
          >
            <Ionicons name="person" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Your language</Text>
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: colors.surface }]}
            onPress={openMyLanguagePicker}
            activeOpacity={0.8}
          >
            {myLang ? (
              <>
                <Flag countryCode={myLang.countryCode as any} flagSize={20} withEmoji />
                <Text style={[styles.pickerText, { color: colors.text }]}>{myLang.name}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </>
            ) : (
              <>
                <Ionicons name="globe" size={20} color={colors.textSecondary} />
                <Text style={[styles.pickerText, { color: colors.textSecondary }]}>Select Language</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerIcon}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <View style={[styles.micIcon, { backgroundColor: colors.surface }]}>
              <Ionicons name="mic" size={18} color={colors.text} />
            </View>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Next Person's language</Text>
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: colors.surface }]}
            onPress={openOtherLanguagePicker}
            activeOpacity={0.8}
          >
            {otherLang ? (
              <>
                <Flag countryCode={otherLang.countryCode as any} flagSize={20} withEmoji />
                <Text style={[styles.pickerText, { color: colors.text }]}>{otherLang.name}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </>
            ) : (
              <>
                <Ionicons name="globe" size={20} color={colors.textSecondary} />
                <Text style={[styles.pickerText, { color: colors.textSecondary }]}>Select Language</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />

          <Button title={starting ? 'Starting...' : 'Start Conversation'} onPress={startConversation} loading={starting} />
        </View>
      </ScrollView>

      {/* Fixed ad banner — swap View for your AdMob component when ready */}
      <View style={[styles.adBanner, { backgroundColor: colors.surface, paddingBottom: insets.bottom }]}>
        <Text style={[styles.adText, { color: colors.textSecondary }]}>Advertisement</Text>
      </View>

      <LanguagePickerModal
        visible={showMyLangPicker}
        onClose={() => setShowMyLangPicker(false)}
        onSelect={handleMyLanguageSelect}
        selectedCode={myLanguage}
        title="Select Your language"
      />

      <LanguagePickerModal
        visible={showOtherLangPicker}
        onClose={() => setShowOtherLangPicker(false)}
        onSelect={handleOtherLanguageSelect}
        selectedCode={otherLanguage}
        title="Select Next Person's language"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  logo: {
    height: 32,
    width: 120,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
    color: '#8E8E93',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  dividerIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  micIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  adBanner: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C7C7CC',
  },
  adText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
