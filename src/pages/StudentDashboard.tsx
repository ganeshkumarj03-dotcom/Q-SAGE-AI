import React, { useState, useEffect } from 'react';
import {
  Book, Download, FileText, BookOpen, Inbox,
  Loader2, CheckCircle2, XCircle, AlertCircle, X, ChevronDown,
  ChevronUp, Brain, Trophy, RefreshCw
} from 'lucide-react';
import { api } from '../api';
import { motion, AnimatePresence } from 'motion/react';


// ── Shared helpers ──────────────────────────────────────
const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
      <Icon size={36} className="text-gray-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-400 mb-1">{title}</h3>
    <p className="text-sm text-gray-600 max-w-xs">{subtitle}</p>
  </div>
);

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${type === 'success' ? 'bg-green-900/80 border-green-500/40 text-green-200' : 'bg-red-900/80 border-red-500/40 text-red-200'}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={14} /></button>
    </motion.div>
  );
}

const BTL_COLORS: Record<string, string> = {
  'BTL1-Remember': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'BTL2-Understand': 'bg-green-500/20 text-green-300 border-green-500/30',
  'BTL3-Apply': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'BTL4-Analyze': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'BTL5-Evaluate': 'bg-red-500/20 text-red-300 border-red-500/30',
  'BTL6-Create': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

const CO_COLORS: Record<string, string> = {
  CO1: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  CO2: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  CO3: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  CO4: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  CO5: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  CO6: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${colorClass}`}>{label}</span>;
}

// ── Main Component ───────────────────────────────────────
export const StudentDashboard: React.FC<{ activeTab: string; user?: any }> = ({ activeTab, user }) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

  return (
    <>
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      {activeTab === 'dashboard' && <StudentOverview />}
      {activeTab === 'syllabus' && <ViewSyllabus showToast={showToast} />}
      {activeTab === 'qbank' && <QuestionBank showToast={showToast} />}
      {activeTab === 'mock-test' && <MockTest showToast={showToast} />}
    </>
  );
};

// ── Student Overview ─────────────────────────────────────
function StudentOverview() {
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [lastScore, setLastScore] = useState<{ score: number; total: number } | null>(
    JSON.parse(localStorage.getItem('qsage_last_score') || 'null')
  );

  useEffect(() => {
    api.syllabi.list().then(setSyllabi).catch(() => { });
    api.questions.list().then(setQuestions).catch(() => { });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Welcome back, Student!</h1>
        <p className="text-gray-400">{new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <Book className="text-primary mb-4" size={32} />
          <h3 className="text-xl font-bold mb-1">Active Subjects</h3>
          <p className="text-4xl font-bold">{syllabi.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20">
          <FileText className="text-secondary mb-4" size={32} />
          <h3 className="text-xl font-bold mb-1">Questions Available</h3>
          <p className="text-4xl font-bold">{questions.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <Trophy className="text-purple-400 mb-4" size={32} />
          <h3 className="text-xl font-bold mb-1">Last Mock Score</h3>
          <p className="text-4xl font-bold">
            {lastScore ? `${lastScore.score}/${lastScore.total}` : '—'}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold mb-4">Recently Approved Syllabi</h3>
        {syllabi.length === 0 ? (
          <EmptyState icon={Inbox} title="No approved syllabus yet" subtitle="Approved syllabi from your faculty will appear here." />
        ) : (
          <div className="space-y-3">
            {syllabi.slice(0, 3).map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl border border-white/5">
                <BookOpen size={18} className="text-primary shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{s.course_name}</p>
                  <p className="text-xs text-gray-500">{s.course_code} · {s.semester || 'All Semesters'}</p>
                </div>
                {s.file_path && (
                  <a href={`http://localhost:5000/uploads/${s.file_path}`} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-primary/70 hover:text-primary">
                    <Download size={16} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── View Syllabus ─────────────────────────────────────────
function ViewSyllabus({ showToast }: any) {
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.syllabi.list()
      .then(rows => setSyllabi(rows.filter((s: any) => s.status === 'approved')))
      .catch(() => showToast('Failed to load syllabi', 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Academic Syllabus</h1>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : syllabi.length === 0 ? (
        <div className="card">
          <EmptyState icon={BookOpen} title="No syllabus available"
            subtitle="Your faculty hasn't uploaded any approved syllabus yet. Check back soon." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {syllabi.map((s: any) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="card flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{s.course_name}</h3>
                  <p className="text-sm text-gray-500">{s.course_code} · {s.semester || 'All Semesters'}</p>
                  <p className="text-xs text-gray-600 mt-1">By {s.faculty_name || 'Faculty'}</p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-green-500/15 text-green-300 border-green-500/30 shrink-0">
                  Approved
                </span>
              </div>
              {s.file_path && (
                <a href={`http://localhost:5000/uploads/${s.file_path}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary text-sm font-semibold transition-all">
                  <Download size={16} /> Download Syllabus
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Question Bank (Document-Based) ───────────────────────
function QuestionBank({ showToast }: any) {
  const [qbanks, setQbanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.qbanks.list()
      .then(setQbanks)
      .catch(() => showToast('Failed to load question banks', 'error'))
      .finally(() => setLoading(false));
  }, []);

  // qbanks endpoint already returns only approved for students
  const approved = qbanks.filter((qb: any) => qb.status === 'approved');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Question Bank</h1>
        <span className="text-sm text-gray-500">{approved.length} document{approved.length !== 1 ? 's' : ''} available</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : approved.length === 0 ? (
        <div className="card">
          <EmptyState icon={FileText} title="No approved question banks yet"
            subtitle="Once faculty generate question banks and they are approved by admin, they'll appear here for download." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {approved.map((qb: any) => (
            <motion.div key={qb.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="card flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText size={22} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold">{qb.course_name}</h3>
                    {qb.course_code && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 text-primary border-primary/30">
                        {qb.course_code}
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-green-500/15 text-green-300 border-green-500/30">
                      Approved
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    By {qb.faculty_name || qb.faculty_name_display || 'Faculty'} · {qb.question_count || 0} questions
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{new Date(qb.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              {qb.file_url && (
                <a
                  href={`http://localhost:5000/api/qbanks/${qb.id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary text-sm font-semibold transition-all"
                >
                  <Download size={16} /> Download Question Bank DOCX
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mock Test ─────────────────────────────────────────────
type TestState = 'setup' | 'testing' | 'results';

function MockTest({ showToast }: any) {
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState<any | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'MCQ' | 'Short Answer' | 'Mixed'>('Mixed');
  const [testState, setTestState] = useState<TestState>('setup');
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [score, setScore] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api.syllabi.list()
      .then(rows => setSyllabi(rows.filter((s: any) => s.status === 'approved')))
      .catch(() => { });
  }, []);

  const handleStartTest = async () => {
    if (!selectedSyllabus) { showToast('Please select a syllabus first', 'error'); return; }
    setIsGenerating(true);
    setAnswers({});
    setShowExplanations({});
    try {
      const res = await fetch('/api/ai/generate-mock-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('qsage_token')}` },
        body: JSON.stringify({
          courseName: selectedSyllabus.course_name,
          courseCode: selectedSyllabus.course_code,
          topics: selectedSyllabus.description || '',
          questionCount,
          questionTypeFilter,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setQuestions(data.questions || []);
      setTestState('testing');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate test', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    let earned = 0;
    let total = 0;
    questions.forEach((q, i) => {
      total += q.marks || 1;
      const userAns = (answers[i] || '').trim().toLowerCase();
      if (q.type === 'MCQ') {
        const correct = (q.correctAnswer || '').trim().toLowerCase();
        if (userAns === correct || userAns === correct.charAt(0)) earned += q.marks || 1;
      }
      // Short answer gets partial credit — we show it for review, not auto-score
    });

    const mcqCount = questions.filter(q => q.type === 'MCQ').length;
    const mcqMarks = questions.filter(q => q.type === 'MCQ').reduce((s, q) => s + (q.marks || 1), 0);
    setScore(earned);
    setTotalMarks(mcqMarks);
    setTestState('results');
    localStorage.setItem('qsage_last_score', JSON.stringify({ score: earned, total: mcqMarks }));
    showToast(`Test submitted! MCQ Score: ${earned}/${mcqMarks}`);
  };

  const handleReset = () => {
    setTestState('setup');
    setQuestions([]);
    setAnswers({});
  };

  // ── Setup screen ──
  if (testState === 'setup') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Mock Test</h1>
        <div className="card space-y-5">
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/15">
            <Brain className="text-primary shrink-0" size={24} />
            <p className="text-sm text-gray-300">AI generates a personalized test from your selected syllabus. MCQs are auto-scored; short answer questions include model answers for self-assessment.</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Select Syllabus *</label>
            {syllabi.length === 0 ? (
              <p className="text-sm text-yellow-400 bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
                ⚠ No approved syllabus found. Ask your faculty to upload one.
              </p>
            ) : (
              <select className="w-full input-field bg-surface"
                value={selectedSyllabus?.id || ''}
                onChange={e => setSelectedSyllabus(syllabi.find(s => s.id === Number(e.target.value)) || null)}>
                <option value="">-- Select a course --</option>
                {syllabi.map(s => (
                  <option key={s.id} value={s.id}>{s.course_name} ({s.course_code})</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Number of Questions</label>
            <input type="number" min={5} max={30} value={questionCount}
              onChange={e => setQuestionCount(Math.max(5, Math.min(30, Number(e.target.value))))}
              className="w-full input-field" />
            <p className="text-xs text-gray-600 mt-1">Between 5 and 30 questions</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Question Type</label>
            <div className="flex gap-2">
              {(['MCQ', 'Short Answer', 'Mixed'] as const).map(t => (
                <button key={t} onClick={() => setQuestionTypeFilter(t)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${questionTypeFilter === t
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface-hover border-white/5 text-gray-400 hover:border-primary/40'
                    }`}>
                  {t}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1">MCQ = auto-scored · Short Answer = model answer shown</p>
          </div>

          <button onClick={handleStartTest} disabled={isGenerating || !selectedSyllabus}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />}
            {isGenerating ? 'AI Generating Test...' : 'Start Mock Test'}
          </button>
        </div>
      </div>
    );
  }

  // ── Testing screen ──
  if (testState === 'testing') {
    const mcqCount = questions.filter(q => q.type === 'MCQ').length;
    const saCount = questions.filter(q => q.type === 'Short Answer').length;
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{selectedSyllabus?.course_name} — Mock Test</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{mcqCount} MCQ · {saCount} Short Answer</span>
            <button onClick={handleReset} className="p-2 text-gray-500 hover:text-white"><X size={18} /></button>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }} className="card space-y-3">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge label={q.type} colorClass="bg-primary/10 text-primary border-primary/30" />
                    <Badge label={`${q.marks || 1} mark${(q.marks || 1) > 1 ? 's' : ''}`} colorClass="bg-white/5 text-gray-400 border-white/10" />
                  </div>
                  <p className="font-medium text-sm whitespace-pre-wrap">{q.text}</p>
                </div>
              </div>

              {q.type === 'MCQ' ? (
                <div className="space-y-2 pl-10">
                  {(Array.isArray(q.options) ? q.options : []).map((opt: string, oi: number) => {
                    const letter = opt.charAt(0).toLowerCase();
                    const isSelected = answers[i] === letter;
                    return (
                      <label key={oi} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-primary/10 border-primary/40' : 'bg-black/10 border-white/5 hover:border-white/20'}`}>
                        <input type="radio" name={`q${i}`} value={letter} checked={isSelected}
                          onChange={() => setAnswers(prev => ({ ...prev, [i]: letter }))} className="accent-primary" />
                        <span className="text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="pl-10">
                  <textarea className="w-full input-field resize-none text-sm" rows={3}
                    value={answers[i] || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                    placeholder="Type your answer here..." />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <button onClick={handleSubmit} className="w-full btn-primary py-3 text-base font-bold flex items-center justify-center gap-2">
          <CheckCircle2 size={20} /> Submit Test
        </button>
      </div>
    );
  }

  // ── Results screen ──
  if (testState === 'results') {
    const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const grade = pct >= 90 ? 'Excellent!' : pct >= 75 ? 'Good Job!' : pct >= 50 ? 'Keep Practicing' : 'Needs Improvement';
    const gradeColor = pct >= 90 ? 'text-green-400' : pct >= 75 ? 'text-blue-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400';

    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Score Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="card text-center space-y-4">
          <Trophy className="mx-auto text-yellow-400" size={48} />
          <h1 className="text-3xl font-bold">Test Complete!</h1>
          <div>
            <p className="text-6xl font-bold">{score}<span className="text-2xl text-gray-400">/{totalMarks}</span></p>
            <p className={`text-xl font-semibold mt-2 ${gradeColor}`}>{grade}</p>
            <p className="text-gray-500 mt-1">MCQ Score: {pct}%</p>
          </div>
          <button onClick={handleReset} className="btn-primary flex items-center gap-2 mx-auto">
            <RefreshCw size={16} /> Take Another Test
          </button>
        </motion.div>

        {/* Question review */}
        <h2 className="text-xl font-bold">Review Answers</h2>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const userAns = answers[i] || '';
            const correct = (q.correctAnswer || '').trim().toLowerCase();
            const isCorrect = q.type === 'MCQ' && (userAns.toLowerCase() === correct || userAns.toLowerCase() === correct.charAt(0));
            const isWrong = q.type === 'MCQ' && userAns && !isCorrect;
            return (
              <div key={i} className={`card border ${isCorrect ? 'border-green-500/30' : isWrong ? 'border-red-500/30' : 'border-white/5'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-green-500/15 text-green-400' : isWrong ? 'bg-red-500/15 text-red-400' : 'bg-primary/10 text-primary'}`}>
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium whitespace-pre-wrap">{q.text}</p>
                  {q.type === 'MCQ' && (
                    <span className="shrink-0">
                      {isCorrect ? <CheckCircle2 className="text-green-400" size={20} /> : isWrong ? <XCircle className="text-red-400" size={20} /> : null}
                    </span>
                  )}
                </div>

                {q.type === 'MCQ' && (
                  <div className="pl-10 text-sm space-y-1">
                    {userAns && <p className="text-gray-400">Your answer: <span className="font-semibold text-white">{userAns.toUpperCase()}</span></p>}
                    <p className="text-green-400">Correct: <span className="font-semibold">{correct.toUpperCase()}</span></p>
                  </div>
                )}

                {q.type === 'Short Answer' && userAns && (
                  <div className="pl-10 text-sm">
                    <p className="text-gray-400">Your answer: <span className="text-white">{userAns}</span></p>
                  </div>
                )}

                <button onClick={() => setShowExplanations(prev => ({ ...prev, [i]: !prev[i] }))}
                  className="mt-3 ml-10 text-xs text-primary/70 hover:text-primary flex items-center gap-1">
                  {showExplanations[i] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showExplanations[i] ? 'Hide explanation' : 'Show model answer / explanation'}
                </button>
                {showExplanations[i] && (
                  <div className="mt-2 ml-10 p-3 bg-black/20 rounded-lg border border-white/5">
                    <p className="text-xs text-gray-300 font-semibold mb-1">Model Answer:</p>
                    <p className="text-xs text-gray-400 whitespace-pre-wrap">{q.correctAnswer}</p>
                    {q.explanation && (
                      <>
                        <p className="text-xs text-gray-300 font-semibold mb-1 mt-2">Explanation:</p>
                        <p className="text-xs text-gray-400 whitespace-pre-wrap">{q.explanation}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
