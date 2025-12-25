
import React, { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import { INITIAL_METRICS } from '../constants';
import { AppState, Message, MetricData } from '../types';
import { usePWA } from '../hooks/usePWA';
import { useAuth } from '../auth/AuthContext';
import { useOffline } from '../hooks/useOffline';
import { api } from '../services/api';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MetricCard from '../components/MetricCard';
import ChatPanel from '../components/ChatPanel';
import InstallBanner from '../components/InstallBanner';
import Loader from '../components/Loader';

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const isOnline = useOffline();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [state, setState] = useState<AppState>({
    messages: [],
    metrics: INITIAL_METRICS as MetricData[],
    users: [],
    isConnected: false,
    currentUser: user,
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');
  const { installPrompt, triggerInstall } = usePWA();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      try {
        const items = await api.get('/items');
        setState(prev => ({
          ...prev,
          metrics: prev.metrics.map(m => 
            m.label === 'Active Clients' ? { ...m, value: items.length || 0, trend: items.length > 0 ? 'up' : 'stable' } : m
          )
        }));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsDataLoading(false);
      }
    };
    if (isOnline && token) loadData();
  }, [isOnline, token]);

  // Real-time Socket Listeners
  useEffect(() => {
    if (isOnline) {
      socketService.connect();
      
      socketService.on('db_item_change', (change: any) => {
        // Enforce client-side filtering for extra security layer
        const itemCreator = change.data?.createdBy;
        const currentUserId = user?.id || (user as any)?._id;

        if (itemCreator === currentUserId) {
          if (change.type === 'insert') {
            setState(prev => ({
              ...prev,
              metrics: prev.metrics.map(m => 
                m.label === 'Active Clients' ? { ...m, value: m.value + 1, trend: 'up' } : m
              )
            }));
          }
        }
      });

      socketService.on('message', (msg: Message) => {
        setState(prev => {
          if (prev.messages.find(m => m.id === msg.id)) return prev;
          return { ...prev, messages: [...prev.messages, msg] };
        });
      });

      setState(prev => ({ ...prev, isConnected: true }));
    } else {
      socketService.disconnect();
      setState(prev => ({ ...prev, isConnected: false }));
    }

    return () => {
      socketService.disconnect();
    };
  }, [isOnline, user]);

  const handleSendMessage = useCallback(async (content: string) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender: user?.username || 'User',
      content,
      timestamp: Date.now(),
    };
    
    setState(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
    socketService.emit('message', newMessage);

    try {
      await api.post('/items', { name: `Chat Log: ${content.substring(0, 10)}...`, data: { content } });
    } catch (e) {
      console.warn('Persistence failed, but message sent via socket.');
    }
  }, [user]);

  if (isDataLoading) {
    return <Loader />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex flex-1 flex-col overflow-hidden relative">
        <Header 
          isConnected={state.isConnected && isOnline} 
          currentUser={user} 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
          {installPrompt && <InstallBanner onInstall={triggerInstall} />}
          {activeTab === 'dashboard' ? (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {state.metrics.map((metric, idx) => <MetricCard key={idx} metric={metric} />)}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl bg-slate-900/50 p-6 border border-slate-800 backdrop-blur-sm shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-300">Your Client Activity</h3>
                      <p className="text-xs text-slate-500">Real-time stats for your consulting firm</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Live Sync</span>
                    </div>
                  </div>
                  <div className="h-64 w-full flex items-end justify-between gap-2 px-2">
                     {[...Array(15)].map((_, i) => (
                       <div key={i} className="flex flex-col items-center flex-1">
                          <div 
                            className={`w-full ${isOnline ? 'bg-indigo-500/30 hover:bg-indigo-500/50' : 'bg-slate-700/20'} rounded-t-lg transition-all duration-700 ease-in-out cursor-help`} 
                            style={{ 
                              height: `${Math.max(10, Math.sin((i + Date.now()/10000)) * 30 + 50)}%`,
                            }} 
                          />
                       </div>
                     ))}
                  </div>
                  <div className="mt-4 border-t border-slate-800 pt-4 flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    <span>Oct 01</span>
                    <span>Current Sync Window</span>
                    <span>Oct 15</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-900/50 p-6 border border-slate-800 backdrop-blur-sm shadow-xl">
                  <h3 className="mb-4 text-lg font-semibold text-slate-300">Recent Firm Events</h3>
                  <div className="space-y-4">
                    {state.messages.slice(-3).reverse().map((msg, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 transition-transform hover:scale-[1.02]">
                        <div className="flex-1 truncate pr-2">
                          <p className="text-sm font-bold text-slate-200 truncate">{msg.content}</p>
                          <p className="text-[10px] text-slate-500 font-medium">Synced by {msg.sender}</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                      </div>
                    ))}
                    {state.messages.length === 0 && (
                      <p className="text-xs text-slate-500 italic text-center py-4">Waiting for real-time firm activity...</p>
                    )}
                  </div>
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className="mt-6 w-full py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs font-bold text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
                  >
                    Open Firm Chat
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
