import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile } from '../types';
import { UserDocument } from '../firebase/schema';

export interface AuthStateResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

/**
 * Maps a Firestore UserDocument and FirebaseUser to the application's UserProfile
 */
export function mapToUserProfile(fbUser: FirebaseUser, docData?: Partial<UserDocument>): UserProfile {
  const prefs = docData?.careerPreferences || {};
  return {
    id: fbUser.uid,
    name: docData?.displayName || fbUser.displayName || 'Executive Candidate',
    email: fbUser.email || '',
    avatarUrl: fbUser.photoURL || undefined,
    title: prefs.title || 'Senior Systems Architect',
    targetRole: prefs.targetRole || 'Lead Architect / Director of Engineering',
    experienceLevel: prefs.experienceLevel || 'Staff',
    preferredLocations: prefs.preferredLocations || ['San Francisco, CA (Hybrid)', 'New York, NY', 'Remote'],
    workModePreference: prefs.workModePreference || 'Hybrid',
    minSalaryTarget: prefs.minSalaryTarget || 220000,
    currency: prefs.currency || 'USD',
    bio: prefs.bio || '',
    skills: prefs.skills || ['Distributed Systems', 'Cloud Architecture', 'Kubernetes', 'Go', 'TypeScript'],
    notificationsEnabled: prefs.notificationsEnabled ?? true,
    autoAgentEnabled: prefs.autoAgentEnabled ?? false,
    humanApprovalRequired: prefs.humanApprovalRequired ?? true,
    atsSyncActive: prefs.atsSyncActive ?? true,
  };
}

export const firebaseAuthService = {
  /**
   * Monitor auth state transitions
   */
  subscribeToAuthState(callback: (user: UserProfile | null) => void): () => void {
    if (!auth) {
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        callback(null);
        return;
      }

      try {
        if (db) {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            callback(mapToUserProfile(fbUser, snap.data() as UserDocument));
            return;
          }
        }
        callback(mapToUserProfile(fbUser));
      } catch (err) {
        console.error('[FirebaseAuth] Error fetching user profile during state change:', err);
        callback(mapToUserProfile(fbUser));
      }
    });
  },

  /**
   * Register a new user with Email and Password
   */
  async register(
    name: string,
    email: string,
    pass: string,
    targetRole?: string
  ): Promise<AuthStateResult> {
    if (!auth || !db) {
      return { success: false, error: 'Firebase Auth is not initialized.' };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = cred.user;

      // Update auth displayName
      await updateFirebaseProfile(fbUser, { displayName: name.trim() });

      // Create user document in Firestore: /users/{uid}
      const initialUserDoc: UserDocument = {
        uid: fbUser.uid,
        displayName: name.trim(),
        email: fbUser.email || email.trim(),
        careerPreferences: {
          targetRole: targetRole || 'Lead Architect / Director of Engineering',
          title: 'Senior Systems Architect',
          experienceLevel: 'Staff',
          workModePreference: 'Hybrid',
          minSalaryTarget: 220000,
          currency: 'USD',
          notificationsEnabled: true,
          autoAgentEnabled: false,
          humanApprovalRequired: true,
          atsSyncActive: true,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', fbUser.uid), initialUserDoc);

      return {
        success: true,
        user: mapToUserProfile(fbUser, initialUserDoc),
      };
    } catch (err: unknown) {
      let message = 'Registration failed.';
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/email-already-in-use') {
          message = 'This email address is already registered. Please sign in or reset your password.';
        } else if (code === 'auth/weak-password') {
          message = 'Password is too weak. Please use at least 6 characters.';
        } else if (code === 'auth/invalid-email') {
          message = 'Please enter a valid email address.';
        } else {
          message = (err as any).message || message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      return { success: false, error: message };
    }
  },

  /**
   * Sign in with Email and Password
   */
  async login(email: string, pass: string): Promise<AuthStateResult> {
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not initialized.' };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = cred.user;

      let docData: Partial<UserDocument> = {};
      if (db) {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) {
          docData = snap.data() as UserDocument;
        }
      }

      return {
        success: true,
        user: mapToUserProfile(fbUser, docData),
      };
    } catch (err: unknown) {
      // Auto-provision initial demo account on this Firebase project if it doesn't exist yet
      if (email.trim().toLowerCase() === 'alex.chen@executive-talent.dev' && pass === 'ExecutivePass2026!') {
        console.info('[FirebaseAuth] Provisioning initial demo account on Firebase...');
        return this.register('Alex Chen', email, pass, 'Lead Architect / Director of Engineering');
      }

      let message = 'Login failed.';
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          message = 'Invalid email or password. Please verify your credentials or register.';
        } else if (code === 'auth/too-many-requests') {
          message = 'Account temporarily blocked due to too many failed attempts. Try again in a few minutes.';
        } else if (code === 'auth/invalid-email') {
          message = 'Please enter a valid email address.';
        } else {
          message = (err as any).message || message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      return { success: false, error: message };
    }
  },

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    if (!auth) return;
    await signOut(auth);
  },

  /**
   * Send Password Reset Email
   */
  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    if (!auth) {
      return { success: false, message: 'Firebase Auth is not initialized.' };
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      return {
        success: true,
        message: 'Password reset instructions have been dispatched to your email.',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to dispatch reset email.';
      return { success: false, message };
    }
  },

  /**
   * Get current auth user synchronous snapshot
   */
  getCurrentUser(): FirebaseUser | null {
    return auth ? auth.currentUser : null;
  },
};
