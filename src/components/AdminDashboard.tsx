/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Settings, Palette, Type, Sliders, Sparkles, Terminal, 
  Trash2, Plus, Download, UserCheck, Shield, Key, Mail, MessageSquare, 
  Search, Eye, EyeOff, CheckCircle2, Volume2, Globe, FileSignature, Users, Heart, BookOpen
} from 'lucide-react';
import { User as UserType, SystemConfig, Report, PasswordReset, DocumentMaterial } from '../types';
import { 
  getAccentColorClass, 
  getBorderRadiusClass, 
  getGlassmorphismClass 
} from './CommonUI';
import { DOCUMENT_CATEGORIES } from '../data';

interface AdminDashboardProps {
  currentUser: UserType;
  config: SystemConfig;
  allUsers: UserType[];
  reports: Report[];
  passwordResets: PasswordReset[];
  documents: DocumentMaterial[];
  onUpdateConfig: (newConfig: Partial<SystemConfig>) => void;
  onUpdateUserRole: (regNo: string, newRole: UserType['role']) => void;
  onAddAnnouncement: (text: string) => void;
  onAddNews: (text: string) => void;
  onRemoveNews: (index: number) => void;
  onReplyToReport: (reportId: string, reply: string) => void;
  onResolveReset: (resetId: string, tempPwd: string) => void;
  onDirectResetPassword: (regNo: string, tempPwd: string) => void;
  onUploadDocument: (title: string, category: string, fileName: string, dataUrl: string) => void;
  onDeleteDocument: (docId: string) => void;
  onRemoveUser: (regNo: string) => void;
  showToast: (msg: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  config,
  allUsers,
  reports,
  passwordResets,
  documents,
  onUpdateConfig,
  onUpdateUserRole,
  onAddAnnouncement,
  onAddNews,
  onRemoveNews,
  onReplyToReport,
  onResolveReset,
  onDirectResetPassword,
  onUploadDocument,
  onDeleteDocument,
  onRemoveUser,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'health' | 'academic' | 'social' | 'students' | 'resets' | 'materials' | 'news' | 'admins' | 'identity'>('home');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmingDeleteRegNo, setConfirmingDeleteRegNo] = useState<string | null>(null);

  // Form states
  const [announcementText, setAnnouncementText] = useState('');
  const [newsInputText, setNewsInputText] = useState('');
  
  // Materials Upload states
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('General');
  const [docFile, setDocFile] = useState<{ name: string; dataUrl: string } | null>(null);

  // Direct Password Reset state
  const [directResetReg, setDirectResetReg] = useState('');
  const [directResetPwd, setDirectResetPwd] = useState('');
  const [showDirectPwd, setShowDirectPwd] = useState(false);

  // Quick draft states for replying (mapped by reportId)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  // Quick password draft states for resets (mapped by resetId)
  const [resetPwdDrafts, setResetPwdDrafts] = useState<Record<string, string>>({});
  const [showResetDraftPwd, setShowResetDraftPwd] = useState<Record<string, boolean>>({});

  // Styles
  const radius = getBorderRadiusClass(config.borderRadius);
  const accentText = getAccentColorClass(config.colorAccent, 'text');
  const accentBg = getAccentColorClass(config.colorAccent, 'bg');
  const accentGradient = getAccentColorClass(config.colorAccent, 'from-to');

  const isProg = currentUser.role === 'programmer';

