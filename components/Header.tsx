
import React, { useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { User, ActiveView } from '../types';
import { useAuth } from '../auth/AuthContext';
import { usePWA } from '../hooks/usePWA';
import { useTheme } from '../hooks/useTheme';
import { THEME_COLORS, FONT_SIZES, FONT_STYLES, THEME_MODES } from '../services/theme';

interface HeaderProps {
  isConnected: boolean;
  currentUser: User | null;
  onMenuClick: () => void;
  activeViewLabel: string;
  activeViewDescription: string;
  onViewChange: (view: ActiveView) => void;
  activeView: ActiveView;
  onOpenGuidelines: (cat: string) => void;
}

const Header: React.FC<HeaderProps> = ({ isConnected, currentUser, onMenuClick, activeViewLabel, activeViewDescription, onViewChange, activeView, onOpenGuidelines }) => {
  const { logout } = useAuth();
  const { canInstall, triggerInstall } = usePWA();
  const { settings, updateSettings } = useTheme();
  const isFetching = useIsFetching();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  return (
    <header className="flex h-16 md:h-20 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-6 backdrop-blur-md sticky top-0 z-40">
      {/* Click outside backdrop for popovers */}
      {(isThemeOpen || isProfileOpen) && (
        <div 
          className="fixed inset-0 z-[9990] bg-slate-900/10 backdrop-blur-[1px]" 
          onClick={() => { setIsThemeOpen(false); setIsProfileOpen(false); }} 
        />
      )}

      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 pr-2">
        <button 
          onClick={onMenuClick} 
          className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl md:rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm"
          aria-label="Toggle Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="h-6 md:h-8 w-[1px] bg-slate-200 hidden sm:block shrink-0" />

        <div className="min-w-0 flex-1">
           <div className="flex items-center gap-1.5 md:gap-2.5 overflow-hidden min-w-0">
             <h2 className="text-sm md:text-xl font-black text-slate-900 tracking-tight leading-none truncate uppercase">{activeViewLabel}</h2>
             <span className="text-xs md:text-sm font-bold text-slate-300 shrink-0">|</span>
             <div className="flex items-center gap-1.5 shrink-0">
               <span className="text-sm md:text-xl font-black text-indigo-600 tracking-tight">Clientify</span>
             </div>
           </div>
           <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-400 truncate mt-1.5 hidden sm:block" title={activeViewDescription}>
             {activeViewDescription}
           </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {canInstall && (
          <button onClick={triggerInstall} className="sm:hidden flex items-center justify-center h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-md shadow-indigo-600/20" title="Install App">
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>
        )}
        {canInstall && (
          <button onClick={triggerInstall} className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-md shadow-indigo-600/20">
             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             App
          </button>
        )}
        {isFetching > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-indigo-50/90 border border-indigo-200/90 px-3 py-1.5 shadow-xs animate-in fade-in duration-300">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="absolute -inset-1 rounded-full bg-indigo-500/30 blur-xs animate-pulse" />
              <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider animate-pulse hidden sm:inline">Syncing...</span>
          </div>
        )}
        <div className="hidden lg:flex items-center gap-3 rounded-full bg-slate-50 px-4 py-2 border border-slate-100">
           <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isConnected ? 'Vault Live' : 'Local Snapshot'}</span>
        </div>

        {/* Unified Guideline Button (All Pages, All Guides) */}
        <button
          onClick={() => {
            const getCategoryForView = (view: string): string => {
              if (view === 'dashboard' || view.startsWith('lit-')) return 'Notice';
              if (view === 'gst-portfolio' || 
                  view.startsWith('compliance-monthly') || 
                  view.startsWith('compliance-quarterly') || 
                  view.startsWith('compliance-composition') || 
                  view.startsWith('compliance-gstr4') || 
                  view.startsWith('compliance-gstr9')) return 'GstRules';
              if (view === 'misc-gst-reg') return 'GstReg';
              if (view === 'it-portfolio' || view === 'compliance-itr' || view === 'compliance-taxaudit') return 'ItRules';
              if (view === 'misc-food-lic') return 'FoodLicense';
              if (view === 'misc-msme') return 'Msme';
              if (view === 'misc-work') return 'WorkLog';
              return 'Notice';
            };
            onOpenGuidelines(getCategoryForView(activeView));
            setIsThemeOpen(false);
            setIsProfileOpen(false);
          }}
          className="flex h-10 md:h-12 items-center gap-1.5 md:gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-2.5 md:px-4 rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-sm active:scale-95 shrink-0"
          title="Open Compliance & Statutory Guidelines Manual"
        >
          <span className="text-base md:text-lg">⚖️</span>
          <span className="hidden md:inline font-extrabold text-[11px]">Statutory Guide</span>
        </button>

        {/* Quick UI Theme Customizer Popover */}
        <div className="relative">
          <button
            onClick={() => { setIsThemeOpen(!isThemeOpen); setIsProfileOpen(false); }}
            className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm relative"
            title="App Theme & Typography Customizer"
          >
            <span className="text-base md:text-lg">🎨</span>
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white" style={{ backgroundColor: THEME_COLORS.find(c => c.id === settings.themeColor)?.primary || '#4f46e5' }} />
          </button>

          {isThemeOpen && (
            <div className="fixed left-3 right-3 top-16 sm:left-auto sm:right-3 sm:w-80 md:w-96 sm:max-w-md bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-5 animate-in zoom-in-95 duration-200 sm:origin-top-right z-[10000] text-slate-900 max-h-[80vh] overflow-y-auto no-scrollbar sm:absolute sm:top-full sm:mt-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎨</span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Quick App Customizer</h4>
                </div>
                <button onClick={() => setIsThemeOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1">✕</button>
              </div>

              {/* Theme Colors */}
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Accent Color</p>
                <div className="grid grid-cols-4 gap-2">
                  {THEME_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => updateSettings({ themeColor: c.id as any })}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border text-left transition-all ${
                        settings.themeColor === c.id ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: c.primary }} />
                      <span className="text-[10px] font-bold text-slate-800 truncate">{c.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Font Size ({settings.fontSize}px)</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {FONT_SIZES.map(sz => (
                    <button
                      key={sz.value}
                      onClick={() => updateSettings({ fontSize: sz.value })}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition-all ${
                        settings.fontSize === sz.value ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {sz.value}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Style */}
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Typography Style</p>
                <div className="grid grid-cols-2 gap-2">
                  {FONT_STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => updateSettings({ fontStyle: s.id as any })}
                      className={`p-2 rounded-xl border text-left transition-all ${s.fontClass} ${
                        settings.fontStyle === s.id ? 'border-indigo-600 bg-indigo-50/70' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <p className="text-[10px] font-black text-indigo-600 leading-none">{s.name}</p>
                      <p className="text-xs font-bold text-slate-800 mt-1 truncate">Clientify Practice</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Mode */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Canvas Mode</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_MODES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => updateSettings({ themeMode: m.id as any })}
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
                        settings.themeMode === m.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider block">{m.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsThemeOpen(false); }}
            className="flex items-center gap-2 md:gap-3 group hover:bg-slate-50 p-1 rounded-2xl transition-all"
          >
            <div className="text-right hidden md:block max-w-[120px] lg:max-w-[160px]">
              <p className="text-sm font-black text-slate-900 leading-none truncate">{currentUser?.username}</p>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 truncate">{currentUser?.firm_name || 'Practitioner'}</p>
            </div>
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="DP" className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl object-cover shadow-lg ring-2 ring-slate-50" />
            ) : (
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-indigo-600 flex items-center justify-center text-sm md:text-lg font-black text-white shadow-lg ring-2 ring-slate-50">
                {currentUser?.username?.substring(0, 2).toUpperCase()}
              </div>
            )}
          </button>

          {isProfileOpen && (
            <div className="fixed right-3 top-16 sm:absolute sm:right-0 sm:top-full sm:mt-3 w-60 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl p-2 animate-in zoom-in-95 duration-200 origin-top-right z-[10000]">
               <div className="p-3 border-b border-slate-100 mb-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vault Session ID</p>
                  <p className="text-xs font-black text-slate-900 truncate">{currentUser?.user_id}</p>
               </div>
               <button 
                 onClick={() => { onViewChange('settings'); setIsProfileOpen(false); }}
                 className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                 </svg>
                 Firm Settings
               </button>
               <button 
                 onClick={logout}
                 className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-black text-xs uppercase tracking-widest"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
                 Exit Vault
               </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
