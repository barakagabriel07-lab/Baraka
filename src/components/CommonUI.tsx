/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, FileText, Mail } from 'lucide-react';
import { SystemConfig } from '../types';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'success' | 'info';
  config: SystemConfig;
  children?: React.ReactNode;
}

export const getAccentColorClass = (accent: SystemConfig['colorAccent'], type: 'bg' | 'text' | 'border' | 'from-to' | 'hoverBg' | 'focusRing') => {
  const mapping = {
    coral: {
      bg: 'bg-red-500',
      text: 'text-red-500',
      border: 'border-red-500',
      'from-to': 'from-red-500 to-rose-600',
      hoverBg: 'hover:bg-red-600',
      focusRing: 'focus:ring-red-400',
    },
    teal: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-500',
      border: 'border-emerald-500',
      'from-to': 'from-emerald-500 to-teal-600',
      hoverBg: 'hover:bg-emerald-600',
      focusRing: 'focus:ring-emerald-400',
    },
    amber: {
      bg: 'bg-amber-500',
      text: 'text-amber-500',
      border: 'border-amber-500',
      'from-to': 'from-amber-500 to-orange-600',
      hoverBg: 'hover:bg-amber-600',
      focusRing: 'focus:ring-amber-400',
    },
    violet: {
      bg: 'bg-purple-600',
      text: 'text-purple-600',
      border: 'border-purple-600',
      'from-to': 'from-purple-600 to-violet-700',
      hoverBg: 'hover:bg-purple-700',
      focusRing: 'focus:ring-purple-400',
    },
    royal: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-600',
      'from-to': 'from-blue-600 to-indigo-700',
      hoverBg: 'hover:bg-blue-700',
      focusRing: 'focus:ring-blue-400',
    },
  };
  return mapping[accent]?.[type] || mapping['teal'][type];
};

export const getBorderRadiusClass = (radius: SystemConfig['borderRadius']) => {
  switch (radius) {
    case 'none': return 'rounded-none';
    case 'subtle': return 'rounded-sm';
    case 'smooth': return 'rounded-lg';
    case 'rounded': return 'rounded-2xl';
    case 'bendy': return 'rounded-[30px]';
    default: return 'rounded-lg';
  }
};

export const getGlassmorphismClass = (glass: SystemConfig['glassmorphism']) => {
  switch (glass) {
    case 'none': return 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800';
    case 'subtle': return 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50';
    case 'frosted': return 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/40 shadow-xl';
    default: return 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20';
  }
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  config,
  children
}) => {
  if (!isOpen) return null;

  const accentColor = getAccentColorClass(config.colorAccent, 'bg');
  const accentGradient = getAccentColorClass(config.colorAccent, 'from-to');
  const radius = getBorderRadiusClass(config.borderRadius);

  let iconBg = 'bg-slate-100 dark:bg-slate-800 text-slate-500';
  if (type === 'danger') iconBg = 'bg-red-100 dark:bg-red-950/50 text-red-500';
  if (type === 'success') iconBg = 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-500';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
      />

      {/* Box */}
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className={`relative w-full max-w-md ${getGlassmorphismClass(config.glassmorphism)} ${radius} p-6 overflow-hidden`}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 ${iconBg} ${radius} flex items-center justify-center text-xl mb-4 font-bold`}>
            {type === 'danger' ? '🚪' : type === 'success' ? '✨' : '📝'}
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 font-sans tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-body">
            {message}
          </p>

          {children && (
            <div className="w-full mt-4 text-left max-h-[220px] overflow-y-auto pr-1">
              {children}
            </div>
          )}

          <div className="flex items-center gap-3 w-full mt-6">
            <button
              onClick={onClose}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 ${radius} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-98`}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold text-white ${radius} bg-gradient-to-r ${type === 'danger' ? 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700' : accentGradient} hover:shadow-lg transition-all active:scale-98`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  subject: string;
  bodyHtml: string;
  config: SystemConfig;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  email,
  subject,
  bodyHtml,
  config
}) => {
  if (!isOpen) return null;

  const radius = getBorderRadiusClass(config.borderRadius);
  const accentGradient = getAccentColorClass(config.colorAccent, 'from-to');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
      />

      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        className={`relative w-full max-w-lg ${getGlassmorphismClass(config.glassmorphism)} ${radius} p-6`}
      >
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Mail className={`w-5 h-5 ${getAccentColorClass(config.colorAccent, 'text')}`} />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 font-sans">
              Simulated Email Sent
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 bg-slate-50 dark:bg-slate-950 p-2 rounded-md border border-slate-200/50 dark:border-slate-800/40">
          ⚠️ This is a visual simulation to confirm SMTP operations. No real mail server has been integrated to avoid domain reputation fees.
        </p>

        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 font-mono text-xs space-y-2 text-slate-800 dark:text-slate-200 max-h-[300px] overflow-y-auto">
          <div><span className="text-slate-400">To:</span> <span className="font-semibold">{email}</span></div>
          <div><span className="text-slate-400">From:</span> no-reply@{(config?.siteName || '').toLowerCase().replace(/\s+/g, '') || 'muhaspulse'}.app</div>
          <div className="border-b border-slate-200/60 dark:border-slate-800 pb-2"><span className="text-slate-400">Subject:</span> <span className="font-semibold">{subject}</span></div>
          <div className="pt-2 font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className={`w-full py-2 px-4 text-center font-semibold text-white ${radius} bg-gradient-to-r ${accentGradient} transition-all active:scale-98`}
          >
            Acknowledge & Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const SoundEffects = {
  play: (soundName: SystemConfig['notificationSound']) => {
    if (soundName === 'mute') return;
    try {
      // Create synthesis on the fly so it works reliably in any browser environment without external files!
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!ctx) return;

      if (soundName === 'classic') {
        // High-pitched classic double-beep
        const osc1 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc1.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.1);

        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880, ctx.currentTime);
          gain2.gain.setValueAtTime(0.1, ctx.currentTime);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.1);
        }, 120);
      } else if (soundName === 'modern') {
        // Melodic warm modern digital chime
        const osc1 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc1.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.3);
      } else if (soundName === 'scifi') {
        // Cosmic ascending bubble frequency sound
        const osc1 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(100, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc1.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Audio Context sound blocked or not supported yet:", e);
    }
  }
};

interface WaveformProps {
  isRecording: boolean;
  accent: SystemConfig['colorAccent'];
}

export const Waveform: React.FC<WaveformProps> = ({ isRecording, accent }) => {
  const bars = Array.from({ length: 15 });
  const bgAccent = getAccentColorClass(accent, 'bg');

  return (
    <div className="flex items-end justify-center gap-[3px] h-8 w-28 py-1">
      {bars.map((_, i) => {
        const delay = i * 0.08;
        return (
          <motion.div
            key={i}
            animate={
              isRecording
                ? {
                    height: [
                      '15%',
                      i % 3 === 0 ? '90%' : i % 2 === 0 ? '60%' : '40%',
                      '15%',
                    ],
                  }
                : { height: '15%' }
            }
            transition={
              isRecording
                ? {
                    repeat: Infinity,
                    duration: 0.8,
                    delay: delay,
                    ease: 'easeInOut',
                  }
                : {}
            }
            className={`w-[4px] rounded-full ${bgAccent} opacity-85`}
            style={{ height: '15%' }}
          />
        );
      })}
    </div>
  );
};
