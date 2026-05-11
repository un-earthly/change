import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Flag } from 'react-native-country-picker-modal';
import { useTheme } from '../../contexts/ThemeContext';
import { LANGUAGES, type Language } from '../../constants/languages';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

interface LanguagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (lang: Language) => void;
  selectedCode?: string;
  title?: string;
}

export function LanguagePickerModal({
  visible,
  onClose,
  onSelect,
  selectedCode,
  title = 'Select Your language',
}: LanguagePickerModalProps) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const filteredLanguages = LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(search.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (visible) {
      setSearch('');
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: MODAL_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSelect = (lang: Language) => {
    onSelect(lang);
    onClose();
  };

  const renderItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={[styles.langItem, { borderBottomColor: colors.border }]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <Flag countryCode={item.countryCode as any} flagSize={28} withEmoji />
      <View style={styles.langInfo}>
        <Text style={[styles.langName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.langNative, { color: colors.textSecondary }]}>{item.nativeName}</Text>
      </View>
      {selectedCode === item.code && (
        <View style={[styles.checkCircle, { backgroundColor: '#007AFF' }]}>
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.background,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.handleBar}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>

        <View style={[styles.searchBox, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search language"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredLanguages}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  listContent: {
    paddingBottom: 40,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    gap: 14,
  },
  langInfo: {
    flex: 1,
  },
  langName: {
    fontSize: 16,
    fontWeight: '500',
  },
  langNative: {
    fontSize: 13,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
