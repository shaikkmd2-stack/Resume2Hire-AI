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
}

export const firebaseResumeService = {
  /**
   * Validate file format and size bounds
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided.' };
    }

    const name = file.name.toLowerCase();
    const hasValidExtension = name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.doc') || name.endsWith('.txt');
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

    const resumeId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `resumes/${userId}/${resumeId}/${cleanFileName}`;

    let uploadedStoragePath: string | undefined = undefined;
    let downloadUrl: string | undefined = undefined;

    // 1. Upload the actual selected binary File to Firebase Storage using ref() and uploadBytesResumable()
    try {
      if (onProgress) onProgress(10, 'Initiating secure document upload to Firebase Storage...');
      const resolvedContentType =
        (file.type && file.type !== 'application/octet-stream')
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

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = snapshot.totalBytes > 0
              ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 70) + 10
              : 25;
            if (onProgress) {
              const filePct = snapshot.totalBytes > 0
                ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
                : 0;
              onProgress(pct, `Uploading to Firebase Storage: ${filePct}%`);
            }
          },
          (error) => {
            console.error('[FirebaseResumeService] Storage upload error:', error);
            reject(error);
          },
          () => resolve()
        );
      });

      uploadedStoragePath = storagePath;
      try {
        downloadUrl = await getDownloadURL(storageRef);
      } catch {
        // Storage rules may limit client getDownloadURL; storagePath is authoritative
      }
    } catch (storageErr: any) {
      console.error('[FirebaseResumeService] Storage upload failed:', storageErr);
      const errCode = storageErr?.code || '';
      const errMsg = storageErr?.message || '';

      let userFriendlyMessage = 'Failed to upload resume to Cloud Storage.';
      if (errCode === 'storage/unauthorized') {
        userFriendlyMessage = 'Upload rejected by Storage Security Rules: Unauthorized. Please sign in to verify your identity.';
      } else if (errCode === 'storage/bucket-not-found' || errMsg.includes('404') || errMsg.includes('Not Found')) {
        userFriendlyMessage = 'Firebase Storage bucket not found (404). Please ensure Cloud Storage is activated in the Firebase Console for project "resume2hire-dcbe0".';
      } else if (errCode === 'storage/retry-limit-exceeded' || errMsg.includes('CORS') || errMsg.includes('preflight') || errMsg.includes('network')) {
        userFriendlyMessage = 'CORS preflight or network error: Unable to complete file upload to Firebase Storage from http://localhost:5173.';
      } else if (storageErr instanceof Error) {
        userFriendlyMessage = `Storage upload error (${errCode || 'network'}): ${storageErr.message}`;
      }

      return {
        success: false,
        error: userFriendlyMessage,
      };
    }

    // 2. Persist metadata in Firestore only AFTER upload succeeds
    if (onProgress) onProgress(85, 'Registering resume metadata in Firestore...');

    const resumeDoc: ResumeDocument = {
      id: resumeId,
      userId,
      originalFileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      storagePath: uploadedStoragePath,
      status: 'uploaded',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'resumes', resumeId), resumeDoc);
    } catch (dbErr: any) {
      console.error('[FirebaseResumeService] Firestore metadata write error:', dbErr);
      return {
        success: false,
        error: `Resume uploaded to Storage, but metadata registration failed: ${dbErr?.message || 'Database error'}`,
      };
    }

    if (onProgress) onProgress(100, 'Upload verified and registered in Cloud Storage.');

    return {
      success: true,
      resume: resumeDoc,
      downloadUrl,
    };
  },

  /**
   * List all resumes belonging to the authenticated user
   */
  async getUserResumes(userId: string): Promise<ResumeDocument[]> {
    if (!db || !userId) return [];
    try {
      const q = query(
        collection(db, 'resumes'),
        where('userId', '==', userId)
      );
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
    await setDoc(
      refDoc,
      { status, updatedAt: serverTimestamp() },
      { merge: true }
    );
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
