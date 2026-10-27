import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { AgentRunDocument } from '../firebase/schema';

export const firebaseAgentRunService = {
  /**
   * Log an autonomous agent run execution
   */
  async createAgentRun(
    userId: string,
    data: {
      workflowType: AgentRunDocument['workflowType'];
      actionName?: string;
      targetEntity?: string;
      relatedResumeId?: string;
      relatedJobId?: string;
    }
  ): Promise<AgentRunDocument> {
    if (!db || !userId) {
      throw new Error('Firestore uninitialized or user unauthenticated.');
    }

    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const runDoc: AgentRunDocument = {
      id: runId,
      userId,
      workflowType: data.workflowType,
      status: 'pending',
      actionName: data.actionName,
      targetEntity: data.targetEntity,
      relatedResumeId: data.relatedResumeId,
      relatedJobId: data.relatedJobId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'agentRuns', runId), runDoc);
    return runDoc;
  },

  /**
   * Update execution state and output reference
   */
  async updateAgentRun(
    runId: string,
    userId: string,
    updates: {
      status: AgentRunDocument['status'];
      resultReference?: string;
      errorMessage?: string;
    }
  ): Promise<boolean> {
    if (!db || !runId || !userId) return false;

    const runRef = doc(db, 'agentRuns', runId);
    const snap = await getDoc(runRef);
    if (!snap.exists()) return false;

    const data = snap.data() as AgentRunDocument;
    if (data.userId !== userId) {
      throw new Error('Unauthorized access to agent run record.');
    }

    await updateDoc(runRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return true;
  },

  /**
   * Retrieve all agent runs for the user
   */
  async getUserAgentRuns(userId: string): Promise<AgentRunDocument[]> {
    if (!db || !userId) return [];

    try {
      const q = query(
        collection(db, 'agentRuns'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as AgentRunDocument);
    } catch (err) {
      console.error('[FirebaseAgentRunService] Failed to load agent runs:', err);
      return [];
    }
  },
};
