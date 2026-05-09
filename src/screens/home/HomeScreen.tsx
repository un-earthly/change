import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
      // Navigate to voice verification after selecting own language
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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
          <Text style={{ fontSize: 20 }}>👤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* My Language */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Your language</Text>
        <TouchableOpacity
          style={[styles.picker, { backgroundColor: colors.surface }]}
          onPress={openMyLanguagePicker}
          activeOpacity={0.8}
        >
          {myLang ? (
            <>
              <Text style={{ fontSize: 20 }}>{myLang.flag}</Text>
              <Text style={[styles.pickerText, { color: colors.text }]}>{myLang.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>⌄</Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 20 }}>🌐</Text>
              <Text style={[styles.pickerText, { color: colors.textSecondary }]}>Select Language</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>⌄</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider icon */}
        <View style={styles.dividerIcon}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <View style={[styles.micIcon, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 16 }}>🎙️</Text>
          </View>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Other Person's Language */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Next Person's language</Text>
        <TouchableOpacity
          style={[styles.picker, { backgroundColor: colors.surface }]}
          onPress={openOtherLanguagePicker}
          activeOpacity={0.8}
        >
          {otherLang ? (
            <>
              <Text style={{ fontSize: 20 }}>{otherLang.flag}</Text>
              <Text style={[styles.pickerText, { color: colors.text }]}>{otherLang.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>⌄</Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 20 }}>🌐</Text>
              <Text style={[styles.pickerText, { color: colors.textSecondary }]}>Select Language</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>⌄</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />

        <Button title={starting ? 'Starting...' : 'Start Conversation'} onPress={startConversation} loading={starting} />

        <View style={[styles.adBanner, { backgroundColor: colors.surface }]}>
          <Text style={[styles.adText, { color: colors.textSecondary }]}>Test Ad</Text>
        </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginTop: 32,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
