export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  title: string;
  targetRole: string;
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Staff' | 'Principal' | 'Executive';
  preferredLocations: string[];
  workModePreference: 'Remote' | 'Hybrid' | 'Onsite' | 'Any';
  minSalaryTarget: number;
  currency: string;
  bio: string;
  skills: string[];
  notificationsEnabled: boolean;
  autoAgentEnabled: boolean;
  humanApprovalRequired: boolean;
  atsSyncActive: boolean;
}

export interface SkillItem {
  name: string;
  category: 'Languages' | 'Cloud & Infra' | 'Frameworks' | 'Architecture' | 'Tools & Data';
  proficiency: 'Familiar' | 'Proficient' | 'Expert';
  yearsExperience?: number;
  highlighted?: boolean;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  period: string;
  location: string;
  bullets: string[];
  skillsUsed: string[];
}

export interface EducationItem {
  degree: string;
  field: string;
  institution: string;
  year: string;
}

export interface ResumeData {
  id: string;
  filename: string;
  filesize: string;
  uploadedAt: string;
  parsedAt: string;
  overallScore: number;
  atsProbability: number;
  targetRole: string;
  breakdown: {
    impact: number;
    brevity: number;
    style: number;
    skillsCoverage: number;
  };
  skills: SkillItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  strengths: string[];
  skillGaps: string[];
  actionableSuggestions: {
    id: string;
    title: string;
    description: string;
    category: 'Impact' | 'Keywords' | 'Formatting' | 'Structure' | 'Action Verbs';
    severity: 'High' | 'Medium' | 'Low';
  }[];
}

export interface JobItem {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'Onsite';
  salaryRange: string;
  salaryMin: number;
  salaryMax: number;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  sourceATS: 'Greenhouse' | 'Lever' | 'Ashby' | 'Workday' | 'Direct';
  postedAgo: string;
  department: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHaves: string[];
  benefits: string[];
  isSaved?: boolean;
  externalUrl?: string;
}

export interface ImprovementSuggestion {
  id: string;
  roleContext: string;
  companyContext: string;
  category: 'Quantitative Metrics' | 'Architectural Scope' | 'Action Verbs' | 'ATS Alignment';
  original: string;
  suggested: string;
  customText?: string;
  isEdited?: boolean;
  reason: string;
  scoreGain: number;
  targetKeywords: string[];
  status: 'pending' | 'accepted' | 'rejected';
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  sourceATS: string;
  appliedDate: string;
  lastUpdated: string;
  status: 'submitted' | 'under_review' | 'interviewing' | 'offer' | 'archived';
  matchScore: number;
  nextStep: string;
  agentExecuted: boolean;
  notes?: string;
}

export interface AgentActivityItem {
  id: string;
  type: 'evaluation' | 'ats_dispatch' | 'vector_search' | 'diff_optimization' | 'gate_approval';
  actionName: string;
  targetEntity: string;
  timestamp: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  requiresApproval?: boolean;
  approvalData?: {
    jobTitle: string;
    company: string;
    companyLogo?: string;
    location: string;
    salary: string;
    matchScore: number;
    atsPlatform: string;
    packetId: string;
    targetUrl: string;
  };
  details: string;
  errorMessage?: string;
  latencyMs?: number;
  traceLogs: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'approval' | 'match' | 'optimization' | 'system';
  link?: string;
}
