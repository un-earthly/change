import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Set up foreground notification handler
notifee.onForegroundEvent(({ type, detail }) => {});

export async function registerForPushNotifications(uid: string): Promise<void> {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (!enabled) return;

  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'default',
      name: 'Default',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });
  }

  const token = await messaging().getToken();
  await updateDoc(doc(db, 'users', uid), {
    pushToken: token,
    pushPlatform: Platform.OS,
  });
}

const FCM_NOTIFY_URL = process.env.EXPO_PUBLIC_NOTIFY_URL ?? '';

export async function sendPushNotification(
  recipientUid: string,
  senderName: string,
  messageText: string,
  conversationId: string,
): Promise<void> {
  if (!FCM_NOTIFY_URL) return;
  try {
    const userSnap = await getDoc(doc(db, 'users', recipientUid));
    if (!userSnap.exists()) return;
    const { pushToken, pushPlatform } = userSnap.data() ?? {};
    if (!pushToken) return;
    await fetch(FCM_NOTIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: pushToken,
        platform: pushPlatform ?? 'android',
        title: senderName,
        body: messageText,
        data: { conversationId },
      }),
    });
  } catch {}
}
