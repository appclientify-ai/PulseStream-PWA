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
}

export const GSTPortalLoginModal: React.FC<GSTPortalLoginModalProps> = ({
  isOpen,
  onClose,
  client,
  onDataChange,
}) => {
  const [showPassword, setShowPassword] = useState(true);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const queryClient = useQueryClient();

  const userId = client?.gstProfile?.username || client?.gstProfile?.gstin || '';
  const password = client?.gstProfile?.password || '';

  // Auto copy User ID on modal open
  useEffect(() => {
    if (isOpen && client && userId) {
      setShowPassword(true);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(userId)
          .then(() => {
            setCopiedId(true);
            toast.success(`User ID (${userId}) copied automatically to clipboard!`);
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
  }, [isOpen, client, userId]);

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
    toast.success('User ID copied! Opening GST Portal...');
    window.open('https://services.gst.gov.in/services/login', '_blank');
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
          password: newPassword.trim(),
        },
      };
      await api.saveClient(updatedClient);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Password updated successfully!');
      setIsEditingPassword(false);
      if (onDataChange) onDataChange();
    } catch (err) {
      toast.error('Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10 gap-3">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 font-black text-lg shrink-0">
                GST
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Portal Access Utility</p>
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

        {/* Content Body */}
        <div className="p-6 space-y-5 bg-slate-50/50">
          
          {/* User ID Section */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">GST Portal User ID</span>
              {copiedId && (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  ✓ Auto-Copied
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-wrap sm:flex-nowrap">
              <span className="font-mono font-black text-slate-900 text-sm md:text-base break-all leading-snug select-all">
                {userId || <span className="text-slate-400 italic font-normal text-sm">No User ID configured</span>}
              </span>
              {userId && (
                <button
                  onClick={() => handleCopy(userId, 'User ID')}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 border border-indigo-200"
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
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">GST Password</span>
              {!isEditingPassword && (
                <button
                  onClick={() => {
                    setNewPassword(password);
                    setIsEditingPassword(true);
                  }}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-all border border-indigo-100 flex items-center gap-1"
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
                  placeholder="Enter GST Password"
                  className="w-full px-3 py-2 rounded-xl border border-indigo-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30"
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
                    className="px-3.5 py-1 rounded-lg text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-wrap sm:flex-nowrap">
                <span className="font-mono font-black text-indigo-600 text-sm md:text-base break-all leading-snug select-all max-w-full">
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
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-all flex items-center gap-1 border border-indigo-200"
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
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex items-start gap-2.5">
            <span className="text-indigo-600 text-base">💡</span>
            <p className="text-xs text-indigo-900 font-medium leading-relaxed">
              <strong>User ID is copied automatically!</strong> Press <kbd className="px-1.5 py-0.5 bg-white rounded border border-indigo-200 font-mono text-[10px] font-bold text-indigo-700 shadow-2xs">Ctrl+V</kbd> or <kbd className="px-1.5 py-0.5 bg-white rounded border border-indigo-200 font-mono text-[10px] font-bold text-indigo-700 shadow-2xs">Cmd+V</kbd> on the GST portal to paste your ID instantly.
            </p>
          </div>

        </div>

        {/* Action Footer */}
        <div className="p-5 bg-white border-t border-slate-200 flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all shrink-0"
          >
            Close
          </button>
          
          <button
            onClick={handleLaunchPortal}
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group active:scale-[0.99]"
          >
            <span>🚀 Open GST Portal</span>
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
