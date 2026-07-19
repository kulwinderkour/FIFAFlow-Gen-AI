import React, { useState, useEffect } from 'react';
import { 
  Plus, Users, Phone, MapPin, Heart, AlertTriangle, 
  CheckCircle, ArrowRight, ShieldCheck, ChevronDown, ChevronUp 
} from 'lucide-react';
import { api } from '../services/api';
import { useAccessibility } from '../context/AccessibilityContext';

export const VolunteerAssistant: React.FC = () => {
  const { } = useAccessibility();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [formType, setFormType] = useState('lost_child');
  const [locationInput, setLocationInput] = useState('Gate A Concourse');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [reporterName, setReporterName] = useState('Volunteer Steward #12');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descriptionInput.trim()) return;

    setLoading(true);
    try {
      const newInc = await api.reportIncident({
        type: formType,
        location: locationInput,
        description: descriptionInput,
        reported_by: reporterName
      });
      
      setDescriptionInput('');
      setExpandedId(newInc.id); // Expand the newest incident
      fetchIncidents();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await api.resolveIncident(id);
      fetchIncidents();
    } catch (e) {
      console.error(e);
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'lost_child': return <Users className="w-5 h-5 text-blue-400" />;
      case 'medical': return <Heart className="w-5 h-5 text-red-400 animate-pulse" />;
      case 'security': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'resolved') {
      return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded text-[10px] font-bold">Resolved</span>;
    }
    return <span className="bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">Active Briefing</span>;
  };

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-200 tracking-tight">AI Volunteer Assistant</h2>
        <p className="text-xs text-slate-400">Log Field Incidents & Retrieve Generative FIFA SOP Guidelines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Submit Incident Intake Form */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 sticky top-24">
            <h3 className="font-extrabold text-sm tracking-wide text-slate-300 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-fifa-teal" />
              <span>REPORT INCIDENT INTAKE</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="incident-type" className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Incident Category</label>
                <select 
                  id="incident-type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-fifa-teal"
                >
                  <option value="lost_child">Lost & Found / Missing Child</option>
                  <option value="medical">Spectator Medical Emergency</option>
                  <option value="security">Crowd Brawl / Security Issue</option>
                  <option value="structural">Facilities / Slip & Fall Hazard</option>
                </select>
              </div>

              <div>
                <label htmlFor="incident-location" className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Reporting Location</label>
                <input 
                  id="incident-location"
                  type="text" 
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. Gate A Corridor, Section 102 Row F"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-fifa-teal"
                />
              </div>

              <div>
                <label htmlFor="incident-desc" className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Describe what is happening</label>
                <textarea 
                  id="incident-desc"
                  rows={4}
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Describe details (age, clothing description, language, or symptom)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-fifa-teal"
                />
              </div>

              <div>
                <label htmlFor="incident-reporter" className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Log Identity</label>
                <input 
                  id="incident-reporter"
                  type="text" 
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-fifa-teal"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-fifa-teal to-fifa-pitch text-fifa-dark font-extrabold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-neon-green flex items-center justify-center space-x-2 text-xs"
              >
                {loading ? (
                  <span>Processing AI Dispatch...</span>
                ) : (
                  <>
                    <span>Generate SOP & Radio Dispatch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Active / Resolved Log Feed */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-300 border-l-4 border-fifa-teal pl-3 uppercase tracking-wider">
            Incident Briefings & Actions Queue
          </h3>

          {incidents.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-extrabold text-sm text-slate-200">No Active Incidents</h4>
              <p className="text-xs text-slate-400">All stadium sectors reporting green. Standard patrols active.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((inc) => {
                const active = inc.status === 'active';
                const isExpanded = expandedId === inc.id;
                return (
                  <div 
                    key={inc.id}
                    className={`glass-panel rounded-2xl border transition-all duration-300 ${
                      active 
                        ? 'border-slate-850 hover:border-slate-700' 
                        : 'border-slate-850 opacity-60'
                    }`}
                  >
                    
                    {/* Collapsed view header */}
                    <div 
                      onClick={() => setExpandedId(isExpanded ? null : inc.id)}
                      className="px-6 py-4 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                          {getIncidentIcon(inc.type)}
                        </div>
                        <div className="text-left">
                          <h4 className="font-extrabold text-sm text-slate-200">{inc.location}</h4>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                            Category: {inc.type.replace('_', ' ')} | By: {inc.reported_by}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {getStatusBadge(inc.status)}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded details view */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-slate-850 space-y-4 text-left animate-fadeIn">
                        
                        {/* Incident Description */}
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Field Situation Log</p>
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                            {inc.description}
                          </p>
                        </div>

                        {/* SOP checklist steps from AI */}
                        {inc.sop_steps && inc.sop_steps.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase font-bold text-slate-400">FIFA Standard Operating Procedure (SOP)</p>
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                              {inc.sop_steps.map((step: string, idx: number) => (
                                <div key={idx} className="flex items-start space-x-2 text-xs">
                                  <span className="text-fifa-teal font-extrabold">{idx + 1}.</span>
                                  <span className="text-slate-300">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Contact details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2 text-xs">
                            <Phone className="w-4 h-4 text-fifa-teal" />
                            <span className="font-bold text-slate-400">Emergency Contact:</span>
                            <span className="text-slate-200">{inc.emergency_contact || "Sector Coordinator"}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs">
                            <MapPin className="w-4 h-4 text-fifa-gold" />
                            <span className="font-bold text-slate-400">Nearby Desk:</span>
                            <span className="text-slate-200">Gate A Main Desk</span>
                          </div>
                        </div>

                        {/* Resolve button action */}
                        {active && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolve(inc.id);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-neon-green"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Mark Sector Safe & Close Case</span>
                            </button>
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default VolunteerAssistant;