  // Sector Counts for unanswered
  const healthPending = reports.filter(r => r.sector === 'health' && r.status === 'pending').length;
  const academicPending = reports.filter(r => r.sector === 'academic' && r.status === 'pending').length;
  const socialPending = reports.filter(r => r.sector === 'social' && r.status === 'pending').length;
  const resetsPending = passwordResets.filter(r => r.status === 'pending').length;

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDocFile({
        name: file.name,
        dataUrl: ev.target?.result as string
      });
      showToast(`📎 File prepared: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = () => {
    if (!docTitle.trim() || !docFile) {
      showToast("Please provide a title and select a file to upload.");
      return;
    }
    onUploadDocument(docTitle.trim(), docCategory, docFile.name, docFile.dataUrl);
    setDocTitle('');
    setDocFile(null);
    showToast("Learning materials uploaded successfully!");
  };

  const handleSendAnnouncement = () => {
    if (!announcementText.trim()) {
      showToast("Write a announcement message first.");
      return;
    }
    onAddAnnouncement(announcementText.trim());
    setAnnouncementText('');
    showToast("Announcement published and chimes broadcasted to student bells.");
  };

  const handleAddNewsItem = () => {
    if (!newsInputText.trim()) return;
    onAddNews(newsInputText.trim());
    setNewsInputText('');
    showToast("Pulse ticker updated!");
  };

  const handleReplySubmit = (reportId: string) => {
    const draft = replyDrafts[reportId]?.trim();
    if (!draft) {
      showToast("Please enter an answer before submitting.");
      return;
    }
    onReplyToReport(reportId, draft);
    setReplyDrafts(prev => ({ ...prev, [reportId]: '' }));
    showToast("Reply posted successfully!");
  };

  const handleResolveResetSubmit = (resetId: string) => {
    const tempPwd = resetPwdDrafts[resetId]?.trim();
    if (!tempPwd || tempPwd.length < 4) {
      showToast("Set a temporary password of at least 4 characters.");
      return;
    }
    onResolveReset(resetId, tempPwd);
    setResetPwdDrafts(prev => ({ ...prev, [resetId]: '' }));
    showToast("Temporary password configured. Student can now log in.");
  };

  const handleDirectResetSubmit = () => {
    if (!directResetReg) {
      showToast("Select a student to reset.");
      return;
    }
    if (!directResetPwd || directResetPwd.length < 4) {
      showToast("Choose a temporary password of at least 4 characters.");
      return;
    }
    onDirectResetPassword(directResetReg, directResetPwd);
    setDirectResetReg('');
    setDirectResetPwd('');
    showToast("Password updated. Email notifications have been issued.");
  };

  return (
    <div className="space-y-6">
      {/* Admin Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 font-sans tracking-tight">
              Control Home
            </h1>
            <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
              isProg ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
            }`}>
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            Student Network Security and Log Verification Desk
          </p>
        </div>
      </motion.div>

