/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  regNo: string;
  course: string;
  email: string;
  countryCode: string;
  phone: string;
  password?: string;
  role: 'user' | 'admin' | 'programmer';
  photo: string | null;
  chatAlias?: string; // name used during chat
  adminRole?: string;  // e.g. "CR", "Head of Department" to be seen by students
}

export interface Report {
  id: string;
  regNo: string;
  name: string;
  sector: 'health' | 'academic' | 'social';
  text: string;
  time: string;
  status: 'pending' | 'answered';
  reply: string | null;
  replyTime: string | null;
  attachmentName: string | null;
  attachmentData: string | null;
}

export interface Announcement {
  id: string;
  text: string;
  time: string;
}

export interface PasswordReset {
  id: string;
  regNo: string;
  name: string;
  email: string;
  time: string;
  status: 'pending' | 'resolved';
  resolvedTime: string | null;
}

export interface SystemNotification {
  id: string;
  audience: 'staff' | string; // 'staff' means all admin/programmer, or individual student regNo
  kind: 'health' | 'academic' | 'social' | 'reset' | 'role' | 'reply' | 'announce' | 'general';
  text: string;
  time: string;
  seenBy: string[]; // List of user regNos who have viewed it
}

export interface ChatMessage {
  id: string;
  regNo?: string; // used for group chat
  fromRegNo?: string; // used for DM
  toRegNo?: string; // used for DM
  name: string;
  text: string;
  time: string;
  voiceUrl?: string; // simulated recorded audio data URL
  voiceDuration?: number; // duration in seconds
  attachmentName?: string;
  attachmentData?: string;
  attachmentType?: 'image' | 'video' | 'document';
}

export interface Comment {
  id: string;
  regNo: string;
  name: string;
  text: string;
  time: string;
}

export interface DocumentMaterial {
  id: string;
  title: string;
  category: string;
  uploadedBy: string;
  time: string;
  fileName: string;
  dataUrl: string;
}

export interface SystemConfig {
  colorAccent: 'coral' | 'teal' | 'amber' | 'violet' | 'royal';
  borderRadius: 'none' | 'subtle' | 'smooth' | 'rounded' | 'bendy';
  glassmorphism: 'none' | 'subtle' | 'frosted';
  tickerSpeed: 'slow' | 'medium' | 'fast' | 'paused';
  layoutWidth: 'compact' | 'default' | 'wide';
  fontSize: 'small' | 'default' | 'large';
  particleBg: boolean;
  soundToggle: boolean;
  maintenanceMode: boolean;
  notificationSound: 'classic' | 'modern' | 'scifi' | 'mute';
  chatBubbleStyle: 'classic' | 'rounded' | 'pill';
  customGreeting: string;
  allowMultipleProgrammers: boolean;
  siteName: string;
  siteLogo: string | null;
  sickReportTemplateName?: string | null;
  sickReportTemplateUrl?: string | null;
  programmerGithub?: string | null;
  programmerLinkedin?: string | null;
  programmerTwitter?: string | null;
  programmerWebsite?: string | null;
}
