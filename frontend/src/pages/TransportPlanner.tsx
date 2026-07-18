import React, { useState, useEffect } from 'react';
import { 
  Compass, Train, Bus, Car, Clock, Navigation, 
  ArrowRight, RefreshCw, HelpCircle, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';
import { useAccessibility } from '../context/AccessibilityContext';

export const TransportPlanner: React.FC = () => {
  const { language } = useAccessibility();
  const [transit, setTransit] = useState<any>(null);
  const [queryInput, setQueryInput] = useState('My train departs in 45 minutes.');
  const [loading, setLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<string | null>(null);

  const fetchTransitStatus = async () => {
    try {
      const tel = await api.getTelemetry();
      setTransit(tel.transit);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTransitStatus();
  }, []);

  const handleOptimize = async (customQuery?: string) => {
    const q = customQuery || queryInput;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const data = await api.getTransportPlan(q, language);
      setAiPlan(data.plan);
      setTransit(data.transit_status);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getTransitIcon = (key: string) => {
    if (key.includes('Metro')) return <Train className="w-5 h-5 text-blue-400" />;
    if (key.includes('Bus') || key.includes('Shuttle')) return <Bus className="w-5 h-5 text-fifa-teal" />;
    return <Car className="w-5 h-5 text-fifa-gold" />;
  };

  const getCrowdLevelBadge = (level?: string) => {
    if (level === 'Very High') return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold">Very High</span>;
    if (level === 'High') return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-[10px] font-bold">High Load</span>;
    return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">Normal</span>;
  };

  const travelPresets = [
    { label: "Train in 45 mins", text: "My train leaves MetLife Station in 45 minutes." },
    { label: "Bus Shuttle to Hub", text: "I need to take the bus shuttle back to the city transit hub." },
    { label: "Rideshare pickup", text: "Where is the designated rideshare pickup zone and what is the current delay?" },
    { label: "Exit via Parking Lot A", text: "I am parked in Lot A. How do I navigate there with least congestion?" }
  ];

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-200 tracking-tight">AI Transport Planner</h2>
          <p className="text-xs text-slate-400">Custom Multi-Modal Transit Advice & Exit Coordination</p>
        </div>
        <button 
          onClick={fetchTransitStatus}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs px-4 py-2 rounded-xl text-slate-300 font-bold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Timetable</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Live Transit Timetable status board */}
        <div className="lg:col-span-6 space-y-6">
          <h3 className="font-extrabold text-sm text-slate-300 border-l-4 border-fifa-teal pl-3 uppercase tracking-wider">
            Live Stadium Transit Monitor
          </h3>

          {transit ? (
            <div className="space-y-4">
              {Object.keys(transit).map((key) => {
                const item = transit[key];
                const isParking = 'capacity' in item;
                return (
                  <div key={key} className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        {getTransitIcon(key)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-200">{key}</h4>
                        <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-slate-400 font-semibold uppercase">
                          {isParking ? (
                            <span>Lot occupied: {item.occupied} / {item.capacity}</span>
                          ) : (
                            <span>Frequency: every {item.frequency_minutes}m</span>
                          )}
                          <span className="text-slate-600">•</span>
                          <span className={`${item.delay_minutes > 5 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                            Delay: {item.delay_minutes} mins
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isParking ? (
                        <span className={`px-2.5 py-1 border rounded text-[10px] font-bold ${
                          (item.occupied/item.capacity) > 0.85 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {Math.round((item.occupied/item.capacity)*100)}% Full
                        </span>
                      ) : (
                        getCrowdLevelBadge(item.crowd_level)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-8 h-8 border-4 border-fifa-teal border-t-transparent rounded-full animate-spin mx-auto" />
          )}
        </div>

        {/* Right Side: AI Traveler Routing Plan */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Intake Console */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm tracking-wide text-slate-300 flex items-center space-x-2">
              <Compass className="w-4 h-4 text-fifa-teal" />
              <span>COGNITIVE EGRESS CONSOLE</span>
            </h3>

            {/* Travel Presets */}
            <div className="flex flex-wrap gap-2">
              {travelPresets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setQueryInput(p.text);
                    handleOptimize(p.text);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 px-3 py-1.5 rounded-full transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <input 
                type="text" 
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Enter transit details..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-fifa-teal"
              />
              
              <button
                onClick={() => handleOptimize()}
                disabled={loading}
                className="w-full bg-gradient-to-r from-fifa-teal to-fifa-pitch text-fifa-dark font-extrabold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-neon-green flex items-center justify-center space-x-2 text-xs"
              >
                {loading ? (
                  <span>Generating Custom Travel Egress Plan...</span>
                ) : (
                  <>
                    <span>Optimize Travel Route</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Result Card */}
          {aiPlan && (
            <div className="glass-panel p-6 rounded-2xl border border-fifa-teal/30 bg-gradient-to-br from-fifa-teal/5 to-slate-950/20 text-left space-y-4 animate-fadeIn">
              <h4 className="font-extrabold text-sm text-slate-300 flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                <CheckCircle2 className="w-4 h-4 text-fifa-pitch shadow-neon-green" />
                <span>AI TRANSIT BOARD BRIEFING</span>
              </h4>
              <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {aiPlan}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
export default TransportPlanner;
