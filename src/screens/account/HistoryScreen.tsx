import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getLanguageByCode } from '../../constants/languages';
import { getUserMessages, type Message } from '../../services/firestore';

export function HistoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserMessages(user.uid).then((msgs) => {
      setHistory(msgs);
      setLoading(false);
    });
  }, [user]);

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#007AFF" />
      ) : (
        <View style={styles.list}>
          {history.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No translation history yet.
            </Text>
          ) : (
            history.map((item) => {
              const fromLang = getLanguageByCode(item.sourceLanguage);
              const toLang = getLanguageByCode(item.targetLanguage);
              return (
                <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                  <View style={styles.langRow}>
                    <View style={[styles.langBadge, { backgroundColor: colors.surface }]}>
                      <Text style={{ fontSize: 12 }}>{fromLang?.flag}</Text>
                      <Text style={[styles.langText, { color: colors.text }]}>{fromLang?.name}</Text>
                    </View>
                    <Text style={{ color: colors.textSecondary }}>→</Text>
                    <View style={[styles.langBadge, { backgroundColor: colors.surface }]}>
                      <Text style={{ fontSize: 12 }}>{toLang?.flag}</Text>
                      <Text style={[styles.langText, { color: colors.text }]}>{toLang?.name}</Text>
                    </View>
                  </View>
                  <Text style={[styles.original, { color: colors.text }]}>{item.originalText}</Text>
                  <Text style={[styles.translated, { color: colors.textSecondary }]}>{item.translatedText}</Text>
                  <Text style={[styles.time, { color: colors.textSecondary }]}>{formatTime(item.createdAt)}</Text>
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  langText: {
    fontSize: 13,
    fontWeight: '500',
  },
  original: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  translated: {
    fontSize: 14,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
  },
});
