'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    // If already initialized, return the SDKs with the already initialized App
    return getSdks(getApp());
  }

  // In a production App Hosting environment, the config is automatically provided.
  // In other environments (like local development), we must use the explicit config object.
  if (process.env.NODE_ENV === 'production') {
    let firebaseApp;
    try {
      // Important! initializeApp() is called without any arguments because Firebase App Hosting
      // integrates with the initializeApp() function to provide the environment variables.
      firebaseApp = initializeApp();
    } catch (e) {
      // Fallback for production environments where auto-init might fail.
      console.warn('Automatic Firebase initialization failed in production. Falling back to firebaseConfig.', e);
      firebaseApp = initializeApp(firebaseConfig);
    }
    return getSdks(firebaseApp);
  } else {
    // Always use the explicit config for non-production environments.
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
