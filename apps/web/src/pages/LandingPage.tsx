import { ArrowRight, BookOpen, Bot, Target, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export function LandingPage() {
  const features = [
    {
      icon: Target,
      title: 'AI-Generated Roadmaps',
      description: 'Tell us your learning goal and get a structured, multi-sprint roadmap with topics, resources, and time estimates.',
    },
    {
      icon: BookOpen,
      title: 'Smart Notes with Version History',
      description: 'Create rich-text notes linked to your roadmap topics. Full version history and PDF export built in.',
    },
    {
      icon: Bot,
      title: 'Context-Aware AI Chat',
      description: 'Chat with an AI that knows your roadmap, notes, and progress. Get answers grounded in your learning materials.',
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking & Analytics',
      description: 'Visual progress bars, streak tracking, time-spent analytics, and estimated completion dates.',
    },
    {
      icon: Sparkles,
      title: 'AI Resource Recommendations',
      description: 'Every topic comes with curated YouTube videos, courses, documentation, and supplementary resources.',
    },
    {
      icon: Clock,
      title: 'Built for Deep Work',
      description: 'Minimalist, distraction-free interface with a warm color palette designed for long study sessions.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container/20 text-secondary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="size-4" />
            <span>LearnHub AI - Your AI Learning Companion</span>
          </div>
          <h1 className="text-display-lg lg:text-[64px] font-serif font-semibold text-on-surface tracking-[-0.02em] leading-[1.1] max-w-4xl mx-auto mb-6 animate-slide-up">
            Learn anything,{' '}
            <span className="text-primary">faster</span>
            {' '}with AI
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Transform your learning goals into structured roadmaps, chat with context-aware AI, track progress, and build a personal knowledge base — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Button size="lg" className="w-full sm:w-auto gap-2" onClick={() => window.location.href = '/auth'}>
              Get Started Free
              <ArrowRight className="size-5" />
            </Button>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => window.location.href = '/auth'}>
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-24 px-6 bg-surface-container-low">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-headline-lg mb-4">Everything you need to learn effectively</h2>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              From goal to mastery — our AI handles the planning so you can focus on learning.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={feature.title} className="hover:border-primary/50 transition-colors duration-200 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="p-6 space-y-4">
                  <div className="size-12 rounded-lg bg-primary-container/20 flex items-center justify-center">
                    <feature.icon className="size-6 text-primary" />
                  </div>
                  <h3 className="text-headline-md">{feature.title}</h3>
                  <p className="text-body-md text-on-surface-variant">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-headline-lg mb-4">Ready to start learning?</h2>
          <p className="text-body-lg text-on-surface-variant mb-8">
            Join thousands of learners who are achieving their goals with AI-powered roadmaps.
          </p>
          <Button size="lg" className="gap-2" onClick={() => window.location.href = '/auth'}>
            Create Your First Roadmap
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-oatmeal/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-headline-md mb-4">LearnHub AI</h3>
              <p className="text-body-md text-on-surface-variant max-w-xs">
                Your AI-powered learning companion. Transform goals into structured roadmaps, track progress, and chat with context-aware AI.
              </p>
            </div>
            <div>
              <h4 className="text-label-md font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li><a href="/auth" className="hover:text-primary transition-colors">Get Started</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-label-md font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-oatmeal/20">
            <p className="text-sm text-on-surface-variant">
              © 2024 LearnHub AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-on-surface-variant hover:text-primary transition-colors" aria-label="GitHub">
                GitHub
              </a>
              <a href="#" className="text-on-surface-variant hover:text-primary transition-colors" aria-label="Twitter">
                Twitter
              </a>
              <a href="#" className="text-on-surface-variant hover:text-primary transition-colors" aria-label="LinkedIn">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}