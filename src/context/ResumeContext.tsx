import React, { createContext, useContext, useState } from 'react';
import { ResumeData } from '../types';
import { INITIAL_RESUME_DATA } from '../services/mockData';
import { resumeService } from '../services/resumeService';
import { firebaseResumeService } from '../services/firebaseResumeService';

export type UploadStage = 'idle' | 'uploading' | 'saving' | 'analyzing' | 'completed' | 'failed';

interface ResumeContextType {
  resume: ResumeData;
  isUploading: boolean;
  uploadProgress: number;
  uploadStep: string;
  uploadStage: UploadStage;
  uploadError: string | null;
  lastSelectedFile: File | null;
  uploadResumeFile: (file: File) => Promise<boolean>;
  cancelUpload: () => void;
  retryUpload: () => Promise<boolean>;
  parseLocalFileFallback: () => Promise<boolean>;
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
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);

  const clearUploadError = () => {
    setUploadError(null);
    if (!isUploading) {
      setUploadStage('idle');
    }
  };

  const cancelUpload = () => {
    firebaseResumeService.cancelActiveUpload();
    setIsUploading(false);
    setUploadStage('failed');
    setUploadStep('Upload cancelled.');
    setUploadError('Upload was cancelled by user.');
  };

  const uploadResumeFile = async (file: File): Promise<boolean> => {
    if (isUploading) {
      console.warn('[ResumeContext] Upload already in progress. Ignoring duplicate invocation.');
      return false;
    }

    setLastSelectedFile(file);
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    setUploadStage('uploading');
    setUploadStep('Connecting to Firebase Storage: 0%');

    try {
      const res = await resumeService.uploadAndAnalyze(
        file,
        (pct, step) => {
          setUploadProgress(pct);
          setUploadStep(step);
        },
        (stage) => {
          setUploadStage(stage);
        }
      );

      if (res.success && res.data) {
        setResume(res.data);
        setUploadProgress(100);
        setUploadStage('completed');
        setUploadStep('Analysis complete!');
        try {
          localStorage.setItem('r2h_active_resume', JSON.stringify(res.data));
        } catch {
          // Safe silence
        }
        return true;
      } else {
        const errorMsg = res.error || 'Failed to upload and parse resume.';
        setUploadStage('failed');
        setUploadError(errorMsg);
        return false;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network or parsing error occurred.';
      setUploadStage('failed');
      setUploadError(errorMsg);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const retryUpload = async (): Promise<boolean> => {
    if (!lastSelectedFile) {
      setUploadError('No file selected to retry. Please select a resume file.');
      return false;
    }
    return uploadResumeFile(lastSelectedFile);
  };

  const parseLocalFileFallback = async (): Promise<boolean> => {
    if (!lastSelectedFile) {
      setUploadError('No document selected for client analysis.');
      return false;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadStage('analyzing');
    setUploadStep('Extracting competencies from local file binary...');
    setUploadProgress(40);

    try {
      const res = await resumeService.parseLocalFileFallback(lastSelectedFile);
      if (res.success && res.data) {
        setResume(res.data);
        setUploadProgress(100);
        setUploadStage('completed');
        setUploadStep('Analysis complete!');
        return true;
      } else {
        setUploadStage('failed');
        setUploadError(res.error || 'Failed to parse resume locally.');
        return false;
      }
    } catch (err: unknown) {
      setUploadStage('failed');
      setUploadError(err instanceof Error ? err.message : 'Error analyzing local resume.');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const parseRawText = async (text: string): Promise<boolean> => {
    setIsUploading(true);
    setUploadError(null);
    setUploadStage('analyzing');
    setUploadProgress(30);
    setUploadStep('Extracting structured competencies from text...');

    try {
      const res = await resumeService.parseRawText(text);
      if (res.success && res.data) {
        setResume(res.data);
        setUploadProgress(100);
        setUploadStage('completed');
        setUploadStep('Analysis complete!');
        try {
          localStorage.setItem('r2h_active_resume', JSON.stringify(res.data));
        } catch {
          // Safe silence
        }
        return true;
      } else {
        setUploadStage('failed');
        setUploadError(res.error || 'Failed to extract skills from text.');
        return false;
      }
    } catch {
      setUploadStage('failed');
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
        uploadStage,
        uploadError,
        lastSelectedFile,
        uploadResumeFile,
        cancelUpload,
        retryUpload,
        parseLocalFileFallback,
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
