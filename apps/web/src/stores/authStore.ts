import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      loading: true,
      setSession: (session) => set({ session, user: session?.user ?? null, loading: false }),
      setLoading: (loading) => set({ loading }),
      signOut: () => set({ session: null, user: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ session: state.session, user: state.user }),
    }
  )
);