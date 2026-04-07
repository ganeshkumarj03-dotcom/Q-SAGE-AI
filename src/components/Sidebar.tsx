import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Upload,
  Database,
  LogOut,
  Users,
  ShieldCheck,
  PlusCircle,
  Eye,
  FlaskConical,
  MessageSquare,
  FileUp,
  ClipboardCheck,
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isCoordinator?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, setActiveTab, onLogout, isCoordinator }) => {
  const facultyItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload-syllabus', label: 'Upload Syllabus', icon: Upload },
    { id: 'generate-qbank', label: 'Generate Q-Bank', icon: PlusCircle },
    { id: 'upload-qbank-file', label: 'Upload Q-Bank', icon: FileUp },
    { id: 'preview-qbank', label: 'Preview Q-Bank', icon: Eye },
    { id: 'generate-paper', label: 'Generate Paper', icon: FileText },
    { id: 'go-chat', label: 'Go Chat', icon: MessageSquare },
    // Coordinator Panel — only visible to Year Coordinators
    ...(isCoordinator ? [{ id: 'coordinator-panel', label: 'Coordinator Panel', icon: ClipboardCheck }] : []),
  ];

  const menuItems: Record<string, { id: string; label: string; icon: any }[]> = {
    student: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'syllabus', label: 'View Syllabus', icon: BookOpen },
      { id: 'qbank', label: 'Question Bank', icon: Database },
      { id: 'mock-test', label: 'Mock Test', icon: FlaskConical },
    ],
    faculty: facultyItems,
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'manage-faculty', label: 'Manage Faculty', icon: Users },
      { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
    ],
  };

  const currentMenu = role ? (menuItems[role] ?? []) : [];

  return (
    <div
      className="w-64 h-screen flex flex-col fixed left-0 top-0 z-50"
      style={{ background: '#1C1C1C', borderRight: '1px solid rgba(0,255,245,0.08)' }}
    >
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(0,255,245,0.08)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded flex items-center justify-center font-bold text-black text-base"
            style={{ background: 'linear-gradient(135deg, #00FFF5, #007CF0)', boxShadow: '0 0 12px rgba(0,255,245,0.5)' }}
          >Q</div>
          <span className="text-lg font-bold tracking-tight" style={{ color: '#D9D9D9' }}>
            Q-Sage <span style={{ color: '#00FFF5' }}>AI</span>
          </span>
        </div>
        {/* Coordinator badge */}
        {role === 'faculty' && isCoordinator && (
          <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
            <ClipboardCheck size={12} /> Year Coordinator
          </div>
        )}
      </div>

      <div className="accent-line" />

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {currentMenu.map((item) => {
          const isActive = activeTab === item.id;
          const isCoordItem = item.id === 'coordinator-panel';
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded transition-all duration-200 text-left text-sm font-medium"
              style={isActive ? {
                background: isCoordItem ? 'rgba(251,191,36,0.10)' : 'rgba(0,255,245,0.08)',
                color: isCoordItem ? '#fbbf24' : '#00FFF5',
                borderLeft: `2px solid ${isCoordItem ? '#fbbf24' : '#00FFF5'}`,
                boxShadow: `0 0 12px ${isCoordItem ? 'rgba(251,191,36,0.08)' : 'rgba(0,255,245,0.08)'}`,
              } : {
                color: isCoordItem ? 'rgba(251,191,36,0.6)' : 'rgba(217,217,217,0.5)',
                borderLeft: '2px solid transparent',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = isCoordItem ? '#fbbf24' : '#D9D9D9';
                  (e.currentTarget as HTMLElement).style.background = isCoordItem ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.03)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = isCoordItem ? 'rgba(251,191,36,0.6)' : 'rgba(217,217,217,0.5)';
                  (e.currentTarget as HTMLElement).style.background = '';
                }
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(0,255,245,0.08)' }}>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-sm font-medium transition-all"
          style={{ color: 'rgba(217,217,217,0.4)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = '#ff4d4d';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,77,0.06)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(217,217,217,0.4)';
            (e.currentTarget as HTMLElement).style.background = '';
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
