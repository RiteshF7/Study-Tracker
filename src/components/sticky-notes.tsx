
"use client";

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { X, Pin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from './ui/textarea';

type Note = {
  id: number;
  heading: string;
  content: string;
};

export function StickyNotes() {
  const [notes, setNotes] = useLocalStorage<Note[]>('sticky-notes', []);
  const [headingValue, setHeadingValue] = useState('');
  const [contentValue, setContentValue] = useState('');

  const addNote = () => {
    if (headingValue.trim() && contentValue.trim()) {
      setNotes([...notes, { id: Date.now(), heading: headingValue.trim(), content: contentValue.trim() }]);
      setHeadingValue('');
      setContentValue('');
    }
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Pin className="h-6 w-6" />
            <CardTitle>Sticky Notes</CardTitle>
        </div>
        <CardDescription>Jot down quick thoughts and reminders. They are saved locally in your browser.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Note heading..."
            value={headingValue}
            onChange={(e) => setHeadingValue(e.target.value)}
          />
          <Textarea
            placeholder="Note content..."
            value={contentValue}
            onChange={(e) => setContentValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    addNote();
                }
            }}
          />
          <Button onClick={addNote}>Add Note</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.length > 0 ? (
            notes.map(note => (
              <Dialog key={note.id}>
                <div className="bg-yellow-100 dark:bg-yellow-800/20 p-4 rounded-lg shadow-md relative h-40 flex flex-col justify-between">
                    <DialogTrigger asChild>
                        <div className='cursor-pointer flex-grow'>
                            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 break-words">{note.heading}</h3>
                        </div>
                    </DialogTrigger>
                    <button
                        onClick={() => deleteNote(note.id)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-yellow-200 dark:bg-yellow-700/50 hover:bg-yellow-300 dark:hover:bg-yellow-600/50 text-yellow-700 dark:text-yellow-200"
                        aria-label="Delete note"
                        >
                        <X className="h-3 w-3" />
                    </button>
                </div>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{note.heading}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className='whitespace-pre-wrap'>{note.content}</p>
                    </div>
                </DialogContent>
              </Dialog>
            ))
          ) : (
            <p className="text-muted-foreground col-span-full text-center py-4">No notes yet. Add one above!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
