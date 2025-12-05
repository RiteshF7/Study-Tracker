'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, serverTimestamp, getDocs, collection, writeBatch } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, reload } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates'
import { generateMockActivities, generateMockProblems } from '@/lib/mock-data';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp?: FirebaseApp | null;
  firestore?: Firestore | null;
  auth?: Auth | null;
  storage?: FirebaseStorage | null;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  storage: FirebaseStorage | null;
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) { // If no Auth service instance, cannot determine user state
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { // Auth state determined
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth]); // Depends on the auth instance

  // When a user signs in, upsert their profile document with basic info.
  useEffect(() => {
    if (!firestore) return;
    const currentUser = userAuthState.user;
    if (!currentUser) return;

    const populateGuestData = async (user: User) => {
      const activitiesCollection = collection(firestore, 'users', user.uid, 'activities');
      const snapshot = await getDocs(activitiesCollection);

      // Only populate if the user has no activities (i.e., is a new guest)
      if (snapshot.empty) {
        const batch = writeBatch(firestore);
        const mockActivities = generateMockActivities(5);
        const mockProblems = generateMockProblems(5);

        mockActivities.forEach(activity => {
          const docRef = doc(collection(firestore, 'users', user.uid, 'activities'));
          batch.set(docRef, { ...activity, userId: user.uid });
        });

        mockProblems.forEach(problem => {
          const docRef = doc(collection(firestore, 'users', user.uid, 'problems'));
          batch.set(docRef, { ...problem, userId: user.uid });
        });

        await batch.commit();
      }
    };

    const doUpsert = (u: User) => {
      const { uid, displayName, email, photoURL, isAnonymous } = u;
      const userDocRef = doc(firestore, 'users', uid);
      // Non-blocking write; merges to preserve existing fields. Avoid overriding createdAt repeatedly.
      setDocumentNonBlocking(
        userDocRef,
        {
          id: uid,
          name: displayName || (isAnonymous ? 'Guest User' : 'New User'),
          email: email || '',
          photoURL: photoURL || '',
          lastLoginAt: serverTimestamp(),
          isAnonymous,
        },
        { merge: true }
      );

      if (isAnonymous) {
        populateGuestData(u);
      }
    };

    // Reload user to ensure the latest provider profile (e.g., updated Google photo).
    reload(currentUser)
      .then(() => doUpsert(currentUser))
      .catch(() => doUpsert(currentUser));
  }, [firestore, userAuthState.user]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

/** Hook to access Firebase Storage instance. */
export const useStorage = (): FirebaseStorage => {
  const { storage } = useFirebase();
  return storage;
};

/**
 * Memoizes a Firestore query or document reference.
 *
 * @param factory A function that returns a Firestore query or reference.
 * @param deps A dependency array for the useMemo hook.
 * @returns The memoized query or reference.
 */
export function useMemoFirebase<T>(factory: (firestore: Firestore) => T, deps: DependencyList): T | null {
  const { firestore } = useContext(FirebaseContext);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(() => {
    if (!firestore) return null;
    return factory(firestore);
  }, [firestore, ...deps]);

  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};
