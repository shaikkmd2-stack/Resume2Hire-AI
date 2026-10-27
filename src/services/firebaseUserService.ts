import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserDocument } from '../firebase/schema';
import { UserProfile } from '../types';

export const firebaseUserService = {
  /**
   * Fetch user profile from /users/{uid}
   */
  async getUserProfile(uid: string): Promise<UserDocument | null> {
    if (!db || !uid) return null;
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserDocument;
  },

  /**
   * Update user profile attributes and career preferences
   */
  async updateUserProfile(
    uid: string,
    updates: Partial<UserProfile>
  ): Promise<boolean> {
    if (!db || !uid) return false;

    try {
      const userRef = doc(db, 'users', uid);
      const payload: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (updates.name !== undefined) payload.displayName = updates.name.trim();

      const prefUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) prefUpdates.title = updates.title;
      if (updates.targetRole !== undefined) prefUpdates.targetRole = updates.targetRole;
      if (updates.experienceLevel !== undefined) prefUpdates.experienceLevel = updates.experienceLevel;
      if (updates.preferredLocations !== undefined) prefUpdates.preferredLocations = updates.preferredLocations;
      if (updates.workModePreference !== undefined) prefUpdates.workModePreference = updates.workModePreference;
      if (updates.minSalaryTarget !== undefined) prefUpdates.minSalaryTarget = updates.minSalaryTarget;
      if (updates.currency !== undefined) prefUpdates.currency = updates.currency;
      if (updates.skills !== undefined) prefUpdates.skills = updates.skills;
      if (updates.bio !== undefined) prefUpdates.bio = updates.bio;
      if (updates.notificationsEnabled !== undefined) prefUpdates.notificationsEnabled = updates.notificationsEnabled;
      if (updates.autoAgentEnabled !== undefined) prefUpdates.autoAgentEnabled = updates.autoAgentEnabled;
      if (updates.humanApprovalRequired !== undefined) prefUpdates.humanApprovalRequired = updates.humanApprovalRequired;
      if (updates.atsSyncActive !== undefined) prefUpdates.atsSyncActive = updates.atsSyncActive;

      if (Object.keys(prefUpdates).length > 0) {
        // Nested updates in careerPreferences
        for (const [key, val] of Object.entries(prefUpdates)) {
          payload[`careerPreferences.${key}`] = val;
        }
      }

      await updateDoc(userRef, payload as any);
      return true;
    } catch (err) {
      console.error('[FirebaseUserService] Failed to update profile:', err);
      throw err;
    }
  },
};
