import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { PortalCredentialRecord, PortalCategory } from '../../types';
import { toast } from 'sonner';

interface CredentialsVaultProps {
  onShowMessage?: (msg: { type: 'success' | 'error'; text: string }) => void;
}

const PORTAL_URL_MAP: Record<string, string> = {
  'GST Portal': 'https://www.gst.gov.in',
  'Income Tax': 'https://eportal.incometax.gov.in',
  'GSTAT Portal': 'https://efiling.gstat.gov.in/mainPage.drt',
  'E-Way Bill / E-Invoice': 'https://ewaybillgst.gov.in',
  'TRACES / TDS': 'https://contents.tdscpc.gov.in',
  'FSSAI / Food': 'https://foscos.fssai.gov.in/',
  'MSME / Udyam': 'https://udyamregistration.gov.in',
  'MCA / ROC V3': 'https://contents.mca.gov.in',
  'ICEGATE / Customs': 'https://www.icegate.gov.in',
  'DGFT': 'https://www.dgft.gov.in',
  'PF & ESIC': 'https://unifiedportal-mem.epfindia.gov.in',
  'App User Credential': '',
  'Other': ''
};

const PRACTITIONER_PRESETS = [
  'CA Authorized Practitioner',
  'Advocate & Legal Practitioner',
  'Tax Consultant Firm Master',
  'Authorized Firm Admin Account',
  'App & Software User Account'
];

