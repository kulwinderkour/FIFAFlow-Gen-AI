import React, { useState, useEffect } from 'react';
import { 
  Key, Languages, Accessibility, 
  Trash2 
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { api } from '../services/api';
import { LANGUAGE_OPTIONS } from '../constants/languages';

export const SettingsPage: React.FC = () => {
  const { 
    highContrast, setHighContrast,
    largeText, setLargeText,
    voiceSupport, setVoiceSupport,
    language, setLanguage
  } = useAccessibility();

  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);
  const [dbCleared, setDbCleared] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.getSystemStatus();
        setGeminiConfigured(!!data.gemini_api_configured);
      } catch (e) {
        console.error("Failed to fetch system status", e);
        setGeminiConfigured(false);
      }
    };
    fetchStatus();
  }, []);

  const handleResetDatabases = async () => {
    if (window.confirm("Are you sure you want to clear chat history and reset mock alerts?")) {
      await api.clearChatHistory();
      localStorage.removeItem('mock_incidents');
      localStorage.removeItem('mock_emergency_type');
      setDbCleared(true);
      setTimeout(() => setDbCleared(false), 2000);
    }
  };

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-200 tracking-tight">System Settings</h2>
        <p className="text-xs text-slate-400">Manage Global Configurations, AI Credentials, & Database Schemas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left side: Credentials & Integrations */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Gemini API Status Badge */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm tracking-wide text-slate-300 flex items-center space-x-2">
              <Key className="w-4 h-4 text-fifa-gold shadow-neon-gold" />
              <span>GOOGLE GEMINI API INTEGRATION</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              The application uses the Google Gemini API to power the Fan Assistant, Operations Intelligence, Transport Planning, and Emergency SOP recommendations.
            </p>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Connection Status</span>
                {geminiConfigured ? (
                  <span className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-neon-green">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Active (.env Key Loaded)</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-neon-gold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>Local Simulation Fallback</span>
                  </span>
                )}
              </div>

              <div className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-800/80 pt-3">
                {geminiConfigured ? (
                  <span>
                    Your Gemini API key is securely loaded on the backend from the environment variables (`.env`). Requests are processed using the `gemini-1.5-flash` model.
                  </span>
                ) : (
                  <span>
                    To activate Gemini AI capabilities, specify your <code className="text-slate-300 font-mono">GEMINI_API_KEY</code> in the backend's environment configuration file (<code className="text-slate-300 font-mono">.env</code>).
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Database maintenance */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm tracking-wide text-slate-300 flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>MAINTENANCE & MOCK DATA RESET</span>
            </h3>

            <p className="text-xs text-slate-400">
              Clear local volunteer logs, simulator queue states, and reset chat databases to seed defaults.
            </p>

            <div className="pt-2">
              <button
                onClick={handleResetDatabases}
                className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
              >
                {dbCleared ? "Databases Cleared!" : "Clear Logs & History"}
              </button>
            </div>
          </div>

        </div>

        {/* Right side: Accessibility & Locale */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Accessibility Settings */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm tracking-wide text-slate-300 flex items-center space-x-2">
              <Accessibility className="w-4 h-4 text-fifa-teal" />
              <span>WCAG 2.1 ACCESSIBILITY LAWS</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div>
                  <h4 className="font-extrabold text-slate-200">High Contrast Mode</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Inverts dashboard panels to white-on-black or yellow-on-black styles.</p>
                </div>
                <input 
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="w-4 h-4 accent-fifa-teal"
                  aria-label="Toggle High Contrast Mode"
                />
              </div>

              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div>
                  <h4 className="font-extrabold text-slate-200">Large Fonts & Readable Graphics</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Increases layout readability sizes for visually impaired fans.</p>
                </div>
                <input 
                  type="checkbox"
                  checked={largeText}
                  onChange={(e) => setLargeText(e.target.checked)}
                  className="w-4 h-4 accent-fifa-teal"
                  aria-label="Toggle Large Fonts & Readable Graphics"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-200">Text to Speech Audio Reader</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Generates verbal voice-guided routing and evacuation scripts.</p>
                </div>
                <input 
                  type="checkbox"
                  checked={voiceSupport}
                  onChange={(e) => setVoiceSupport(e.target.checked)}
                  className="w-4 h-4 accent-fifa-teal"
                  aria-label="Toggle Text to Speech Audio Reader"
                />
              </div>
            </div>
          </div>

          {/* Languages selection */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm tracking-wide text-slate-300 flex items-center space-x-2">
              <Languages className="w-4 h-4 text-fifa-teal" />
              <span>COGNITIVE LANGUAGE TRANSLATION</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`p-3 rounded-xl border text-xs text-center font-semibold transition-all ${
                    language === lang.code 
                      ? 'border-fifa-teal bg-fifa-teal/20 text-fifa-teal shadow-neon-blue' 
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
export default SettingsPage;
