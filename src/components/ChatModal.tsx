/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Send, Mic, MicOff, Paperclip, Image, FileText, 
  Video, Play, Pause, Headphones, Volume2, User, ChevronRight, Download
} from 'lucide-react';
import { User as UserType, SystemConfig, ChatMessage } from '../types';
import { 
  getAccentColorClass, 
  getBorderRadiusClass, 
  getGlassmorphismClass, 
  Waveform 
} from './CommonUI';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  config: SystemConfig;
  allUsers: UserType[];
  groupChat: ChatMessage[];
  directChats: Record<string, ChatMessage[]>;
  onSendChatMessage: (text: string, options?: Partial<ChatMessage>) => void;
  showToast: (msg: string) => void;
  onMarkAsRead?: (type: 'group' | 'direct', peerReg?: string) => void;
  unreadCounts?: {
    group: number;
    direct: Record<string, number>;
    total: number;
  };
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  config,
  allUsers,
  groupChat,
  directChats,
  onSendChatMessage,
  showToast,
  onMarkAsRead,
  unreadCounts
}) => {
  if (!isOpen || !currentUser) return null;

  const [chatType, setChatType] = useState<'group' | 'direct'>('group');
  const [selectedPeerReg, setSelectedPeerReg] = useState<string>('');
  const [textInput, setTextInput] = useState('');
  
  // Media Attachment Draft state
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    dataUrl: string;
    type: 'image' | 'video' | 'document';
  } | null>(null);

  // Audio Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real Audio Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Real Voice Messages Playback state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voicePlaybackProgress, setVoicePlaybackProgress] = useState<Record<string, number>>({});
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Styling
  const radius = getBorderRadiusClass(config.borderRadius);
  const accentText = getAccentColorClass(config.colorAccent, 'text');
  const accentBg = getAccentColorClass(config.colorAccent, 'bg');
  const accentGradient = getAccentColorClass(config.colorAccent, 'from-to');

  const peerUsers = [...allUsers]
    .filter(u => u.regNo !== currentUser.regNo)
    .filter(u => u.role !== 'programmer' || currentUser.role !== 'user')
    .sort((a, b) => {
      const roleOrder = { programmer: 1, admin: 2, user: 3 };
      return roleOrder[a.role] - roleOrder[b.role];
    });

  // DM Key Generator (sorted regNos)
  const getDMKey = (regA: string, regB: string) => {
    return [regA, regB].sort().join('|');
  };

  // Chat message list to render
  const messagesToRender = chatType === 'group' 
    ? groupChat 
    : (selectedPeerReg ? (directChats[getDMKey(currentUser.regNo, selectedPeerReg)] || []) : []);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesToRender, chatType, selectedPeerReg]);

  // Mark messages as read
  useEffect(() => {
    if (onMarkAsRead) {
      if (chatType === 'group') {
        onMarkAsRead('group');
      } else if (chatType === 'direct' && selectedPeerReg) {
        onMarkAsRead('direct', selectedPeerReg);
      }
    }
  }, [chatType, selectedPeerReg, messagesToRender.length, onMarkAsRead]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordDuration(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSendChatMessage(`🎤 Voice message (${formatTimer(recordDuration)})`, {
            voiceUrl: base64Audio,
            voiceDuration: recordDuration,
            name: currentUser.chatAlias || `${currentUser.firstName} ${currentUser.lastName}`,
            toRegNo: chatType === 'direct' ? selectedPeerReg : undefined
          });
          showToast("Voice message recorded and sent!");
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast("🎤 Microphone active. Recording voice memo...");
    } catch (err) {
      console.error("Microphone access error:", err);
      showToast("❌ Could not access microphone. Please grant permission.");
    }
  };

  const handleStopRecordingAndSend = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      setIsRecording(false);
      return;
    }
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    };
  }, []);

  const handlePlayVoice = (msgId: string, voiceUrl: string, duration: number) => {
    if (playingVoiceId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      setPlayingVoiceId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);

    setPlayingVoiceId(msgId);

    const startSimulatedPlayback = () => {
      setVoicePlaybackProgress(prev => ({ ...prev, [msgId]: 0 }));
      let elapsed = 0;
      voiceTimerRef.current = setInterval(() => {
        elapsed += 0.25;
        const pct = Math.min((elapsed / duration) * 100, 100);
        setVoicePlaybackProgress(prev => ({ ...prev, [msgId]: pct }));
        if (elapsed >= duration) {
          setPlayingVoiceId(null);
          if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
        }
      }, 250);
    };

    if (voiceUrl && voiceUrl.startsWith('data:audio')) {
      try {
        const audio = new Audio(voiceUrl);
        activeAudioRef.current = audio;

        audio.ontimeupdate = () => {
          const pct = (audio.currentTime / audio.duration) * 100;
          setVoicePlaybackProgress(prev => ({ ...prev, [msgId]: pct || 0 }));
        };

        audio.onended = () => {
          setPlayingVoiceId(null);
          setVoicePlaybackProgress(prev => ({ ...prev, [msgId]: 100 }));
        };

        audio.onerror = () => {
          console.warn("Audio playback failed (onerror), falling back to visual simulation.");
          activeAudioRef.current = null;
          startSimulatedPlayback();
        };

        audio.play().catch(err => {
          console.warn("Audio playback failed (catch), falling back to visual simulation:", err);
          activeAudioRef.current = null;
          startSimulatedPlayback();
        });
      } catch (err) {
        console.warn("Audio creation failed, falling back to visual simulation:", err);
        startSimulatedPlayback();
      }
    } else {
      startSimulatedPlayback();
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: 'image' | 'video' | 'document' = 'document';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAttachedFile({
        name: file.name,
        dataUrl,
        type
      });
      showToast(`📎 Draft attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = () => {
    if (!textInput.trim() && !attachedFile) return;

    const aliasName = currentUser.chatAlias || `${currentUser.firstName} ${currentUser.lastName}`;

    const attachmentOptions: Partial<ChatMessage> = {
      name: aliasName,
      toRegNo: chatType === 'direct' ? selectedPeerReg : undefined,
    };

    if (attachedFile) {
      attachmentOptions.attachmentName = attachedFile.name;
      attachmentOptions.attachmentData = attachedFile.dataUrl;
      attachmentOptions.attachmentType = attachedFile.type;
    }

    onSendChatMessage(textInput, attachmentOptions);
    setTextInput('');
    setAttachedFile(null);
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

      {/* Main chat viewport */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 26, stiffness: 190 }}
        className={`relative w-full max-w-xl h-[88vh] sm:h-[75vh] ${getGlassmorphismClass(config.glassmorphism)} ${radius} sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden`}
      >
        {/* Mobile handle puller */}
        <div className="w-12 h-1 ml-auto mr-auto my-3 bg-slate-300 dark:bg-slate-700 rounded-full sm:hidden" />

        {/* Topbar of Chat */}
        <div className="px-6 pb-4 pt-2 sm:pt-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 font-sans tracking-tight">
                PULSE Student Chatrooms
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Connect anonymously or use your profile alias to communicate.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Tab Selector */}
        <div className="px-6 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setChatType('group')}
              className={`py-1.5 px-3.5 text-xs font-bold transition-all ${radius} relative flex items-center gap-1.5 ${
                chatType === 'group'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-50'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              🌐 General Group Lobby
              {unreadCounts && unreadCounts.group > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-red-500 rounded-full leading-none">
                  {unreadCounts.group}
                </span>
              )}
            </button>
            <button
              onClick={() => setChatType('direct')}
              className={`py-1.5 px-3.5 text-xs font-bold transition-all ${radius} relative flex items-center gap-1.5 ${
                chatType === 'direct'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-50'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              👤 Direct Message DMs
              {unreadCounts && (Object.values(unreadCounts.direct) as number[]).reduce((a, b) => a + b, 0) > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-red-500 rounded-full leading-none">
                  {(Object.values(unreadCounts.direct) as number[]).reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Direct chat select peer dropdown */}
        {chatType === 'direct' && (
          <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2 bg-slate-50/20 dark:bg-slate-950/10 flex-shrink-0">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Recipient:</span>
            <select
              value={selectedPeerReg}
              onChange={(e) => setSelectedPeerReg(e.target.value)}
              className={`flex-1 bg-white dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-800 text-xs ${radius} focus:outline-none`}
            >
              <option value="">Select a user to message...</option>
              {peerUsers.map(u => {
                const roleLabel = u.role === 'programmer' ? '[Dev]' : u.role === 'admin' ? '[Admin]' : '[Student]';
                const unreadCount = unreadCounts?.direct[u.regNo] || 0;
                const unreadSuffix = unreadCount > 0 ? ` 🔴 (${unreadCount} unread)` : '';
                return (
                  <option key={u.regNo} value={u.regNo}>
                    {roleLabel} {u.chatAlias || `${u.firstName} ${u.lastName}`} — ({u.regNo}){unreadSuffix}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Messaging window */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-slate-950/15">
          <AnimatePresence mode="popLayout">
            {chatType === 'direct' && !selectedPeerReg ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xl mb-3">
                  💬
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Start 1-on-1 Chat</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Pick a classmate from the dropdown above to engage in a secure, instant, private conversation.
                </p>
              </motion.div>
            ) : messagesToRender.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xl mb-3">
                  👋
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Messages Yet</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Say hello, record a voice note, or drop a study document!
                </p>
              </motion.div>
            ) : (
              messagesToRender.map((msg, i) => {
                const isMine = chatType === 'group' 
                  ? msg.regNo === currentUser.regNo 
                  : msg.fromRegNo === currentUser.regNo;

                const senderPic = allUsers.find(u => u.regNo === (chatType === 'group' ? msg.regNo : msg.fromRegNo))?.photo;

                const isVoice = !!msg.voiceUrl;
                const progress = voicePlaybackProgress[msg.id] || 0;
                const isPlaying = playingVoiceId === msg.id;

                const isImage = msg.attachmentType === 'image';
                const isVideo = msg.attachmentType === 'video';
                const isDoc = msg.attachmentType === 'document';

                const bStyle = config.chatBubbleStyle;
                const roundedClasses = bStyle === 'pill'
                  ? (isMine ? 'rounded-3xl rounded-br-none' : 'rounded-3xl rounded-bl-none')
                  : bStyle === 'rounded'
                  ? (isMine ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm')
                  : (isMine ? 'rounded-lg rounded-tr-none' : 'rounded-lg rounded-tl-none');

                return (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    className={`flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}
                  >
                    {/* User Avatar Circle */}
                    <div className={`w-8 h-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden`}>
                      {senderPic ? (
                        <img src={senderPic} alt="S" className="w-full h-full object-cover" />
                      ) : (
                        msg.name[0].toUpperCase()
                      )}
                    </div>

                    <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {/* Name Label */}
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 px-1">
                        {isMine ? 'You' : msg.name}
                      </span>

                      {/* Bubble block */}
                      <div className={`px-4 py-2.5 shadow-sm text-sm ${roundedClasses} ${
                        isMine 
                          ? `bg-gradient-to-r ${accentGradient} text-white`
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      }`}>
                        
                        {/* Render standard text if not voice */}
                        {!isVoice && <p className="leading-relaxed break-words">{msg.text}</p>}

                        {/* VOICE BUBBLE */}
                        {isVoice && (
                          <div className="flex items-center gap-3 py-1 pr-1">
                            <button
                              onClick={() => handlePlayVoice(msg.id, msg.voiceUrl || '', msg.voiceDuration || 3)}
                              className={`w-9 h-9 rounded-full ${isMine ? 'bg-white text-slate-800' : `${accentBg} text-white`} flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 shadow`}
                            >
                              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                            </button>
                            <div className="flex-1 min-w-[120px] space-y-1">
                              <div className="flex items-center justify-between text-[10px] opacity-75">
                                <span className="font-semibold inline-flex items-center gap-1">
                                  <Headphones className="w-3 h-3" /> Voice Memo
                                </span>
                                <span>{msg.voiceDuration ? formatTimer(msg.voiceDuration) : '0:03'}</span>
                              </div>
                              {/* Audio Progress Slider */}
                              <div className="w-full bg-slate-200/40 dark:bg-slate-800/40 h-[4px] rounded-full overflow-hidden relative">
                                <div 
                                  className={`h-full ${isMine ? 'bg-white' : accentBg} rounded-full`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* IMAGE ATTACHMENT */}
                        {isImage && msg.attachmentData && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-slate-100/10 shadow-sm max-w-[240px]">
                            <img src={msg.attachmentData} alt="Shared file" className="w-full h-auto object-cover max-h-[160px]" />
                            <div className="p-1.5 bg-black/40 text-[10px] text-white flex justify-between items-center">
                              <span className="truncate max-w-[160px] font-mono font-medium">{msg.attachmentName}</span>
                              <a href={msg.attachmentData} download={msg.attachmentName} className="hover:text-emerald-400">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* VIDEO ATTACHMENT */}
                        {isVideo && msg.attachmentData && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-slate-100/10 shadow-sm max-w-[240px] relative">
                            <div className="relative max-h-[140px] bg-slate-950 flex items-center justify-center">
                              {/* Simulated visual media player thumbnail */}
                              <div className="w-full h-[120px] opacity-60 bg-slate-900 flex items-center justify-center text-white">
                                <Video className="w-8 h-8 opacity-50" />
                              </div>
                              <button className="absolute w-12 h-12 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur flex items-center justify-center text-white border border-white/20">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </button>
                            </div>
                            <div className="p-1.5 bg-black/40 text-[10px] text-white flex justify-between items-center">
                              <span className="truncate max-w-[160px] font-mono font-medium">{msg.attachmentName}</span>
                              <a href={msg.attachmentData} download={msg.attachmentName} className="hover:text-emerald-400">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* DOCUMENT ATTACHMENT */}
                        {isDoc && msg.attachmentData && (
                          <div className="mt-2 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-3 shadow-inner">
                            <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-500 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-mono">
                                {msg.attachmentName}
                              </div>
                              <div className="text-[9px] text-slate-400">Document PDF / PPTX</div>
                            </div>
                            <a
                              href={msg.attachmentData}
                              download={msg.attachmentName}
                              className={`w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500`}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}

                      </div>

                      {/* Time stamp */}
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1 font-mono">
                        {msg.time}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Media Draft Panel */}
        {attachedFile && (
          <div className="px-6 py-2 bg-slate-100/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              {attachedFile.type === 'image' && <Image className="w-4 h-4 text-emerald-400" />}
              {attachedFile.type === 'video' && <Video className="w-4 h-4 text-purple-400" />}
              {attachedFile.type === 'document' && <FileText className="w-4 h-4 text-blue-400" />}
              <span className="font-mono max-w-[200px] truncate">{attachedFile.name}</span>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input box row */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            
            {/* Attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all"
              title="Attach File (Image, Video, Document)"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileAttach}
              className="hidden"
            />

            {/* Simulated Microphone Recording interface */}
            {isRecording ? (
              <div className="flex-1 bg-red-50 dark:bg-red-950/20 px-4 py-2 border border-red-100 dark:border-red-900/50 rounded-full flex items-center justify-between gap-4 h-[44px]">
                <div className="flex items-center gap-2 text-red-500 font-semibold text-xs animate-pulse">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  Recording Voice Memo ({formatTimer(recordDuration)})
                </div>
                <Waveform isRecording={isRecording} accent="coral" />
                <button
                  onClick={handleStopRecordingAndSend}
                  className="bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold py-1 px-3 rounded-full flex items-center gap-1 transition-all"
                >
                  <MicOff className="w-3.5 h-3.5" /> Send Voice
                </button>
              </div>
            ) : (
              // Standard message input
              <>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  disabled={chatType === 'direct' && !selectedPeerReg}
                  placeholder={
                    chatType === 'direct' && !selectedPeerReg
                      ? "Select a peer above to unlock chat..."
                      : "Type your class message..."
                  }
                  className={`flex-1 bg-slate-50 dark:bg-slate-950 p-2.5 px-4 border border-slate-200 dark:border-slate-800/80 rounded-full text-sm focus:outline-none focus:border-emerald-500`}
                />

                {/* Voice Record trigger */}
                <button
                  onClick={handleStartRecording}
                  disabled={chatType === 'direct' && !selectedPeerReg}
                  className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all shrink-0"
                  title="Record Voice Clip"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Send trigger */}
            <button
              onClick={handleSendMessage}
              disabled={(chatType === 'direct' && !selectedPeerReg) || isRecording}
              className={`w-11 h-11 rounded-full ${accentBg} text-white flex items-center justify-center shadow-md shrink-0 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50`}
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
