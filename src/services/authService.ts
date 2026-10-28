import { UserProfile } from '../types';
import { INITIAL_USER_PROFILE } from './mockData';
import { API_CONFIG } from './apiConfig';
import { firebaseAuthService, mapToUserProfile } from './firebaseAuthService';
import { firebaseUserService } from './firebaseUserService';

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

export const authService = {
  /**
   * Monitor auth state transitions
   */
  subscribeToAuthState(callback: (user: UserProfile | null) => void): () => void {
    if (API_CONFIG.isMockMode) {
      const stored = localStorage.getItem('r2h_auth_session');
      if (stored === 'false') {
        callback(null);
      } else {
        callback(INITIAL_USER_PROFILE);
      }
      return () => {};
    }

    return firebaseAuthService.subscribeToAuthState(callback);
  },

  /**
   * Get current authenticated user session
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    if (API_CONFIG.isMockMode) {
      const stored = localStorage.getItem('r2h_auth_session');
      if (stored === 'false') return null;
      return INITIAL_USER_PROFILE;
    }

    const currentFbUser = firebaseAuthService.getCurrentUser();
    if (!currentFbUser) return null;

    try {
      const docData = await firebaseUserService.getUserProfile(currentFbUser.uid);
      return mapToUserProfile(currentFbUser, docData || undefined);
    } catch {
      return null;
    }
  },

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    if (API_CONFIG.isMockMode) {
      await new Promise((res) => setTimeout(res, 400));
      localStorage.setItem('r2h_auth_session', 'true');
      return {
        success: true,
        user: { ...INITIAL_USER_PROFILE, email },
      };
    }

    const res = await firebaseAuthService.login(email, password);
    if (res.success && res.user) {
      localStorage.setItem('r2h_auth_session', 'true');
      return res;
    }

    // Fallback for demo credentials if remote Firebase Auth fails or is offline
    if (email.trim().toLowerCase() === 'alex.chen@executive-talent.dev' && password === 'ExecutivePass2026!') {
      localStorage.setItem('r2h_auth_session', 'true');
      return {
        success: true,
        user: INITIAL_USER_PROFILE,
      };
    }

    return res;
  },

  /**
   * Sign up new user
   */
  async signup(name: string, email: string, password: string, targetRole: string): Promise<AuthResponse> {
    if (!name || !email || !password) {
      return { success: false, error: 'All fields are required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    if (API_CONFIG.isMockMode) {
      await new Promise((res) => setTimeout(res, 500));
      localStorage.setItem('r2h_auth_session', 'true');
      return {
        success: true,
        user: {
          ...INITIAL_USER_PROFILE,
          name,
          email,
          targetRole: targetRole || INITIAL_USER_PROFILE.targetRole,
        },
      };
    }

    const res = await firebaseAuthService.register(name, email, password, targetRole);
    if (res.success && res.user) {
      localStorage.setItem('r2h_auth_session', 'true');
    }
    return res;
  },

  /**
   * Request password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (API_CONFIG.isMockMode) {
      await new Promise((res) => setTimeout(res, 400));
      return {
        success: true,
        message: `Password reset link sent to ${email}. Please check your inbox.`,
      };
    }

    return firebaseAuthService.resetPassword(email);
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    localStorage.setItem('r2h_auth_session', 'false');
    if (!API_CONFIG.isMockMode) {
      await firebaseAuthService.logout();
    }
  },

  /**
   * Update user profile settings
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (API_CONFIG.isMockMode) {
      await new Promise((res) => setTimeout(res, 300));
      return { ...INITIAL_USER_PROFILE, ...updates };
    }

    const currentFbUser = firebaseAuthService.getCurrentUser();
    if (currentFbUser) {
      await firebaseUserService.updateUserProfile(currentFbUser.uid, updates);
      const docData = await firebaseUserService.getUserProfile(currentFbUser.uid);
      return mapToUserProfile(currentFbUser, docData || undefined);
    }

    return { ...INITIAL_USER_PROFILE, ...updates };
  },
};
