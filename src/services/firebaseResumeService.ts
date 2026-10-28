import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  deleteObject,
  getDownloadURL,
  UploadTask,
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { ResumeDocument } from '../firebase/schema';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export interface ResumeUploadResult {
  success: boolean;
  resume?: ResumeDocument;
  downloadUrl?: string;
  error?: string;
  storageSkipped?: boolean;
}

// Active background task handle for user cancellation
let currentUploadTask: UploadTask | null = null;

export const firebaseResumeService = {
  /**
   * Cancel the currently active Storage upload if running
   */
  cancelActiveUpload(): boolean {
    if (currentUploadTask) {
      try {
        currentUploadTask.cancel();
        currentUploadTask = null;
        return true;
      } catch (err) {
        console.warn('[FirebaseResumeService] Error cancelling upload task:', err);
      }
    }
    return false;
  },

  /**
   * Validate file format and size bounds
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided.' };
    }

    const name = file.name.toLowerCase();
    const hasValidExtension =
      name.endsWith('.pdf') ||
      name.endsWith('.docx') ||
      name.endsWith('.doc') ||
      name.endsWith('.txt');
    const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type) || file.type === '';

    if (!hasValidExtension && !hasValidMime) {
      return {
        valid: false,
        error: 'Unsupported file type. Permitted formats: PDF, DOCX, DOC, TXT.',
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
      };
    }

    return { valid: true };
  },

  /**
   * Upload resume binary to Firebase Storage under user-isolated path and persist metadata to Firestore
   * Path: resumes/{userId}/{resumeId}/{fileName}
   */
  async uploadResume(
    userId: string,
    file: File,
    onProgress?: (percent: number, stepText: string) => void
  ): Promise<ResumeUploadResult> {
    if (!userId) {
      return { success: false, error: 'Authentication required. Please sign in to upload resumes.' };
    }

    const validation = this.validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    if (!storage) {
      return {
        success: false,
        error: 'Firebase Storage is not initialized. Please verify your VITE_FIREBASE_STORAGE_BUCKET configuration.',
      };
    }

    if (!db) {
      return { success: false, error: 'Cloud Firestore is not initialized.' };
    }

    // Configure SDK retry timeout to fail fast (3000ms) instead of hanging for minutes on unprovisioned bucket / 404
    try {
      storage.maxUploadRetryTime = 3000;
      storage.maxOperationRetryTime = 3000;
    } catch {
      // safe fallback
    }

    const resumeId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `resumes/${userId}/${resumeId}/${cleanFileName}`;

    let uploadedStoragePath: string | undefined = undefined;
    let downloadUrl: string | undefined = undefined;

    // 1. Upload the selected binary File to Firebase Storage using ref() and uploadBytesResumable()
    try {
      if (onProgress) onProgress(0, 'Initializing secure upload to Firebase Storage: 0%');

      const resolvedContentType =
        file.type && file.type !== 'application/octet-stream'
          ? file.type
          : file.name.toLowerCase().endsWith('.pdf')
          ? 'application/pdf'
          : file.name.toLowerCase().endsWith('.docx')
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : file.name.toLowerCase().endsWith('.doc')
          ? 'application/msword'
          : 'text/plain';

      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: resolvedContentType,
        customMetadata: {
          userId,
          resumeId,
          originalName: file.name,
        },
      });

      currentUploadTask = uploadTask;

      await new Promise<void>((resolve, reject) => {
        let isSettled = false;

        // Fast 3.5s timeout guard: If upload makes zero progress because the bucket returns 404 or hangs, fail fast
        const timeoutId = setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            try {
              uploadTask.cancel();
            } catch {
              // ignore
            }
            const bucket = storage?.app?.options?.storageBucket || 'resume2hire-dcbe0.firebasestorage.app';
            reject(
              new Error(
                `Firebase Storage bucket "${bucket}" is not activated or reachable in Firebase Console.`
              )
            );
          }
        }, 3500);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const bytesTransferred = snapshot.bytesTransferred;
            const totalBytes = snapshot.totalBytes;
            // Real percentage based strictly on actual bytes transferred
            const percent = totalBytes > 0 ? Math.floor((bytesTransferred / totalBytes) * 100) : 0;

            const mbTransferred = (bytesTransferred / (1024 * 1024)).toFixed(2);
            const mbTotal = (totalBytes / (1024 * 1024)).toFixed(2);

            if (onProgress) {
              onProgress(
                percent,
                `Uploading to Firebase Storage: ${percent}% (${mbTransferred} MB / ${mbTotal} MB)`
              );
            }
          },
          (error) => {
            if (!isSettled) {
              isSettled = true;
              clearTimeout(timeoutId);
              reject(error);
            }
          },
          () => {
            if (!isSettled) {
              isSettled = true;
              clearTimeout(timeoutId);
              if (onProgress) {
                onProgress(100, 'Uploading to Firebase Storage: 100% (Upload verified)');
              }
              resolve();
            }
          }
        );
      });

      currentUploadTask = null;
      uploadedStoragePath = storagePath;

      try {
        downloadUrl = await getDownloadURL(storageRef);
      } catch (urlErr) {
        console.warn('[FirebaseResumeService] Download URL retrieval warning (storagePath retained):', urlErr);
      }
    } catch (storageErr: any) {
      currentUploadTask = null;
      console.warn('[FirebaseResumeService] Storage upload notice:', storageErr?.message || storageErr);
      const errCode = storageErr?.code || '';
      const errMsg = storageErr?.message || '';

      let userFriendlyMessage = 'Failed to upload resume to Cloud Storage.';
      if (errCode === 'storage/canceled' || errMsg.includes('canceled') || errMsg.includes('cancelled')) {
        return {
          success: false,
          error: 'Upload was cancelled by user.',
        };
      } else if (errCode === 'storage/unauthorized') {
        userFriendlyMessage =
          'Upload rejected by Storage Security Rules: Unauthorized. Please sign in to verify your identity.';
      } else if (
        errCode === 'storage/bucket-not-found' ||
        errMsg.includes('404') ||
        errMsg.includes('Not Found') ||
        errMsg.includes('not activated')
      ) {
        const bucket = storage?.app?.options?.storageBucket || 'resume2hire-dcbe0.firebasestorage.app';
        userFriendlyMessage = `Firebase Storage bucket "${bucket}" was not found (HTTP 404). Cloud Storage has not been activated yet for project "resume2hire-dcbe0".`;
      } else if (
        errCode === 'storage/retry-limit-exceeded' ||
        errMsg.includes('CORS') ||
        errMsg.includes('preflight') ||
        errMsg.includes('timed out')
      ) {
        userFriendlyMessage = 'Network timeout connecting to Firebase Storage.';
      } else if (errCode === 'storage/quota-exceeded') {
        userFriendlyMessage = 'Firebase Storage quota exceeded for this project.';
      } else if (storageErr instanceof Error) {
        userFriendlyMessage = `Storage notice: ${storageErr.message}`;
      }

      return {
        success: false,
        error: userFriendlyMessage,
        storageSkipped: true,
      };
    }

    // 2. Persist metadata in Firestore only AFTER upload succeeds
    if (onProgress) onProgress(100, 'Saving resume metadata to Cloud Firestore...');

    const resumeDoc: ResumeDocument = {
      id: resumeId,
      userId,
      originalFileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      storagePath: uploadedStoragePath,
      downloadUrl,
      status: 'uploaded',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'resumes', resumeId), resumeDoc);
    } catch (dbErr: any) {
      console.error('[FirebaseResumeService] Firestore metadata write error:', dbErr);
      // Clean up uploaded storage object to prevent orphan / duplicate records on retry
      if (storage && uploadedStoragePath) {
        try {
          await deleteObject(ref(storage, uploadedStoragePath));
        } catch (cleanupErr) {
          console.warn('[FirebaseResumeService] Cleanup after Firestore error failed:', cleanupErr);
        }
      }
      return {
        success: false,
        error: `Resume binary uploaded, but registering document metadata in Firestore failed: ${
          dbErr?.message || 'Database error'
        }. Cleaned up file to prevent duplicate records.`,
      };
    }

    return {
      success: true,
      resume: resumeDoc,
      downloadUrl,
    };
  },

  /**
   * Save resume record in Firestore directly
   */
  async saveResumeRecord(
    userId: string,
    file: File,
    storagePath?: string,
    downloadUrl?: string
  ): Promise<ResumeDocument> {
    const resumeId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const resumeDoc: ResumeDocument = {
      id: resumeId,
      userId,
      originalFileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      storagePath,
      downloadUrl,
      status: 'uploaded',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (db) {
      await setDoc(doc(db, 'resumes', resumeId), resumeDoc);
    }
    return resumeDoc;
  },

  /**
   * List all resumes belonging to the authenticated user
   */
  async getUserResumes(userId: string): Promise<ResumeDocument[]> {
    if (!db || !userId) return [];
    try {
      const q = query(collection(db, 'resumes'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => docSnap.data() as ResumeDocument);
    } catch (err) {
      console.error('[FirebaseResumeService] Failed to list resumes:', err);
      return [];
    }
  },

  /**
   * Get resume metadata by ID with ownership verification
   */
  async getResumeById(resumeId: string, userId: string): Promise<ResumeDocument | null> {
    if (!db || !resumeId || !userId) return null;
    const snap = await getDoc(doc(db, 'resumes', resumeId));
    if (!snap.exists()) return null;

    const data = snap.data() as ResumeDocument;
    if (data.userId !== userId) {
      throw new Error('Unauthorized: access denied to requested resume record.');
    }
    return data;
  },

  /**
   * Update resume processing status
   */
  async updateResumeStatus(
    resumeId: string,
    userId: string,
    status: 'uploaded' | 'processing' | 'analyzed' | 'failed'
  ): Promise<void> {
    if (!db) return;
    const refDoc = doc(db, 'resumes', resumeId);
    const snap = await getDoc(refDoc);
    if (!snap.exists() || snap.data()?.userId !== userId) {
      throw new Error('Unauthorized or non-existent resume document.');
    }
    await setDoc(refDoc, { status, updatedAt: serverTimestamp() }, { merge: true });
  },

  /**
   * Delete resume document and its physical storage object safely
   */
  async deleteResume(resumeId: string, userId: string): Promise<boolean> {
    if (!db || !resumeId || !userId) return false;

    const resumeSnap = await getDoc(doc(db, 'resumes', resumeId));
    if (!resumeSnap.exists()) return false;

    const resumeData = resumeSnap.data() as ResumeDocument;
    if (resumeData.userId !== userId) {
      throw new Error('Unauthorized: cannot delete resume belonging to another user.');
    }

    // 1. Delete binary from Storage if path exists
    if (storage && resumeData.storagePath) {
      try {
        const fileRef = ref(storage, resumeData.storagePath);
        await deleteObject(fileRef);
      } catch (storageErr) {
        console.warn('[FirebaseResumeService] Storage file deletion warning:', storageErr);
      }
    }

    // 2. Delete Firestore record
    await deleteDoc(doc(db, 'resumes', resumeId));
    return true;
  },
};
