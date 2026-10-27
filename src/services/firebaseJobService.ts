import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  limit,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { JobDocument } from '../firebase/schema';
import { INITIAL_JOBS } from './mockData';

export const firebaseJobService = {
  /**
   * List jobs from Firestore /jobs collection
   */
  async listJobs(maxResults = 50): Promise<JobDocument[]> {
    if (!db) return [];

    try {
      const q = query(collection(db, 'jobs'), limit(maxResults));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // If empty in development, seed initial sample jobs
        await this.seedSampleJobsIfEmpty();
        const recheck = await getDocs(q);
        return recheck.docs.map((d) => d.data() as JobDocument);
      }

      return snapshot.docs.map((d) => d.data() as JobDocument);
    } catch (err) {
      console.warn('[FirebaseJobService] Failed to load jobs from Firestore:', err);
      return [];
    }
  },

  /**
   * Fetch single job by ID
   */
  async getJobById(jobId: string): Promise<JobDocument | null> {
    if (!db || !jobId) return null;
    const snap = await getDoc(doc(db, 'jobs', jobId));
    if (!snap.exists()) return null;
    return snap.data() as JobDocument;
  },

  /**
   * Seeds verified and demo job records if the collection is empty.
   * Clearly flags demo jobs as requested in Section 8.
   */
  async seedSampleJobsIfEmpty(): Promise<void> {
    if (!db) return;

    try {
      const existing = await getDocs(query(collection(db, 'jobs'), limit(1)));
      if (!existing.empty) return;

      console.info('[FirebaseJobService] Seeding initial job directory in Firestore...');
      for (const mockJob of INITIAL_JOBS) {
        const jobDoc: JobDocument = {
          id: mockJob.id,
          title: mockJob.title,
          company: mockJob.company,
          location: mockJob.location,
          description: mockJob.description || '',
          requiredSkills: mockJob.requirements || mockJob.matchedSkills || [],
          experienceLevel: 'Senior / Staff',
          salaryInformation: {
            range: mockJob.salaryRange,
            min: mockJob.salaryMin,
            max: mockJob.salaryMax,
            currency: 'USD',
          },
          source: mockJob.sourceATS || 'Verified',
          externalApplicationUrl: mockJob.externalUrl || 'https://jobs.lever.co/example',
          workMode: mockJob.workMode,
          department: mockJob.department,
          responsibilities: mockJob.responsibilities || [],
          requirements: mockJob.requirements || [],
          niceToHaves: mockJob.niceToHaves || [],
          benefits: mockJob.benefits || [],
          isDemoJob: mockJob.id.includes('demo') || false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'jobs', mockJob.id), jobDoc);
      }
      console.info('[FirebaseJobService] Seed completed successfully.');
    } catch (err) {
      console.warn('[FirebaseJobService] Job seeding skipped or restricted by security rules:', err);
    }
  },
};