export const CredentialsVault: React.FC<CredentialsVaultProps> = ({ onShowMessage }) => {
  const [credsList, setCredsList] = useState<PortalCredentialRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Visibility toggles for passwords
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showAllPasswords, setShowAllPasswords] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal states for adding/editing authorized practitioner credentials
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCred, setEditingCred] = useState<Partial<PortalCredentialRecord> | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState<Partial<PortalCredentialRecord>>({
    clientName: 'CA Authorized Practitioner',
    category: 'GST Portal',
    identifier: '',
    username: '',
    password: '',
    portalUrl: PORTAL_URL_MAP['GST Portal'],
    associatedMobile: '',
    associatedEmail: '',
    securityKey: '',
    remarks: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const credsData = await api.getPortalCredentials(true);
      setCredsList(credsData || []);
    } catch (err: any) {
      console.error('Failed to load practitioner credential vault:', err);
      if (onShowMessage) onShowMessage({ type: 'error', text: 'Failed to load credential vault.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleDbChange = () => loadData();
    window.addEventListener('clientify_db_change', handleDbChange);
    return () => window.removeEventListener('clientify_db_change', handleDbChange);
  }, []);

  // Filtered List
  const filteredCredentials = useMemo(() => {
    let list = credsList;

    if (selectedCategory !== 'ALL') {
      list = list.filter(item => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        (item.clientName && item.clientName.toLowerCase().includes(q)) ||
        (item.identifier && item.identifier.toLowerCase().includes(q)) ||
        (item.username && item.username.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.remarks && item.remarks.toLowerCase().includes(q)) ||
        (item.associatedMobile && item.associatedMobile.includes(q))
      );
    }

    return list;
  }, [credsList, selectedCategory, searchQuery]);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLoginPortal = (item: PortalCredentialRecord) => {
    const userIdToCopy = item.username || item.identifier || '';
    if (userIdToCopy) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(userIdToCopy);
      }
      const msg = `${item.category || 'Portal'} User ID (${userIdToCopy}) copied! Opening portal...`;
      toast.success(msg);
      if (onShowMessage) {
        onShowMessage({ type: 'success', text: msg });
      }
    } else {
      toast.success('Opening portal...');
    }

    if (item.portalUrl) {
      window.open(item.portalUrl, '_blank');
    }
  };

  const handleShareWhatsApp = (item: PortalCredentialRecord) => {
    const text = `🔐 *AUTHORIZED PRACTITIONER CREDENTIAL RECORD*\n\n` +
      `👤 *Practitioner / Entity:* ${item.clientName || 'Authorized Practitioner'}\n` +
      `🌐 *Portal / App:* ${item.category}\n` +
      (item.identifier ? `🆔 *Reg No / ID:* ${item.identifier}\n` : '') +
      `🔑 *User ID / Username:* ${item.username}\n` +
      `🔒 *Password:* ${item.password || '---'}\n` +
      (item.securityKey ? `🛡️ *Security PIN / Key:* ${item.securityKey}\n` : '') +
      (item.portalUrl ? `🔗 *Login Link:* ${item.portalUrl}\n` : '') +
      (item.remarks ? `📝 *Notes:* ${item.remarks}\n` : '') +
      `\n_Sent safely via Practice Credential Vault_`;

    const mobile = item.associatedMobile ? item.associatedMobile.replace(/\D/g, '') : '';
    const encoded = encodeURIComponent(text);
    if (mobile && mobile.length >= 10) {
      window.open(`https://wa.me/91${mobile}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const handleOpenAddModal = () => {
    setEditingCred(null);
    setFormData({
      clientName: 'CA Authorized Practitioner',
      category: 'GST Portal',
      identifier: '',
      username: '',
      password: '',
      portalUrl: PORTAL_URL_MAP['GST Portal'],
      associatedMobile: '',
      associatedEmail: '',
      securityKey: '',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PortalCredentialRecord) => {
    setEditingCred(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: PortalCredentialRecord) => {
    if (!confirm(`Are you sure you want to delete credential record for "${item.clientName || 'Practitioner'} - ${item.category}"?`)) return;

    try {
      await api.deletePortalCredential(item.id);
      if (onShowMessage) onShowMessage({ type: 'success', text: 'Credential record removed from vault.' });
      loadData();
    } catch (err: any) {
      if (onShowMessage) onShowMessage({ type: 'error', text: 'Delete failed.' });
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.username) {
      if (onShowMessage) onShowMessage({ type: 'error', text: 'Practitioner name and username are required.' });
      return;
    }

    setIsSaving(true);
    try {
      await api.savePortalCredential({
        ...formData,
        id: editingCred?.id
      });

      setIsModalOpen(false);
      if (onShowMessage) onShowMessage({ 
        type: 'success', 
        text: editingCred ? 'Authorized Practitioner credential updated.' : 'New Authorized Practitioner credential saved to vault.' 
      });
      loadData();
    } catch (err: any) {
      console.error('Save credential error:', err);
      if (onShowMessage) onShowMessage({ type: 'error', text: 'Save failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      
      {/* Top Banner & Action Header */}
      <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-48 w-48 bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg text-2xl shrink-0">
              🔑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Authorized Practitioner Credential Vault</h3>
                <span className="bg-fuchsia-500/30 text-fuchsia-300 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-fuchsia-400/30">
                  CA & Advocate Hub
                </span>
              </div>
              <p className="text-slate-400 text-xs font-medium mt-1">
                Centralized credential manager for CA, Advocate & Tax Professional authorized practitioner portal logins & software accounts.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowAllPasswords(!showAllPasswords)}
              className="flex-1 md:flex-initial px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              <span>{showAllPasswords ? '🙈 Hide Passwords' : '👁️ Reveal Passwords'}</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex-1 md:flex-initial px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Credential</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-slate-50 p-4 md:p-5 rounded-[2rem] border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by practitioner, membership, username, portal..."
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕
              </button>
            )}
          </div>

          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider shrink-0">
            Showing <span className="text-slate-900">{filteredCredentials.length}</span> Practitioner Credential Records
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {[
            { id: 'ALL', label: 'All Portals & Apps' },
            { id: 'App User Credential', label: '📱 App & Software User Credentials', isApp: true },
            { id: 'GST Portal', label: 'GST Practitioner' },
            { id: 'Income Tax', label: 'Income Tax ERIC' },
            { id: 'GSTAT Portal', label: 'GSTAT Tribunal' },
            { id: 'TRACES / TDS', label: 'TRACES / TDS' },
            { id: 'MCA / ROC V3', label: 'MCA V3 / ROC' },
            { id: 'FSSAI / Food', label: 'FSSAI / Food' },
            { id: 'MSME / Udyam', label: 'MSME / Udyam' },
            { id: 'ICEGATE / Customs', label: 'Customs' },
            { id: 'DGFT', label: 'DGFT' },
            { id: 'Other', label: 'Custom / Other' }
          ].map(cat => {
            const isSelected = selectedCategory === cat.id;
            let btnStyle = 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100';
            if (isSelected) {
              btnStyle = cat.isApp 
                ? 'bg-fuchsia-800 text-white shadow-md shadow-fuchsia-600/30 ring-2 ring-fuchsia-400 font-black' 
                : 'bg-slate-900 text-white shadow-md font-black';
            } else if (cat.isApp) {
              btnStyle = 'bg-fuchsia-50 text-fuchsia-900 border border-fuchsia-200 hover:bg-fuchsia-100 font-black';
            }

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] uppercase tracking-wider whitespace-nowrap transition-all ${btnStyle}`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Credential Table / Cards Grid */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400">
            Loading Authorized Practitioner Credential Vault...
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="text-4xl">🔑</div>
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">No Matching Practitioner Credential Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search criteria or filter.' : 'Click "Add Credential" above to save logins for CA, Advocate, Tax Consultants, or software apps.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px] compact-table compact-mode">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="py-4 px-6">Practitioner / Entity Name</th>
                  <th className="py-4 px-4">Portal / App Badge & Link</th>
                  <th className="py-4 px-4">User ID / Username</th>
                  <th className="py-4 px-4">Password & Security PIN</th>
                  <th className="py-4 px-4 text-center">Login / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCredentials.map(item => {
                  const isVisible = showAllPasswords || visiblePasswords[item.id];
                  const userCopyKey = `user_${item.id}`;
                  const passCopyKey = `pass_${item.id}`;
                  const isAppCategory = item.category === 'App User Credential';

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/70 transition-all group ${isAppCategory ? 'bg-fuchsia-50/20' : ''}`}>
                      
                      {/* Practitioner / Entity */}
                      <td className="py-4 px-6 align-top">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isAppCategory ? 'bg-fuchsia-600 shadow-xs shadow-fuchsia-500' : 'bg-indigo-600'}`} />
                          <p className="font-black text-slate-900 uppercase tracking-tight text-xs">
                            {item.clientName || 'Authorized Practitioner'}
                          </p>
                        </div>
                        {item.remarks && (
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5 max-w-xs truncate">
                            {item.remarks}
                          </p>
                        )}
                        <span className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isAppCategory 
                            ? 'bg-fuchsia-100 text-fuchsia-800' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {isAppCategory ? '📱 Software / App User Credential' : '⚖️ Authorized Practitioner Vault'}
                        </span>
                      </td>

                      {/* Portal & ID */}
                      <td className="py-4 px-4 align-top">
                        {isAppCategory ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300 shadow-2xs">
                            <span>📱</span> App User Credential
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {item.category}
                          </span>
                        )}
                        {item.identifier && (
                          <p className="font-mono text-xs font-bold text-slate-800 mt-1 uppercase">
                            {item.identifier}
                          </p>
                        )}
                        {item.portalUrl && (
                          <button 
                            type="button"
                            onClick={() => handleLoginPortal(item)}
                            className="text-[10px] text-indigo-600 hover:underline font-semibold block truncate max-w-[180px] mt-0.5 text-left"
                            title="Copy User ID & Open Portal"
                          >
                            🔗 {item.portalUrl.replace(/^https?:\/\//, '')}
                          </button>
                        )}
                      </td>

                      {/* Username */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {item.username}
                          </span>
                          <button
                            onClick={() => handleCopy(item.username, userCopyKey)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copy Username"
                          >
                            {copiedKey === userCopyKey ? (
                              <span className="text-[9px] font-black text-emerald-600 uppercase">Copied!</span>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {item.associatedMobile && (
                          <p className="text-[10px] text-slate-500 font-medium">Mob: {item.associatedMobile}</p>
                        )}
                        {item.associatedEmail && (
                          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{item.associatedEmail}</p>
                        )}
                      </td>

                      {/* Password */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 min-w-[100px] text-center">
                            {isVisible ? (item.password || '---') : '••••••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(item.id)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            title={isVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isVisible ? '🙈' : '👁️'}
                          </button>
                          {item.password && (
                            <button
                              onClick={() => handleCopy(item.password || '', passCopyKey)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
                              title="Copy Password"
                            >
                              {copiedKey === passCopyKey ? (
                                <span className="text-[9px] font-black text-emerald-600 uppercase">Copied!</span>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                        {item.securityKey && (
                          <p className="text-[10px] font-mono text-indigo-600 font-bold mt-1">
                            PIN: {item.securityKey}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.portalUrl ? (
                            <button
                              type="button"
                              onClick={() => handleLoginPortal(item)}
                              className={`p-2 rounded-xl text-xs font-black flex items-center gap-1 transition-all shadow-2xs ${
                                isAppCategory 
                                  ? 'bg-fuchsia-100 hover:bg-fuchsia-700 text-fuchsia-900 hover:text-white border border-fuchsia-200' 
                                  : 'bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-100'
                              }`}
                              title={`Copy User ID (${item.username || item.identifier || 'User'}) & Open ${item.category} Portal`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span>Login</span>
                            </button>
                          ) : null}

                          <button
                            onClick={() => handleShareWhatsApp(item)}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 transition-all text-xs font-black flex items-center gap-1 shadow-2xs"
                            title="Share Credential via WhatsApp"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            <span>Share</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-xs"
                            title="Edit Practitioner Credential"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-all text-xs font-bold"
                            title="Delete Credential Record"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Credential Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveSubmit}
            className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col my-auto border border-slate-100 overflow-hidden animate-in zoom-in-95"
          >
            <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔑</span>
                <div>
                  <h4 className="font-black text-lg uppercase tracking-tight">
                    {editingCred ? 'Edit Authorized Practitioner Credential' : 'Add Authorized Practitioner Credential'}
                  </h4>
                  <p className="text-fuchsia-300 text-[10px] font-bold uppercase tracking-widest">
                    Save CA, Advocate, Tax Professional & Software App User Login
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-10 w-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-8 space-y-5 overflow-y-auto max-h-[75vh]">
              
              {/* Category */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                  Portal / Application Category
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={e => {
                    const cat = e.target.value as PortalCategory;
                    setFormData(prev => ({
                      ...prev,
                      category: cat,
                      portalUrl: PORTAL_URL_MAP[cat] || prev.portalUrl || ''
                    }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs outline-none focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="App User Credential">📱 App & Software User Credentials (Software Apps / Firm)</option>
                  <option value="GST Portal">GST Practitioner Portal (www.gst.gov.in)</option>
                  <option value="Income Tax">Income Tax Portal / ERIC (eportal.incometax.gov.in)</option>
                  <option value="GSTAT Portal">GSTAT Appellate Tribunal (efiling.gstat.gov.in)</option>
                  <option value="E-Way Bill / E-Invoice">E-Way Bill & E-Invoice (ewaybillgst.gov.in)</option>
                  <option value="TRACES / TDS">TRACES / TDS Portal (contents.tdscpc.gov.in)</option>
                  <option value="FSSAI / Food">FSSAI / Food License (foscos.fssai.gov.in)</option>
                  <option value="MCA / ROC V3">MCA / ROC V3 Practitioner (contents.mca.gov.in)</option>
                  <option value="MSME / Udyam">MSME / Udyam (udyamregistration.gov.in)</option>
                  <option value="ICEGATE / Customs">ICEGATE / Customs (www.icegate.gov.in)</option>
                  <option value="DGFT">DGFT Portal (www.dgft.gov.in)</option>
                  <option value="PF & ESIC">PF & ESIC Portal</option>
                  <option value="Other">Custom Website / Other App</option>
                </select>
              </div>

              {/* Practitioner / Entity Name */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1 flex items-center justify-between">
                  <span>Practitioner / Entity / Firm Name</span>
                  <span className="text-[9px] text-indigo-600 lowercase font-bold">CA / Advocate / Firm</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.clientName || ''}
                  onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="e.g. CA M. K. Sharma & Co. / Advocate R. V. Patel"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs outline-none focus:ring-4 focus:ring-indigo-100"
                />
                
                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRACTITIONER_PRESETS.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, clientName: preset }))}
                      className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Identifier (Membership No / Reg ID / User Identifier) */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                    Practitioner ID / Reg No. / Membership No
                  </label>
                  <input
                    type="text"
                    value={formData.identifier || ''}
                    onChange={e => setFormData(prev => ({ ...prev, identifier: e.target.value.toUpperCase() }))}
                    placeholder="e.g. CA-123456 or ADV-8890"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs font-mono outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                    Login User ID / Username
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.username || ''}
                    onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Portal User ID or Username"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                    Login Password
                  </label>
                  <input
                    type="text"
                    value={formData.password || ''}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs font-mono outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* Security Key / PIN */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                    Security Key / DSC PIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.securityKey || ''}
                    onChange={e => setFormData(prev => ({ ...prev, securityKey: e.target.value }))}
                    placeholder="Security PIN / Token PIN"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs font-mono outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Portal URL */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                  Portal / Application Website URL
                </label>
                <input
                  type="url"
                  value={formData.portalUrl || ''}
                  onChange={e => setFormData(prev => ({ ...prev, portalUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Associated Mobile */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                    Associated Mobile for OTP
                  </label>
                  <input
                    type="text"
                    value={formData.associatedMobile || ''}
                    onChange={e => setFormData(prev => ({ ...prev, associatedMobile: e.target.value }))}
                    placeholder="Mobile No..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* Associated Email */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                    Associated Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.associatedEmail || ''}
                    onChange={e => setFormData(prev => ({ ...prev, associatedEmail: e.target.value }))}
                    placeholder="Email Address..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                  Remarks / Practitioner Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks || ''}
                  onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="e.g. Master CA Practitioner Login, High Court Advocates Portal, Software Admin Password..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </div>

            </div>

            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-black uppercase text-xs hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-slate-900 text-white font-black uppercase text-xs shadow-lg transition-all"
              >
                {isSaving ? 'Saving...' : 'Save Credential'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export const CredentialVault = CredentialsVault;
export default CredentialsVault;
