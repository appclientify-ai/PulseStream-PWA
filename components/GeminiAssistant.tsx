
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useAuth } from '../auth/AuthContext';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const GeminiAssistant: React.FC<{ activeView: string }> = ({ activeView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Greetings, Counselor. I am your practice intelligence vault assistant. How can I assist with your compliance work today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `You are Clientify AI, a world-class assistant for tax consultants and legal practitioners. 
          User: ${user?.username || 'Practitioner'}. 
          Current Workspace: ${activeView}. 
          Provide accurate, technical, and professional advice on GST, Income Tax, and Litigation drafting. 
          Use clear formatting and never ask for API keys.`,
          temperature: 0.4,
        },
      });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "Vault failed to respond." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Vault Connection Error. Please verify network or API status." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[100] h-16 w-16 rounded-full bg-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-20" />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </button>

      <div className={`fixed inset-y-0 right-0 z-[200] w-full sm:w-[450px] bg-white border-l border-slate-200 shadow-2xl transition-transform duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
            <div><h3 className="text-xl font-black uppercase tracking-tight">Vault AI</h3><p className="text-[10px] font-black text-indigo-400 uppercase mt-1">Intelligence Layer Active</p></div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-lg rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start"><div className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-black animate-pulse">Syncing...</div></div>}
          </div>
          <div className="p-8 border-t border-slate-200 bg-slate-50/50">
            <form onSubmit={handleSend} className="relative">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Draft a reply to a SCN..." className="w-full bg-white border border-slate-300 rounded-2xl py-4 pl-6 pr-14 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm" />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-slate-900 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" /></svg></button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default GeminiAssistant;
