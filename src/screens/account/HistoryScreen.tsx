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
import {
  subscribeToConversations,
  getUserProfile,
  type Conversation,
} from '../../services/firestore';
import { Routes } from '../../constants/routes';

function formatTime(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diffMs = Date.now() - date.getTime();
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
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    return subscribeToConversations(user.uid, (convos) => {
      setConversations(convos);
      setLoading(false);

      // Fetch display names for any new participants we haven't loaded yet
      const newUids = convos
        .flatMap((c) => c.participants)
        .filter((uid) => uid !== user.uid && !nameMap[uid]);
      const unique = [...new Set(newUids)];
      if (unique.length === 0) return;

      Promise.all(unique.map((uid) => getUserProfile(uid).then((p) => ({ uid, name: p?.displayName ?? null }))))
        .then((results) => {
          setNameMap((prev) => {
            const next = { ...prev };
            results.forEach(({ uid, name }) => { next[uid] = name ?? 'Unknown'; });
            return next;
          });
        })
        .catch(() => {});
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

    const otherName = (otherUid && nameMap[otherUid]) || (otherUid ? '...' : 'Unknown');
    const myName = user?.displayName || 'You';
    const lastText = item.lastMessage?.text;

    return (
      <TouchableOpacity
        style={[styles.item, { borderBottomColor: colors.border }]}
        onPress={() => handleOpen(item)}
        activeOpacity={0.7}
      >
        {/* Avatar: other person's flag */}
        <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
          <FlagEmoji countryCode={otherL?.countryCode ?? 'US'} size={22} />
        </View>

        <View style={styles.content}>
          {/* Names row */}
          <View style={styles.topRow}>
            <Text style={[styles.names, { color: colors.text }]} numberOfLines={1}>
              {myName}
              <Text style={{ color: colors.textSecondary }}> → </Text>
              {otherName}
            </Text>
            <Text style={[styles.time, { color: colors.textSecondary }]}>
              {formatTime(item.updatedAt)}
            </Text>
          </View>

          {/* Language pair */}
          <View style={styles.langRow}>
            <FlagEmoji countryCode={myL?.countryCode ?? 'US'} size={12} />
            <Text style={[styles.langText, { color: colors.textSecondary }]}>
              {myL?.name ?? myLangCode}
            </Text>
            <Ionicons name="arrow-forward" size={10} color={colors.textSecondary} />
            <FlagEmoji countryCode={otherL?.countryCode ?? 'US'} size={12} />
            <Text style={[styles.langText, { color: colors.textSecondary }]}>
              {otherL?.name ?? otherLangCode}
            </Text>
          </View>

          {/* Last message / status */}
          {isWaiting ? (
            <View style={styles.statusRow}>
              <Ionicons name="time-outline" size={12} color="#FF9500" />
              <Text style={[styles.statusText, { color: '#FF9500' }]}>
                Waiting · Code: {item.inviteCode}
              </Text>
            </View>
          ) : lastText ? (
            <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={1}>
              {lastText}
            </Text>
          ) : (
            <Text style={[styles.preview, { color: colors.textSecondary }]}>No messages yet</Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Conversations</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#007AFF" />
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={44} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No conversations yet.{'\n'}Start one from the Home tab.
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
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
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, gap: 3 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  names: { flex: 1, fontSize: 15, fontWeight: '600' },
  time: { fontSize: 12, flexShrink: 0 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langText: { fontSize: 12 },
  preview: { fontSize: 13, lineHeight: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 13 },
});
