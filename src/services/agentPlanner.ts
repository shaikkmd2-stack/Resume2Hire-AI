import { agentTools } from './agentTools';
import { AgentStructuredResponse, ConfirmationRequest, SupportedAgentAction } from '../types/agent';

export interface PlannedTask {
  action: SupportedAgentAction;
  params: {
    jobIdentifier?: string;
    searchQuery?: string;
    statusFilter?: string;
    minScore?: number;
    rawQuery: string;
  };
  reasoning: string;
}

export const agentPlanner = {
  /**
   * Parse user's natural language input and map to verified task
   */
  planTask(userInput: string): PlannedTask {
    const text = userInput.trim().toLowerCase();

    // 1. Analyze resume
    if (
      /analyze.*resume|check.*resume|resume.*score|ats.*score|evaluate.*resume|scan.*resume|parse.*resume/i.test(
        text
      )
    ) {
      return {
        action: 'analyze_resume',
        params: { rawQuery: userInput },
        reasoning: 'User requested comprehensive ATS parsing and evaluation of active resume.',
      };
    }

    // 2. Apply to job
    if (/apply.*job|apply to|submit.*application|apply for/i.test(text)) {
      // Extract target company or job title if present
      const match = text.match(/apply(?:\s+to|\s+for)?\s+(?:the\s+)?([a-z0-9\s.-]+)/i);
      let jobIdentifier: string | undefined = undefined;
      if (match && match[1]) {
        const candidate = match[1].replace(/this\s+job|this\s+selected\s+job|selected\s+job|job/i, '').trim();
        if (candidate.length > 1) {
          jobIdentifier = candidate;
        }
      }

      return {
        action: 'prepare_apply',
        params: { jobIdentifier, rawQuery: userInput },
        reasoning: 'User initiated apply workflow. Preparing explicit confirmation review card.',
      };
    }

    // 3. Interview Preparation
    if (/interview|prepare.*interview|interview.*questions|prep.*for/i.test(text)) {
      const match = text.match(/(?:for|with)\s+([a-z0-9\s.-]+?)(?:\s+interview|\s*$)/i);
      const jobIdentifier = match && match[1] && !match[1].includes('this') ? match[1].trim() : undefined;

      return {
        action: 'prepare_interview',
        params: { jobIdentifier, rawQuery: userInput },
        reasoning: 'User requested targeted technical and behavioral interview preparation questions.',
      };
    }

    // 4. Missing Skills & Skill Gap Analysis
    if (/missing.*skills|skill.*gaps?|skills?.*i.*am.*missing|what.*skills.*need/i.test(text)) {
      const match = text.match(/(?:for|at)\s+([a-z0-9\s.-]+)/i);
      const jobIdentifier = match && match[1] && !match[1].includes('this') ? match[1].trim() : undefined;

      return {
        action: 'analyze_missing_skills',
        params: { jobIdentifier, rawQuery: userInput },
        reasoning: 'User requested factual skill gap analysis comparing active resume with requisition.',
      };
    }

    // 5. Improve / Tailor Resume for a Job
    if (/improve.*resume|tailor.*resume|diff.*resume|rewrite.*bullet|optimize.*resume/i.test(text)) {
      const match = text.match(/(?:for|to)\s+([a-z0-9\s.-]+)/i);
      const jobIdentifier = match && match[1] && !match[1].includes('this') ? match[1].trim() : undefined;

      return {
        action: 'improve_resume_for_job',
        params: { jobIdentifier, rawQuery: userInput },
        reasoning: 'User requested targeted resume bullet and impact improvements.',
      };
    }

    // 6. Compare Resume with Job Description
    if (/compare.*resume|match.*breakdown|how.*well.*i.*match/i.test(text)) {
      const match = text.match(/(?:with|against|to)\s+([a-z0-9\s.-]+)/i);
      const jobIdentifier = match && match[1] && !match[1].includes('this') ? match[1].trim() : undefined;

      return {
        action: 'compare_resume_with_job',
        params: { jobIdentifier, rawQuery: userInput },
        reasoning: 'User requested detailed side-by-side comparison of qualifications vs requirements.',
      };
    }

    // 7. Check Application Status
    if (/status.*application|check.*status|how.*is.*application/i.test(text)) {
      const match = text.match(/(?:for|at|with)\s+([a-z0-9\s.-]+)/i);
      const jobIdentifier = match && match[1] && !match[1].includes('my') ? match[1].trim() : undefined;

      return {
        action: 'check_application_status',
        params: { jobIdentifier, rawQuery: userInput },
        reasoning: 'User inquired about the current stage of tracked application.',
      };
    }

    // 8. Show Application History / All Applications
    if (/show.*application|application.*history|my.*applications|list.*applications|applications.*pipeline/i.test(text)) {
      let statusFilter: string | undefined = undefined;
      if (text.includes('review') || text.includes('awaiting')) statusFilter = 'under_review';
      if (text.includes('interview')) statusFilter = 'interviewing';
      if (text.includes('offer')) statusFilter = 'offer';

      return {
        action: 'show_applications',
        params: { statusFilter, rawQuery: userInput },
        reasoning: 'User requested history and status breakdown of all tracked job applications.',
      };
    }

    // 9. Cancel / Withdraw Application
    if (/cancel.*application|withdraw.*application|delete.*application/i.test(text)) {
      return {
        action: 'withdraw_application',
        params: { rawQuery: userInput },
        reasoning: 'User requested application cancellation.',
      };
    }

    // 10. Explain Next Steps / Career Roadmap
    if (/next.*step|what.*should.*i.*do|roadmap|guide.*me|job.*search.*plan|how.*to.*proceed/i.test(text)) {
      return {
        action: 'explain_next_steps',
        params: { rawQuery: userInput },
        reasoning: 'User requested an actionable next-step career search plan.',
      };
    }

    // 11. Find Matching Jobs (Default job discovery)
    if (
      /find.*jobs?|match.*jobs?|best.*jobs?|recommend.*jobs?|jobs?.*for.*me|search.*jobs?|roles?.*for.*my.*profile/i.test(
        text
      )
    ) {
      // Check if user specified a keyword (e.g. "Find jobs in remote", "Find React jobs")
      const queryMatch = text.match(/(?:for|in|matching)\s+([a-z0-9\s.-]+)/i);
      let searchQuery: string | undefined = undefined;
      if (queryMatch && queryMatch[1]) {
        const cleaned = queryMatch[1].replace(/my\s+skills|my\s+profile|me/i, '').trim();
        if (cleaned.length > 2) searchQuery = cleaned;
      }

      return {
        action: 'find_matching_jobs',
        params: { searchQuery, rawQuery: userInput },
        reasoning: 'User requested jobs matched against verified profile skills.',
      };
    }

    // 12. General/unsupported query fallback
    return {
      action: 'unsupported_query',
      params: { rawQuery: userInput },
      reasoning: 'Query did not match a supported career execution action.',
    };
  },

  /**
   * Execute planned task through verified tools
   */
  async executeTask(task: PlannedTask): Promise<AgentStructuredResponse> {
    switch (task.action) {
      case 'analyze_resume':
        return agentTools.toolAnalyzeResume();

      case 'find_matching_jobs':
        return agentTools.toolFindMatchingJobs(task.params.searchQuery);

      case 'prepare_apply':
        return agentTools.toolPrepareApplyToJob(task.params.jobIdentifier);

      case 'show_applications':
        return agentTools.toolShowApplications(task.params.statusFilter);

      case 'check_application_status':
        return agentTools.toolCheckApplicationStatus(task.params.jobIdentifier);

      case 'analyze_missing_skills':
        return agentTools.toolAnalyzeMissingSkills(task.params.jobIdentifier);

      case 'improve_resume_for_job':
        return agentTools.toolImproveResumeForJob(task.params.jobIdentifier);

      case 'compare_resume_with_job':
        return agentTools.toolAnalyzeMissingSkills(task.params.jobIdentifier);

      case 'prepare_interview':
        return agentTools.toolPrepareInterview(task.params.jobIdentifier);

      case 'explain_next_steps':
        return agentTools.toolExplainNextSteps();

      case 'withdraw_application':
        return {
          ok: false,
          action: 'withdraw_application',
          status: 'feature_limited',
          message:
            'External employer portals do not support automated API cancellation once submitted. You can update your internal application status to "Withdrawn" on the Application Tracker page.',
          requires_confirmation: false,
          suggested_followups: ['Show my application history', 'Check the status of my applications'],
        };

      case 'unsupported_query':
      default:
        return {
          ok: true,
          action: 'unsupported_query',
          status: 'guidance_provided',
          message:
            `I am the **Resume2Hire AI Agent**, an autonomous career assistant. Here are the real, verified actions I can execute for you:\n\n` +
            `• **"Analyze my uploaded resume"** — Run ATS scoring & competency extraction\n` +
            `• **"Find jobs matching my skills"** — Query verified requisitions matched to your profile\n` +
            `• **"Apply to this job"** — Prepare and submit a confirmed application\n` +
            `• **"Find the skills I am missing for this role"** — Detailed gap analysis\n` +
            `• **"Improve my resume for this job"** — Review targeted bullet point diffs\n` +
            `• **"Show my application history"** — Review all pipeline records\n` +
            `• **"Help me prepare for this interview"** — Tailored technical & leadership questions\n` +
            `• **"Explain what I should do next"** — Step-by-step career search roadmap`,
          requires_confirmation: false,
          suggested_followups: [
            'Analyze my uploaded resume',
            'Find jobs matching my skills',
            'Explain what I should do next',
          ],
        };
    }
  },

  /**
   * Finalize a confirmed action (e.g. apply to job)
   */
  async confirmAndExecute(confirmation: ConfirmationRequest): Promise<AgentStructuredResponse> {
    if (confirmation.action === 'apply_to_job') {
      return agentTools.toolExecuteApplyToJob(confirmation);
    }

    return {
      ok: false,
      action: 'apply_to_job',
      status: 'unknown_confirmation_action',
      message: 'Unrecognized confirmation request.',
      requires_confirmation: false,
    };
  },
};
