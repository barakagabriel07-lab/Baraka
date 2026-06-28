/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, BookOpen, Users, HelpCircle, ArrowRight, ClipboardList, 
  Send, Paperclip, MessageSquare, Check, Shield, Mail, PhoneCall 
} from 'lucide-react';
import { User as UserType, SystemConfig, Report } from '../types';
import { 
  getAccentColorClass, 
  getBorderRadiusClass, 
  getGlassmorphismClass 
} from './CommonUI';

interface UserDashboardProps {
  currentUser: UserType;
  config: SystemConfig;
  allUsers: UserType[];
  reports: Report[];
  onSubmitReport: (sector: 'health' | 'academic' | 'social', text: string, file: { name: string; dataUrl: string } | null) => void;
  onOpenAdminDirectory: () => void;
  showToast: (msg: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  config,
  allUsers,
  reports,
  onSubmitReport,
  onOpenAdminDirectory,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'health' | 'academic' | 'social' | 'reports'>('home');
  const [draftText, setDraftText] = useState('');
  const [draftFile, setDraftFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Styling hooks
  const radius = getBorderRadiusClass(config.borderRadius);
  const accentText = getAccentColorClass(config.colorAccent, 'text');
  const accentBg = getAccentColorClass(config.colorAccent, 'bg');
  const accentGradient = getAccentColorClass(config.colorAccent, 'from-to');

  // Filters for this student's reports
  const myReports = reports.filter(r => r.regNo === currentUser.regNo);
  const pendingReports = myReports.filter(r => r.status === 'pending');
  const answeredReports = myReports.filter(r => r.status === 'answered');

  // Count active students (non-admins)
  const totalStudents = allUsers.filter(u => u.role === 'user').length;
  // Answered percentage overall
  const overallReports = reports.length;
  const answeredPct = overallReports === 0 
    ? 100 
    : Math.round((reports.filter(r => r.status === 'answered').length / overallReports) * 100);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setDraftFile({
        name: file.name,
        dataUrl
      });
      showToast(`📎 Document attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (sector: 'health' | 'academic' | 'social') => {
    if (!draftText.trim()) {
      setFormError("⚠️ Unfinished Form! Detailed Issue Description is required to submit a support report.");
      showToast("❌ Detailed Issue Description is required.");
      return;
    }
    onSubmitReport(sector, draftText, draftFile);
    
    // Clear draft
    setDraftText('');
    setDraftFile(null);
    setFormError(null);
    setActiveTab('reports'); // Navigate to reports list
  };

  return (
    <div className="space-y-6">
      {/* Hello Board */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 font-sans tracking-tight leading-none">
            {config.customGreeting}, {currentUser.firstName}! 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1.5">
            {currentUser.course} · Registry No. {currentUser.regNo}
          </p>
        </div>

        {/* Small stats summary */}
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2.5 overflow-hidden">
            {allUsers.filter(u => u.photo).slice(0, 4).map((u, i) => (
              <img
                key={u.regNo}
                src={u.photo!}
                alt={u.firstName}
                className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-slate-100 dark:ring-slate-950 object-cover"
              />
            ))}
          </div>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 ml-1.5 uppercase tracking-wider">
            {totalStudents} registered peers
          </span>
        </div>
      </motion.div>

      {/* Stats Counter tiles */}
      <div className="grid grid-cols-3 gap-3.5">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-950/5 border border-blue-150/40 dark:border-blue-900/30 p-3.5 rounded-xl text-center"
        >
          <span className="block text-2xl font-black text-blue-600 dark:text-blue-400 font-sans">{totalStudents}</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Active Classmates</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-950/5 border border-emerald-150/40 dark:border-emerald-900/30 p-3.5 rounded-xl text-center"
        >
          <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400 font-sans">{answeredPct}%</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Report Resolution</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-950/5 border border-amber-150/40 dark:border-amber-900/30 p-3.5 rounded-xl text-center"
        >
          <span className="block text-2xl font-black text-amber-600 dark:text-amber-400 font-sans">{myReports.length}</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">My Logs</span>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {(['home', 'health', 'academic', 'social', 'reports'] as const).map((tab) => {
          const active = activeTab === tab;
          const label = tab === 'home' ? '🏠 Overview' :
                        tab === 'health' ? '🏥 Health Issue' :
                        tab === 'academic' ? '📚 Academics' :
                        tab === 'social' ? '🤝 Welfare' : 'My Reports';
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setDraftText('');
                setDraftFile(null);
                setFormError(null);
              }}
              className={`py-2 px-4 text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${radius} ${
                active
                  ? `bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md scale-102`
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {label}
              {tab === 'reports' && pendingReports.length > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse">
                  {pendingReports.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Viewport Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            {/* Illustrated Card */}
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} text-center space-y-4`}>
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className={`w-24 h-24 rounded-full bg-gradient-to-tr ${accentGradient} flex items-center justify-center text-white text-4xl shadow-xl`}
                >
                  📡
                </motion.div>
                <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full animate-ping" />
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  MUHAS PULSE Support Channels
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                  Submit secure reports to class coordinators and administrative heads regarding health status, academic support and welfare resources.
                </p>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => setActiveTab('health')}
                  className={`p-3 bg-red-50 dark:bg-red-950/20 hover:bg-red-100/60 dark:hover:bg-red-950/40 text-red-500 ${radius} text-center flex flex-col items-center transition-all`}
                >
                  <Heart className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Health Status</span>
                </button>

                <button
                  onClick={() => setActiveTab('academic')}
                  className={`p-3 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-950/40 text-blue-500 ${radius} text-center flex flex-col items-center transition-all`}
                >
                  <BookOpen className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Academics</span>
                </button>

                <button
                  onClick={() => setActiveTab('social')}
                  className={`p-3 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 text-amber-500 ${radius} text-center flex flex-col items-center transition-all`}
                >
                  <Users className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Social Welfare</span>
                </button>
              </div>
            </div>

            {/* Meet Admins card banner */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              onClick={onOpenAdminDirectory}
              className={`w-full p-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-900 dark:to-emerald-950/20 border border-teal-150/40 dark:border-slate-800/80 ${radius} text-left flex items-center justify-between gap-4 group transition-all`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg shadow">
                  🛡️
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Meet the MUHAS Pulse Admin Team
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    View active academic representatives, CRs and HODs details.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-500 transition-transform group-hover:translate-x-1" />
            </motion.button>

            {/* Accordion helper box */}
            <div className={`p-4 bg-slate-100/40 dark:bg-slate-900/30 border border-slate-150/50 dark:border-slate-800/40 ${radius} space-y-2.5`}>
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Operational guidelines
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 font-medium">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Your student identity data is auto-filled into logs for integrity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Admins receive instant chimes and secure dashboard highlights on submission.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Check <strong>My Reports</strong> to review response channels, direct chats, and temporary resets.</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {(['health', 'academic', 'social'] as const).includes(activeTab as any) && (
          <motion.div
            key="submit-form"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} space-y-4`}
          >
            <div className="flex items-center justify-between border-b border-slate-150/50 dark:border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base`}>
                  {activeTab === 'health' ? '🏥' : activeTab === 'academic' ? '📚' : '🤝'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                    {activeTab} log submission
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Auto-routed to active administration staff on submit
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata Readout */}
            <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Student Name</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.firstName} {currentUser.lastName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Registry Number</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{currentUser.regNo}</span>
              </div>
              <div className="col-span-2 border-t border-slate-150 dark:border-slate-800/40 pt-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Department / Course</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.course}</span>
              </div>
            </div>

            {/* Caution/Warning Banner if unfinished */}
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-start gap-2.5 shadow-sm"
              >
                <span className="text-rose-500 font-extrabold text-xs shrink-0 mt-0.5">⚠️ Caution:</span>
                <p className="text-xs text-rose-600 dark:text-rose-300 font-medium leading-relaxed">
                  {formError}
                </p>
              </motion.div>
            )}

            {/* Textarea */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                Detailed Issue Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={draftText}
                onChange={(e) => {
                  setDraftText(e.target.value);
                  if (e.target.value.trim()) {
                    setFormError(null);
                  }
                }}
                rows={4}
                placeholder={
                  activeTab === 'health' ? "Describe your symptoms, fever, medical emergency or clinic visit context..." :
                  activeTab === 'academic' ? "Describe concerns regarding study notes, missing grades, reference slides or seminar aids..." :
                  "Outline welfare issues, financial constraints, class representation requests or student union concerns..."
                }
                className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs ${radius} focus:outline-none focus:border-slate-400 dark:focus:border-slate-600`}
              />
            </div>

            {/* Attachment Draft */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="logAttachmentBtn"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('logAttachmentBtn')?.click()}
                  className={`px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all ${radius} flex items-center gap-1.5`}
                >
                  <Paperclip className="w-3.5 h-3.5" /> Attach Document
                </button>
                {draftFile && (
                  <span className="text-[10px] font-mono text-emerald-500 truncate max-w-[150px] font-medium">
                    📎 {draftFile.name}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleFormSubmit(activeTab as any)}
                className={`px-6 py-2 bg-gradient-to-r ${accentGradient} text-white font-bold text-xs transition-all active:scale-98 hover:shadow-md ${radius} flex items-center justify-center gap-1.5`}
              >
                <Send className="w-3.5 h-3.5" /> Submit Official Report
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div
            key="reports-list"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-3.5"
          >
            {myReports.length === 0 ? (
              <div className={`p-10 ${getGlassmorphismClass(config.glassmorphism)} ${radius} text-center text-slate-400`}>
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
                  📭
                </div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">No Submitted Reports Found</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  Once you file a welfare, medical or academic log, it will index here along with real-time status tracks.
                </p>
              </div>
            ) : (
              myReports.slice().reverse().map((report) => {
                const isAnswered = report.status === 'answered';
                return (
                  <motion.div
                    key={report.id}
                    layout
                    className={`p-4 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-150/40 dark:border-slate-800/40 space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono flex items-center gap-1.5">
                        {report.sector === 'health' ? '🏥 Health' : report.sector === 'academic' ? '📚 Academic' : '🤝 Social'}
                        <span className="text-slate-300 dark:text-slate-700 font-normal">·</span>
                        {report.time}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                        isAnswered ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {report.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed font-sans pr-1">
                      {report.text}
                    </p>

                    {report.attachmentName && (
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/50 px-2.5 py-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 rounded-md border border-slate-200/40 dark:border-slate-800/50">
                        📎 {report.attachmentName}
                      </div>
                    )}

                    {/* Admin response block */}
                    {isAnswered ? (
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-150/40 dark:border-emerald-900/20 space-y-2">
                        <div className="flex items-center justify-between text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" /> MUHAS administration reply
                          </span>
                          <span>{report.replyTime}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-medium">
                          {report.reply}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 py-1 px-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span>Log pending: Assigned to review desk coordinator...</span>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
