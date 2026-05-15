import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getLanguageByCode } from '../../constants/languages';
import { getUserMessages, type Message } from '../../services/firestore';

function formatTime(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isToday ? `Today at ${timeStr}` : date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function HistoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserMessages(user.uid).then((msgs) => {
      setHistory(msgs);
      setLoading(false);
    });
  }, [user]);

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const fromLang = getLanguageByCode(item.sourceLanguage);
    const toLang = getLanguageByCode(item.targetLanguage);
    const isFirst = index === 0;

    return (
      <View
        style={[
          styles.item,
          isFirst ? styles.itemHighlighted : [styles.itemPlain, { borderBottomColor: colors.border }],
        ]}
      >
        {/* Row 1: original text + language pair */}
        <View style={styles.row}>
          <Text
            style={[styles.originalText, { color: isFirst ? '#FFFFFF' : colors.text }]}
            numberOfLines={1}
          >
            {item.originalText}
          </Text>
          <View style={styles.langPair}>
            <Text style={[styles.langName, { color: isFirst ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]}>
              {fromLang?.name}
            </Text>
            <View style={styles.swapCircle}>
              <Ionicons name="swap-horizontal" size={9} color="#FFFFFF" />
            </View>
            <Text style={[styles.langName, { color: isFirst ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]}>
              {toLang?.name}
            </Text>
          </View>
        </View>

        {/* Row 2: translated text + timestamp */}
        <View style={styles.row}>
          <Text
            style={[styles.translatedText, { color: isFirst ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.translatedText}
          </Text>
          <Text style={[styles.timeText, { color: isFirst ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>History</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#007AFF" />
      ) : history.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No translation history yet.
        </Text>
      ) : (
        <FlatList
          data={history}
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
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyText: { textAlign: 'center', marginTop: 60, fontSize: 16 },

  item: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 6,
  },
  itemHighlighted: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    marginBottom: 4,
  },
  itemPlain: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  originalText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  translatedText: {
    flex: 1,
    fontSize: 13,
  },
  timeText: {
    fontSize: 12,
    flexShrink: 0,
  },

  langPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  langName: {
    fontSize: 12,
    fontWeight: '500',
  },
  swapCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
