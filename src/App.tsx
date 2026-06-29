/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, HelpCircle, Shield, Globe, Terminal, Volume2, 
  Settings, LogOut, Lock, Mail, CheckCircle2, MessageSquare, 
  Activity, BookOpen, Download, Eye, EyeOff, X 
} from 'lucide-react';

import { 
  User, 
  Report, 
  Announcement, 
  PasswordReset, 
  SystemNotification, 
  ChatMessage, 
  Comment, 
  DocumentMaterial, 
  SystemConfig 
} from './types';

import { 
  INITIAL_USERS, 
  DEFAULT_CONFIG, 
  INITIAL_NEWS, 
  DOCUMENT_CATEGORIES,
  COURSES 
} from './data';

import { 
  getAccentColorClass, 
  getBorderRadiusClass, 
  getGlassmorphismClass, 
  ConfirmDialog, 
  EmailPreviewModal, 
  SoundEffects 
} from './components/CommonUI';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ChatModal } from './components/ChatModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  // Global States persisted to LocalStorage
  const [config, setConfig] = useState<SystemConfig>(() => {
    const cached = localStorage.getItem('muhas_pulse_config');
    return cached ? JSON.parse(cached) : DEFAULT_CONFIG;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const cached = localStorage.getItem('muhas_pulse_users');
    let loadedUsers: User[] = cached ? JSON.parse(cached) : INITIAL_USERS;
    
    // Normalize Baraka Gabriel SHIRIMA database entry as requested
    loadedUsers = loadedUsers.map(u => {
      if (u.regNo === "2025-04-00000") {
        return {
          ...u,
          firstName: "Baraka",
          middleName: "Gabriel",
          lastName: "SHIRIMA"
        };
      }
      return u;
    });
    return loadedUsers;
  });

  const [reports, setReports] = useState<Report[]>(() => {
    const cached = localStorage.getItem('muhas_pulse_reports');
    return cached ? JSON.parse(cached) : [];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const cached = localStorage.getItem('muhas_pulse_announcements');
    return cached ? JSON.parse(cached) : [];
  });

  const [passwordResets, setPasswordResets] = useState<PasswordReset[]>(() => {
    const cached = localStorage.getItem('muhas_pulse_resets');
    return cached ? JSON.parse(cached) : [];
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const cached = localStorage.getItem('muhas_pulse_notifications');
    return cached ? JSON.parse(cached) : [];
  });

  const [groupChat, setGroupChat] = useState<ChatMessage[]>(() => {
    const cached = localStorage.getItem('muhas_pulse_groupchat');
    return cached ? JSON.parse(cached) : [];
  });

  const [directChats, setDirectChats] = useState<Record<string, ChatMessage[]>>(() => {
    const cached = localStorage.getItem('muhas_pulse_directchats');
    return cached ? JSON.parse(cached) : {};
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const cached = localStorage.getItem('muhas_pulse_comments');
    return cached ? JSON.parse(cached) : [];
  });

  const [documents, setDocuments] = useState<DocumentMaterial[]>(() => {
    const cached = localStorage.getItem('muhas_pulse_documents');
    return cached ? JSON.parse(cached) : [];
  });

  const [news, setNews] = useState<string[]>(() => {
    const cached = localStorage.getItem('muhas_pulse_news');
    return cached ? JSON.parse(cached) : INITIAL_NEWS;
  });

  // UI Flow States
  const [sessionUserReg, setSessionUserReg] = useState<string | null>(() => {
    return localStorage.getItem('muhas_pulse_session') || null;
  });
  
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginWarningFields, setLoginWarningFields] = useState<string[]>([]);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerWarningFields, setRegisterWarningFields] = useState<string[]>([]);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('muhas_pulse_theme') as 'light' | 'dark' | 'system') || 'system';
  });

  const handleThemeModeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    localStorage.setItem('muhas_pulse_theme', mode);
  };

  // Modal Triggers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [isAdminDirectoryOpen, setIsAdminDirectoryOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);

  // Email Preview Trigger State
  const [simulatedEmail, setSimulatedEmail] = useState<{
    isOpen: boolean;
    to: string;
    subject: string;
    bodyHtml: string;
  }>({ isOpen: false, to: '', subject: '', bodyHtml: '' });

  // Toast System State
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);

  // Profile Dropdown
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Form inputs for Auth Screen
  const [loginRegNo, setLoginRegNo] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const [regFirst, setRegFirst] = useState('');
  const [regMiddle, setRegMiddle] = useState('');
  const [regLast, setRegLast] = useState('');
  const [regGender, setRegGender] = useState('');
  const [regRegNo, setRegRegNo] = useState('');
  const [regCourse, setRegCourse] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCountryCode, setRegCountryCode] = useState('+255');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPassword2, setRegPassword2] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);

  // Forgot password form inputs
  const [isForgotPwdOpen, setIsForgotPwdOpen] = useState(false);
  const [forgotReg, setForgotReg] = useState('');
  const [forgotMail, setForgotMail] = useState('');

  // Comment input
  const [commentText, setCommentText] = useState('');

  // Category filter for materials view
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Resolve current active logged-in User
  const currentUser = sessionUserReg 
    ? users.find(u => u.regNo && sessionUserReg && u.regNo.toLowerCase() === sessionUserReg.toLowerCase()) || null 
    : null;

  // Persistances trigger
  useEffect(() => {
    localStorage.setItem('muhas_pulse_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('muhas_pulse_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('muhas_pulse_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('muhas_pulse_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('muhas_pulse_resets', JSON.stringify(passwordResets));
  }, [passwordResets]);

  useEffect(() => {
    localStorage.setItem('muhas_pulse_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('muhas_pulse_groupchat', JSON.stringify(groupChat));
  }, [groupChat]);

  useEffect(() => {
    localStorage.setItem('muhas_pulse_directchats', JSON.stringify(directChats));
  }, [directChats]);

  useEffect(() => {
    localStorage.setItem('muhas_pulse_comments', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    try {
      localStorage.setItem('muhas_pulse_documents', JSON.stringify(documents));
    } catch (e) {
      console.warn("Storage quota exceeded, caching metadata only for some documents to fit browser limit.", e);
      // Clean up larger documents dataUrl to fit in localStorage
      const optimizedDocs = documents.map(doc => {
        if (doc.dataUrl && doc.dataUrl.length > 100000) {
          return { ...doc, dataUrl: "" }; // keep metadata only
        }
        return doc;
      });
      try {
        localStorage.setItem('muhas_pulse_documents', JSON.stringify(optimizedDocs));
      } catch (innerErr) {
        // Fallback: clear all dataUrls in localStorage
        const metaOnlyDocs = documents.map(doc => ({ ...doc, dataUrl: "" }));
        localStorage.setItem('muhas_pulse_documents', JSON.stringify(metaOnlyDocs));
      }
    }
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('muhas_pulse_news', JSON.stringify(news));
  }, [news]);

  const handleUpdateConfig = (newConfig: Partial<SystemConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('muhas_pulse_config', JSON.stringify(updated));
      return updated;
    });
  };

  // Handle active session save
  useEffect(() => {
    if (sessionUserReg) {
      localStorage.setItem('muhas_pulse_session', sessionUserReg);
    } else {
      localStorage.removeItem('muhas_pulse_session');
    }
  }, [sessionUserReg]);

  // Set initial theme
  useEffect(() => {
    const applyTheme = () => {
      let resolvedTheme: 'light' | 'dark' = 'light';
      if (themeMode === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolvedTheme = systemPrefersDark ? 'dark' : 'light';
      } else {
        resolvedTheme = themeMode;
      }
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  // Helper Toast trigger
  const showToast = (text: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800);
  };

  const playSynthesizedChime = () => {
    if (config.soundToggle) {
      SoundEffects.play(config.notificationSound);
    }
  };

  // formatting for registration numbers on the fly
  const handleFormatRegNo = (val: string, setter: (v: string) => void) => {
    let digits = val.replace(/\D/g, '').slice(0, 11);
    let out = digits.slice(0, 4);
    if (digits.length > 4) out += '-' + digits.slice(4, 6);
    if (digits.length > 6) out += '-' + digits.slice(6, 11);
    setter(out);
  };

  // Auth Operations
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginWarningFields([]);

    const missingFields: string[] = [];
    if (!loginRegNo) missingFields.push('loginRegNo');
    if (!loginPassword) missingFields.push('loginPassword');

    if (missingFields.length > 0) {
      setLoginWarningFields(missingFields);
      setLoginError("⚠️ Unfinished Information! All fields are required to authenticate.");
      showToast("❌ Please fill in all required credentials.");
      return;
    }

    const match = users.find(u => u.regNo && loginRegNo && u.regNo.toLowerCase() === loginRegNo.toLowerCase());
    if (!match || match.password !== loginPassword) {
      setLoginWarningFields(['loginRegNo', 'loginPassword']);
      setLoginError("⚠️ Incorrect Credentials! The registration number or password entered is invalid.");
      showToast("❌ Invalid sign in details. Check both fields.");
      return;
    }

    setSessionUserReg(match.regNo);
    setLoginRegNo('');
    setLoginPassword('');
    showToast(`Welcome back, ${match.firstName}! Logging you into the system.`);
    playSynthesizedChime();
  };

  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterWarningFields([]);

    const missingFields: string[] = [];
    if (!regFirst) missingFields.push('regFirst');
    if (!regMiddle) missingFields.push('regMiddle');
    if (!regLast) missingFields.push('regLast');
    if (!regGender) missingFields.push('regGender');
    if (!regRegNo) missingFields.push('regRegNo');
    if (!regCourse) missingFields.push('regCourse');
    if (!regEmail) missingFields.push('regEmail');
    if (!regPhone) missingFields.push('regPhone');
    if (!regPassword) missingFields.push('regPassword');
    if (!regPassword2) missingFields.push('regPassword2');

    if (missingFields.length > 0) {
      setRegisterWarningFields(missingFields);
      setRegisterError("⚠️ Unfinished Form! Every field listed below is mandatory to create a student node.");
      showToast("❌ Registration failed. Some fields are left empty.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{5}$/.test(regRegNo)) {
      setRegisterWarningFields(['regRegNo']);
      setRegisterError("⚠️ Wrong Information! Registry number format is invalid. Format must strictly follow: YYYY-DD-NNNNN.");
      showToast("❌ Incorrect registration number format.");
      return;
    }

    if (!/^\d{1,9}$/.test(regPhone)) {
      setRegisterWarningFields(['regPhone']);
      setRegisterError("⚠️ Wrong Information! Phone number must be numeric (up to 9 digits, excluding country code).");
      showToast("❌ Incorrect phone number format.");
      return;
    }

    if (regPassword !== regPassword2) {
      setRegisterWarningFields(['regPassword', 'regPassword2']);
      setRegisterError("⚠️ Password Mismatch! The two passwords entered do not match each other.");
      showToast("❌ Password verification mismatch.");
      return;
    }

    if (users.some(u => u.regNo && regRegNo && u.regNo.toLowerCase() === regRegNo.toLowerCase())) {
      setRegisterWarningFields(['regRegNo']);
      setRegisterError("⚠️ Registry In Use! This registration number is already registered on another student account.");
      showToast("❌ This registration number is already taken.");
      return;
    }

    if (users.some(u => u.email && regEmail && u.email.toLowerCase() === regEmail.toLowerCase())) {
      setRegisterWarningFields(['regEmail']);
      setRegisterError("⚠️ Email In Use! This registered email address is already registered on another account.");
      showToast("❌ This email address is already taken.");
      return;
    }

    const newUser: User = {
      firstName: regFirst,
      middleName: regMiddle,
      lastName: regLast,
      gender: regGender,
      regNo: regRegNo,
      course: regCourse,
      email: regEmail,
      countryCode: regCountryCode,
      phone: regPhone,
      password: regPassword,
      role: 'user',
      photo: null,
      chatAlias: regFirst
    };

    setUsers(prev => [...prev, newUser]);
    
    // Send SMTP registration confirmation preview
    const subject = `🎉 Congratulations — your ${config.siteName} account is active!`;
    const bodyHtml = `
      Dear ${regFirst},<br><br>
      Congratulations! Your account is active on <strong>${config.siteName}</strong>.<br><br>
      Use your unique registry number <strong>${regRegNo}</strong> and your password to log in. Keep these details secure.<br><br>
      Warm regards,<br>
      The ${config.siteName} Team
    `;

    setSimulatedEmail({ isOpen: true, to: regEmail, subject, bodyHtml });
    showToast("Registration successful! Email confirmation issued.");

    // Clear register inputs
    setRegFirst('');
    setRegMiddle('');
    setRegLast('');
    setRegRegNo('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setRegPassword2('');
    setAuthTab('login');
  };

  const handleForgotPasswordRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotReg || !forgotMail) {
      showToast("Please provide both your registration number and email.");
      return;
    }
    const match = users.find(u => u.regNo && u.email && forgotReg && forgotMail && u.regNo.toLowerCase() === forgotReg.toLowerCase() && u.email.toLowerCase() === forgotMail.toLowerCase());
    if (!match) {
      showToast("No matching registered student record found.");
      return;
    }

    const alreadyPending = passwordResets.some(r => r.regNo === match.regNo && r.status === 'pending');
    if (alreadyPending) {
      showToast("You already have an outstanding reset request waiting for admin authorization.");
      setIsForgotPwdOpen(false);
      return;
    }

    const newRequest: PasswordReset = {
      id: Math.random().toString(36).slice(2, 9),
      regNo: match.regNo,
      name: `${match.firstName} ${match.lastName}`,
      email: match.email,
      time: new Date().toLocaleString(),
      status: 'pending',
      resolvedTime: null
    };

    setPasswordResets(prev => [...prev, newRequest]);
    
    // Broadcast notifications to administrators
    const newNotif: SystemNotification = {
      id: Math.random().toString(36).slice(2, 9),
      audience: 'staff',
      kind: 'reset',
      text: `Password reset request flagged by student ${match.firstName} ${match.lastName} (${match.regNo}).`,
      time: new Date().toLocaleString(),
      seenBy: []
    };
    setNotifications(prev => [...prev, newNotif]);

    setIsForgotPwdOpen(false);
    setForgotReg('');
    setForgotMail('');
    showToast("Reset ticket routed to administrators. Check WhatsApp soon.");
  };

  // App Level Operations
  const handleLogOut = () => {
    setSessionUserReg(null);
    setIsLogoutConfirmOpen(false);
    setIsProfileMenuOpen(false);
    showToast("Successfully logged out of your session.");
  };

  const handleCreateReport = (sector: 'health' | 'academic' | 'social', text: string, file: { name: string; dataUrl: string } | null) => {
    if (!currentUser) return;

    const newReport: Report = {
      id: Math.random().toString(36).slice(2, 9),
      regNo: currentUser.regNo,
      name: `${currentUser.firstName} ${currentUser.lastName}`,
      sector,
      text,
      time: new Date().toLocaleString(),
      status: 'pending',
      reply: null,
      replyTime: null,
      attachmentName: file ? file.name : null,
      attachmentData: file ? file.dataUrl : null
    };

    setReports(prev => [...prev, newReport]);

    // Push Notification for staff
    const newNotif: SystemNotification = {
      id: Math.random().toString(36).slice(2, 9),
      audience: 'staff',
      kind: sector,
      text: `${currentUser.firstName} ${currentUser.lastName} filed a new ${sector} report.`,
      time: new Date().toLocaleString(),
      seenBy: []
    };
    setNotifications(prev => [...prev, newNotif]);
    showToast(`${sector.toUpperCase()} official report filed.`);
  };

  const handleAdminReplyToReport = (reportId: string, replyText: string) => {
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        // Send email alert simulation to the recipient student
        const studentObj = users.find(u => u.regNo === r.regNo);
        if (studentObj) {
          const subject = `💬 Update on your ${r.sector} ticket — ${config.siteName}`;
          const bodyHtml = `
            Dear ${studentObj.firstName},<br><br>
            An administrator has responded to your <strong>${r.sector}</strong> ticket with the following feedback:<br><br>
            <em>"${replyText}"</em><br><br>
            Log in to the home dashboard to view full conversation histories.<br><br>
            Sincerely,<br>
            Desk Administration Office
          `;
          sendStudentEmailSimulation(studentObj.email, subject, bodyHtml);
        }

        // Notify Student
        const newNotif: SystemNotification = {
          id: Math.random().toString(36).slice(2, 9),
          audience: r.regNo,
          kind: 'reply',
          text: `Representative left feedback on your ${r.sector} file: "${replyText.slice(0, 45)}..."`,
          time: new Date().toLocaleString(),
          seenBy: []
        };
        setNotifications(prevNotif => [...prevNotif, newNotif]);

        return {
          ...r,
          status: 'answered',
          reply: replyText,
          replyTime: new Date().toLocaleString()
        };
      }
      return r;
    }));
  };

  const handleResolveResetRequest = (resetId: string, tempPwd: string) => {
    const request = passwordResets.find(r => r.id === resetId);
    if (!request) return;

    // Update user credential
    setUsers(prev => prev.map(u => {
      if (u.regNo === request.regNo) {
        // Mail notification
        const subject = `🔑 Temporary Security Credentials — ${config.siteName}`;
        const bodyHtml = `
          Dear ${u.firstName},<br><br>
          An administrator has resolved your password ticket.<br><br>
          Your temporary credential passcode is configured to: <strong>${tempPwd}</strong><br><br>
          Please use this to log in, and securely configure a custom password inside System Settings.<br><br>
          Warmly,<br>
          Coordinators Desk
        `;
        sendStudentEmailSimulation(u.email, subject, bodyHtml);

        return { ...u, password: tempPwd };
      }
      return u;
    }));

    // Update Request status
    setPasswordResets(prev => prev.map(r => {
      if (r.id === resetId) {
        return { ...r, status: 'resolved', resolvedTime: new Date().toLocaleString() };
      }
      return r;
    }));

    // Notify student
    const newNotif: SystemNotification = {
      id: Math.random().toString(36).slice(2, 9),
      audience: request.regNo,
      kind: 'reset',
      text: `Your password ticket has been authorized. Temporary key assigned.`,
      time: new Date().toLocaleString(),
      seenBy: []
    };
    setNotifications(prev => [...prev, newNotif]);
  };

  const handleForceDirectReset = (regNo: string, tempPwd: string) => {
    setUsers(prev => prev.map(u => {
      if (u.regNo === regNo) {
        const subject = `🔑 Security Bypass Notification — ${config.siteName}`;
        const bodyHtml = `
          Dear ${u.firstName},<br><br>
          Administrator forces a credentials override bypass on your profile.<br><br>
          Your login credential passcode is configured to: <strong>${tempPwd}</strong><br><br>
          Consider updating this once signed into settings.<br><br>
          Sincerely,<br>
          Governance Operations Desk
        `;
        sendStudentEmailSimulation(u.email, subject, bodyHtml);

        return { ...u, password: tempPwd };
      }
      return u;
    }));

    // Notify student
    const newNotif: SystemNotification = {
      id: Math.random().toString(36).slice(2, 9),
      audience: regNo,
      kind: 'reset',
      text: `Administrator forced a credential reset on your account profile.`,
      time: new Date().toLocaleString(),
      seenBy: []
    };
    setNotifications(prev => [...prev, newNotif]);
  };

  const handleUploadDocument = (title: string, category: string, fileName: string, dataUrl: string) => {
    const authorName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Administration';
    const newDoc: DocumentMaterial = {
      id: Math.random().toString(36).slice(2, 9),
      title,
      category,
      uploadedBy: authorName,
      time: new Date().toLocaleDateString(),
      fileName,
      dataUrl
    };
    setDocuments(prev => [...prev, newDoc]);
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    showToast("Document deleted from resources.");
  };

  const handleAddNews = (text: string) => {
    setNews(prev => [...prev, text]);
  };

  const handleRemoveNews = (index: number) => {
    setNews(prev => prev.filter((_, i) => i !== index));
    showToast("News ticker banner headline removed.");
  };

  const handleAddAnnouncement = (text: string) => {
    const newAnn: Announcement = {
      id: Math.random().toString(36).slice(2, 9),
      text,
      time: new Date().toLocaleDateString()
    };
    setAnnouncements(prev => [...prev, newAnn]);
    playSynthesizedChime();
  };

  const handleSendChatMessage = (text: string, options?: Partial<ChatMessage>) => {
    if (!currentUser) return;

    const newMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2, 9),
      name: options?.name || currentUser.firstName,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      voiceUrl: options?.voiceUrl,
      voiceDuration: options?.voiceDuration,
      attachmentName: options?.attachmentName,
      attachmentData: options?.attachmentData,
      attachmentType: options?.attachmentType
    };

    onAddChatMessage(newMsg, options?.toRegNo);
  };

  const onAddChatMessage = (msg: ChatMessage, toReg?: string) => {
    if (toReg) {
      // DM Message
      const key = [currentUser!.regNo, toReg].sort().join('|');
      setDirectChats(prev => {
        const currentList = prev[key] || [];
        return {
          ...prev,
          [key]: [...currentList, { ...msg, fromRegNo: currentUser!.regNo, toRegNo: toReg }]
        };
      });
    } else {
      // Group lobby Message
      setGroupChat(prev => [...prev, { ...msg, regNo: currentUser!.regNo }]);
    }
  };

  const handlePostComment = () => {
    if (!currentUser || !commentText.trim()) return;

    const newComment: Comment = {
      id: Math.random().toString(36).slice(2, 9),
      regNo: currentUser.regNo,
      name: currentUser.chatAlias || `${currentUser.firstName} ${currentUser.lastName}`,
      text: commentText.trim(),
      time: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    setComments(prev => [...prev, newComment]);
    setCommentText('');
    showToast("Public feedback comment published.");
  };

  const handleRenameStudent = (regNo: string, updatedNames: { firstName: string; middleName: string; lastName: string }) => {
    setUsers(prev => prev.map(u => {
      if (u.regNo === regNo) {
        return { ...u, ...updatedNames };
      }
      return u;
    }));
  };

  const handleUserRoleUpdate = (regNo: string, newRole: User['role']) => {
    setUsers(prev => prev.map(u => {
      if (u.regNo === regNo) {
        return { ...u, role: newRole };
      }
      return u;
    }));
  };

  const sendStudentEmailSimulation = (to: string, subject: string, bodyHtml: string) => {
    setSimulatedEmail({
      isOpen: true,
      to,
      subject,
      bodyHtml
    });
  };

  // Layout parameters
  const accentGradient = getAccentColorClass(config.colorAccent, 'from-to');
  const accentBg = getAccentColorClass(config.colorAccent, 'bg');
  const radius = getBorderRadiusClass(config.borderRadius);

  // Dynamic layout max widths (expanded for gorgeous full-screen fit on PC and mobile)
  const containerWidthClass = config.layoutWidth === 'compact' 
    ? 'max-w-md' 
    : config.layoutWidth === 'default' 
    ? 'max-w-5xl' 
    : 'max-w-7xl lg:max-w-[95%]';

  // Dynamic font sizing
  const fontSizeClass = config.fontSize === 'small' 
    ? 'text-xs' 
    : config.fontSize === 'large' 
    ? 'text-base' 
    : 'text-sm';

  return (
    <div className={`${currentUser ? 'h-screen overflow-hidden' : 'min-h-screen overflow-x-hidden'} relative flex flex-col ${fontSizeClass} bg-[#F8F7F4] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200`}>
      {/* Interactive Drift Background grids */}
      {config.particleBg && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -30, 40, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -left-40 w-96 h-96 bg-red-400/10 dark:bg-red-400/5 rounded-full filter blur-[80px]"
          />
          <motion.div
            animate={{
              x: [0, -30, 20, 0],
              y: [0, 40, -30, 0],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 -right-40 w-96 h-96 bg-teal-400/10 dark:bg-teal-400/5 rounded-full filter blur-[90px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.15, 0.9, 1],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-400/10 dark:bg-amber-400/5 rounded-full filter blur-[70px]"
          />
        </div>
      )}

      {/* Main app boundary */}
      <div className={`flex-1 relative z-10 w-full ${containerWidthClass} mx-auto px-4 py-3 sm:py-4 flex flex-col ${currentUser ? 'h-full overflow-hidden' : ''}`}>
        <AnimatePresence mode="wait">
          {!currentUser ? (
            /* ========================================================
               AUTH SCREEN
               ======================================================== */
            <motion.div
              key="auth-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[90vh] flex flex-col justify-center py-6 sm:py-12 relative overflow-hidden"
            >
              {/* Foreground content container (to ensure z-index priority) */}
              <div className="relative z-10 w-full flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="sm:max-w-md sm:w-full sm:mx-auto text-center space-y-4 mb-6"
                >
                <div className="relative inline-block">
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 0.98, 1.12, 1, 1],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.8,
                      ease: "easeInOut",
                    }}
                    className={`w-14 h-14 bg-gradient-to-tr ${accentGradient} text-white font-black text-2xl flex items-center justify-center shadow-xl ${radius} mx-auto`}
                  >
                    {config.siteLogo ? (
                      <img src={config.siteLogo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      'MP'
                    )}
                  </motion.div>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 font-sans tracking-tight">
                    {config.siteName}
                  </h1>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest mt-1">
                    Medical & Allied Students Portal
                  </p>
                </div>

                {/* Heart Pulse ECG Line Animation */}
                <div className="flex flex-col items-center justify-center py-1 mt-1">
                  <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
                    <motion.span
                      animate={{
                        scale: [1, 1.25, 1, 1.2, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-lg"
                    >
                      ❤️
                    </motion.span>
                    <span className="text-[10px] font-extrabold tracking-widest font-mono uppercase text-slate-400 dark:text-slate-500">
                      PULSE MONITOR ACTIVE
                    </span>
                  </div>
                  <svg width="180" height="30" viewBox="0 0 180 30" fill="none" className="text-rose-500 dark:text-rose-400 mt-1">
                    <path
                      d="M0 15 H60 L65 7 L70 23 L75 2 L80 28 L85 15 H180"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-25"
                    />
                    <motion.path
                      d="M0 15 H60 L65 7 L70 23 L75 2 L80 28 L85 15 H180"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{
                        pathLength: [0, 1, 1],
                        pathOffset: [0, 0, 1],
                      }}
                      transition={{
                        duration: 2.0,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </svg>
                </div>
              </motion.div>

              {/* Toggles */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex justify-center mb-6"
              >
                <div className="bg-slate-200/50 dark:bg-slate-900/60 p-1 rounded-full flex gap-1">
                  <button
                    onClick={() => {
                      setAuthTab('login');
                      setLoginError(null);
                      setLoginWarningFields([]);
                    }}
                    className={`px-5 py-1.5 text-xs font-bold ${radius} transition-all ${
                      authTab === 'login'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthTab('register');
                      setRegisterError(null);
                      setRegisterWarningFields([]);
                    }}
                    className={`px-5 py-1.5 text-xs font-bold ${radius} transition-all ${
                      authTab === 'register'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Register Node
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`sm:max-w-md sm:w-full sm:mx-auto p-6 sm:p-8 ${getGlassmorphismClass(config.glassmorphism)} ${radius} shadow-2xl`}
              >
                <AnimatePresence mode="wait">
                  {authTab === 'login' ? (
                    /* LOGIN CARD */
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onSubmit={handleSignIn}
                      className="space-y-4"
                    >
                      <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Welcome Back</h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Sign in using your student credentials</p>
                      </div>

                      {loginError && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl"
                        >
                          <p className="text-[11px] text-red-600 dark:text-red-300 font-semibold leading-relaxed">
                            {loginError}
                          </p>
                        </motion.div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                          Registration Number
                        </label>
                        <input
                          type="text"
                          value={loginRegNo}
                          onChange={(e) => {
                            handleFormatRegNo(e.target.value, setLoginRegNo);
                            if (loginError) {
                              setLoginError(null);
                              setLoginWarningFields([]);
                            }
                          }}
                          placeholder="YYYY-DD-NNNNN"
                          className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                            loginWarningFields.includes('loginRegNo') 
                              ? 'border-red-500 ring-1 ring-red-500' 
                              : 'border-slate-200 dark:border-slate-800/80'
                          } p-3 text-xs font-mono focus:outline-none ${radius}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                          Credential Password
                        </label>
                        <div className="relative">
                          <input
                            type={showLoginPwd ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(e) => {
                              setLoginPassword(e.target.value);
                              if (loginError) {
                                setLoginError(null);
                                setLoginWarningFields([]);
                              }
                            }}
                            placeholder="Password passcode"
                            className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                              loginWarningFields.includes('loginPassword') 
                                ? 'border-red-500 ring-1 ring-red-500' 
                                : 'border-slate-200 dark:border-slate-800/80'
                            } p-3 text-xs focus:outline-none ${radius}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPwd(!showLoginPwd)}
                            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                          >
                            {showLoginPwd ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className={`w-full py-3 text-xs font-bold text-white bg-gradient-to-r ${accentGradient} ${radius} hover:shadow-lg transition-all active:scale-98`}
                      >
                        Authorize & Log In
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setIsForgotPwdOpen(true)}
                          className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
                        >
                          Forgot Password? Request bypass
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    /* REGISTER CARD */
                    <motion.form
                      key="register"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onSubmit={handleRegisterUser}
                      className="space-y-4 max-h-[460px] overflow-y-auto pr-1"
                    >
                      <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Register Student Profile</h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Join the students local coordination net</p>
                      </div>

                      {registerError && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl"
                        >
                          <p className="text-[11px] text-red-600 dark:text-red-300 font-semibold leading-relaxed">
                            {registerError}
                          </p>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">First Name</label>
                          <input
                            type="text"
                            value={regFirst}
                            onChange={(e) => {
                              setRegFirst(e.target.value);
                              if (registerError) {
                                setRegisterError(null);
                                setRegisterWarningFields([]);
                              }
                            }}
                            placeholder="Baraka"
                            className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                              registerWarningFields.includes('regFirst') 
                                ? 'border-red-500 ring-1 ring-red-500' 
                                : 'border-slate-200 dark:border-slate-800/80'
                            } p-2 text-xs focus:outline-none ${radius}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Middle Name</label>
                          <input
                            type="text"
                            value={regMiddle}
                            onChange={(e) => {
                              setRegMiddle(e.target.value);
                              if (registerError) {
                                setRegisterError(null);
                                setRegisterWarningFields([]);
                              }
                            }}
                            placeholder="Gabriel"
                            className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                              registerWarningFields.includes('regMiddle') 
                                ? 'border-red-500 ring-1 ring-red-500' 
                                : 'border-slate-200 dark:border-slate-800/80'
                            } p-2 text-xs focus:outline-none ${radius}`}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Last Name</label>
                          <input
                            type="text"
                            value={regLast}
                            onChange={(e) => {
                              setRegLast(e.target.value);
                              if (registerError) {
                                setRegisterError(null);
                                setRegisterWarningFields([]);
                              }
                            }}
                            placeholder="SHIRIMA"
                            className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                              registerWarningFields.includes('regLast') 
                                ? 'border-red-500 ring-1 ring-red-500' 
                                : 'border-slate-200 dark:border-slate-800/80'
                            } p-2 text-xs focus:outline-none ${radius}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Gender</label>
                          <select
                            value={regGender}
                            onChange={(e) => {
                              setRegGender(e.target.value);
                              if (registerError) {
                                setRegisterError(null);
                                setRegisterWarningFields([]);
                              }
                            }}
                            className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                              registerWarningFields.includes('regGender') 
                                ? 'border-red-500 ring-1 ring-red-500' 
                                : 'border-slate-200 dark:border-slate-800/80'
                            } p-2 text-xs focus:outline-none ${radius}`}
                          >
                            <option value="">Select Gender...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Registry No.</label>
                          <input
                            type="text"
                            value={regRegNo}
                            onChange={(e) => {
                              handleFormatRegNo(e.target.value, setRegRegNo);
                              if (registerError) {
                                setRegisterError(null);
                                setRegisterWarningFields([]);
                              }
                            }}
                            placeholder="YYYY-DD-NNNNN"
                            className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                              registerWarningFields.includes('regRegNo') 
                                ? 'border-red-500 ring-1 ring-red-500' 
                                : 'border-slate-200 dark:border-slate-800/80'
                            } p-2 text-xs font-mono focus:outline-none ${radius}`}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Course / Programme</label>
                          <select
                            value={regCourse}
                            onChange={(e) => {
                              setRegCourse(e.target.value);
                              if (registerError) {
                                setRegisterError(null);
                                setRegisterWarningFields([]);
                              }
                            }}
                            className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                              registerWarningFields.includes('regCourse') 
                                ? 'border-red-500 ring-1 ring-red-500' 
                                : 'border-slate-200 dark:border-slate-800/80'
                            } p-2 text-xs focus:outline-none ${radius}`}
                          >
                            <option value="">Select Programme...</option>
                            {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Registered Email</label>
                          <input
                            type="email"
                            value={regEmail}
                            onChange={(e) => {
                              setRegEmail(e.target.value);
                              if (registerError) {
                                setRegisterError(null);
                                setRegisterWarningFields([]);
                              }
                            }}
                            placeholder="student@muhas.ac.tz"
                            className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                              registerWarningFields.includes('regEmail') 
                                ? 'border-red-500 ring-1 ring-red-500' 
                                : 'border-slate-200 dark:border-slate-800/80'
                            } p-2 text-xs focus:outline-none ${radius}`}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">WhatsApp Phone</label>
                          <div className="flex gap-2">
                            <select
                              value={regCountryCode}
                              onChange={(e) => setRegCountryCode(e.target.value)}
                              className={`bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-2 text-xs ${radius}`}
                            >
                              <option value="+255">+255 (TZ)</option>
                              <option value="+254">+254 (KE)</option>
                              <option value="+256">+256 (UG)</option>
                            </select>
                            <input
                              type="tel"
                              value={regPhone}
                              onChange={(e) => {
                                setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 9));
                                if (registerError) {
                                  setRegisterError(null);
                                  setRegisterWarningFields([]);
                                }
                              }}
                              placeholder="7XXXXXXXX"
                              className={`flex-1 bg-slate-50 dark:bg-slate-950 border ${
                                registerWarningFields.includes('regPhone') 
                                  ? 'border-red-500 ring-1 ring-red-500' 
                                  : 'border-slate-200 dark:border-slate-800/80'
                              } p-2 text-xs font-mono focus:outline-none ${radius}`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Password</label>
                          <input
                            type="password"
                            value={regPassword}
                            onChange={(e) => {
                              setRegPassword(e.target.value);
                              if (registerError) {
                                setRegisterError(null);
                                setRegisterWarningFields([]);
                              }
                            }}
                            className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                              registerWarningFields.includes('regPassword') 
                                ? 'border-red-500 ring-1 ring-red-500' 
                                : 'border-slate-200 dark:border-slate-800/80'
                            } p-2 text-xs focus:outline-none ${radius}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Verify Password</label>
                          <input
                            type="password"
                            value={regPassword2}
                            onChange={(e) => {
                              setRegPassword2(e.target.value);
                              if (registerError) {
                                setRegisterError(null);
                                setRegisterWarningFields([]);
                              }
                            }}
                            className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                              registerWarningFields.includes('regPassword2') 
                                ? 'border-red-500 ring-1 ring-red-500' 
                                : 'border-slate-200 dark:border-slate-800/80'
                            } p-2 text-xs focus:outline-none ${radius}`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className={`w-full py-3 text-xs font-bold text-white bg-gradient-to-r ${accentGradient} ${radius} hover:shadow-lg transition-all active:scale-98`}
                      >
                        Create Student Account
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
          ) : (
            /* ========================================================
               APP WORKSPACE
               ======================================================== */
            <motion.div
              key="app-workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-4"
            >
              {/* Pinned Top Bar for Header & Ticker */}
              <div className="z-30 bg-slate-50/85 dark:bg-slate-950/85 backdrop-blur-md pb-3 space-y-3.5 border-b border-slate-200/50 dark:border-slate-800/40 shrink-0">
                {/* Header topbar */}
                <header className={`px-4 py-3.5 ${getGlassmorphismClass(config.glassmorphism)} ${radius} flex items-center justify-between shadow`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-tr ${accentGradient} text-white font-extrabold text-sm flex items-center justify-center shadow-md ${radius}`}>
                      {config.siteLogo ? (
                        <img src={config.siteLogo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        'MP'
                      )}
                    </div>
                    <div>
                      <h1 className="text-sm font-black text-slate-900 dark:text-slate-50 font-sans tracking-tight">
                        {config.siteName}
                      </h1>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider animate-pulse flex items-center gap-1">
                          Network Central · <span className="text-emerald-500 dark:text-emerald-400 font-extrabold animate-pulse">LIVE</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentUser.role === 'user' ? (
                      /* STUDENT SIDE BELL (Announcements & DMs) */
                      <button
                        onClick={() => setIsAnnouncementsOpen(true)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative"
                      >
                        <Bell className="w-5 h-5" />
                        {announcements.length > 0 && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                        )}
                      </button>
                    ) : (
                      /* ADMIN SIDE BELL (Staff Notifications queue) */
                      <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative"
                      >
                        <Bell className="w-5 h-5" />
                        {notifications.filter(n => n.audience === 'staff' && !n.seenBy.includes(currentUser.regNo)).length > 0 && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                        )}
                      </button>
                    )}

                    {/* Profile Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className={`w-9 h-9 shadow-sm ${radius} border border-slate-200 dark:border-slate-800 bg-gradient-to-tr ${accentGradient} flex items-center justify-center font-bold text-sm text-white shrink-0 overflow-hidden cursor-pointer`}
                      >
                        {currentUser.photo ? (
                          <img src={currentUser.photo} alt="P" className="w-full h-full object-cover" />
                        ) : (
                          currentUser.firstName[0].toUpperCase()
                        )}
                      </button>

                      <AnimatePresence>
                        {isProfileMenuOpen && (
                          <>
                            {/* Close blanket */}
                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-xl p-2 z-50 text-xs text-slate-700 dark:text-slate-200"
                            >
                              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${accentGradient} text-white font-bold flex items-center justify-center text-xs overflow-hidden`}>
                                  {currentUser.photo ? (
                                    <img src={currentUser.photo} alt="P" className="w-full h-full object-cover" />
                                  ) : (
                                    currentUser.firstName[0].toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold truncate text-slate-900 dark:text-slate-50">
                                    {currentUser.firstName} {currentUser.lastName}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono truncate">
                                    {currentUser.role}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  setIsProfileMenuOpen(false);
                                  setIsSettingsOpen(true);
                                }}
                                className="w-full text-left py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg font-bold flex items-center gap-2 mt-1"
                              >
                                <Settings className="w-4 h-4 text-slate-400" />
                                Settings
                              </button>

                              <button
                                onClick={() => {
                                  setIsProfileMenuOpen(false);
                                  setIsLogoutConfirmOpen(true);
                                }}
                                className="w-full text-left py-2 px-3 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg font-bold text-red-500 flex items-center gap-2"
                              >
                                <LogOut className="w-4 h-4" />
                                Log Out
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </header>

                {/* News crawling ticker */}
                {news.length > 0 && config.tickerSpeed !== 'paused' && (
                  <div className={`relative w-full py-2 bg-gradient-to-r ${accentGradient} text-white font-semibold text-xs rounded-full shadow overflow-hidden flex items-center`}>
                    <div className="absolute left-0 top-0 bottom-0 bg-slate-900 text-[9px] font-extrabold uppercase px-3.5 tracking-wider flex items-center rounded-l-full">
                      News Ticker
                    </div>
                    <div className="flex-1 overflow-hidden relative h-full flex items-center ml-24 pr-4">
                      <motion.div
                        animate={{
                          x: [300, -800],
                        }}
                        transition={{
                          duration: config.tickerSpeed === 'slow' ? 30 : config.tickerSpeed === 'fast' ? 12 : 20,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="whitespace-nowrap flex gap-12 font-mono text-[11px]"
                      >
                        {news.map((item, index) => (
                          <span key={index}>📢 {item}</span>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable Dashboard Viewport */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-6 pb-6 scrollbar-thin">
                {/* Main routing area */}
                {currentUser.role === 'user' ? (
                  <UserDashboard
                    currentUser={currentUser}
                    config={config}
                    allUsers={users}
                    reports={reports}
                    onSubmitReport={handleCreateReport}
                    onOpenAdminDirectory={() => setIsAdminDirectoryOpen(true)}
                    showToast={showToast}
                  />
                ) : (
                  <AdminDashboard
                    currentUser={currentUser}
                    config={config}
                    allUsers={users}
                    reports={reports}
                    passwordResets={passwordResets}
                    documents={documents}
                    onUpdateConfig={handleUpdateConfig}
                    onUpdateUserRole={handleUserRoleUpdate}
                    onAddAnnouncement={handleAddAnnouncement}
                    onAddNews={handleAddNews}
                    onRemoveNews={handleRemoveNews}
                    onReplyToReport={handleAdminReplyToReport}
                    onResolveReset={handleResolveResetRequest}
                    onDirectResetPassword={handleForceDirectReset}
                    onUploadDocument={handleUploadDocument}
                    onDeleteDocument={handleDeleteDocument}
                    showToast={showToast}
                  />
                )}

                {/* Footer sections */}
                <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800/80 pt-4 mt-6">
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter('');
                      setIsMaterialsOpen(true);
                    }}
                    className={`px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs ${radius} flex items-center gap-1.5`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-500" /> Browse materials
                  </button>
                  <button
                    onClick={() => setIsCommentsOpen(true)}
                    className={`px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs ${radius} flex items-center gap-1.5`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-500" /> Class comments
                  </button>
                </div>

                {/* Beautiful Light Mode Attractive Banner at the Bottom */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850/60 shadow-sm flex flex-col sm:flex-row items-center gap-6 overflow-hidden">
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-sans">
                      🎓 Shaping the Future of Healthcare
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      MUHAS Student Network connects medical, nursing, and allied health professionals across Tanzania. Stay informed, request password bypasses, collaborate anonymously, and submit support reports on welfare or academic logistics instantly.
                    </p>
                  </div>
                  <div className="w-full sm:w-48 h-28 rounded-xl overflow-hidden shrink-0 border border-slate-150/80 dark:border-slate-850">
                    <img 
                      src="/src/assets/images/muhas_portal_footer_1782656605453.jpg" 
                      alt="MUHAS Allied Students illustration" 
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Inline workspace footer */}
                <footer className="py-4 border-t border-slate-200/40 dark:border-slate-800/20 text-center text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wide">
                  © 2026 {config.siteName}. All rights reserved.
                </footer>
              </div>

              {/* Floating Chat action bubble (Students only) */}
              {currentUser.role === 'user' && (
                <motion.button
                  animate={{
                    y: [0, -10, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileHover={{ scale: 1.15, y: -12 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsChatOpen(true);
                  }}
                  className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr ${accentGradient} text-white flex items-center justify-center shadow-2xl shrink-0`}
                >
                  <MessageSquare className="w-6 h-6" />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        {!currentUser && (
          <footer className="py-4 border-t border-slate-200/40 dark:border-slate-800/20 text-center text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wide mt-auto">
            © 2026 {config.siteName}. All rights reserved.
          </footer>
        )}
      </div>

      {/* ========================================================
         MODAL WINDOW MODULES
         ======================================================== */}

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            currentUser={currentUser}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onUpdateUser={(updated) => {
              setUsers(prev => prev.map(u => u.regNo === currentUser!.regNo ? { ...u, ...updated } : u));
            }}
            allUsers={users}
            onRenameUser={handleRenameStudent}
            showToast={showToast}
            themeMode={themeMode}
            onThemeModeChange={handleThemeModeChange}
          />
        )}
      </AnimatePresence>

      {/* CHAT MODAL */}
      <AnimatePresence>
        {isChatOpen && (
          <ChatModal
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            currentUser={currentUser}
            config={config}
            allUsers={users}
            groupChat={groupChat}
            directChats={directChats}
            onSendChatMessage={handleSendChatMessage}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* ANNOUNCEMENTS MODAL (student) */}
      <AnimatePresence>
        {isAnnouncementsOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" onClick={() => setIsAnnouncementsOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-lg ${getGlassmorphismClass(config.glassmorphism)} ${radius} p-6 shadow-2xl max-h-[75vh] flex flex-col`}
            >
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Bells & Announcements
                  </h3>
                </div>
                <button onClick={() => setIsAnnouncementsOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {announcements.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    No announcements published. Check again later.
                  </div>
                ) : (
                  announcements.slice().reverse().map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150/50 dark:border-slate-800 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                        <span>ADMINISTRATOR</span>
                        <span>{item.time}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-medium">
                        {item.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYSTEM NOTIFICATIONS QUEUE MODAL (staff) */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" onClick={() => setIsNotificationsOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-lg ${getGlassmorphismClass(config.glassmorphism)} ${radius} p-6 shadow-2xl max-h-[75vh] flex flex-col`}
            >
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Audit Alerts & Logs
                  </h3>
                </div>
                <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {notifications.filter(n => n.audience === 'staff').length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    No notifications flagged. Core systems are quiet.
                  </div>
                ) : (
                  notifications
                    .filter(n => n.audience === 'staff')
                    .slice()
                    .reverse()
                    .map((item) => {
                      const isUnseen = !item.seenBy.includes(currentUser!.regNo);
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (isUnseen) {
                              setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, seenBy: [...n.seenBy, currentUser!.regNo] } : n));
                            }
                          }}
                          className={`p-4 ${isUnseen ? 'bg-red-50/50 dark:bg-red-950/10 border border-red-100' : 'bg-slate-50 dark:bg-slate-950 border border-slate-150'} rounded-xl space-y-1 cursor-pointer`}
                        >
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                            <span>{item.kind.toUpperCase()} FLAG</span>
                            <span>{item.time}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-medium">
                            {item.text}
                          </p>
                        </div>
                      );
                    })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MEET THE ADMINS (STUDENT DIRECTORY) MODAL */}
      <AnimatePresence>
        {isAdminDirectoryOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" onClick={() => setIsAdminDirectoryOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-md ${getGlassmorphismClass(config.glassmorphism)} ${radius} p-6 shadow-2xl max-h-[75vh] flex flex-col`}
            >
              <div className="flex justify-between items-center mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Desk Coordinators & Staff
                  </h3>
                </div>
                <button onClick={() => setIsAdminDirectoryOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {users
                  .filter(u => u.role === 'admin' || (u.role === 'programmer' && currentUser?.role !== 'user'))
                  .sort((a, b) => {
                    const roleOrder = { programmer: 1, admin: 2, user: 3 };
                    return roleOrder[a.role] - roleOrder[b.role];
                  })
                  .map((admin) => (
                    <div key={admin.regNo} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${accentGradient} text-white font-extrabold flex items-center justify-center shadow-inner overflow-hidden`}>
                        {admin.photo ? (
                          <img src={admin.photo} alt="P" className="w-full h-full object-cover" />
                        ) : (
                          admin.firstName[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                            {admin.firstName} {admin.lastName}
                          </h4>
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                            admin.role === 'programmer' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400'
                          }`}>
                            {admin.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Role: {admin.adminRole || (admin.role === 'programmer' ? 'Lead Architect' : 'Staff Admin')}
                        </p>
                      
                      {/* Direct action calls */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <a
                          href={`https://wa.me/${admin.countryCode.replace('+', '')}${admin.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 rounded"
                        >
                          WhatsApp
                        </a>
                        <a
                          href={`mailto:${admin.email}`}
                          className="px-2 py-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-150 rounded"
                        >
                          Email
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLASS COMMENTS FEEDBACK MODAL */}
      <AnimatePresence>
        {isCommentsOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" onClick={() => setIsCommentsOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-lg ${getGlassmorphismClass(config.glassmorphism)} ${radius} p-6 shadow-2xl max-h-[75vh] flex flex-col`}
            >
              <div className="flex justify-between items-center mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Class Feedback & Comments
                  </h3>
                </div>
                <button onClick={() => setIsCommentsOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Feed lists */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {comments.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No public feedback posted yet. Drop yours below!
                  </div>
                ) : (
                  comments.slice().reverse().map((comm) => {
                    const studentPic = users.find(u => u.regNo === comm.regNo)?.photo;
                    return (
                      <div key={comm.id} className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800 rounded-xl flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden`}>
                          {studentPic ? (
                            <img src={studentPic} alt="A" className="w-full h-full object-cover" />
                          ) : (
                            comm.name[0].toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <span>{comm.name}</span>
                            <span>{comm.time}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium font-sans">
                            {comm.text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input section */}
              {currentUser && (
                <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Contribute a constructive public feedback..."
                    className={`flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-2 text-xs focus:outline-none ${radius}`}
                  />
                  <button
                    onClick={handlePostComment}
                    className={`px-4 py-2 text-xs font-bold text-white ${accentBg} ${radius}`}
                  >
                    Post Comment
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LEARNING MATERIALS BROWSER SHEET */}
      <AnimatePresence>
        {isMaterialsOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" onClick={() => setIsMaterialsOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-lg ${getGlassmorphismClass(config.glassmorphism)} ${radius} p-6 shadow-2xl max-h-[75vh] flex flex-col`}
            >
              <div className="flex justify-between items-center mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Lectures & Materials Library
                  </h3>
                </div>
                <button onClick={() => setIsMaterialsOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter */}
              <div className="mb-3.5 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Class category:</span>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className={`flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-1.5 text-xs ${radius}`}
                >
                  <option value="">All Materials & Courses</option>
                  {DOCUMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5">
                {documents
                  .filter(d => !selectedCategoryFilter || d.category === selectedCategoryFilter)
                  .length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No academic materials found in this category slot.
                  </div>
                ) : (
                  documents
                    .filter(d => !selectedCategoryFilter || d.category === selectedCategoryFilter)
                    .slice()
                    .reverse()
                    .map((doc) => (
                      <div key={doc.id} className="p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center shrink-0 text-lg">
                            📄
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate pr-2">
                              {doc.title}
                            </h4>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-mono truncate">
                              {doc.category} · uploaded by {doc.uploadedBy}
                            </p>
                          </div>
                        </div>

                        <a
                          href={doc.dataUrl}
                          download={doc.fileName}
                          className={`p-2 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 hover:scale-105 active:scale-95 transition-all text-slate-500 rounded-full shrink-0`}
                          title="Download Document Attachment"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {isForgotPwdOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" onClick={() => setIsForgotPwdOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-md ${getGlassmorphismClass(config.glassmorphism)} ${radius} p-6 shadow-2xl`}
            >
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Bypass Request
                  </h3>
                </div>
                <button onClick={() => setIsForgotPwdOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Provide your registered credentials. On approval, coordinators will assign temporary key entries.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={forgotReg}
                    onChange={(e) => handleFormatRegNo(e.target.value, setForgotReg)}
                    placeholder="YYYY-DD-NNNNN"
                    className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs font-mono focus:outline-none ${radius}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Registered Email</label>
                  <input
                    type="email"
                    value={forgotMail}
                    onChange={(e) => setForgotMail(e.target.value)}
                    placeholder="student@muhas.ac.tz"
                    className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs focus:outline-none ${radius}`}
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 ${radius}`}
                >
                  Send Bypass Flag
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DIALOGS */}
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <ConfirmDialog
            isOpen={isLogoutConfirmOpen}
            onClose={() => setIsLogoutConfirmOpen(false)}
            onConfirm={handleLogOut}
            title="Log out of session?"
            message="You will need to supply your YYYY-DD-NNNNN registration credential next time."
            confirmText="Log Out"
            type="danger"
            config={config}
          />
        )}
      </AnimatePresence>

      {/* SMTP CONFIRMATION EMAILS */}
      <AnimatePresence>
        {simulatedEmail.isOpen && (
          <EmailPreviewModal
            isOpen={simulatedEmail.isOpen}
            onClose={() => setSimulatedEmail(prev => ({ ...prev, isOpen: false }))}
            email={simulatedEmail.to}
            subject={simulatedEmail.subject}
            bodyHtml={simulatedEmail.bodyHtml}
            config={config}
          />
        )}
      </AnimatePresence>

      {/* TOAST NOTICES DRAWER */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] space-y-2 pointer-events-none w-full max-w-xs sm:max-w-sm px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="p-3.5 bg-slate-900 text-white font-semibold text-xs text-center shadow-2xl rounded-xl border border-white/10 pointer-events-auto"
            >
              {toast.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
