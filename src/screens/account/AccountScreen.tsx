import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Routes } from '../../constants/routes';

export function AccountScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { section: 'ACCOUNT INFORMATION', items: [
      { label: 'Personal Information', icon: '📝', screen: Routes.PersonalInfo },
      { label: 'History', icon: '📜', screen: Routes.History },
    ]},
    { section: 'ACCOUNT SECURITY', items: [
      { label: 'Change Password', icon: '🔒', screen: Routes.ChangePassword },
    ]},
    { section: 'APPLICATION SETTING', items: [
      { label: 'Preferred Language', icon: '🌐', value: user?.preferredLanguage || 'English', screen: Routes.ChangeLanguage },
      { label: 'Theme', icon: '🎨', value: 'Light', screen: Routes.ChangeTheme },
    ]},
  ];

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
          <Text style={{ fontSize: 36 }}>👤</Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.displayName || 'User'}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
      </View>

      {menuItems.map((section) => (
        <View key={section.section} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.section}</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {section.items.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  idx < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={() => navigation.navigate(item.screen)}
              >
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                {'value' in item && item.value ? <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{item.value}</Text> : null}
                <Text style={{ color: colors.textSecondary }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={[styles.logoutItem, { borderBottomColor: colors.border }]} onPress={() => setShowLogoutModal(true)}>
        <Text style={{ fontSize: 18 }}>🚪</Text>
        <Text style={[styles.logoutText, { color: '#FF3B30' }]}>Logout</Text>
        <Text style={{ color: colors.textSecondary }}>›</Text>
      </TouchableOpacity>

      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Are you sure you want to leave?</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              You must log in again if you want to use this application.
            </Text>
            <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: '#FF3B30' }]} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLogoutModal(false)}>
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>No, Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  profile: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
  },
  menuValue: {
    fontSize: 14,
    marginRight: 4,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 40,
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  logoutBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
