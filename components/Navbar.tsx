
import React, { useState, useEffect, useRef } from 'react';
import { getStoredUiSettings, applyUiSettings, THEME_COLORS, THEME_MODES, FONT_SIZES } from '../services/theme.ts';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  onLoginClick: () => void;
  onHomeClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onHomeClick }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(getStoredUiSettings());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep settings in sync with any external updates
    const handleSettingsChange = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv.detail) {
        setSettings(customEv.detail);
      }
    };
    window.addEventListener('clientify_ui_settings_changed', handleSettingsChange);
    return () => {
      window.removeEventListener('clientify_ui_settings_changed', handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    // Close dropdown on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onHomeClick();
    }
  };

  const handleUpdateSetting = (key: string, value: any) => {
    const updated = applyUiSettings({ [key]: value });
    setSettings(updated);
  };

  const currentThemeColor = THEME_COLORS.find(c => c.id === settings.themeColor) || THEME_COLORS[0];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] w-full bg-white/70 dark:bg-slate-900/60 px-6 md:px-12 py-5 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto flex w-full items-center justify-between relative">
        
        {/* Brand/Logo */}
        <button onClick={onHomeClick} className="flex items-center gap-3.5 group text-left">
          <div className="relative flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-indigo-600 text-white font-black overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs shrink-0 transition-transform group-hover:scale-105">
            <img 
              src="/icon.png" 
              alt="Clientify Logo" 
              className="relative z-10 h-full w-full object-cover rounded-full" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.dataset.triedIcon) {
                  target.dataset.triedIcon = 'true';
                  target.src = '/icon.svg';
                } else {
                  target.style.display = 'none';
                }
              }}
            />
            <span className="absolute z-0 text-lg font-black text-white">C</span>
          </div>
          <div className="text-left">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter block leading-none">
              Client<span style={{ color: currentThemeColor.primary }}>ify</span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 block">Legal Tech Vault</span>
          </div>
        </button>
        
        {/* Navigation Items and Switchers */}
        <div className="flex items-center gap-4 sm:gap-6" ref={dropdownRef}>
          <div className="hidden lg:flex items-center gap-8 border-r border-slate-100 dark:border-slate-800 pr-8 mr-2">
             <button onClick={() => scrollToSection('platform')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Platform</button>
             <button onClick={() => scrollToSection('security')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Security</button>
          </div>

          {/* Theme & Settings Switcher Panel */}
          <div className="relative">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
              className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer shadow-xs relative"
              title="Theme Settings"
              id="theme-settings-toggle"
            >
              <span className="text-base md:text-lg">🎨</span>
              <span 
                className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 transition-all" 
                style={{ backgroundColor: currentThemeColor.primary }} 
              />
            </button>

            {/* Dropdown Menu Panel */}
            {isSettingsOpen && (
              <div 
                className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xl z-[150] animate-in fade-in slide-in-from-top-3 duration-200"
                id="theme-settings-dropdown"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Practice Theme Center</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Customize your compliance workspace</p>
                  </div>

                  {/* Theme Mode Switcher */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Canvas Style Mode</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {THEME_MODES.map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => handleUpdateSetting('themeMode', mode.id)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight text-left transition-all border ${
                            settings.themeMode === mode.id
                              ? 'bg-slate-950 text-white dark:bg-indigo-600 dark:text-white border-transparent'
                              : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200/60 dark:border-slate-700/60'
                          }`}
                        >
                          {mode.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Accent Color */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Accent Hue Color</span>
                    <div className="grid grid-cols-4 gap-2">
                      {THEME_COLORS.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => handleUpdateSetting('themeColor', color.id)}
                          style={{ backgroundColor: color.primary }}
                          className={`h-7 rounded-lg transition-all relative flex items-center justify-center cursor-pointer shadow-xs hover:scale-105 active:scale-95 ${
                            settings.themeColor === color.id ? 'ring-2 ring-slate-400 dark:ring-white scale-110' : ''
                          }`}
                          title={color.name}
                        >
                          {settings.themeColor === color.id && (
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size (Font Size Selector) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Typography Density</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{settings.fontSize}px</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200/40 dark:border-slate-700/40">
                      <button 
                        onClick={() => handleUpdateSetting('fontSize', Math.max(13, (settings.fontSize || 16) - 1))}
                        disabled={(settings.fontSize || 16) <= 13}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 shadow-xs flex items-center justify-center text-xs font-black disabled:opacity-40"
                      >
                        A-
                      </button>
                      <input 
                        type="range" 
                        min="13" 
                        max="22" 
                        value={settings.fontSize || 16}
                        onChange={(e) => handleUpdateSetting('fontSize', parseInt(e.target.value))}
                        className="flex-1 accent-indigo-600 h-1 rounded-lg cursor-pointer bg-slate-200 dark:bg-slate-700" 
                      />
                      <button 
                        onClick={() => handleUpdateSetting('fontSize', Math.min(22, (settings.fontSize || 16) + 1))}
                        disabled={(settings.fontSize || 16) >= 22}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 shadow-xs flex items-center justify-center text-xs font-black disabled:opacity-40"
                      >
                        A+
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onLoginClick} 
            style={{ backgroundColor: currentThemeColor.primary }}
            className="rounded-xl px-6 sm:px-8 py-3 text-xs font-black text-white transition-all hover:brightness-110 hover:-translate-y-0.5 shadow-md active:scale-95 whitespace-nowrap uppercase tracking-widest cursor-pointer"
          >
            Consultant Login
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
