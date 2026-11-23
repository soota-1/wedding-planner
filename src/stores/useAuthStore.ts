import { create } from 'zustand';

export interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

export interface Workspace {
  id: string;
  name: string;
  wedding_date: string;
  religion_template?: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  activeWorkspace: Workspace | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  activeWorkspace: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSession: (session) => set({ session }),
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  reset: () => set({ user: null, session: null, activeWorkspace: null, isAuthenticated: false }),
}));
