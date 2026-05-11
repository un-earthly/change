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
  const { user } = useAuth();
  const { colors } = useTheme();
  const [myLanguage, setMyLanguage] = useState(user?.preferredLanguage || '');
  const [otherLanguage, setOtherLanguage] = useState('');
  const [showMyLangPicker, setShowMyLangPicker] = useState(false);
  const [showOtherLangPicker, setShowOtherLangPicker] = useState(false);
  const [starting, setStarting] = useState(false);
  const insets = useSafeAreaInsets();

  const myLang = getLanguageByCode(myLanguage);
  const otherLang = getLanguageByCode(otherLanguage);

  const handleMyLanguageSelect = useCallback(
    (lang: Language) => {
      setMyLanguage(lang.code);
      navigation.navigate('VoiceVerification', { languageCode: lang.code, onVerified: () => {} });
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
      const src = myLanguage || 'en';
      const tgt = otherLanguage || 'ar';
      const conversationId = await createConversation(user.uid, src, tgt);
      navigation.navigate(Routes.Conversation, { conversationId, myLanguage: src, otherLanguage: tgt });
    } catch (err) {
      console.error('Failed to create conversation:', err);
    } finally {
      setStarting(false);
    }
  };

  const renderPicker = (lang: Language | undefined, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.pickerRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {lang ? (
        <Flag countryCode={lang.countryCode as any} flagSize={22} withEmoji />
      ) : (
        <View style={styles.sparkleBox}>
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
        </View>
      )}
      <Text style={[styles.pickerText, { color: lang ? colors.text : colors.textSecondary }]}>
        {lang ? lang.name : 'Select Language'}
      </Text>
      <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );

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
            {renderPicker(myLang, () => setShowMyLangPicker(true))}

            {/* Swap divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <View style={[styles.swapCircle, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Ionicons name="swap-vertical" size={16} color={colors.textSecondary} />
              </View>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Select Next Person's language</Text>
            {renderPicker(otherLang, () => setShowOtherLangPicker(true))}
          </View>

          <View style={{ height: 40 }} />

          {/* Start Conversation */}
          <TouchableOpacity
            style={[styles.startBtn, starting && styles.startBtnDisabled]}
            onPress={startConversation}
            activeOpacity={0.85}
            disabled={starting}
          >
            <Ionicons name="mic" size={20} color="#FFFFFF" />
            <Text style={styles.startBtnText}>{starting ? 'Starting...' : 'Start Conversation'}</Text>
          </TouchableOpacity>
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

  content: { padding: 20, paddingTop: 16 },

  card: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 10,
  },
  cardLabel: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  sparkleBox: {
    width: 40,
    height: 27,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: { flex: 1, fontSize: 16, fontWeight: '500' },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  swapCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },

  startBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  startBtnDisabled: { opacity: 0.7 },
  startBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },

  adBanner: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  adText: { fontSize: 14, fontWeight: '700' },
});
