import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LANGUAGES } from '../../constants/languages';

export function ChangeLanguageScreen({ navigation }: any) {
  const { user, updateUserProfile } = useAuth();
  const { colors } = useTheme();
  const currentLang = user?.preferredLanguage || 'en';

  const selectLanguage = async (code: string) => {
    await updateUserProfile({ preferredLanguage: code });
    navigation.goBack();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Change Language</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.list}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.item, { borderBottomColor: colors.border }]}
            onPress={() => selectLanguage(lang.code)}
          >
            <Text style={[styles.langName, { color: colors.text }]}>{lang.name}</Text>
            {currentLang === lang.code && <Text style={{ color: '#007AFF', fontSize: 18 }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>
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
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  langName: {
    fontSize: 16,
  },
});
