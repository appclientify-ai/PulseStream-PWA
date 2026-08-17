import React, { useState } from 'react';
import { fetchGstinPublicDetails, GstinDetails, validateGstinFormat } from '../services/gstinLookup.ts';
import { toast } from 'sonner';

interface GSTINLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportClient?: (details: GstinDetails) => void;
}

export const GSTINLookupModal: React.FC<GSTINLookupModalProps> = ({
  isOpen,
  onClose,
  onImportClient
}) => {
  const [gstinInput, setGstinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<GstinDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    const clean = gstinInput.trim().toUpperCase();

    if (!clean) {
      setError('Please enter a 15-digit GSTIN number.');
      return;
    }

    if (clean.length !== 15) {
      setError('GSTIN must be exactly 15 characters long.');
      return;
    }

    if (!validateGstinFormat(clean)) {
      setError('Invalid GSTIN format. Example: 27AAPCS1429B1Z0');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchGstinPublicDetails(clean);
      setDetails(result);
      toast.success('GSTIN details fetched successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch GSTIN details.');
      toast.error('Could not fetch details for this GSTIN.');
    } finally {
      setLoading(false);
    }
  };

  const copyField = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/30">
              🔍
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Public GSTIN Search</h2>
              <p className="text-xs text-indigo-300 font-bold">Instant Official Taxpayer Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
              Enter 15-Digit GSTIN Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={gstinInput}
                onChange={(e) => setGstinInput(e.target.value.toUpperCase().slice(0, 15))}
                placeholder="e.g. 27AAPCS1429B1Z0"
                maxLength={15}
                className="flex-1 bg-slate-50 border border-slate-300 px-4 py-3 rounded-2xl font-mono font-black text-sm uppercase text-indigo-700 tracking-widest outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <span>🔍 Search</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-xs font-bold text-center">
              ⚠️ {error}
            </div>
          )}

          {details && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-mono font-black text-xs">
                    {details.gstin}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider ${
                    details.gstStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    ● {details.gstStatus}
                  </span>
                </div>

                <button
                  onClick={() => copyField(JSON.stringify(details, null, 2), 'Full Profile')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  📋 Copy JSON
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Trade Name</span>
                  <p className="font-black text-slate-800 text-sm">{details.tradeName}</p>
                </div>

                <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Legal Name</span>
                  <p className="font-black text-slate-800 text-sm">{details.legalName}</p>
                </div>

                <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Derived PAN</span>
                  <p className="font-mono font-bold text-indigo-600">{details.pan}</p>
                </div>

                <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Constitution</span>
                  <p className="font-bold text-slate-700">{details.constitution}</p>
                </div>

                <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Registration Date</span>
                  <p className="font-mono font-bold text-slate-700">{details.regDate}</p>
                </div>

                <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Taxpayer Type</span>
                  <p className="font-bold text-slate-700">{details.taxpayerType}</p>
                </div>

                <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200 md:col-span-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Registered Place of Business</span>
                  <p className="font-bold text-slate-700 leading-relaxed">{details.address}</p>
                </div>

                <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200 md:col-span-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Jurisdiction Office</span>
                  <p className="font-bold text-slate-700">{details.jurisdiction}</p>
                </div>
              </div>

              {onImportClient && (
                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => {
                      onImportClient(details);
                      onClose();
                    }}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>➕ Add to GST Client Vault</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
