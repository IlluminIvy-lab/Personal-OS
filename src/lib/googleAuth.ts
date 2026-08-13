import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider with all requested Google Workspace scopes
export const WORKSPACE_SCOPES = [
  // Google Contacts (People API)
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/user.emails.read',
  'https://www.googleapis.com/auth/user.phonenumbers.read',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',

  // Gmail API
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',

  // Google Tasks API
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',

  // Google Picker & Drive API
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.readonly',

  // Google Calendar API
  'https://www.googleapis.com/auth/calendar.events',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});

// Prompt for consent to ensure refresh/re-selection if needed
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;
// Cache the access token in memory (never localStorage per security rules)
let cachedAccessToken: string | null = null;
let currentUser: User | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    currentUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve access token from Google Sign-In');
    }

    cachedAccessToken = credential.accessToken;
    currentUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: any) {
    console.warn('Google sign-in error:', err);
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      throw new Error(
        'The Google Sign-In popup was closed before completing authorization. Please click Connect again and select your Google account in the popup window.'
      );
    }
    if (err.code === 'auth/popup-blocked') {
      throw new Error(
        'Google Sign-In popup was blocked by your browser. Please allow popups for this site or open the app in a new browser tab.'
      );
    }
    if (err.code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
      throw new Error(
        `Unauthorized Domain (${host}): To allow Google Sign-In on Render, add '${host}' to Firebase Auth -> Authorized Domains.`
      );
    }
    throw err;
  } finally {
    isSigningIn = false;
  }
};

// Aliases for compatibility
export const googleCalendarSignIn = googleSignIn;

export const googleSignOut = async () => {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  cachedAccessToken = null;
  currentUser = null;
};

export const logout = googleSignOut;

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCachedToken = (): string | null => {
  return cachedAccessToken;
};

export const getCurrentUser = (): User | null => {
  return currentUser || auth.currentUser;
};
