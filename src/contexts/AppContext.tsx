import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  name: string;
  email: string;
  avatar?: string;
  id?: string;
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
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TOKEN_KEY = 'vezlo_auth_token';
const USER_KEY = 'vezlo_user';

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [workspace, setWorkspace] = useState<Workspace | null>({
    name: 'Vezlo · Workspace',
    plan: 'Community Edition',
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

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

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

