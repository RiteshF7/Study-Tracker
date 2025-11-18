
'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, setDoc, Timestamp, getDocs } from 'firebase/firestore';
import type { Activity, Problem, JournalEntry } from '@/lib/types';
import { format, startOfDay, isSameDay } from 'date-fns';
import { BookCopy, Brain, Feather, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { debounce } from 'lodash';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function DiaryPage() {
  const { user, firestore } = useFirebase();
  const [journalEntry, setJournalEntry] = useState('');
  const [journalDoc, setJournalDoc] = useState<{id: string, ref: any} | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayString = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);

  // --- Data Fetching ---
  const activitiesQuery = useMemoFirebase(
    (fs) => {
      if (!user) return null;
      return query(
        collection(fs, 'users', user.uid, 'activities'),
        orderBy('createdAt', 'desc')
      );
    },
    [user]
  );

  const problemsQuery = useMemoFirebase(
    (fs) => {
      if (!user) return null;
      return query(
        collection(fs, 'users', user.uid, 'problems'),
        orderBy('createdAt', 'desc')
      );
    },
    [user]
  );

  const { data: allActivities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);
  const { data: allProblems, isLoading: isLoadingProblems } = useCollection<Problem>(problemsQuery);

  // --- Journal Entry Logic ---
  useEffect(() => {
    if (!user || !firestore) return;

    const journalEntriesCollection = collection(firestore, 'users', user.uid, 'journalEntries');
    const q = query(journalEntriesCollection, where("date", "==", todayString));

    getDocs(q).then(snapshot => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setJournalEntry((doc.data() as JournalEntry).summary || '');
        setJournalDoc({ id: doc.id, ref: doc.ref });
      } else {
        setJournalEntry('');
        setJournalDoc(null);
      }
    }).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: `users/${user.uid}/journalEntries`,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

  }, [user, firestore, todayString]);


  const saveJournalEntry = useCallback(async (entryText: string) => {
    if (!user || !firestore) return;
    setIsSaving(true);
    
    const collectionRef = collection(firestore, 'users', user.uid, 'journalEntries');
    let docRef;

    if (journalDoc) {
      docRef = journalDoc.ref;
    } else {
      const newDoc = doc(collectionRef);
      docRef = newDoc;
      setJournalDoc({ id: newDoc.id, ref: newDoc });
    }

    const data: Partial<JournalEntry> = {
      summary: entryText,
      date: todayString,
      userId: user.uid,
      updatedAt: Timestamp.now(),
    };
    
    if (!journalDoc) {
      data.createdAt = Timestamp.now();
    }

    setDoc(docRef, data, { merge: true })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSaving(false);
      });

  }, [user, firestore, journalDoc, todayString]);

  const debouncedSave = useMemo(
    () => debounce(saveJournalEntry, 1500),
    [saveJournalEntry]
  );

  const handleJournalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJournalEntry(e.target.value);
    setIsSaving(true);
    debouncedSave(e.target.value);
  };
  
  // --- Derived Data ---
  const todaysActivities = useMemo(() => {
    if (!allActivities) return [];
    return allActivities.filter(activity => activity.createdAt && isSameDay(activity.createdAt.toDate(), today));
  }, [allActivities, today]);

  const todaysProblems = useMemo(() => {
    if (!allProblems) return [];
    return allProblems.filter(problem => problem.createdAt && isSameDay(problem.createdAt.toDate(), today));
  }, [allProblems, today]);

  const isLoading = isLoadingActivities || isLoadingProblems;
  const hasEntries = (todaysActivities && todaysActivities.length > 0) || (todaysProblems && todaysProblems.length > 0) || journalEntry;

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-3xl mx-auto">
        <div className="diary-page p-8 rounded-lg relative">
          <div className="absolute top-4 right-4 text-amber-800/50">
            <Feather className="w-10 h-10" />
          </div>
          <header className="mb-8 border-b-2 border-amber-700/20 pb-4">
            <h1 className="diary-font text-5xl text-amber-900/80">The Daily Log</h1>
            <p className="text-lg text-amber-800/70 diary-font mt-1">
              {format(today, "EEEE, MMMM do, yyyy")}
            </p>
          </header>

          {isLoading && (
            <div className="text-center text-amber-800/60 diary-font text-2xl">
              Flipping to the right page...
            </div>
          )}

          {!isLoading && !hasEntries && (
            <div className="text-center text-amber-800/60 diary-font text-2xl py-10">
            </div>
          )}

          <div className="space-y-12">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="diary-font text-3xl text-amber-900/70 flex items-center gap-3">
                  <BookCopy className="w-6 h-6 text-amber-900/50" />
                  My Thoughts
                </h2>
                {isSaving && <p className="text-sm diary-font text-amber-800/60 animate-pulse">Saving...</p>}
              </div>
              <Textarea
                value={journalEntry}
                onChange={handleJournalChange}
                placeholder="Start writing your thoughts for the day..."
                className="diary-font text-xl text-stone-700/90 leading-relaxed bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-40 resize-none"
              />
            </section>
          
            {todaysActivities && todaysActivities.length > 0 && (
              <section>
                <h2 className="diary-font text-3xl text-amber-900/70 mb-4 flex items-center gap-3">
                  <ListChecks className="w-6 h-6 text-amber-900/50" />
                  Activities Logged
                </h2>
                <ul className="space-y-4">
                  {todaysActivities.map(activity => (
                    <li key={activity.id} className="diary-font text-xl text-stone-700/90 leading-relaxed">
                        - Logged <span className="font-bold text-amber-900">{activity.duration} minutes</span> on{' '}
                        <span className="font-bold text-amber-900">{activity.name}</span>, a session of type <Badge variant="secondary" className="diary-font text-base">{activity.type}</Badge>
                        , starting at {activity.startTime}.
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {todaysProblems && todaysProblems.length > 0 && (
              <section>
                <h2 className="diary-font text-3xl text-amber-900/70 mb-4 flex items-center gap-3">
                    <Brain className="w-6 h-6 text-amber-900/50" />
                  Problems Solved
                </h2>
                <ul className="space-y-4">
                  {todaysProblems.map(problem => (
                    <li key={problem.id} className="diary-font text-xl text-stone-700/90 leading-relaxed">
                        - Solved <span className="font-bold text-amber-900">{problem.count} problems</span> in{' '}
                          <span className="font-bold text-amber-900">{problem.category}</span> on the topic of "{problem.name}".
                        {problem.notes && <p className="text-lg text-stone-600/80 pl-4 mt-1">Notes: "{problem.notes}"</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
