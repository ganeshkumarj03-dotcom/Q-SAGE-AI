import React from 'react';
import { Bell, Search, User } from 'lucide-react';

interface NavbarProps {
  userName: string;
  role: string;
}

export const Navbar: React.FC<NavbarProps> = ({ userName, role }) => {
  return (
    <div
      className="h-16 flex items-center justify-between px-8 sticky top-0 z-40"
      style={{
        background: 'rgba(28,28,28,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,255,245,0.08)',
      }}
    >
      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'rgba(217,217,217,0.3)' }} />
          <input
            type="text"
            placeholder="Search questions, papers, syllabus..."
            className="w-full text-sm input-field"
            style={{ paddingLeft: '2.25rem', paddingRight: '1rem' }}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        {/* Bell */}
        <button className="relative transition-colors" style={{ color: 'rgba(217,217,217,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00FFF5')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(217,217,217,0.4)')}
        >
          <Bell size={20} />
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
            style={{ background: '#00FFF5', boxShadow: '0 0 6px #00FFF5' }}
          />
        </button>

        {/* User info */}
        <div
          className="flex items-center gap-3 pl-6"
          style={{ borderLeft: '1px solid rgba(0,255,245,0.08)' }}
        >
          <div className="text-right">
            <p className="text-sm font-semibold" style={{ color: '#D9D9D9' }}>{userName}</p>
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: '#00FFF5', textShadow: '0 0 8px rgba(0,255,245,0.5)' }}
            >{role}</p>
          </div>
          <div
            className="w-10 h-10 rounded flex items-center justify-center"
            style={{
              background: 'rgba(0,255,245,0.06)',
              border: '1px solid rgba(0,255,245,0.2)',
              color: '#00FFF5',
            }}
          >
            <User size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};
