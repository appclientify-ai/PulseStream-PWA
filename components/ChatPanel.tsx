import React, { useState, useRef, useEffect } from 'react';
import { Message, User } from '../types';

interface ChatPanelProps {
  messages: Message[];
  onSend: (content: string) => void;
  currentUser: User | null;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSend, currentUser }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col rounded-[2.5rem] border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in duration-500">
      <div className="bg-slate-50 border-b border-slate-100 px-8 py-4 shrink-0 flex items-center justify-between">
         <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Vault Messenger</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authorized Internal Sync</p>
         </div>
         <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200" />
            ))}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-white">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-300 opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-xs font-black uppercase tracking-[0.2em]">Archived Conversations Encrypted</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.sender === currentUser?.username ? 'items-end' : 'items-start'}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{msg.sender}</span>
                  <span className="text-[8px] font-bold text-slate-300 uppercase">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`max-w-[85%] rounded-[1.5rem] px-6 py-3.5 text-sm font-medium leading-relaxed ${
                  msg.sender === currentUser?.username 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-tr-none' 
                    : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-50/50 border-t border-slate-100">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Authorized secure message..."
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 pl-6 pr-14 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-3 rounded-xl bg-indigo-600 p-2.5 text-white transition-all hover:bg-slate-900 active:scale-95 disabled:opacity-30 shadow-md"
            disabled={!input.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;