import { StickyNotes } from "@/components/sticky-notes";

export default function NotesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6 font-headline">Sticky Notes</h1>
      <StickyNotes />
    </div>
  );
}
