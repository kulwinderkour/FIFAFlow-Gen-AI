import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, MessageSquare, LayoutDashboard, UserCheck, 
  Compass, AlertOctagon, Accessibility, Settings, 
  Volume2, VolumeX, Sun, CloudRain, Flame, Zap, 
  AlertTriangle, Menu, X, Clock, HelpCircle
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { api } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { 
    highContrast, setHighContrast, 
    voiceSupport, setVoiceSupport, 
    largeText, setLargeText,
    language, setLanguage,
    speakText
  } = useAccessibility();
  
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [emergency, setEmergency] = useState<any>(null);

  // Fetch live ticker data and emergency status
  const fetchData = async () => {
    try {
      const tel = await api.getTelemetry();
      setTelemetry(tel);
      const em = await api.getEmergencyStatus();
      setEmergency(em);

      // Trigger TTS vocal alarm if emergency just activated
      if (em.type !== 'none' && em.announcement) {
        speakText(em.announcement);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000); // refresh every 6 seconds
    return () => clearInterval(interval);
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard Home', path: '/', icon: Home },
    { name: 'Fan Assistant', path: '/fan-assistant', icon: MessageSquare },
    { name: 'Operations Board', path: '/operations-dashboard', icon: LayoutDashboard },
    { name: 'Volunteer Center', path: '/volunteer-assistant', icon: UserCheck },
    { name: 'Transport Planner', path: '/transport', icon: Compass },
    { name: 'Emergency Control', path: '/emergency', icon: AlertOctagon },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
    { code: 'fr', label: 'FR' },
    { code: 'hi', label: 'HI' },
    { code: 'ar', label: 'AR' },
    { code: 'pt', label: 'PT' }
  ];

  const getWeatherIcon = (w: string) => {
    if (w?.toLowerCase().includes('rain') || w?.toLowerCase().includes('storm')) {
      return <CloudRain className="w-5 h-5 text-blue-400" />;
    }
    return <Sun className="w-5 h-5 text-yellow-400 animate-spin-slow" />;
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-fifa-dark text-slate-100 ${highContrast ? 'high-contrast' : ''}`}>
      
      {/* 1. Emergency Crisis Alert Banner */}
      {emergency && emergency.type !== 'none' && (
        <div className="fixed top-0 left-0 w-full z-50 bg-red-600 text-white font-bold px-4 py-2 flex items-center justify-between shadow-neon-red animate-pulse text-center">
          <div className="flex items-center space-x-3 mx-auto">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
            <span className="uppercase tracking-widest text-sm md:text-base">
              CRITICAL EMERGENCY IN PROGRESS: {emergency.announcement || emergency.instructions}
            </span>
          </div>
          <button 
            onClick={() => speakText(emergency.announcement || "Attention, emergency evacuation protocol is active.")} 
            className="bg-red-800 hover:bg-red-900 border border-white px-2 py-0.5 rounded text-xs flex items-center space-x-1"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Speak</span>
          </button>
        </div>
      )}

      {/* Sidebar for Desktop */}
      <aside className={`w-64 glass-panel md:flex flex-col hidden fixed h-full z-30 transition-transform duration-300 ${emergency && emergency.type !== 'none' ? 'pt-12' : ''}`}>
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="bg-gradient-to-tr from-fifa-pitch to-fifa-teal p-2 rounded-lg text-fifa-dark font-extrabold shadow-neon-green">
            ⚽
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wide bg-gradient-to-r from-fifa-teal to-fifa-pitch bg-clip-text text-transparent">StadiumMind</h1>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">FIFA 2026 AI Ops</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active 
                    ? 'bg-gradient-to-r from-fifa-teal/20 to-fifa-pitch/10 text-fifa-pitch border-l-4 border-fifa-pitch font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-fifa-pitch shadow-neon-green' : 'text-slate-400'}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Accessibility Quick Settings Panel */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span>ACCESSIBILITY QUICK PANEL</span>
            <Accessibility className="w-3.5 h-3.5" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setHighContrast(!highContrast)}
              className={`p-2 rounded text-xs text-center border font-semibold transition-all ${
                highContrast ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400' : 'border-slate-800 bg-slate-900/60 text-slate-400'
              }`}
              title="Toggle High Contrast"
            >
              Contrast
            </button>
            <button 
              onClick={() => setVoiceSupport(!voiceSupport)}
              className={`p-2 rounded text-xs text-center border font-semibold transition-all flex items-center justify-center space-x-1 ${
                voiceSupport ? 'border-fifa-teal bg-fifa-teal/20 text-fifa-teal shadow-neon-blue' : 'border-slate-800 bg-slate-900/60 text-slate-400'
              }`}
              title="Toggle Voice Synthesizer"
            >
              {voiceSupport ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Voice</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <header className={`md:hidden flex items-center justify-between px-6 py-4 glass-panel sticky top-0 z-40 w-full ${emergency && emergency.type !== 'none' ? 'mt-10' : ''}`}>
        <div className="flex items-center space-x-2">
          <div className="text-xl">⚽</div>
          <span className="font-extrabold text-lg bg-gradient-to-r from-fifa-teal to-fifa-pitch bg-clip-text text-transparent">StadiumMind</span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-slate-200 focus:outline-none"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-fifa-dark/95 flex flex-col pt-20 px-6">
          <nav className="flex flex-col space-y-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center space-x-4 py-3 border-b border-slate-800 text-lg text-slate-200"
                >
                  <Icon className="w-6 h-6 text-fifa-teal" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 md:ml-64 ${emergency && emergency.type !== 'none' ? 'pt-12' : ''}`}>
        
        {/* Universal Top Header */}
        <header className="glass-panel py-3 px-6 md:flex hidden items-center justify-between border-b border-slate-800 sticky top-0 z-20">
          
          {/* Match State Telemetry Display */}
          <div className="flex items-center space-x-6 text-xs text-slate-400">
            {telemetry && (
              <>
                <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-fifa-pitch" />
                  <span className="font-medium text-slate-300">
                    {telemetry.match_time_minutes > 0 
                      ? `${telemetry.match_time_minutes}m to Kickoff` 
                      : telemetry.match_time_minutes === 0 ? "Match Started" : "Match Live"}
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full">
                  {getWeatherIcon(telemetry.weather)}
                  <span className="font-medium text-slate-300">Weather: {telemetry.weather}</span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-medium text-slate-300">Attendance: {telemetry.sustainability.solar_generation_kwh > 0 ? "68,000" : "62,500"}</span>
                </div>
              </>
            )}
          </div>

          {/* Right Header Panel: Languages, Theme icons, Profile */}
          <div className="flex items-center space-x-4">
            
            {/* Language Switcher */}
            <div className="flex items-center space-x-1 bg-slate-900/60 border border-slate-800 p-0.5 rounded-lg">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as any)}
                  className={`px-2 py-1 text-xs rounded font-bold transition-all ${
                    language === lang.code 
                      ? 'bg-fifa-teal text-fifa-dark shadow-neon-blue' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center space-x-2 border-l border-slate-800 pl-4">
              <div className="bg-gradient-to-tr from-fifa-teal to-fifa-pitch w-8 h-8 rounded-full flex items-center justify-center text-xs text-fifa-dark font-extrabold shadow-neon-green">
                FC
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-semibold text-slate-200">FIFA Official</p>
                <p className="text-[10px] text-slate-400">Sector Command</p>
              </div>
            </div>
          </div>
        </header>

        {/* Primary Page Content Wrapper */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
export default Layout;
