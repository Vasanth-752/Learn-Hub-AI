import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/authStore';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import './index.css';

function App() {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route index element={<LandingPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<div className="min-h-screen flex items-center justify-center bg-background"><p className="text-on-surface-variant">AI Chat - Coming Soon</p></div>} />
          <Route path="/roadmap" element={<div className="min-h-screen flex items-center justify-center bg-background"><p className="text-on-surface-variant">Roadmap - Coming Soon</p></div>} />
          <Route path="/notes" element={<div className="min-h-screen flex items-center justify-center bg-background"><p className="text-on-surface-variant">Notes - Coming Soon</p></div>} />
          <Route path="/settings" element={<div className="min-h-screen flex items-center justify-center bg-background"><p className="text-on-surface-variant">Settings - Coming Soon</p></div>} />
        </Route>

        {/* Redirect all other routes to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;