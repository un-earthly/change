import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
// @ts-expect-error getReactNativePersistence is exported from the RN build but TS types may resolve to web
import { getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBqdD8rWxUThfHgNGQo2tTEeyEI4CwidxY",
  authDomain: "unbounded-4b73f.firebaseapp.com",
  projectId: "unbounded-4b73f",
  storageBucket: "unbounded-4b73f.firebasestorage.app",
  messagingSenderId: "662747509252",
  appId: "1:662747509252:web:6e61d1c671612d8f5bfb51",
  measurementId: "G-HW2ZL6E8QM"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
