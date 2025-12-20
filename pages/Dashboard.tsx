
import React, { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import { INITIAL_METRICS, MOCK_USERS } from '../constants';
import { AppState, Message, MetricData } from '../types';
import { usePWA } from '../hooks/usePWA';
import { useAuth } from '../auth/AuthContext';
import { useOffline } from '../hooks/useOffline';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MetricCard from '../components/MetricCard';
import ChatPanel from '../components/ChatPanel';
import InstallBanner from '../components/InstallBanner';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isOnline = useOffline();
  const [state, setState] = useState<AppState>({
    messages: [],
    metrics: INITIAL_METRICS as MetricData[],
    users: MOCK_USERS as any[],
    isConnected: false,
    currentUser: user,
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');
  const { installPrompt, triggerInstall } = usePWA();

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOnline) return;
      setState(prev => ({
        ...prev,
        metrics: prev.metrics.map(m => {
          // Simulate some small shifts in workload/progress
          const change = (Math.random() - 0.5) * 1.5;
          return {
            ...m,
            value: Math.max(0, m.value + change),
            trend: change > 0 ? 'up' : 'down'
          };
        })
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) {
      socketService.connect();
      setState(prev => ({ ...prev, isConnected: true }));
    } else {
      socketService.disconnect();
      setState(prev => ({ ...prev, isConnected: false }));
    }
    return () => { socketService.disconnect(); };
  }, [isOnline]);

  const handleSendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: user?.username || 'System',
      content,
      timestamp: Date.now(),
    };
    
    setState(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
    
    if (isOnline) {
      socketService.emit('message', newMessage);
    }
  }, [user, isOnline]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Header isConnected={state.isConnected && isOnline} currentUser={user} />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
          {installPrompt && <InstallBanner onInstall={triggerInstall} />}
          {activeTab === 'dashboard' ? (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {state.metrics.map((metric, idx) => <MetricCard key={idx} metric={metric} />)}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl bg-slate-900/50 p-6 border border-slate-800 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-300">Client Compliance Pipeline</h3>
                    <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Live Updates</span>
                  </div>
                  <div className="h-64 w-full flex items-end justify-between gap-3 px-4">
                     {[...Array(12)].map((_, i) => (
                       <div key={i} className="flex flex-col items-center flex-1">
                          <div 
                            className={`w-full ${isOnline ? 'bg-indigo-500/30' : 'bg-slate-700/20'} rounded-t-lg transition-all duration-1000 ease-in-out`} 
                            style={{ 
                              height: `${Math.random() * 70 + 20}%`,
                            }} 
                          />
                          <span className="mt-2 text-[10px] text-slate-500 font-medium">M{i+1}</span>
                       </div>
                     ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-900/50 p-6 border border-slate-800 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-300">Upcoming Deadlines</h3>
                  <div className="space-y-4">
                    {[
                      { title: 'GST GSTR-3B Filing', date: 'Oct 20, 2024', status: 'critical' },
                      { title: 'TDS Payment Q3', date: 'Oct 07, 2024', status: 'upcoming' },
                      { title: 'ITR-3 Audit Subm.', date: 'Oct 31, 2024', status: 'pending' },
                    ].map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                        <div>
                          <p className="text-sm font-bold text-slate-200">{d.title}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{d.date}</p>
                        </div>
                        <div className={`h-2 w-2 rounded-full ${d.status === 'critical' ? 'bg-red-500' : 'bg-indigo-500'}`} />
                      </div>
                    ))}
                  </div>
                  <button className="mt-6 w-full py-2.5 rounded-xl border border-indigo-500/30 text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                    View Filing Calendar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ChatPanel messages={state.messages} onSend={handleSendMessage} currentUser={user} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;