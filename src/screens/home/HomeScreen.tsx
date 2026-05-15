import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Flag } from 'react-native-country-picker-modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LanguagePickerModal } from '../../components/common/LanguagePickerModal';
import { getLanguageByCode, type Language } from '../../constants/languages';
import { Routes } from '../../constants/routes';
import { createConversation } from '../../services/firestore';

export function HomeScreen({ navigation }: any) {
  const { user, updateUserProfile } = useAuth();
  const { colors } = useTheme();
  const [myLanguage, setMyLanguage] = useState(user?.preferredLanguage || '');
  const [theirLanguage, setTheirLanguage] = useState('');
  const [showMyLangPicker, setShowMyLangPicker] = useState(false);
  const [showTheirLangPicker, setShowTheirLangPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [starting, setStarting] = useState(false);
  const insets = useSafeAreaInsets();

  const myLang = getLanguageByCode(myLanguage);
  const theirLang = getLanguageByCode(theirLanguage);

  const handleMyLanguageSelect = useCallback(
    (lang: Language) => {
      setMyLanguage(lang.code);
      updateUserProfile({ preferredLanguage: lang.code }).catch(() => {});
      navigation.navigate('VoiceVerification', { languageCode: lang.code, onVerified: () => {} });
    },
    [navigation, updateUserProfile]
  );

  const handleTheirLanguageSelect = useCallback((lang: Language) => {
    setTheirLanguage(lang.code);
  }, []);

  const swapLanguages = () => {
    setMyLanguage(theirLanguage);
    setTheirLanguage(myLanguage);
  };

  const startNewConversation = async () => {
    if (!user) return;
    setStarting(true);
    try {
      const lang = myLanguage || 'en';
      const { conversationId, inviteCode } = await createConversation(user.uid, lang);
      navigation.navigate(Routes.Waiting, { conversationId, inviteCode, myLanguage: lang });
    } catch (err) {
      console.error('Failed to create conversation:', err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: colors.surfaceHighlight }]}
            onPress={() => navigation.navigate(Routes.Account)}
          >
            <Ionicons name="person" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Language selection card */}
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Select Your language</Text>
            <TouchableOpacity
              style={[styles.pickerRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowMyLangPicker(true)}
              activeOpacity={0.8}
            >
              {myLang ? (
                <Flag countryCode={myLang.countryCode as any} flagSize={20} withEmoji />
              ) : (
                <View style={styles.sparkleBox}>
                  <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                </View>
              )}
              <Text style={[styles.pickerText, { color: myLang ? colors.text : colors.textSecondary }]}>
                {myLang ? myLang.name : 'Select Language'}
              </Text>
              <Ionicons name="chevron-down" size={15} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Swap button */}
            <TouchableOpacity
              style={[styles.swapBtn, { borderColor: colors.border }]}
              onPress={swapLanguages}
              activeOpacity={0.7}
            >
              <Ionicons name="swap-vertical" size={15} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Select Next Person's language</Text>
            <TouchableOpacity
              style={[styles.pickerRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowTheirLangPicker(true)}
              activeOpacity={0.8}
            >
              {theirLang ? (
                <Flag countryCode={theirLang.countryCode as any} flagSize={20} withEmoji />
              ) : (
                <View style={styles.sparkleBox}>
                  <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                </View>
              )}
              <Text style={[styles.pickerText, { color: theirLang ? colors.text : colors.textSecondary }]}>
                {theirLang ? theirLang.name : 'Select Language'}
              </Text>
              <Ionicons name="chevron-down" size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 28 }} />

          {!showActions ? (
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => setShowActions(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="mic-outline" size={18} color="#FFFFFF" />
              <Text style={styles.startBtnText}>Start Conversation</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.startBtn, starting && styles.startBtnDisabled]}
                onPress={startNewConversation}
                activeOpacity={0.85}
                disabled={starting}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.startBtnText}>{starting ? 'Creating...' : 'New Conversation'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate(Routes.FindPerson)}
                activeOpacity={0.85}
              >
                <Ionicons name="search-outline" size={18} color={colors.text} />
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Find Someone</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate(Routes.Join)}
                activeOpacity={0.85}
              >
                <Ionicons name="enter-outline" size={18} color={colors.text} />
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Join with Invite Code</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowActions(false)} style={styles.cancelBtn}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Fixed ad banner */}
      <View style={[styles.adBanner, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom }]}>
        <Text style={[styles.adText, { color: colors.text }]}>Test Ad</Text>
      </View>

      <LanguagePickerModal
        visible={showMyLangPicker}
        onClose={() => setShowMyLangPicker(false)}
        onSelect={handleMyLanguageSelect}
        selectedCode={myLanguage}
        title="Select your language"
      />
      <LanguagePickerModal
        visible={showTheirLangPicker}
        onClose={() => setShowTheirLangPicker(false)}
        onSelect={handleTheirLanguageSelect}
        selectedCode={theirLanguage}
        title="Select next person's language"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  logo: { height: 32, width: 120 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: { paddingHorizontal: 20, paddingTop: 40 },

  card: {
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    gap: 8,
  },
  cardLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center' },

  swapBtn: {
    alignSelf: 'center',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  sparkleBox: {
    width: 36,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: { flex: 1, fontSize: 15, fontWeight: '500' },

  startBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: '82%',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  startBtnDisabled: { opacity: 0.7 },
  startBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  secondaryBtn: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: '82%',
    gap: 8,
    marginTop: 10,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },

  cancelBtn: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  cancelText: { fontSize: 13, fontWeight: '500' },

  adBanner: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  adText: { fontSize: 14, fontWeight: '700' },
});
