import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlagEmoji } from '../../components/common/FlagEmoji';
import * as Speech from 'expo-speech';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getLanguageByCode } from '../../constants/languages';
import {
  sendMessage,
  subscribeToMessages,
  subscribeToConversation,
  type Message,
  type Conversation,
} from '../../services/firestore';
import { translateText } from '../../services/translation';
import { checkSpelling, applyCorrection, type SpellMatch } from '../../services/spellcheck';
import { sendPushNotification } from '../../services/notifications';
import { Routes } from '../../constants/routes';

export function ConversationScreen({ route, navigation }: any) {
  const { conversationId } = route.params || {};
  const { user } = useAuth();
  const { colors } = useTheme();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [translationPreview, setTranslationPreview] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [spellMatches, setSpellMatches] = useState<SpellMatch[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const spellTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const insets = useSafeAreaInsets();

  // Derive languages from conversation document
  const otherUid = conversation?.participants.find((p) => p !== user?.uid);
  const myLanguage = (user?.uid && conversation?.participantLanguages[user.uid]) || 'en';
  const otherLanguage = (otherUid && conversation?.participantLanguages[otherUid]) || conversation?.expectedOtherLanguage || 'en';
  const myLang = getLanguageByCode(myLanguage);
  const otherLang = getLanguageByCode(otherLanguage);

  useEffect(() => {
    if (!conversationId || !user) return;
    const unsubConvo = subscribeToConversation(conversationId, setConversation);
    const unsubMsgs = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    });
    return () => {
      unsubConvo();
      unsubMsgs();
    };
  }, [conversationId, user?.uid]);

  useEffect(() => {
    return () => {
      if (spellTimer.current) clearTimeout(spellTimer.current);
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, []);

  const handleTextChange = (text: string) => {
    setInputText(text);

    clearTimeout(spellTimer.current);
    clearTimeout(previewTimer.current);

    if (!text.trim()) {
      setSpellMatches([]);
      setTranslationPreview('');
      setIsPreviewLoading(false);
      return;
    }

    spellTimer.current = setTimeout(async () => {
      const matches = await checkSpelling(text, myLanguage);
      setSpellMatches(matches);
    }, 600);

    setIsPreviewLoading(true);
    previewTimer.current = setTimeout(async () => {
      const preview = await translateText(text, myLanguage, otherLanguage);
      setTranslationPreview(preview !== text ? preview : '');
      setIsPreviewLoading(false);
    }, 900);
  };

  const handleApplyCorrection = (match: SpellMatch, replacement: string) => {
    const corrected = applyCorrection(inputText, match, replacement);
    setInputText(corrected);
    setSpellMatches([]);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !user || !conversationId || conversation?.status !== 'active') return;
    setInputText('');
    setSpellMatches([]);
    setTranslationPreview('');
    setIsPreviewLoading(false);
    clearTimeout(spellTimer.current);
    clearTimeout(previewTimer.current);
    setSending(true);
    try {
      const translated = await translateText(text, myLanguage, otherLanguage);
      await sendMessage(conversationId, user.uid, text, translated, myLanguage, otherLanguage);
      if (otherUid) {
        sendPushNotification(otherUid, user.displayName || 'Someone', text, conversationId);
      }
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.uid;

    // Receiver sees their own language first (translated), sender's original below.
    // Sender sees their own text first, translation below.
    const primaryText = isMe ? item.originalText : item.translatedText;
    const secondaryText = isMe ? item.translatedText : item.originalText;
    const speakText = isMe ? item.translatedText : item.originalText;
    const speakLang = isMe ? item.targetLanguage : item.sourceLanguage;

    const avatarCountryCode = isMe
      ? (myLang?.countryCode ?? 'US')
      : (otherLang?.countryCode ?? 'US');

    return (
      <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
        {!isMe && (
          <View style={[styles.avatarSmall, { backgroundColor: colors.surface }]}>
            <FlagEmoji countryCode={avatarCountryCode} size={18} />
          </View>
        )}
        <View style={styles.messageContent}>
          <View
            style={[
              styles.bubble,
              isMe
                ? [styles.bubbleRight, { backgroundColor: '#007AFF' }]
                : [styles.bubbleLeft, { backgroundColor: colors.surface }],
            ]}
          >
            <Text style={[styles.primaryText, { color: isMe ? '#FFF' : colors.text }]}>
              {primaryText}
            </Text>
            {secondaryText !== primaryText && (
              <Text
                style={[
                  styles.secondaryText,
                  { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
                ]}
              >
                {secondaryText}
              </Text>
            )}
          </View>
          <View
            style={[
              styles.messageActions,
              isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
            ]}
          >
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Speech.speak(speakText, { language: speakLang })}
            >
              <Ionicons name="play" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Clipboard.setString(speakText)}
            >
              <Ionicons name="copy" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        {isMe && (
          <View style={[styles.avatarSmall, { backgroundColor: colors.surface }]}>
            <FlagEmoji countryCode={avatarCountryCode} size={18} />
          </View>
        )}
      </View>
    );
  };

  // Loading state while conversation doc hasn't arrived yet
  if (!conversation) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Waiting state — shouldn't normally be reached (WaitingScreen handles this),
  // but shown as a fallback if the second person hasn't joined yet
  if (conversation.status === 'waiting') {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtnAbs} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.waitingTitle, { color: colors.text }]}>Waiting for other person</Text>
        <Text style={[styles.waitingCode, { color: colors.textSecondary }]}>
          Invite code:{' '}
          <Text style={{ fontWeight: '800', color: colors.text, letterSpacing: 4 }}>
            {conversation.inviteCode}
          </Text>
        </Text>
        <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 8 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.topBar,
            { paddingTop: insets.top + 8, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.langIndicators}>
            <View style={[styles.langChip, { backgroundColor: colors.surface }]}>
              <FlagEmoji countryCode={myLang?.countryCode ?? 'US'} size={14} />
              <Text style={[styles.langChipText, { color: colors.text }]}>{myLang?.name}</Text>
            </View>
            <View style={[styles.langChip, { backgroundColor: colors.surface }]}>
              <FlagEmoji countryCode={otherLang?.countryCode ?? 'US'} size={14} />
              <Text style={[styles.langChipText, { color: colors.text }]}>{otherLang?.name}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.profileBtn, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate(Routes.Account)}
          >
            <Ionicons name="person" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Say hello! Your messages are translated automatically.
              </Text>
            </View>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Translation preview strip */}
        {(translationPreview || isPreviewLoading) && conversation?.status === 'active' && (
          <View style={[styles.previewStrip, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <FlagEmoji countryCode={otherLang?.countryCode ?? 'US'} size={13} />
            {isPreviewLoading ? (
              <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginLeft: 6 }} />
            ) : (
              <Text style={[styles.previewText, { color: colors.textSecondary }]} numberOfLines={2}>
                {translationPreview}
              </Text>
            )}
          </View>
        )}

        {/* Spell check suggestions */}
        {spellMatches.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.suggestionsRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
            contentContainerStyle={styles.suggestionsContent}
          >
            {spellMatches.flatMap((match, i) =>
              match.replacements.map((rep, j) => (
                <TouchableOpacity
                  key={`${i}-${j}`}
                  style={[styles.suggestionChip, { backgroundColor: colors.surfaceHighlight }]}
                  onPress={() => handleApplyCorrection(match, rep)}
                >
                  <Text style={[styles.suggestionOld, { color: colors.textSecondary }]}>{match.word}</Text>
                  <Ionicons name="arrow-forward" size={10} color={colors.textSecondary} />
                  <Text style={[styles.suggestionNew, { color: colors.text }]}>{rep}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 10,
            },
          ]}
        >
          <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={`Type in ${myLang?.name || 'your language'}...`}
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={handleTextChange}
              multiline
              onSubmitEditing={handleSend}
            />
          </View>
          {inputText.trim() ? (
            <TouchableOpacity onPress={handleSend} disabled={sending}>
              <View style={[styles.actionBtn2, { backgroundColor: sending ? colors.surface : '#007AFF' }]}>
                {sending ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <Ionicons name="send" size={16} color="#FFF" />
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionBtn2, { backgroundColor: colors.surface }]}>
              <Ionicons name="mic" size={20} color={colors.textSecondary} />
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  backBtnAbs: {
    position: 'absolute',
    top: 56,
    left: 16,
    padding: 8,
  },
  waitingTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  waitingCode: { fontSize: 15, textAlign: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  langIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langChipText: { fontSize: 13, fontWeight: '500' },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: { padding: 16, flexGrow: 1 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContent: { maxWidth: '75%' },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleLeft: { borderBottomLeftRadius: 4 },
  bubbleRight: { borderBottomRightRadius: 4 },
  primaryText: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  secondaryText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    fontStyle: 'italic',
  },
  messageActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  actionBtn: { padding: 2 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
  },
  input: { fontSize: 16, lineHeight: 20 },
  actionBtn2: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  suggestionsRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: 48,
  },
  suggestionsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  suggestionOld: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  suggestionNew: {
    fontSize: 13,
    fontWeight: '600',
  },
});
