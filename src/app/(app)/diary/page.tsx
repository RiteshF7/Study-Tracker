
'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, Timestamp, getDocs } from 'firebase/firestore';
import type { Activity, Problem, JournalEntry } from '@/lib/types';
import { format, startOfDay, parseISO } from 'date-fns';
import { BookCopy, Feather, Calendar as CalendarIcon } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { debounce } from 'lodash';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export default function DiaryPage() {
  const { user, firestore } = useFirebase();
  const [journalEntry, setJournalEntry] = useState('');
  const [journalDoc, setJournalDoc] = useState<{id: string, ref: any} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [isBookmarkMode, setIsBookmarkMode] = useState(false);
  const [datesWithEntries, setDatesWithEntries] = useState<Date[]>([]);


  const selectedDateString = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  // --- Data Fetching for Bookmarks ---
   const activitiesQuery = useMemoFirebase(
    (fs) => (user ? collection(fs, 'users', user.uid, 'activities') : null),
    [user]
  );
  const problemsQuery = useMemoFirebase(
    (fs) => (user ? collection(fs, 'users', user.uid, 'problems') : null),
    [user]
  );
  const allJournalEntriesQuery = useMemoFirebase(
    (fs) => (user ? collection(fs, 'users', user.uid, 'journalEntries') : null),
    [user]
  );

  const { data: allActivities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);
  const { data: allProblems, isLoading: isLoadingProblems } = useCollection<Problem>(problemsQuery);
  const { data: allJournalEntries } = useCollection<JournalEntry>(allJournalEntriesQuery);


  // --- Journal Entry Logic ---
  useEffect(() => {
    if (!user || !firestore) return;

    const journalEntriesCollection = collection(firestore, 'users', user.uid, 'journalEntries');
    const q = query(journalEntriesCollection, where("date", "==", selectedDateString));

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

  }, [user, firestore, selectedDateString]);

  // --- Bookmark Logic ---
  useEffect(() => {
    const dates = new Set<string>();
    allActivities?.forEach(a => a.date && dates.add(a.date));
    allProblems?.forEach(p => p.date && dates.add(p.date));
    allJournalEntries?.forEach(j => j.summary && dates.add(j.date));
    setDatesWithEntries(Array.from(dates).map(d => parseISO(d)));
  }, [allActivities, allProblems, allJournalEntries]);


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
      date: selectedDateString,
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
          operation: journalDoc ? 'update' : 'create',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSaving(false);
      });

  }, [user, firestore, journalDoc, selectedDateString]);

  const debouncedSave = useMemo(
    () => debounce(saveJournalEntry, 1500),
    [saveJournalEntry]
  );

  const handleJournalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJournalEntry(e.target.value);
    setIsSaving(true);
    debouncedSave(e.target.value);
  };
  
  const isLoading = isLoadingActivities || isLoadingProblems;
  const hasEntries = journalEntry;

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-3xl mx-auto">
        <div className="diary-page p-8 rounded-lg relative">
          <div
            className={cn(
              "absolute top-4 right-4 transition-colors duration-300 cursor-pointer",
              isBookmarkMode ? 'text-yellow-500' : 'text-amber-800/50'
            )}
            onClick={() => setIsBookmarkMode(!isBookmarkMode)}
            title="Toggle Bookmark Mode"
          >
            <Feather className="w-10 h-10" />
          </div>
          <header className="mb-8 border-b-2 border-amber-700/20 pb-4">
            <h1 className="diary-font text-5xl text-amber-900/80">The Daily Log</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-lg text-amber-800/70 diary-font mt-1">
                {format(selectedDate, "EEEE, MMMM do, yyyy")}
              </p>
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-auto pl-3 text-left font-normal bg-amber-50/50 hover:bg-amber-50 border-amber-700/20 diary-font"
                  >
                    <span>Pick a date</span>
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(startOfDay(date))}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    className="diary-font"
                    modifiers={isBookmarkMode ? { bookmarked: datesWithEntries } : {}}
                    modifiersClassNames={isBookmarkMode ? { bookmarked: 'day-bookmarked' } : {
                      selected: 'rdp-day_selected',
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </header>

          {isLoading && (
            <div className="text-center text-amber-800/60 diary-font text-2xl">
              Flipping to the right page...
            </div>
          )}

          {!isLoading && !hasEntries && !journalEntry && (
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
                className="diary-font text-xl text-stone-700/90 leading-relaxed bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-96 resize-none"
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
