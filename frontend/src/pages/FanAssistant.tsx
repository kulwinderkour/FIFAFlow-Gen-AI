import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, MicOff, Volume2, HelpCircle, 
  MapPin, Accessibility, Compass, Trash2 
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { api } from '../services/api';
import { StadiumMap } from '../components/StadiumMap';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const FanAssistant: React.FC = () => {
  const { stairless, setStairless, language, speakText, stopSpeaking } = useAccessibility();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [gate, setGate] = useState('Gate B');
  const [seat, setSeat] = useState('Section A24');
  const [isRecording, setIsRecording] = useState(false);
  const [highlight, setHighlight] = useState<'all' | 'restrooms' | 'food' | 'accessibility'>('all');
  const [telemetry, setTelemetry] = useState<any>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load chat history on mount
  const loadHistory = async () => {
    try {
      const history = await api.getChatHistory();
      if (history.length > 0) {
        setMessages(history);
      } else {
        // Seed introductory message based on language
        const intros: Record<string, string> = {
          en: "Hello! I am StadiumMind AI, your official FIFA 2026 Assistant. Select your Gate & Seat to map your route, or ask me for concessions, restrooms, and elevators.",
          es: "¡Hola! Soy StadiumMind AI, su asistente oficial de la FIFA 2026. Seleccione su puerta y asiento para trazar su ruta, o pregúnteme sobre puestos de comida, baños y ascensores.",
          fr: "Bonjour! Je suis StadiumMind AI, votre assistant officiel de la FIFA 2026. Sélectionnez votre porte et votre siège pour tracer votre itinéraire, ou demandez-moi les toilettes, buvettes et ascenseurs.",
          hi: "नमस्ते! मैं स्टेडियममाइंड एआई हूँ, आपका आधिकारिक फीफा 2026 सहायक। अपना गेट और सीट चुनें, या मुझसे शौचालय, भोजन स्टालों और लिफ्टों के बारे में पूछें।",
          ar: "مرحباً! أنا StadiumMind AI، مساعدك الرسمي لكأس العالم FIFA 2026. اختر البوابة والمقعد لتحديد مسارك، أو اسألني عن دورات المياه، المطاعم، والمصاعد.",
          pt: "Olá! Sou o StadiumMind AI, o seu Assistente oficial da FIFA 2026. Selecione o seu portão e assento para trazar a sua rota, ou pergunte-me sobre alimentação, banheiros e elevadores."
        };
        setMessages([{
          id: 0,
          role: 'assistant',
          content: intros[language] || intros['en'],
          timestamp: new Date().toISOString()
        }]);
      }
      
      const tel = await api.getTelemetry();
      setTelemetry(tel);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [language]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      // Map app language to recognition locale
      const locales: Record<string, string> = {
        en: 'en-US', es: 'es-ES', fr: 'fr-FR',
        hi: 'hi-IN', ar: 'ar-SA', pt: 'pt-BR'
      };
      rec.lang = locales[language] || 'en-US';

      rec.onstart = () => setIsRecording(true);
      rec.onend = () => setIsRecording(false);
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      
      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition API is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // Add user message to state
    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Fetch AI response
    try {
      const res = await api.sendFanQuery(text, gate, seat, language, {
        stairless,
        large_text: false,
        high_contrast: false,
        voice_support: true
      });
      
      const botMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.answer,
        timestamp: res.timestamp
      };
      
      setMessages(prev => [...prev, botMsg]);
      speakText(res.answer); // TTS Speak Response

      // Auto update highlight category based on text keyword
      const lower = text.toLowerCase();
      if (lower.includes('restroom') || lower.includes('washroom') || lower.includes('toilet') || lower.includes('baño') || lower.includes('toilette')) {
        setHighlight('restrooms');
      } else if (lower.includes('food') || lower.includes('eat') || lower.includes('hungry') || lower.includes('hotdog') || lower.includes('burger')) {
        setHighlight('food');
      } else if (lower.includes('elevator') || lower.includes('lift') || lower.includes('stair') || lower.includes('ascensor')) {
        setHighlight('accessibility');
      } else {
        setHighlight('all');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearChat = async () => {
    stopSpeaking();
    await api.clearChatHistory();
    // Reset messages to initial intro
    loadHistory();
  };

  const quickPrompts = [
    { label: "Restrooms", text: "Where is the nearest restroom?", category: 'restrooms' as const },
    { label: "Food concessions", text: "Where can I get a burger or hotdog?", category: 'food' as const },
    { label: "Elevators", text: "Is there an accessible elevator near my seat?", category: 'accessibility' as const },
    { label: "Transit advice", text: "How do I get back to the metro from here?", category: 'all' as const }
  ];

  return (
    <div className="space-y-6 text-left">
      
      {/* Page Title */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-200 tracking-tight">AI Fan Assistant</h2>
        <p className="text-xs text-slate-400">Natural Language Stadium Routing & Concessions Directory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand side: Seat Configurator & Map */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          
          {/* Seat Finder Box */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm tracking-wide text-slate-300 flex items-center space-x-2">
              <Compass className="w-4 h-4 text-fifa-teal" />
              <span>ROUTE FINDER CONSOLE</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Current Gate</label>
                <select 
                  value={gate}
                  onChange={(e) => {
                    setGate(e.target.value);
                    handleSend(`I am at ${e.target.value}. Map my seat route.`);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-fifa-teal text-slate-200"
                >
                  <option>Gate A</option>
                  <option>Gate B</option>
                  <option>Gate C</option>
                  <option>Gate D</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Seat Section</label>
                <select 
                  value={seat}
                  onChange={(e) => {
                    setSeat(e.target.value);
                    handleSend(`My seat is in ${e.target.value}. Map my route from ${gate}.`);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-fifa-teal text-slate-200"
                >
                  <option>Section A24</option>
                  <option>Section 100</option>
                  <option>Section 200</option>
                </select>
              </div>

              {/* Accessibility Shortcut */}
              <div className="flex items-center justify-between border border-slate-800 bg-slate-900/60 rounded-xl px-4 py-2 mt-auto h-[38px]">
                <div className="flex items-center space-x-2">
                  <Accessibility className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-300">Stairless Access</span>
                </div>
                <input 
                  type="checkbox"
                  checked={stairless}
                  onChange={(e) => {
                    setStairless(e.target.checked);
                    handleSend(e.target.checked ? "Map a stairless wheelchair-friendly route." : "Show standard route details.");
                  }}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Interactive Map Display */}
          <div className="flex-1 min-h-[350px]">
            <StadiumMap 
              routeStart={gate} 
              routeEnd={seat} 
              highlightCategory={stairless ? 'accessibility' : highlight}
              heatmapData={telemetry?.gates}
              emergencyActive={telemetry?.active_crisis}
            />
          </div>
        </div>

        {/* Right Hand side: AI Chat Interface */}
        <div className="lg:col-span-5 flex flex-col h-[550px] md:h-[620px] glass-panel border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
          
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-tr from-fifa-teal to-fifa-pitch p-2 rounded-xl text-fifa-dark font-extrabold shadow-neon-green">
                🤖
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-200">StadiumMind Fan AI</h3>
                <span className="text-[9px] uppercase tracking-wider text-emerald-500 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block mr-1" />
                  Online
                </span>
              </div>
            </div>
            
            <button 
              onClick={clearChat}
              className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-slate-900/60 transition-colors"
              title="Clear Conversation History"
              aria-label="Clear conversation history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex flex-wrap gap-2 p-4 bg-slate-950/20 border-b border-slate-800/60">
            {quickPrompts.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setHighlight(p.category);
                  handleSend(p.text);
                }}
                className="bg-slate-900/80 hover:bg-fifa-blue border border-slate-800 hover:border-fifa-teal text-slate-300 hover:text-fifa-teal text-[10px] px-3 py-1.5 rounded-full transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chat Thread */}
          <div 
            className="flex-1 p-6 overflow-y-auto space-y-4"
            aria-live="polite"
            aria-label="Chat messages"
            role="log"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-fifa-teal to-fifa-pitch text-fifa-dark font-semibold rounded-tr-none' 
                      : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none relative group'
                  }`}
                >
                  {/* Markdown Renderer simulation */}
                  <div className="whitespace-pre-line text-left">
                    {msg.content}
                  </div>
                  
                  {msg.role === 'assistant' && (
                    <button 
                      onClick={() => speakText(msg.content)}
                      className="absolute -right-7 top-1 text-slate-400 hover:text-fifa-teal opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-950/80 rounded"
                      title="Speak Answer"
                      aria-label="Read this message aloud"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Form */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 focus-within:border-fifa-teal"
            >
              <input
                type="text"
                placeholder={isRecording ? "Listening..." : "Ask me directions, elevator locations..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isRecording}
                className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none disabled:text-slate-400"
              />
              
              {/* Mic Icon */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 rounded-lg transition-colors ${
                  isRecording 
                    ? 'bg-red-500/20 text-red-500 animate-pulse' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={isRecording ? "Stop Recording" : "Speech to Text Input"}
                aria-label={isRecording ? "Stop voice recording" : "Start voice input"}
                aria-pressed={isRecording}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                className="bg-gradient-to-r from-fifa-teal to-fifa-pitch text-fifa-dark p-2 rounded-lg hover:scale-105 transition-all shadow-neon-green"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
export default FanAssistant;
