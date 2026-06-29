/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Settings, ShieldAlert, Sparkles, Sliders, Type, 
  Palette, Smartphone, Lock, Eye, EyeOff, User, Image, 
  UserCheck, Terminal, Volume2, Globe, FileSignature, CheckCircle2 
} from 'lucide-react';
import { User as UserType, SystemConfig } from '../types';
import { 
  getAccentColorClass, 
  getBorderRadiusClass, 
  getGlassmorphismClass 
} from './CommonUI';
import { COUNTRIES, COURSES } from '../data';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  config: SystemConfig;
  onUpdateConfig: (newConfig: Partial<SystemConfig>) => void;
  onUpdateUser: (updatedUser: Partial<UserType>) => void;
  allUsers: UserType[];
  onRenameUser: (regNo: string, updatedNames: { firstName: string; middleName: string; lastName: string }) => void;
  showToast: (msg: string) => void;
  themeMode: 'light' | 'dark' | 'system';
  onThemeModeChange: (mode: 'light' | 'dark' | 'system') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  config,
  onUpdateConfig,
  onUpdateUser,
  allUsers,
  onRenameUser,
  showToast,
  themeMode,
  onThemeModeChange
}) => {
  if (!isOpen || !currentUser) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'programmer'>('profile');
  
  // Profile State
  const [firstName, setFirstName] = useState(currentUser.firstName || '');
  const [middleName, setMiddleName] = useState(currentUser.middleName || '');
  const [lastName, setLastName] = useState(currentUser.lastName || '');
  const [gender, setGender] = useState(currentUser.gender || '');
  const [course, setCourse] = useState(currentUser.course || '');
  const [chatAlias, setChatAlias] = useState(currentUser.chatAlias || '');
  const [adminRole, setAdminRole] = useState(currentUser.adminRole || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [countryCode, setCountryCode] = useState(currentUser.countryCode || '');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Security State
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Programmer State: Edit Student Name
  const initialStudent = allUsers.find(u => u.role === 'user');
  const [selectedStudentReg, setSelectedStudentReg] = useState(initialStudent?.regNo || '');
  const [editFirst, setEditFirst] = useState(initialStudent?.firstName || '');
  const [editMiddle, setEditMiddle] = useState(initialStudent?.middleName || '');
  const [editLast, setEditLast] = useState(initialStudent?.lastName || '');

  // Styling helpers
  const radius = getBorderRadiusClass(config.borderRadius);
  const accentText = getAccentColorClass(config.colorAccent, 'text');
  const accentBg = getAccentColorClass(config.colorAccent, 'bg');
  const accentGradient = getAccentColorClass(config.colorAccent, 'from-to');

  const isStaff = currentUser.role === 'admin' || currentUser.role === 'programmer';
  const isProg = currentUser.role === 'programmer';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast("Please choose an image file (PNG/JPG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onUpdateUser({ photo: dataUrl });
      showToast("Profile picture updated successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onUpdateConfig({ siteLogo: dataUrl });
      showToast("Website brand logo updated!");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone || !email) {
      showToast("First name, Last name, phone and email cannot be empty.");
      return;
    }
    if (!/^\d{1,9}$/.test(phone)) {
      showToast("Phone must be numeric and up to 9 digits.");
      return;
    }

    const updates: Partial<UserType> = {
      firstName,
      middleName,
      lastName,
      gender,
      course,
      phone,
      email,
      countryCode,
      chatAlias: chatAlias.trim() || undefined,
    };

    if (isStaff) {
      updates.adminRole = adminRole.trim() || undefined;
    }

    onUpdateUser(updates);
    showToast("Profile settings saved successfully.");
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwd || !newPwd || !newPwd2) {
      showToast("Please fill in all password fields.");
      return;
    }
    if (currentUser.password && currentPwd !== currentUser.password) {
      showToast("Current password is incorrect.");
      return;
    }
    if (newPwd !== newPwd2) {
      showToast("New passwords do not match.");
      return;
    }
    if (newPwd.length < 4) {
      showToast("New password must be at least 4 characters long.");
      return;
    }

    onUpdateUser({ password: newPwd });
    setCurrentPwd('');
    setNewPwd('');
    setNewPwd2('');
    showToast("Your password was updated securely.");
  };

  const handleStudentSelectForRename = (reg: string) => {
    setSelectedStudentReg(reg);
    const stud = allUsers.find(u => u.regNo === reg);
    if (stud) {
      setEditFirst(stud.firstName || '');
      setEditMiddle(stud.middleName || '');
      setEditLast(stud.lastName || '');
    } else {
      setEditFirst('');
      setEditMiddle('');
      setEditLast('');
    }
  };

  const handleSaveRename = () => {
    if (!selectedStudentReg) return;
    if (!editFirst.trim() || !editLast.trim()) {
      showToast("Student first name and last name are required.");
      return;
    }
    onRenameUser(selectedStudentReg, {
      firstName: editFirst.trim(),
      middleName: editMiddle.trim(),
      lastName: editLast.trim()
    });
    showToast(`Successfully renamed student database entry!`);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
      />

      {/* Main Panel */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 26, stiffness: 190 }}
        className={`relative w-full max-w-2xl h-[88vh] sm:h-auto sm:max-h-[85vh] ${getGlassmorphismClass(config.glassmorphism)} ${radius} sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden`}
      >
        {/* Handle for drag feel on mobile */}
        <div className="w-12 h-1 ml-auto mr-auto my-3 bg-slate-300 dark:bg-slate-700 rounded-full sm:hidden" />

        {/* Header */}
        <div className="px-6 pb-4 pt-2 sm:pt-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 ${getAccentColorClass(config.colorAccent, 'bg')} text-white rounded-xl shadow-md`}>
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50 font-sans tracking-tight">
                System Preferences
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Personalize your experience & admin panel parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-6 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-1.5 px-3.5 text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${radius} ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-50'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            My Identity
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-1.5 px-3.5 text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${radius} ${
              activeTab === 'security'
                ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-50'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Security & Auth
          </button>

          {isProg && (
            <button
              onClick={() => setActiveTab('programmer')}
              className={`py-1.5 px-3.5 text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${radius} ${
                activeTab === 'programmer'
                  ? 'bg-purple-500 dark:bg-purple-600 shadow-sm text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              ⚡ System Architect Panel
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.form
                key="profile"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSaveProfile}
                className="space-y-6"
              >
                {/* Profile Pic Card */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative group">
                    <div className={`w-20 h-20 shadow-md ${radius} border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-tr ${accentGradient} flex items-center justify-center text-white text-3xl font-extrabold overflow-hidden`}>
                      {currentUser.photo ? (
                        <img src={currentUser.photo} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        currentUser.firstName[0].toUpperCase()
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Image className="w-5 h-5" />
                    </button>
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Passport Profile Picture
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Upload a PNG or JPG passport face photo. This will show in your chat bubbles, system headers, and reports.
                    </p>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className={`mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all ${radius}`}
                    >
                      Select Photo File
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Chat Username / Alias <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={chatAlias}
                      onChange={(e) => setChatAlias(e.target.value)}
                      placeholder="Pseudonym for group chat"
                      className={`w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800/80 ${radius} text-sm focus:outline-none focus:border-emerald-500`}
                    />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      The name shown during group chats and peer direct messages.
                    </p>
                  </div>

                  {isStaff && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Admin Official Role <span className="text-amber-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={adminRole}
                        onChange={(e) => setAdminRole(e.target.value)}
                        placeholder="e.g. CR, Head of Department"
                        className={`w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800/80 ${radius} text-sm focus:outline-none focus:border-emerald-500`}
                      />
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        Your leadership role shown to students in the "Meet the Admins" panel.
                      </p>
                    </div>
                  )}

                  <div className="sm:col-span-2 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                      Personal Profile Information
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800/80 ${radius} text-sm focus:outline-none focus:border-emerald-500`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800/80 ${radius} text-sm focus:outline-none focus:border-emerald-500`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800/80 ${radius} text-sm focus:outline-none focus:border-emerald-500`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800/80 ${radius} text-sm focus:outline-none focus:border-emerald-500`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Course Registered <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800/80 ${radius} text-sm focus:outline-none focus:border-emerald-500`}
                    >
                      {COURSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="System Programmer">System Programmer</option>
                      <option value="Administration">Administration</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                      Registered Contact Details
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      WhatsApp Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className={`bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-2.5 text-sm ${radius} w-1/3 focus:outline-none`}
                      >
                        {COUNTRIES.map(([name, code]) => (
                          <option key={name} value={code}>{code} ({name})</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                        placeholder="7XXXXXXXX"
                        className={`flex-1 bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800/80 ${radius} text-sm focus:outline-none font-mono`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Confirm Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800/80 ${radius} text-sm focus:outline-none`}
                    />
                  </div>

                  {/* EVERY USER, ADMIN AND PROGRAMMER CAN CHANGE IF DARK MODE OR LIGHT OR SYSTEM DEFAULT */}
                  <div className="sm:col-span-2 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                      Display Theme Preference
                    </h4>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(['light', 'dark', 'system'] as const).map((mode) => {
                        const active = themeMode === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              onThemeModeChange(mode);
                              showToast(`Theme changed to ${mode === 'system' ? 'system default' : mode + ' mode'}`);
                            }}
                            className={`flex flex-col items-center justify-center py-2.5 px-3 border transition-all relative ${radius} ${
                              active
                                ? 'bg-white dark:bg-slate-900 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-emerald-500/20'
                                : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-900/60'
                            }`}
                          >
                            <span className="text-xs font-bold capitalize">
                              {mode === 'system' ? 'System Default' : mode === 'light' ? 'Light Mode' : 'Dark Mode'}
                            </span>
                            {active && (
                              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    type="submit"
                    className={`px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r ${accentGradient} hover:shadow-md transition-all active:scale-98 ${radius}`}
                  >
                    Save Personal Preferences
                  </button>
                </div>
              </motion.form>
            )}

            {activeTab === 'security' && (
              <motion.form
                key="security"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleUpdatePassword}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="Enter existing password"
                      className={`w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800/80 ${radius} text-sm focus:outline-none pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    New Secure Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Create new password"
                      className={`w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800/80 ${radius} text-sm focus:outline-none pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Should be at least 4 characters long. Make it memorable.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Verify New Password
                  </label>
                  <input
                    type="password"
                    value={newPwd2}
                    onChange={(e) => setNewPwd2(e.target.value)}
                    placeholder="Repeat new password"
                    className={`w-full bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800/80 ${radius} text-sm focus:outline-none`}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    type="submit"
                    className={`px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r ${accentGradient} hover:shadow-md transition-all active:scale-98 ${radius}`}
                  >
                    Set Password credentials
                  </button>
                </div>
              </motion.form>
            )}

            {activeTab === 'programmer' && isProg && (
              <motion.div
                key="programmer"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Visual Customizations Section */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-widest">
                      Visual Identity & Aesthetics
                    </h3>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 p-4 rounded-xl space-y-4">
                    {/* Color Accent Picker */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Accent Paint Theme Color
                      </label>
                      <div className="flex items-center gap-2">
                        {(['teal', 'coral', 'amber', 'violet', 'royal'] as const).map((accent) => {
                          const active = config.colorAccent === accent;
                          const bg = accent === 'teal' ? 'bg-emerald-500' :
                                     accent === 'coral' ? 'bg-red-500' :
                                     accent === 'amber' ? 'bg-amber-500' :
                                     accent === 'violet' ? 'bg-purple-600' : 'bg-blue-600';
                          return (
                            <button
                              key={accent}
                              onClick={() => onUpdateConfig({ colorAccent: accent })}
                              className={`w-9 h-9 ${radius} ${bg} transition-all relative flex items-center justify-center ${
                                active ? 'scale-110 shadow-lg ring-2 ring-slate-800 dark:ring-slate-100' : 'opacity-70 hover:opacity-100 hover:scale-105'
                              }`}
                              title={accent}
                            >
                              {active && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Border radius picker */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Card Border Corners
                        </label>
                        <select
                          value={config.borderRadius}
                          onChange={(e) => onUpdateConfig({ borderRadius: e.target.value as any })}
                          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                        >
                          <option value="none">Sharp Corners (0px)</option>
                          <option value="subtle">Subtle Radius (4px)</option>
                          <option value="smooth">Smooth standard (8px)</option>
                          <option value="rounded">Super rounded (16px)</option>
                          <option value="bendy">Organic Bendy (30px)</option>
                        </select>
                      </div>

                      {/* Glassmorphism setting */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Glassmorphism Level
                        </label>
                        <select
                          value={config.glassmorphism}
                          onChange={(e) => onUpdateConfig({ glassmorphism: e.target.value as any })}
                          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                        >
                          <option value="none">Flat Solid Canvas (None)</option>
                          <option value="subtle">Subtle backdrop blur (5px)</option>
                          <option value="frosted">Frosted heavy glass blur (12px)</option>
                        </select>
                      </div>

                      {/* Screen Width limits */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Application Sizing Layout Bounds
                        </label>
                        <select
                          value={config.layoutWidth}
                          onChange={(e) => onUpdateConfig({ layoutWidth: e.target.value as any })}
                          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                        >
                          <option value="compact">Mobile Shell Compact (480px)</option>
                          <option value="default">Medium Tablet boundaries (768px)</option>
                          <option value="wide">Ultra Wide Desktop (1280px)</option>
                        </select>
                      </div>

                      {/* Font scaling setting */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          System Typography Scale
                        </label>
                        <select
                          value={config.fontSize}
                          onChange={(e) => onUpdateConfig({ fontSize: e.target.value as any })}
                          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                        >
                          <option value="small">Finer Type scale (S)</option>
                          <option value="default">Standard typography (M)</option>
                          <option value="large">Elevated High Contrast (L)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Behavioral settings */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Sliders className="w-4 h-4 text-purple-500" />
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-widest">
                      Functional Settings & Behaviors
                    </h3>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 p-4 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Ticker speed settings */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Pulse Banner Ticker Speed
                        </label>
                        <select
                          value={config.tickerSpeed}
                          onChange={(e) => onUpdateConfig({ tickerSpeed: e.target.value as any })}
                          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                        >
                          <option value="slow">Relaxed Crawl (Slow)</option>
                          <option value="medium">Standard Scroll (Medium)</option>
                          <option value="fast">Alert Sweep (Fast)</option>
                          <option value="paused">Static frozen text</option>
                        </select>
                      </div>

                      {/* Audio Synthesizer notifications */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Audio Chime Synthesizer
                        </label>
                        <select
                          value={config.notificationSound}
                          onChange={(e) => onUpdateConfig({ notificationSound: e.target.value as any })}
                          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                        >
                          <option value="classic">Retro classic double chime</option>
                          <option value="modern">Warm modern micro-bell</option>
                          <option value="scifi">Ascending frequency sci-fi sweep</option>
                          <option value="mute">Muted chimes</option>
                        </select>
                      </div>

                      {/* Chat bubble layouts */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Chat Bubble Styling
                        </label>
                        <select
                          value={config.chatBubbleStyle}
                          onChange={(e) => onUpdateConfig({ chatBubbleStyle: e.target.value as any })}
                          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                        >
                          <option value="classic">Subtle rounded (Classic)</option>
                          <option value="rounded">Super rounded bubbles</option>
                          <option value="pill">Extended Pill contours</option>
                        </select>
                      </div>

                      {/* Particle effects bg toggle */}
                      <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Animated mesh drift bg</div>
                          <div className="text-[10px] text-slate-400">Drift gradient flow behind boards</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.particleBg}
                          onChange={(e) => onUpdateConfig({ particleBg: e.target.checked })}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded border-slate-300"
                        />
                      </div>
                    </div>

                    {/* Site Brand Settings */}
                    <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Brand name displayed on Auth / Topbar
                        </label>
                        <input
                          type="text"
                          value={config.siteName}
                          onChange={(e) => onUpdateConfig({ siteName: e.target.value })}
                          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Custom Login Screen Greeting
                        </label>
                        <input
                          type="text"
                          value={config.customGreeting}
                          onChange={(e) => onUpdateConfig({ customGreeting: e.target.value })}
                          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          System Logo Brand Asset
                        </label>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 shadow-sm ${radius} bg-gradient-to-tr ${accentGradient} text-white flex items-center justify-center text-sm font-black`}>
                            {config.siteLogo ? (
                              <img src={config.siteLogo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              'MP'
                            )}
                          </div>
                          <input
                            type="file"
                            onChange={handleLogoUpload}
                            accept="image/*"
                            id="logoUploadBtn"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('logoUploadBtn')?.click()}
                            className={`px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 ${radius}`}
                          >
                            Upload Brand Emblem
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DB renaming controls */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <UserCheck className="w-4 h-4 text-purple-500" />
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-widest">
                      Student Registry Governance
                    </h3>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 p-4 rounded-xl space-y-4">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Rename student database records to rectify indexing errors. Changes will update their dashboard headers instantly.
                    </p>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Select Registered Student Record
                      </label>
                      <select
                        value={selectedStudentReg}
                        onChange={(e) => handleStudentSelectForRename(e.target.value)}
                        className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs ${radius} focus:outline-none`}
                      >
                        <option value="">Select Student...</option>
                        {allUsers.filter(u => u.role === 'user').map(u => (
                          <option key={u.regNo} value={u.regNo}>{u.firstName} {u.lastName} ({u.regNo})</option>
                        ))}
                      </select>
                    </div>

                    {selectedStudentReg && (
                      <div className="space-y-3 p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">First Name</label>
                            <input
                              type="text"
                              value={editFirst}
                              onChange={(e) => setEditFirst(e.target.value)}
                              className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 text-xs ${radius}`}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Middle Name</label>
                            <input
                              type="text"
                              value={editMiddle}
                              onChange={(e) => setEditMiddle(e.target.value)}
                              className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 text-xs ${radius}`}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Name</label>
                            <input
                              type="text"
                              value={editLast}
                              onChange={(e) => setEditLast(e.target.value)}
                              className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 text-xs ${radius}`}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={handleSaveRename}
                            className={`px-4 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:shadow-sm ${radius}`}
                          >
                            Update Student Record
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
