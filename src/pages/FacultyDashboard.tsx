import React, { useState, useRef, useCallback, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import {
  Upload,
  Sparkles,
  FileText,
  Download,
  Trash2,
  Edit3,
  CheckCircle2,
  Loader2,
  Layout,
  FolderOpen,
  BookOpen,
  Target,
  Brain,
  Plus,
  Save,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Printer,
  MessageSquare,
  Send,
  RefreshCw,
  FileUp,
  Wand2,
  ClipboardCheck,
  ShieldCheck,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Forward,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';

// ──────────────────────────────────────────────
// Helpers & sub-components
// ──────────────────────────────────────────────

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
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${colorClass}`}>
      {label}
    </span>
  );
}

const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
      <Icon size={36} className="text-gray-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-400 mb-1">{title}</h3>
    <p className="text-sm text-gray-600 max-w-xs">{subtitle}</p>
  </div>
);

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${type === 'success'
        ? 'bg-green-900/80 border-green-500/40 text-green-200'
        : 'bg-red-900/80 border-red-500/40 text-red-200'
        }`}
    >
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={14} /></button>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

export const FacultyDashboard: React.FC<{ activeTab: string; isCoordinator?: boolean; setActiveTab?: (tab: string) => void }> = ({ activeTab, isCoordinator, setActiveTab }) => {
  // Global state shared across tabs
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [qbankCount, setQbankCount] = useState(0);
  const [paperCount, setPaperCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

  const showToast = (message: string, type: 'success' | 'error' = 'success') =>
    setToast({ message, type });

  // Load syllabi and dashboard stats once
  useEffect(() => {
    api.syllabi.list().then(setSyllabi).catch(() => { });
    api.questions.list().then((qs) => setQbankCount(qs.length)).catch(() => { });
    api.papers.list().then((ps) => setPaperCount(ps.length)).catch(() => { });
    // Fetch student count from users API
    fetch('/api/users?role=student', {
      headers: { Authorization: `Bearer ${localStorage.getItem('qsage_token')}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStudentCount(data.length);
      })
      .catch(() => { });
  }, []);

  const selectedSyllabus = syllabi.find((s) => s.id === selectedSyllabusId);

  // ── DASHBOARD ──────────────────────────────────────────
  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-8">
        <AnimatePresence>
          {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </AnimatePresence>

        <h1 className="text-3xl font-bold">Faculty Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Courses', value: String(syllabi.length), icon: Layout, color: 'text-primary', tab: 'upload-syllabus' },
            { label: 'Q-Banks', value: String(qbankCount), icon: FileText, color: 'text-secondary', tab: 'generate-qbank' },
            { label: 'Papers', value: String(paperCount), icon: FileText, color: 'text-blue-400', tab: 'generate-paper' },
            { label: 'Students', value: String(studentCount), icon: Layout, color: 'text-purple-400', tab: null },
          ].map((stat, i) => (
            <div key={i}
              className={`card ${stat.tab ? 'cursor-pointer hover:border-primary/40 transition-all' : ''}`}
              onClick={() => stat.tab && setActiveTab && setActiveTab(stat.tab)}
            >
              <stat.icon className={stat.color} size={24} />
              <p className="text-gray-400 text-sm mt-4">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-xl font-bold mb-4">All Syllabi</h3>
            {syllabi.length === 0 ? (
              <EmptyState icon={FolderOpen} title="No syllabi yet" subtitle="Upload a syllabus to get started." />
            ) : (
              <div className="space-y-3">
                {syllabi.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl border border-white/5">
                    <BookOpen size={18} className="text-primary shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{s.course_name}</p>
                      <p className="text-xs text-gray-500">{s.course_code} · {s.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Pending Approvals</h3>
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <CheckCircle2 size={48} className="mb-2 opacity-20" />
              <p>No pending approvals</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── UPLOAD SYLLABUS ────────────────────────────────────
  if (activeTab === 'upload-syllabus') {
    return (
      <UploadSyllabus
        onUploaded={(s) => { setSyllabi((prev) => [s, ...prev]); setSelectedSyllabusId(s.id); }}
        showToast={showToast}
        toast={toast}
        setToast={setToast}
      />
    );
  }

  // ── GENERATE Q-BANK ────────────────────────────────────
  if (activeTab === 'generate-qbank') {
    return (
      <GenerateQBank
        syllabi={syllabi}
        selectedSyllabusId={selectedSyllabusId}
        setSelectedSyllabusId={setSelectedSyllabusId}
        showToast={showToast}
        toast={toast}
        setToast={setToast}
      />
    );
  }

  // ── PREVIEW Q-BANK ─────────────────────────────────────
  if (activeTab === 'preview-qbank') {
    return <PreviewQBankFiles showToast={showToast} toast={toast} setToast={setToast} />;
  }

  // ── UPLOAD Q-BANK FILE ─────────────────────────────────
  if (activeTab === 'upload-qbank-file') {
    return <UploadQBankFile showToast={showToast} toast={toast} setToast={setToast} />;
  }

  // ── GENERATE PAPER ─────────────────────────────────────
  if (activeTab === 'generate-paper') {
    return (
      <GeneratePaper
        syllabi={syllabi}
        selectedSyllabusId={selectedSyllabusId}
        setSelectedSyllabusId={setSelectedSyllabusId}
        showToast={showToast}
        toast={toast}
        setToast={setToast}
      />
    );
  }

  // ── RAG CHAT ────────────────────────────────────
  if (activeTab === 'go-chat') {
    return (
      <RagChat
        syllabi={syllabi}
        showToast={showToast}
        toast={toast}
        setToast={setToast}
      />
    );
  }

  // ── COORDINATOR PANEL ─────────────────────────────
  if (activeTab === 'coordinator-panel') {
    if (!isCoordinator) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
            <span className="text-red-400 text-4xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-red-400">Access Denied</h2>
          <p className="text-gray-400 max-w-sm">You do not have Year Coordinator privileges.</p>
        </div>
      );
    }
    return <YearCoordinatorSection showToast={showToast} toast={toast} setToast={setToast} />;
  }

  return null;
};

// ══════════════════════════════════════════════
// Upload Syllabus Tab
// ══════════════════════════════════════════════

function UploadSyllabus({ onUploaded, showToast, toast, setToast }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [semester, setSemester] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleSubmit = async () => {
    if (!courseName.trim() || !courseCode.trim()) {
      showToast('Please fill in Course Name and Course Code', 'error');
      return;
    }
    const fd = new FormData();
    fd.append('course_name', courseName.trim());
    fd.append('course_code', courseCode.trim());
    fd.append('semester', semester.trim());
    if (file) fd.append('file', file);

    setUploading(true);
    try {
      const result = await api.syllabi.upload(fd);
      onUploaded(result);
      showToast(`Syllabus "${courseName}" uploaded successfully!`);
      setFile(null);
      setCourseName('');
      setCourseCode('');
      setSemester('');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <h1 className="text-3xl font-bold">Upload Course Syllabus</h1>

      {/* Drop Zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        animate={{ borderColor: dragging ? 'rgba(0,200,200,0.6)' : 'rgba(255,255,255,0.1)' }}
        className="card border-dashed border-2 flex flex-col items-center justify-center py-16 hover:border-primary/50 transition-all cursor-pointer group"
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${file ? 'bg-green-500/20' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
          {file ? <CheckCircle2 className="text-green-400" size={32} /> : <Upload className="text-primary" size={32} />}
        </div>
        {file ? (
          <>
            <p className="text-lg font-bold text-green-400">{file.name}</p>
            <p className="text-gray-500 text-sm mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB — click to change</p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold">Click or drag syllabus file here</p>
            <p className="text-gray-500 text-sm mt-2">Supports PDF, DOCX, DOC, TXT (Max 100MB)</p>
          </>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
      </motion.div>

      {/* Course Details */}
      <div className="card space-y-4">
        <h3 className="text-xl font-bold">Course Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Course Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              className="w-full input-field"
              placeholder="e.g. Artificial Intelligence"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Course Code <span className="text-red-400">*</span></label>
            <input
              type="text"
              className="w-full input-field"
              placeholder="e.g. CS501"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Semester (optional)</label>
          <input
            type="text"
            className="w-full input-field"
            placeholder="e.g. Semester 5"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
          {uploading ? 'Uploading & Processing...' : 'Save & Process Syllabus'}
        </button>
      </div>

      {/* Uploaded Syllabi List */}
      <UploadedSyllabiList />
    </div>
  );
}

// ══════════════════════════════════════════════
// Generate Q-Bank Tab  (Academic 5-Unit Format)
// ══════════════════════════════════════════════

const UNIT_LABELS = ['I', 'II', 'III', 'IV', 'V'];

function GenerateQBank({ syllabi, selectedSyllabusId, setSelectedSyllabusId, showToast, toast, setToast }: any) {
  // Header meta
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [semYear, setSemYear] = useState('');
  const [regulation, setRegulation] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [preparedBy, setPreparedBy] = useState('');

  // Generated data
  const [generatedUnits, setGeneratedUnits] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingUnitIdx, setGeneratingUnitIdx] = useState<number | null>(null);
  const [generatingStep, setGeneratingStep] = useState<'parsing' | 'generating'>('parsing');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myQBanks, setMyQBanks] = useState<any[]>([]);
  const [qbanksSaved, setQbanksSaved] = useState(false);
  const [qbanksSubmitted, setQbanksSubmitted] = useState(false);
  const [savedQBankId, setSavedQBankId] = useState<number | null>(null);

  const selectedSyllabus = syllabi.find((s: any) => s.id === selectedSyllabusId);

  // Load faculty's own Q-Bank documents
  const loadMyQBanks = async () => {
    try { setMyQBanks(await api.qbanks.list()); } catch { }
  };

  useEffect(() => { loadMyQBanks(); }, []);

  const updateQuestion = (unitIdx: number, part: 'partA' | 'partB', qIdx: number, field: string, val: string) => {
    setGeneratedUnits(prev => prev.map((u, ui) => {
      if (ui !== unitIdx) return u;
      const updated = [...u[part]];
      updated[qIdx] = { ...updated[qIdx], [field]: val };
      return { ...u, [part]: updated };
    }));
  };

  const handleGenerate = async () => {
    if (!selectedSyllabusId) { showToast('Please select a syllabus first', 'error'); return; }

    setIsGenerating(true);
    setQbanksSaved(false);
    setGeneratedUnits([]);
    setGeneratingStep('parsing');
    setGeneratingUnitIdx(null);

    try {
      // Step 1: Auto-parse the syllabus to extract unit names + topics
      const parseRes = await fetch(`/api/ai/parse-syllabus/${selectedSyllabusId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('qsage_token')}` },
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error || 'Failed to parse syllabus');
      const parsedUnits: { name: string; syllabus: string }[] = (parseData.units || [])
        .slice(0, 5)
        .map((u: any) => ({ name: u.name || '', syllabus: u.syllabus || '' }));
      if (!parsedUnits.length) throw new Error('Could not extract units from syllabus. Please try again.');

      // Step 2: Generate questions for each unit
      setGeneratingStep('generating');
      const results: any[] = [];
      for (let i = 0; i < parsedUnits.length; i++) {
        const u = parsedUnits[i];
        if (!u.name.trim()) continue;
        setGeneratingUnitIdx(i);
        const res = await fetch('/api/ai/generate-qbank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('qsage_token')}` },
          body: JSON.stringify({
            courseName: selectedSyllabus?.course_name,
            courseCode: selectedSyllabus?.course_code,
            units: [u],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generation failed');
        const unitData = data.units[0];
        results.push({
          ...unitData,
          unitLabel: UNIT_LABELS[i],
          unitNo: i + 1,
          unitName: u.name,
          syllabus: u.syllabus,
        });
      }
      setGeneratedUnits(results);
      showToast('Question Bank generated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate question bank', 'error');
    } finally {
      setIsGenerating(false);
      setGeneratingUnitIdx(null);
    }
  };

  const handleSaveQBank = async () => {
    if (!generatedUnits.length) return;
    if (!selectedSyllabus) { showToast('Please select a syllabus first', 'error'); return; }
    setIsSaving(true);
    try {
      const saved = await api.qbanks.save({
        syllabusId: selectedSyllabusId,
        courseName: selectedSyllabus.course_name,
        courseCode: selectedSyllabus.course_code,
        college,
        department,
        units: generatedUnits,
      });
      setSavedQBankId(saved?.id ?? null);
      showToast('Question Bank saved as draft! You can now Download PDF or Send to Coordinator.');
      setQbanksSaved(true);
      await loadMyQBanks();
    } catch (err: any) {
      showToast(err.message || 'Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDFQBank = async () => {
    if (!savedQBankId) { showToast('Save the Q-Bank first to generate the PDF', 'error'); return; }
    const element = document.getElementById('qbank-preview');
    if (!element) return;
    
    const opt: any = {
      margin: 10,
      filename: `${selectedSyllabus?.course_code || 'QB'}_QuestionBank.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleSubmitToCoordinator = async () => {
    if (!savedQBankId) { showToast('Save the Q-Bank first before submitting', 'error'); return; }
    setIsSubmitting(true);
    try {
      await api.qbanks.submit(savedQBankId);
      showToast('Q-Bank sent to Year Coordinator for review! ✓');
      setQbanksSubmitted(true);
      await loadMyQBanks();
    } catch (err: any) {
      showToast(err.message || 'Submit failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action bar with TWO separate buttons

  const QBankActionBar = () => (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="text-primary" size={22} /> Generated Question Bank
      </h2>
      <div className="flex gap-3 flex-wrap">
        {/* SAVE button — save draft to DB */}
        <button onClick={handleSaveQBank} disabled={isSaving || qbanksSaved}
          className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-60"
          style={{ border: '1px solid rgba(0,255,245,0.3)', color: '#00FFF5', background: 'rgba(0,255,245,0.06)' }}>
          {isSaving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
          {isSaving ? 'Saving…' : qbanksSaved ? '✓ Saved' : 'Save Draft'}
        </button>
        {/* DOWNLOAD PDF button — downloads from server (only works after save) */}
        <button onClick={handleDownloadPDFQBank} disabled={!savedQBankId || qbanksSubmitted}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-40"
          style={{ border: '1px solid rgba(100,200,100,0.4)', color: '#4ade80', background: 'rgba(74,222,128,0.06)' }}>
          <Download size={15} /> Download PDF
        </button>
        {/* SEND TO COORDINATOR button */}
        <button onClick={handleSubmitToCoordinator} disabled={!savedQBankId || isSubmitting || qbanksSubmitted}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
          {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
          {isSubmitting ? 'Sending…' : qbanksSubmitted ? '✓ Sent to Coordinator' : 'Send to Coordinator'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* ── Config Panel ─────────────────────────────── */}
      <div className="card space-y-5">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="text-primary" size={20} /> Question Bank Generator
        </h3>

        {/* Step 1 - Select Syllabus */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-primary text-black text-xs font-bold flex items-center justify-center">1</span>
            <label className="text-sm font-semibold text-gray-200">Select Syllabus File</label>
          </div>
          {syllabi.length === 0 ? (
            <p className="text-xs text-yellow-400 bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
              ⚠ No syllabi found. Please upload a syllabus first.
            </p>
          ) : (
            <select className="w-full input-field bg-surface" value={selectedSyllabusId || ''}
              onChange={(e) => {
                setSelectedSyllabusId(Number(e.target.value) || null);
                setGeneratedUnits([]);
              }}>
              <option value="">-- Select a syllabus --</option>
              {syllabi.map((s: any) => (
                <option key={s.id} value={s.id}>{s.course_name} ({s.course_code})</option>
              ))}
            </select>
          )}
          {selectedSyllabusId && (
            <p className="text-xs text-primary/70 flex items-center gap-1.5">
              <Sparkles size={12} /> Units will be auto-extracted from the syllabus when you generate
            </p>
          )}
        </div>

        {/* Step 2 - Exam / Institution details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-primary text-black text-xs font-bold flex items-center justify-center">2</span>
            <label className="text-sm font-semibold text-gray-200">Exam &amp; Institution Details</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">College / Institution Name</label>
              <input type="text" className="w-full input-field" placeholder="e.g. SRM Valliammai Engineering College" value={college} onChange={e => setCollege(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Department</label>
              <input type="text" className="w-full input-field" placeholder="e.g. Information Technology" value={department} onChange={e => setDepartment(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Semester / Year</label>
              <input type="text" className="w-full input-field" placeholder="e.g. VI / III" value={semYear} onChange={e => setSemYear(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Regulation</label>
              <input type="text" className="w-full input-field" placeholder="e.g. 2023" value={regulation} onChange={e => setRegulation(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Academic Year</label>
              <input type="text" className="w-full input-field" placeholder="e.g. 2025-2026" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Prepared By <span className="text-gray-500">(one per line)</span></label>
              <textarea className="w-full input-field resize-none" rows={2}
                placeholder="Dr. K. Revathi, Associate Professor, IT"
                value={preparedBy} onChange={e => setPreparedBy(e.target.value)} />
            </div>
          </div>
        </div>

        <button onClick={handleGenerate} disabled={isGenerating || !selectedSyllabusId}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed py-3 text-base font-semibold">
          {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Brain size={20} />}
          {isGenerating
            ? generatingStep === 'parsing'
              ? 'Extracting units from syllabus…'
              : `Generating Unit ${generatingUnitIdx !== null ? UNIT_LABELS[generatingUnitIdx] : ''}… (${(generatingUnitIdx ?? 0) + 1}/5)`
            : 'Generate Question Bank'}
        </button>
      </div>

      {/* ── Generating State ──────────────────────────────────── */}
      {isGenerating && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card flex flex-col items-center justify-center py-16 gap-5">
          <div className="relative">
            <Loader2 className="animate-spin text-primary" size={56} />
            <Brain className="absolute inset-0 m-auto text-primary/40" size={24} />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-200 animate-pulse">
              {generatingStep === 'parsing'
                ? 'Extracting units from syllabus…'
                : `Generating Unit ${generatingUnitIdx !== null ? UNIT_LABELS[generatingUnitIdx] : ''}…`}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {generatingStep === 'parsing'
                ? 'AI is reading the syllabus to identify all 5 units'
                : 'AI is creating 20 PART-A (2 marks) and 20 PART-B (16 marks) questions'}
            </p>
            {generatingStep === 'generating' && (
              <div className="flex gap-2 justify-center mt-4">
                {UNIT_LABELS.map((_, i) => (
                  <div key={i} className={`w-10 h-2 rounded-full transition-all duration-500 ${generatingUnitIdx !== null && i < generatingUnitIdx ? 'bg-green-500' :
                    generatingUnitIdx === i ? 'bg-primary animate-pulse' : 'bg-white/10'
                    }`} />
                ))}
              </div>
            )}
            <p className="text-xs text-gray-600 mt-3">Each unit may take 15–30 seconds</p>
          </div>
        </motion.div>
      )}

      {/* ── My Q-Banks list ─────────────────────────────── */}
      <MyQBanks qbanks={myQBanks} token={localStorage.getItem('qsage_token')} />

      {/* ── Generated Preview ─────────────────────────── */}
      {generatedUnits.length > 0 && !isGenerating && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <QBankActionBar />

          {/* Cover info card */}
          <div id="qbank-preview" className="space-y-5">
          <div className="card text-center space-y-1 py-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-lg font-bold uppercase tracking-wide">{college || 'Institution Name'}</p>
            <p className="text-xs text-gray-400">SRM Nagar, Kattankulathur – 603 203</p>
            <p className="font-bold text-sm uppercase mt-1">Department of {department || 'Department'}</p>
            <p className="font-bold text-base mt-3 text-primary">QUESTION BANK</p>
            <p className="font-bold text-sm mt-2">
              Subject: {selectedSyllabus?.course_code} – {selectedSyllabus?.course_name}
            </p>
            {semYear && <p className="text-sm text-gray-400">Sem / Year: {semYear}</p>}
            {regulation && <p className="text-sm text-gray-400">Regulation – {regulation}</p>}
            {academicYear && <p className="text-sm text-gray-400">Academic Year {academicYear}</p>}
          </div>

          {/* Unit sections */}
          {generatedUnits.map((unit, ui) => (
            <div key={ui} className="rounded-xl overflow-hidden border border-white/10">
              {/* Unit heading */}
              <div className="text-center py-3 px-4 border-b border-white/10"
                style={{ background: 'rgba(0,255,245,0.06)' }}>
                <p className="font-bold text-sm tracking-widest uppercase">
                  Unit {unit.unitLabel} – {(unit.unitName || '').toUpperCase()}
                </p>
                {unit.syllabus && (
                  <p className="text-xs text-gray-400 mt-1 max-w-3xl mx-auto">{unit.syllabus}</p>
                )}
              </div>

              {/* PART-A */}
              <div className="border-b border-white/10">
                <div className="text-center py-2 border-b border-white/10 bg-white/5">
                  <span className="text-xs font-bold tracking-widest uppercase text-gray-200">PART–A &nbsp;(2 Marks)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-white/5 text-xs font-bold uppercase text-gray-400">
                      <tr>
                        <th className="w-10 px-3 py-2 border-r border-white/10 text-center">Q.No.</th>
                        <th className="px-3 py-2 border-r border-white/10">Questions</th>
                        <th className="w-24 px-3 py-2 border-r border-white/10 text-center">BT Level</th>
                        <th className="w-28 px-3 py-2 text-center">Competence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unit.partA.map((q: any, qi: number) => (
                        <tr key={qi} className="border-t border-white/5 hover:bg-white/2">
                          <td className="px-3 py-2 text-center text-gray-400 border-r border-white/10 text-xs">{qi + 1}</td>
                          <td className="px-3 py-1 border-r border-white/10">
                            <textarea
                              className="w-full bg-transparent resize-none text-sm leading-snug focus:outline-none focus:bg-white/5 rounded p-1 transition-colors"
                              value={q.text} rows={2}
                              onChange={e => updateQuestion(ui, 'partA', qi, 'text', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 text-center border-r border-white/10">
                            <select className="bg-transparent text-xs focus:outline-none cursor-pointer text-center w-full"
                              value={q.btl}
                              onChange={e => updateQuestion(ui, 'partA', qi, 'btl', e.target.value)}>
                              {['BTL1', 'BTL2', 'BTL3', 'BTL4', 'BTL5', 'BTL6'].map(b =>
                                <option key={b} value={b}>{b}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <select className="bg-transparent text-xs focus:outline-none cursor-pointer text-center w-full"
                              value={q.competence}
                              onChange={e => updateQuestion(ui, 'partA', qi, 'competence', e.target.value)}>
                              {['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'].map(c =>
                                <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PART-B */}
              <div>
                <div className="text-center py-2 border-b border-white/10 bg-white/5">
                  <span className="text-xs font-bold tracking-widest uppercase text-gray-200">PART–B &nbsp;(16 Marks)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-white/5 text-xs font-bold uppercase text-gray-400">
                      <tr>
                        <th className="w-10 px-3 py-2 border-r border-white/10 text-center">Q.No.</th>
                        <th className="px-3 py-2 border-r border-white/10">Questions</th>
                        <th className="w-16 px-3 py-2 border-r border-white/10 text-center">Marks</th>
                        <th className="w-24 px-3 py-2 border-r border-white/10 text-center">BT Level</th>
                        <th className="w-28 px-3 py-2 text-center">Competence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unit.partB.map((q: any, qi: number) => (
                        <tr key={qi} className="border-t border-white/5 hover:bg-white/2">
                          <td className="px-3 py-2 text-center text-gray-400 border-r border-white/10 text-xs">{qi + 1}</td>
                          <td className="px-3 py-1 border-r border-white/10">
                            <textarea
                              className="w-full bg-transparent resize-none text-sm leading-snug focus:outline-none focus:bg-white/5 rounded p-1 transition-colors"
                              value={q.text} rows={2}
                              onChange={e => updateQuestion(ui, 'partB', qi, 'text', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 text-center border-r border-white/10 text-xs text-gray-300">({q.marks || 16})</td>
                          <td className="px-3 py-2 text-center border-r border-white/10">
                            <select className="bg-transparent text-xs focus:outline-none cursor-pointer text-center w-full"
                              value={q.btl}
                              onChange={e => updateQuestion(ui, 'partB', qi, 'btl', e.target.value)}>
                              {['BTL1', 'BTL2', 'BTL3', 'BTL4', 'BTL5', 'BTL6'].map(b =>
                                <option key={b} value={b}>{b}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <select className="bg-transparent text-xs focus:outline-none cursor-pointer text-center w-full"
                              value={q.competence}
                              onChange={e => updateQuestion(ui, 'partB', qi, 'competence', e.target.value)}>
                              {['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'].map(c =>
                                <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ))}

          {/* Single signature row — bottom of full Q-Bank only */}
          <div className="grid grid-cols-3 text-xs text-center text-gray-400 mt-2 pt-4 border-t border-white/10">
            <div className="py-4 font-semibold">Faculty In-Charge</div>
            <div className="py-4 font-semibold">Verified by</div>
            <div className="py-4 font-semibold">HOD</div>
          </div>
          </div> {/* End qbank-preview */}
          {/* Bottom action bar */}
          <div className="flex justify-end gap-3 flex-wrap pt-2 pb-6">
            <button onClick={handleSaveQBank} disabled={isSaving || qbanksSaved}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-40"
              style={{ border: '1px solid rgba(0,255,245,0.3)', color: '#00FFF5', background: 'rgba(0,255,245,0.06)' }}>
              {isSaving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
              {isSaving ? 'Saving…' : qbanksSaved ? '✓ Saved' : 'Save Draft'}
            </button>
            <button onClick={handleDownloadPDFQBank} disabled={!savedQBankId || qbanksSubmitted}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-40"
              style={{ border: '1px solid rgba(100,200,100,0.4)', color: '#4ade80', background: 'rgba(74,222,128,0.06)' }}>
              <Download size={15} /> Download PDF
            </button>
            <button onClick={handleSubmitToCoordinator} disabled={!savedQBankId || isSubmitting || qbanksSubmitted}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
              {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
              {isSubmitting ? 'Sending…' : qbanksSubmitted ? '✓ Sent to Coordinator' : 'Send to Coordinator'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// -- My Generated Q-Banks sub-component (inside GenerateQBank return)
function MyQBanks({ qbanks, token }: { qbanks: any[]; token: string | null }) {
  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    approved: 'bg-green-500/15 text-green-300 border-green-500/30',
    rejected: 'bg-red-500/15 text-red-300 border-red-500/30',
  };
  if (!qbanks.length) return null;
  return (
    <div className="card space-y-4">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <FolderOpen className="text-primary" size={20} /> My Generated Question Banks
      </h3>
      <div className="space-y-3">
        {qbanks.map((qb: any) => (
          <div key={qb.id} className="flex items-center gap-4 p-3 bg-surface-hover rounded-xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{qb.course_name}</p>
              <p className="text-xs text-gray-500">{qb.question_count} questions · {new Date(qb.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusColor[qb.status] || 'bg-white/5 text-gray-400 border-white/10'}`}>
              {qb.status}
            </span>
            {qb.file_url && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/qbanks/${qb.id}/file`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (!res.ok) throw new Error('Download failed');
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `QuestionBank_${qb.course_code || 'QB'}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (e) {
                    alert('Download failed');
                  }
                }}
                className="p-1.5 text-primary/70 hover:text-primary transition-colors"
                title="Download PDF"
              >
                <Download size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════
// Generate Paper Tab
// ══════════════════════════════════════════════

function GeneratePaper({ syllabi, selectedSyllabusId, setSelectedSyllabusId, showToast, toast, setToast }: any) {
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [examType, setExamType] = useState('Semester End Examination');
  const [totalMarks, setTotalMarks] = useState(100);
  const [difficulty, setDifficulty] = useState(50);
  const [topics, setTopics] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [duration, setDuration] = useState('3 Hrs');
  const [examDate, setExamDate] = useState('');
  const [qpCode, setQpCode] = useState('');
  const [regulations, setRegulations] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [paper, setPaper] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [paperSaved, setPaperSaved] = useState(false);
  const [savedPaperId, setSavedPaperId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paperSubmitted, setPaperSubmitted] = useState(false);
  const [myPapers, setMyPapers] = useState<any[]>([]);

  const selectedSyllabus = syllabi.find((s: any) => s.id === selectedSyllabusId);

  const loadMyPapers = async () => {
    try { setMyPapers(await api.papers.list()); } catch { }
  };

  useEffect(() => { loadMyPapers(); }, []);

  const difficultyLabel = difficulty < 34 ? 'Easy' : difficulty < 67 ? 'Balanced' : 'Hard';

  const handleGenerate = async () => {
    if (!selectedSyllabusId) {
      showToast('Please select a syllabus first', 'error');
      return;
    }
    setIsGenerating(true);
    setPaper(null);
    try {
      const res = await fetch('/api/ai/generate-paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('qsage_token')}`,
        },
        body: JSON.stringify({
          courseName: selectedSyllabus?.course_name,
          courseCode: selectedSyllabus?.course_code,
          institution,
          examType,
          totalMarks,
          difficulty: difficultyLabel,
          topics,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setPaper(data.paper);
      setPaperSaved(false);
      showToast('Question paper generated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate paper', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Strip "(X marks)" patterns from question text
  const stripM = (t: string) => (t || '').replace(/\(?\s*\d+\s*marks?\s*\)?/gi, '').replace(/\s+/g, ' ').trim();

  // Split at roman numeral sub-parts e.g. (i), (ii), (iii)
  const splitSubParts = (t: string) => {
    const clean = stripM(t);
    const segs = clean.split(/(?=\s*\([ivxIVX]+\)\s)/g);
    return segs.filter(s => s.trim()).map(s => {
      const m = s.trim().match(/^\(([ivxIVX]+)\)\s*(.+)/s);
      return m ? { label: `(${m[1]})`, text: m[2].trim() } : { label: '', text: s.trim() };
    }).filter(s => s.text);
  };

  // ── Download PDF (client-side html2pdf) ─────────────────────────
  const downloadPaperPDF = async (paperId: number) => {
    const element = document.getElementById('qpaper-preview');
    if (!element) return;
    const opt: any = {
      margin: 10,
      filename: `QuestionPaper_${selectedSyllabus?.course_code || 'QP'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // ── Save → Admin ──────────────────────────────────────────
  const handleSavePaper = async () => {
    if (!paper) return;
    if (!selectedSyllabus) { showToast('No syllabus selected', 'error'); return; }
    setIsSaving(true);
    try {
      const saved = await api.papers.save({
        course_name: selectedSyllabus.course_name,
        course_code: selectedSyllabus.course_code,
        institution,
        department,
        exam_type: examType,
        total_marks: totalMarks,
        exam_date: examDate,
        duration,
        regulations,
        branch,
        year,
        semester,
        qp_code: qpCode,
        sections: paper.sections,
      });
      setSavedPaperId(saved?.id ?? null);
      showToast('Question Paper saved! Use Download PDF to get the file.');
      setPaperSaved(true);
      await loadMyPapers();
    } catch (err: any) {
      showToast(err.message || 'Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitPaperToCoordinator = async () => {
    if (!savedPaperId) { showToast('Save the paper first before submitting', 'error'); return; }
    setIsSubmitting(true);
    try {
      await api.papers.submit(savedPaperId);
      showToast('Question Paper sent to Year Coordinator for review! ✓');
      setPaperSubmitted(true);
      await loadMyPapers();
    } catch (err: any) {
      showToast(err.message || 'Submit failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Config Panel */}
      <div className="lg:col-span-4 space-y-6">
        <div className="card space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-primary" size={20} /> Paper Configuration
          </h3>

          {/* Syllabus */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Select Syllabus <span className="text-red-400">*</span></label>
            {syllabi.length === 0 ? (
              <p className="text-xs text-yellow-400 bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
                ⚠ No syllabi found. Please upload a syllabus first.
              </p>
            ) : (
              <select className="w-full input-field bg-surface" value={selectedSyllabusId || ''}
                onChange={(e) => setSelectedSyllabusId(Number(e.target.value) || null)}>
                <option value="">-- Select a syllabus --</option>
                {syllabi.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.course_name} ({s.course_code})</option>
                ))}
              </select>
            )}
          </div>

          {/* Institution & Department */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Institution Name</label>
            <input type="text" className="w-full input-field" placeholder="e.g. SRM Valliammai Engineering College" value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Department <span className="text-gray-600">(optional)</span></label>
            <input type="text" className="w-full input-field" placeholder="e.g. Artificial Intelligence and Data Science" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>

          {/* Exam details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Exam Type</label>
              <select className="w-full input-field bg-surface" value={examType} onChange={(e) => setExamType(e.target.value)}>
                <option>Internal Assessment I</option>
                <option>Internal Assessment II</option>
                <option>Model Examination</option>
                <option>Semester End Examination</option>
                <option>Continuous Assessment Test - 1</option>
                <option>Continuous Assessment Test - 2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Total Marks</label>
              <input type="number" className="w-full input-field" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} min={20} max={200} />
            </div>
          </div>

          {/* Branch / Year / Semester */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Branch</label>
              <input type="text" className="w-full input-field" placeholder="B.Tech AI&DS" value={branch} onChange={(e) => setBranch(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Year</label>
              <input type="text" className="w-full input-field" placeholder="III" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Semester</label>
              <input type="text" className="w-full input-field" placeholder="V" value={semester} onChange={(e) => setSemester(e.target.value)} />
            </div>
          </div>

          {/* Date / Duration / Regulations */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date</label>
              <input type="text" className="w-full input-field" placeholder="03.01.2025" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Duration</label>
              <input type="text" className="w-full input-field" placeholder="3 Hrs" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Regulations</label>
              <input type="text" className="w-full input-field" placeholder="2023" value={regulations} onChange={(e) => setRegulations(e.target.value)} />
            </div>
          </div>

          {/* QP Code */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Question Paper Code <span className="text-gray-600">(optional)</span></label>
            <input type="text" className="w-full input-field" placeholder="e.g. AI-DS5631" value={qpCode} onChange={(e) => setQpCode(e.target.value)} />
          </div>

          {/* Topics */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Topics / Syllabus Notes <span className="text-gray-600">(optional)</span></label>
            <textarea className="w-full input-field resize-none" rows={3} value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Paste key topics or chapter names..." />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Difficulty Mix: <span className={`font-bold ${difficulty < 34 ? 'text-green-400' : difficulty < 67 ? 'text-yellow-400' : 'text-red-400'}`}>{difficultyLabel}</span>
            </label>
            <input type="range" className="w-full accent-primary" min={0} max={100} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1"><span>EASY</span><span>BALANCED</span><span>HARD</span></div>
          </div>

          <button onClick={handleGenerate} disabled={isGenerating || !selectedSyllabusId}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {isGenerating ? 'AI Generating Paper...' : 'Generate Paper'}
          </button>
        </div>
      </div>

      {/* Paper Preview */}
      <div className="lg:col-span-8">
        <div className="card min-h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Paper Preview</h3>
            {paper && (
              <div className="flex gap-2 flex-wrap">
                {/* Download PDF — only after save */}
                <button
                  onClick={() => { if (savedPaperId) downloadPaperPDF(savedPaperId); else showToast('Save the paper first', 'error'); }}
                  disabled={!savedPaperId || paperSubmitted}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40"
                  style={{ border: '1px solid rgba(100,200,100,0.4)', color: '#4ade80', background: 'rgba(74,222,128,0.06)' }}>
                  <Download size={14} /> Download PDF
                </button>
                {/* Save Draft */}
                <button onClick={handleSavePaper} disabled={isSaving || paperSaved}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg font-semibold disabled:opacity-60"
                  style={{ border: '1px solid rgba(0,255,245,0.3)', color: '#00FFF5', background: 'rgba(0,255,245,0.06)' }}>
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isSaving ? 'Saving…' : paperSaved ? '✓ Saved' : 'Save Draft'}
                </button>
                {/* Send to Coordinator */}
                <button onClick={handleSubmitPaperToCoordinator} disabled={!savedPaperId || isSubmitting || paperSubmitted}
                  className="btn-primary text-sm py-1 flex items-center gap-2 disabled:opacity-60">
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {isSubmitting ? 'Sending…' : paperSubmitted ? '✓ Sent to Coordinator' : 'Send to Coordinator'}
                </button>
              </div>
            )}
          </div>

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-80 text-gray-500 gap-4">
              <div className="relative">
                <Loader2 className="animate-spin text-primary" size={56} />
                <FileText className="absolute inset-0 m-auto text-primary/40" size={24} />
              </div>
              <p className="animate-pulse text-center">AI is generating your question paper<br />with BTL levels and CO mapping...</p>
            </div>
          ) : paper ? (
            <div className="space-y-6">
              {/* Paper preview - white card, editable */}
              <div id="qpaper-preview" className="bg-white text-gray-900 rounded-xl p-6">
                {/* Full front page header in preview */}
                <div className="mb-5 pb-4 border-b border-gray-300">
                  <div className="flex justify-end items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-gray-700">Reg.No</span>
                    <div className="flex">{Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="w-5 h-5 border border-gray-600" />
                    ))}</div>
                  </div>
                  <div className="text-center mb-2">
                    <div className="inline-block border border-gray-600 px-6 py-0.5 text-xs font-medium text-gray-700">
                      Question Paper Code: {qpCode || '___________'}
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    {institution && <p className="text-base font-bold uppercase tracking-wide" contentEditable suppressContentEditableWarning>{institution}</p>}
                    {department && <p className="text-sm font-bold mt-1" contentEditable suppressContentEditableWarning>DEPARTMENT OF {department.toUpperCase()}</p>}
                    <p className="text-sm font-bold mt-1 uppercase" contentEditable suppressContentEditableWarning>{examType}</p>
                    {regulations && <p className="text-xs mt-0.5 text-gray-600">(Regulations {regulations})</p>}
                    <p className="text-sm font-bold mt-1" contentEditable suppressContentEditableWarning>
                      {selectedSyllabus?.course_code} – {selectedSyllabus?.course_name}
                    </p>
                  </div>
                  <div className="flex justify-between mt-3 text-xs">
                    <div className="space-y-0.5">
                      {branch && <p><span className="font-medium">Branch  :</span> {branch}</p>}
                      {year && <p><span className="font-medium">Year    :</span> {year}</p>}
                      {semester && <p><span className="font-medium">Semester:</span> {semester}</p>}
                    </div>
                    <div className="space-y-0.5 text-right">
                      {examDate && <p><span className="font-medium">Date</span>     : {examDate}</p>}
                      <p><span className="font-medium">Maximum</span>  : {totalMarks} Marks</p>
                      <p><span className="font-medium">Duration</span> : {duration}</p>
                    </div>
                  </div>
                  <p className="text-center text-sm font-bold mt-3">Answer ALL Questions</p>
                  <div className="flex justify-end text-xs font-semibold text-gray-500 mt-1 gap-8 pr-2">
                    <span>COs</span><span>BTLs</span>
                  </div>
                </div>
                <p className="text-xs text-right text-gray-400 mb-2 italic">✏️ Click any text to edit before downloading</p>
                {paper.sections?.map((section: any, si: number) => {
                  const isPartB = si > 0;
                  const startNum = si === 0 ? 1 : 11;
                  return (
                    <div key={si} className="mb-5">
                      <h4 className="text-center text-sm font-bold uppercase py-1 mb-3">
                        {section.title}
                      </h4>
                      {!isPartB ? (
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-gray-300 text-gray-500">
                              <th className="text-left py-1 w-8">Q.</th>
                              <th className="text-left py-1">Question</th>
                              <th className="text-center py-1 w-10">CO</th>
                              <th className="text-center py-1 w-12">BTL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.questions?.map((q: any, qi: number) => (
                              <tr key={qi} className="border-b border-gray-100">
                                <td className="py-1.5 font-bold text-gray-700">{qi + 1}.</td>
                                <td className="py-1.5 text-gray-800 outline-none" contentEditable suppressContentEditableWarning>{stripM(q.text)}</td>
                                <td className="py-1.5 text-center text-gray-600 outline-none" contentEditable suppressContentEditableWarning>{q.co}</td>
                                <td className="py-1.5 text-center text-gray-600 outline-none" contentEditable suppressContentEditableWarning>{q.btl?.split('-')[0]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="space-y-3">
                          {section.questions?.map((q: any, qi: number) => (
                            <div key={qi} className="text-xs pb-2 border-b border-gray-100">
                              <div className="flex gap-1">
                                <span className="font-bold text-gray-800 w-7 shrink-0">{startNum + qi}.</span>
                                <div className="flex-1">
                                  {q.partA ? (
                                    <>
                                      <div className="flex justify-between gap-2">
                                        <div className="flex-1 text-gray-800">
                                          <span className="font-medium">(a) </span>
                                          {splitSubParts(q.partA.text).map((p, pi) => (
                                            <p key={pi} className={`outline-none ${pi > 0 ? 'mt-0.5' : 'inline'}`} contentEditable suppressContentEditableWarning>
                                              {p.label && <span className="font-medium">{p.label} </span>}{p.text}
                                            </p>
                                          ))}
                                        </div>
                                        <div className="shrink-0 text-right text-gray-500 space-x-1 whitespace-nowrap">
                                          <span>({q.partA.marks})</span>
                                          <span contentEditable suppressContentEditableWarning className="outline-none">{q.partA.co}</span>
                                          <span contentEditable suppressContentEditableWarning className="outline-none">{q.partA.btl?.split('-')[0]}</span>
                                        </div>
                                      </div>
                                      <p className="text-center text-gray-500 font-semibold my-1.5 text-[10px]">OR</p>
                                      <div className="flex justify-between gap-2">
                                        <div className="flex-1 text-gray-800">
                                          <span className="font-medium">(b) </span>
                                          {splitSubParts(q.partB?.text || '').map((p, pi) => (
                                            <p key={pi} className={`outline-none ${pi > 0 ? 'mt-0.5' : 'inline'}`} contentEditable suppressContentEditableWarning>
                                              {p.label && <span className="font-medium">{p.label} </span>}{p.text}
                                            </p>
                                          ))}
                                        </div>
                                        <div className="shrink-0 text-right text-gray-500 space-x-1 whitespace-nowrap">
                                          <span>({q.partB?.marks})</span>
                                          <span contentEditable suppressContentEditableWarning className="outline-none">{q.partB?.co}</span>
                                          <span contentEditable suppressContentEditableWarning className="outline-none">{q.partB?.btl?.split('-')[0]}</span>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex justify-between gap-2">
                                      <p className="flex-1 text-gray-800 outline-none" contentEditable suppressContentEditableWarning>{stripM(q.text)}</p>
                                      <div className="shrink-0 text-right text-gray-500 space-x-1 whitespace-nowrap">
                                        <span>({q.marks})</span>
                                        <span>{q.co}</span>
                                        <span>{q.btl?.split('-')[0]}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No paper generated yet"
              subtitle="Select a syllabus, fill in the configuration and click 'Generate Paper'."
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// Uploaded Syllabi List (shown in Upload Syllabus tab)
// ══════════════════════════════════════════════

function UploadedSyllabiList() {
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    api.syllabi.list()
      .then(setSyllabi)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    approved: 'bg-green-500/15 text-green-300 border-green-500/30',
    rejected: 'bg-red-500/15 text-red-300 border-red-500/30',
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this syllabus? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/syllabi/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('qsage_token')}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setSyllabi(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="card space-y-4">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <BookOpen className="text-primary" size={20} /> My Uploaded Syllabi
      </h3>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : syllabi.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No syllabi uploaded yet" subtitle="Upload a syllabus above to get started." />
      ) : (
        <div className="space-y-3">
          {syllabi.map((s) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-3 bg-surface-hover rounded-xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{s.course_name}</p>
                <p className="text-xs text-gray-500">{s.course_code}{s.semester ? ` · ${s.semester}` : ''}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${statusColor[s.status] || 'bg-white/5 text-gray-400 border-white/10'}`}>
                {s.status}
              </span>
              {s.file_path && (
                <a href={`http://localhost:5000/uploads/${s.file_path}`} target="_blank" rel="noopener noreferrer"
                  className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors" title="View / Download">
                  <Download size={16} />
                </a>
              )}
              <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors disabled:opacity-50" title="Delete syllabus">
                {deleting === s.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// RAG Chat Tab
// ══════════════════════════════════════════════
type ChatMessage = { role: 'user' | 'assistant'; content: string };

function RagChat({ syllabi, showToast, toast, setToast }: any) {
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedSyllabus = syllabi.find((s: any) => s.id === selectedSyllabusId);
  const syllabusContext = selectedSyllabus
    ? `Course: ${selectedSyllabus.course_name} (${selectedSyllabus.course_code})${selectedSyllabus.semester ? `, Semester: ${selectedSyllabus.semester}` : ''}`
    : '';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/rag-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('qsage_token')}`,
        },
        body: JSON.stringify({ prompt: text, syllabusContext, conversationHistory: messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessages([...newHistory, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      showToast(err.message || 'AI request failed', 'error');
      setMessages(newHistory);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="text-primary" size={28} /> Go Chat
        </h1>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all">
            <RefreshCw size={14} /> New Chat
          </button>
        )}
      </div>


      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 gap-4 py-16">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Brain size={40} className="text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-300">Ask me anything — I'm your AI assistant!</p>
              <p className="text-sm mt-1 text-gray-500">Click a suggestion or type your own:</p>
              <div className="mt-3 space-y-2 max-w-lg">
                {[
                  'Explain the concept of overfitting in machine learning with examples',
                  'What are the SOLID principles in software engineering?',
                  'Summarize the key topics in Database Management Systems',
                ].map((ex, i) => (
                  <button key={i} onClick={() => setInput(ex)}
                    className="block w-full text-left text-xs bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/30 rounded-lg px-3 py-2 transition-all text-gray-300">
                    &quot;{ex}&quot;
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                ? 'bg-primary/20 border border-primary/30 text-white'
                : 'bg-surface-hover border border-white/5 text-gray-200'
                }`}>
                {msg.role === 'assistant' ? (
                  <div className="whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-hover border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="animate-spin text-primary" size={16} />
              <span className="text-sm text-gray-400">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="card p-3 flex items-end gap-3">
        <textarea
          className="flex-1 bg-transparent resize-none text-sm focus:outline-none text-white placeholder-gray-500 max-h-32 min-h-[40px]"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything — explain a concept, solve problems, get summaries... (Enter to send)"
        />
        <button onClick={handleSend} disabled={!input.trim() || loading}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-black font-bold hover:bg-primary/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// Upload Q-Bank File Tab
// ══════════════════════════════════════════════
function UploadQBankFile({ showToast, toast, setToast }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!courseName.trim() || !courseCode.trim()) { showToast('Course Name and Code are required', 'error'); return; }
    if (!file) { showToast('Please select a file', 'error'); return; }
    const fd = new FormData();
    fd.append('course_name', courseName.trim());
    fd.append('course_code', courseCode.trim());
    fd.append('file', file);
    setUploading(true);
    try {
      const res = await fetch('/api/qbank-files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('qsage_token')}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      showToast(`Q-Bank "${courseName}" uploaded successfully!`);
      setFile(null); setCourseName(''); setCourseCode('');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      <h1 className="text-3xl font-bold flex items-center gap-3"><FileUp className="text-primary" size={28} /> Upload Question Bank</h1>

      <motion.div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={handleDrop} onClick={() => fileRef.current?.click()}
        animate={{ borderColor: dragging ? 'rgba(0,200,200,0.6)' : 'rgba(255,255,255,0.1)' }}
        className="card border-dashed border-2 flex flex-col items-center justify-center py-14 hover:border-primary/50 transition-all cursor-pointer group">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${file ? 'bg-green-500/20' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
          {file ? <CheckCircle2 className="text-green-400" size={32} /> : <Upload className="text-primary" size={32} />}
        </div>
        {file ? (
          <><p className="text-lg font-bold text-green-400">{file.name}</p><p className="text-gray-500 text-sm mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB — click to change</p></>
        ) : (
          <><p className="text-lg font-bold">Click or drag Q-Bank file here</p><p className="text-gray-500 text-sm mt-2">Supports PDF, DOCX, DOC, TXT (Max 100MB)</p></>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden"
          onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
      </motion.div>

      <div className="card space-y-4">
        <h3 className="text-xl font-bold">Course Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Course Name <span className="text-red-400">*</span></label>
            <input type="text" className="w-full input-field" placeholder="e.g. Artificial Intelligence" value={courseName} onChange={e => setCourseName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Course Code <span className="text-red-400">*</span></label>
            <input type="text" className="w-full input-field" placeholder="e.g. CS501" value={courseCode} onChange={e => setCourseCode(e.target.value)} />
          </div>
        </div>
        <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2">
          {uploading ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
          {uploading ? 'Uploading...' : 'Upload Q-Bank File'}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// Preview Q-Bank Files Tab
// ══════════════════════════════════════════════
function PreviewQBankFiles({ showToast, toast, setToast }: any) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/qbank-files', { headers: { Authorization: `Bearer ${localStorage.getItem('qsage_token')}` } })
      .then(r => r.json()).then(setFiles).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this Q-Bank file?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/qbank-files/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('qsage_token')}` } });
      if (!res.ok) throw new Error('Delete failed');
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err: any) { alert(err.message || 'Delete failed'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Preview Q-Bank</h1>
        <p className="text-sm text-gray-500">{files.length} file{files.length !== 1 ? 's' : ''} uploaded</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : files.length === 0 ? (
        <div className="card"><EmptyState icon={FolderOpen} title="No Q-Bank files yet" subtitle="Upload a Q-Bank file from the 'Upload Q-Bank' tab to preview it here." /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map(f => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0"><FileText size={20} className="text-secondary" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{f.course_name}</h3>
                  <p className="text-sm text-gray-500">{f.course_code}</p>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">{f.original_name}</p>
                  <p className="text-xs text-gray-600">By {f.faculty_name || 'Faculty'}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <a href={`http://localhost:5000/uploads/${f.file_path}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors" title="Download">
                    <Download size={16} />
                  </a>
                  <button onClick={() => handleDelete(f.id)} disabled={deleting === f.id}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors disabled:opacity-50">
                    {deleting === f.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// Year Coordinator Panel
// Accessible only when isCoordinator=true (double-gated: frontend + backend)
// ══════════════════════════════════════════════

function YearCoordinatorSection({ showToast, toast, setToast }: any) {
  const [subTab, setSubTab] = useState<'qbank' | 'paper'>('qbank');

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="text-yellow-400" size={30} />
            Year Coordinator Panel
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Review Q-Banks and Question Papers submitted by faculty — forward to Admin for final approval.
          </p>
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl border"
        style={{ background: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.2)' }}>
        <ShieldCheck className="text-yellow-400 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-yellow-200/80">
          All actions are logged and DB-verified server-side. Your coordinator access is re-validated on every API call.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-3 border-b border-white/5 pb-1">
        {([
          { id: 'qbank', label: 'Question Banks', icon: FileText },
          { id: 'paper', label: 'Question Papers', icon: FileText },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-semibold transition-all ${subTab === t.id
              ? 'bg-yellow-400/15 text-yellow-300 border border-b-transparent border-yellow-400/30'
              : 'text-gray-400 hover:text-white'
            }`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {subTab === 'qbank' && <CoordinatorQBankTab showToast={showToast} />}
      {subTab === 'paper' && <CoordinatorPaperTab showToast={showToast} />}
    </div>
  );
}

// ── Coordinator Q-Bank Tab ─────────────────────
function CoordinatorQBankTab({ showToast }: any) {
  const [qbanks, setQbanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [actioning, setActioning] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const statusConfig: Record<string, { label: string; color: string }> = {
    submitted_to_coordinator: { label: 'Pending Review', color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
    coordinator_approved: { label: 'Approved', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    coordinator_rejected: { label: 'Rejected', color: 'bg-red-500/15 text-red-300 border-red-500/30' },
    forwarded_to_admin: { label: 'Forwarded to Admin', color: 'bg-green-500/15 text-green-300 border-green-500/30' },
  };

  const load = async () => {
    setLoading(true);
    try { setQbanks(await api.coordinator.listQBanks()); } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (qbId: number, action: 'approve' | 'reject' | 'forward') => {
    setActioning(qbId);
    try {
      await api.coordinator.reviewQBank(qbId, action, remarks[qbId] || '');
      const lbl = action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Forwarded to Admin';
      showToast(`Q-Bank ${lbl} successfully ✓`);
      setRemarks(prev => { const r = { ...prev }; delete r[qbId]; return r; });
      await load();
    } catch (err: any) {
      showToast(err.message || `Failed to ${action}`, 'error');
    }
    setActioning(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{qbanks.length} Q-Bank{qbanks.length !== 1 ? 's' : ''} in queue</p>
        <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
          style={{ border: '1px solid rgba(0,255,245,0.2)', color: '#00FFF5', background: 'rgba(0,255,245,0.05)' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
      {qbanks.length === 0 ? (
        <div className="card flex flex-col items-center py-20 gap-4 text-center">
          <ClipboardCheck size={56} className="text-gray-600" />
          <p className="text-xl font-semibold text-gray-400">No Q-Banks pending review</p>
          <p className="text-sm text-gray-600 max-w-xs">Q-Banks submitted by faculty will appear here.</p>
        </div>
      ) : qbanks.map(qb => {
        const sc = statusConfig[qb.status] ?? { label: qb.status, color: 'bg-gray-500/15 text-gray-300 border-gray-500/30' };
        const isExpanded = expandedId === qb.id;
        const canAct = ['submitted_to_coordinator', 'coordinator_approved', 'coordinator_rejected'].includes(qb.status);
        return (
          <motion.div key={qb.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card space-y-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-lg">{qb.course_name}</h3>
                  <span className="text-xs font-mono text-gray-400">{qb.course_code}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${sc.color}`}>{sc.label}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                  <span>Faculty: <span className="text-gray-300">{qb.faculty_name}</span></span>
                  <span className="flex items-center gap-1"><Clock size={12} />{new Date(qb.created_at).toLocaleDateString('en-IN')}</span>
                  {qb.question_count > 0 && <span>{qb.question_count} questions</span>}
                </div>
                {qb.latest_remark && <p className="text-xs text-gray-400 mt-1.5 italic">Last remark: "{qb.latest_remark}"</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {qb.file_url && (
                  <a href={`/api/qbanks/${qb.id}/file`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                    style={{ border: '1px solid rgba(100,200,100,0.4)', color: '#4ade80', background: 'rgba(74,222,128,0.06)' }}>
                    <Download size={14} /> PDF
                  </a>
                )}
                <button onClick={() => setExpandedId(isExpanded ? null : qb.id)}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#D9D9D9', background: 'rgba(255,255,255,0.04)' }}>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>
            {isExpanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-3 border-t border-white/10">
                <label className="block text-sm font-semibold text-gray-300">
                  Coordinator Remarks <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <textarea className="w-full input-field resize-none text-sm" rows={3}
                  placeholder="Add your review comments or reasons for rejection..."
                  value={remarks[qb.id] || ''}
                  onChange={e => setRemarks(prev => ({ ...prev, [qb.id]: e.target.value }))} />
                {canAct ? (
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => handleAction(qb.id, 'approve')} disabled={actioning === qb.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                      {actioning === qb.id ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />} Approve
                    </button>
                    <button onClick={() => handleAction(qb.id, 'reject')} disabled={actioning === qb.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                      {actioning === qb.id ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />} Reject
                    </button>
                    <button onClick={() => handleAction(qb.id, 'forward')} disabled={actioning === qb.id}
                      className="btn-primary flex items-center gap-2 text-sm py-2 px-4 disabled:opacity-50">
                      {actioning === qb.id ? <Loader2 size={14} className="animate-spin" /> : <Forward size={14} />} Forward to Admin
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-green-400" /> Forwarded to Admin — no further action needed.
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Coordinator Paper Tab ─────────────────────
function CoordinatorPaperTab({ showToast }: any) {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [actioning, setActioning] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const statusConfig: Record<string, { label: string; color: string }> = {
    submitted_to_coordinator: { label: 'Pending Review', color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
    coordinator_approved: { label: 'Approved', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    coordinator_rejected: { label: 'Rejected', color: 'bg-red-500/15 text-red-300 border-red-500/30' },
    forwarded_to_admin: { label: 'Forwarded to Admin', color: 'bg-green-500/15 text-green-300 border-green-500/30' },
  };

  const load = async () => {
    setLoading(true);
    try { setPapers(await api.coordinator.listPapers()); } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (paperId: number, action: 'approve' | 'reject' | 'forward') => {
    setActioning(paperId);
    try {
      await api.coordinator.reviewPaper(paperId, action, remarks[paperId] || '');
      const lbl = action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Forwarded to Admin';
      showToast(`Paper ${lbl} successfully ✓`);
      setRemarks(prev => { const r = { ...prev }; delete r[paperId]; return r; });
      await load();
    } catch (err: any) {
      showToast(err.message || `Failed to ${action}`, 'error');
    }
    setActioning(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{papers.length} Paper{papers.length !== 1 ? 's' : ''} in queue</p>
        <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
          style={{ border: '1px solid rgba(0,255,245,0.2)', color: '#00FFF5', background: 'rgba(0,255,245,0.05)' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
      {papers.length === 0 ? (
        <div className="card flex flex-col items-center py-20 gap-4 text-center">
          <FileText size={56} className="text-gray-600" />
          <p className="text-xl font-semibold text-gray-400">No Question Papers pending review</p>
          <p className="text-sm text-gray-600 max-w-xs">Papers submitted by faculty will appear here.</p>
        </div>
      ) : papers.map(p => {
        const sc = statusConfig[p.status] ?? { label: p.status, color: 'bg-gray-500/15 text-gray-300 border-gray-500/30' };
        const isExpanded = expandedId === p.id;
        const canAct = ['submitted_to_coordinator', 'coordinator_approved', 'coordinator_rejected'].includes(p.status);
        return (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card space-y-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-lg">{p.course_name}</h3>
                  {p.course_code && <span className="text-xs font-mono text-gray-400">{p.course_code}</span>}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${sc.color}`}>{sc.label}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                  <span>Faculty: <span className="text-gray-300">{p.faculty_name}</span></span>
                  {p.exam_type && <span>{p.exam_type}</span>}
                  {p.total_marks && <span>{p.total_marks} Marks</span>}
                  <span className="flex items-center gap-1"><Clock size={12} />{new Date(p.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {p.file_url && (
                  <a href={`/api/papers/${p.id}/file`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                    style={{ border: '1px solid rgba(100,200,100,0.4)', color: '#4ade80', background: 'rgba(74,222,128,0.06)' }}>
                    <Download size={14} /> PDF
                  </a>
                )}
                <button onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#D9D9D9', background: 'rgba(255,255,255,0.04)' }}>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>
            {isExpanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-3 border-t border-white/10">
                <label className="block text-sm font-semibold text-gray-300">
                  Coordinator Remarks <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <textarea className="w-full input-field resize-none text-sm" rows={3}
                  placeholder="Add your review comments or reasons for rejection..."
                  value={remarks[p.id] || ''}
                  onChange={e => setRemarks(prev => ({ ...prev, [p.id]: e.target.value }))} />
                {canAct ? (
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => handleAction(p.id, 'approve')} disabled={actioning === p.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                      {actioning === p.id ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />} Approve
                    </button>
                    <button onClick={() => handleAction(p.id, 'reject')} disabled={actioning === p.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                      {actioning === p.id ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />} Reject
                    </button>
                    <button onClick={() => handleAction(p.id, 'forward')} disabled={actioning === p.id}
                      className="btn-primary flex items-center gap-2 text-sm py-2 px-4 disabled:opacity-50">
                      {actioning === p.id ? <Loader2 size={14} className="animate-spin" /> : <Forward size={14} />} Forward to Admin
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-green-400" /> Forwarded to Admin — no further action needed.
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

