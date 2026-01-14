
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
    { role: 'model', text: 'Hello Counselor. I am your Vault Assistant. How can I help you manage your practice today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  // Command Listener for AI Priming
  useEffect(() => {
    const handlePrime = (e: any) => {
      const { prompt } = e.detail;
      setIsOpen(true);
      performAIAction(prompt);
    };
    window.addEventListener('vault_ai_prime', handlePrime);
    return () => window.removeEventListener('vault_ai_prime', handlePrime);
  }, [user]);

  const performAIAction = async (promptText: string) => {
    setMessages(prev => [...prev, { role: 'user', text: "Generating context-aware draft..." }]);
    setIsTyping(true);
    try {
      // Fix: Follow guidelines to create instance right before call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        // Fix: Use recommended string-based contents for simple text prompts
        contents: promptText,
        config: {
          systemInstruction: `You are a world-class tax and legal assistant. The user is ${user?.username}. 
          Provide highly technical and professional legal drafting suggestions.`,
          temperature: 0.7,
        },
      });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "Drafting failed." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Error syncing with intelligence vault." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    try {
      // Fix: Follow guidelines to create instance right before call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        // Fix: Use recommended string-based contents for simple text prompts
        contents: userMsg,
        config: {
          systemInstruction: `You are a world-class tax and legal assistant for a practitioner named ${user?.username}. 
          Currently viewing: ${activeView}. Format responses with clean professional bullet points.`,
          temperature: 0.7,
        },
      });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "Vault failed to respond." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Vault Connection Error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[100] h-16 w-16 rounded-full bg-indigo-600 text-white shadow-[0_10px_40px_rgba(79,70,229,0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
      >
        <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-20" />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </button>

      <div className={`fixed inset-y-0 right-0 z-[200] w-full sm:w-[450px] bg-white/80 backdrop-blur-3xl border-l border-slate-200 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="px-8 py-6 bg-indigo-600 text-white flex items-center justify-between shadow-lg">
            <div><h3 className="text-xl font-black uppercase tracking-tight leading-none">Vault Assistant</h3><p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mt-2">Active Multi-Context Sync</p></div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-4 rounded-[1.5rem] text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-lg rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 px-5 py-4 rounded-[1.5rem] rounded-tl-none border border-slate-200 flex gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
          <div className="p-8 border-t border-slate-200 bg-slate-50/50">
            <form onSubmit={handleSend} className="relative">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything about the law..." className="w-full bg-white border border-slate-300 rounded-2xl py-4 pl-6 pr-14 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm" />
              <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg disabled:opacity-30 hover:bg-slate-900 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7-7" /></svg></button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default GeminiAssistant;
