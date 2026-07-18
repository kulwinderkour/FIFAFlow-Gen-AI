import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldAlert as AlertIcon, Flame, Zap, 
  CloudRain, Heart, EyeOff, Radio, Users, CheckSquare, 
  ArrowRight, ShieldCheck, Play, BellRing, RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { useAccessibility } from '../context/AccessibilityContext';

export const EmergencyCenter: React.FC = () => {
  const { speakText } = useAccessibility();
  const [activeCrisis, setActiveCrisis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tasksChecked, setTasksChecked] = useState<Record<string, boolean>>({});

  const fetchEmergencyStatus = async () => {
    try {
      const data = await api.getEmergencyStatus();
      setActiveCrisis(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEmergencyStatus();
  }, []);

  const triggerSimulation = async (type: string) => {
    setLoading(true);
    try {
      await api.simulateEmergency(type, type === 'fire_alarm' || type === 'power_failure' ? 'critical' : 'warning');
      // Fetch latest state
      await fetchEmergencyStatus();
      setTasksChecked({}); // Reset tasks check state
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'fire_alarm': return <Flame className="w-6 h-6 text-red-500 animate-pulse" />;
      case 'power_failure': return <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />;
      case 'heavy_rain': return <CloudRain className="w-6 h-6 text-blue-400" />;
      case 'medical_emergency': return <Heart className="w-6 h-6 text-rose-500 animate-pulse" />;
      default: return <ShieldCheck className="w-6 h-6 text-emerald-500" />;
    }
  };

  const getSeverityBadgeColor = (sev: string) => {
    if (sev?.toLowerCase() === 'critical') return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (sev?.toLowerCase() === 'warning') return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
  };

  const toggleTask = (task: string) => {
    setTasksChecked(prev => ({ ...prev, [task]: !prev[task] }));
  };

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-200 tracking-tight">AI Emergency Control Center</h2>
        <p className="text-xs text-slate-400">Security Command Console & Generative Evacuation Planner</p>
      </div>

      {/* Emergency Simulation Console */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-extrabold text-sm tracking-wide text-slate-300 flex items-center space-x-2">
          <Play className="w-4 h-4 text-fifa-teal animate-spin-slow" />
          <span>ACTIVATE EMERGENCY SIMULATOR MATRIX</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            onClick={() => triggerSimulation('fire_alarm')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 hover:border-red-500 rounded-2xl transition-all"
          >
            <Flame className="w-8 h-8 text-red-500 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-wider text-red-400">Fire Alarm</span>
          </button>

          <button
            onClick={() => triggerSimulation('power_failure')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 bg-yellow-950/10 hover:bg-yellow-950/20 border border-yellow-900/40 hover:border-yellow-500 rounded-2xl transition-all"
          >
            <Zap className="w-8 h-8 text-yellow-500 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">Power Failure</span>
          </button>

          <button
            onClick={() => triggerSimulation('heavy_rain')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 bg-blue-950/20 hover:bg-blue-950/40 border border-blue-900/40 hover:border-blue-500 rounded-2xl transition-all"
          >
            <CloudRain className="w-8 h-8 text-blue-400 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Heavy Rain</span>
          </button>

          <button
            onClick={() => triggerSimulation('medical_emergency')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 hover:border-rose-500 rounded-2xl transition-all"
          >
            <Heart className="w-8 h-8 text-rose-500 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Medical Alarm</span>
          </button>

          <button
            onClick={() => triggerSimulation('none')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 bg-emerald-950/10 hover:bg-emerald-950/20 border border-emerald-950/40 hover:border-emerald-500 rounded-2xl transition-all col-span-2 md:col-span-1"
          >
            <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Clear / Safe</span>
          </button>
        </div>
      </div>

      {activeCrisis && activeCrisis.type !== 'none' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          
          {/* Left panel: Active Incident status card & PA Announcement */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Status card */}
            <div className="glass-panel p-6 rounded-2xl border-red-500/50 bg-red-950/10 text-left space-y-4 glow-red">
              <div className="flex items-center justify-between border-b border-red-900/40 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    {getEmergencyIcon(activeCrisis.type)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-red-400">ACTIVE CRISIS: {activeCrisis.type.toUpperCase().replace('_', ' ')}</h3>
                    <p className="text-[10px] text-slate-400">Command level: Automated Operations engaged</p>
                  </div>
                </div>

                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded border ${getSeverityBadgeColor(activeCrisis.severity)}`}>
                  {activeCrisis.severity} Severity
                </span>
              </div>

              {/* Strategy directions */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">AI Tactical Egress Strategy</p>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-red-950/50">
                  {activeCrisis.instructions || "Evacuate sections according to protocol."}
                </p>
              </div>
            </div>

            {/* Public Announcement Script Box */}
            {activeCrisis.announcement && (
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-extrabold text-sm text-slate-300 flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-fifa-teal" />
                    <span>PUBLIC PA ANNOUNCEMENT BROADCASTER</span>
                  </h4>
                  
                  <button 
                    onClick={() => speakText(activeCrisis.announcement)}
                    className="bg-fifa-teal hover:bg-fifa-teal/80 text-fifa-dark px-3 py-1 rounded-lg text-xs font-black flex items-center space-x-1.5 transition-all shadow-neon-blue"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Broadcast Audio</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl font-mono text-xs text-yellow-500 leading-relaxed text-left select-all">
                  "{activeCrisis.announcement}"
                </div>
                <p className="text-[10px] text-slate-400">Copy or Broadcast to direct speakers. Adjust high contrast text as needed.</p>
              </div>
            )}

          </div>

          {/* Right panel: Priority checklists & Staff Allocation */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Checklist */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-300 border-b border-slate-800 pb-3 flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-fifa-pitch" />
                <span>EMERGENCY DISPATCH CHECKLIST</span>
              </h4>

              <div className="space-y-3 text-left">
                {activeCrisis.priority_actions && activeCrisis.priority_actions.map((act: string, idx: number) => {
                  const isChecked = tasksChecked[act];
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleTask(act)}
                      className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-emerald-950/10 border-emerald-500/40 text-emerald-400' 
                          : 'bg-slate-900/40 border-slate-850 hover:border-slate-800 text-slate-300'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked || false}
                        onChange={() => {}}
                        className="w-4 h-4 mt-0.5 accent-emerald-500"
                      />
                      <span className="text-xs leading-relaxed">{act}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated Live Staff Location */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-300 border-b border-slate-800 pb-3 flex items-center space-x-2">
                <Users className="w-4 h-4 text-fifa-teal" />
                <span>FIRST RESPONDER GRID DISPATCH</span>
              </h4>
              <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="font-semibold text-slate-200">Sector Medical Units</span>
                  <span className="text-emerald-400 font-bold">2 Deployed</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="font-semibold text-slate-200">Gate A Crowd Containment</span>
                  <span className="text-emerald-400 font-bold">4 Deployed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Electrical Technicians</span>
                  <span className="text-amber-500 font-bold">1 En Route (Lot A Sub)</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-850 space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto animate-pulse" />
          <h3 className="font-extrabold text-lg text-slate-200">System Status: SECURE</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">No critical emergencies active. Crowd operations and ticket scanning proceeding within design thresholds.</p>
        </div>
      )}

    </div>
  );
};
export default EmergencyCenter;
