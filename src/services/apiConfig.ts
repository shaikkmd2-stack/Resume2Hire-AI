/**
 * API & Backend Service Architecture Configuration
 *
 * NOTE: This is a frontend-only implementation with a clean service boundary.
 * No Firebase keys, backend secrets, or live credentials are embedded here.
 * When integrating backend services later:
 * 1. Firebase Auth and Firestore connect via VITE_FIREBASE_* configs in .env
 * 2. n8n workflow agents connect via VITE_N8N_WEBHOOK_URL
 * 3. The service layer files in /src/services/ map directly to these endpoints.
 */

import { isFirebaseConfigured } from '../firebase/config';

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  const globalObj = globalThis as any;
  if (globalObj.process?.env?.[key]) {
    return globalObj.process.env[key];
  }
  return '';
};

export const API_CONFIG = {
  // Uses live Firebase when credentials exist and mock mode is not forced
  isMockMode: getEnv('VITE_USE_MOCK_FALLBACK') === 'true' || !isFirebaseConfigured(),
  firebase: {
    apiKey: getEnv('VITE_FIREBASE_API_KEY'),
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('VITE_FIREBASE_APP_ID'),
    measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID'),
  },
  n8n: {
    webhookUrl: getEnv('VITE_N8N_WEBHOOK_URL') || 'https://n8n.internal.resume2hire.ai/webhook',
    agentDispatcherEndpoint: '/workflow/agent-dispatch',
    resumeParserEndpoint: '/workflow/resume-extract',
    matchScoreEndpoint: '/workflow/vector-match',
  },
  app: {
    name: 'Resume2Hire AI',
    version: '4.20 (Firebase Cloud Backend)',
    mode: 'Executive Precision UI',
  },
};

