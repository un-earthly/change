import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';
import { useTheme } from '../../contexts/ThemeContext';
import { getLanguageByCode } from '../../constants/languages';
import { getTestPhrase } from '../../constants/phrases';
import { Button } from '../../components/common/Button';

export function VoiceVerificationScreen({ route, navigation }: any) {
  const { languageCode, onVerified } = route.params || {};
  const { colors } = useTheme();
  const lang = getLanguageByCode(languageCode);
  const phrase = getTestPhrase(languageCode);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recordState = useAudioRecorderState(recorder, 100);

  const [hasRecorded, setHasRecorded] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([
    new Animated.Value(4),
    new Animated.Value(8),
    new Animated.Value(6),
    new Animated.Value(10),
    new Animated.Value(5),
  ]).current;

  useEffect(() => {
    setupAudio();
  }, []);

  useEffect(() => {
    if (recordState.isRecording) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      pulseAnim.setValue(1);
      waveAnims.forEach((a) => a.setValue(4));
    }
  }, [recordState.isRecording]);

  const setupAudio = async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      const { granted } = await requestRecordingPermissionsAsync();
      setPermissionGranted(granted);
      if (!granted) {
        Alert.alert('Permission needed', 'Please allow microphone access to record.');
      }
    } catch (err) {
      console.error('Audio setup failed:', err);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    waveAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 20 + Math.random() * 15,
            duration: 400 + index * 100,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 6 + Math.random() * 8,
            duration: 400 + index * 100,
            useNativeDriver: false,
          }),
        ])
      ).start();
    });
  };

  const handleMicPress = async () => {
    if (!permissionGranted) {
      Alert.alert('Permission needed', 'Please allow microphone access in settings.');
      return;
    }

    if (recordState.isRecording) {
      recorder.stop();
      setHasRecorded(true);
    } else {
      try {
        await recorder.prepareToRecordAsync();
        recorder.record();
      } catch (err) {
        console.error('Failed to start recording:', err);
      }
    }
  };

  const handleContinue = () => {
    if (onVerified) {
      onVerified();
    }
    navigation.goBack();
  };

  const isRecording = recordState.isRecording;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 24, color: colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select Your language</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.langBadge, { backgroundColor: colors.surface }]}>
          <Text style={{ fontSize: 20 }}>{lang?.flag}</Text>
          <Text style={[styles.langName, { color: colors.text }]}>{lang?.name}</Text>
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>As You have Selected</Text>
        <Text style={[styles.langQuote, { color: colors.text }]}>"{lang?.name}"</Text>

        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
          Tap the below Button &{'\n'}Please Say the below Line{'\n'}in "{lang?.name}" clearly
        </Text>

        <View style={styles.phraseBox}>
          <Text style={[styles.phraseText, { color: colors.text }]}>{phrase}</Text>
        </View>

        {isRecording && (
          <View style={styles.waveContainer}>
            {waveAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    backgroundColor: '#007AFF',
                    height: anim,
                  },
                ]}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleMicPress}
          style={styles.micButtonContainer}
        >
          <Animated.View
            style={[
              styles.micPulse,
              {
                backgroundColor: 'rgba(0,122,255,0.2)',
                transform: [{ scale: pulseAnim }],
                opacity: isRecording ? 1 : 0,
              },
            ]}
          />
          <View style={[styles.micButton, { backgroundColor: isRecording ? '#007AFF' : colors.surface }]}>
            <Text style={{ fontSize: 28 }}>{isRecording ? '⏹' : '🎤'}</Text>
          </View>
        </TouchableOpacity>

        {hasRecorded && !isRecording && (
          <Text style={[styles.successText, { color: '#34C759' }]}>✓ Voice captured!</Text>
        )}

        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {isRecording
            ? 'Recording... tap to stop'
            : hasRecorded
            ? 'Tap mic to re-record'
            : 'Tap mic to start recording'}
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title={hasRecorded ? 'Continue' : 'Skip for Now'}
          onPress={handleContinue}
          variant={hasRecorded ? 'primary' : 'secondary'}
        />
      </View>
    </View>
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
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  langName: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  langQuote: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  phraseBox: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 32,
  },
  phraseText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 34,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 40,
    marginBottom: 20,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  micButtonContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  micPulse: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
});
