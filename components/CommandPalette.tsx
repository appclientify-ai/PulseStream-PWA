
import React, { useState, useEffect, useMemo } from 'react';
import { ActiveView } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onViewChange: (view: ActiveView) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onViewChange }) => {
  const [query, setQuery] = useState('');

  const COMMANDS = [
    { id: 'dashboard', label: 'Dashboard', cat: 'Navigate', icon: '🏠' },
    { id: 'gst-portfolio', label: 'GST Master List', cat: 'Navigate', icon: '🏢' },
    { id: 'admin-add-invoice', label: 'Create New Invoice', cat: 'Action', icon: '🧾' },
    { id: 'reminders', label: 'View Deadlines', cat: 'Action', icon: '📅' },
    { id: 'compliance-monthly', label: 'Monthly Filing (GSTR-1/3B)', cat: 'Compliance', icon: '⚡' },
    { id: 'settings', label: 'Vault Settings', cat: 'Navigate', icon: '⚙️' },
  ];

  const filtered = useMemo(() => {
    if (!query) return COMMANDS;
    return COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search vault, jump to module, or launch action..."
            className="flex-1 bg-transparent border-none text-xl font-black text-slate-900 placeholder-slate-300 outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2 no-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">No matching commands in vault</div>
          ) : (
            filtered.map(cmd => (
              <button 
                key={cmd.id}
                onClick={() => { onViewChange(cmd.id); onClose(); }}
                className="w-full flex items-center justify-between p-4 hover:bg-indigo-600 group rounded-2xl transition-all"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl group-hover:scale-125 transition-transform">{cmd.icon}</span>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900 group-hover:text-white uppercase">{cmd.label}</p>
                    <p className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-200 uppercase tracking-widest">{cmd.cat}</p>
                  </div>
                </div>
                <svg className="h-5 w-5 text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
