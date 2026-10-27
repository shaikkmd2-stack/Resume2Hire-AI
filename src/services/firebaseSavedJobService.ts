import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { SavedJobDocument } from '../firebase/schema';

export const firebaseSavedJobService = {
  /**
   * Deterministic composite ID to prevent duplicate submissions (Section 8)
   */
  getSavedJobDocId(userId: string, jobId: string): string {
    return `${userId}_${jobId}`;
  },

  /**
   * Bookmark a job for the user
   */
  async saveJob(userId: string, jobId: string): Promise<boolean> {
    if (!db || !userId || !jobId) return false;

    const docId = this.getSavedJobDocId(userId, jobId);
    const docRef = doc(db, 'savedJobs', docId);

    const data: SavedJobDocument = {
      id: docId,
      userId,
      jobId,
      createdAt: serverTimestamp(),
    };

    await setDoc(docRef, data);
    return true;
  },

  /**
   * Remove a job from user's saved list
   */
  async removeSavedJob(userId: string, jobId: string): Promise<boolean> {
    if (!db || !userId || !jobId) return false;

    const docId = this.getSavedJobDocId(userId, jobId);
    await deleteDoc(doc(db, 'savedJobs', docId));
    return true;
  },

  /**
   * Check if a job is saved by the user
   */
  async isJobSaved(userId: string, jobId: string): Promise<boolean> {
    if (!db || !userId || !jobId) return false;

    const docId = this.getSavedJobDocId(userId, jobId);
    const snap = await getDoc(doc(db, 'savedJobs', docId));
    return snap.exists();
  },

  /**
   * Fetch all saved job IDs for the user
   */
  async getUserSavedJobIds(userId: string): Promise<string[]> {
    if (!db || !userId) return [];

    try {
      const q = query(
        collection(db, 'savedJobs'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => (d.data() as SavedJobDocument).jobId);
    } catch (err) {
      console.error('[FirebaseSavedJobService] Failed to load saved jobs:', err);
      return [];
    }
  },
};
