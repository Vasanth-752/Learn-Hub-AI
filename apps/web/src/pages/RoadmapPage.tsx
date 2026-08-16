import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Target, CheckCircle, Circle, Plus, Loader2, Edit2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Input } from '../components/ui/Input';

interface Goal {
  id: string;
  title: string;
}

interface Topic {
  id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
}

interface Sprint {
  id: string;
  title: string;
  order_index: number;
  topics: Topic[];
}

interface Roadmap {
  id: string;
  sprints: Sprint[];
}

// ── API Helpers ──────────────────────────────────────────────────────────────

async function fetchGoals(jwt: string): Promise<Goal[]> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals?status=active`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error('Failed to fetch goals');
  return (await res.json()).goals;
}

async function fetchRoadmap(jwt: string, goalId: string): Promise<Roadmap | null> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals/${goalId}/roadmap`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch roadmap');
  return (await res.json()).roadmap;
}

async function updateTopic(jwt: string, topicId: string, updates: Partial<Topic>): Promise<Topic> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/topics/${topicId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update topic');
  return (await res.json()).topic;
}

async function createGoalAndMockRoadmap(jwt: string, title: string) {
  // 1. Create goal
  const gRes = await fetch(`${import.meta.env.VITE_API_URL}/api/goals`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!gRes.ok) throw new Error('Failed to create goal');
  const { goal } = await gRes.json();

  // 2. Create manual roadmap with mock data
  const rRes = await fetch(`${import.meta.env.VITE_API_URL}/api/goals/${goal.id}/roadmap`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structure: {
        sprints: [
          { title: 'Sprint 1: Basics', topics: [{ title: 'Introduction' }, { title: 'Core Concepts' }] },
          { title: 'Sprint 2: Advanced', topics: [{ title: 'Deep Dive' }, { title: 'Best Practices' }] }
        ]
      }
    }),
  });
  if (!rRes.ok) throw new Error('Failed to create roadmap');
  return goal;
}

// ── Component ────────────────────────────────────────────────────────────────

