import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Client, PortalCredentialRecord, PortalCategory, FoodLicenseRecord } from '../../types';

interface CredentialsVaultProps {
  onShowMessage?: (msg: { type: 'success' | 'error'; text: string }) => void;
}

interface CombinedCredentialItem {
  id: string;
  isCustom: boolean; // true if created in custom vault, false if auto-derived from Client profile
  rawRecord?: PortalCredentialRecord;
  clientId?: string;
  clientName: string;
  category: PortalCategory;
  portalUrl: string;
  identifier: string; // GSTIN / PAN / TAN / Udyam / User ID
  username: string;
  password?: string;
  associatedMobile?: string;
  associatedEmail?: string;
  securityKey?: string;
  remarks?: string;
  updatedAt?: number;
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

export const CredentialsVault: React.FC<CredentialsVaultProps> = ({ onShowMessage }) => {
  const [customCreds, setCustomCreds] = useState<PortalCredentialRecord[]>([]);
  const [dbClients, setDbClients] = useState<Client[]>([]);
  const [foodLicenses, setFoodLicenses] = useState<FoodLicenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Visibility toggles for passwords
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showAllPasswords, setShowAllPasswords] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal states for adding/editing custom portal credentials
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCred, setEditingCred] = useState<Partial<PortalCredentialRecord> | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState<Partial<PortalCredentialRecord>>({
    clientName: 'Firm Level - Master',
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
      const [credsData, clientsData, foodData] = await Promise.all([
        api.getPortalCredentials(true),
        api.getClients(true),
        api.getFoodLicenses(true)
      ]);
      setCustomCreds(credsData || []);
      setDbClients(clientsData || []);
      setFoodLicenses(foodData || []);
    } catch (err: any) {
      console.error('Failed to load portal credentials:', err);
      if (onShowMessage) onShowMessage({ type: 'error', text: 'Failed to load credentials vault.' });
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

  // Combine custom credentials with client profiles
  const allCredentialsList = useMemo<CombinedCredentialItem[]>(() => {
    const list: CombinedCredentialItem[] = [];

    // 1. Add Custom Portal Credentials
    customCreds.forEach(c => {
      list.push({
        id: c.id,
        isCustom: true,
        rawRecord: c,
        clientName: c.clientName || 'Firm Master',
        category: c.category || 'Other',
        portalUrl: c.portalUrl || PORTAL_URL_MAP[c.category] || '',
        identifier: c.identifier || '---',
        username: c.username || '---',
        password: c.password || '',
        associatedMobile: c.associatedMobile || '',
        associatedEmail: c.associatedEmail || '',
        securityKey: c.securityKey || '',
        remarks: c.remarks || '',
        updatedAt: c.updatedAt
      });
    });

    // 2. Derive credentials from Clients
    dbClients.forEach(client => {
      const name = client.tradeName || client.legalName || 'Unnamed Client';

      // GST Portal Login
      if (client.gstProfile?.username || client.gstProfile?.gstin) {
        list.push({
          id: `client_gst_${client.id}`,
          isCustom: false,
          clientId: client.id,
          clientName: name,
          category: 'GST Portal',
          portalUrl: PORTAL_URL_MAP['GST Portal'],
          identifier: client.gstProfile.gstin || 'N/A',
          username: client.gstProfile.username || 'Not Set',
          password: client.gstProfile.password || '',
          associatedMobile: client.mobile,
          associatedEmail: client.email,
          remarks: `Reg Type: ${client.gstProfile.regType || 'Regular'} • Freq: ${client.gstProfile.filingFreq || 'Monthly'}`
        });
      }

      // E-Way Bill Portal Login
      if (client.gstProfile?.ewayUsername) {
        list.push({
          id: `client_ewb_${client.id}`,
          isCustom: false,
          clientId: client.id,
          clientName: `${name} (E-Way Bill)`,
          category: 'E-Way Bill / E-Invoice',
          portalUrl: PORTAL_URL_MAP['E-Way Bill / E-Invoice'],
          identifier: client.gstProfile.gstin || 'N/A',
          username: client.gstProfile.ewayUsername,
          password: client.gstProfile.ewayPassword || '',
          associatedMobile: client.mobile,
          associatedEmail: client.email,
          remarks: 'Auto-derived from GST Profile E-Way Bill setup'
        });
      }

      // GSTAT Portal Login
      if (client.gstProfile?.gstatUsername) {
        list.push({
          id: `client_gstat_${client.id}`,
          isCustom: false,
          clientId: client.id,
          clientName: `${name} (GSTAT Tribunal)`,
          category: 'GSTAT Portal',
          portalUrl: PORTAL_URL_MAP['GSTAT Portal'],
          identifier: client.gstProfile.gstin || 'N/A',
          username: client.gstProfile.gstatUsername,
          password: client.gstProfile.gstatPassword || '',
          associatedMobile: client.mobile,
          associatedEmail: client.email,
          remarks: 'Appellate Tribunal login credentials'
        });
      }

      // Income Tax Portal Login
      if (client.itProfile?.username || client.itProfile?.pan) {
        list.push({
          id: `client_it_${client.id}`,
          isCustom: false,
          clientId: client.id,
          clientName: name,
          category: 'Income Tax',
          portalUrl: PORTAL_URL_MAP['Income Tax'],
          identifier: client.itProfile.pan || 'N/A',
          username: client.itProfile.username || client.itProfile.pan || 'Not Set',
          password: client.itProfile.password || '',
          associatedMobile: client.mobile,
          associatedEmail: client.email,
          remarks: `Category: ${client.itProfile.category || 'Individual'} • Work: ${client.itProfile.natureOfWork || 'General'}`
        });
      }

      // Stakeholder IT Passwords
      if (client.itProfile?.stakeholders && client.itProfile.stakeholders.length > 0) {
        client.itProfile.stakeholders.forEach((sh, idx) => {
          if (sh.itPassword || sh.pan) {
            list.push({
              id: `client_sh_${client.id}_${sh.id || idx}`,
              isCustom: false,
              clientId: client.id,
              clientName: `${name} - ${sh.name} (Stakeholder)`,
              category: 'Income Tax',
              portalUrl: PORTAL_URL_MAP['Income Tax'],
              identifier: sh.pan || 'N/A',
              username: sh.pan || sh.name,
              password: sh.itPassword || '',
              associatedMobile: sh.mobile || client.mobile,
              remarks: `Partner/Director/Proprietor for ${name}`
            });
          }
        });
      }
    });

    // 3. Derive credentials from Food Licenses (FSSAI)
    foodLicenses.forEach(food => {
      if (food.licenseNo || food.password) {
        list.push({
          id: `food_lic_${food.id}`,
          isCustom: false,
          clientName: food.tradeName || food.legalName || food.clientName || 'Food License Client',
          category: 'FSSAI / Food',
          portalUrl: PORTAL_URL_MAP['FSSAI / Food'],
          identifier: food.licenseNo || 'Awaiting Issue',
          username: food.licenseNo || food.mobile || 'FSSAI User',
          password: food.password || '',
          associatedMobile: food.mobile,
          remarks: `Type: ${food.licenseType} • Status: ${food.status}`
        });
      }
    });

    return list;
  }, [customCreds, dbClients, foodLicenses]);

  // Filtered List
  const filteredCredentials = useMemo(() => {
    let list = allCredentialsList;

    if (selectedCategory !== 'ALL') {
      list = list.filter(item => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.clientName.toLowerCase().includes(q) ||
        item.identifier.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.remarks && item.remarks.toLowerCase().includes(q)) ||
        (item.associatedMobile && item.associatedMobile.includes(q))
      );
    }

    return list;
  }, [allCredentialsList, selectedCategory, searchQuery]);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShareWhatsApp = (item: CombinedCredentialItem) => {
    const text = `🔐 *CLIENT CREDENTIALS DETAILED RECORD*\n\n` +
      `👤 *Entity:* ${item.clientName}\n` +
      `🌐 *Portal:* ${item.category}\n` +
      `🆔 *Identifier:* ${item.identifier}\n` +
      `🔑 *Username:* ${item.username}\n` +
      `🔒 *Password:* ${item.password || '---'}\n` +
      (item.securityKey ? `🛡️ *Security PIN/Key:* ${item.securityKey}\n` : '') +
      (item.portalUrl ? `🔗 *Login Link:* ${item.portalUrl}\n` : '') +
      (item.remarks ? `📝 *Notes:* ${item.remarks}\n` : '') +
      `\n_Sent safely via Clientify Vault_`;

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
      clientName: 'Firm Level - Master',
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

  const handleOpenEditModal = (item: CombinedCredentialItem) => {
    if (!item.isCustom || !item.rawRecord) {
      if (onShowMessage) onShowMessage({ type: 'error', text: 'Auto-derived client credentials must be updated directly in the Client Hub.' });
      return;
    }
    setEditingCred(item.rawRecord);
    setFormData({ ...item.rawRecord });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: CombinedCredentialItem) => {
    if (!item.isCustom) {
      if (onShowMessage) onShowMessage({ type: 'error', text: 'Auto-derived client credentials can only be edited or cleared from the Client Portfolio.' });
      return;
    }
    if (!confirm(`Are you sure you want to delete credential record for "${item.clientName} - ${item.category}"?`)) return;

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
      if (onShowMessage) onShowMessage({ type: 'error', text: 'Client name and username are required.' });
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save vault credential record
      await api.savePortalCredential({
        ...formData,
        id: editingCred?.id
      });

      // 2. If linked to an existing Client, update client's profile sync automatically
      if (formData.clientId) {
        const client = dbClients.find(c => c.id === formData.clientId);
        if (client) {
          let updated = false;
          const updatedClient = { ...client };

          if (formData.category === 'GST Portal') {
            updatedClient.gstProfile = {
              ...(updatedClient.gstProfile || {}),
              username: formData.username,
              password: formData.password || ''
            };
            if (formData.identifier) updatedClient.gstProfile.gstin = formData.identifier;
            updated = true;
          } else if (formData.category === 'E-Way Bill / E-Invoice') {
            updatedClient.gstProfile = {
              ...(updatedClient.gstProfile || {}),
              ewayUsername: formData.username,
              ewayPassword: formData.password || ''
            };
            if (formData.identifier && !updatedClient.gstProfile.gstin) updatedClient.gstProfile.gstin = formData.identifier;
            updated = true;
          } else if (formData.category === 'GSTAT Portal') {
            updatedClient.gstProfile = {
              ...(updatedClient.gstProfile || {}),
              gstatUsername: formData.username,
              gstatPassword: formData.password || ''
            };
            if (formData.identifier && !updatedClient.gstProfile.gstin) updatedClient.gstProfile.gstin = formData.identifier;
            updated = true;
          } else if (formData.category === 'Income Tax') {
            updatedClient.itProfile = {
              ...(updatedClient.itProfile || {}),
              username: formData.username,
              password: formData.password || ''
            };
            if (formData.identifier) updatedClient.itProfile.pan = formData.identifier;
            updated = true;
          }

          if (updated) {
            await api.saveClient(updatedClient);
          }
        }
      }

      // 3. If category is FSSAI / Food, sync with food license record
      if (formData.category === 'FSSAI / Food' && (formData.password || formData.identifier)) {
        const targetName = (formData.clientName || '').toLowerCase();
        const food = foodLicenses.find(f => 
          (f.tradeName && f.tradeName.toLowerCase() === targetName) ||
          (f.legalName && f.legalName.toLowerCase() === targetName) ||
          (f.clientName && f.clientName.toLowerCase() === targetName) ||
          (formData.identifier && f.licenseNo === formData.identifier)
        );
        if (food) {
          await api.saveFoodLicense({
            ...food,
            licenseNo: formData.identifier || food.licenseNo,
            password: formData.password || food.password
          });
        }
      }

      setIsModalOpen(false);
      if (onShowMessage) onShowMessage({ type: 'success', text: editingCred ? 'Credential updated & client profile synchronized.' : 'New portal credential saved to vault & linked.' });
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
              🔐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Portal Credentials Vault</h3>
                <span className="bg-indigo-500/30 text-indigo-300 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                  Practitioner Hub
                </span>
              </div>
              <p className="text-slate-400 text-xs font-medium mt-1">
                Centralized password manager for GST, Income Tax, GSTAT, E-Way Bill, TRACES, MCA/ROC & custom portals.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowAllPasswords(!showAllPasswords)}
              className="flex-1 md:flex-initial px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              <span>{showAllPasswords ? '🙈 Hide All Passwords' : '👁️ Reveal All Passwords'}</span>
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
              placeholder="Search by client, GSTIN, PAN, username, portal..."
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
            Showing <span className="text-slate-900">{filteredCredentials.length}</span> of {allCredentialsList.length} Credentials
          </div>
        </div>

        {/* Portal Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {[
            { id: 'ALL', label: 'All Portals' },
            { id: 'GST Portal', label: 'GST Portal' },
            { id: 'Income Tax', label: 'Income Tax' },
            { id: 'GSTAT Portal', label: 'GSTAT Tribunal' },
            { id: 'E-Way Bill / E-Invoice', label: 'E-Way Bill' },
            { id: 'TRACES / TDS', label: 'TRACES / TDS' },
            { id: 'FSSAI / Food', label: 'FSSAI / Food' },
            { id: 'App User Credential', label: '📱 App User Credentials' },
            { id: 'MCA / ROC V3', label: 'MCA V3 / ROC' },
            { id: 'MSME / Udyam', label: 'MSME / Udyam' },
            { id: 'ICEGATE / Customs', label: 'Customs' },
            { id: 'DGFT', label: 'DGFT' },
            { id: 'PF & ESIC', label: 'PF & ESIC' },
            { id: 'Other', label: 'Custom / Other' }
          ].map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  isSelected 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Credentials Table / Cards Grid */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center text-slate-400 font-bold animate-pulse text-xs uppercase tracking-widest">
            Loading Practice Credentials Vault...
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="text-4xl">🔑</div>
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">No Matching Credentials Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search criteria or filter.' : 'Click "Add Credential" above to save custom practitioner portal logins, or add clients in Client Hub.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="py-4 px-6">Entity / Client</th>
                  <th className="py-4 px-4">Portal & ID</th>
                  <th className="py-4 px-4">Username</th>
                  <th className="py-4 px-4">Password</th>
                  <th className="py-4 px-4 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCredentials.map(item => {
                  const isVisible = showAllPasswords || visiblePasswords[item.id];
                  const userCopyKey = `user_${item.id}`;
                  const passCopyKey = `pass_${item.id}`;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-all group">
                      
                      {/* Client / Entity */}
                      <td className="py-4 px-6 align-top">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${item.isCustom ? 'bg-indigo-600' : 'bg-emerald-500'}`} />
                          <p className="font-black text-slate-900 uppercase tracking-tight text-xs">
                            {item.clientName}
                          </p>
                        </div>
                        {item.remarks && (
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 max-w-xs truncate">
                            {item.remarks}
                          </p>
                        )}
                        <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.isCustom ? 'Vault Custom' : 'Client Profile Sync'}
                        </span>
                      </td>

                      {/* Portal Category & Identifier */}
                      <td className="py-4 px-4 align-top">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {item.category}
                        </span>
                        <p className="font-mono text-xs font-bold text-slate-800 mt-1 uppercase">
                          {item.identifier}
                        </p>
                      </td>

                      {/* Username */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">{item.username}</span>
                          <button
                            onClick={() => handleCopy(item.username, userCopyKey)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
                            title="Copy Username"
                          >
                            {copiedKey === userCopyKey ? (
                              <span className="text-[9px] font-black text-emerald-600">✓</span>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {item.associatedMobile && (
                          <p className="text-[10px] text-slate-400 font-medium">Mob: {item.associatedMobile}</p>
                        )}
                      </td>

                      {/* Password */}
                      <td className="py-4 px-4 align-top">
                        {item.password ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">
                              {isVisible ? item.password : '••••••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(item.id)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
                              title={isVisible ? 'Hide password' : 'Show password'}
                            >
                              <span className="text-xs">{isVisible ? '🙈' : '👁️'}</span>
                            </button>
                            <button
                              onClick={() => handleCopy(item.password!, passCopyKey)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
                              title="Copy Password"
                            >
                              {copiedKey === passCopyKey ? (
                                <span className="text-[9px] font-black text-emerald-600">✓</span>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-medium text-[11px]">No password stored</span>
                        )}
                        {item.securityKey && (
                          <p className="text-[10px] text-amber-600 font-bold mt-0.5">PIN: {item.securityKey}</p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.portalUrl && (
                            <a
                              href={item.portalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 transition-all text-xs font-bold flex items-center gap-1"
                              title={`Open ${item.category} Portal`}
                            >
                              <span>Launch</span>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}

                          <button
                            onClick={() => handleShareWhatsApp(item)}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 transition-all text-xs font-bold flex items-center gap-1"
                            title="Share Credentials via WhatsApp"
                          >
                            <span>Share</span>
                          </button>

                          {item.isCustom && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 transition-all"
                                title="Edit Credential"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-600 transition-all"
                                title="Delete Credential"
                              >
                                🗑️
                              </button>
                            </>
                          )}
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
                    {editingCred ? 'Edit Portal Credential' : 'New Portal Credential'}
                  </h4>
                  <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">
                    Store Practitioner or Client Portal Password
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
              
              {/* Select Existing Client Link */}
              <div>
                <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block mb-1.5 ml-1 flex items-center justify-between">
                  <span>🔍 Pick Existing Client to Link (Auto-Fill & Sync)</span>
                  <span className="text-[9px] text-slate-400 font-normal lowercase">Optional</span>
                </label>
                <select
                  value={formData.clientId || ''}
                  onChange={e => {
                    const selectedId = e.target.value;
                    if (!selectedId) {
                      setFormData(prev => ({ ...prev, clientId: undefined }));
                      return;
                    }
                    const client = dbClients.find(c => c.id === selectedId);
                    if (client) {
                      const cName = client.tradeName || client.legalName || 'Client';
                      let identifier = formData.identifier || '';
                      let username = formData.username || '';
                      let password = formData.password || '';

                      const currentCat = formData.category || 'GST Portal';

                      if (currentCat === 'GST Portal') {
                        identifier = client.gstProfile?.gstin || identifier;
                        username = client.gstProfile?.username || username;
                        password = client.gstProfile?.password || password;
                      } else if (currentCat === 'E-Way Bill / E-Invoice') {
                        identifier = client.gstProfile?.gstin || identifier;
                        username = client.gstProfile?.ewayUsername || username;
                        password = client.gstProfile?.ewayPassword || password;
                      } else if (currentCat === 'GSTAT Portal') {
                        identifier = client.gstProfile?.gstin || identifier;
                        username = client.gstProfile?.gstatUsername || username;
                        password = client.gstProfile?.gstatPassword || password;
                      } else if (currentCat === 'Income Tax') {
                        identifier = client.itProfile?.pan || identifier;
                        username = client.itProfile?.username || client.itProfile?.pan || username;
                        password = client.itProfile?.password || password;
                      } else if (currentCat === 'FSSAI / Food') {
                        const food = foodLicenses.find(f => 
                          (f.tradeName && f.tradeName.toLowerCase() === cName.toLowerCase()) ||
                          (f.legalName && f.legalName.toLowerCase() === (client.legalName || '').toLowerCase()) ||
                          (f.clientName && f.clientName.toLowerCase() === cName.toLowerCase())
                        );
                        if (food) {
                          identifier = food.licenseNo || identifier;
                          username = food.licenseNo || food.mobile || username;
                          password = food.password || password;
                        }
                      }

                      setFormData(prev => ({
                        ...prev,
                        clientId: client.id,
                        clientName: cName,
                        identifier: identifier,
                        username: username,
                        password: password,
                        associatedMobile: client.mobile || prev.associatedMobile,
                        associatedEmail: client.email || prev.associatedEmail
                      }));
                    }
                  }}
                  className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs outline-none focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="">-- Custom / Firm Master Credential (No Client Link) --</option>
                  {dbClients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.tradeName || c.legalName} {c.gstProfile?.gstin ? `(GSTIN: ${c.gstProfile.gstin})` : c.itProfile?.pan ? `(PAN: ${c.itProfile.pan})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                  Portal Category
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
                  <option value="GST Portal">GST Portal (www.gst.gov.in)</option>
                  <option value="Income Tax">Income Tax Portal (eportal.incometax.gov.in)</option>
                  <option value="GSTAT Portal">GSTAT Appellate Tribunal (efiling.gstat.gov.in)</option>
                  <option value="E-Way Bill / E-Invoice">E-Way Bill & E-Invoice (ewaybillgst.gov.in)</option>
                  <option value="TRACES / TDS">TRACES / TDS Portal (contents.tdscpc.gov.in)</option>
                  <option value="FSSAI / Food">FSSAI / Food License (foscos.fssai.gov.in)</option>
                  <option value="App User Credential">📱 App & Software User Credentials (Firm/Software Apps)</option>
                  <option value="MCA / ROC V3">MCA / ROC V3 (contents.mca.gov.in)</option>
                  <option value="MSME / Udyam">MSME / Udyam (udyamregistration.gov.in)</option>
                  <option value="ICEGATE / Customs">ICEGATE / Customs (www.icegate.gov.in)</option>
                  <option value="DGFT">DGFT Portal (www.dgft.gov.in)</option>
                  <option value="PF & ESIC">PF & ESIC Portal</option>
                  <option value="Other">Custom / Other Portal</option>
                </select>
              </div>

              {/* Entity / Client Name */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                  Client / Entity Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.clientName || ''}
                  onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="e.g. Firm Level Master OR Client Name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs uppercase outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Identifier (GSTIN / PAN / User ID) */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                    Identifier (GSTIN / PAN / User ID)
                  </label>
                  <input
                    type="text"
                    value={formData.identifier || ''}
                    onChange={e => setFormData(prev => ({ ...prev, identifier: e.target.value.toUpperCase() }))}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs font-mono outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                    Login Username
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.username || ''}
                    onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Portal User ID / Username"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                    Portal Password
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
                    placeholder="PIN / Security Key"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs font-mono outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Portal URL */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                  Portal Website URL
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
                    Associated Mobile
                  </label>
                  <input
                    type="text"
                    value={formData.associatedMobile || ''}
                    onChange={e => setFormData(prev => ({ ...prev, associatedMobile: e.target.value }))}
                    placeholder="Mobile No for OTP..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-900 text-xs outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* Associated Email */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">
                    Associated Email
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
                  Remarks / Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks || ''}
                  onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="e.g. Master CA Practitioner Portal login, OTP linked to Mobile XYZ..."
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

export default CredentialsVault;
