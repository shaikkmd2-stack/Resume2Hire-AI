import { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * 1. users collection: /users/{uid}
 */
export interface UserDocument {
  uid: string;
  displayName: string;
  email: string;
  careerPreferences: {
    targetRole?: string;
    title?: string;
    experienceLevel?: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Staff' | 'Principal' | 'Executive';
    preferredLocations?: string[];
    workModePreference?: 'Remote' | 'Hybrid' | 'Onsite' | 'Any';
    minSalaryTarget?: number;
    currency?: string;
    skills?: string[];
    bio?: string;
    notificationsEnabled?: boolean;
    autoAgentEnabled?: boolean;
    humanApprovalRequired?: boolean;
    atsSyncActive?: boolean;
  };
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

/**
 * 2. resumes collection: /resumes/{resumeId}
 */
export interface ResumeDocument {
  id: string;
  userId: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  storagePath?: string;
  downloadUrl?: string;
  status: 'uploaded' | 'processing' | 'analyzed' | 'failed';
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

/**
 * 3. resumeAnalyses collection: /resumeAnalyses/{analysisId}
 */
export interface ResumeAnalysisDocument {
  id: string;
  userId: string;
  resumeId: string;
  skills: Array<{
    name: string;
    category: string;
    proficiency: string;
    highlighted?: boolean;
  }> | string[];
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    year: string;
  }>;
  experience: Array<{
    id: string;
    title: string;
    company: string;
    period: string;
    location: string;
    bullets: string[];
    skillsUsed: string[];
  }>;
  strengths: string[];
  missingSkills: string[];
  suggestions: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    severity: 'High' | 'Medium' | 'Low';
  }>;
  score: number; // Overall ATS / quality score
  breakdown?: {
    impact: number;
    brevity: number;
    style: number;
    skillsCoverage: number;
  };
  createdAt: Timestamp | FieldValue;
}

/**
 * 4. jobs collection: /jobs/{jobId}
 */
export interface JobDocument {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  salaryInformation?: {
    range?: string;
    min?: number;
    max?: number;
    currency?: string;
  } | string;
  source: string; // e.g. 'Greenhouse' | 'Lever' | 'Ashby' | 'Workday' | 'Direct' | 'Verified'
  externalApplicationUrl?: string;
  workMode?: 'Remote' | 'Hybrid' | 'Onsite';
  department?: string;
  responsibilities?: string[];
  requirements?: string[];
  niceToHaves?: string[];
  benefits?: string[];
  isDemoJob?: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

/**
 * 5. jobMatches collection: /jobMatches/{matchId}
 */
export interface JobMatchDocument {
  id: string;
  userId: string;
  resumeId: string;
  jobId: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
  createdAt: Timestamp | FieldValue;
}

/**
 * 6. savedJobs collection: /savedJobs/{userId_jobId}
 */
export interface SavedJobDocument {
  id: string;
  userId: string;
  jobId: string;
  createdAt: Timestamp | FieldValue;
}

/**
 * 7. applications collection: /applications/{applicationId}
 */
export interface ApplicationDocument {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string;
  status: 'submitted' | 'under_review' | 'interviewing' | 'offer' | 'archived';
  applicationDate: Timestamp | FieldValue | string;
  externalApplicationUrl?: string;
  activityHistory: Array<{
    timestamp: string;
    action: string;
    note?: string;
  }>;
  jobTitle?: string;
  company?: string;
  location?: string;
  notes?: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

/**
 * 8. agentRuns collection: /agentRuns/{runId}
 */
export interface AgentRunDocument {
  id: string;
  userId: string;
  workflowType: 'resume_analysis' | 'job_match' | 'ats_dispatch' | 'vector_search' | 'diff_optimization' | 'gate_approval';
  status: 'pending' | 'running' | 'completed' | 'failed';
  relatedResumeId?: string;
  relatedJobId?: string;
  resultReference?: string;
  errorMessage?: string;
  actionName?: string;
  targetEntity?: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

/**
 * 9. notifications collection: /notifications/{notificationId}
 */
export interface NotificationDocument {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  createdAt: Timestamp | FieldValue;
}
