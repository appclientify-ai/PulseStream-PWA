import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { toast } from 'sonner';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

interface GSTPortalLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onDataChange?: () => void;
  initialType?: 'gst' | 'eway' | 'gstat';
}

export const GSTPortalLoginModal: React.FC<GSTPortalLoginModalProps> = ({
  isOpen,
  onClose,
  client,
  onDataChange,
  initialType = 'gst',
}) => {
  const [portalType, setPortalType] = useState<'gst' | 'eway' | 'gstat'>(initialType);
  const [showPassword, setShowPassword] = useState(true);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setPortalType(initialType);
    }
  }, [isOpen, initialType]);

  const getPortalDetails = () => {
    switch (portalType) {
      case 'eway':
        return {
          title: 'E-Way Bill',
          subtitle: 'E-Way Bill Portal Access Utility',
          icon: '🚚',
          bgGradient: 'from-emerald-950 to-slate-900',
          accentColor: 'emerald',
          bgGlow: 'bg-emerald-500/20',
          badgeText: 'E-Way Bill Portal',
          userIdLabel: 'E-Way Bill User ID',
          passwordLabel: 'E-Way Bill Password',
          userId: client?.gstProfile?.ewayBillId || '',
          password: client?.gstProfile?.ewayBillPass || '',
          launchUrl: 'https://ewaybillgst.gov.in/login.aspx',
          launchButtonLabel: '🚀 Open E-Way Bill Portal',
          saveKey: 'ewayBillPass' as const,
        };
      case 'gstat':
        return {
          title: 'GSTAT',
          subtitle: 'GSTAT Portal Access Utility',
          icon: '⚖️',
          bgGradient: 'from-amber-950 to-slate-900',
          accentColor: 'amber',
          bgGlow: 'bg-amber-500/20',
          badgeText: 'GSTAT Portal',
          userIdLabel: 'GSTAT User ID',
          passwordLabel: 'GSTAT Password',
          userId: client?.gstProfile?.gstatId || '',
          password: client?.gstProfile?.gstatPass || '',
          launchUrl: 'https://efiling.gstat.gov.in/mainPage.drt',
          launchButtonLabel: '🚀 Open GSTAT Portal',
          saveKey: 'gstatPass' as const,
        };
      case 'gst':
      default:
        return {
          title: 'GST',
          subtitle: 'GST Portal Access Utility',
          icon: '🔑',
          bgGradient: 'from-slate-900 to-indigo-950',
          accentColor: 'indigo',
          bgGlow: 'bg-indigo-500/20',
          badgeText: 'GST Portal',
          userIdLabel: 'GST Portal User ID',
          passwordLabel: 'GST Password',
          userId: client?.gstProfile?.username || client?.gstProfile?.gstin || '',
          password: client?.gstProfile?.password || '',
          launchUrl: 'https://services.gst.gov.in/services/login',
          launchButtonLabel: '🚀 Open GST Portal',
          saveKey: 'password' as const,
        };
    }
  };

  const details = getPortalDetails();
  const userId = details.userId;
  const password = details.password;

  // Auto copy User ID on open or when switching portalType
  useEffect(() => {
    if (isOpen && client && userId) {
      setShowPassword(true);
      setCopiedId(false);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(userId)
          .then(() => {
            setCopiedId(true);
            toast.success(`${details.title} User ID (${userId}) copied automatically!`);
          })
          .catch(() => {
            // fallback
          });
      }
    } else {
      setCopiedId(false);
      setIsEditingPassword(false);
      setShowPassword(true);
    }
  }, [isOpen, client, userId, portalType]);

  if (!isOpen || !client) return null;

  const handleCopy = (text: string, label: string) => {
    if (!text) {
      toast.error(`No ${label} available to copy`);
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success(`${label} copied to clipboard!`);
        if (label === 'User ID') setCopiedId(true);
      });
    }
  };

  const handleLaunchPortal = () => {
    if (userId && navigator.clipboard) {
      navigator.clipboard.writeText(userId);
    }
    toast.success(`${details.title} User ID copied! Opening ${details.title} Portal...`);
    window.open(details.launchUrl, '_blank');
  };

  const handleSavePassword = async () => {
    if (!newPassword.trim()) {
      toast.error('Password cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      const updatedClient: Client = {
        ...client,
        gstProfile: {
          ...(client.gstProfile || { gstin: '' }),
          [details.saveKey]: newPassword.trim(),
        },
      };
      await api.saveClient(updatedClient);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`${details.title} password updated successfully!`);
      setIsEditingPassword(false);
      if (onDataChange) onDataChange();
    } catch (err) {
      toast.error('Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const accentColorClasses = {
    indigo: {
      text: 'text-indigo-600',
      bg: 'bg-indigo-50',
      hoverBg: 'hover:bg-indigo-100',
      border: 'border-indigo-200',
      glow: 'shadow-indigo-600/30',
      btn: 'bg-indigo-600 hover:bg-indigo-700',
      bannerText: 'text-indigo-900',
      bannerBg: 'bg-indigo-50/70',
      bannerBorder: 'border-indigo-100',
      kbd: 'border-indigo-200 text-indigo-700',
    },
    emerald: {
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      hoverBg: 'hover:bg-emerald-100',
      border: 'border-emerald-200',
      glow: 'shadow-emerald-600/30',
      btn: 'bg-emerald-600 hover:bg-emerald-700',
      bannerText: 'text-emerald-900',
      bannerBg: 'bg-emerald-50/70',
      bannerBorder: 'border-emerald-100',
      kbd: 'border-emerald-200 text-emerald-700',
    },
    amber: {
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      hoverBg: 'hover:bg-amber-100',
      border: 'border-amber-200',
      glow: 'shadow-amber-600/30',
      btn: 'bg-amber-600 hover:bg-amber-700',
      bannerText: 'text-amber-900',
      bannerBg: 'bg-amber-50/70',
      bannerBorder: 'border-amber-100',
      kbd: 'border-amber-200 text-amber-700',
    },
  }[details.accentColor];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`bg-gradient-to-r ${details.bgGradient} p-6 text-white relative overflow-hidden shrink-0`}>
          <div className={`absolute -right-10 -top-10 w-40 h-40 ${details.bgGlow} rounded-full blur-2xl pointer-events-none`} />
          
          <div className="flex items-start justify-between relative z-10 gap-3">
            <div className="flex items-center gap-3.5">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${accentColorClasses.glow} ${accentColorClasses.btn} font-black text-xl shrink-0`}>
                {details.icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">{details.subtitle}</p>
                <h3 className="text-lg font-black tracking-tight text-white line-clamp-1">{client.tradeName || client.legalName}</h3>
                {client.gstProfile?.gstin && (
                  <p className="text-xs font-mono font-bold text-slate-400 mt-0.5">GSTIN: {client.gstProfile.gstin}</p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab switcher inside the modal */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-6 py-2 flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'gst', label: 'GST Portal', icon: '🔑' },
            { id: 'eway', label: 'E-Way Bill', icon: '🚚' },
            { id: 'gstat', label: 'GSTAT', icon: '⚖️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setPortalType(tab.id as any);
                setIsEditingPassword(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                portalType === tab.id
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 bg-slate-50/50 flex-1 overflow-y-auto no-scrollbar">
          
          {/* User ID Section */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{details.userIdLabel}</span>
              {copiedId && (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  ✓ Auto-Copied
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-wrap sm:flex-nowrap">
              <span className="font-mono font-black text-slate-900 text-sm md:text-base break-all leading-snug select-all">
                {userId || <span className="text-slate-400 italic font-normal text-sm">No {details.userIdLabel} configured</span>}
              </span>
              {userId && (
                <button
                  onClick={() => handleCopy(userId, 'User ID')}
                  className={`px-3 py-1.5 ${accentColorClasses.bg} ${accentColorClasses.hoverBg} ${accentColorClasses.text} font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 border ${accentColorClasses.border}`}
                >
                  <span>📋</span>
                  <span>Copy ID</span>
                </button>
              )}
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{details.passwordLabel}</span>
              {!isEditingPassword && (
                <button
                  onClick={() => {
                    setNewPassword(password);
                    setIsEditingPassword(true);
                  }}
                  className={`text-[10px] font-black ${accentColorClasses.text} ${accentColorClasses.bg} ${accentColorClasses.hoverBg} px-2 py-0.5 rounded-md transition-all border ${accentColorClasses.border} flex items-center gap-1`}
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            {isEditingPassword ? (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={`Enter ${details.title} Password`}
                  className={`w-full px-3 py-2 rounded-xl border ${accentColorClasses.border} text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePassword();
                    if (e.key === 'Escape') setIsEditingPassword(false);
                  }}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsEditingPassword(false)}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePassword}
                    disabled={isSaving}
                    className={`px-3.5 py-1 rounded-lg text-xs font-black ${accentColorClasses.btn} text-white shadow-sm transition-all`}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-wrap sm:flex-nowrap">
                <span className={`font-mono font-black ${accentColorClasses.text} text-sm md:text-base break-all whitespace-pre-wrap leading-snug select-all min-w-0 flex-1`}>
                  {password ? (showPassword ? password : '••••••••') : <span className="text-slate-400 italic font-normal text-sm">No password saved</span>}
                </span>
                
                {password && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-xs transition-all"
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                    <button
                      onClick={() => handleCopy(password, 'Password')}
                      className={`px-2.5 py-1.5 ${accentColorClasses.bg} ${accentColorClasses.hoverBg} ${accentColorClasses.text} font-bold text-xs rounded-lg transition-all flex items-center gap-1 border ${accentColorClasses.border}`}
                      title="Copy Password"
                    >
                      <span>📋</span>
                      <span>Copy</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Information banner */}
          <div className={`${accentColorClasses.bannerBg} border ${accentColorClasses.bannerBorder} rounded-xl p-3 flex items-start gap-2.5`}>
            <span className={`${accentColorClasses.text} text-base`}>💡</span>
            <p className={`text-xs ${accentColorClasses.bannerText} font-medium leading-relaxed`}>
              <strong>User ID is copied automatically!</strong> Press <kbd className={`px-1.5 py-0.5 bg-white rounded border ${accentColorClasses.kbd} font-mono text-[10px] font-bold shadow-2xs`}>Ctrl+V</kbd> or <kbd className={`px-1.5 py-0.5 bg-white rounded border ${accentColorClasses.kbd} font-mono text-[10px] font-bold shadow-2xs`}>Cmd+V</kbd> on the {details.title} portal to paste your ID instantly.
            </p>
          </div>

        </div>

        {/* Action Footer */}
        <div className="p-5 bg-white border-t border-slate-200 flex items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-3.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all shrink-0"
          >
            Close
          </button>
          
          <button
            onClick={handleLaunchPortal}
            className={`flex-1 py-3.5 ${accentColorClasses.btn} text-white rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-lg ${accentColorClasses.glow} flex items-center justify-center gap-2 group active:scale-[0.99]`}
          >
            <span>{details.launchButtonLabel}</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
};

export default GSTPortalLoginModal;