      {/* Stats Counter tiles */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 p-3 rounded-xl text-center">
          <span className="block text-xl font-black text-slate-700 dark:text-slate-300 font-sans">
            {allUsers.filter(u => u.role === 'user').length}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Peers</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 p-3 rounded-xl text-center">
          <span className="block text-xl font-black text-red-500 font-sans">
            {reports.filter(r => r.status === 'pending').length}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Pending</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 p-3 rounded-xl text-center">
          <span className="block text-xl font-black text-emerald-500 font-sans">
            {reports.filter(r => r.status === 'answered').length}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Resolved</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 p-3 rounded-xl text-center">
          <span className="block text-xl font-black text-blue-500 font-sans">
            {documents.length}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Files</span>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {(['home', 'health', 'academic', 'social', 'students', 'resets', 'materials', 'news', 'admins', 'identity'] as const).map((tab) => {
          if (tab === 'admins' && !isProg) return null;
          if (tab === 'identity' && !isProg) return null;

          const active = activeTab === tab;
          const label = tab === 'home' ? '🏠 Home' :
                        tab === 'health' ? '🏥 Health' :
                        tab === 'academic' ? '📚 Academic' :
                        tab === 'social' ? '🤝 Welfare' :
                        tab === 'students' ? '👥 Students' :
                        tab === 'resets' ? '🔑 Password Resets' :
                        tab === 'materials' ? '📂 Materials' :
                        tab === 'news' ? '📰 News & Broadcast' :
                        tab === 'admins' ? '🛡️ Admin Roles' : '⚡ Brand Identity';

          const pendingBadgeCount = tab === 'health' ? healthPending :
                                    tab === 'academic' ? academicPending :
                                    tab === 'social' ? socialPending :
                                    tab === 'resets' ? resetsPending : 0;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-3.5 text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${radius} ${
                active
                  ? tab === 'admins' || tab === 'identity'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {label}
              {pendingBadgeCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                  {pendingBadgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content tabs viewport */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} flex flex-col items-center text-center space-y-4`}>
              <div className="w-16 h-16 rounded-full bg-slate-150 dark:bg-slate-800 flex items-center justify-center text-3xl">
                🛡️
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  MUHAS Pulse Admin Desk
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  You are signed in as an administrator. Navigate through the tabs to process student health notifications, welfare demands, and learning material provisions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('health')}
                className={`p-4 bg-red-50/50 dark:bg-red-950/10 border border-red-150/40 dark:border-red-900/20 rounded-xl text-left flex items-start gap-3 group transition-all`}
              >
                <Heart className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Health Cases ({healthPending})</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Review critical medical alerts from clinical student channels.</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('academic')}
                className={`p-4 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-150/40 dark:border-blue-900/20 rounded-xl text-left flex items-start gap-3 group transition-all`}
              >
                <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Academics ({academicPending})</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Grade concerns, missing notes, and extra help requests.</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('social')}
                className={`p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-150/40 dark:border-amber-900/20 rounded-xl text-left flex items-start gap-3 group transition-all`}
              >
                <Users className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Welfare ({socialPending})</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Union questions, welfare demands, and housing disputes.</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {(['health', 'academic', 'social'] as const).includes(activeTab as any) && (
          <motion.div
            key="reports-review"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center bg-slate-50/40 dark:bg-slate-900/20 p-2 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Listing Sector: {activeTab} logs
              </span>
            </div>

            {reports.filter(r => r.sector === activeTab).length === 0 ? (
              <div className={`p-10 ${getGlassmorphismClass(config.glassmorphism)} ${radius} text-center text-slate-400`}>
                <div className="text-xl mx-auto mb-3">📭</div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">No logs reported in this sector</h4>
                <p className="text-[10px] text-slate-500 mt-1">Logs from student departments will index here instantly once submitted.</p>
              </div>
            ) : (
              reports.filter(r => r.sector === activeTab).slice().reverse().map((report) => {
                const isAnswered = report.status === 'answered';
                const student = allUsers.find(u => u.regNo === report.regNo);
                return (
                  <motion.div
                    key={report.id}
                    layout
                    className={`p-4 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-150/40 dark:border-slate-800/40 space-y-3`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          {report.name}
                          <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-800">
                            {report.regNo}
                          </span>
                        </h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                          {student?.course} · Submitted {report.time}
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                        isAnswered ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {report.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans pr-1">
                      {report.text}
                    </p>

                    {report.attachmentName && (
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/50 px-2.5 py-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 rounded-md border border-slate-200/40 dark:border-slate-800/50">
                        📎 {report.attachmentName}
                      </div>
                    )}

                    {/* Reach out anchors */}
                    {student && (
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`https://wa.me/${student.countryCode.replace('+', '')}${student.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100/50 dark:bg-emerald-950/20 rounded-md border border-emerald-150/50 dark:border-emerald-900/30 flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp Student
                        </a>
                        <a
                          href={`mailto:${student.email}`}
                          className="px-2.5 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100/50 dark:bg-blue-950/20 rounded-md border border-blue-150/50 dark:border-blue-900/30 flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" /> Email Address
                        </a>
                      </div>
                    )}

                    {/* Actions block */}
                    {isAnswered ? (
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-150/40 dark:border-emerald-900/20 space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase">
                          <span>✅ Replied by administrator</span>
                          <span>{report.replyTime}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                          {report.reply}
                        </p>
                      </div>
                    ) : (
                      <div className="border-t border-slate-100 dark:border-slate-800/50 pt-3 flex gap-2">
                        <input
                          type="text"
                          value={replyDrafts[report.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReplyDrafts(prev => ({ ...prev, [report.id]: val }));
                          }}
                          placeholder={`Write an answer response to ${report.name.split(' ')[0]}...`}
                          className={`flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                        />
                        <button
                          onClick={() => handleReplySubmit(report.id)}
                          className={`px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:shadow-md ${radius} shrink-0`}
                        >
                          Send Reply
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {activeTab === 'students' && (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered students by registry, name, course..."
                className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 pl-10 text-xs ${radius} focus:outline-none`}
              />
            </div>

            {/* List cards */}
            <div className="space-y-3.5">
              {[...allUsers]
                .sort((a, b) => {
                  const roleOrder = { programmer: 1, admin: 2, user: 3 };
                  return roleOrder[a.role] - roleOrder[b.role];
                })
                .filter(u => {
                  const query = searchQuery.toLowerCase();
                  const fName = u.firstName || '';
                  const lName = u.lastName || '';
                  const reg = u.regNo || '';
                  const crs = u.course || '';
                  return fName.toLowerCase().includes(query) ||
                         lName.toLowerCase().includes(query) ||
                         reg.toLowerCase().includes(query) ||
                         crs.toLowerCase().includes(query);
                })
                .map((student) => (
                  <div
                    key={student.regNo}
                    className={`p-4 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-150/40 dark:border-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${accentGradient} text-white font-extrabold flex items-center justify-center shadow-sm overflow-hidden`}>
                        {student.photo ? (
                          <img src={student.photo} alt="P" className="w-full h-full object-cover" />
                        ) : (
                          student.firstName[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                          {student.firstName} {student.middleName} {student.lastName}
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                            student.role === 'programmer' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400' :
                            student.role === 'admin' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {student.role}
                          </span>
                          {student.chatAlias && (
                            <span className="text-[9px] font-bold text-teal-500 font-mono">
                              @{student.chatAlias}
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          {student.course} · {student.regNo} · Gender: {student.gender}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${student.countryCode.replace('+', '')}${student.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full hover:bg-emerald-100/50 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                      <a
                        href={`mailto:${student.email}`}
                        className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-full hover:bg-blue-100/50 transition-colors"
                        title="Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>

                      {isProg && student.regNo !== currentUser.regNo && (
                        confirmingDeleteRegNo === student.regNo ? (
                          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-lg border border-red-100 dark:border-red-900/40">
                            <button
                              onClick={() => {
                                onRemoveUser(student.regNo);
                                setConfirmingDeleteRegNo(null);
                              }}
                              className="px-1.5 py-0.5 text-[9px] font-black uppercase text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmingDeleteRegNo(null)}
                              className="px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingDeleteRegNo(student.regNo)}
                            className="p-2 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full hover:bg-red-100/50 transition-colors"
                            title="Remove User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'resets' && (
          <motion.div
            key="resets"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Reset request queue list */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Password Reset Requests
              </h3>

              {passwordResets.length === 0 ? (
                <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} text-center text-slate-400`}>
                  <div className="text-lg mb-2">🔑</div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Pending Reset Requests</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Once students submit request flags, they will queue here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {passwordResets.slice().reverse().map((reset) => {
                    const isResolved = reset.status === 'resolved';
                    const student = allUsers.find(u => u.regNo === reset.regNo);
                    return (
                      <div
                        key={reset.id}
                        className={`p-4 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800/40 ${radius} space-y-3`}
                      >
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1.5 font-mono">
                            {reset.name} ({reset.regNo})
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] uppercase ${
                            isResolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {reset.status}
                          </span>
                        </div>

                        {student && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Verified Registered Email: <span className="font-semibold text-slate-700 dark:text-slate-300">{reset.email}</span>
                          </div>
                        )}

                        {isResolved ? (
                          <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved password reset at {reset.resolvedTime}
                          </div>
                        ) : (
                          <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800/55 pt-3">
                            <div className="relative flex-1">
                              <input
                                type={showResetDraftPwd[reset.id] ? 'text' : 'password'}
                                value={resetPwdDrafts[reset.id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setResetPwdDrafts(prev => ({ ...prev, [reset.id]: val }));
                                }}
                                placeholder="Assign temporary login password..."
                                className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = !!showResetDraftPwd[reset.id];
                                  setShowResetDraftPwd(prev => ({ ...prev, [reset.id]: !cur }));
                                }}
                                className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                              >
                                {showResetDraftPwd[reset.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <button
                              onClick={() => handleResolveResetSubmit(reset.id)}
                              className={`px-4 py-2 text-xs font-bold text-white ${accentBg} hover:shadow-md ${radius} shrink-0`}
                            >
                              Resolve Request
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Direct force reset */}
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} space-y-4`}>
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Force Direct Password Override
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Select Student</label>
                  <select
                    value={directResetReg}
                    onChange={(e) => setDirectResetReg(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                  >
                    <option value="">Choose registered student...</option>
                    {allUsers.filter(u => u.role === 'user').map(u => (
                      <option key={u.regNo} value={u.regNo}>{u.firstName} {u.lastName} ({u.regNo})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">New Temporary Password</label>
                  <div className="relative">
                    <input
                      type={showDirectPwd ? 'text' : 'password'}
                      value={directResetPwd}
                      onChange={(e) => setDirectResetPwd(e.target.value)}
                      placeholder="Assign secure string override..."
                      className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDirectPwd(!showDirectPwd)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showDirectPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleDirectResetSubmit}
                  className={`px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 ${radius}`}
                >
                  Override Student Password
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'materials' && (
          <motion.div
            key="materials"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Upload form */}
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} space-y-4`}>
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-2">
                Upload New Educational Material
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Document Title</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. Anatomy Lecture Notes — Week 3"
                    className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs ${radius} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Course category tag</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs ${radius} focus:outline-none`}
                  >
                    {DOCUMENT_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="docMaterialFileBtn"
                    onChange={handleDocumentSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('docMaterialFileBtn')?.click()}
                    className={`px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold ${radius}`}
                  >
                    Select File Attachment
                  </button>
                  {docFile && (
                    <span className="text-[10px] font-mono text-emerald-500 max-w-[150px] truncate font-medium">
                      📎 {docFile.name}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleUploadSubmit}
                  className={`px-5 py-2 text-xs font-bold text-white bg-gradient-to-r ${accentGradient} ${radius} hover:shadow-md transition-all active:scale-98`}
                >
                  Publish Material
                </button>
              </div>
            </div>

            {/* Uploaded documents queue */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Published Materials List
              </h3>

              {documents.length === 0 ? (
                <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} text-center text-slate-400`}>
                  <div className="text-lg mb-2">📂</div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Materials Uploaded</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Once learning modules are published, they will list here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.slice().reverse().map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-4 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800/40 ${radius} flex items-center justify-between gap-4`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center shrink-0 text-lg">
                          📄
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate pr-2">
                            {doc.title}
                          </h4>
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                            {doc.category} · {doc.fileName} · Uploaded by {doc.uploadedBy}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={doc.dataUrl}
                          download={doc.fileName}
                          className="p-1.5 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-slate-600 rounded-full"
                          title="Download File"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => onDeleteDocument(doc.id)}
                          className="p-1.5 bg-red-50/50 hover:bg-red-100/60 text-red-500 rounded-full"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'news' && (
          <motion.div
            key="news"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* News Ticker editor */}
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} space-y-4`}>
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Edit Pulse crawling Ticker News
              </h3>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {config.siteName ? (
                  // Map in-memory ticker news list from state (synchronized globally in App.tsx)
                  allNewsItems(onRemoveNews)
                ) : null}
              </div>

              <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <input
                  type="text"
                  value={newsInputText}
                  onChange={(e) => setNewsInputText(e.target.value)}
                  placeholder="Drop a new ticker banner headline..."
                  className={`flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                />
                <button
                  onClick={handleAddNewsItem}
                  className={`px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 ${radius}`}
                >
                  Add Headline
                </button>
              </div>
            </div>

            {/* Global Broadcast announcements */}
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} space-y-3.5`}>
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Broadcast Global Announcement Alert
              </h3>
              <p className="text-[10px] text-slate-400">
                Pushes a push announcement badge into every registered student's bell icon. Broadcast triggers a real-time sound effect for active lobbies.
              </p>

              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={3}
                placeholder="Type global broadcast announcement details here..."
                className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs ${radius} focus:outline-none`}
              />

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSendAnnouncement}
                  className={`px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r ${accentGradient} hover:shadow-md ${radius} flex items-center gap-1.5`}
                >
                  Publish Announcement
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* PROGRAMMER ONLY: manage staff roles */}
        {activeTab === 'admins' && isProg && (
          <motion.div
            key="admins"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <h3 className="text-xs font-extrabold text-purple-400 uppercase tracking-widest">
              Staff Privileges & Governance
            </h3>

            <div className="space-y-3.5">
              {[...allUsers]
                .sort((a, b) => {
                  const roleOrder = { programmer: 1, admin: 2, user: 3 };
                  return roleOrder[a.role] - roleOrder[b.role];
                })
                .map((u) => {
                  const isCurrent = u.regNo === currentUser.regNo;
                return (
                  <div
                    key={u.regNo}
                    className={`p-4 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-150/40 dark:border-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
                  >
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        {u.firstName} {u.lastName}
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          u.role === 'programmer' ? 'bg-purple-100 text-purple-800' : u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {u.course} · Registry No. {u.regNo}
                      </p>
                    </div>

                    {!isCurrent && (
                      <div className="flex gap-2">
                        {u.role !== 'programmer' && (
                          <button
                            onClick={() => {
                              onUpdateUserRole(u.regNo, 'programmer');
                              showToast(`Elevated ${u.firstName} to System Programmer.`);
                            }}
                            className={`px-2.5 py-1 text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/20 rounded-md border border-purple-150`}
                          >
                            Make Programmer
                          </button>
                        )}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => {
                              onUpdateUserRole(u.regNo, 'admin');
                              showToast(`Elevated ${u.firstName} to Sector Admin.`);
                            }}
                            className={`px-2.5 py-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-150`}
                          >
                            Make Admin
                          </button>
                        )}
                        {u.role !== 'user' && (
                          <button
                            onClick={() => {
                              onUpdateUserRole(u.regNo, 'user');
                              showToast(`Demoted ${u.firstName} to student peer.`);
                            }}
                            className={`px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-slate-50 rounded-md border border-slate-200`}
                          >
                            Revoke Staff Access
                          </button>
                        )}

                        {confirmingDeleteRegNo === u.regNo ? (
                          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-md border border-red-150">
                            <button
                              onClick={() => {
                                onRemoveUser(u.regNo);
                                setConfirmingDeleteRegNo(null);
                              }}
                              className="px-1.5 py-0.5 text-[9px] font-black uppercase text-white bg-red-600 rounded"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmingDeleteRegNo(null)}
                              className="px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingDeleteRegNo(u.regNo)}
                            className="px-2.5 py-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-150 hover:bg-red-100/50"
                          >
                            Remove User
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* PROGRAMMER ONLY: Brand parameters overview */}
        {activeTab === 'identity' && isProg && (
          <motion.div
            key="identity"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} space-y-4`}>
              <h3 className="text-xs font-extrabold text-purple-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <Sliders className="w-4 h-4" /> System Governance Parameters
              </h3>

              <div className="space-y-4 text-xs font-medium">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Site Branding Title</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Title visible on sign-in, topbar, and footers.</div>
                  </div>
                  <input
                    type="text"
                    value={config.siteName}
                    onChange={(e) => onUpdateConfig({ siteName: e.target.value })}
                    className={`bg-slate-50 dark:bg-slate-950 p-2 text-xs border border-slate-200 dark:border-slate-800 ${radius} focus:outline-none w-1/2`}
                  />
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Allow Multiple Programmers</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Toggle whether multiple user nodes can acquire root developer keys.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.allowMultipleProgrammers}
                    onChange={(e) => onUpdateConfig({ allowMultipleProgrammers: e.target.checked })}
                    className="w-4.5 h-4.5 rounded text-purple-600 focus:ring-purple-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">System Maintenance Lock</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Restricts client interface access during core schema upgrades.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.maintenanceMode}
                    onChange={(e) => {
                      onUpdateConfig({ maintenanceMode: e.target.checked });
                      showToast(e.target.checked ? "System lockdown mode enabled." : "System lockdown lifted.");
                    }}
                    className="w-4.5 h-4.5 rounded text-purple-600 focus:ring-purple-400"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simulated News Ticker mapper
const allNewsItems = (onRemoveNews: (index: number) => void) => {
  // Access state ticker list in-memory through localStorage or fallback data array
  const cachedNews = JSON.parse(localStorage.getItem('muhas_pulse_news') || '[]');
  if (cachedNews.length === 0) return null;
  return cachedNews.map((item: string, idx: number) => (
    <div key={idx} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/40">
      <span className="text-xs truncate text-slate-700 dark:text-slate-300 font-medium">
        📢 {item}
      </span>
      <button
        onClick={() => {
          onRemoveNews(idx);
        }}
        className="text-red-500 p-1 hover:bg-red-50 hover:text-red-600 rounded-full shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  ));
};
