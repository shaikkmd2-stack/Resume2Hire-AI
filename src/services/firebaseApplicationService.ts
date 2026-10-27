import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ApplicationDocument } from '../firebase/schema';

export const firebaseApplicationService = {
  /**
   * Submit a new job application record in Firestore: /applications/{applicationId}
   */
  async createApplication(
    userId: string,
    data: {
      jobId: string;
      resumeId: string;
      jobTitle?: string;
      company?: string;
      location?: string;
      externalApplicationUrl?: string;
      notes?: string;
    }
  ): Promise<ApplicationDocument> {
    if (!db || !userId) {
      throw new Error('Firestore not initialized or user unauthenticated.');
    }

    if (!data.jobId || !data.resumeId) {
      throw new Error('jobId and resumeId are required to record an application.');
    }

    const applicationId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const applicationDoc: ApplicationDocument = {
      id: applicationId,
      userId,
      jobId: data.jobId,
      resumeId: data.resumeId,
      status: 'submitted',
      applicationDate: nowIso,
      externalApplicationUrl: data.externalApplicationUrl || '',
      jobTitle: data.jobTitle,
      company: data.company,
      location: data.location,
      notes: data.notes || '',
      activityHistory: [
        {
          timestamp: nowIso,
          action: 'Application Dispatched',
          note: 'Packet submitted via Resume2Hire pipeline.',
        },
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'applications', applicationId), applicationDoc);
    return applicationDoc;
  },

  /**
   * Retrieve all applications belonging to the user
   */
  async getUserApplications(userId: string): Promise<ApplicationDocument[]> {
    if (!db || !userId) return [];

    try {
      const q = query(
        collection(db, 'applications'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as ApplicationDocument);
    } catch (err) {
      console.error('[FirebaseApplicationService] Failed to load applications:', err);
      return [];
    }
  },

  /**
   * Update application lifecycle status and record activity history entry
   */
  async updateApplicationStatus(
    applicationId: string,
    userId: string,
    newStatus: ApplicationDocument['status'],
    note?: string
  ): Promise<boolean> {
    if (!db || !applicationId || !userId) return false;

    const appRef = doc(db, 'applications', applicationId);
    const snap = await getDoc(appRef);
    if (!snap.exists()) return false;

    const currentData = snap.data() as ApplicationDocument;
    if (currentData.userId !== userId) {
      throw new Error('Unauthorized: cannot modify application of another user.');
    }

    const newHistory = [
      ...(currentData.activityHistory || []),
      {
        timestamp: new Date().toISOString(),
        action: `Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`,
        note: note || undefined,
      },
    ];

    await updateDoc(appRef, {
      status: newStatus,
      activityHistory: newHistory,
      updatedAt: serverTimestamp(),
    });

    return true;
  },

  /**
   * Delete an application with strict ownership validation
   */
  async deleteApplication(applicationId: string, userId: string): Promise<boolean> {
    if (!db || !applicationId || !userId) return false;

    const snap = await getDoc(doc(db, 'applications', applicationId));
    if (!snap.exists()) return false;
    if (snap.data()?.userId !== userId) {
      throw new Error('Unauthorized deletion attempt.');
    }

    await deleteDoc(doc(db, 'applications', applicationId));
    return true;
  },
};
