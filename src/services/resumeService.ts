import { ResumeData } from '../types';
import { API_CONFIG } from './apiConfig';
import { firebaseResumeService } from './firebaseResumeService';
import { firebaseAnalysisService } from './firebaseAnalysisService';
import { n8nBoundary } from './n8nBoundary';
import { auth } from '../firebase/config';
import { documentParser, StructuredResumeAnalysis } from './documentParser';

// Cache the most recent real parsed resume in session memory
let activeParsedResume: ResumeData | null = null;

export const resumeService = {
  /**
   * Get current active parsed resume data
   */
  async getActiveResume(): Promise<ResumeData | null> {
    if (activeParsedResume) {
      return activeParsedResume;
    }

    if (auth?.currentUser) {
      try {
        const userResumes = await firebaseResumeService.getUserResumes(auth.currentUser.uid);
        if (userResumes.length > 0) {
          const latest = userResumes[0];
          const analysis = await firebaseAnalysisService.getAnalysisByResumeId(latest.id, auth.currentUser.uid);

          if (analysis) {
            activeParsedResume = {
              id: latest.id,
              filename: latest.originalFileName,
              filesize: `${(latest.fileSize / (1024 * 1024)).toFixed(2)} MB`,
              uploadedAt: new Date().toISOString(),
              parsedAt: 'Previously Extracted',
              overallScore: analysis.score,
              atsProbability: Math.min(analysis.score + 2, 99),
              targetRole: 'Software Engineer',
              breakdown: analysis.breakdown || { impact: 85, brevity: 80, style: 90, skillsCoverage: 85 },
              skills: Array.isArray(analysis.skills)
                ? analysis.skills.map((s: any) =>
                    typeof s === 'string'
                      ? { name: s, category: 'Tools & Data', proficiency: 'Proficient' }
                      : s
                  )
                : [],
              experience: analysis.experience || [],
              education: analysis.education || [],
              strengths: analysis.strengths || [],
              skillGaps: analysis.missingSkills || [],
              actionableSuggestions: (analysis.suggestions as any) || [],
            };
            return activeParsedResume;
          }
        }
      } catch (err) {
        console.warn('[ResumeService] Could not fetch remote active resume:', err);
      }
    }

    return null;
  },

  /**
   * Validate, extract actual text from PDF/DOCX, analyze, and dispatch to n8n / Firebase
   */
  async uploadAndAnalyze(
    file: File,
    onProgress?: (progress: number, stepName: string) => void
  ): Promise<{ success: boolean; data?: ResumeData; error?: string }> {
    // 1. Check user authentication (Storage Security Rules enforce isOwner(userId))
    if (!auth?.currentUser) {
      return {
        success: false,
        error: 'Authentication required: Please sign in before uploading your resume to Cloud Storage.',
      };
    }
    const userId = auth.currentUser.uid;

    // 2. File type and size validation
    const validation = firebaseResumeService.validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      // 3. STEP 1: Upload the actual File to Firebase Storage FIRST
      if (onProgress) onProgress(10, 'Initiating secure document upload to Firebase Storage...');
      const uploadRes = await firebaseResumeService.uploadResume(userId, file, (pct, step) => {
        // Map upload progress into the 10% - 50% range
        const scaledProgress = Math.round(10 + (pct / 100) * 40);
        if (onProgress) onProgress(scaledProgress, step);
      });

      if (!uploadRes.success || !uploadRes.resume) {
        return {
          success: false,
          error: uploadRes.error || 'Failed to upload document to Firebase Storage.',
        };
      }

      // 4. STEP 2: START RESUME ANALYSIS ONLY AFTER UPLOAD SUCCEEDS
      if (onProgress) onProgress(55, 'Upload verified. Extracting readable text from document binary...');
      const extracted = await documentParser.extractText(file);

      // Detect empty or scanned files without selectable text
      if (!extracted.text || extracted.text.length < 40) {
        return {
          success: false,
          error:
            'Empty or unreadable document: No selectable text could be found. Please ensure your PDF or DOCX file contains selectable text rather than a flattened image.',
        };
      }

      if (onProgress) onProgress(75, 'Evaluating technical competencies, experience tokens, and metrics...');
      const structuredAnalysis: StructuredResumeAnalysis = documentParser.analyzeResumeContent(
        extracted.text,
        file.name
      );

      const resumeData = documentParser.mapToResumeData(structuredAnalysis, file.name, file.size);
      resumeData.id = uploadRes.resume.id;

      if (onProgress) onProgress(90, 'Dispatching payload to AI workflow boundary...');
      await n8nBoundary.triggerResumeAnalysis({
        userId,
        resumeId: uploadRes.resume.id,
        storagePath: uploadRes.resume.storagePath,
        targetRole: structuredAnalysis.targetRole,
        file,
        rawText: extracted.text,
        localAnalysis: structuredAnalysis,
      });

      activeParsedResume = resumeData;
      if (onProgress) onProgress(100, 'Analysis complete. Extracted factual profile from uploaded resume.');

      return {
        success: true,
        data: resumeData,
      };
    } catch (err: unknown) {
      console.error('[ResumeService] Upload & analysis failure:', err);
      const message = err instanceof Error ? err.message : 'Failed to parse resume document.';
      return { success: false, error: message };
    }
  },

  /**
   * Parse raw text fallback
   */
  async parseRawText(rawText: string): Promise<{ success: boolean; data?: ResumeData; error?: string }> {
    if (!rawText || rawText.trim().length < 40) {
      return {
        success: false,
        error: 'Resume text is too short. Please paste at least 40 characters of experience or skills.',
      };
    }

    try {
      const structuredAnalysis = documentParser.analyzeResumeContent(rawText, 'Pasted_Resume_Text.txt');
      const resumeData = documentParser.mapToResumeData(structuredAnalysis, 'Pasted_Resume_Text.txt', rawText.length);
      activeParsedResume = resumeData;

      return {
        success: true,
        data: resumeData,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error analyzing pasted text.';
      return { success: false, error: message };
    }
  },
};
