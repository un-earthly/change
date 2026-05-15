import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlagEmoji } from '../../components/common/FlagEmoji';
import { useAuth } from '../../contexts/AuthContext';
import { LanguagePickerModal } from '../../components/common/LanguagePickerModal';
import { getLanguageByCode, type Language } from '../../constants/languages';
import { Routes } from '../../constants/routes';
import { createConversation } from '../../services/firestore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function HomeScreen({ navigation }: any) {
  const { user, updateUserProfile } = useAuth();
  const [myLanguage, setMyLanguage] = useState(user?.preferredLanguage || '');
  const [theirLanguage, setTheirLanguage] = useState(user?.lastTheirLanguage || '');
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
      updateUserProfile({ preferredLanguage: lang.code }).catch(() => { });
      navigation.navigate('VoiceVerification', { languageCode: lang.code, onVerified: () => { } });
    },
    [navigation, updateUserProfile],
  );

  const handleTheirLanguageSelect = useCallback(
    (lang: Language) => {
      setTheirLanguage(lang.code);
      updateUserProfile({ lastTheirLanguage: lang.code }).catch(() => { });
    },
    [updateUserProfile],
  );

  const swapLanguages = () => {
    setMyLanguage(theirLanguage);
    setTheirLanguage(myLanguage);
  };

  const startNewConversation = async () => {
    if (!user) return;
    setStarting(true);
    try {
      const lang = myLanguage || 'en';
      const { conversationId, inviteCode } = await createConversation(user.uid, lang, theirLanguage || undefined);
      navigation.navigate(Routes.Waiting, { conversationId, inviteCode, myLanguage: lang });
    } catch (err) {
      console.error('Failed to create conversation:', err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Full-screen background map */}
      <Image
        source={require('../../../assets/home.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Dark overlay so UI stays readable */}
      <View style={styles.overlay} />

      {/* Header — top 30% of screen */}
      <View style={[styles.headerArea, { height: SCREEN_HEIGHT * 0.30, paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate(Routes.Account)}
          >
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Glassmorphism language card */}
      <View style={styles.cardWrap}>
        <View style={styles.glassCard}>
          {/* My language */}
          <Text style={styles.cardLabel}>Select Your Language</Text>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => setShowMyLangPicker(true)}
            activeOpacity={0.8}
          >
            {myLang ? (
              <FlagEmoji countryCode={myLang.countryCode} size={20} />
            ) : (
              <View style={styles.sparkleBox}>
                <Ionicons name="sparkles" size={14} color="#FFFFFF" />
              </View>
            )}
            <Text style={[styles.pickerText, !myLang && styles.pickerPlaceholder]}>
              {myLang ? myLang.name : 'Select Language'}
            </Text>
            <Ionicons name="chevron-down" size={15} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Swap — line runs full width, button masks the centre */}
          <View style={styles.swapRow}>
            <View style={styles.swapLine} />
            <TouchableOpacity style={styles.swapBtn} onPress={swapLanguages} activeOpacity={0.7}>
              <Ionicons name="swap-vertical" size={15} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
            <View style={styles.swapLine} />
          </View>

          {/* Their language */}
          <Text style={styles.cardLabel}>Select Next Person's Language</Text>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => setShowTheirLangPicker(true)}
            activeOpacity={0.8}
          >
            {theirLang ? (
              <FlagEmoji countryCode={theirLang.countryCode} size={20} />
            ) : (
              <View style={styles.sparkleBox}>
                <Ionicons name="sparkles" size={14} color="#FFFFFF" />
              </View>
            )}
            <Text style={[styles.pickerText, !theirLang && styles.pickerPlaceholder]}>
              {theirLang ? theirLang.name : 'Select Language'}
            </Text>
            <Ionicons name="chevron-down" size={15} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action area — flex, vertically centered between card and ad */}
      <View style={styles.actionArea}>
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
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate(Routes.FindPerson)}
              activeOpacity={0.85}
            >
              <Ionicons name="search-outline" size={18} color="#FFFFFF" />
              <Text style={styles.secondaryBtnText}>Find Someone</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate(Routes.Join)}
              activeOpacity={0.85}
            >
              <Ionicons name="enter-outline" size={18} color="#FFFFFF" />
              <Text style={styles.secondaryBtnText}>Join with Invite Code</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowActions(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Ad banner — 100px pinned to bottom */}
      <View style={[styles.adBanner, { paddingBottom: insets.bottom }]}>
        <Text style={styles.adText}>Test Ad</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  /* ── Header ── */
  headerArea: {
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { height: 32, width: 120 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  /* ── Glass card ── */
  cardWrap: {
    paddingHorizontal: 20,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    padding: 16,
    gap: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,

  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 20,
  },
  sparkleBox: {
    width: 32,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pickerPlaceholder: {
    opacity: 0.5,
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  swapLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Action area ── */
  actionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  startBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '84%',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  startBtnDisabled: { opacity: 0.7 },
  startBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  secondaryBtn: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '84%',
    gap: 8,
  },
  secondaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  cancelBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  cancelText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '500' },

  /* ── Ad banner ── */
  adBanner: {
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '700' },
});
