import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { applyTheme } from '../lib/theme';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';
import { Target, BookOpen, Clock, TrendingUp, Plus, ArrowRight, Sparkles, Bot, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface LearningGoal {
  id: string;
  title: string;
  status: string;
  target_completion_date: string | null;
  created_at: string;
}

export function DashboardPage() {
  const { user, session } = useAuthStore();
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGoal, setActiveGoal] = useState<LearningGoal | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<{ avatar_url?: string | null; theme_preference?: string } | null>(null);
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      if (!session?.access_token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals?status=active`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const { goals: data } = await res.json();
          setGoals(data);
          if (data.length > 0) setActiveGoal(data[0]);
        }
      } catch { /* handle error */ }
      setLoading(false);
    };

    const fetchProfile = async () => {
      if (!session?.access_token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const { profile: p } = await res.json();
          setProfile(p);
          applyTheme(p?.theme_preference);
        }
      } catch { /* ignore — dashboard still works without profile */ }
    };

    fetchGoals();
    fetchProfile();

    // Not using supabase.auth.onAuthStateChange here for the sake of simplicity, 
    // App.tsx already handles global session state. We'll just rely on the store.
  }, [session, user]);

  useEffect(() => {
    const fetchRoadmap = async () => {
      if (!session?.access_token || !activeGoal) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals/${activeGoal.id}/roadmap`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const { roadmap } = await res.json();
          setRoadmapData(roadmap);
        } else {
          setRoadmapData(null);
        }
      } catch {
        setRoadmapData(null);
      }
    };
    fetchRoadmap();
  }, [activeGoal, session]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    useAuthStore.getState().signOut();
    window.location.href = '/';
  };

  // Calculate actual progress based on roadmapData
  let totalTopics = 0;
  let completedTopics = 0;
  let totalSprints = 0;

  if (roadmapData?.sprints) {
    totalSprints = roadmapData.sprints.length;
    roadmapData.sprints.forEach((sprint: any) => {
      if (sprint.topics) {
        totalTopics += sprint.topics.length;
        completedTopics += sprint.topics.filter((t: any) => t.is_completed).length;
      }
    });
  }

  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const stats = [
    { label: 'Active Goal', value: activeGoal?.title || 'None', icon: Target, color: 'text-primary' },
    { label: 'Progress', value: `${progressPercent}%`, icon: TrendingUp, color: 'text-secondary' },
    { label: 'Time This Week', value: '0h', icon: Clock, color: 'text-primary' },
    { label: 'Streak', value: '0 days', icon: Sparkles, color: 'text-secondary' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-oatmeal/20 bg-surface-container-lowest/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-headline-md font-serif text-on-surface">LearnHub AI</h1>
            <nav className="hidden md:flex items-center gap-6">
              <a href="/dashboard" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Dashboard</a>
              <a href="/chat" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">AI Chat</a>
              <a href="/roadmap" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Roadmap</a>
              <a href="/notes" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Notes</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                id="user-menu-button"
                onClick={() => setMenuOpen((o) => !o)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
                  'hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                )}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="You" className="size-8 rounded-full object-cover" />
                ) : (
                  <div className="size-8 rounded-full bg-primary-container/20 flex items-center justify-center">
                    <User className="size-4 text-primary" />
                  </div>
                )}
                <span className="hidden sm:block text-sm">{user?.email?.split('@')[0]}</span>
                <ChevronDown className={cn('size-4 transition-transform', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 card shadow-lg py-1 z-50 animate-fade-in"
                >
                  <a
                    href="/settings"
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings className="size-4" />
                    Settings
                  </a>
                  <button
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition-colors"
                  >
                    <LogOut className="size-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <section className="mb-8 animate-fade-in">
          <h2 className="text-headline-lg mb-2">Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Learner'}!</h2>
          <p className="text-on-surface-variant">Continue your learning journey or start something new.</p>
        </section>

        {/* Stats Cards */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={stat.label} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">{stat.label}</p>
                    <p className="text-2xl font-semibold text-on-surface mt-1">{stat.value}</p>
                  </div>
                  <div className={cn('size-10 rounded-lg flex items-center justify-center', `${stat.color}/20`)}>
                    <stat.icon className="size-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Active Goal & Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Current Goal */}
          <section className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-headline-md">Current Goal</h3>
                    <p className="text-on-surface-variant text-sm mt-1">
                      {activeGoal ? `Target: ${new Date(activeGoal.target_completion_date || Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}` : 'No active goal'}
                    </p>
                  </div>
                  {activeGoal && (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {activeGoal ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-label-md font-medium">Overall Progress</span>
                        <span className="text-label-md text-on-surface-variant">{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-3" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Card className="bg-surface-container-low p-4">
                        <p className="text-3xl font-semibold text-primary">{completedTopics}</p>
                        <p className="text-sm text-on-surface-variant">Topics Completed</p>
                      </Card>
                      <Card className="bg-surface-container-low p-4">
                        <p className="text-3xl font-semibold text-secondary">{totalSprints}</p>
                        <p className="text-sm text-on-surface-variant">Sprints</p>
                      </Card>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button variant="primary" className="flex-1 gap-2" onClick={() => window.location.href = '/roadmap'}>
                        <BookOpen className="size-4" />
                        View Roadmap
                      </Button>
                      <Button variant="secondary" className="flex-1 gap-2" onClick={() => window.location.href = '/chat'}>
                        <Sparkles className="size-4" />
                        Chat with AI
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="size-12 mx-auto text-oatmeal/50 mb-4" />
                    <h4 className="text-headline-md mb-2">No active goal yet</h4>
                    <p className="text-on-surface-variant mb-6 max-w-xs mx-auto">
                      Create your first learning goal and let AI generate a personalized roadmap for you.
                    </p>
                    <Button size="lg" className="gap-2" onClick={() => window.location.href = '/chat'}>
                      <Plus className="size-4" />
                      Create New Goal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <h3 className="text-headline-md">Quick Actions</h3>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-24 flex-col gap-2 justify-center" onClick={() => window.location.href = '/chat'}>
                    <Sparkles className="size-6" />
                    <span>New Goal with AI</span>
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button variant="outline" className="h-24 flex-col gap-2 justify-center" onClick={() => window.location.href = '/roadmap'}>
                    <BookOpen className="size-6" />
                    <span>View Roadmap</span>
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button variant="outline" className="h-24 flex-col gap-2 justify-center" onClick={() => window.location.href = '/notes'}>
                    <BookOpen className="size-6" />
                    <span>Take Notes</span>
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button variant="outline" className="h-24 flex-col gap-2 justify-center" onClick={() => window.location.href = '/chat'}>
                    <Bot className="size-6" />
                    <span>Ask AI Assistant</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Learning Stats */}
            <Card>
              <CardHeader>
                <h3 className="text-headline-md">This Week</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
                      <Clock className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-label-md font-medium">Study Time</p>
                      <p className="text-sm text-on-surface-variant">0h 0m</p>
                    </div>
                  </div>
                  <TrendingUp className="size-5 text-secondary" />
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-secondary-container/20 flex items-center justify-center">
                      <Target className="size-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-label-md font-medium">Topics Done</p>
                      <p className="text-sm text-on-surface-variant">{completedTopics}</p>
                    </div>
                  </div>
                  <TrendingUp className="size-5 text-secondary" />
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
                      <Sparkles className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-label-md font-medium">Current Streak</p>
                      <p className="text-sm text-on-surface-variant">0 days</p>
                    </div>
                  </div>
                  <TrendingUp className="size-5 text-secondary" />
                </div>
              </CardContent>
            </Card>

            {/* All Goals */}
            {goals.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-headline-md">Your Goals</h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setActiveGoal(goal)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-colors',
                        activeGoal?.id === goal.id
                          ? 'bg-primary-container/20 text-primary'
                          : 'hover:bg-surface-container-low'
                      )}
                    >
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-sm text-on-surface-variant mt-1">
                        {goal.target_completion_date
                          ? `Target: ${new Date(goal.target_completion_date).toLocaleDateString()}`
                          : 'No target date'}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}