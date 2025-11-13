'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  queryEqual,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 *
 * IMPORTANT! It is best practice to memoize the `targetRefOrQuery` with `useMemo` or `useMemoFirebase`
 * to prevent re-creating the query on every render, which can lead to unnecessary re-subscriptions.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. The hook will not subscribe if this is null or undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    targetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>))  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  // Use a ref to store the previous query to compare against the new one.
  const prevQueryRef = useRef<Query<DocumentData> | CollectionReference<DocumentData> | null | undefined>(null);
  
  useEffect(() => {
    // Check if the new query is actually different from the old one.
    const hasQueryChanged = 
        (prevQueryRef.current && !targetRefOrQuery) ||
        (!prevQueryRef.current && targetRefOrQuery) ||
        (targetRefOrQuery && prevQueryRef.current && !queryEqual(targetRefOrQuery, prevQueryRef.current));
    
    // If the query is null or hasn't changed, do nothing.
    if (!targetRefOrQuery || !hasQueryChanged) {
        if (!targetRefOrQuery) {
            setData(null);
            setIsLoading(false);
            setError(null);
        }
        return;
    }

    console.log('[useCollection] Subscribing to query:', (targetRefOrQuery as any)._query.path.toString());
    prevQueryRef.current = targetRefOrQuery;
    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      targetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        console.log(`[useCollection] Data received for path: ${(targetRefOrQuery as any)._query.path.toString()}`, results);
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        const path: string =
          targetRefOrQuery.type === 'collection'
            ? (targetRefOrQuery as CollectionReference).path
            : (targetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

        console.error(`[useCollection] Error on path: ${path}`, error);
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // Cleanup subscription on component unmount or if the query changes.
    return () => {
      console.log('[useCollection] Unsubscribing from query:', (targetRefOrQuery as any)._query.path.toString());
      unsubscribe()
    };
  }, [targetRefOrQuery]);

  return { data, isLoading, error };
}
