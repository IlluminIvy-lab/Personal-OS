import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Twitter,
  X,
  Camera,
  Check,
  Save,
  Trash2,
  ExternalLink,
  Sparkles,
  Shield,
  Edit3,
} from 'lucide-react';
import { UserProfile } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (newProfile: UserProfile) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [activeTab, setActiveTab] = useState<'profile' | 'socials' | 'avatar'>('profile');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (socialKey: keyof UserProfile['socials'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      socials: {
        ...prev.socials,
        [socialKey]: value,
      },
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleChange('avatarUrl', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-[#0a0a18] border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] glow-cyan"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-black border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-mono shadow-sm">
              <User className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-wider text-white font-mono uppercase flex items-center gap-2">
                USER_PROFILE <span className="text-xs text-cyan-400 font-normal">Settings & Identity</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">Manage account, contact information, & social links</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/10 bg-black/40 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold transition-all ${
              activeTab === 'profile'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4 text-cyan-400" /> General Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('socials')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold transition-all ${
              activeTab === 'socials'
                ? 'border-purple-400 text-purple-300 bg-purple-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4 text-purple-400" /> Socials & Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('avatar')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold transition-all ${
              activeTab === 'avatar'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-400" /> Avatar & Picture
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Preview Banner */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={formData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                alt={formData.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-md group-hover:opacity-90 transition-all"
              />
              <button
                type="button"
                onClick={() => setActiveTab('avatar')}
                className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-cyan-500 text-slate-950 font-bold shadow hover:scale-110 transition-transform"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <h3 className="text-base font-bold text-white font-sans">{formData.name || 'Anonymous User'}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 inline-block w-fit mx-auto sm:mx-0">
                  @{formData.username || 'user'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{formData.bio || 'Personal OS User'}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-cyan-400" /> {formData.email}
                </span>
                {formData.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-purple-400" /> {formData.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tab 1: General Info */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g. Antonio Shaw"
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-sans"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className="text-slate-500 font-mono text-sm absolute left-3 top-2.5">@</span>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      placeholder="shawantonio"
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  Executive Tagline / Bio
                </label>
                <div className="relative">
                  <Edit3 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="e.g. Personal OS Executive & Product Designer"
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="shawantonio@gmail.com"
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-sans"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    Role / Title
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.roleTitle || ''}
                      onChange={(e) => handleChange('roleTitle', e.target.value)}
                      placeholder="e.g. Lead OS Architect"
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    Emergency Contact / Office Ops
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.emergencyContact || ''}
                      onChange={(e) => handleChange('emergencyContact', e.target.value)}
                      placeholder="e.g. +1 (555) 911-0012"
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Socials & External Links */}
          {activeTab === 'socials' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  GitHub Profile URL
                </label>
                <div className="relative">
                  <Github className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={formData.socials.github}
                    onChange={(e) => handleSocialChange('github', e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  LinkedIn Profile URL
                </label>
                <div className="relative">
                  <Linkedin className="w-4 h-4 text-blue-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={formData.socials.linkedin}
                    onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/yourusername"
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  Twitter / X Profile URL
                </label>
                <div className="relative">
                  <Twitter className="w-4 h-4 text-sky-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={formData.socials.twitter}
                    onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/yourusername"
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  Personal Website / Portfolio
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={formData.socials.website}
                    onChange={(e) => handleSocialChange('website', e.target.value)}
                    placeholder="https://yourwebsite.dev"
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    YouTube Channel URL
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-rose-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={formData.socials.youtube || ''}
                      onChange={(e) => handleSocialChange('youtube', e.target.value)}
                      placeholder="https://youtube.com/@channel"
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    Instagram Handle / URL
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-pink-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={formData.socials.instagram || ''}
                      onChange={(e) => handleSocialChange('instagram', e.target.value)}
                      placeholder="https://instagram.com/username"
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    Medium / Blog URL
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={formData.socials.medium || ''}
                      onChange={(e) => handleSocialChange('medium', e.target.value)}
                      placeholder="https://medium.com/@username"
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                    Discord Server / Profile
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-indigo-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={formData.socials.discord || ''}
                      onChange={(e) => handleSocialChange('discord', e.target.value)}
                      placeholder="https://discord.gg/yourserver"
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Active Links Badge Grid */}
              <div className="pt-2">
                <p className="text-xs font-mono text-slate-400 mb-2">Connected Channels (Tap to open in phone browser):</p>
                <div className="flex flex-wrap gap-2">
                  {formData.socials.github && (
                    <a
                      href={formData.socials.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Github className="w-3.5 h-3.5 text-white" /> GitHub <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  )}
                  {formData.socials.linkedin && (
                    <a
                      href={formData.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-500/30 hover:border-blue-400 text-xs font-mono text-blue-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-blue-400" /> LinkedIn <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  )}
                  {formData.socials.twitter && (
                    <a
                      href={formData.socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-sky-950/40 border border-sky-500/30 hover:border-sky-400 text-xs font-mono text-sky-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Twitter className="w-3.5 h-3.5 text-sky-400" /> Twitter/X <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  )}
                  {formData.socials.website && (
                    <a
                      href={formData.socials.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-400 text-xs font-mono text-emerald-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-400" /> Website <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  )}
                  {formData.socials.youtube && (
                    <a
                      href={formData.socials.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 hover:border-rose-400 text-xs font-mono text-rose-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-rose-400" /> YouTube <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  )}
                  {formData.socials.instagram && (
                    <a
                      href={formData.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-pink-950/40 border border-pink-500/30 hover:border-pink-400 text-xs font-mono text-pink-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-pink-400" /> Instagram <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  )}
                  {formData.socials.medium && (
                    <a
                      href={formData.socials.medium}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-400 text-xs font-mono text-emerald-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-400" /> Medium <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  )}
                  {formData.socials.discord && (
                    <a
                      href={formData.socials.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 hover:border-indigo-400 text-xs font-mono text-indigo-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-400" /> Discord <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Avatar & Picture */}
          {activeTab === 'avatar' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-2">
                  Upload Profile Picture
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shadow-sm transition-all">
                    <Camera className="w-4 h-4" /> Upload Image File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400 font-mono">PNG, JPG, or WEBP</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-2">
                  Or Paste Custom Image URL
                </label>
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => handleChange('avatarUrl', e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-2">
                  Or Choose from Presets
                </label>
                <div className="flex items-center gap-3">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChange('avatarUrl', preset)}
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                        formData.avatarUrl === preset
                          ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                          : 'border-white/10 hover:border-white/40'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${idx}`} className="w-12 h-12 object-cover" />
                      {formData.avatarUrl === preset && (
                        <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-cyan-300 drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            {isSavedNotice ? (
              <span className="flex items-center gap-2 text-xs font-mono text-emerald-400 animate-pulse">
                <Check className="w-4 h-4" /> Profile Updated & Saved!
              </span>
            ) : (
              <span className="text-xs font-mono text-slate-400">
                Data saved locally in browser storage
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 border border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs font-mono flex items-center gap-2 shadow-md transition-all glow-cyan"
              >
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
