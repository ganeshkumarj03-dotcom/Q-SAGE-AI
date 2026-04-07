import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Database, FileText, Zap } from 'lucide-react';
import { NeuralBackground } from '../components/NeuralBackground';

interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onSignUp }) => {
  return (
    <div className="min-h-screen bg-bg-dark overflow-hidden relative cyber-grid">
      <NeuralBackground />

      {/* Cyan ambient glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-[120px] -z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,255,245,0.06) 0%, transparent 70%)' }} />

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto relative z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded flex items-center justify-center glow-cyan-sm"
            style={{ background: 'linear-gradient(135deg, #00FFF5, #007CF0)' }}>
            <span className="text-black font-bold text-lg">Q</span>
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ color: '#D9D9D9' }}>
            Q-Sage <span style={{ color: '#00FFF5' }} className="text-glow-cyan">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onSignIn}
            className="text-sm font-semibold transition-colors"
            style={{ color: '#D9D9D9' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00FFF5')}
            onMouseLeave={e => (e.currentTarget.style.color = '#D9D9D9')}
          >
            Sign In
          </button>
          <button
            onClick={onSignUp}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-8 pt-24 pb-32 relative z-10">
        <div className="text-center max-w-4xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
            style={{
              border: '1px solid rgba(0,255,245,0.3)',
              color: '#00FFF5',
              background: 'rgba(0,255,245,0.05)',
              boxShadow: '0 0 12px rgba(0,255,245,0.15)'
            }}
          >
            <Zap size={12} /> AI-Driven Academic Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-6xl md:text-7xl font-bold tracking-tight leading-tight mb-6"
            style={{ color: '#D9D9D9' }}
          >
            AI-Powered{' '}
            <span className="text-glow-cyan" style={{ color: '#00FFF5' }}>Question</span>
            <br />Generation System
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg mb-12 leading-relaxed max-w-2xl mx-auto"
            style={{ color: 'rgba(217,217,217,0.6)' }}
          >
            Create high-quality questions and professional question papers effortlessly using advanced AI technology. Designed for modern academic excellence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap justify-center gap-4 mb-20"
          >
            <button onClick={onSignUp} className="btn-primary px-8 py-3 text-base flex items-center gap-2">
              Start Free <ArrowRight size={18} />
            </button>
            <button onClick={onSignIn} className="btn-secondary px-8 py-3 text-base">
              Sign In
            </button>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-6"
          >
            {[
              {
                icon: Database,
                title: 'Question Bank',
                desc: 'Automated generation of MCQs, short and long answers from your syllabus.',
                color: '#00FFF5',
              },
              {
                icon: FileText,
                title: 'Question Paper',
                desc: 'Generate professional university-standard question papers in minutes.',
                color: '#007CF0',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4, scale: 1.02 }}
                className="card w-80 text-left group cursor-default"
                style={{ borderColor: 'rgba(0,255,245,0.08)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `rgba(0,255,245,0.3)`;
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(0,255,245,0.12)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,245,0.08)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
              >
                <div className="w-12 h-12 rounded flex items-center justify-center mb-4 transition-all"
                  style={{ background: `rgba(0,255,245,0.08)`, boxShadow: `0 0 12px rgba(0,255,245,0.12)` }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#D9D9D9' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(217,217,217,0.5)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-10 relative z-10" style={{ borderColor: 'rgba(0,255,245,0.08)' }}>
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm" style={{ color: 'rgba(217,217,217,0.4)' }}>© 2026 Q-Sage AI. All rights reserved.</p>
          <div className="flex gap-8 text-sm" style={{ color: 'rgba(217,217,217,0.4)' }}>
            {['Privacy Policy', 'Terms of Service', 'Contact Support'].map(link => (
              <a key={link} href="#"
                className="transition-colors"
                onMouseEnter={e => (e.currentTarget.style.color = '#00FFF5')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(217,217,217,0.4)')}
              >{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
