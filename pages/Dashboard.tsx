
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

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const isOnline = useOffline();
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
      try {
        const items = await api.get('/items');
        // If we had a real metrics collection, we'd fetch it here.
        // For now, we'll use the items count to influence a metric.
        setState(prev => ({
          ...prev,
          metrics: prev.metrics.map(m => 
            m.label === 'Active Clients' ? { ...m, value: items.length || prev.metrics[0].value } : m
          )
        }));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      }
    };
    if (isOnline && token) loadData();
  }, [isOnline, token]);

  // Real-time Socket Listeners for MongoDB Change Streams
  useEffect(() => {
    if (isOnline) {
      socketService.connect();
      
      // Listen for global DB changes (Synced across all devices)
      socketService.on('db_item_change', (change: any) => {
        console.log('🔔 Real-time DB Update:', change);
        
        // Example: Update metrics when a new item/client is added via another device
        if (change.type === 'insert') {
          setState(prev => ({
            ...prev,
            metrics: prev.metrics.map(m => 
              m.label === 'Active Clients' ? { ...m, value: m.value + 1, trend: 'up' } : m
            )
          }));
        }
      });

      // Listen for chat messages
      socketService.on('message', (msg: Message) => {
        setState(prev => {
          // Prevent duplicate messages if emitted by same client
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
  }, [isOnline]);

  const handleSendMessage = useCallback(async (content: string) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender: user?.username || 'User',
      content,
      timestamp: Date.now(),
    };
    
    // 1. Update local UI immediately
    setState(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
    
    // 2. Broadcast via Socket for other devices
    socketService.emit('message', newMessage);

    // 3. Persist to DB if needed (Optional: You could have an /api/messages)
    try {
      await api.post('/items', { name: `Chat Log: ${content.substring(0, 10)}...`, data: { content } });
    } catch (e) {
      console.warn('Persistance failed, but message sent via socket.');
    }
  }, [user]);

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
                    <h3 className="text-lg font-semibold text-slate-300">Live Client Activity</h3>
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Cross-Device Sync Active</span>
                    </div>
                  </div>
                  <div className="h-64 w-full flex items-end justify-between gap-3 px-4">
                     {[...Array(12)].map((_, i) => (
                       <div key={i} className="flex flex-col items-center flex-1">
                          <div 
                            className={`w-full ${isOnline ? 'bg-indigo-500/30' : 'bg-slate-700/20'} rounded-t-lg transition-all duration-700 ease-in-out`} 
                            style={{ 
                              height: `${Math.max(10, Math.sin((i + Date.now()/5000)) * 40 + 50)}%`,
                            }} 
                          />
                          <span className="mt-2 text-[10px] text-slate-500 font-medium">Oct {i+1}</span>
                       </div>
                     ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-900/50 p-6 border border-slate-800 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-300">Recent Sync Events</h3>
                  <div className="space-y-4">
                    {state.messages.slice(-3).reverse().map((msg, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                        <div className="flex-1 truncate pr-2">
                          <p className="text-sm font-bold text-slate-200 truncate">{msg.content}</p>
                          <p className="text-[10px] text-slate-500 font-medium">By {msg.sender}</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      </div>
                    ))}
                    {state.messages.length === 0 && (
                      <p className="text-xs text-slate-500 italic text-center py-4">Waiting for real-time events...</p>
                    )}
                  </div>
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className="mt-6 w-full py-2.5 rounded-xl border border-indigo-500/30 text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  >
                    Open Messenger
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
