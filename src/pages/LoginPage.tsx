import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, User, GraduationCap, ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';
import { cn } from '../utils';
import { NeuralBackground } from '../components/NeuralBackground';
import { api, saveToken } from '../api';

interface LoginPageProps {
  onBack: () => void;
  onLogin: (role: UserRole, name: string, email: string, id?: string, is_coordinator?: boolean) => void;
  initialMode?: 'login' | 'signup';
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onLogin, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // All three roles available on LOGIN; Admin excluded from SIGNUP
  const loginRoles = [
    { id: 'admin', label: 'Admin', icon: Shield, color: 'text-red-400' },
    { id: 'faculty', label: 'Faculty', icon: User, color: 'text-primary' },
    { id: 'student', label: 'Student', icon: GraduationCap, color: 'text-secondary' },
  ];
  const signupRoles = [
    { id: 'faculty', label: 'Faculty', icon: User, color: 'text-primary' },
    { id: 'student', label: 'Student', icon: GraduationCap, color: 'text-secondary' },
  ];
  const roles = mode === 'signup' ? signupRoles : loginRoles;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setSelectedRole(null);
  };

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedRole) return;

    // Validate email format
    if (!validateEmail(email)) {
      setError('Please enter a valid email address (e.g. name@university.edu)');
      return;
    }
    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await api.auth.signup({ name: name.trim(), email, password, role: selectedRole });
        saveToken(res.token);
        onLogin(selectedRole, res.user.name, res.user.email, String(res.user.id), false);
      } else {
        const res = await api.auth.login({ email, password, role: selectedRole });
        saveToken(res.token);
        onLogin(selectedRole, res.user.name, res.user.email, String(res.user.id), !!res.user.is_coordinator);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6 relative">
      <NeuralBackground />
      <div className="absolute top-8 left-8 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
            <span className="text-black font-bold text-3xl">Q</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-gray-400">
            {mode === 'login'
              ? 'Select your role to continue to the dashboard'
              : 'Join Q-Sage AI to start generating academic content'}
          </p>
        </div>

        {!selectedRole ? (
          <div className="grid gap-4">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id as UserRole)}
                className="card flex items-center gap-4 hover:border-primary/50 transition-all group text-left"
              >
                <div className={cn("w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors", role.color)}>
                  <role.icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{role.label}</h3>
                  <p className="text-sm text-gray-500">Access {role.label.toLowerCase()} specific tools</p>
                </div>
              </button>
            ))}

            {/* Hide Sign Up toggle for faculty and admin */}
            {mode !== 'signup' || (selectedRole !== 'faculty' && selectedRole !== 'admin') ? (
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                  <button
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); resetForm(); }}
                    className="text-primary font-bold hover:underline"
                  >
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => { setSelectedRole(null); setError(''); }}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft size={18} />
              </button>
              <h3 className="text-xl font-bold">
                {mode === 'login' ? 'Login' : 'Sign Up'} as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              </h3>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name — only on Sign Up */}
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full input-field"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Enter your full name"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="name@university.edu"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary mt-4 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? (mode === 'login' ? 'Signing in...' : 'Creating...') : (mode === 'login' ? 'Sign In' : 'Create Account')}
              </button>

              {/* Sign Up / Sign In toggle — hidden for faculty and admin (admin-controlled accounts only) */}
              {(selectedRole !== 'faculty' && selectedRole !== 'admin') ? (
                <p className="text-center text-gray-500 text-sm pt-2">
                  {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                    className="text-primary font-bold hover:underline"
                  >
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              ) : null}
              {selectedRole === 'faculty' && (
                <p className="text-center text-gray-500 text-xs pt-2">
                  Faculty accounts are managed by the Admin.
                </p>
              )}
              {selectedRole === 'admin' && mode === 'login' && (
                <p className="text-center text-gray-500 text-xs pt-2">
                  Admin access is restricted to authorized personnel only.
                </p>
              )}
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
