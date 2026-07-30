import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { formatDate } from '../exportUtils';
import { toast } from 'sonner';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import GSTPortalLoginModal from './GSTPortalLoginModal';

interface GSTDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit?: (client: Client) => void;
  onDataChange?: () => void;
}

const GSTDetailModal: React.FC<GSTDetailModalProps> = ({ isOpen, onClose, client, onEdit, onDataChange }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'registration' | 'stakeholders' | 'portals_bank'>('overview');
  const [showPassword, setShowPassword] = useState(true);
  const [showEwayPass, setShowEwayPass] = useState(true);
  const [showGstatPass, setShowGstatPass] = useState(true);

  const [localClient, setLocalClient] = useState<Client | null>(client);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassVal, setNewPassVal] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [isEditingEwayPass, setIsEditingEwayPass] = useState(false);
  const [newEwayPassVal, setNewEwayPassVal] = useState('');
  const [isSavingEwayPass, setIsSavingEwayPass] = useState(false);

  const [isEditingGstatPass, setIsEditingGstatPass] = useState(false);
  const [newGstatPassVal, setNewGstatPassVal] = useState('');
  const [isSavingGstatPass, setIsSavingGstatPass] = useState(false);

  const [activePortalType, setActivePortalType] = useState<'gst' | 'eway' | 'gstat' | null>(null);

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
        gstProfile: {
          ...(currentClient.gstProfile || { gstin: '' }),
          password: newPassVal.trim()
        }
      };
      await api.saveClient(updated);
      setLocalClient(updated);
      setIsEditingPassword(false);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("GST Password updated instantly!");
      if (onDataChange) onDataChange();
    } catch (err) {
      toast.error("Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveEwayPass = async () => {
    if (!currentClient) return;
    if (!newEwayPassVal.trim()) {
      toast.error("Password cannot be empty");
      return;
    }
    setIsSavingEwayPass(true);
    try {
      const updated = {
        ...currentClient,
        gstProfile: {
          ...(currentClient.gstProfile || { gstin: '' }),
          ewayBillPass: newEwayPassVal.trim()
        }
      };
      await api.saveClient(updated);
      setLocalClient(updated);
      setIsEditingEwayPass(false);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("E-Way Bill Password updated instantly!");
      if (onDataChange) onDataChange();
    } catch (err) {
      toast.error("Failed to update password");
    } finally {
      setIsSavingEwayPass(false);
    }
  };

  const handleSaveGstatPass = async () => {
    if (!currentClient) return;
    if (!newGstatPassVal.trim()) {
      toast.error("Password cannot be empty");
      return;
    }
    setIsSavingGstatPass(true);
    try {
      const updated = {
        ...currentClient,
        gstProfile: {
          ...(currentClient.gstProfile || { gstin: '' }),
          gstatPass: newGstatPassVal.trim()
        }
      };
      await api.saveClient(updated);
      setLocalClient(updated);
      setIsEditingGstatPass(false);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("GSTAT Password updated instantly!");
      if (onDataChange) onDataChange();
    } catch (err) {
      toast.error("Failed to update password");
    } finally {
      setIsSavingGstatPass(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStakeholderLabel = (constitution: string = 'Proprietorship') => {
    switch (constitution) {
      case 'Proprietorship': return 'Proprietor';
      case 'Partnership': return 'Partner';
      case 'HUF': return 'Member / Karta';
      case 'Company': return 'Director';
      case 'Trust': return 'Trustee';
      case 'Society': return 'Member';
      default: return 'Stakeholder';
    }
  };

  const handleSearchTaxpayer = (gstin?: string) => {
    if (gstin) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(gstin).then(() => {
          toast.success('GSTIN Copied!');
          window.open('https://services.gst.gov.in/services/searchtp', '_blank');
        }).catch(() => {
          toast.success('GSTIN Copied!');
          window.open('https://services.gst.gov.in/services/searchtp', '_blank');
        });
      } else {
        window.open('https://services.gst.gov.in/services/searchtp', '_blank');
      }
    }
  };

  const handleLogin = (type: 'gst' | 'eway' | 'gstat' = 'gst') => {
    setActivePortalType(type);
  };

  const gstProf = currentClient.gstProfile;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Hero Section */}
        <div className="p-6 md:p-8 bg-slate-900 text-white flex flex-col gap-5 shrink-0 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10 gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0 font-black text-xl">
                GST
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg md:text-2xl font-black tracking-tight text-white">{client.tradeName || client.legalName}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    client.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {client.status}
                  </span>
                </div>
                {client.legalName && client.tradeName && client.legalName !== client.tradeName && (
                  <p className="text-xs font-medium text-slate-400 mt-0.5">Legal: {client.legalName}</p>
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

          {/* Quick Action Bar & Key Identifiers */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 relative z-10 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {gstProf?.gstin ? (
                <button
                  onClick={() => copyToClipboard(gstProf.gstin, 'GSTIN')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono font-bold tracking-wider flex items-center gap-2 border border-slate-700 transition-all group"
                  title="Click to copy GSTIN"
                >
                  <span className="text-[10px] font-black uppercase text-slate-400">GSTIN:</span>
                  <span>{gstProf.gstin}</span>
                  <span className="text-slate-500 group-hover:text-white text-[10px]">📋</span>
                </button>
              ) : (
                <span className="text-slate-500 italic">No GSTIN registered</span>
              )}

              {gstProf?.pan && (
                <button
                  onClick={() => copyToClipboard(gstProf.pan, 'PAN')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold tracking-wider flex items-center gap-2 border border-slate-700 transition-all"
                  title="Click to copy PAN"
                >
                  <span className="text-[10px] font-black uppercase text-slate-400">PAN:</span>
                  <span>{gstProf.pan}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {gstProf?.gstin && (
                <button
                  onClick={() => handleSearchTaxpayer(gstProf.gstin)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all shrink-0"
                >
                  <span>🔍 Verify on GST</span>
                </button>
              )}
              <button
                onClick={() => handleLogin('gst')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 border border-slate-700 transition-all shrink-0"
                title="Open Portal Login Utility"
              >
                <span>🔐 Portal Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'overview', label: 'Overview & Credentials', icon: '🔑' },
            { id: 'registration', label: 'Registration & Tax Specs', icon: '🏛️' },
            { id: 'stakeholders', label: `${getStakeholderLabel(gstProf?.constitution)}s (${gstProf?.stakeholders?.length || 0})`, icon: '👤' },
            { id: 'portals_bank', label: 'Portals & Banking', icon: '🏦' }
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
                  <span>Portal Access Credentials</span>
                  <span className="text-[10px] text-indigo-600 font-bold">1-Click Copy Enabled</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* GST User ID */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">GST User ID</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-slate-900 text-sm truncate">{gstProf?.username || '---'}</span>
                      {gstProf?.username && (
                        <button
                          onClick={() => copyToClipboard(gstProf.username, 'User ID')}
                          className="text-slate-400 hover:text-indigo-600 text-xs p-1"
                          title="Copy User ID"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </div>

                  {/* GST Password */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">GST Password</p>
                      {!isEditingPassword && (
                        <button
                          onClick={() => {
                            setNewPassVal(gstProf?.password || '');
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
                          placeholder="Enter new GST password"
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
                        <span className="font-mono font-bold text-slate-900 text-sm break-all select-all leading-snug">
                          {gstProf?.password ? (showPassword ? gstProf.password : '••••••••') : '---'}
                        </span>
                        {gstProf?.password && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-slate-400 hover:text-slate-700 text-xs p-1"
                              title={showPassword ? 'Hide Password' : 'Show Password'}
                            >
                              {showPassword ? '🙈' : '👁️'}
                            </button>
                            <button
                              onClick={() => copyToClipboard(gstProf.password, 'Password')}
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

                  {/* GSTIN */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">GSTIN Number</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-indigo-600 text-sm truncate">{gstProf?.gstin || '---'}</span>
                      {gstProf?.gstin && (
                        <button
                          onClick={() => copyToClipboard(gstProf.gstin, 'GSTIN')}
                          className="text-slate-400 hover:text-indigo-600 text-xs p-1"
                          title="Copy GSTIN"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Contact Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Primary Contact Information</h3>
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
                    <p className="text-[10px] font-black uppercase text-slate-400">Address</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5 line-clamp-2">{client.address || '---'}</p>
                  </div>
                </div>
              </div>

              {/* Accountant Info */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Assigned Accountant / Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Accountant Name</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{gstProf?.accountantName || '---'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Accountant Mobile</p>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{gstProf?.accountantMobile || '---'}</p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {client.remarks && (
                <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/60 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <span>📌</span>
                    <span>Office Vault Remarks</span>
                  </h3>
                  <p className="text-xs font-medium text-amber-900 leading-relaxed whitespace-pre-wrap">{client.remarks}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REGISTRATION & TAX SPECS */}
          {activeTab === 'registration' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400">Business Constitution</p>
                  <p className="font-black text-slate-900 text-sm mt-1">{gstProf?.constitution || 'Proprietorship'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400">Taxpayer Type</p>
                  <p className="font-black text-indigo-600 text-sm mt-1">{gstProf?.regType || 'Regular'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400">Filing Frequency</p>
                  <p className="font-black text-slate-900 text-sm mt-1">{gstProf?.filingFreq || 'Monthly'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400">GST Registration Status</p>
                  <p className="font-black text-emerald-600 text-sm mt-1">{gstProf?.gstStatus || 'Active'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400">Registration Date</p>
                  <p className="font-bold text-slate-900 text-sm mt-1">{formatDate(gstProf?.regDate) || '---'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400">Cancellation Date</p>
                  <p className="font-bold text-slate-900 text-sm mt-1">{formatDate(gstProf?.cancelDate) || 'N/A'}</p>
                </div>
              </div>

              {/* Jurisdiction Specs */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Jurisdiction & Sector Specs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Jurisdiction Type</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{gstProf?.jurisdictionType || 'State'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Sector / Ward</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{gstProf?.sector || '---'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Range / Circle</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{gstProf?.range || '---'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAKEHOLDERS */}
          {activeTab === 'stakeholders' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Registered {getStakeholderLabel(gstProf?.constitution)} Details
                </h3>
              </div>

              {gstProf?.stakeholders && gstProf.stakeholders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gstProf.stakeholders.map((s, idx) => (
                    <div key={s.id || idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                          {s.name ? s.name.charAt(0).toUpperCase() : '#'}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{s.name || 'Unnamed Stakeholder'}</p>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{getStakeholderLabel(gstProf?.constitution)} #{idx + 1}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">Mobile</p>
                          <p className="font-mono font-bold text-slate-900">{s.mobile || '---'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">PAN No</p>
                          <p className="font-mono font-bold text-slate-900">{s.pan || '---'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] font-black uppercase text-slate-400">Email Address</p>
                          <p className="font-medium text-slate-800 truncate">{s.email || '---'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                  No individual stakeholders documented for this business entity.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PORTALS & BANKING */}
          {activeTab === 'portals_bank' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Secondary Portals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* E-Way Bill */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span>🚚</span> E-Way Bill Portal
                    </h3>
                    {!isEditingEwayPass && (
                      <button
                        onClick={() => {
                          setNewEwayPassVal(gstProf?.ewayBillPass || '');
                          setIsEditingEwayPass(true);
                        }}
                        className="text-[10px] font-black text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-all border border-emerald-200"
                        title="Change E-Way Bill password"
                      >
                        ✏️ Instant Change
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold">User ID:</span>
                      <span className="font-mono font-bold text-slate-900">{gstProf?.ewayBillId || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-slate-400 font-bold">Password:</span>
                      {isEditingEwayPass ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newEwayPassVal}
                            onChange={e => setNewEwayPassVal(e.target.value)}
                            className="px-2 py-1 rounded border border-emerald-300 text-xs font-mono font-bold w-28"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEwayPass();
                              if (e.key === 'Escape') setIsEditingEwayPass(false);
                            }}
                          />
                          <button onClick={handleSaveEwayPass} disabled={isSavingEwayPass} className="px-2 py-1 rounded bg-emerald-600 text-white font-black text-[10px]">
                            {isSavingEwayPass ? '...' : '✓'}
                          </button>
                          <button onClick={() => setIsEditingEwayPass(false)} className="px-2 py-1 rounded bg-slate-200 text-slate-600 font-bold text-[10px]">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            {gstProf?.ewayBillPass ? (showEwayPass ? gstProf.ewayBillPass : '••••••••') : '---'}
                          </span>
                          {gstProf?.ewayBillPass && (
                            <>
                              <button onClick={() => setShowEwayPass(!showEwayPass)} className="text-xs">
                                {showEwayPass ? '🙈' : '👁️'}
                              </button>
                              <button onClick={() => copyToClipboard(gstProf.ewayBillPass, 'E-Way Bill Password')} className="text-xs text-slate-400 hover:text-emerald-600">
                                📋
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* GSTAT */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span>⚖️</span> GSTAT Portal
                    </h3>
                    {!isEditingGstatPass && (
                      <button
                        onClick={() => {
                          setNewGstatPassVal(gstProf?.gstatPass || '');
                          setIsEditingGstatPass(true);
                        }}
                        className="text-[10px] font-black text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md transition-all border border-amber-200"
                        title="Change GSTAT password"
                      >
                        ✏️ Instant Change
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold">User ID:</span>
                      <span className="font-mono font-bold text-slate-900">{gstProf?.gstatId || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-slate-400 font-bold">Password:</span>
                      {isEditingGstatPass ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newGstatPassVal}
                            onChange={e => setNewGstatPassVal(e.target.value)}
                            className="px-2 py-1 rounded border border-amber-300 text-xs font-mono font-bold w-28"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveGstatPass();
                              if (e.key === 'Escape') setIsEditingGstatPass(false);
                            }}
                          />
                          <button onClick={handleSaveGstatPass} disabled={isSavingGstatPass} className="px-2 py-1 rounded bg-amber-600 text-white font-black text-[10px]">
                            {isSavingGstatPass ? '...' : '✓'}
                          </button>
                          <button onClick={() => setIsEditingGstatPass(false)} className="px-2 py-1 rounded bg-slate-200 text-slate-600 font-bold text-[10px]">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            {gstProf?.gstatPass ? (showGstatPass ? gstProf.gstatPass : '••••••••') : '---'}
                          </span>
                          {gstProf?.gstatPass && (
                            <>
                              <button onClick={() => setShowGstatPass(!showGstatPass)} className="text-xs">
                                {showGstatPass ? '🙈' : '👁️'}
                              </button>
                              <button onClick={() => copyToClipboard(gstProf.gstatPass, 'GSTAT Password')} className="text-xs text-slate-400 hover:text-amber-600">
                                📋
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Bank Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span>🏦</span> Primary Business Bank Details
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

            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="p-4 md:px-8 md:py-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 gap-3">
          <p className="text-[10px] font-bold text-slate-400 hidden sm:block">Clientify Vault Dossier • Confidential</p>
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

      <GSTPortalLoginModal
        isOpen={activePortalType !== null}
        onClose={() => setActivePortalType(null)}
        client={currentClient}
        onDataChange={onDataChange}
        initialType={activePortalType || 'gst'}
      />
    </div>
  );
};

export default GSTDetailModal;
