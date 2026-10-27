import { JobApplication } from '../types';
import { INITIAL_APPLICATIONS } from './mockData';
import { API_CONFIG } from './apiConfig';
import { auth } from '../firebase/config';
import { firebaseApplicationService } from './firebaseApplicationService';

export const applicationService = {
  /**
   * Get all tracked applications for current user
   */
  async getApplications(): Promise<JobApplication[]> {
    if (API_CONFIG.isMockMode || !auth?.currentUser) {
      return [...INITIAL_APPLICATIONS];
    }

    try {
      const docs = await firebaseApplicationService.getUserApplications(auth.currentUser.uid);
      return docs.map((docItem) => ({
        id: docItem.id,
        jobId: docItem.jobId,
        jobTitle: docItem.jobTitle || 'Software Engineer',
        company: docItem.company || 'Enterprise Partner',
        location: docItem.location || 'Remote',
        salary: '$140,000 - $190,000',
        sourceATS: 'Direct',
        appliedDate: typeof docItem.applicationDate === 'string'
          ? docItem.applicationDate.split('T')[0]
          : 'Recent',
        lastUpdated: 'Recently updated',
        status: docItem.status,
        matchScore: 90,
        nextStep: 'Awaiting recruiter screening',
        agentExecuted: true,
        notes: docItem.notes,
      }));
    } catch (err) {
      console.warn('[ApplicationService] Error fetching applications from Firestore:', err);
      return [];
    }
  },

  /**
   * Add a new application to the tracker and persist in Firestore
   */
  async createApplication(appData: Omit<JobApplication, 'id' | 'appliedDate' | 'lastUpdated'>): Promise<JobApplication> {
    const newApp: JobApplication = {
      ...appData,
      id: `app_${Date.now()}`,
      appliedDate: new Date().toISOString().split('T')[0],
      lastUpdated: 'Just now',
    };

    if (!API_CONFIG.isMockMode && auth?.currentUser) {
      try {
        const created = await firebaseApplicationService.createApplication(auth.currentUser.uid, {
          jobId: appData.jobId,
          resumeId: 'res_primary',
          jobTitle: appData.jobTitle,
          company: appData.company,
          location: appData.location,
          notes: appData.notes,
        });
        newApp.id = created.id;
      } catch (err) {
        console.warn('[ApplicationService] Failed to persist application to Firestore:', err);
      }
    }

    INITIAL_APPLICATIONS.unshift(newApp);
    return newApp;
  },

  /**
   * Update application status in Firestore
   */
  async updateStatus(id: string, status: JobApplication['status'], nextStep?: string): Promise<JobApplication | null> {
    if (!API_CONFIG.isMockMode && auth?.currentUser) {
      try {
        await firebaseApplicationService.updateApplicationStatus(
          id,
          auth.currentUser.uid,
          status,
          nextStep
        );
      } catch (err) {
        console.warn('[ApplicationService] Failed to update application in Firestore:', err);
      }
    }

    const item = INITIAL_APPLICATIONS.find((a) => a.id === id);
    if (item) {
      item.status = status;
      item.lastUpdated = 'Just now';
      if (nextStep) item.nextStep = nextStep;
      return item;
    }
    return null;
  },
};
