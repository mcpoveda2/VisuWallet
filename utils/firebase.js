import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithCredential, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Read Firebase config from environment variables (EXPO_PUBLIC_*)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function ensureAnonymousSignIn() {
  try {
    if (!auth.currentUser) {
      const res = await signInAnonymously(auth);
      return res.user;
    }
    return auth.currentUser;
  } catch (e) {
    console.error('Failed to sign in anonymously', e);
    return null;
  }
}
// Anonymous sign-in removed per project policy.
/**
 * Sign in with Google using Expo AuthSession and Firebase Auth.
 * Requires setting EXPO_PUBLIC_GOOGLE_CLIENT_ID (web) and/or platform client IDs in env.
 * Returns the Firebase user on success or null on failure.
 */
async function signInWithGoogle() {
  try {
    // Use the web client id by default (set in app env)
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('EXPO_PUBLIC_GOOGLE_CLIENT_ID not set in environment');
      return null;
    }

    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
    const scopes = ['openid', 'profile', 'email'];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=${encodeURIComponent(
      scopes.join(' ')
    )}&nonce=${encodeURIComponent('nonce')}`;

    let result;
    if (typeof AuthSession.startAsync === 'function') {
      result = await AuthSession.startAsync({ authUrl });
    } else {
      // Fallback: open auth session with expo-web-browser and parse returned url
      const webRes = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      if (webRes.type === 'success' && webRes.url) {
        // extract params from fragment or querystring
        const raw = webRes.url;
        const hashOrQuery = raw.split('#')[1] || raw.split('?')[1] || '';
        const params = new URLSearchParams(hashOrQuery);
        result = { type: webRes.type, params: Object.fromEntries(params.entries()) };
      } else {
        result = { type: webRes.type };
      }
    }

    if (result.type === 'success' && result.params && result.params.id_token) {
      const idToken = result.params.id_token;
      const credential = GoogleAuthProvider.credential(idToken);
      const userCred = await signInWithCredential(auth, credential);
      return userCred.user;
    }

    console.warn('Google sign-in cancelled or failed', result);
    return null;
  } catch (e) {
    console.error('signInWithGoogle failed', e);
    return null;
  }
}

export default app;
async function signUpWithEmail(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (e) {
    console.error('signUpWithEmail failed', e);
    throw e;
  }
}

async function signInWithEmail(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (e) {
    console.error('signInWithEmail failed', e);
    throw e;
  }
}

export { db, auth, signInWithGoogle, signUpWithEmail, signInWithEmail };

async function signOutUser() {
  try {
    await signOut(auth);
    return true;
  } catch (e) {
    console.error('signOut failed', e);
    throw e;
  }
}

export { signOutUser };