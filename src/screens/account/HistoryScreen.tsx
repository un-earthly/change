import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlagEmoji } from '../../components/common/FlagEmoji';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getLanguageByCode } from '../../constants/languages';
import { subscribeToConversations, type Conversation } from '../../services/firestore';
import { Routes } from '../../constants/routes';

function formatTime(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function HistoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    return subscribeToConversations(user.uid, (convos) => {
      setConversations(convos);
      setLoading(false);
    });
  }, [user?.uid]);

  const handleOpen = (convo: Conversation) => {
    const myLangCode = (user?.uid && convo.participantLanguages[user.uid]) || 'en';
    if (convo.status === 'waiting') {
      navigation.navigate(Routes.Waiting, {
        conversationId: convo.id,
        inviteCode: convo.inviteCode,
        myLanguage: myLangCode,
      });
    } else {
      navigation.navigate(Routes.Conversation, { conversationId: convo.id });
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const otherUid = item.participants.find((p) => p !== user?.uid);
    const myLangCode = (user?.uid && item.participantLanguages[user.uid]) || 'en';
    const otherLangCode =
      (otherUid && item.participantLanguages[otherUid]) ||
      item.expectedOtherLanguage ||
      'en';
    const myL = getLanguageByCode(myLangCode);
    const otherL = getLanguageByCode(otherLangCode);
    const isWaiting = item.status === 'waiting';
    const lastText = item.lastMessage?.text;

    return (
      <TouchableOpacity
        style={[styles.item, { borderBottomColor: colors.border }]}
        onPress={() => handleOpen(item)}
        activeOpacity={0.7}
      >
        {/* Flag pair */}
        <View style={[styles.flagsBox, { backgroundColor: colors.surface }]}>
          <FlagEmoji countryCode={myL?.countryCode ?? 'US'} size={18} />
          <Ionicons name="arrow-forward" size={10} color={colors.textSecondary} />
          <FlagEmoji countryCode={otherL?.countryCode ?? 'US'} size={18} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.langLine, { color: colors.text }]}>
              {myL?.name ?? myLangCode} → {otherL?.name ?? otherLangCode}
            </Text>
            <Text style={[styles.time, { color: colors.textSecondary }]}>
              {formatTime(item.updatedAt)}
            </Text>
          </View>
          {isWaiting ? (
            <View style={styles.waitingRow}>
              <Ionicons name="time-outline" size={12} color="#FF9500" />
              <Text style={[styles.waitingText, { color: '#FF9500' }]}>
                Waiting · Code: {item.inviteCode}
              </Text>
            </View>
          ) : lastText ? (
            <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={1}>
              {lastText}
            </Text>
          ) : (
            <Text style={[styles.preview, { color: colors.textSecondary }]}>
              No messages yet
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Conversations</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#007AFF" />
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={44} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No conversations yet.{'\n'}Start one from the home screen.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: { width: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  list: { paddingBottom: 24 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  flagsBox: {
    width: 60,
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  content: { flex: 1, gap: 4 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  langLine: { fontSize: 14, fontWeight: '600' },
  time: { fontSize: 12 },
  preview: { fontSize: 13, lineHeight: 18 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  waitingText: { fontSize: 13 },
});
