import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { formatDate } from '../exportUtils';
import { toast } from 'sonner';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

interface ITDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit?: (client: Client) => void;
  onDataChange?: () => void;
}

const ITDetailModal: React.FC<ITDetailModalProps> = ({ isOpen, onClose, client, onEdit, onDataChange }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'personal_employment' | 'bank_notes'>('overview');
  const [showPassword, setShowPassword] = useState(true);

  const [localClient, setLocalClient] = useState<Client | null>(client);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassVal, setNewPassVal] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    setLocalClient(client);
  }, [client]);

  if (!isOpen || !localClient) return null;

  const currentClient = localClient;

  const handleSavePassword = async () => {
    if (!currentClient) return;
    if (!newPassVal.trim()) {
      toast.error("Password cannot be empty");
      return;
    }
    setIsSavingPassword(true);
    try {
      const updated = {
        ...currentClient,
        itProfile: {
          ...(currentClient.itProfile || { pan: '' }),
          password: newPassVal.trim()
        }
      };
      await api.saveClient(updated);
      setLocalClient(updated);
      setIsEditingPassword(false);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("e-Filing Password updated instantly!");
      if (onDataChange) onDataChange();
    } catch (err) {
      toast.error("Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handlePortalLogin = () => {
    if (currentClient.itProfile?.pan) {
      navigator.clipboard.writeText(currentClient.itProfile.pan);
      toast.success('PAN copied! Opening Income Tax Portal...');
    }
    window.open(`https://eportal.incometax.gov.in/iec/foservices/#/login`, '_blank');
  };

  const itProf = currentClient.itProfile;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Hero Section */}
        <div className="p-6 md:p-8 bg-slate-900 text-white flex flex-col gap-5 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10 gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0 font-black text-xl">
                IT
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg md:text-2xl font-black tracking-tight text-white">{client.legalName || client.tradeName}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    client.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {client.status}
                  </span>
                </div>
                {client.tradeName && client.tradeName !== client.legalName && (
                  <p className="text-xs font-medium text-slate-400 mt-0.5">Trade Name: {client.tradeName}</p>
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

          {/* Key Identifiers & Quick Launch */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 relative z-10 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {itProf?.pan ? (
                <button
                  onClick={() => copyToClipboard(itProf.pan, 'PAN')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono font-bold tracking-wider flex items-center gap-2 border border-slate-700 transition-all group"
                  title="Click to copy PAN"
                >
                  <span className="text-[10px] font-black uppercase text-slate-400">PAN:</span>
                  <span>{itProf.pan}</span>
                  <span className="text-slate-500 group-hover:text-white text-[10px]">📋</span>
                </button>
              ) : (
                <span className="text-slate-500 italic">No PAN recorded</span>
              )}

              {itProf?.category && (
                <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold border border-slate-700">
                  {itProf.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePortalLogin}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
              >
                <span>🚀 IT e-Portal Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'overview', label: 'Overview & Portal Credentials', icon: '🔑' },
            { id: 'personal_employment', label: 'Personal & Professional Details', icon: '👤' },
            { id: 'bank_notes', label: 'Banking & Office Notes', icon: '🏦' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 no-scrollbar space-y-6">

          {/* TAB 1: OVERVIEW & CREDENTIALS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Credentials Highlight Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Income Tax Portal Credentials</span>
                  <span className="text-[10px] text-indigo-600 font-bold">1-Click Portal Sync</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* PAN / User ID */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">PAN / Portal Username</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-indigo-600 text-sm truncate">{itProf?.pan || '---'}</span>
                      {itProf?.pan && (
                        <button
                          onClick={() => copyToClipboard(itProf.pan, 'PAN')}
                          className="text-slate-400 hover:text-indigo-600 text-xs p-1"
                          title="Copy PAN"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">e-Filing Password</p>
                      {!isEditingPassword && (
                        <button
                          onClick={() => {
                            setNewPassVal(itProf?.password || '');
                            setIsEditingPassword(true);
                          }}
                          className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-all border border-indigo-100 flex items-center gap-1 shrink-0"
                          title="Change password instantly without modifying full profile"
                        >
                          ✏️ Instant Change
                        </button>
                      )}
                    </div>

                    {isEditingPassword ? (
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={newPassVal}
                          onChange={e => setNewPassVal(e.target.value)}
                          placeholder="Enter new IT password"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSavePassword();
                            if (e.key === 'Escape') setIsEditingPassword(false);
                          }}
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setIsEditingPassword(false)}
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-500 hover:bg-slate-100"
                            disabled={isSavingPassword}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSavePassword}
                            disabled={isSavingPassword}
                            className="px-3 py-1 rounded-md text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-1"
                          >
                            {isSavingPassword ? 'Saving...' : '✓ Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1 gap-2 flex-wrap sm:flex-nowrap">
                        <span className="font-mono font-bold text-slate-900 text-sm break-all whitespace-pre-wrap select-all leading-snug min-w-0 flex-1">
                          {itProf?.password ? (showPassword ? itProf.password : '••••••••') : '---'}
                        </span>
                        {itProf?.password && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-slate-400 hover:text-slate-700 text-xs p-1"
                              title={showPassword ? 'Hide Password' : 'Show Password'}
                            >
                              {showPassword ? '🙈' : '👁️'}
                            </button>
                            <button
                              onClick={() => copyToClipboard(itProf.password, 'Password')}
                              className="text-slate-400 hover:text-indigo-600 text-xs p-1"
                              title="Copy Password"
                            >
                              📋
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Primary Contact Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Mobile Number</p>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{client.mobile || '---'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Email Address</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">{client.email || '---'}</p>
                  </div>
                  <div className="sm:col-span-2 md:col-span-1">
                    <p className="text-[10px] font-black uppercase text-slate-400">Communication Address</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5 line-clamp-2">{client.address || '---'}</p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {client.remarks && (
                <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/60 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <span>📌</span>
                    <span>IT Vault Remarks</span>
                  </h3>
                  <p className="text-xs font-medium text-amber-900 leading-relaxed whitespace-pre-wrap">{client.remarks}</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PERSONAL & PROFESSIONAL */}
          {activeTab === 'personal_employment' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Individual / Entity Particulars</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Legal Name (As per PAN)</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{client.legalName || '---'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Father's Name</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{itProf?.fatherName || '---'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Date of Birth / Incorporation</p>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{formatDate(itProf?.dob) || '---'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Professional & Taxpayer Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Nature of Work</p>
                    <p className="font-bold text-indigo-600 text-sm mt-0.5">{itProf?.natureOfWork || 'Salaried'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Employment Type</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{itProf?.employmentType || '---'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Assessee Category</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{itProf?.category || 'Individual'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">ITR Form Filed</p>
                    <p className="mt-0.5">
                      <span className="inline-block bg-indigo-50/80 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg font-black text-xs tracking-wide">
                        {itProf?.itrFiled || 'N/A'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: BANK & NOTES */}
          {activeTab === 'bank_notes' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span>🏦</span> Income Tax Bank Account for Refund
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-black uppercase text-slate-400">Bank Name</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{client.bankDetails?.bankName || '---'}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-black uppercase text-slate-400">Account Number</p>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{client.bankDetails?.accountNo || '---'}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-black uppercase text-slate-400">IFSC Code</p>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{client.bankDetails?.ifsc || '---'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Vault Remarks & Notes</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 min-h-[100px]">
                  <p className="text-xs font-medium text-slate-700 whitespace-pre-wrap">{client.remarks || 'No internal remarks logged.'}</p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="p-4 md:px-8 md:py-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 gap-3">
          <p className="text-[10px] font-bold text-slate-400 hidden sm:block">Clientify IT Vault Dossier • Confidential</p>
          <div className="flex items-center gap-3 ml-auto">
            {onEdit && (
              <button 
                onClick={() => { onClose(); onEdit(client); }} 
                className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-xs uppercase tracking-wider transition-all border border-indigo-200"
              >
                ✏️ Edit Profile
              </button>
            )}
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all"
            >
              Close
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default ITDetailModal;