export function RoadmapPage() {
  const { session } = useAuthStore();
  const jwt = session?.access_token ?? '';
  const queryClient = useQueryClient();

  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ id: string; title: string } | null>(null);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['goals', jwt],
    queryFn: () => fetchGoals(jwt),
    enabled: !!jwt,
  });

  useEffect(() => {
    if (goals.length > 0 && !activeGoalId) {
      setActiveGoalId(goals[0].id);
    }
  }, [goals, activeGoalId]);

  const { data: roadmap, isLoading: loadingRoadmap } = useQuery({
    queryKey: ['roadmap', jwt, activeGoalId],
    queryFn: () => fetchRoadmap(jwt, activeGoalId!),
    enabled: !!jwt && !!activeGoalId,
  });

  const topicMutation = useMutation({
    mutationFn: (args: { topicId: string; updates: Partial<Topic> }) => updateTopic(jwt, args.topicId, args.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', jwt, activeGoalId] });
      setEditingTopic(null);
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (title: string) => createGoalAndMockRoadmap(jwt, title),
    onSuccess: (newGoal) => {
      queryClient.invalidateQueries({ queryKey: ['goals', jwt] });
      setActiveGoalId(newGoal.id);
      setIsCreatingGoal(false);
      setNewGoalTitle('');
    },
  });

  const toggleTopicCompletion = (topic: Topic) => {
    topicMutation.mutate({ topicId: topic.id, updates: { is_completed: !topic.is_completed } });
  };

  const saveTopicTitle = () => {
    if (editingTopic && editingTopic.title.trim()) {
      topicMutation.mutate({ topicId: editingTopic.id, updates: { title: editingTopic.title.trim() } });
    } else {
      setEditingTopic(null);
    }
  };

  if (loadingGoals) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary size-8" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-oatmeal/20 bg-surface-container-lowest/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-headline-md font-serif text-on-surface">Roadmap</h1>
            <nav className="hidden md:flex items-center gap-4">
              <a href="/dashboard" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Dashboard</a>
              <span className="text-sm font-medium text-primary">Roadmap</span>
              <a href="/notes" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Notes</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid md:grid-cols-4 gap-8">
        
        {/* Sidebar: Goal Switcher */}
        <aside className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-label-lg font-semibold uppercase tracking-wider text-on-surface-variant">Your Goals</h2>
          </div>
          
          <div className="space-y-2">
            {goals.map(goal => (
              <button
                key={goal.id}
                onClick={() => setActiveGoalId(goal.id)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-lg border transition-all text-sm font-medium',
                  activeGoalId === goal.id 
                    ? 'bg-primary-container/20 border-primary/30 text-primary' 
                    : 'bg-surface-container-lowest border-transparent hover:border-oatmeal/30 text-on-surface-variant hover:text-on-surface'
                )}
              >
                {goal.title}
              </button>
            ))}
          </div>

          {isCreatingGoal ? (
            <div className="space-y-3 bg-surface-container-low p-4 rounded-lg border border-oatmeal/30">
              <Input 
                autoFocus
                placeholder="E.g. Learn React" 
                value={newGoalTitle} 
                onChange={(e) => setNewGoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createGoalMutation.mutate(newGoalTitle)}
                disabled={createGoalMutation.isPending}
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" loading={createGoalMutation.isPending} onClick={() => createGoalMutation.mutate(newGoalTitle)}>Save</Button>
                <Button size="sm" variant="ghost" disabled={createGoalMutation.isPending} onClick={() => setIsCreatingGoal(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full gap-2" onClick={() => setIsCreatingGoal(true)}>
              <Plus className="size-4" />
              New Goal
            </Button>
          )}
        </aside>

        {/* Main Content: Timeline */}
        <section className="md:col-span-3">
          {!activeGoalId ? (
            <div className="text-center py-20">
              <Target className="size-12 mx-auto text-oatmeal/50 mb-4" />
              <h3 className="text-headline-md text-on-surface mb-2">No Goals Found</h3>
              <p className="text-on-surface-variant">Create a learning goal to generate your first roadmap.</p>
            </div>
          ) : loadingRoadmap ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary size-8" /></div>
          ) : !roadmap ? (
            <div className="text-center py-20">
              <h3 className="text-headline-md text-on-surface mb-2">No Roadmap Generated</h3>
              <p className="text-on-surface-variant">This goal doesn't have a roadmap yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {roadmap.sprints.map((sprint, sIdx) => (
                <div key={sprint.id} className="relative">
                  {/* Timeline connecting line */}
                  {sIdx !== roadmap.sprints.length - 1 && (
                    <div className="absolute left-[1.125rem] top-10 bottom-[-2rem] w-px bg-oatmeal/30" />
                  )}
                  
                  <div className="flex items-start gap-6">
                    <div className="relative z-10 size-9 rounded-full bg-surface border-2 border-primary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-primary">{sIdx + 1}</span>
                    </div>
                    
                    <Card className="flex-1">
                      <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-headline-sm font-semibold">{sprint.title}</h3>
                          <Badge variant="secondary" className={sprint.topics.every(t => t.is_completed) ? 'bg-primary-container/20 text-primary' : 'bg-surface-container text-on-surface-variant'}>
                            {sprint.topics.filter(t => t.is_completed).length} / {sprint.topics.length} Done
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <ul className="space-y-1">
                          {sprint.topics.map(topic => (
                            <li key={topic.id} className="group flex items-center gap-3 p-2 hover:bg-surface-container-low rounded-md transition-colors">
                              <button 
                                onClick={() => toggleTopicCompletion(topic)}
                                disabled={topicMutation.isPending}
                                className="shrink-0 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
                              >
                                {topic.is_completed ? <CheckCircle className="size-5 text-primary" /> : <Circle className="size-5" />}
                              </button>
                              
                              {editingTopic?.id === topic.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input 
                                    autoFocus
                                    className="flex-1 bg-surface border border-oatmeal rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
                                    value={editingTopic.title}
                                    onChange={e => setEditingTopic({ ...editingTopic, title: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && saveTopicTitle()}
                                    disabled={topicMutation.isPending}
                                  />
                                  <button onClick={saveTopicTitle} className="p-1 text-primary hover:bg-primary-container/20 rounded"><Check className="size-4" /></button>
                                  <button onClick={() => setEditingTopic(null)} className="p-1 text-error hover:bg-error-container/20 rounded"><X className="size-4" /></button>
                                </div>
                              ) : (
                                <>
                                  <span className={cn('flex-1 text-sm transition-all', topic.is_completed && 'text-on-surface-variant line-through')}>
                                    {topic.title}
                                  </span>
                                  <button 
                                    onClick={() => setEditingTopic({ id: topic.id, title: topic.title })}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded transition-all"
                                  >
                                    <Edit2 className="size-3.5" />
                                  </button>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
