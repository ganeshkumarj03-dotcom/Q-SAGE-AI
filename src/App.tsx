import React, { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './pages/StudentDashboard';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserRole, User } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { clearToken } from './api';

// ── Admin-only guard component ────────────────────────────────────────────────
const AccessDenied: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
      <span className="text-red-400 text-4xl">🔒</span>
    </div>
    <h2 className="text-2xl font-bold text-red-400">Access Denied – Admins Only</h2>
    <p className="text-gray-400 max-w-sm">
      You do not have permission to access this page. Please log in with an admin account.
    </p>
  </div>
);

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleSignIn = () => {
    setAuthMode('login');
    setView('login');
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setView('login');
  };

  const handleBackToHome = () => setView('landing');

  const handleLogin = (role: UserRole, name: string, email: string, id?: string, is_coordinator?: boolean) => {
    const newUser: User = {
      id: id || '1',
      name,
      role,
      email,
      is_coordinator: !!is_coordinator,
    };
    setUser(newUser);
    setView('dashboard');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setView('landing');
  };

  if (view === 'landing') {
    return <LandingPage onSignIn={handleSignIn} onSignUp={handleSignUp} />;
  }

  if (view === 'login') {
    return <LoginPage onBack={handleBackToHome} onLogin={handleLogin} initialMode={authMode} />;
  }

  // ── Role-based dashboard rendering with access guards ────────────────────────
  const renderDashboard = () => {
    if (user?.role === 'student') return <StudentDashboard activeTab={activeTab} />;
    if (user?.role === 'faculty') return <FacultyDashboard activeTab={activeTab} isCoordinator={!!user?.is_coordinator} setActiveTab={setActiveTab} />;
    if (user?.role === 'admin') return <AdminDashboard activeTab={activeTab} />;
    // Fallback: unknown or missing role — deny access
    return <AccessDenied />;
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#1C1C1C' }}>
      <Sidebar
        role={user?.role || null}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isCoordinator={!!user?.is_coordinator}
      />

      <div className="flex-1 ml-64 flex flex-col cyber-grid">
        <Navbar userName={user?.name || ''} role={user?.role || ''} />

        <main className="p-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderDashboard()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
