import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Flag } from 'react-native-country-picker-modal';
import Tts from 'react-native-tts';
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
import { sendPushNotification } from '../../services/notifications';

export function ConversationScreen({ route, navigation }: any) {
  const { conversationId } = route.params || {};
  const { user } = useAuth();
  const { colors } = useTheme();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // Derive languages from conversation document
  const otherUid = conversation?.participants.find((p) => p !== user?.uid);
  const myLanguage = (user?.uid && conversation?.participantLanguages[user.uid]) || 'en';
  const otherLanguage = (otherUid && conversation?.participantLanguages[otherUid]) || 'en';
  const myLang = getLanguageByCode(myLanguage);
  const otherLang = getLanguageByCode(otherLanguage);

  useEffect(() => {
    if (!conversationId) return;
    const unsubConvo = subscribeToConversation(conversationId, setConversation);
    const unsubMsgs = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    });
    return () => {
      unsubConvo();
      unsubMsgs();
    };
  }, [conversationId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !user || !conversationId || conversation?.status !== 'active') return;
    setInputText('');
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

    const primaryText = item.originalText;
    const secondaryText = item.translatedText;
    const speakText = isMe ? item.translatedText : item.originalText;
    const speakLang = isMe ? item.targetLanguage : item.sourceLanguage;

    return (
      <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
        {!isMe && (
          <View style={[styles.avatarSmall, { backgroundColor: colors.surface }]}>
            <Ionicons name="person" size={16} color={colors.textSecondary} />
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
              onPress={() => { Tts.setDefaultLanguage(speakLang); Tts.speak(speakText); }}
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
          <View style={[styles.avatarSmall, { backgroundColor: '#34C759' }]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
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
              <Flag countryCode={myLang?.countryCode as any} flagSize={14} withEmoji />
              <Text style={[styles.langChipText, { color: colors.text }]}>{myLang?.name}</Text>
            </View>
            <Ionicons name="swap-horizontal" size={18} color={colors.textSecondary} />
            <View style={[styles.langChip, { backgroundColor: colors.surface }]}>
              <Flag countryCode={otherLang?.countryCode as any} flagSize={14} withEmoji />
              <Text style={[styles.langChipText, { color: colors.text }]}>{otherLang?.name}</Text>
            </View>
          </View>
          <View style={{ width: 32 }} />
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
              onChangeText={setInputText}
              multiline
              onSubmitEditing={handleSend}
            />
          </View>
          <TouchableOpacity onPress={handleSend} disabled={sending || !inputText.trim()}>
            <View
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() && !sending ? '#007AFF' : colors.surface },
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Ionicons
                  name="send"
                  size={16}
                  color={inputText.trim() ? '#FFF' : colors.textSecondary}
                />
              )}
            </View>
          </TouchableOpacity>
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
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
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
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
