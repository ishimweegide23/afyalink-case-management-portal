import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'social_worker' | 'supervisor' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => void;
  logout: () => void;
  register: (name: string, email: string, phone: string, password: string, role: UserRole) => void;
}

/**
 * ROLE-BASED PERMISSIONS:
 * 
 * ADMIN:
 * - Full system access
 * - View all beneficiaries, cases, interventions, documents
 * - Manage users (create, update, delete)
 * - Generate all reports
 * - Configure system settings
 * - View system-wide analytics
 * 
 * SUPERVISOR:
 * - View cases of assigned social workers only
 * - Review case progress and details
 * - Approve or comment on interventions
 * - Generate reports for their team
 * - Monitor team performance
 * - Cannot create users (monitoring role)
 * 
 * SOCIAL WORKER:
 * - Manage ONLY their assigned cases
 * - Register new beneficiaries
 * - Create and update case files for assigned beneficiaries
 * - Record interventions for their cases
 * - Schedule follow-ups
 * - Upload documents for their cases
 * - View own performance summary
 * - Cannot access other workers' cases
 */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string, role: UserRole) => {
    // Mock login - in real app, this would call an API
    if (role) {
      setUser({
        id: '1',
        name: 'Demo User',
        email,
        role,
      });
    }
  };

  const register = (name: string, email: string, phone: string, password: string, role: UserRole) => {
    // Mock registration - in real app, this would call an API
    if (role) {
      setUser({
        id: '1',
        name,
        email,
        role,
      });
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}