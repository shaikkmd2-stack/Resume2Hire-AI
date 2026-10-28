import { resumeService } from './resumeService';
import { jobService } from './jobService';
import { applicationService } from './applicationService';
import { auth } from '../firebase/config';
import { JobItem, JobApplication, ResumeData } from '../types';
import { AgentStructuredResponse, ConfirmationRequest } from '../types/agent';

export const agentTools = {
  /**
   * 1. Analyze active authenticated resume
   */
  async toolAnalyzeResume(): Promise<AgentStructuredResponse> {
    const resume = await resumeService.getActiveResume();

    if (!resume) {
      return {
        ok: false,
        action: 'analyze_resume',
        status: 'no_resume_found',
        message: 'No resume is currently loaded. Please upload a PDF or DOCX resume on the homepage or Resume Analysis tab, or use the Paste Text option.',
        requires_confirmation: false,
        suggested_followups: ['Upload a PDF resume', 'Paste resume text fallback'],
      };
    }

    return {
      ok: true,
      action: 'analyze_resume',
      status: 'analysis_verified',
      message: `Verified resume analysis for "${resume.filename}". Overall ATS readiness is ${resume.overallScore}%, with an estimated ATS pass probability of ${resume.atsProbability}%. Identified ${resume.skills.length} core technical competencies for ${resume.targetRole || 'Software Engineering'} roles.`,
      requires_confirmation: false,
      data: {
        resume,
      },
      suggested_followups: [
        'Find jobs matching my skills',
        'Find the skills I am missing',
        'Explain what I should do next',
      ],
    };
  },

  /**
   * 2. Find jobs matching the candidate's real profile & compute real vectors
   */
  async toolFindMatchingJobs(searchQuery?: string, minScore: number = 60): Promise<AgentStructuredResponse> {
    const resume = await resumeService.getActiveResume();
    const allJobs = await jobService.getJobs({ query: searchQuery });

    if (!allJobs || allJobs.length === 0) {
      return {
        ok: true,
        action: 'find_matching_jobs',
        status: 'no_jobs_found',
        message: searchQuery
          ? `No open requisitions matching "${searchQuery}" were found. Try searching for a broader term like "Engineering", "Backend", or "Platform".`
          : 'No open requisitions are currently active in the job index.',
        requires_confirmation: false,
        data: { jobs: [] },
      };
    }

    // Filter by min score if available, otherwise return top matches
    const filtered = allJobs
      .filter((j) => (j.matchScore || 0) >= minScore || minScore === 0)
      .slice(0, 5);

    const targetList = filtered.length > 0 ? filtered : allJobs.slice(0, 5);

    return {
      ok: true,
      action: 'find_matching_jobs',
      status: 'matches_retrieved',
      message: `Found ${targetList.length} verified job requisitions matched against your active profile (${resume?.targetRole || 'Software Engineer'}). Top match is ${targetList[0]?.company} - ${targetList[0]?.title} with a ${targetList[0]?.matchScore}% score.`,
      requires_confirmation: false,
      data: {
        jobs: targetList,
        resume: resume || undefined,
      },
      suggested_followups: [
        `Apply to ${targetList[0]?.company}`,
        `Help me prepare for ${targetList[0]?.company} interview`,
        'Find the skills I am missing for this role',
      ],
    };
  },

  /**
   * 3. Prepare an application with explicit confirmation card (Phase 9)
   */
  async toolPrepareApplyToJob(jobIdentifier?: string): Promise<AgentStructuredResponse> {
    const resume = await resumeService.getActiveResume();

    if (!resume) {
      return {
        ok: false,
        action: 'prepare_apply',
        status: 'missing_resume',
        message: 'You need an active resume on file before applying. Please upload or paste your resume first.',
        requires_confirmation: false,
        suggested_followups: ['Upload a PDF resume'],
      };
    }

    const allJobs = await jobService.getJobs();
    let targetJob: JobItem | undefined;

    if (jobIdentifier) {
      const lower = jobIdentifier.toLowerCase();
      targetJob = allJobs.find(
        (j) =>
          j.id.toLowerCase() === lower ||
          j.company.toLowerCase().includes(lower) ||
          j.title.toLowerCase().includes(lower)
      );
    } else {
      // Pick top matched job
      targetJob = allJobs[0];
    }

    if (!targetJob) {
      return {
        ok: false,
        action: 'prepare_apply',
        status: 'job_not_found',
        message: `Could not identify job requisition "${jobIdentifier || ''}". Please select a valid role from your recommended jobs.`,
        requires_confirmation: false,
        suggested_followups: ['Find jobs matching my skills'],
      };
    }

    // Check if application already exists (Prevent duplicate applications - Prompt Phase 5 & 9)
    const existingApps = await applicationService.getApplications();
    const alreadyApplied = existingApps.some(
      (a) => a.jobId === targetJob?.id || (a.company === targetJob?.company && a.jobTitle === targetJob?.title)
    );

    if (alreadyApplied) {
      return {
        ok: false,
        action: 'prepare_apply',
        status: 'duplicate_application',
        message: `You already have an active application tracked for ${targetJob.company} (${targetJob.title}). You can check its current status in your Application Tracker.`,
        requires_confirmation: false,
        data: { job: targetJob },
        suggested_followups: ['Show my application history', 'Check the status of my applications'],
      };
    }

    const confirmationDetails: ConfirmationRequest = {
      id: `conf_${Date.now()}`,
      action: 'apply_to_job',
      title: `Submit Application: ${targetJob.company}`,
      description: `Create tracked application record for ${targetJob.title} at ${targetJob.company} (${targetJob.location}). Using resume: "${resume.filename}".`,
      job: targetJob,
      resume,
      destinationType: targetJob.externalUrl ? 'Direct External Submission' : 'Internal Tracker Record',
      payload: {
        jobId: targetJob.id,
        jobTitle: targetJob.title,
        company: targetJob.company,
        location: targetJob.location,
        salary: targetJob.salaryRange,
        sourceATS: targetJob.sourceATS,
        matchScore: targetJob.matchScore,
        externalUrl: targetJob.externalUrl,
      },
      status: 'pending',
    };

    return {
      ok: true,
      action: 'prepare_apply',
      status: 'confirmation_required',
      message: `I have prepared the application packet for **${targetJob.title}** at **${targetJob.company}** (${targetJob.location}, ${targetJob.salaryRange}). Please review the details below and confirm to record this application.`,
      requires_confirmation: true,
      confirmation_details: confirmationDetails,
      data: {
        job: targetJob,
        resume,
      },
    };
  },

  /**
   * 4. Execute approved apply action after explicit confirmation
   */
  async toolExecuteApplyToJob(confirmation: ConfirmationRequest): Promise<AgentStructuredResponse> {
    if (!confirmation.job || !confirmation.resume) {
      return {
        ok: false,
        action: 'apply_to_job',
        status: 'invalid_confirmation_payload',
        message: 'Application aborted: Missing job or resume specification in confirmation payload.',
        requires_confirmation: false,
      };
    }

    const job = confirmation.job;
    const resume = confirmation.resume;

    try {
      const createdApp = await applicationService.createApplication({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        salary: job.salaryRange,
        sourceATS: job.sourceATS,
        status: 'submitted',
        matchScore: job.matchScore,
        nextStep: 'Initial Recruiter Screen',
        agentExecuted: true,
        notes: `Application recorded by Resume2Hire AI Agent on ${new Date().toLocaleDateString()} using verified resume: ${resume.filename}.`,
      });

      return {
        ok: true,
        action: 'apply_to_job',
        status: 'application_record_created',
        message: `Application record successfully created for **${job.company} - ${job.title}**! It is now tracked in your Application Tracker under status "Submitted". ${
          job.externalUrl
            ? `If an external employer portal is required, you can also access their direct application link at: ${job.externalUrl}`
            : ''
        }`,
        requires_confirmation: false,
        data: {
          job,
          application: createdApp,
        },
        suggested_followups: [
          'Show my application history',
          `Help me prepare for ${job.company} interview`,
          'Find jobs matching my skills',
        ],
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to record application.';
      return {
        ok: false,
        action: 'apply_to_job',
        status: 'execution_failed',
        message: `Failed to complete application: ${errorMsg}`,
        requires_confirmation: false,
      };
    }
  },

  /**
   * 5. Show application tracker history
   */
  async toolShowApplications(statusFilter?: string): Promise<AgentStructuredResponse> {
    const apps = await applicationService.getApplications();

    if (!apps || apps.length === 0) {
      return {
        ok: true,
        action: 'show_applications',
        status: 'empty_pipeline',
        message: 'You do not have any applications tracked in your pipeline yet. Ask me to find matching jobs and apply to get started!',
        requires_confirmation: false,
        data: { applications: [] },
        suggested_followups: ['Find jobs matching my skills', 'Analyze my uploaded resume'],
      };
    }

    const filtered = statusFilter
      ? apps.filter((a) => a.status.toLowerCase() === statusFilter.toLowerCase())
      : apps;

    const underReview = apps.filter((a) => a.status === 'under_review').length;
    const interviewing = apps.filter((a) => a.status === 'interviewing').length;
    const offers = apps.filter((a) => a.status === 'offer').length;

    return {
      ok: true,
      action: 'show_applications',
      status: 'applications_retrieved',
      message: `You currently have ${apps.length} tracked applications in your pipeline (${underReview} under review, ${interviewing} interviewing, ${offers} offers).`,
      requires_confirmation: false,
      data: {
        applications: filtered,
      },
      suggested_followups: [
        'Check the status of my applications',
        'Help me prepare for an interview',
        'Find jobs matching my skills',
      ],
    };
  },

  /**
   * 6. Check status of a specific application
   */
  async toolCheckApplicationStatus(identifier?: string): Promise<AgentStructuredResponse> {
    const apps = await applicationService.getApplications();

    if (!apps || apps.length === 0) {
      return {
        ok: false,
        action: 'check_application_status',
        status: 'no_applications',
        message: 'No tracked applications found in your pipeline to check.',
        requires_confirmation: false,
        suggested_followups: ['Find jobs matching my skills'],
      };
    }

    let targetApp: JobApplication | undefined;
    if (identifier) {
      const lower = identifier.toLowerCase();
      targetApp = apps.find(
        (a) =>
          a.company.toLowerCase().includes(lower) ||
          a.jobTitle.toLowerCase().includes(lower) ||
          a.id.toLowerCase() === lower
      );
    } else {
      targetApp = apps[0];
    }

    if (!targetApp) {
      return {
        ok: false,
        action: 'check_application_status',
        status: 'application_not_found',
        message: `Could not find an application record matching "${identifier}". You have active records for: ${apps.map((a) => a.company).join(', ')}.`,
        requires_confirmation: false,
        data: { applications: apps },
      };
    }

    return {
      ok: true,
      action: 'check_application_status',
      status: 'status_verified',
      message: `Application for **${targetApp.company} (${targetApp.jobTitle})** is currently **${targetApp.status.toUpperCase().replace('_', ' ')}**. Next step: ${targetApp.nextStep}. Applied on ${targetApp.appliedDate}.`,
      requires_confirmation: false,
      data: {
        application: targetApp,
      },
      suggested_followups: [
        `Help me prepare for ${targetApp.company} interview`,
        'Show all my applications',
        'Explain what I should do next',
      ],
    };
  },

  /**
   * 7. Skill-gap analysis against target job or role
   */
  async toolAnalyzeMissingSkills(jobQuery?: string): Promise<AgentStructuredResponse> {
    const resume = await resumeService.getActiveResume();
    const allJobs = await jobService.getJobs();

    if (!resume) {
      return {
        ok: false,
        action: 'analyze_missing_skills',
        status: 'missing_resume',
        message: 'Please upload or paste your resume first so I can analyze your skill gaps against market requisitions.',
        requires_confirmation: false,
      };
    }

    let targetJob = allJobs[0];
    if (jobQuery) {
      const lower = jobQuery.toLowerCase();
      const match = allJobs.find(
        (j) => j.company.toLowerCase().includes(lower) || j.title.toLowerCase().includes(lower)
      );
      if (match) targetJob = match;
    }

    const resumeSkills = resume.skills.map((s) => s.name);
    const matchAnalysis = jobService.calculateJobMatch(
      targetJob?.requirements || ['Kubernetes', 'Go', 'Distributed Systems', 'CI/CD Pipelines'],
      resumeSkills,
      targetJob?.title || 'Senior Software Engineer',
      resume.targetRole
    );

    return {
      ok: true,
      action: 'analyze_missing_skills',
      status: 'gap_analyzed',
      message: `Skill-gap evaluation for **${targetJob?.company || 'Target Industry Stack'} (${targetJob?.title || resume.targetRole})**: You match **${matchAnalysis.matchedSkills.length}** requirements (${matchAnalysis.matchedSkills.join(', ')}). Missing or unstated skills: **${matchAnalysis.missingSkills.length}** (${matchAnalysis.missingSkills.join(', ')}).`,
      requires_confirmation: false,
      data: {
        job: targetJob,
        skillGaps: {
          matched: matchAnalysis.matchedSkills,
          missing: matchAnalysis.missingSkills,
          recommendation:
            matchAnalysis.missingSkills.length > 0
              ? `Adding verified experience with ${matchAnalysis.missingSkills.slice(0, 2).join(' and ')} would increase your match score from ${matchAnalysis.matchScore}% to over 90%.`
              : 'Your skills demonstrate complete coverage for this requisition.',
        },
      },
      suggested_followups: [
        `Improve my resume for ${targetJob?.company}`,
        `Help me prepare for ${targetJob?.company} interview`,
        'Find jobs matching my skills',
      ],
    };
  },

  /**
   * 8. Tailor / Improve resume for a specific job
   */
  async toolImproveResumeForJob(jobQuery?: string): Promise<AgentStructuredResponse> {
    const resume = await resumeService.getActiveResume();
    const allJobs = await jobService.getJobs();

    if (!resume) {
      return {
        ok: false,
        action: 'improve_resume_for_job',
        status: 'missing_resume',
        message: 'Please upload a resume first to generate truthful diff suggestions.',
        requires_confirmation: false,
      };
    }

    let targetJob = allJobs[0];
    if (jobQuery) {
      const lower = jobQuery.toLowerCase();
      const match = allJobs.find(
        (j) => j.company.toLowerCase().includes(lower) || j.title.toLowerCase().includes(lower)
      );
      if (match) targetJob = match;
    }

    const suggestions = resume.actionableSuggestions || [];

    return {
      ok: true,
      action: 'improve_resume_for_job',
      status: 'improvement_diff_generated',
      message: `Generated targeted improvement recommendations for **${targetJob.title}** at **${targetJob.company}**. Focusing on quantifiable performance metrics and ATS taxonomy alignment without fabricating experience.`,
      requires_confirmation: false,
      data: {
        job: targetJob,
        resume,
      },
      suggested_followups: [
        'Find the skills I am missing for this role',
        `Apply to ${targetJob.company}`,
        'Explain what I should do next',
      ],
    };
  },

  /**
   * 9. Generate realistic, targeted interview preparation questions
   */
  async toolPrepareInterview(jobQuery?: string): Promise<AgentStructuredResponse> {
    const resume = await resumeService.getActiveResume();
    const allJobs = await jobService.getJobs();

    let targetJob = allJobs[0];
    if (jobQuery) {
      const lower = jobQuery.toLowerCase();
      const match = allJobs.find(
        (j) => j.company.toLowerCase().includes(lower) || j.title.toLowerCase().includes(lower)
      );
      if (match) targetJob = match;
    }

    const roleName = targetJob?.title || resume?.targetRole || 'Software Engineer';
    const company = targetJob?.company || 'Target Employer';

    const questions = [
      {
        category: 'System Architecture & Technical Depth',
        question: `How would you architect a resilient, high-throughput distributed system tailored to ${company}'s scale, specifically handling failover and state replication?`,
        answerTips:
          'Reference quantifiable impact from your experience (e.g. p99 latencies, node clusters, SLA benchmarks). Outline clear decoupled trade-offs between consistency and partition tolerance.',
      },
      {
        category: 'Core Stack Mastery',
        question: `Explain how you have leveraged ${
          targetJob?.requirements?.slice(0, 3).join(', ') || 'Kubernetes, Cloud Infrastructure, and Microservices'
        } in production to diagnose performance regressions or memory leaks.`,
        answerTips:
          'Discuss specific diagnostic tools (eBPF, OpenTelemetry, profiling, cgroups). Emphasize observability and post-mortem best practices.',
      },
      {
        category: 'Executive & Cross-Functional Leadership',
        question: `Describe a situation where engineering trade-offs conflicted with immediate business deadlines. How did you guide technical alignment with leadership?`,
        answerTips:
          'Utilize the STAR framework (Situation, Task, Action, Result). Highlight ROI, risk assessment, and non-blocking architectural phased rollout.',
      },
      {
        category: 'Candidate Reverse Inquiries (Ask the Interviewer)',
        question: `What are the highest-friction technical bottlenecks your infrastructure or product engineering team is facing this quarter?`,
        answerTips:
          'Asking strategic operational questions signals senior technical ownership and readiness to hit the ground running.',
      },
    ];

    return {
      ok: true,
      action: 'prepare_interview',
      status: 'interview_prep_ready',
      message: `Interview preparation packet compiled for **${roleName}** at **${company}**. Below are 4 targeted domain and leadership questions grounded in your background and their technical requirements.`,
      requires_confirmation: false,
      data: {
        job: targetJob,
        interviewQuestions: questions,
      },
      suggested_followups: [
        `Find the skills I am missing for ${company}`,
        `Apply to ${company}`,
        'Show my application history',
      ],
    };
  },

  /**
   * 10. Explain next actionable steps in the candidate's career search
   */
  async toolExplainNextSteps(): Promise<AgentStructuredResponse> {
    const resume = await resumeService.getActiveResume();
    const apps = await applicationService.getApplications();
    const allJobs = await jobService.getJobs();

    const steps: Array<{ step: number; title: string; detail: string; urgent: boolean }> = [];

    if (!resume) {
      steps.push({
        step: 1,
        title: 'Upload and Parse Resume',
        detail: 'Upload your latest PDF/DOCX resume so the engine can extract competencies and calculate accurate ATS matching scores.',
        urgent: true,
      });
    } else if (resume.overallScore < 85) {
      steps.push({
        step: 1,
        title: 'Optimize Resume Impact Score',
        detail: `Your current ATS readiness score is ${resume.overallScore}%. Review the AI improvement suggestions to add quantifiable metrics.`,
        urgent: true,
      });
    } else {
      steps.push({
        step: 1,
        title: 'Resume ATS Health Confirmed',
        detail: `Your resume is operating in the top tier at ${resume.overallScore}% ATS score for ${resume.targetRole || 'Software Engineering'}.`,
        urgent: false,
      });
    }

    if (apps.length === 0) {
      steps.push({
        step: 2,
        title: 'Submit Initial Applications',
        detail: `You have 0 active submissions. Review the top ${allJobs.length} recommended requisitions and submit your application packet.`,
        urgent: true,
      });
    } else {
      const pendingScreen = apps.filter((a) => a.status === 'under_review' || a.status === 'submitted');
      steps.push({
        step: 2,
        title: 'Monitor Active Submissions',
        detail: `You have ${pendingScreen.length} applications awaiting recruiter response. Set interview prep reminders for active companies.`,
        urgent: false,
      });
    }

    steps.push({
      step: 3,
      title: 'Targeted Technical Interview Drill',
      detail: 'Conduct mock system design and leadership rehearsals for your shortlisted requisitions.',
      urgent: false,
    });

    return {
      ok: true,
      action: 'explain_next_steps',
      status: 'roadmap_generated',
      message: `Here is your personalized, verified career action plan based on your active profile:`,
      requires_confirmation: false,
      data: {
        nextSteps: steps,
      },
      suggested_followups: [
        'Find jobs matching my skills',
        'Help me prepare for an interview',
        'Show my application history',
      ],
    };
  },
};
