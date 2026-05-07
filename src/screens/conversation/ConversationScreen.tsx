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
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getLanguageByCode } from '../../constants/languages';
import { sendMessage, subscribeToMessages, type Message } from '../../services/firestore';
import { translateText } from '../../services/translation';

export function ConversationScreen({ route, navigation }: any) {
  const { conversationId, myLanguage, otherLanguage } = route.params || {};
  const { user } = useAuth();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const myLang = getLanguageByCode(myLanguage || 'en');
  const otherLang = getLanguageByCode(otherLanguage || 'ar');

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsubscribe;
  }, [conversationId]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !conversationId) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const translated = await translateText(text, myLanguage, otherLanguage);
      await sendMessage(
        conversationId,
        user.uid,
        text,
        translated,
        myLanguage,
        otherLanguage
      );
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.uid;
    return (
      <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
        {!isMe && (
          <View style={[styles.avatarSmall, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 16 }}>👤</Text>
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
            <Text style={[styles.originalText, isMe ? { color: '#FFF' } : { color: colors.text }]}>
              {item.originalText}
            </Text>
            <Text style={[styles.translatedText, isMe ? { color: 'rgba(255,255,255,0.8)' } : { color: colors.textSecondary }]}>
              {item.translatedText}
            </Text>
          </View>
          <View style={[styles.messageActions, isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
            <TouchableOpacity>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>⏺</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>📋</Text>
            </TouchableOpacity>
          </View>
        </View>
        {isMe && (
          <View style={[styles.avatarSmall, { backgroundColor: '#34C759' }]}>
            <Text style={{ fontSize: 16 }}>✓</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 24, color: colors.text }}>←</Text>
          </TouchableOpacity>
          <View style={styles.langIndicators}>
            <View style={styles.langChip}>
              <Text style={{ fontSize: 14 }}>{myLang?.flag}</Text>
              <Text style={[styles.langChipText, { color: colors.text }]}>{myLang?.name}</Text>
            </View>
            <Text style={{ color: colors.textSecondary }}>⇄</Text>
            <View style={styles.langChip}>
              <Text style={{ fontSize: 14 }}>{otherLang?.flag}</Text>
              <Text style={[styles.langChipText, { color: colors.text }]}>{otherLang?.name}</Text>
            </View>
          </View>
          <View style={{ width: 32 }} />
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                Start the conversation!
              </Text>
            </View>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity>
            <Text style={{ fontSize: 24 }}>😊</Text>
          </TouchableOpacity>
          <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              onSubmitEditing={handleSend}
            />
          </View>
          <TouchableOpacity onPress={handleSend} disabled={sending || !inputText.trim()}>
            <View style={[styles.sendBtn, { backgroundColor: inputText.trim() && !sending ? '#007AFF' : colors.surfaceHighlight }]}>
              <Text style={{ color: inputText.trim() && !sending ? '#FFF' : colors.textSecondary, fontSize: 16 }}>➤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
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
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContent: {
    maxWidth: '75%',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleLeft: {
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    borderBottomRightRadius: 4,
  },
  originalText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  translatedText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    fontStyle: 'italic',
  },
  messageActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
