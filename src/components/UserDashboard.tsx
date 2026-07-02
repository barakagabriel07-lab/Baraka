/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, BookOpen, Users, HelpCircle, ArrowRight, ClipboardList, 
  Send, Paperclip, MessageSquare, Check, Shield, Mail, PhoneCall, Download,
  User, Calendar, Award, MessageCircle, BellRing, FileText, Sparkles, CheckCircle2,
  Trash2, Upload, AlertCircle, Edit3, Save, Star
} from 'lucide-react';
import { User as UserType, SystemConfig, Report, DocumentMaterial } from '../types';
import { 
  getAccentColorClass, 
  getBorderRadiusClass, 
  getGlassmorphismClass 
} from './CommonUI';
import { doc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface UserDashboardProps {
  currentUser: UserType;
  config: SystemConfig;
  allUsers: UserType[];
  reports: Report[];
  onSubmitReport: (sector: 'health' | 'academic' | 'social', text: string, file: { name: string; dataUrl: string } | null) => void;
  onOpenAdminDirectory: () => void;
  showToast: (msg: string) => void;
  onOpenChat?: () => void;
  onOpenMaterials?: () => void;
  onOpenNotifications?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  config,
  allUsers,
  reports,
  onSubmitReport,
  onOpenAdminDirectory,
  showToast,
  onOpenChat,
  onOpenMaterials,
  onOpenNotifications
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'courses' | 'timetable' | 'chat' | 'health' | 'academic' | 'social'>('home');
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileAlias, setProfileAlias] = useState(currentUser.chatAlias || '');
  const [profilePhoto, setProfilePhoto] = useState(currentUser.photo || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Courses state
  const [enrolledCourses, setEnrolledCourses] = useState([
    { id: 'HA101', name: 'Human Anatomy I', credits: 4, status: 'Completed', grade: 'A', instructor: 'Prof. J. Masau' },
    { id: 'BC102', name: 'Medical Biochemistry', credits: 4, status: 'Completed', grade: 'A-', instructor: 'Dr. S. Lyamuya' },
    { id: 'PL201', name: 'Systemic Pathology', credits: 3, status: 'Active', grade: 'Pending', instructor: 'Prof. E. Mshinda' },
    { id: 'MB202', name: 'Medical Microbiology', credits: 3, status: 'Active', grade: 'Pending', instructor: 'Dr. L. Mboera' },
    { id: 'PH203', name: 'Medical Physiology', credits: 4, status: 'Active', grade: 'Pending', instructor: 'Prof. K. Pallangyo' },
    { id: 'PM204', name: 'Pharmacology & Therapeutics', credits: 3, status: 'Active', grade: 'Pending', instructor: 'Dr. R. Kisenge' }
  ]);
  const [showCourseRequest, setShowCourseRequest] = useState(false);
  const [courseRequestName, setCourseRequestName] = useState('');

  // Selected Timetable Day
  const [selectedDay, setSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'>('Mon');

  // Timetable schedule dataset state
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

  // Health Form states
  const [healthRegNo, setHealthRegNo] = useState(currentUser.regNo || '');
  const [healthEmail, setHealthEmail] = useState(currentUser.email || '');
  const [healthPhone, setHealthPhone] = useState(currentUser.phone || '');
  const [healthDescription, setHealthDescription] = useState('');
  const [healthFile, setHealthFile] = useState<{ name: string; dataUrl: string } | null>(null);

  // Academic Form states
  const [academicStep, setAcademicStep] = useState(1);
  const [academicRegNo, setAcademicRegNo] = useState(currentUser.regNo || '');
  const [academicEmail, setAcademicEmail] = useState(currentUser.email || '');
  const [academicPhone, setAcademicPhone] = useState(currentUser.phone || '');
  const [academicCourse, setAcademicCourse] = useState('Human Anatomy I');
  const [academicYear, setAcademicYear] = useState('Year 1');
  const [academicDescription, setAcademicDescription] = useState('');

  // Social Form state
  const [socialDescription, setSocialDescription] = useState('');

  // Styling hooks
  const radius = getBorderRadiusClass(config.borderRadius);
  const accentText = getAccentColorClass(config.colorAccent, 'text');
  const accentBg = getAccentColorClass(config.colorAccent, 'bg');
  const accentGradient = getAccentColorClass(config.colorAccent, 'from-to');

  // Filters for this student's reports
  const myReports = reports.filter(r => r.regNo === currentUser.regNo);
  const pendingReports = myReports.filter(r => r.status === 'pending');

  const totalStudents = allUsers.filter(u => u.role === 'user').length;

  // Handle Profile Update
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const userRef = doc(db, 'users', currentUser.regNo.toLowerCase());
      await updateDoc(userRef, {
        phone: profilePhone,
        chatAlias: profileAlias || currentUser.firstName,
        photo: profilePhoto || null
      });
      setIsEditingProfile(false);
      showToast('🎉 Student profile updated successfully in cloud registry!');
    } catch (err: any) {
      console.error('Failed to update profile', err);
      showToast('❌ Profile update failed. Please check connection.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleHealthFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setHealthFile({
        name: file.name,
        dataUrl
      });
      showToast(`📎 Attachment uploaded: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleHealthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthRegNo.trim() || !healthEmail.trim() || !healthPhone.trim() || !healthDescription.trim()) {
      showToast("❌ Please fill in all fields before submitting.");
      return;
    }
    const compiledText = `**Registration No:** ${healthRegNo}\n**Email:** ${healthEmail}\n**Registered Phone:** ${healthPhone}\n\n**Issue Description:**\n${healthDescription}`;
    onSubmitReport('health', compiledText, healthFile);
    setHealthDescription('');
    setHealthFile(null);
    showToast("🏥 Health report submitted and logged successfully!");
  };

  const handleAcademicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!academicRegNo.trim() || !academicEmail.trim() || !academicPhone.trim() || !academicDescription.trim()) {
      showToast("❌ Please complete all steps and fields before submitting.");
      return;
    }
    const compiledText = `**Registration No:** ${academicRegNo}\n**Email:** ${academicEmail}\n**Registered Phone:** ${academicPhone}\n**Course Name:** ${academicCourse}\n**Year level:** ${academicYear}\n\n**Academic Concern:**\n${academicDescription}`;
    onSubmitReport('academic', compiledText, null);
    setAcademicDescription('');
    setAcademicStep(1);
    showToast("📚 Academic report submitted and logged successfully!");
  };

  const handleSocialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialDescription.trim()) {
      showToast("❌ Please describe your social concern before submitting.");
      return;
    }
    const compiledText = `**Social Concern Description:**\n${socialDescription}`;
    onSubmitReport('social', compiledText, null);
    setSocialDescription('');
    showToast("🤝 Social report submitted and logged successfully!");
  };

  const handleCourseRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseRequestName.trim()) return;
    showToast(`📝 Request to enroll in '${courseRequestName}' sent to academic registry.`);
    setCourseRequestName('');
    setShowCourseRequest(false);
  };

  return (
    <div className="space-y-6">
      {/* Hello Board / Top Navigation Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-4"
      >
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 font-sans tracking-tight">
            {config.customGreeting}, {currentUser.firstName}! 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            {currentUser.course} · Student Node ID: <span className="font-bold underline text-sky-500">{currentUser.regNo}</span>
          </p>
        </div>

        {/* Small stats summary and active avatar group */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 overflow-hidden">
            {allUsers.filter(u => u.photo).slice(0, 4).map((u) => (
              <img
                key={u.regNo}
                src={u.photo!}
                alt={u.firstName}
                className="inline-block h-7 w-7 rounded-full ring-2 ring-slate-100 dark:ring-slate-950 object-cover"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {totalStudents} registered peers online
          </span>
        </div>
      </motion.div>

      {/* 8 Capability Navigation Tabs List */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 border-b border-slate-200/40 dark:border-slate-800/20">
        {[
          { key: 'home', label: '🏠 Home' },
          { key: 'health', label: '🏥 Health Bar' },
          { key: 'academic', label: '📚 Academic Bar' },
          { key: 'social', label: '🤝 Social Bar' },
          { key: 'profile', label: '👤 Profile' },
          { key: 'courses', label: '📚 Courses' },
          { key: 'timetable', label: '📅 Timetable' },
          { key: 'chat', label: '💬 Campus Chat' }
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'chat' && onOpenChat) {
                  onOpenChat();
                } else {
                  setActiveTab(tab.key as any);
                }
              }}
              className={`py-2 px-3.5 text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${radius} ${
                active
                  ? `bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md scale-102`
                  : 'bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
              {tab.key === 'health' && reports.filter(r => r.regNo === currentUser.regNo && r.sector === 'health' && r.status === 'pending').length > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse">
                  {reports.filter(r => r.regNo === currentUser.regNo && r.sector === 'health' && r.status === 'pending').length}
                </span>
              )}
              {tab.key === 'academic' && reports.filter(r => r.regNo === currentUser.regNo && r.sector === 'academic' && r.status === 'pending').length > 0 && (
                <span className="bg-sky-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse">
                  {reports.filter(r => r.regNo === currentUser.regNo && r.sector === 'academic' && r.status === 'pending').length}
                </span>
              )}
              {tab.key === 'social' && reports.filter(r => r.regNo === currentUser.regNo && r.sector === 'social' && r.status === 'pending').length > 0 && (
                <span className="bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse">
                  {reports.filter(r => r.regNo === currentUser.regNo && r.sector === 'social' && r.status === 'pending').length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Viewports */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: HOME OVERVIEW */}
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Bento Grid Stats Card Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-950/5 border border-blue-100 dark:border-blue-900/30 ${radius} shadow-sm`}>
                <BookOpen className="w-5 h-5 text-blue-500 mb-2" />
                <span className="block text-2xl font-black text-blue-600 dark:text-blue-400">6</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Registered Courses</span>
              </div>

              <div className={`p-4 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/20 dark:to-rose-950/5 border border-rose-100 dark:border-rose-900/30 ${radius} shadow-sm`}>
                <Heart className="w-5 h-5 text-rose-500 mb-2" />
                <span className="block text-2xl font-black text-rose-600 dark:text-rose-400">
                  {myReports.filter(r => r.sector === 'health').length} Logs
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Health Bar Reports</span>
              </div>

              <div className={`p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-950/5 border border-amber-100 dark:border-amber-900/30 ${radius} shadow-sm`}>
                <Users className="w-5 h-5 text-amber-500 mb-2" />
                <span className="block text-2xl font-black text-amber-600 dark:text-amber-400">
                  {myReports.filter(r => r.sector === 'academic' || r.sector === 'social').length} Logs
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Academic & Social</span>
              </div>

              <div className={`p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-950/5 border border-emerald-100 dark:border-emerald-900/30 ${radius} shadow-sm`}>
                <Calendar className="w-5 h-5 text-emerald-500 mb-2" />
                <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">2 Lectures</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Scheduled Today</span>
              </div>
            </div>

            {/* Quick Actions & Welcome Hero */}
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow`}>
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className={`w-20 h-20 rounded-full bg-gradient-to-tr ${accentGradient} flex items-center justify-center text-white text-3xl shadow-lg`}
                >
                  🏫
                </motion.div>
                <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-green-400 rounded-full animate-ping" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  MUHAS PULSE Medical Student Portal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Welcome to your central digital campus node. Connect with coordinators, view class schedules, and file direct Health, Academic, and Social reports securely.
                </p>
              </div>
            </div>

            {/* Meet the Admin Directory Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              onClick={onOpenAdminDirectory}
              className={`w-full p-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-900 dark:to-emerald-950/20 border border-teal-150/40 dark:border-slate-800/80 ${radius} text-left flex items-center justify-between gap-4 group transition-all shadow-sm`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center text-base shadow">
                  🛡️
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Meet the MUHAS Administration Team
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    View list of university coordinators, staff, class representatives, and contact emails.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-500 transition-transform group-hover:translate-x-1" />
            </motion.button>

            {/* Active Portal Members & Staff (Excluding programmer) */}
            <div className={`p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800/50 ${radius} space-y-3 shadow-sm`}>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/40 dark:border-slate-800/20">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Active Portal Members & Staff
                  </h4>
                </div>
                <span className="text-[9px] font-bold text-emerald-500 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Now
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {allUsers
                  .filter(u => u.role !== 'programmer')
                  .map((u) => (
                    <div key={u.regNo} className="p-2 bg-white dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center gap-2">
                      <div className="relative w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xs overflow-hidden shrink-0">
                        {u.photo ? (
                          <img src={u.photo} alt={u.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-950" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate">
                            {u.firstName} {u.lastName}
                          </span>
                          {u.role === 'admin' && (
                            <span className="text-[8px] font-extrabold uppercase px-1 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 rounded">
                              Staff
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono truncate">
                          {u.role === 'admin' ? (u.adminRole || 'Administrator') : u.regNo}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: VIEW PROFILE */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 space-y-6 shadow`}
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-sky-500" /> Student Profile Registry
              </h2>
              <button
                onClick={() => {
                  if (isEditingProfile) {
                    handleSaveProfile();
                  } else {
                    setIsEditingProfile(true);
                  }
                }}
                disabled={savingProfile}
                className={`px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold ${radius} transition-all flex items-center gap-1.5`}
              >
                {savingProfile ? (
                  'Saving...'
                ) : isEditingProfile ? (
                  <>
                    <Save className="w-3.5 h-3.5 text-green-500" /> Save changes
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5 text-sky-500" /> Edit Profile
                  </>
                )}
              </button>
            </div>

            {/* Profile Detail Layout */}
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative group">
                <div className={`w-28 h-28 rounded-full bg-gradient-to-tr ${accentGradient} flex items-center justify-center font-bold text-3xl text-white shadow-lg overflow-hidden border-2 border-slate-200/50 dark:border-slate-800/50`}>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Student" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    currentUser.firstName[0].toUpperCase()
                  )}
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs w-full">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Registry Full Name</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {currentUser.firstName} {currentUser.middleName} {currentUser.lastName}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Registry Number (ID)</span>
                  <span className="font-mono font-extrabold text-sky-500 text-xs mt-0.5 block">
                    {currentUser.regNo}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Enrolled Course / Department</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {currentUser.course}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Registered Email</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {currentUser.email}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Contact Phone Number</span>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 text-xs rounded mt-1 font-bold focus:outline-none"
                    />
                  ) : (
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                      +{currentUser.countryCode} {profilePhone || 'N/A'}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Chatroom Avatar Nickname</span>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileAlias}
                      onChange={(e) => setProfileAlias(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 text-xs rounded mt-1 font-bold focus:outline-none"
                    />
                  ) : (
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                      {profileAlias || currentUser.firstName}
                    </span>
                  )}
                </div>

                {isEditingProfile && (
                  <div className="col-span-1 sm:col-span-2 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Profile Photo URL</span>
                    <input
                      type="text"
                      value={profilePhoto}
                      onChange={(e) => setProfilePhoto(e.target.value)}
                      placeholder="Paste image web link (https://...)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 text-xs rounded mt-1 font-mono focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: COURSES */}
        {activeTab === 'courses' && (
          <motion.div
            key="courses"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-500" /> Academic Enrolled Courses
                </h2>
                <button
                  onClick={() => setShowCourseRequest(!showCourseRequest)}
                  className={`px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold ${radius} transition-all`}
                >
                  Request Elective Module
                </button>
              </div>

              {showCourseRequest && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleCourseRequest}
                  className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40 space-y-3"
                >
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Course Title / Subject ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={courseRequestName}
                      onChange={(e) => setCourseRequestName(e.target.value)}
                      placeholder="e.g. MC301 - Medical Parasitology"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded focus:outline-none"
                    />
                    <button type="submit" className={`px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold ${radius}`}>
                      Send Request
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Course Catalog Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrolledCourses.map((course) => (
                  <div key={course.id} className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/40 dark:border-slate-800/40 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-extrabold text-sky-500 font-mono">{course.id}</span>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">{course.name}</h3>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                        course.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                      }`}>
                        {course.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Credits: <strong className="text-slate-600 dark:text-slate-300">{course.credits} Unit</strong></span>
                      <span>Instructor: <strong className="text-slate-600 dark:text-slate-300">{course.instructor}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: TIMETABLE */}
        {activeTab === 'timetable' && (
          <motion.div
            key="timetable"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-500" /> Class Lecture & Lab Timetable
              </h2>
            </div>

            {/* Day Selector Buttons */}
            <div className="flex gap-2">
              {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const).map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                    selectedDay === day
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-black'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Day Schedule timeline list */}
            <div className="space-y-3.5 pt-2">
              {weeklyTimetable[selectedDay].map((slot, index) => (
                <div key={index} className="p-4 bg-slate-50/60 dark:bg-slate-900/30 border-l-4 border-sky-500 rounded-r-xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-extrabold text-sky-500 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded">
                      {slot.time}
                    </span>
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-2">{slot.course}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{slot.instructor}</p>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    <span className="block font-bold text-slate-600 dark:text-slate-300">{slot.venue}</span>
                    <span className="inline-block mt-1 font-extrabold uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {slot.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 5: HEALTH BAR */}
        {activeTab === 'health' && (
          <motion.div
            key="health"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-6`}>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 animate-pulse" /> Official Health Support Desk
                </h2>
              </div>

              <form onSubmit={handleHealthSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Registration No.</label>
                    <input
                      type="text"
                      disabled
                      value={healthRegNo}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-lg cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Registered Email</label>
                    <input
                      type="email"
                      value={healthEmail}
                      onChange={(e) => setHealthEmail(e.target.value)}
                      placeholder="Enter registered email"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={healthPhone}
                      onChange={(e) => setHealthPhone(e.target.value)}
                      placeholder="Enter active phone number"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Detailed Description of Health Issue</label>
                  <textarea
                    rows={4}
                    value={healthDescription}
                    onChange={(e) => setHealthDescription(e.target.value)}
                    placeholder="Describe your health situation, symptoms, or requested medical leave..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="border border-dashed border-slate-200 dark:border-slate-800 p-4 rounded-xl text-center">
                  <input
                    type="file"
                    id="health-file-upload"
                    className="hidden"
                    onChange={handleHealthFileChange}
                    accept="image/*,application/pdf"
                  />
                  <label
                    htmlFor="health-file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-bold">Attach Supporting Document (Image or PDF)</span>
                    <span className="text-[10px] text-slate-400">Optional medical certificates or reports</span>
                  </label>
                  {healthFile && (
                    <div className="mt-3 text-xs bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 py-1.5 px-3 rounded-lg inline-flex items-center gap-2">
                      <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{healthFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setHealthFile(null)}
                        className="text-[10px] text-red-500 hover:underline font-extrabold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className={`py-2 px-5 text-xs font-black text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md flex items-center gap-1.5 ${radius} transition-all`}
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Health Report
                  </button>
                </div>
              </form>
            </div>

            {/* Health Logs List */}
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}>
              <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide">
                Your Health Support History
              </h3>
              {myReports.filter(r => r.sector === 'health').length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No health reports filed yet.</p>
              ) : (
                <div className="space-y-3">
                  {myReports.filter(r => r.sector === 'health').map((rep) => (
                    <div key={rep.id} className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 rounded-xl space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{rep.time}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          rep.status === 'pending'
                            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 border border-rose-100/50'
                            : 'bg-green-50 dark:bg-green-950/20 text-green-500 border border-green-100/50'
                        }`}>
                          {rep.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-white dark:bg-slate-950 p-2.5 rounded border border-slate-100 dark:border-slate-900">
                        {rep.text}
                      </div>
                      {rep.attachmentName && (
                        <div className="flex items-center gap-1.5 text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                          <Paperclip className="w-3.5 h-3.5" /> Attached: {rep.attachmentName}
                        </div>
                      )}
                      {rep.reply && (
                        <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 p-3 rounded-lg space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span>Admin response:</span>
                            <span className="font-mono">{rep.replyTime}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{rep.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 6: ACADEMIC BAR */}
        {activeTab === 'academic' && (
          <motion.div
            key="academic"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-6`}>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-500" /> Academic Registry Desk
                </h2>
                {/* Steps Indicators */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        academicStep === step
                          ? 'bg-sky-500 text-white'
                          : academicStep > step
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAcademicSubmit} className="space-y-6">
                {academicStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="border-l-2 border-sky-500 pl-3">
                      <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-200">Step 1: Contact & Registration Check</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Verify your current official contact credentials for the academic desk.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Registration No.</label>
                        <input
                          type="text"
                          disabled
                          value={academicRegNo}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-lg cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Registrar Email</label>
                        <input
                          type="email"
                          value={academicEmail}
                          onChange={(e) => setAcademicEmail(e.target.value)}
                          placeholder="Your email address"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={academicPhone}
                          onChange={(e) => setAcademicPhone(e.target.value)}
                          placeholder="Your phone number"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!academicEmail.trim() || !academicPhone.trim()) {
                            showToast("❌ Please verify email and phone number to continue.");
                            return;
                          }
                          setAcademicStep(2);
                        }}
                        className={`py-2 px-5 text-xs font-black text-white bg-sky-500 hover:bg-sky-600 shadow flex items-center gap-1 ${radius} transition-all`}
                      >
                        Next Step <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {academicStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="border-l-2 border-sky-500 pl-3">
                      <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-200">Step 2: Course & Standing Info</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Specify the course unit and current year of academic standing.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Course Unit</label>
                        <select
                          value={academicCourse}
                          onChange={(e) => setAcademicCourse(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                          <option value="Human Anatomy I">Human Anatomy I</option>
                          <option value="Medical Biochemistry">Medical Biochemistry</option>
                          <option value="Systemic Pathology">Systemic Pathology</option>
                          <option value="Medical Microbiology">Medical Microbiology</option>
                          <option value="Medical Physiology">Medical Physiology</option>
                          <option value="Pharmacology & Therapeutics">Pharmacology & Therapeutics</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Academic Year</label>
                        <select
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                          <option value="Year 1">MD Year 1</option>
                          <option value="Year 2">MD Year 2</option>
                          <option value="Year 3">MD Year 3</option>
                          <option value="Year 4">MD Year 4</option>
                          <option value="Year 5">MD Year 5</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setAcademicStep(1)}
                        className={`py-2 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 rounded-lg transition-all`}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setAcademicStep(3)}
                        className={`py-2 px-5 text-xs font-black text-white bg-sky-500 hover:bg-sky-600 shadow flex items-center gap-1 ${radius} transition-all`}
                      >
                        Next Step <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {academicStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="border-l-2 border-sky-500 pl-3">
                      <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-200">Step 3: State Your Concern</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Describe the specific academic dispute, registration block, or grade issue.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Academic Concern Description</label>
                      <textarea
                        rows={4}
                        value={academicDescription}
                        onChange={(e) => setAcademicDescription(e.target.value)}
                        placeholder="Detail your academic query, missing mark issue, or lecture coordinator concern..."
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setAcademicStep(2)}
                        className={`py-2 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 rounded-lg transition-all`}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className={`py-2 px-5 text-xs font-black text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow flex items-center gap-1.5 ${radius} transition-all`}
                      >
                        <Send className="w-3.5 h-3.5" /> Submit Academic Case
                      </button>
                    </div>
                  </motion.div>
                )}
              </form>
            </div>

            {/* Academic History logs */}
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}>
              <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide">
                Academic Support Log History
              </h3>
              {myReports.filter(r => r.sector === 'academic').length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No academic cases submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {myReports.filter(r => r.sector === 'academic').map((rep) => (
                    <div key={rep.id} className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 rounded-xl space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{rep.time}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          rep.status === 'pending'
                            ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-500 border border-sky-100/50'
                            : 'bg-green-50 dark:bg-green-950/20 text-green-500 border border-green-100/50'
                        }`}>
                          {rep.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-white dark:bg-slate-950 p-2.5 rounded border border-slate-100 dark:border-slate-900">
                        {rep.text}
                      </div>
                      {rep.reply && (
                        <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 p-3 rounded-lg space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span>Admin response:</span>
                            <span className="font-mono">{rep.replyTime}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{rep.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 7: SOCIAL BAR */}
        {activeTab === 'social' && (
          <motion.div
            key="social"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-6`}>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" /> Community & Social Bar Desk
                </h2>
              </div>

              <form onSubmit={handleSocialSubmit} className="space-y-4">
                <div className="bg-amber-50/50 dark:bg-amber-950/10 p-3.5 border border-amber-100/50 dark:border-amber-900/30 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">💡 Campus Social Notice</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    This desk tracks general student life, social issues, hostel queries, recreational affairs, and campus community suggestions. No private personal contact details are requested to protect anonymity.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Social Concern or Community Suggestion</label>
                  <textarea
                    rows={6}
                    value={socialDescription}
                    onChange={(e) => setSocialDescription(e.target.value)}
                    placeholder="Describe your social issue, hostel complaint, sports activity suggestion, or student welfare feedback..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className={`py-2 px-5 text-xs font-black text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow flex items-center gap-1.5 ${radius} transition-all`}
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Social Concern
                  </button>
                </div>
              </form>
            </div>

            {/* Social History logs */}
            <div className={`p-6 ${getGlassmorphismClass(config.glassmorphism)} ${radius} border border-slate-200 dark:border-slate-800 shadow space-y-4`}>
              <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide">
                Campus Welfare Log History
              </h3>
              {myReports.filter(r => r.sector === 'social').length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No social concerns submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {myReports.filter(r => r.sector === 'social').map((rep) => (
                    <div key={rep.id} className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 rounded-xl space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{rep.time}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          rep.status === 'pending'
                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500 border border-amber-100/50'
                            : 'bg-green-50 dark:bg-green-950/20 text-green-500 border border-green-100/50'
                        }`}>
                          {rep.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-white dark:bg-slate-950 p-2.5 rounded border border-slate-100 dark:border-slate-900">
                        {rep.text}
                      </div>
                      {rep.reply && (
                        <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 p-3 rounded-lg space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span>Admin response:</span>
                            <span className="font-mono">{rep.replyTime}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{rep.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
