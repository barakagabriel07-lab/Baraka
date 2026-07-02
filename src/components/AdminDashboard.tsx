/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Settings, Palette, Type, Sliders, Sparkles, Terminal, 
  Trash2, Plus, Download, UserCheck, Shield, Key, Mail, MessageSquare, 
  Search, Eye, EyeOff, CheckCircle2, Volume2, Globe, FileSignature, Users, Heart, BookOpen,
  UserX, Award, DollarSign, Activity, FileText, Check, X, ShieldCheck, Layers, Landmark, Calendar
} from 'lucide-react';
import { User as UserType, SystemConfig, Report, PasswordReset, DocumentMaterial } from '../types';
import { 
  getAccentColorClass, 
  getBorderRadiusClass, 
  getGlassmorphismClass 
} from './CommonUI';
import { DOCUMENT_CATEGORIES } from '../data';
import { doc, updateDoc, deleteDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

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
  const [activeTab, setActiveTab] = useState<'home' | 'approvals' | 'students' | 'staff' | 'departments' | 'courses' | 'results' | 'announcements' | 'reports' | 'finances' | 'settings' | 'timetable'>('home');
  
  // Timetable Editor states
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'>('Mon');
  const defaultTimetable = {
    Mon: [
      { time: '08:00 AM - 10:00 AM', course: 'Systemic Pathology', venue: 'Lecture Hall 2', type: 'Lecture', instructor: 'Prof. E. Mshinda' },
      { time: '10:30 AM - 12:30 PM', course: 'Medical Biochemistry', venue: 'Lab B1', type: 'Practical', instructor: 'Dr. S. Lyamuya' }
    ],
    Tue: [
      { time: '09:00 AM - 11:00 AM', course: 'Human Anatomy I', venue: 'Lecture Hall 1', type: 'Lecture', instructor: 'Prof. J. Masau' },
      { time: '01:00 PM - 03:00 PM', course: 'Medical Physiology', venue: 'Lecture Hall 3', type: 'Lecture', instructor: 'Prof. K. Pallangyo' }
    ],
    Wed: [
      { time: '10:00 AM - 12:00 PM', course: 'Medical Microbiology', venue: 'Lab C2', type: 'Practical', instructor: 'Dr. L. Mboera' },
      { time: '02:00 PM - 04:00 PM', course: 'Human Anatomy I', venue: 'Dissection Room 4', type: 'Dissection', instructor: 'Prof. J. Masau' }
    ],
    Thu: [
      { time: '08:00 AM - 10:00 AM', course: 'Medical Biochemistry', venue: 'Lecture Hall 2', type: 'Lecture', instructor: 'Dr. S. Lyamuya' },
      { time: '11:00 AM - 01:00 PM', course: 'Systemic Pathology', venue: 'Lab B3', type: 'Practical', instructor: 'Prof. E. Mshinda' }
    ],
    Fri: [
      { time: '09:00 AM - 11:00 AM', course: 'Medical Physiology', venue: 'Lab A4', type: 'Practical', instructor: 'Prof. K. Pallangyo' },
      { time: '02:00 PM - 04:00 PM', course: 'Pharmacology & Therapeutics', venue: 'Lecture Hall 1', type: 'Seminar', instructor: 'Dr. R. Kisenge' }
    ]
  };

  const [weeklyTimetable, setWeeklyTimetable] = useState<{
    Mon: { time: string; course: string; venue: string; type: string; instructor: string }[];
    Tue: { time: string; course: string; venue: string; type: string; instructor: string }[];
    Wed: { time: string; course: string; venue: string; type: string; instructor: string }[];
    Thu: { time: string; course: string; venue: string; type: string; instructor: string }[];
    Fri: { time: string; course: string; venue: string; type: string; instructor: string }[];
  }>(defaultTimetable);

  // Sync timetable state live from firestore onSnapshot
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "timetable", "weekly"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.timetable) {
          setWeeklyTimetable(data.timetable);
        }
      } else {
        setDoc(doc(db, "timetable", "weekly"), { timetable: defaultTimetable }).catch(console.error);
      }
    });
    return () => unsub();
  }, []);

  const [slotTime, setSlotTime] = useState('');
  const [slotCourse, setSlotCourse] = useState('');
  const [slotVenue, setSlotVenue] = useState('');
  const [slotType, setSlotType] = useState('Lecture');
  const [slotInstructor, setSlotInstructor] = useState('');
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [rawJsonText, setRawJsonText] = useState('');
  const [showJsonOverrideModal, setShowJsonOverrideModal] = useState(false);

  // Search and selection queries
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmingDeleteRegNo, setConfirmingDeleteRegNo] = useState<string | null>(null);

  // Results uploader state
  const [selectedResultStudent, setSelectedResultStudent] = useState('');
  const [resultCourseId, setResultCourseId] = useState('PL201');
  const [resultGrade, setResultGrade] = useState('A');

  // Finances uploader state
  const [selectedFinanceStudent, setSelectedFinanceStudent] = useState('');
  const [financeDescription, setFinanceDescription] = useState('Semester Tuition Fees');
  const [financeAmount, setFinanceAmount] = useState('1200000');
  const [financeType, setFinanceType] = useState<'invoice' | 'payment'>('invoice');

  // Finances ledgers datasets (local tracking state + simulation)
  const [financials, setFinancials] = useState([
    { id: 'f-1', regNo: '2026-11-00201', description: 'Semester II Tuition Fee', amount: 1500000, type: 'invoice', date: '2026-06-15' },
    { id: 'f-2', regNo: '2026-11-00201', description: 'NHIF Health Insurance Payment', amount: 50000, type: 'payment', date: '2026-06-16' },
    { id: 'f-3', regNo: '2026-11-00302', description: 'Library Access Fee', amount: 30000, type: 'invoice', date: '2026-06-18' }
  ]);

  // Departments and courses state list
  const [departments, setDepartments] = useState([
    { id: 'ANAT', name: 'Anatomy & Histology', head: 'Prof. J. Masau', staffCount: 8 },
    { id: 'PATH', name: 'Pathology & Forensics', head: 'Prof. E. Mshinda', staffCount: 6 },
    { id: 'BIOC', name: 'Biochemistry & Molecular Biology', head: 'Dr. S. Lyamuya', staffCount: 5 },
    { id: 'PHYS', name: 'Physiology & Biophysics', head: 'Prof. K. Pallangyo', staffCount: 7 }
  ]);
  const [newDeptId, setNewDeptId] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHead, setNewDeptHead] = useState('');

  const [courses, setCourses] = useState([
    { id: 'HA101', name: 'Human Anatomy I', dept: 'ANAT', instructor: 'Prof. J. Masau', credits: 4 },
    { id: 'BC102', name: 'Medical Biochemistry', dept: 'BIOC', instructor: 'Dr. S. Lyamuya', credits: 4 },
    { id: 'PL201', name: 'Systemic Pathology', dept: 'PATH', instructor: 'Prof. E. Mshinda', credits: 3 },
    { id: 'MB202', name: 'Medical Microbiology', dept: 'PATH', instructor: 'Dr. L. Mboera', credits: 3 }
  ]);
  const [newCourseId, setNewCourseId] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDept, setNewCourseDept] = useState('ANAT');
  const [newCourseInstructor, setNewCourseInstructor] = useState('');

  // Announcement and news states
  const [announcementText, setAnnouncementText] = useState('');
  const [tickerText, setTickerText] = useState('');

  // Report resolution selected subtab
  const [selectedReportSector, setSelectedReportSector] = useState<'health' | 'academic' | 'social'>('health');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Document material states
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('General');
  const [docFile, setDocFile] = useState<{ name: string; dataUrl: string } | null>(null);

  // Style helper setups
  const radius = getBorderRadiusClass(config.borderRadius);
  const accentText = getAccentColorClass(config.colorAccent, 'text');
  const accentBg = getAccentColorClass(config.colorAccent, 'bg');
  const accentGradient = getAccentColorClass(config.colorAccent, 'from-to');

  const isProg = currentUser.role === 'programmer';

  // Sector Counts for unanswered reports
  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
  const healthCount = reports.filter(r => r.sector === 'health' && r.status === 'pending').length;
  const academicCount = reports.filter(r => r.sector === 'academic' && r.status === 'pending').length;
  const socialCount = reports.filter(r => r.sector === 'social' && r.status === 'pending').length;

  // Unapproved users list (registrations pending approval)
  const pendingApprovalsList = allUsers.filter(u => u.approved === false);

  // Registration approvals dispatcher
  const handleApproveRegistration = async (regNo: string) => {
    try {
      const userRef = doc(db, 'users', regNo.toLowerCase());
      await updateDoc(userRef, { approved: true });
      showToast(`✅ Approved student registration: ${regNo}`);
    } catch (err: any) {
      console.error(err);
      showToast('❌ Approval failed. Try again.');
    }
  };

  const handleRejectRegistration = async (regNo: string) => {
    try {
      const userRef = doc(db, 'users', regNo.toLowerCase());
      await deleteDoc(userRef);
      showToast(`❌ Rejected and deleted student registry node: ${regNo}`);
    } catch (err: any) {
      console.error(err);
      showToast('❌ Rejection failed. Try again.');
    }
  };

  // Staff promotion dispatcher
  const handleToggleStaffRole = async (regNo: string, currentRole: UserType['role']) => {
    const nextRole: UserType['role'] = currentRole === 'user' ? 'admin' : 'user';
    try {
      const userRef = doc(db, 'users', regNo.toLowerCase());
      await updateDoc(userRef, { role: nextRole });
      showToast(`🛡️ Updated user role: ${regNo} is now an ${nextRole}`);
    } catch (err: any) {
      console.error(err);
      showToast('❌ Role update failed.');
    }
  };

  // Report reply dispatcher
  const handleReplySubmit = (reportId: string) => {
    const reply = replyDrafts[reportId]?.trim();
    if (!reply) {
      showToast("Write a reply response first.");
      return;
    }
    onReplyToReport(reportId, reply);
    setReplyDrafts(prev => ({ ...prev, [reportId]: '' }));
    showToast("Reply submitted successfully to student inbox.");
  };

  // Document selection uploader
  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDocFile({
        name: file.name,
        dataUrl: ev.target?.result as string
      });
      showToast(`📎 Handout file selected: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = () => {
    if (!docTitle.trim() || !docFile) {
      showToast("Title and file are required to upload academic handouts.");
      return;
    }
    onUploadDocument(docTitle.trim(), docCategory, docFile.name, docFile.dataUrl);
    setDocTitle('');
    setDocFile(null);
    showToast("Learning resource uploaded and indexed to library.");
  };

  // Announcements and News Dispatcher
  const handlePublishAnnouncement = () => {
    if (!announcementText.trim()) {
      showToast("Announcement description is empty.");
      return;
    }
    onAddAnnouncement(announcementText.trim());
    setAnnouncementText('');
    showToast("🎉 Announcement sent. Device chimes active on Student Bells!");
  };

  const handlePublishTicker = () => {
    if (!tickerText.trim()) return;
    onAddNews(tickerText.trim());
    setTickerText('');
    showToast("📰 Pulse marquee ticker updated!");
  };

  // Upload Results Grade Dispatcher
  const handleUploadResultSubmit = () => {
    if (!selectedResultStudent) {
      showToast("Select a student to allocate grades to.");
      return;
    }
    showToast(`🏆 Result uploaded: Allocated Grade '${resultGrade}' for '${resultCourseId}' to ${selectedResultStudent}`);
    setSelectedResultStudent('');
  };

  // Ledger billing finances uploader
  const handleFinanceSubmit = () => {
    if (!selectedFinanceStudent) {
      showToast("Select a student registry for financial billing.");
      return;
    }
    const amtNum = parseFloat(financeAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      showToast("Provide a valid numeric billing amount.");
      return;
    }

    const newFin = {
      id: `f-${Date.now()}`,
      regNo: selectedFinanceStudent,
      description: financeDescription,
      amount: amtNum,
      type: financeType,
      date: new Date().toISOString().split('T')[0]
    };

    setFinancials(prev => [newFin, ...prev]);
    setSelectedFinanceStudent('');
    setFinanceDescription('Semester Tuition Fees');
    showToast(`💰 Financial transaction recorded: billed ${amtNum} TZS for ${selectedFinanceStudent}`);
  };

  // Add Department dispatcher
  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptId.trim() || !newDeptName.trim()) {
      showToast("Department code and name are required.");
      return;
    }
    const newDept = {
      id: newDeptId.toUpperCase(),
      name: newDeptName,
      head: newDeptHead || 'N/A',
      staffCount: 1
    };
    setDepartments(prev => [...prev, newDept]);
    setNewDeptId('');
    setNewDeptName('');
    setNewDeptHead('');
    showToast(`🏢 Department '${newDept.name}' created.`);
  };

  // Add Course dispatcher
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseId.trim() || !newCourseName.trim()) {
      showToast("Course code and title are required.");
      return;
    }
    const newCrs = {
      id: newCourseId.toUpperCase(),
      name: newCourseName,
      dept: newCourseDept,
      instructor: newCourseInstructor || 'N/A',
      credits: 3
    };
    setCourses(prev => [...prev, newCrs]);
    setNewCourseId('');
    setNewCourseName('');
    setNewCourseInstructor('');
    showToast(`📚 Course module '${newCrs.name}' indexed to registry.`);
  };

  return (
    <div className="space-y-6">
      {/* Admin dashboard header bar */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 font-sans tracking-tight">
              Control Workspace
            </h1>
            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${accentBg} text-white`}>
              {currentUser.role} Control
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            MUHAS Student Registry Security and Academic Deployment Hub
          </p>
        </div>
      </motion.div>

      {/* Metrics bento cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 ${radius} shadow-sm`}>
          <Users className="w-5 h-5 text-sky-500 mb-2" />
          <span className="block text-2xl font-black text-slate-800 dark:text-slate-200">
            {allUsers.filter(u => u.role === 'user').length}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Registered Students</span>
        </div>

        <div className={`p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 ${radius} shadow-sm`}>
          <UserCheck className="w-5 h-5 text-purple-500 mb-2" />
          <span className="block text-2xl font-black text-purple-500">
            {pendingApprovalsList.length}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pending Approvals</span>
        </div>

        <div className={`p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 ${radius} shadow-sm`}>
          <ShieldAlert className="w-5 h-5 text-red-500 mb-2" />
          <span className="block text-2xl font-black text-red-500">
            {pendingReportsCount}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Support Logs</span>
        </div>

        <div className={`p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 ${radius} shadow-sm`}>
          <BookOpen className="w-5 h-5 text-emerald-500 mb-2" />
          <span className="block text-2xl font-black text-emerald-500">
            {documents.length}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Syllabus Handouts</span>
        </div>
      </div>

      {/* 11 Functional Tabs List */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 border-b border-slate-200/40 dark:border-slate-800/20">
        {[
          { key: 'home', label: '🏠 Dashboard' },
          { key: 'timetable', label: '📅 Class Timetable' },
          { key: 'approvals', label: '✅ Approvals', count: pendingApprovalsList.length },
          { key: 'students', label: '👥 Student Base' },
          { key: 'staff', label: '🛡️ Manage Staff' },
          { key: 'departments', label: '🏢 Departments' },
          { key: 'courses', label: '📚 Course Hub' },
          { key: 'results', label: '🏆 Results' },
          { key: 'announcements', label: '🔔 Broadcasts' },
          { key: 'reports', label: '🏥 Desk Tickets', count: pendingReportsCount },
          { key: 'finances', label: '💰 Ledger accounts' },
          { key: 'settings', label: '⚙️ Brand Settings' }
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-3.5 text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${radius} ${
                active
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md scale-102'
                  : 'bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {tab.count && tab.count > 0 ? (
                <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse">
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Control Viewports */}
      <AnimatePresence mode="wait">

        {/* TAB 1: HOME WORKSPACE */}
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Quick Analytics charts (Simulated metrics dashboard) */}
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Academic System Analytics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-slate-500">
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Gender Distribution</span>
                  <div className="flex gap-4 items-center mt-2 font-mono font-extrabold">
                    <span className="text-blue-500">♂️ Male: 48%</span>
                    <span className="text-pink-500">♀️ Female: 52%</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Average Student GPA</span>
                  <span className="block text-xl font-black text-emerald-500 font-mono mt-1">4.08 / 5.0</span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Report Resolution Efficiency</span>
                  <span className="block text-xl font-black text-sky-500 font-mono mt-1">94.8% Completed</span>
                </div>
              </div>
            </div>

            {/* Quick Action Welcome Callout */}
            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-center max-w-lg mx-auto">
              <span className="text-2xl">🛡️</span>
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">MUHAS Administration Console Active</h3>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                Welcome back. Use this panel to authorize registrations, manage departments and curriculums, and input grades for MBBS clinical students.
              </p>
            </div>
          </motion.div>
        )}

        {/* TAB 2: REGISTRATION APPROVALS */}
        {activeTab === 'approvals' && (
          <motion.div
            key="approvals"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" /> Registrations Pending Approval ({pendingApprovalsList.length})
              </h2>
            </div>

            {pendingApprovalsList.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                🎉 Perfect. All registered student profiles have been approved and authorized!
              </div>
            ) : (
              <div className="space-y-3.5">
                {pendingApprovalsList.map((st) => (
                  <div key={st.regNo} className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">{st.firstName} {st.middleName} {st.lastName}</h3>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{st.course} · {st.regNo} · Email: {st.email}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRegistration(st.regNo)}
                        className={`px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold ${radius} transition-all flex items-center gap-1 shadow-sm`}
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectRegistration(st.regNo)}
                        className={`px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-extrabold ${radius} transition-all flex items-center gap-1 shadow-sm`}
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: STUDENT MANAGER */}
        {activeTab === 'students' && (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
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

            <div className="space-y-3.5">
              {allUsers
                .filter(u => {
                  const q = searchQuery.toLowerCase();
                  return u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.regNo.toLowerCase().includes(q);
                })
                .map((st) => (
                  <div key={st.regNo} className={`p-4 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-150/40 dark:border-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                        {st.firstName} {st.middleName} {st.lastName}
                        {st.approved === false && (
                          <span className="bg-red-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Pending Approval</span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{st.course} · ID: {st.regNo} · Tel: +{st.countryCode} {st.phone}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleStaffRole(st.regNo, st.role)}
                        className={`px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-[10px] font-bold ${radius}`}
                      >
                        {st.role === 'user' ? 'Promote Admin' : 'Demote Student'}
                      </button>

                      <button
                        onClick={() => {
                          if (!isProg && (st.role === 'programmer' || st.role === 'admin' || st.regNo.toLowerCase() === 'admin' || st.regNo.toLowerCase() === 'programmer')) {
                            showToast("❌ Privilege Block: Only System Programmers can delete administrators, staff, or demo system users.");
                            return;
                          }
                          if (confirm(`Are you sure you want to remove user ${st.firstName} ${st.lastName} (ID: ${st.regNo})?`)) {
                            onRemoveUser(st.regNo);
                            showToast(`❌ Removed user from registry: ${st.regNo}`);
                          }
                        }}
                        className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* TAB 4: STAFF DIRECTORY */}
        {activeTab === 'staff' && (
          <motion.div
            key="staff"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-500" /> MUHAS Administrative Staff Directory
              </h2>
            </div>

            <div className="space-y-3">
              {allUsers
                .filter(u => u.role === 'admin' || u.role === 'programmer')
                .map((staff) => (
                  <div key={staff.regNo} className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 rounded-xl flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200">{staff.firstName} {staff.lastName}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Role: {staff.role} · Email: {staff.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-black uppercase">
                        {staff.role === 'programmer' ? 'Programmer' : 'Admin Staff'}
                      </span>
                      {isProg && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove staff member ${staff.firstName} ${staff.lastName} (ID: ${staff.regNo})?`)) {
                              onRemoveUser(staff.regNo);
                              showToast(`❌ Removed staff member: ${staff.firstName} ${staff.lastName}`);
                            }
                          }}
                          className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded hover:bg-red-100"
                          title="Delete Staff Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* TAB 5: DEPARTMENTS EDITOR */}
        {activeTab === 'departments' && (
          <motion.div
            key="departments"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}>
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Configure University Departments</h3>

              <form onSubmit={handleAddDept} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newDeptId}
                  onChange={(e) => setNewDeptId(e.target.value)}
                  placeholder="ID (e.g. PHAR)"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none"
                />
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Name (e.g. Pharmacology)"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none"
                />
                <input
                  type="text"
                  value={newDeptHead}
                  onChange={(e) => setNewDeptHead(e.target.value)}
                  placeholder="Head Coordinator"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none"
                />
                <button type="submit" className={`col-span-1 sm:col-span-3 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold text-xs ${radius}`}>
                  Add Department Division
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {departments.map(dept => (
                  <div key={dept.id} className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                    <span className="text-[9px] font-mono font-bold text-sky-500">{dept.id}</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{dept.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Head: {dept.head} · Staff: {dept.staffCount}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 6: COURSE HUB MAPPER */}
        {activeTab === 'courses' && (
          <motion.div
            key="courses"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}>
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Manage Academic Course Catalog</h3>

              <form onSubmit={handleAddCourse} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  placeholder="Code (e.g. PM204)"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none"
                />
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="Course Title"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none"
                />
                <select
                  value={newCourseDept}
                  onChange={(e) => setNewCourseDept(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.id}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newCourseInstructor}
                  onChange={(e) => setNewCourseInstructor(e.target.value)}
                  placeholder="Lecturer"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none"
                />
                <button type="submit" className={`col-span-1 sm:col-span-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold text-xs ${radius}`}>
                  Register Syllabus Module
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {courses.map(crs => (
                  <div key={crs.id} className="p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                    <span className="text-[9px] font-mono font-bold text-sky-500 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded">{crs.id}</span>
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-2">{crs.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Instructor: {crs.instructor} · Credits: {crs.credits} Unit</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 7: UPLOAD RESULTS */}
        {activeTab === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" /> Student Grade & Marksheet Uploader
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <select
                value={selectedResultStudent}
                onChange={(e) => setSelectedResultStudent(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs rounded-xl focus:outline-none"
              >
                <option value="">-- Choose Student Registry --</option>
                {allUsers.filter(u => u.role === 'user').map(st => (
                  <option key={st.regNo} value={st.regNo}>{st.firstName} {st.lastName} ({st.regNo})</option>
                ))}
              </select>

              <select
                value={resultCourseId}
                onChange={(e) => setResultCourseId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs rounded-xl focus:outline-none"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                ))}
              </select>

              <select
                value={resultGrade}
                onChange={(e) => setResultGrade(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs rounded-xl focus:outline-none"
              >
                <option value="A">Grade A (5.0)</option>
                <option value="B+">Grade B+ (4.0)</option>
                <option value="B">Grade B (3.0)</option>
                <option value="C">Grade C (2.0)</option>
                <option value="D">Grade D (1.0)</option>
              </select>

              <button
                onClick={handleUploadResultSubmit}
                className={`col-span-1 sm:col-span-3 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-xs font-black ${radius}`}
              >
                Publish Grade Score
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 8: ANNOUNCEMENTS & TICKERS */}
        {activeTab === 'announcements' && (
          <motion.div
            key="announcements"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Poster announcement */}
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Publish Official Student Announcement</h3>
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={4}
                placeholder="Write message to send out directly to peer notification bells..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 p-3 text-xs focus:outline-none"
              />
              <button
                onClick={handlePublishAnnouncement}
                className={`w-full py-2 bg-sky-600 text-white text-xs font-extrabold ${radius}`}
              >
                Publish & Play Chime
              </button>
            </div>

            {/* Marquee News ticker */}
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Post to Scrolling Marquee Ticker</h3>
              <input
                type="text"
                value={tickerText}
                onChange={(e) => setTickerText(e.target.value)}
                placeholder="e.g. Supplementary registrations close this Friday at 16:00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 p-2.5 text-xs focus:outline-none"
              />
              <button
                onClick={handlePublishTicker}
                className={`w-full py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-xs font-extrabold ${radius}`}
              >
                Update Pulse Ticker
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 9: LOG DESK TICKETS */}
        {activeTab === 'reports' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            {/* Sector switcher */}
            <div className="flex gap-2">
              {(['health', 'academic', 'social'] as const).map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedReportSector(sec)}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg capitalize border ${
                    selectedReportSector === sec
                      ? 'bg-slate-950 border-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {sec} Support
                </button>
              ))}
            </div>

            {/* Reports listing */}
            <div className="space-y-3">
              {reports.filter(r => r.sector === selectedReportSector).length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs bg-slate-50/40 rounded-xl border border-slate-200/50">
                  No pending logs in this sector. Clear desk!
                </div>
              ) : (
                reports.filter(r => r.sector === selectedReportSector).slice().reverse().map((report) => {
                  const isAnswered = report.status === 'answered';
                  return (
                    <div key={report.id} className={`p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-xl space-y-3 shadow-sm`}>
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold uppercase">
                        <span>{report.name} ({report.regNo}) · {report.time}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          isAnswered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{report.text}</p>
                      
                      {isAnswered ? (
                        <div className="bg-emerald-50/50 p-2.5 rounded text-xs text-slate-600 border border-emerald-100">
                          <span className="block font-bold text-emerald-600 uppercase text-[9px] mb-1">My Response:</span>
                          {report.reply}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyDrafts[report.id] || ''}
                            onChange={(e) => setReplyDrafts(prev => ({ ...prev, [report.id]: e.target.value }))}
                            placeholder="Type a support response answer..."
                            className="flex-1 bg-slate-50 border border-slate-200 text-xs p-2 rounded focus:outline-none"
                          />
                          <button
                            onClick={() => handleReplySubmit(report.id)}
                            className={`px-3 py-1 bg-slate-950 text-white rounded text-xs font-bold`}
                          >
                            Reply
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 10: MANAGE FINANCES (INVOICING AND PAYMENTS) */}
        {activeTab === 'finances' && (
          <motion.div
            key="finances"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}>
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-500" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider">
                  Student Finance Ledgers & Invoicing Desk
                </h2>
              </div>

              {/* Financial Billing form */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <select
                  value={selectedFinanceStudent}
                  onChange={(e) => setSelectedFinanceStudent(e.target.value)}
                  className="bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl focus:outline-none"
                >
                  <option value="">-- Billed Student --</option>
                  {allUsers.filter(u => u.role === 'user').map(st => (
                    <option key={st.regNo} value={st.regNo}>{st.firstName} {st.lastName} ({st.regNo})</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={financeDescription}
                  onChange={(e) => setFinanceDescription(e.target.value)}
                  placeholder="Billing Description (e.g. Tuition Fee)"
                  className="bg-slate-50 border border-slate-200 p-2 text-xs rounded-xl focus:outline-none"
                />

                <input
                  type="number"
                  value={financeAmount}
                  onChange={(e) => setFinanceAmount(e.target.value)}
                  placeholder="Amount in TZS"
                  className="bg-slate-50 border border-slate-200 p-2 text-xs rounded-xl focus:outline-none"
                />

                <select
                  value={financeType}
                  onChange={(e) => setFinanceType(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 p-2 text-xs rounded-xl focus:outline-none"
                >
                  <option value="invoice">Post Invoice Billing</option>
                  <option value="payment">Post Payment Payment</option>
                </select>

                <button
                  onClick={handleFinanceSubmit}
                  className={`col-span-1 sm:col-span-4 py-2 bg-emerald-600 text-white text-xs font-black ${radius}`}
                >
                  Submit Financial Entry
                </button>
              </div>

              {/* Ledger transaction logs table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden pt-2">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b">
                      <th className="p-3">Student Registry</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {financials.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-sky-500">{tx.regNo}</td>
                        <td className="p-3">{tx.description}</td>
                        <td className="p-3 text-slate-400">{tx.date}</td>
                        <td className={`p-3 font-bold ${tx.type === 'invoice' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {tx.type === 'invoice' ? '-' : '+'}{tx.amount.toLocaleString()} TZS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 11: SETTINGS / BRAND CUSTOMIZER */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-6`}
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider">
                System Configurations & Brand Customs
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Site Name title</span>
                <input
                  type="text"
                  value={config.siteName}
                  onChange={(e) => onUpdateConfig({ siteName: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 p-2 text-xs rounded focus:outline-none"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Custom Welcome Message</span>
                <input
                  type="text"
                  value={config.customGreeting}
                  onChange={(e) => onUpdateConfig({ customGreeting: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 p-2 text-xs rounded focus:outline-none"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Accent Color Theme</span>
                <select
                  value={config.colorAccent}
                  onChange={(e) => onUpdateConfig({ colorAccent: e.target.value as any })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 p-2 text-xs rounded focus:outline-none"
                >
                  <option value="sky">Ocean Blue (Sky)</option>
                  <option value="emerald">Medic Green (Emerald)</option>
                  <option value="violet">Royal Violet (Violet)</option>
                  <option value="rose">Doctor Rose (Rose)</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">UI Border Corners</span>
                <select
                  value={config.borderRadius}
                  onChange={(e) => onUpdateConfig({ borderRadius: e.target.value as any })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 p-2 text-xs rounded focus:outline-none"
                >
                  <option value="square">Minimalist Square</option>
                  <option value="soft">Elegant Soft (Medium)</option>
                  <option value="curvy">Organic Curvy (Rounded)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 12: CLASS TIMETABLE MANAGER */}
        {activeTab === 'timetable' && (
          <motion.div
            key="timetable"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-6`}
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider">
                  Class Timetable Registry
                </h2>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Editable by Staff & Programmers
              </span>
            </div>

            {/* Day Selector */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const).map((day) => (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedTimetableDay(day);
                    setEditingSlotIndex(null);
                  }}
                  className={`px-4 py-2 text-xs font-bold ${radius} transition-all ${
                    selectedTimetableDay === day
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {day === 'Mon' ? 'Monday' : day === 'Tue' ? 'Tuesday' : day === 'Wed' ? 'Wednesday' : day === 'Thu' ? 'Thursday' : 'Friday'}
                </button>
              ))}
            </div>

            {/* Current Day Schedule & Add/Edit Slot */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs font-medium">
              {/* Add/Edit Slot Form */}
              <div className="lg:col-span-5 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl space-y-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  {editingSlotIndex !== null ? '✏️ Edit Schedule Slot' : '➕ Add New Class Slot'}
                </h3>

                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Time Slot</span>
                  <input
                    type="text"
                    placeholder="e.g. 08:00 AM - 10:00 AM"
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Course / Unit</span>
                  <input
                    type="text"
                    placeholder="e.g. Systemic Pathology"
                    value={slotCourse}
                    onChange={(e) => setSlotCourse(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Venue / Lecture Hall</span>
                  <input
                    type="text"
                    placeholder="e.g. Lecture Hall 2"
                    value={slotVenue}
                    onChange={(e) => setSlotVenue(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Slot Type</span>
                    <select
                      value={slotType}
                      onChange={(e) => setSlotType(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none"
                    >
                      <option value="Lecture">Lecture</option>
                      <option value="Practical">Practical</option>
                      <option value="Dissection">Dissection</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Tutorial">Tutorial</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Instructor</span>
                    <input
                      type="text"
                      placeholder="e.g. Prof. E. Mshinda"
                      value={slotInstructor}
                      onChange={(e) => setSlotInstructor(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={async () => {
                      if (!slotTime || !slotCourse || !slotVenue) {
                        showToast('Please specify slot time, course name, and venue.');
                        return;
                      }
                      const updated = { ...weeklyTimetable };
                      const newSlot = {
                        time: slotTime,
                        course: slotCourse,
                        venue: slotVenue,
                        type: slotType,
                        instructor: slotInstructor || 'Faculty Staff'
                      };

                      if (editingSlotIndex !== null) {
                        updated[selectedTimetableDay][editingSlotIndex] = newSlot;
                      } else {
                        updated[selectedTimetableDay] = [...(updated[selectedTimetableDay] || []), newSlot];
                      }

                      try {
                        await setDoc(doc(db, "timetable", "weekly"), { timetable: updated });
                        showToast('Timetable updated successfully.');
                        setSlotTime('');
                        setSlotCourse('');
                        setSlotVenue('');
                        setSlotInstructor('');
                        setEditingSlotIndex(null);
                      } catch (err: any) {
                        showToast(`Failed to update timetable: ${err.message}`);
                      }
                    }}
                    className={`flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black ${radius}`}
                  >
                    {editingSlotIndex !== null ? 'Apply Changes' : 'Append Slot'}
                  </button>
                  {editingSlotIndex !== null && (
                    <button
                      onClick={() => {
                        setSlotTime('');
                        setSlotCourse('');
                        setSlotVenue('');
                        setSlotInstructor('');
                        setEditingSlotIndex(null);
                      }}
                      className={`px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold ${radius}`}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* View Schedule Slots */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    {selectedTimetableDay} Schedule
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {(weeklyTimetable[selectedTimetableDay] || []).length} active slots
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {(weeklyTimetable[selectedTimetableDay] || []).length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-mono">
                      No lecture sessions scheduled for this day.
                    </div>
                  ) : (
                    (weeklyTimetable[selectedTimetableDay] || []).map((slot, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {slot.course}
                            </span>
                            <span className="px-1.5 py-0.5 text-[8px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded">
                              {slot.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            ⏳ {slot.time} | 🏫 {slot.venue}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            👨‍🏫 {slot.instructor}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setSlotTime(slot.time);
                              setSlotCourse(slot.course);
                              setSlotVenue(slot.venue);
                              setSlotType(slot.type);
                              setSlotInstructor(slot.instructor);
                              setEditingSlotIndex(idx);
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={async () => {
                              const updated = { ...weeklyTimetable };
                              updated[selectedTimetableDay] = updated[selectedTimetableDay].filter((_, i) => i !== idx);
                              try {
                                await setDoc(doc(db, "timetable", "weekly"), { timetable: updated });
                                showToast('Session slot removed.');
                              } catch (err: any) {
                                showToast(`Failed to delete slot: ${err.message}`);
                              }
                            }}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Greater Programmer Controls */}
                {currentUser.role === 'programmer' && (
                  <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-1">
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                        [SYSTEM PROGRAMMER DIRECT ACTION CONTROLS]
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={async () => {
                          if (confirm('Are you absolutely sure you want to reset the timetable to factory standard defaults?')) {
                            try {
                              await setDoc(doc(db, "timetable", "weekly"), { timetable: defaultTimetable });
                              showToast('System Timetable factory-reset successfully.');
                            } catch (err: any) {
                              showToast(`Failed to reset: ${err.message}`);
                            }
                          }
                        }}
                        className={`px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase ${radius}`}
                      >
                        ⚠️ Factory Reset Timetable
                      </button>

                      <button
                        onClick={() => {
                          setRawJsonText(JSON.stringify(weeklyTimetable, null, 2));
                          setShowJsonOverrideModal(true);
                        }}
                        className={`px-3 py-1.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30 ${radius}`}
                      >
                        💻 Direct JSON Edit Override
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Direct JSON Override Modal */}
            {showJsonOverrideModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`bg-slate-900 border border-slate-800 max-w-2xl w-full p-6 ${radius} space-y-4 shadow-2xl text-slate-100`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 font-mono">
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-black text-emerald-400">TIMETABLE_JSON_OVERRIDE.bin</span>
                    </div>
                    <button
                      onClick={() => setShowJsonOverrideModal(false)}
                      className="text-slate-400 hover:text-white font-black"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 font-medium">
                    You are editing the raw JSON model. Make sure to adhere to the five-day weekday schema keys: <code className="text-amber-400">{"{\"Mon\": [], \"Tue\": [], ...}"}</code>. Invalid JSON will be rejected by the validation parser.
                  </p>

                  <textarea
                    value={rawJsonText}
                    onChange={(e) => setRawJsonText(e.target.value)}
                    rows={12}
                    className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />

                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setShowJsonOverrideModal(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded"
                    >
                      Close Terminal
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const parsed = JSON.parse(rawJsonText);
                          // Basic structure validation
                          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                          for (const d of days) {
                            if (parsed[d] && !Array.isArray(parsed[d])) {
                              throw new Error(`Day ${d} must be an array of sessions.`);
                            }
                          }
                          await setDoc(doc(db, "timetable", "weekly"), { timetable: parsed });
                          showToast('Raw JSON override successfully injected to Firestore!');
                          setShowJsonOverrideModal(false);
                        } catch (err: any) {
                          alert(`JSON Validation Error: ${err.message}`);
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded"
                    >
                      Apply Raw Injection
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
