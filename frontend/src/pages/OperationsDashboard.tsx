import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, Shield, Clock, AlertTriangle, 
  HelpCircle, RefreshCw, Zap, CheckCircle2, Sliders 
} from 'lucide-react';
import { api } from '../services/api';

export const OperationsDashboard: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [authorizedTasks, setAuthorizedTasks] = useState<Record<string, boolean>>({});
  const [weatherInput, setWeatherInput] = useState('Clear');
  const [minutesInput, setMinutesInput] = useState(45);

  const fetchDashboardData = async () => {
    try {
      const tel = await api.getTelemetry();
      setTelemetry(tel);
      setWeatherInput(tel.weather);
      setMinutesInput(tel.match_time_minutes);
      
      setLoadingRecs(true);
      const rec = await api.getRecommendations();
      setRecommendations(rec.recommendations || []);
      setLoadingRecs(false);
    } catch (e) {
      console.error(e);
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(async () => {
      const tel = await api.getTelemetry();
      setTelemetry(tel);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSimConfig = async () => {
    await api.updateSettings({
      weather: weatherInput,
      match_time_minutes: minutesInput
    });
    fetchDashboardData();
  };

  const authorizeRecommendation = (title: string) => {
    setAuthorizedTasks(prev => ({ ...prev, [title]: true }));
    // Simulate resolution impact on telemetry
    setTimeout(async () => {
      if (title.includes("Gate")) {
        await api.updateSettings({ attendance: 65000 }); // simulated redirect impact
      }
      fetchDashboardData();
    }, 1500);
  };

  // Format Recharts data structures
  const getGateChartData = () => {
    if (!telemetry) return [];
    return Object.keys(telemetry.gates).map((gate) => ({
      name: gate,
      ScanRate: telemetry.gates[gate].scan_rate,
      Flow: telemetry.gates[gate].current_flow,
      Capacity: telemetry.gates[gate].capacity
    }));
  };

  const getFoodChartData = () => {
    if (!telemetry) return [];
    return Object.keys(telemetry.food_courts).map((fc) => ({
      name: fc.split(' ')[2] || 'Court',
      WaitTime: telemetry.food_courts[fc].wait_time_minutes,
      Queue: telemetry.food_courts[fc].queue_length,
      Waste: telemetry.food_courts[fc].food_waste_kg
    }));
  };

  const getPriorityColor = (p: string) => {
    switch (p.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-200 tracking-tight">AI Crowd Intelligence Dashboard</h2>
          <p className="text-xs text-slate-400">Real-Time Ingress Telemetry & Generative Operations Control</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs px-4 py-2 rounded-xl text-slate-300 font-bold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Telemetry</span>
        </button>
      </div>

      {/* Simulator Variable Control Strip */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-fifa-teal" />
          <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">Telemetry Controls</h4>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Weather:</span>
            <select 
              value={weatherInput} 
              onChange={(e) => setWeatherInput(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1 text-slate-300"
            >
              <option>Clear</option>
              <option>Rain</option>
              <option>Heavy Rain</option>
              <option>Storm</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Time to kickoff (min):</span>
            <input 
              type="number" 
              value={minutesInput} 
              onChange={(e) => setMinutesInput(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1 text-slate-300 w-16 text-center"
            />
          </div>
          <button 
            onClick={handleSimConfig}
            className="bg-gradient-to-r from-fifa-teal to-fifa-pitch text-fifa-dark font-extrabold text-xs px-4 py-1.5 rounded-lg shadow-neon-green"
          >
            Apply Variables
          </button>
        </div>
      </div>

      {/* Telemetry Core Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Graph 1: Gate flow scanner counts */}
        <div className="xl:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-300 mb-4 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-fifa-teal" />
              <span>GATE INGRESS SCAN FLOW</span>
            </h3>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getGateChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Flow" name="Spectators Scanned" fill="#00b4d8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Capacity" name="Hourly Design Capacity" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Graph 2: Concession queues and Organic Food Waste */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-300 mb-4 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-fifa-gold" />
              <span>CONCESSION WAIT TIMES & QUEUES</span>
            </h3>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getFoodChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="WaitTime" name="Wait Time (min)" stroke="#ffd700" strokeWidth={2.5} activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Queue" name="Queue Size" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* AI RECOMMENDATION CENTER */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-left border-l-4 border-fifa-teal pl-3">AI Operations Recommendation Control</h3>
        
        {loadingRecs ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
            <div className="w-8 h-8 border-4 border-fifa-teal border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">AI Engine is processing gate scanning telemetry and concession loads...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec) => {
              const auth = authorizedTasks[rec.title];
              return (
                <div 
                  key={rec.title}
                  className={`glass-panel p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    auth 
                      ? 'border-emerald-500/50 bg-emerald-950/10' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-4">
                    
                    {/* Header tags */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded border ${getPriorityColor(rec.priority)}`}>
                        {rec.priority} Priority
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        Dept: {rec.department}
                      </span>
                    </div>

                    {/* Recommendation body */}
                    <div className="text-left space-y-2">
                      <h4 className="font-extrabold text-base text-slate-200">{rec.title}</h4>
                      <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                        <span className="font-bold text-fifa-teal mr-1">Suggested action:</span>
                        {rec.action}
                      </p>
                      
                      {/* Reason explainer */}
                      <p className="text-xs text-slate-400 leading-relaxed pt-1">
                        <span className="font-bold text-slate-300">Why (AI Reasoning):</span> {rec.reason}
                      </p>
                    </div>

                  </div>

                  {/* Actions footer */}
                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                      <Zap className="w-3.5 h-3.5 text-fifa-gold" />
                      <span>Generative Decision Loop</span>
                    </div>
                    
                    <button
                      onClick={() => authorizeRecommendation(rec.title)}
                      disabled={auth}
                      className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        auth 
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40' 
                          : 'bg-fifa-teal text-fifa-dark hover:scale-[1.03] shadow-neon-blue'
                      }`}
                    >
                      {auth ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Authorized</span>
                        </>
                      ) : (
                        <span>Authorize Action</span>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
export default OperationsDashboard;
