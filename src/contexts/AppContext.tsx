import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { logoutUser } from '@/api';
import { initializeRealtime } from '@/services/realtime';

interface User {
  name: string;
  email: string;
  avatar?: string;
  id?: string;
  role?: string;
}

interface Workspace {
  name: string;
  plan: string;
  avatar?: string;
}

interface AppContextType {
  user: User | null;
  workspace: Workspace | null;
  activeSection: string;
  isAuthenticated: boolean;
  token: string | null;
  setActiveSection: (section: string) => void;
  setUser: (user: User | null) => void;
  setWorkspace: (workspace: Workspace | null) => void;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TOKEN_KEY = 'vezlo_auth_token';
const USER_KEY = 'vezlo_user';
const WORKSPACE_KEY = 'vezlo_workspace';

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [workspace, setWorkspace] = useState<Workspace | null>(() => {
    const storedWorkspace = localStorage.getItem(WORKSPACE_KEY);
    return storedWorkspace ? JSON.parse(storedWorkspace) : null;
  });
  const [activeSection, setActiveSection] = useState('widget');
  const isAuthenticated = !!token && !!user;

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (workspace) {
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
    } else {
      localStorage.removeItem(WORKSPACE_KEY);
    }
  }, [workspace]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    if (token) {
      try {
        await logoutUser(token);
      } catch (error) {
        console.error('[AppContext] Failed to logout via API:', error);
      }
    }
    setToken(null);
    setUser(null);
    setWorkspace(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(WORKSPACE_KEY);
  };

  // Initialize Realtime connection on app load
  useEffect(() => {
    initializeRealtime();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        workspace,
        activeSection,
        isAuthenticated,
        token,
        setActiveSection,
        setUser,
        setWorkspace,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

