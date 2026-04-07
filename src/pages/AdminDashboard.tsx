import React, { useState, useEffect } from 'react';
import {
  Users, ShieldCheck, Search, Plus, Inbox, UserX,
  Edit3, Trash2, CheckCircle2, XCircle, Download, BookOpen,
  Loader2, X, AlertCircle, FileText, Database, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../api';
import { motion, AnimatePresence } from 'motion/react';

// ── Shared helpers ──────────────────────────────────────
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    approved: 'bg-green-500/15 text-green-300 border-green-500/30',
    rejected: 'bg-red-500/15 text-red-300 border-red-500/30',
    active: 'bg-green-500/15 text-green-300 border-green-500/30',
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${map[status] || 'bg-white/5 text-gray-400 border-white/10'}`}>
      {status}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────
export const AdminDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

  if (activeTab === 'dashboard') return <AdminOverview showToast={showToast} toast={toast} setToast={setToast} />;
  if (activeTab === 'manage-faculty') return <ManageFaculty showToast={showToast} toast={toast} setToast={setToast} />;
  if (activeTab === 'approvals') return <ApprovalsHub showToast={showToast} toast={toast} setToast={setToast} />;
  return null;
};

// ── Admin Overview ───────────────────────────────────────
function AdminOverview({ showToast, toast, setToast }: any) {
  const [stats, setStats] = useState({ faculty_count: 0, student_count: 0 });
  const [qbankOpen, setQbankOpen] = useState(false);
  const [paperOpen, setPaperOpen] = useState(false);
  const [qbanks, setQbanks] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [qbankLoading, setQbankLoading] = useState(false);
  const [paperLoading, setPaperLoading] = useState(false);

  useEffect(() => {
    api.users.stats().then(s => setStats(s)).catch(() => { });
  }, []);

  const handleOpenQBank = async () => {
    const opening = !qbankOpen;
    setQbankOpen(opening);
    if (opening && qbanks.length === 0) {
      setQbankLoading(true);
      try { setQbanks(await api.qbanks.listAll()); } catch { }
      setQbankLoading(false);
    }
  };

  const handleOpenPaper = async () => {
    const opening = !paperOpen;
    setPaperOpen(opening);
    if (opening && papers.length === 0) {
      setPaperLoading(true);
      try { setPapers(await api.papers.listAll()); } catch { }
      setPaperLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      <h1 className="text-3xl font-bold">System Administration</h1>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <Users className="text-primary mb-4" size={32} />
          <h3 className="text-xl font-bold">Total Faculty</h3>
          <p className="text-4xl font-bold">{stats.faculty_count}</p>
        </div>

        {/* Question Bank Card */}
        <button onClick={handleOpenQBank}
          className="card text-left transition-all hover:border-primary/40 hover:shadow-lg cursor-pointer group"
          style={{ border: '1px solid rgba(0,255,245,0.08)' }}>
          <div className="flex items-start justify-between">
            <Database className="text-cyan-400 mb-4" size={32} />
            {qbankOpen ? <ChevronUp size={18} className="text-gray-500 group-hover:text-primary mt-1" /> : <ChevronDown size={18} className="text-gray-500 group-hover:text-primary mt-1" />}
          </div>
          <h3 className="text-xl font-bold">Question Bank</h3>
          <p className="text-4xl font-bold">{qbanks.length > 0 ? qbanks.length : '—'}</p>
          <p className="text-xs text-gray-500 mt-1">{qbankOpen ? 'Click to collapse' : 'Click to view all Q-banks'}</p>
        </button>

        {/* Question Paper Card */}
        <button onClick={handleOpenPaper}
          className="card text-left transition-all hover:border-primary/40 hover:shadow-lg cursor-pointer group"
          style={{ border: '1px solid rgba(0,255,245,0.08)' }}>
          <div className="flex items-start justify-between">
            <FileText className="text-violet-400 mb-4" size={32} />
            {paperOpen ? <ChevronUp size={18} className="text-gray-500 group-hover:text-primary mt-1" /> : <ChevronDown size={18} className="text-gray-500 group-hover:text-primary mt-1" />}
          </div>
          <h3 className="text-xl font-bold">Question Paper</h3>
          <p className="text-4xl font-bold">{papers.length > 0 ? papers.length : '—'}</p>
          <p className="text-xs text-gray-500 mt-1">{paperOpen ? 'Click to collapse' : 'Click to view all papers'}</p>
        </button>
      </div>

      {/* Question Bank Expanded Panel */}
      <AnimatePresence>
        {qbankOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <Database size={18} className="text-cyan-400" />
              <h3 className="font-bold text-lg">Question Banks</h3>
              <span className="ml-auto text-xs text-gray-500">{qbanks.length} document{qbanks.length !== 1 ? 's' : ''}</span>
            </div>
            {qbankLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={36} /></div>
            ) : qbanks.length === 0 ? (
              <EmptyState icon={Database} title="No question banks yet" subtitle="Faculty-generated question banks will appear here once submitted." />
            ) : (
              <table className="w-full text-left">
                <thead className="bg-white/5 text-xs font-bold uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Course</th>
                    <th className="px-6 py-3">Faculty</th>
                    <th className="px-6 py-3">Questions</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {qbanks.map((qb: any) => (
                    <tr key={qb.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium">{qb.course_name}<span className="text-gray-500 ml-1 text-xs">({qb.course_code})</span></td>
                      <td className="px-6 py-3 text-sm text-gray-400">{qb.faculty_name || qb.faculty_name_display || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-400">{qb.question_count || 0}</td>
                      <td className="px-6 py-3 text-xs text-gray-500">{new Date(qb.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3"><StatusBadge status={qb.status || 'pending'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}
      </AnimatePresence>


      {/* Question Paper Expanded Panel */}
      <AnimatePresence>
        {paperOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <FileText size={18} className="text-violet-400" />
              <h3 className="font-bold text-lg">Question Papers</h3>
              <span className="ml-auto text-xs text-gray-500">{papers.length} paper{papers.length !== 1 ? 's' : ''}</span>
            </div>
            {paperLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={36} /></div>
            ) : papers.length === 0 ? (
              <EmptyState icon={FileText} title="No question papers yet" subtitle="Faculty-generated question papers will appear here once created." />
            ) : (
              <table className="w-full text-left">
                <thead className="bg-white/5 text-xs font-bold uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Course</th>
                    <th className="px-6 py-3">Exam Type</th>
                    <th className="px-6 py-3">Total Marks</th>
                    <th className="px-6 py-3">Faculty</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.map((p: any) => (
                    <tr key={p.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-6 py-3 font-medium text-sm">{p.course_name || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-400">{p.exam_type || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-400">{p.total_marks}</td>
                      <td className="px-6 py-3 text-sm text-gray-400">{p.faculty_name || '—'}</td>
                      <td className="px-6 py-3 text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3"><StatusBadge status={p.status || 'pending'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Manage Faculty ───────────────────────────────────────
function ManageFaculty({ showToast, toast, setToast }: any) {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', department: '' });
  const [roleUpdating, setRoleUpdating] = useState<number | null>(null);

  // Add faculty form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDept, setNewDept] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const rows = await api.users.list('faculty');
      setFaculty(rows);
    } catch { }
    setLoading(false);
  };

  const handleAddFaculty = async () => {
    if (!newName || !newEmail || !newPassword) {
      showToast('Name, email and password are required', 'error');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/users/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('qsage_token')}` },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, department: newDept }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFaculty(prev => [data, ...prev]);
      setShowAddModal(false);
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewDept('');
      showToast(`Faculty "${newName}" added successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to add faculty', 'error');
    }
    setAdding(false);
  };

  const startEdit = (f: any) => {
    setEditingId(f.id);
    setEditForm({ name: f.name, email: f.email, department: f.department || '' });
  };

  const saveEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('qsage_token')}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFaculty(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
      setEditingId(null);
      showToast('Faculty updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete faculty "${name}"? This cannot be undone.`)) return;
    try {
      await api.users.delete(id);
      setFaculty(prev => prev.filter(f => f.id !== id));
      showToast(`Faculty "${name}" removed.`);
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleRoleChange = async (f: any, isCoordinator: boolean) => {
    setRoleUpdating(f.id);
    try {
      await api.users.setCoordinator(f.id, isCoordinator);
      setFaculty(prev => prev.map(x => x.id === f.id ? { ...x, is_coordinator: isCoordinator } : x));
      showToast(`${f.name} is now ${ isCoordinator ? 'a Year Coordinator' : 'a Normal Faculty' }.`);
    } catch (err: any) {
      showToast(err.message || 'Role update failed', 'error');
    }
    setRoleUpdating(null);
  };

  const filtered = faculty.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Faculty Management</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Faculty</button>
      </div>

      {/* Add Faculty Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="card w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Add New Faculty</h3>
                <button onClick={() => setShowAddModal(false)}><X size={20} className="text-gray-400 hover:text-white" /></button>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
                <input className="w-full input-field" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Dr. John Smith" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email *</label>
                <input type="email" className="w-full input-field" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="faculty@university.edu" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password *</label>
                <input type="password" className="w-full input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Temporary password" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Department</label>
                <input className="w-full input-field" value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="e.g. Computer Science" />
              </div>
              <button onClick={handleAddFaculty} disabled={adding} className="btn-primary w-full flex items-center justify-center gap-2">
                {adding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                {adding ? 'Adding...' : 'Add Faculty'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Search faculty..." className="w-full bg-surface-hover border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm" />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} faculty member{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white/5 text-xs font-bold uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Name / Email</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-500"><Loader2 className="animate-spin mx-auto" size={32} /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4}><EmptyState icon={UserX} title="No faculty added yet" subtitle="Click 'Add Faculty' to register faculty members." /></td></tr>
            ) : filtered.map(f => (
              <tr key={f.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-6 py-4">
                  {editingId === f.id ? (
                    <div className="space-y-1">
                      <input className="input-field text-sm w-full" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                      <input className="input-field text-sm w-full" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-sm">{f.name}</p>
                      <p className="text-xs text-gray-500">{f.email}</p>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === f.id ? (
                    <input className="input-field text-sm w-full" value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} placeholder="Department" />
                  ) : (
                    <span className="text-sm text-gray-400">{f.department || '—'}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={f.is_coordinator ? 'coordinator' : 'normal'}
                    onChange={e => handleRoleChange(f, e.target.value === 'coordinator')}
                    disabled={roleUpdating === f.id}
                    className="text-xs font-semibold rounded-lg px-2 py-1.5 border focus:outline-none cursor-pointer"
                    style={f.is_coordinator
                      ? { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)' }
                      : { background: 'rgba(255,255,255,0.04)', color: '#9ca3af', borderColor: 'rgba(255,255,255,0.1)' }
                    }
                  >
                    <option value="normal">Normal Faculty</option>
                    <option value="coordinator">Year Coordinator</option>
                  </select>
                </td>
                <td className="px-6 py-4"><StatusBadge status={f.status || 'active'} /></td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {editingId === f.id ? (
                      <>
                        <button onClick={() => saveEdit(f.id)} className="p-1.5 bg-green-500/10 hover:bg-green-500/20 rounded text-green-400 transition-colors"><CheckCircle2 size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 transition-colors"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(f)} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 rounded text-blue-400 transition-colors"><Edit3 size={16} /></button>
                        <button onClick={() => handleDelete(f.id, f.name)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded text-red-400 transition-colors"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Approvals Hub (2 sub-tabs) ───────────────────────────
function ApprovalsHub({ showToast, toast, setToast }: any) {
  const [subTab, setSubTab] = useState<'qbank' | 'paper'>('qbank');

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Approvals</h1>
      </div>
      {/* Sub-tabs */}
      <div className="flex gap-3 border-b border-white/5 pb-1">
        {[
          { id: 'qbank', label: 'Question Bank', icon: Database },
          { id: 'paper', label: 'Question Paper', icon: FileText },
        ].map((t: any) => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-semibold transition-all ${subTab === t.id
              ? 'bg-primary/15 text-primary border border-b-transparent border-primary/30'
              : 'text-gray-400 hover:text-white'
              }`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>
      {subTab === 'qbank' && <ApproveQBank showToast={showToast} />}
      {subTab === 'paper' && <ApprovePaper showToast={showToast} />}
    </div>
  );
}

// ── Approve Q-Bank (Document-Based) ──────────────────────
function ApproveQBank({ showToast }: any) {
  const [qbanks, setQbanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => { fetchQBanks(); }, []);

  const fetchQBanks = async () => {
    setLoading(true);
    try { setQbanks(await api.qbanks.listAll()); } catch { }
    setLoading(false);
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await api.qbanks.approve(id);
      setQbanks(prev => prev.map(q => q.id === id ? { ...q, status: 'approved' } : q));
      showToast('Question Bank approved! Students can now download it.');
    } catch (err: any) { showToast(err.message || 'Failed', 'error'); }
    setActionLoading(null);
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await api.qbanks.reject(id);
      setQbanks(prev => prev.map(q => q.id === id ? { ...q, status: 'rejected' } : q));
      showToast('Question Bank rejected.');
    } catch (err: any) { showToast(err.message || 'Failed', 'error'); }
    setActionLoading(null);
  };

  const filtered = qbanks.filter(q => filter === 'all' || q.status === filter);
  const pendingCount = qbanks.filter(q => q.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-surface-hover text-gray-400 hover:text-white'}`}>
              {f} {f !== 'all' && <span className="ml-1 text-xs opacity-70">({qbanks.filter(q => q.status === f).length})</span>}
            </button>
          ))}
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1 bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-bold">{pendingCount} pending</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Database} title="No question banks found" subtitle="Faculty-generated question banks will appear here as documents for review." /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(qb => (
            <motion.div key={qb.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Database size={22} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-bold">{qb.course_name}</p>
                  {qb.course_code && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-primary/10 text-primary border-primary/30">{qb.course_code}</span>}
                  <StatusBadge status={qb.status || 'pending'} />
                </div>
                <p className="text-sm text-gray-500">
                  By {qb.faculty_name || qb.faculty_name_display || 'Faculty'} · {qb.question_count || 0} questions · {new Date(qb.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {qb.file_url && (
                  <a
                    href={`/api/qbanks/${qb.id}/file`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-lg text-sm font-semibold transition-colors border border-blue-500/20"
                  >
                    <Download size={14} /> View DOCX
                  </a>
                )}
                {qb.status !== 'approved' && (
                  <button onClick={() => handleApprove(qb.id)} disabled={actionLoading === qb.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 rounded-lg text-sm font-semibold transition-colors border border-green-500/20">
                    {actionLoading === qb.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve
                  </button>
                )}
                {qb.status !== 'rejected' && (
                  <button onClick={() => handleReject(qb.id)} disabled={actionLoading === qb.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg text-sm font-semibold transition-colors border border-red-500/20">
                    {actionLoading === qb.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Approve Question Paper ────────────────────────────────
function ApprovePaper({ showToast }: any) {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => { fetchPapers(); }, []);

  const fetchPapers = async () => {
    setLoading(true);
    try { setPapers(await api.papers.listAll()); } catch { }
    setLoading(false);
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await api.papers.approve(id);
      setPapers(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
      showToast('Question paper approved!');
    } catch (err: any) { showToast(err.message || 'Failed', 'error'); }
    setActionLoading(null);
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await api.papers.reject(id);
      setPapers(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
      showToast('Question paper rejected.');
    } catch (err: any) { showToast(err.message || 'Failed', 'error'); }
    setActionLoading(null);
  };

  const filtered = papers.filter(p => filter === 'all' || p.status === filter);
  const pendingCount = papers.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-surface-hover text-gray-400 hover:text-white'
                }`}>
              {f} {f !== 'all' && <span className="ml-1 text-xs opacity-70">({papers.filter(p => p.status === f).length})</span>}
            </button>
          ))}
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1 bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-bold">{pendingCount} pending</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={FileText} title="No question papers found" subtitle="Faculty-generated question papers will appear here for admin review." /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <FileText size={18} className="text-primary shrink-0" />
                  <p className="font-bold">{p.course_name}</p>
                  <StatusBadge status={p.status || 'pending'} />
                </div>
                <p className="text-sm text-gray-500 ml-7">
                  {p.exam_type || 'Exam'} · {p.total_marks} Marks · By {p.faculty_name} ·
                  <span className="ml-1">{new Date(p.created_at).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.file_url && (
                  <a
                    href={`/api/papers/${p.id}/file`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-lg text-sm font-semibold transition-colors border border-blue-500/20"
                  >
                    <Download size={14} /> Download PDF
                  </a>
                )}
                {p.status !== 'admin_approved' && p.status !== 'approved' && (
                  <button onClick={() => handleApprove(p.id)} disabled={actionLoading === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 rounded-lg text-sm font-semibold transition-colors border border-green-500/20">
                    {actionLoading === p.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve
                  </button>
                )}
                {p.status !== 'admin_rejected' && p.status !== 'rejected' && (
                  <button onClick={() => handleReject(p.id)} disabled={actionLoading === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg text-sm font-semibold transition-colors border border-red-500/20">
                    {actionLoading === p.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

