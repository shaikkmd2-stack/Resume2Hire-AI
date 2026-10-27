import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

/**
 * Firebase Client Configuration
 * Loaded securely from Vite environment variables (VITE_FIREBASE_*)
 */
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  const globalObj = globalThis as any;
  if (globalObj.process?.env?.[key]) {
    return globalObj.process.env[key];
  }
  return '';
};

const rawStorageBucket = getEnvVar('VITE_FIREBASE_STORAGE_BUCKET').trim().replace(/^gs:\/\//, '').replace(/\/+$/, '');
const projectId = getEnvVar('VITE_FIREBASE_PROJECT_ID');

export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId,
  storageBucket: rawStorageBucket || (projectId ? `${projectId}.firebasestorage.app` : ''),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
};

/**
 * Verify whether mandatory Firebase credentials are provided
 */
export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'AIzaSyYourFirebaseApiKeyHere' &&
    firebaseConfig.projectId &&
    firebaseConfig.authDomain
  );
};

// Singleton instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Initialize Storage if bucket is configured
    if (firebaseConfig.storageBucket) {
      try {
        storage = getStorage(app);
      } catch (storageErr) {
        console.warn('[Firebase] Storage initialization deferred or unavailable:', storageErr);
      }
    }

    // Initialize Analytics if supported in this browser environment
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {
        // Safe silence for environments without IndexedDB/cookies
      });
    }

    console.info('[Firebase] Successfully initialized Firebase backend services for project:', firebaseConfig.projectId);
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
  }
} else {
  console.warn('[Firebase] Configuration missing or using placeholders. Operating in graceful fallback mode.');
}

export { app, auth, db, storage, analytics };
