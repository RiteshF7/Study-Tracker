
'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Activity, Problem } from '@/lib/types';
import { format, startOfDay, isSameDay, parseISO } from 'date-fns';
import { BookCopy, Brain, Feather, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

export default function DiaryPage() {
  const { user } = useFirebase();

  const today = startOfDay(new Date());

  const activitiesQuery = useMemoFirebase(
    (fs) => {
      if (!user) return null;
      const activitiesCollection = collection(fs, 'users', user.uid, 'activities');
      return query(
        activitiesCollection,
        orderBy('createdAt', 'desc')
      );
    },
    [user]
  );

  const problemsQuery = useMemoFirebase(
    (fs) => {
      if (!user) return null;
      const problemsCollection = collection(fs, 'users', user.uid, 'problems');
      return query(
        problemsCollection,
        orderBy('createdAt', 'desc')
      );
    },
    [user]
  );

  const { data: allActivities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);
  const { data: allProblems, isLoading: isLoadingProblems } = useCollection<Problem>(problemsQuery);
  
  const todaysActivities = useMemo(() => {
    if (!allActivities) return [];
    return allActivities.filter(activity => activity.createdAt && isSameDay(activity.createdAt.toDate(), today));
  }, [allActivities, today]);

  const todaysProblems = useMemo(() => {
    if (!allProblems) return [];
    return allProblems.filter(problem => problem.createdAt && isSameDay(problem.createdAt.toDate(), today));
  }, [allProblems, today]);


  const isLoading = isLoadingActivities || isLoadingProblems;
  const hasEntries = (todaysActivities && todaysActivities.length > 0) || (todaysProblems && todaysProblems.length > 0);

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
              The pages are blank for today. <br /> Go forth and be productive!
            </div>
          )}

          {!isLoading && hasEntries && (
            <div className="space-y-12">
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
          )}
        </div>
      </div>
    </div>
  );
}
