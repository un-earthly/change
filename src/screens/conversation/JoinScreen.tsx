import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getLanguageByCode } from '../../constants/languages';
import { joinConversation } from '../../services/firestore';
import { Routes } from '../../constants/routes';

export function JoinScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const myLanguage = user?.preferredLanguage || 'en';
  const myLang = getLanguageByCode(myLanguage);

  const handleJoin = async () => {
    if (!user || code.trim().length !== 6) return;
    setJoining(true);
    try {
      const conversationId = await joinConversation(code.trim(), user.uid, myLanguage);
      navigation.replace(Routes.Conversation, { conversationId });
    } catch (err: any) {
      Alert.alert('Could not join', err.message || 'Something went wrong. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const canJoin = code.length === 6 && !joining;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
            <Ionicons name="enter-outline" size={40} color="#007AFF" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Join a Conversation</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the 6-character code shared by the other person
          </Text>

          <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.codeInput, { color: colors.text }]}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="ABC123"
              placeholderTextColor={colors.textSecondary}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
            />
          </View>

          <View style={[styles.langNote, { backgroundColor: colors.surface }]}>
            <Ionicons name="language-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.langNoteText, { color: colors.textSecondary }]}>
              You'll chat in{' '}
              <Text style={{ fontWeight: '700', color: colors.text }}>
                {myLang?.name || myLanguage.toUpperCase()}
              </Text>
              {' '}(your profile language)
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.joinBtn, !canJoin && styles.joinBtnDisabled]}
            onPress={handleJoin}
            disabled={!canJoin}
          >
            {joining ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="enter-outline" size={20} color="#FFF" />
                <Text style={styles.joinBtnText}>Join Conversation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { padding: 16 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
    marginTop: -60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  inputCard: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginVertical: 4,
  },
  codeInput: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 12,
    width: '100%',
    textAlign: 'center',
  },
  langNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },
  langNoteText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 28,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinBtnDisabled: { opacity: 0.45 },
  joinBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
