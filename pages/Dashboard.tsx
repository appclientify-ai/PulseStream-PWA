
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
      if (!isOnline) return; // Pause random updates if offline
      setState(prev => ({
        ...prev,
        metrics: prev.metrics.map(m => ({
          ...m,
          value: m.value + (Math.random() - 0.5) * 5,
          trend: Math.random() > 0.5 ? 'up' : 'down'
        }))
      }));
    }, 3000);
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
    
    // In an offline-first app without persistent storage, we simply try to emit.
    // If offline, the UI shows the message, but it won't persist on refresh if the server didn't get it.
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {state.metrics.map((metric, idx) => <MetricCard key={idx} metric={metric} />)}
              <div className="col-span-full mt-6 rounded-2xl bg-slate-900/50 p-6 border border-slate-800 backdrop-blur-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-300">Live Pulse Activity</h3>
                <div className="h-64 w-full flex items-end justify-between gap-2 px-4">
                   {[...Array(20)].map((_, i) => (
                     <div 
                      key={i} 
                      className={`w-full ${isOnline ? 'bg-blue-500/30 animate-pulse' : 'bg-slate-700/20'} rounded-t-md transition-all duration-500`} 
                      style={{ 
                        height: `${Math.random() * 80 + 20}%`, 
                        animationDelay: `${i * 0.1}s` 
                      }} 
                    />
                   ))}
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
