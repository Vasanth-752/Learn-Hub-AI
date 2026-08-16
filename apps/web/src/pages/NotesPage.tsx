import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Loader2, Plus, Trash2, FileText, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { Input } from '../components/ui/Input';

interface Note {
  id: string;
  title: string;
  content_markdown: string;
  updated_at: string;
}

// ── API Helpers ──────────────────────────────────────────────────────────────

async function fetchNotes(jwt: string): Promise<Note[]> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error('Failed to fetch notes');
  return (await res.json()).notes;
}

async function createNote(jwt: string, title: string): Promise<Note> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content_markdown: '' }),
  });
  if (!res.ok) throw new Error('Failed to create note');
  return (await res.json()).note;
}

async function updateNote(jwt: string, id: string, updates: Partial<Note>): Promise<Note> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update note');
  return (await res.json()).note;
}

async function deleteNote(jwt: string, id: string): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error('Failed to delete note');
}

// ── Component ────────────────────────────────────────────────────────────────

export function NotesPage() {
  const { session } = useAuthStore();
  const jwt = session?.access_token ?? '';
  const queryClient = useQueryClient();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: notes = [], isLoading: loadingNotes } = useQuery({
    queryKey: ['notes', jwt],
    queryFn: () => fetchNotes(jwt),
    enabled: !!jwt,
  });

  const activeNote = notes.find(n => n.id === activeNoteId);

  // Sync state when active note changes
  useEffect(() => {
    if (activeNote) {
      setEditingTitle(activeNote.title);
      setEditingContent(activeNote.content_markdown || '');
      setHasUnsavedChanges(false);
    }
  }, [activeNoteId, activeNote]);

  // Set first note active on load if none selected
  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  const createMutation = useMutation({
    mutationFn: (title: string) => createNote(jwt, title),
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ['notes', jwt] });
      setActiveNoteId(newNote.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Note>) => updateNote(jwt, activeNoteId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', jwt] });
      setHasUnsavedChanges(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNote(jwt, id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['notes', jwt] });
      if (activeNoteId === deletedId) {
        setActiveNoteId(null);
      }
    },
  });

  const handleSave = () => {
    if (activeNote && hasUnsavedChanges) {
      updateMutation.mutate({ title: editingTitle, content_markdown: editingContent });
    }
  };

  const handleNewNote = () => {
    createMutation.mutate('Untitled Note');
  };

  if (loadingNotes) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary size-8" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-oatmeal/20 bg-surface-container-lowest/80 backdrop-blur-sm sticky top-0 z-50 shrink-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-headline-md font-serif text-on-surface">Notes</h1>
            <nav className="hidden md:flex items-center gap-4">
              <a href="/dashboard" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Dashboard</a>
              <a href="/roadmap" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Roadmap</a>
              <span className="text-sm font-medium text-primary">Notes</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex gap-6 overflow-hidden h-[calc(100vh-80px)]">
        
        {/* Sidebar */}
        <aside className="w-64 shrink-0 flex flex-col gap-4 border-r pr-6 border-oatmeal/20">
          <Button className="w-full gap-2" onClick={handleNewNote} loading={createMutation.isPending}>
            <Plus className="size-4" /> New Note
          </Button>

          <div className="flex-1 overflow-y-auto space-y-2 pb-4">
            {notes.map(note => (
              <button
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all',
                  activeNoteId === note.id 
                    ? 'bg-primary-container/20 border-primary/30' 
                    : 'bg-surface-container-lowest border-transparent hover:border-oatmeal/30 hover:bg-surface-container-low'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className={cn('size-4 shrink-0', activeNoteId === note.id ? 'text-primary' : 'text-on-surface-variant')} />
                  <span className={cn('text-sm font-medium truncate', activeNoteId === note.id ? 'text-primary' : 'text-on-surface')}>
                    {note.title}
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant/70 px-6">
                  {new Date(note.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
            {notes.length === 0 && (
              <div className="text-center p-4 text-sm text-on-surface-variant">
                No notes yet.
              </div>
            )}
          </div>
        </aside>

        {/* Main Editor Area */}
        <section className="flex-1 flex flex-col bg-surface-container-lowest rounded-xl border border-oatmeal/20 overflow-hidden">
          {!activeNote ? (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant">
              <FileText className="size-12 mb-4 opacity-20" />
              <p>Select a note or create a new one</p>
            </div>
          ) : (
            <>
              {/* Editor Toolbar */}
              <div className="shrink-0 p-4 border-b border-oatmeal/20 flex items-center gap-4 bg-surface-container-lowest">
                <Input 
                  value={editingTitle}
                  onChange={(e) => {
                    setEditingTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="flex-1 font-serif text-title-lg bg-transparent border-transparent px-0 hover:border-oatmeal focus:border-primary focus:bg-surface"
                />
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn("gap-2 transition-all", hasUnsavedChanges ? "border-primary text-primary hover:bg-primary-container/20" : "")}
                  onClick={handleSave}
                  loading={updateMutation.isPending}
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="size-4" /> 
                  {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-error hover:bg-error-container/20 w-8 h-8 p-0"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this note?')) {
                      deleteMutation.mutate(activeNote.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* Editor Body */}
              <div className="flex-1 p-4 relative bg-surface-container-lowest">
                <textarea
                  className="absolute inset-0 w-full h-full resize-none p-4 bg-transparent outline-none text-on-surface font-sans leading-relaxed"
                  placeholder="Start typing your note here (Markdown supported)..."
                  value={editingContent}
                  onChange={(e) => {
                    setEditingContent(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>
            </>
          )}
        </section>

      </main>
    </div>
  );
}
