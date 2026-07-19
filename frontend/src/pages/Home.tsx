import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ShieldAlert, Award, Heart, 
  Leaf, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { api } from '../services/api';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState<any>(null);
  const [emergency, setEmergency] = useState<any>(null);

  const fetchState = async () => {
    try {
      const tel = await api.getTelemetry();
      setTelemetry(tel);
      const em = await api.getEmergencyStatus();
      setEmergency(em);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  const roles = [
    {
      title: "Match Fan",
      desc: "Find restrooms, hotdogs, elevators, and shortest path from Gate to Seat.",
      icon: Users,
      color: "from-blue-500/20 to-fifa-teal/10",
      border: "border-fifa-teal/30 hover:border-fifa-teal",
      route: "/fan-assistant"
    },
    {
      title: "Operations Organizer",
      desc: "Review live gate flows, queue capacities, and execute AI load balancing.",
      icon: Award,
      color: "from-emerald-500/20 to-fifa-pitch/10",
      border: "border-fifa-pitch/30 hover:border-fifa-pitch",
      route: "/operations-dashboard"
    },
    {
      title: "Event Volunteer",
      desc: "Log child, security, or medical issues and receive instant SOP instructions.",
      icon: Heart,
      color: "from-amber-500/20 to-yellow-500/10",
      border: "border-yellow-500/30 hover:border-yellow-500",
      route: "/volunteer-assistant"
    },
    {
      title: "Emergency Staff",
      desc: "Simulate fires or blackouts, assign responders, and broadcast PA scripts.",
      icon: ShieldAlert,
      color: "from-red-500/20 to-rose-500/10",
      border: "border-red-500/30 hover:border-red-500",
      route: "/emergency"
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 md:p-12 flex flex-col md:flex-row items-center justify-between border border-slate-800 shadow-neon-blue">
        <div className="space-y-4 md:max-w-2xl text-left">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-fifa-teal to-fifa-pitch px-3 py-1 rounded-full text-fifa-dark text-xs font-black uppercase tracking-wider">
            <span>FIFA World Cup 2026</span>
            <span className="w-1.5 h-1.5 rounded-full bg-fifa-dark animate-ping" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            StadiumMind Operations & Fan Intelligence
          </h2>
          <p className="text-sm md:text-base text-slate-400">
            A cognitive control system leveraging Generative AI to optimize crowd bottlenecks, emergency evacuations, sustainability targets, and accessibility navigation.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={() => navigate('/fan-assistant')} 
              className="bg-gradient-to-r from-fifa-teal to-fifa-pitch text-fifa-dark font-extrabold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.03] shadow-neon-green flex items-center space-x-2"
            >
              <span>Explore Fan Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/operations-dashboard')} 
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold px-6 py-3 rounded-xl transition-all duration-200"
            >
              Organizer Dashboard
            </button>
          </div>
        </div>

        {/* Visual World Cup Trophy Widget */}
        <div className="hidden lg:flex flex-col items-center justify-center p-6 border border-slate-800 rounded-2xl bg-slate-950/60 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-fifa-teal/10 to-fifa-gold/10 opacity-30 blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <span className="text-6xl animate-bounce">🏆</span>
          <p className="font-extrabold text-sm text-fifa-gold mt-2 tracking-widest uppercase">FIFA MetLife Arena</p>
          <p className="text-[10px] text-slate-400">New York / New Jersey Venue</p>
        </div>
      </div>

      {/* Emergency Active Alert Block */}
      {emergency && emergency.type !== 'none' && (
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/50 flex flex-col md:flex-row items-center justify-between shadow-neon-red">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="bg-red-500/20 p-3 rounded-xl text-red-500">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-left">
              <h4 className="font-extrabold text-red-400">CRITICAL SITUATION DECLARED</h4>
              <p className="text-xs text-red-200">Simulation: {emergency.type.toUpperCase().replace('_', ' ')} - Severity: {emergency.severity.toUpperCase()}</p>
              <p className="text-xs text-slate-400 mt-1">Evacuation checklist is active. Staff have been reassigned.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/emergency')}
            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
          >
            Emergency Center
          </button>
        </div>
      )}

      {/* Target User Roles Selector */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-left border-l-4 border-fifa-teal pl-3">Select User Portal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div 
                key={role.title}
                onClick={() => navigate(role.route)}
                className={`glass-panel p-6 rounded-2xl border ${role.border} bg-gradient-to-br ${role.color} cursor-pointer transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between text-left`}
              >
                <div className="space-y-4">
                  <div className="p-3 bg-slate-900/80 rounded-xl w-fit border border-slate-800">
                    <Icon className="w-6 h-6 text-fifa-teal" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg text-slate-200">{role.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{role.desc}</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center space-x-2 text-xs font-bold text-fifa-teal hover:text-fifa-pitch">
                  <span>Enter Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Realtime Quick Stats Console */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Gate Traffic Summary */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-left">
          <h4 className="text-xs text-slate-400 uppercase font-bold tracking-wider">Gate flow average</h4>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-3xl font-extrabold text-slate-200">
                {telemetry ? `${Object.values(telemetry.gates).reduce((acc: any, curr: any) => acc + curr.current_flow, 0)}` : '9,900'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Cumulative ticket scans per hour</p>
            </div>
            <div className="bg-fifa-teal/10 px-2 py-1 rounded text-fifa-teal text-xs font-bold">
              +14% vs avg
            </div>
          </div>
        </div>

        {/* Concession queue load */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-left">
          <h4 className="text-xs text-slate-400 uppercase font-bold tracking-wider">Max Concession Wait</h4>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-3xl font-extrabold text-slate-200">
                {telemetry ? `${Math.max(...Object.values(telemetry.food_courts).map((fc: any) => fc.wait_time_minutes))}m` : '28m'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Concession Food Court 3 queue</p>
            </div>
            <div className="bg-amber-500/10 px-2 py-1 rounded text-amber-400 text-xs font-bold">
              Queue Warning
            </div>
          </div>
        </div>

        {/* Sustainability index */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-left">
          <h4 className="text-xs text-slate-400 uppercase font-bold tracking-wider">Clean Solar Generation</h4>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-3xl font-extrabold text-slate-200">
                {telemetry ? `${telemetry.sustainability.solar_generation_kwh} kWh` : '1,200 kWh'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Solar grid power offset</p>
            </div>
            <div className="bg-emerald-500/10 px-2 py-1 rounded text-emerald-400 text-xs font-bold flex items-center space-x-1">
              <Leaf className="w-3 h-3" />
              <span>Renewable</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default Home;
