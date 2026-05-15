import { useState } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

GoogleSignin.configure({
  webClientId: '662747509252-chveu1qg263g4ph50v55s7kdfjpuc08v.apps.googleusercontent.com',
});

export function useGoogleAuth() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const promptAsync = async () => {
    setError('');
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No ID token received');
      const credential = GoogleAuthProvider.credential(idToken);
      await loginWithGoogle(credential);
    } catch (err: any) {
      if (err.code !== statusCodes.SIGN_IN_CANCELLED) {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return { promptAsync, loading, error };
  
}
