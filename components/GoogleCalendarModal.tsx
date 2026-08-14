import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  Bell, 
  Clock, 
  Globe, 
  Zap, 
  ShieldCheck, 
  ExternalLink, 
  X 
} from 'lucide-react';
import { 
  getCalendarPreferences, 
  saveCalendarPreferences, 
  getGoogleAccessToken, 
  getGoogleAccountEmail, 
  connectGoogleAccount, 
  disconnectGoogleCalendar, 
  batchSyncDeadlinesToGoogleCalendar,
  DeadlineSyncItem
} from '../services/googleCalendar';
import { toast } from 'sonner';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  deadlinesToSync?: DeadlineSyncItem[];
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({
  isOpen,
  onClose,
  deadlinesToSync = []
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [prefs, setPrefs] = useState(getCalendarPreferences());

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setPrefs(getCalendarPreferences());
    }
  }, [isOpen]);

  const checkStatus = () => {
    const token = getGoogleAccessToken();
    const email = getGoogleAccountEmail();
    setIsConnected(!!token);
    setAccountEmail(email);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectGoogleAccount();
      checkStatus();
      toast.success('Google Account connected successfully!');
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleCalendar();
    checkStatus();
  };

  const handleTogglePref = (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    saveCalendarPreferences(updated);
    toast.success('Calendar preferences saved');
  };

  const handleSyncAll = async () => {
    if (deadlinesToSync.length === 0) {
      toast.info('No upcoming deadlines available to sync.');
      return;
    }

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: deadlinesToSync.length });

    try {
      const result = await batchSyncDeadlinesToGoogleCalendar(
        deadlinesToSync,
        (current, total) => {
          setSyncProgress({ current, total });
        }
      );

      checkStatus();
      if (result.successCount > 0) {
        toast.success(`Successfully synced ${result.successCount} deadlines to Google Calendar!`);
      }
      if (result.failedCount > 0) {
        toast.warning(`${result.failedCount} items could not be synced.`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to complete batch synchronization.');
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Calendar className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                Google Calendar Synchronization
              </h3>
              <p className="text-xs text-indigo-200 font-medium">
                Live compliance scheduling &amp; multi-day alert triggers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          
          {/* Account Status Card */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isConnected 
              ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950' 
              : 'bg-slate-50 border-slate-200/80 text-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isConnected ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold">
                      {isConnected ? 'Google Calendar Connected' : 'Google Account Not Linked'}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      isConnected ? 'bg-emerald-200/80 text-emerald-900' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isConnected ? 'Active' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    {isConnected 
                      ? (accountEmail ? `Linked to ${accountEmail}` : 'Connected with active Google OAuth token')
                      : 'Sign in with your Gmail to auto-schedule filing & notice dates.'}
                  </p>
                </div>
              </div>

              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Disconnect Google Account"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={handleConnect}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Globe className="h-3.5 w-3.5" />
                  )}
                  <span>Connect Gmail</span>
                </button>
              )}
            </div>
          </div>

          {/* Sync All Action Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                  1-Click Calendar Synchronization
                </h4>
              </div>
              <span className="text-xs font-bold text-indigo-700">
                {deadlinesToSync.length} Upcoming Deadlines
              </span>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Push all currently visible statutory compliance deadlines, litigation hearings, and task due dates directly into your Google Calendar.
            </p>

            {isSyncing && syncProgress && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-bold text-indigo-900">
                  <span>Synchronizing events...</span>
                  <span>{syncProgress.current} / {syncProgress.total}</span>
                </div>
                <div className="w-full h-2 bg-indigo-200/70 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncAll}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Syncing to Google Calendar...</span>
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  <span>Sync All Visible Deadlines ({deadlinesToSync.length})</span>
                </>
              )}
            </button>
          </div>

          {/* Preferences & Notification Settings */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-indigo-500" />
              <span>Default Reminder Notification Rules</span>
            </h4>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800">1 Day Before Alert</div>
                  <div className="text-[11px] text-slate-500">Triggers standard high-priority popup notification 24 hours prior</div>
                </div>
                <input 
                  type="checkbox"
                  checked={prefs.reminders1DayBefore}
                  onChange={() => handleTogglePref('reminders1DayBefore')}
                  className="h-4 w-4 text-indigo-600 rounded-md focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800">3 Days Before Alert</div>
                  <div className="text-[11px] text-slate-500">Early reminder to initiate client documents &amp; challan deposits</div>
                </div>
                <input 
                  type="checkbox"
                  checked={prefs.reminders3DaysBefore}
                  onChange={() => handleTogglePref('reminders3DaysBefore')}
                  className="h-4 w-4 text-indigo-600 rounded-md focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800">7 Days Before Alert (1 Week Prior)</div>
                  <div className="text-[11px] text-slate-500">Advance notification for heavy audit or litigation filings</div>
                </div>
                <input 
                  type="checkbox"
                  checked={prefs.reminders7DaysBefore}
                  onChange={() => handleTogglePref('reminders7DaysBefore')}
                  className="h-4 w-4 text-indigo-600 rounded-md focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          {/* Security & OAuth Transparency Note */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-slate-600 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Zero Password Storage:</strong> Direct authorization is powered securely by Google Identity Services OAuth 2.0. Clientify never sees or stores your password.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
          >
            <span>Open Google Calendar</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default GoogleCalendarModal;
