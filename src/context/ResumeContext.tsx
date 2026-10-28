import React, { createContext, useContext, useState } from 'react';
import { ResumeData } from '../types';
import { INITIAL_RESUME_DATA } from '../services/mockData';
import { resumeService } from '../services/resumeService';

interface ResumeContextType {
  resume: ResumeData;
  isUploading: boolean;
  uploadProgress: number;
  uploadStep: string;
  uploadError: string | null;
  uploadResumeFile: (file: File) => Promise<boolean>;
  parseRawText: (text: string) => Promise<boolean>;
  clearUploadError: () => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resume, setResume] = useState<ResumeData>(() => {
    try {
      const stored = localStorage.getItem('r2h_active_resume');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.filename) return parsed;
      }
    } catch {
      // Safe silence
    }
    return INITIAL_RESUME_DATA;
  });

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const clearUploadError = () => setUploadError(null);

  const uploadResumeFile = async (file: File): Promise<boolean> => {
    if (isUploading) {
      console.warn('[ResumeContext] Upload already in progress. Ignoring duplicate invocation.');
      return false;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);
    setUploadStep('Initiating secure parser...');

    try {
      const res = await resumeService.uploadAndAnalyze(file, (pct, step) => {
        setUploadProgress(pct);
        setUploadStep(step);
      });

      if (res.success && res.data) {
        setResume(res.data);
        setUploadProgress(100);
        setUploadStep('Analysis complete!');
        try {
          localStorage.setItem('r2h_active_resume', JSON.stringify(res.data));
        } catch {
          // Safe silence
        }
        return true;
      } else {
        const errorMsg = res.error || 'Failed to upload and parse resume.';
        setUploadError(errorMsg);
        return false;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network or parsing error occurred.';
      setUploadError(errorMsg);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const parseRawText = async (text: string): Promise<boolean> => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(30);
    setUploadStep('Extracting structured competencies from text...');

    try {
      const res = await resumeService.parseRawText(text);
      if (res.success && res.data) {
        setResume(res.data);
        setUploadProgress(100);
        setUploadStep('Analysis complete!');
        try {
          localStorage.setItem('r2h_active_resume', JSON.stringify(res.data));
        } catch {
          // Safe silence
        }
        return true;
      } else {
        setUploadError(res.error || 'Failed to extract skills from text.');
        return false;
      }
    } catch {
      setUploadError('Failed to parse text input.');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ResumeContext.Provider
      value={{
        resume,
        isUploading,
        uploadProgress,
        uploadStep,
        uploadError,
        uploadResumeFile,
        parseRawText,
        clearUploadError,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
