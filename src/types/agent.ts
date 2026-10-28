import { JobItem, JobApplication, ResumeData } from './index';

export type SupportedAgentAction =
  | 'analyze_resume'
  | 'find_matching_jobs'
  | 'get_job_details'
  | 'prepare_apply'
  | 'apply_to_job'
  | 'show_applications'
  | 'check_application_status'
  | 'withdraw_application'
  | 'improve_resume_for_job'
  | 'analyze_missing_skills'
  | 'compare_resume_with_job'
  | 'prepare_interview'
  | 'explain_next_steps'
  | 'reset_resume'
  | 'unsupported_query';

export interface ToolExecutionRecord {
  action: SupportedAgentAction;
  status: 'planning' | 'running' | 'success' | 'failed' | 'requires_confirmation';
  message: string;
  data?: any;
  timestamp: string;
}

export interface ConfirmationRequest {
  id: string;
  action: 'apply_to_job' | 'withdraw_application' | 'reset_resume';
  title: string;
  description: string;
  job?: JobItem;
  resume?: ResumeData;
  applicationId?: string;
  destinationType: 'Internal Tracker Record' | 'Direct External Submission';
  payload?: any;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface AgentStructuredResponse {
  ok: boolean;
  action: SupportedAgentAction;
  status: string;
  message: string;
  requires_confirmation: boolean;
  confirmation_details?: ConfirmationRequest;
  data?: {
    resume?: ResumeData;
    jobs?: JobItem[];
    job?: JobItem;
    applications?: JobApplication[];
    application?: JobApplication;
    interviewQuestions?: Array<{ category: string; question: string; answerTips: string }>;
    skillGaps?: { matched: string[]; missing: string[]; recommendation: string };
    nextSteps?: Array<{ step: number; title: string; detail: string; urgent: boolean }>;
    [key: string]: any;
  };
  suggested_followups?: string[];
}

export interface AgentMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  toolExecution?: ToolExecutionRecord;
  confirmationRequest?: ConfirmationRequest;
  structuredData?: AgentStructuredResponse['data'];
  suggestedActions?: string[];
}
