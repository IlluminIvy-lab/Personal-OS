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
  Camera,
  Check,
  Save,
  ExternalLink,
  Shield,
  Edit3,
  Sparkles,
  Link,
  Share2,
  Cloud,
  Zap,
} from 'lucide-react';
import { UserProfile, CloudflareMcpConfig } from '../types';
import { AutoLinkText } from './AutoLinkText';

interface UserProfileTabProps {
  profile: UserProfile;
  onSaveProfile: (newProfile: UserProfile) => void;
  cloudflareConfig?: CloudflareMcpConfig;
  onOpenCloudflareModal?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
];

export const UserProfileTab: React.FC<UserProfileTabProps> = ({
  profile,
  onSaveProfile,
  cloudflareConfig,
  onOpenCloudflareModal,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'socials' | 'avatar'>('profile');

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
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Executive User Card Header */}
      <div className="bg-gradient-to-r from-slate-900/90 via-[#0e1122] to-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden glow-cyan">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar with live badge */}
          <div className="relative group shrink-0">
            <img
              src={formData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
              alt={formData.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-cyan-400 shadow-xl group-hover:scale-105 transition-all duration-300"
            />
            <label
              title="Upload New Photo"
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg cursor-pointer transition-transform hover:scale-110"
            >
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide font-sans">
                  {formData.name || 'Anonymous User'}
                </h1>
                <p className="text-xs font-mono text-cyan-400 font-semibold mt-0.5">
                  @{formData.username} • {formData.roleTitle || 'Executive User'}
                </p>
              </div>

              <div className="flex items-center justify-center sm:justify-end gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Verified Identity
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              <AutoLinkText text={formData.bio || 'Personal OS Architect & Executive Strategist'} />
            </p>

            {/* Quick Contact Chips */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" /> {formData.email}
              </span>
              {formData.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-purple-400" /> {formData.phone}
                </span>
              )}
              {formData.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {formData.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Social Links Quick Access Bar (Clickable directly to phone default browser) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" /> Connected Social Media Channels (Tap to open in phone browser)
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {formData.socials.github && (
            <a
              href={formData.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-xs font-mono text-slate-200 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Github className="w-4 h-4 text-white" /> GitHub <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
          {formData.socials.linkedin && (
            <a
              href={formData.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-blue-950/40 border border-blue-500/30 hover:border-blue-400 text-xs font-mono text-blue-200 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Linkedin className="w-4 h-4 text-blue-400" /> LinkedIn <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
          {formData.socials.twitter && (
            <a
              href={formData.socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-sky-950/40 border border-sky-500/30 hover:border-sky-400 text-xs font-mono text-sky-200 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Twitter className="w-4 h-4 text-sky-400" /> Twitter/X <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
          {formData.socials.website && (
            <a
              href={formData.socials.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-400 text-xs font-mono text-emerald-200 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Globe className="w-4 h-4 text-emerald-400" /> Website <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
          {formData.socials.youtube && (
            <a
              href={formData.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-rose-950/40 border border-rose-500/30 hover:border-rose-400 text-xs font-mono text-rose-200 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Globe className="w-4 h-4 text-rose-400" /> YouTube <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
          {formData.socials.instagram && (
            <a
              href={formData.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-pink-950/40 border border-pink-500/30 hover:border-pink-400 text-xs font-mono text-pink-200 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Globe className="w-4 h-4 text-pink-400" /> Instagram <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
          {formData.socials.medium && (
            <a
              href={formData.socials.medium}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-400 text-xs font-mono text-emerald-200 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Globe className="w-4 h-4 text-emerald-400" /> Medium <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
          {formData.socials.discord && (
            <a
              href={formData.socials.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 hover:border-indigo-400 text-xs font-mono text-indigo-200 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Globe className="w-4 h-4 text-indigo-400" /> Discord <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
        </div>
      </div>

      {/* Editor Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
        {/* Sub-navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveSection('profile')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              activeSection === 'profile'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            Personal & Contact Info
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('socials')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              activeSection === 'socials'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            Social Media & Web Links
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('avatar')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              activeSection === 'avatar'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            Avatar & Picture
          </button>
        </div>

        {/* Section 1: Personal & Contact */}
        {activeSection === 'profile' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Bio / Tagline</label>
              <input
                type="text"
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-400 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Role / Executive Title</label>
                <input
                  type="text"
                  value={formData.roleTitle || ''}
                  onChange={(e) => handleChange('roleTitle', e.target.value)}
                  placeholder="e.g. Lead OS Architect"
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Emergency Contact / Ops</label>
                <input
                  type="text"
                  value={formData.emergencyContact || ''}
                  onChange={(e) => handleChange('emergencyContact', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Location / Timezone</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-400 outline-none"
              />
            </div>
          </div>
        )}

        {/* Section 2: Social Links */}
        {activeSection === 'socials' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">GitHub URL</label>
                <input
                  type="url"
                  value={formData.socials.github}
                  onChange={(e) => handleSocialChange('github', e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.socials.linkedin}
                  onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Twitter / X URL</label>
                <input
                  type="url"
                  value={formData.socials.twitter}
                  onChange={(e) => handleSocialChange('twitter', e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Personal Website URL</label>
                <input
                  type="url"
                  value={formData.socials.website}
                  onChange={(e) => handleSocialChange('website', e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">YouTube URL</label>
                <input
                  type="url"
                  value={formData.socials.youtube || ''}
                  onChange={(e) => handleSocialChange('youtube', e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Instagram URL</label>
                <input
                  type="url"
                  value={formData.socials.instagram || ''}
                  onChange={(e) => handleSocialChange('instagram', e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Medium Blog URL</label>
                <input
                  type="url"
                  value={formData.socials.medium || ''}
                  onChange={(e) => handleSocialChange('medium', e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Discord Invite URL</label>
                <input
                  type="url"
                  value={formData.socials.discord || ''}
                  onChange={(e) => handleSocialChange('discord', e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-purple-400 outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Avatar */}
        {activeSection === 'avatar' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2">Upload Profile Photo</label>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs font-mono cursor-pointer transition-all shadow-md">
                <Camera className="w-4 h-4" /> Upload Local Photo File
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Custom Photo URL</label>
              <input
                type="url"
                value={formData.avatarUrl}
                onChange={(e) => handleChange('avatarUrl', e.target.value)}
                className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2">Avatar Presets</label>
              <div className="flex items-center gap-3">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChange('avatarUrl', preset)}
                    className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                      formData.avatarUrl === preset ? 'border-cyan-400 scale-105 ring-2 ring-cyan-400/40' : 'border-slate-800'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx}`} className="w-12 h-12 object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cloudflare Second Brain Integration Card */}
        {onOpenCloudflareModal && (
          <div className="p-5 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-950/30 via-black to-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  Cloudflare Second Brain & MCP
                  {cloudflareConfig?.isEnabled && cloudflareConfig?.workerUrl ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px]">
                      Connected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px]">
                      Not Connected
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  {cloudflareConfig?.workerUrl
                    ? cloudflareConfig.workerUrl
                    : 'Connect your free Cloudflare Worker, D1, or Vectorize endpoint for knowledge retrieval.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenCloudflareModal}
              className="px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/40 text-xs font-mono font-bold flex items-center gap-2 transition-all shrink-0"
            >
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span>Configure Cloudflare</span>
            </button>
          </div>
        )}

        {/* Save Bar */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {isSaved ? (
            <span className="flex items-center gap-2 text-xs font-mono text-emerald-400 animate-pulse font-semibold">
              <Check className="w-4 h-4" /> Profile Updated & Saved to Local Storage!
            </span>
          ) : (
            <span className="text-xs font-mono text-slate-500">
              Changes will update across all Personal OS widgets
            </span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs font-mono flex items-center gap-2 shadow-lg glow-cyan transition-all"
          >
            <Save className="w-4 h-4" /> Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
};
