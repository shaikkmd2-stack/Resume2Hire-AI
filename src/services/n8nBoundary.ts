import { API_CONFIG } from './apiConfig';
import { firebaseAnalysisService } from './firebaseAnalysisService';
import { firebaseResumeService } from './firebaseResumeService';
import { firebaseAgentRunService } from './firebaseAgentRunService';
import { ResumeAnalysisDocument } from '../firebase/schema';
import { StructuredResumeAnalysis } from './documentParser';

/**
 * n8n Integration Boundary & Security Notice
 *
 * CRITICAL ARCHITECTURE BOUNDARY (Prompt Phase 2 & 7):
 * - Sends actual file to n8n webhook via multipart/form-data using standard field 'file'
 * - Receives structured AI resume analysis response
 * - If webhook is unavailable or returns an error, falls back to the locally verified document analysis
 * - Records agent run history in Cloud Firestore
 */

export interface WorkflowTriggerOptions {
  userId: string;
  resumeId: string;
  storagePath?: string;
  targetRole?: string;
  file?: File;
  rawText?: string;
  localAnalysis?: StructuredResumeAnalysis;
}

export interface WorkflowResponse<T> {
  success: boolean;
  runId?: string;
  data?: T;
  error?: string;
}

export const n8nBoundary = {
  /**
   * Request resume parsing & ATS score analysis from workflow
   */
  async triggerResumeAnalysis(
    options: WorkflowTriggerOptions
  ): Promise<WorkflowResponse<ResumeAnalysisDocument>> {
    const { userId, resumeId, storagePath, targetRole, file, rawText, localAnalysis } = options;

    if (!userId || !resumeId) {
      return { success: false, error: 'userId and resumeId are required to trigger analysis.' };
    }

    // 1. Log pending agent run in Firestore
    const agentRun = await firebaseAgentRunService.createAgentRun(userId, {
      workflowType: 'resume_analysis',
      actionName: 'AI Resume Semantic Extraction',
      targetEntity: resumeId,
      relatedResumeId: resumeId,
    });

    // 2. Mark resume as processing
    await firebaseResumeService.updateResumeStatus(resumeId, userId, 'processing');

    try {
      const webhookBase = API_CONFIG.n8n.webhookUrl;
      const endpoint = `${webhookBase}${API_CONFIG.n8n.resumeParserEndpoint}`;

      console.info(`[n8nBoundary] Dispatched multipart analysis request to ${endpoint} [Run: ${agentRun.id}]`);

      let analysisPayload: Omit<ResumeAnalysisDocument, 'id' | 'userId' | 'resumeId' | 'createdAt'>;

      try {
        // Prepare multipart/form-data with actual file binary (Phase 2.3 & 2.4)
        const formData = new FormData();
        if (file) {
          formData.append('file', file, file.name);
          formData.append('data', file, file.name); // Compatible with n8n 'data' default binary property
        }
        formData.append('userId', userId);
        formData.append('resumeId', resumeId);
        if (storagePath) formData.append('storagePath', storagePath);
        if (targetRole) formData.append('targetRole', targetRole);
        if (rawText) formData.append('resumeText', rawText);

        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          if (result && result.analysis) {
            analysisPayload = result.analysis;
          } else {
            throw new Error('Invalid JSON structure returned by n8n workflow.');
          }
        } else {
          throw new Error(`n8n webhook responded with HTTP ${response.status}`);
        }
      } catch (webhookErr) {
        console.warn('[n8nBoundary] n8n remote webhook unavailable. Utilizing verified extracted document analysis:', webhookErr);

        if (localAnalysis) {
          analysisPayload = {
            score: localAnalysis.overallScore,
            skills: localAnalysis.skills,
            education: localAnalysis.education,
            experience: localAnalysis.experience,
            strengths: localAnalysis.strengths,
            missingSkills: localAnalysis.missingSkills,
            suggestions: localAnalysis.suggestions,
            breakdown: localAnalysis.breakdown,
          };
        } else {
          throw new Error('No extracted text or analysis available to proceed with analysis.');
        }
      }

      // 3. Persist verified analysis record
      const savedAnalysis = await firebaseAnalysisService.saveAnalysis(userId, resumeId, analysisPayload);

      // 4. Update resume status to 'analyzed'
      await firebaseResumeService.updateResumeStatus(resumeId, userId, 'analyzed');

      // 5. Update agent run to completed
      await firebaseAgentRunService.updateAgentRun(agentRun.id, userId, {
        status: 'completed',
        resultReference: savedAnalysis.id,
      });

      return {
        success: true,
        runId: agentRun.id,
        data: savedAnalysis,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Workflow execution failed';
      await firebaseResumeService.updateResumeStatus(resumeId, userId, 'failed');
      await firebaseAgentRunService.updateAgentRun(agentRun.id, userId, {
        status: 'failed',
        errorMessage: errorMsg,
      });
      return {
        success: false,
        runId: agentRun.id,
        error: errorMsg,
      };
    }
  },
};
