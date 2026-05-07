import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export function ChangePasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 1500);
    }, 1000);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {success ? (
          <View style={styles.successBox}>
            <Text style={{ fontSize: 48 }}>✅</Text>
            <Text style={[styles.successTitle, { color: colors.text }]}>Password Changed!</Text>
          </View>
        ) : (
          <>
            <Input label="Old Password" placeholder="Enter old password" value={oldPassword} onChangeText={setOldPassword} secureTextEntry />
            <Input label="New Password" placeholder="Enter new password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <Input label="Confirm Password" placeholder="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={{ marginTop: 24 }}>
              <Button title="Change Password" onPress={handleChange} loading={loading} />
            </View>
          </>
        )}
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
  content: {
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
});
