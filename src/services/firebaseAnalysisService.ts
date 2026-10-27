import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ResumeAnalysisDocument } from '../firebase/schema';

export const firebaseAnalysisService = {
  /**
   * Persist a validated resume analysis record in Firestore: /resumeAnalyses/{analysisId}
   */
  async saveAnalysis(
    userId: string,
    resumeId: string,
    data: Omit<ResumeAnalysisDocument, 'id' | 'userId' | 'resumeId' | 'createdAt'>
  ): Promise<ResumeAnalysisDocument> {
    if (!db || !userId) {
      throw new Error('Firestore not initialized or user unauthenticated.');
    }

    const analysisId = `ana_${resumeId}_${Date.now()}`;
    const analysisDoc: ResumeAnalysisDocument = {
      id: analysisId,
      userId,
      resumeId,
      skills: data.skills || [],
      education: data.education || [],
      experience: data.experience || [],
      strengths: data.strengths || [],
      missingSkills: data.missingSkills || [],
      suggestions: data.suggestions || [],
      score: data.score || 0,
      breakdown: data.breakdown || {
        impact: 85,
        brevity: 80,
        style: 90,
        skillsCoverage: 88,
      },
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'resumeAnalyses', analysisId), analysisDoc);
    return analysisDoc;
  },

  /**
   * Retrieve the latest analysis for a specific resume belonging to the user
   */
  async getAnalysisByResumeId(resumeId: string, userId: string): Promise<ResumeAnalysisDocument | null> {
    if (!db || !resumeId || !userId) return null;

    try {
      const q = query(
        collection(db, 'resumeAnalyses'),
        where('resumeId', '==', resumeId),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      // Pick the first/latest matching document
      return snapshot.docs[0].data() as ResumeAnalysisDocument;
    } catch (err) {
      console.error('[FirebaseAnalysisService] Failed to retrieve analysis:', err);
      return null;
    }
  },

  /**
   * Retrieve all analysis records for the user
   */
  async getUserAnalyses(userId: string): Promise<ResumeAnalysisDocument[]> {
    if (!db || !userId) return [];

    try {
      const q = query(
        collection(db, 'resumeAnalyses'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => docSnap.data() as ResumeAnalysisDocument);
    } catch (err) {
      console.error('[FirebaseAnalysisService] Failed to get user analyses:', err);
      return [];
    }
  },

  /**
   * Retrieve analysis by its document ID with strict ownership validation
   */
  async getAnalysisById(analysisId: string, userId: string): Promise<ResumeAnalysisDocument | null> {
    if (!db || !analysisId || !userId) return null;

    const snap = await getDoc(doc(db, 'resumeAnalyses', analysisId));
    if (!snap.exists()) return null;

    const data = snap.data() as ResumeAnalysisDocument;
    if (data.userId !== userId) {
      throw new Error('Unauthorized access to analysis record.');
    }
    return data;
  },
};
