// StadiumMind Backend API Service

const BASE_URL = ''; // Proxied via Vite Server

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `API Error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Fan Assistant
  async sendFanQuery(query: string, gate?: string, seat?: string, lang: string = 'en', accessibility?: any) {
    try {
      const res = await fetch(`${BASE_URL}/api/assistant/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, gate, seat, lang, accessibility })
      });
      return await handleResponse(res);
    } catch (e) {
      console.warn("Backend unavailable, falling back to client-side chatbot mock.", e);
      return {
        answer: getClientMockAnswer(query, lang, accessibility?.stairless),
        timestamp: new Date().toISOString()
      };
    }
  },

  async getChatHistory() {
    try {
      const res = await fetch(`${BASE_URL}/api/assistant/history`);
      return await handleResponse(res);
    } catch (e) {
      return JSON.parse(localStorage.getItem('stadium_chat_history') || '[]');
    }
  },

  async clearChatHistory() {
    try {
      const res = await fetch(`${BASE_URL}/api/assistant/history`, { method: 'DELETE' });
      return await handleResponse(res);
    } catch (e) {
      localStorage.removeItem('stadium_chat_history');
      return { status: 'success' };
    }
  },

  // Operations Dashboard
  async getTelemetry() {
    try {
      const res = await fetch(`${BASE_URL}/api/operations/telemetry`);
      return await handleResponse(res);
    } catch (e) {
      return getMockTelemetry();
    }
  },

  async getRecommendations() {
    try {
      const res = await fetch(`${BASE_URL}/api/operations/recommendations`);
      return await handleResponse(res);
    } catch (e) {
      return {
        recommendations: getMockRecommendations()
      };
    }
  },

  async updateSettings(settings: { weather?: string; match_time_minutes?: number; attendance?: number }) {
    try {
      const res = await fetch(`${BASE_URL}/api/operations/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      return await handleResponse(res);
    } catch (e) {
      return { status: 'success' };
    }
  },

  // Transport Planner
  async getTransportPlan(query: string, lang: string = 'en') {
    try {
      const res = await fetch(`${BASE_URL}/api/transport/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lang })
      });
      return await handleResponse(res);
    } catch (e) {
      return {
        query,
        plan: `### Travel Recommendation (Offline Mode)\n- **Exit Gate:** Gate B\n- **Route:** Walk to Metro Line 1 (120 meters).\n- **Status:** Metro running every 4 minutes. Allow 20 minutes egress delay.\n- **Arrival:** Estimated arrival at downtown station: 35 minutes. Your journey is safe!`,
        transit_status: getMockTelemetry().transit
      };
    }
  },

  // Emergency Center
  async getEmergencyStatus() {
    try {
      const res = await fetch(`${BASE_URL}/api/emergency/status`);
      return await handleResponse(res);
    } catch (e) {
      return {
        type: localStorage.getItem('mock_emergency_type') || 'none',
        severity: localStorage.getItem('mock_emergency_severity') || 'low',
        instructions: localStorage.getItem('mock_emergency_instructions') || '',
        announcement: localStorage.getItem('mock_emergency_announcement') || '',
        priority_actions: JSON.parse(localStorage.getItem('mock_emergency_actions') || '[]')
      };
    }
  },

  async simulateEmergency(type: string, severity: string = 'medium') {
    try {
      const res = await fetch(`${BASE_URL}/api/emergency/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, severity })
      });
      return await handleResponse(res);
    } catch (e) {
      localStorage.setItem('mock_emergency_type', type);
      if (type === 'none') {
        localStorage.setItem('mock_emergency_severity', 'low');
        localStorage.setItem('mock_emergency_instructions', '');
        localStorage.setItem('mock_emergency_announcement', '');
        localStorage.setItem('mock_emergency_actions', '[]');
      } else {
        localStorage.setItem('mock_emergency_severity', severity);
        const announcements: Record<string, string> = {
          fire_alarm: "ATTENTION FANS. AN EMERGENCY EVACUATION IS IN PROGRESS. PLEASE PROCEED TO GATES A OR C. DO NOT USE ELEVATORS.",
          power_failure: "ATTENTION FANS. WE ARE EXPERIENCING A POWER OUTAGE. AUXILIARY SYSTEM ACTIVE. PLEASE REMAIN CALM.",
          heavy_rain: "ATTENTION FANS. HEAVY WEATHER SYSTEM DETECTED. PLEASE TAKE SHELTER IN COVERED AREAS.",
          medical_emergency: "ATTENTION FANS. FIRST AID PERSONNEL IN ROUTE TO SECTION C."
        };
        const actions: Record<string, string[]> = {
          fire_alarm: ["Evacuate North Concourse", "Override gates to exit-only", "Dispatch responders"],
          power_failure: ["Engage backup power", "Halt ticket gates", "Direct stadium lighting"],
          heavy_rain: ["Distribute rain ponchos", "Clear drainage grates", "Increase shuttle frequency"],
          medical_emergency: ["Clear stretcher corridor", "Alert nearest hospital", "Direct ambulance"]
        };
        localStorage.setItem('mock_emergency_announcement', announcements[type] || '');
        localStorage.setItem('mock_emergency_actions', JSON.stringify(actions[type] || []));
        localStorage.setItem('mock_emergency_instructions', `Standard operating response for ${type} is active.`);
      }
      return { status: 'success' };
    }
  },

  async getIncidents() {
    try {
      const res = await fetch(`${BASE_URL}/api/emergency/incidents`);
      return await handleResponse(res);
    } catch (e) {
      return JSON.parse(localStorage.getItem('mock_incidents') || '[]');
    }
  },

  async reportIncident(incident: { type: string; location: string; description: string; reported_by: string }) {
    try {
      const res = await fetch(`${BASE_URL}/api/emergency/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident)
      });
      return await handleResponse(res);
    } catch (e) {
      const mockIncidents = JSON.parse(localStorage.getItem('mock_incidents') || '[]');
      const newInc = {
        id: Math.floor(Math.random() * 10000),
        ...incident,
        status: 'active',
        timestamp: new Date().toISOString(),
        sop_steps: [
          "Report location coordinates to central dispatch.",
          "Secure area safety parameters.",
          "Administer standard guidelines according to training.",
          "Coordinate arrival of field supervisor."
        ],
        emergency_contact: "Volunteer Supervisor (Ch. 9)"
      };
      mockIncidents.unshift(newInc);
      localStorage.setItem('mock_incidents', JSON.stringify(mockIncidents));
      return newInc;
    }
  },

  async resolveIncident(incidentId: number) {
    try {
      const res = await fetch(`${BASE_URL}/api/emergency/incidents/${incidentId}/resolve`, {
        method: 'POST'
      });
      return await handleResponse(res);
    } catch (e) {
      const mockIncidents = JSON.parse(localStorage.getItem('mock_incidents') || '[]');
      const updated = mockIncidents.map((inc: any) => inc.id === incidentId ? { ...inc, status: 'resolved' } : inc);
      localStorage.setItem('mock_incidents', JSON.stringify(updated));
      return { status: 'success' };
    }
  },

  async getSystemStatus() {
    try {
      const res = await fetch(`${BASE_URL}/api/system/status`);
      return await handleResponse(res);
    } catch (e) {
      return { gemini_api_configured: false };
    }
  }
};

// client side mocks
function getClientMockAnswer(query: string, lang: string, stairless?: boolean) {
  const q = query.toLowerCase();
  const step = stairless ? "Use Elevator Corridor B Lift 2 (ramp access on Level 1)." : "Walk 70 meters straight and take Gate B stairs.";
  
  if (q.includes("restroom") || q.includes("bath") || q.includes("toilet") || q.includes("baño") || q.includes("wc")) {
    return `**StadiumMind Fan Assistant** (Offline Mode)\n\nWalk 50m towards the Gate B concourse. The closest restroom is immediately beside Food Court 2.\n- **Estimated walking time:** 2 minutes.\n- **Accessibility:** Fully wheelchair-accessible toilet. ${stairless ? 'Elevator path cleared.' : ''}`;
  }
  if (q.includes("food") || q.includes("eat") || q.includes("burger") || q.includes("hotdog")) {
    return `**StadiumMind Fan Assistant** (Offline Mode)\n\nFood Court 2 (East Concourse) is located 80m away. \n- **Wait time:** 5 minutes (Short Queue).\n- **Special items:** Veggie Nachos & Classic Footlongs.\n- **Accessibility:** Ramps fully open. ${step}`;
  }
  return `**StadiumMind Fan Assistant** (Offline Mode)\n\nRoute planned from Gate B to Section A24:\n1. Pass through security Gate B.\n2. Proceed straight towards the North corridor.\n3. ${step}\n- **Estimated time:** 4 minutes. Enjoy the World Cup match!`;
}

function getMockTelemetry() {
  return {
    timestamp: new Date().toISOString(),
    weather: "Clear",
    match_time_minutes: 45,
    active_crisis: "none",
    gates: {
      "Gate A": { capacity: 8000, current_flow: 3500, scan_rate: 45, security_lanes_open: 8, status: "normal" },
      "Gate B": { capacity: 5000, current_flow: 1800, scan_rate: 28, security_lanes_open: 5, status: "normal" },
      "Gate C": { capacity: 9000, current_flow: 4100, scan_rate: 52, security_lanes_open: 10, status: "normal" },
      "Gate D": { capacity: 4000, current_flow: 800, scan_rate: 12, security_lanes_open: 3, status: "normal" }
    },
    food_courts: {
      "Food Court 1 (North Concourse)": { wait_time_minutes: 15, queue_length: 25, popular_item: "FIFA Classic Hotdog", stock_level: 82, food_waste_kg: 12.4 },
      "Food Court 2 (East Concourse)": { wait_time_minutes: 5, queue_length: 8, popular_item: "Veggie Nachos", stock_level: 94, food_waste_kg: 4.1 },
      "Food Court 3 (South Concourse)": { wait_time_minutes: 28, queue_length: 42, popular_item: "Angus Beef Burger", stock_level: 45, food_waste_kg: 34.8 }
    },
    transit: {
      "Metro Line 1 (Stadium Station)": { frequency_minutes: 4, delay_minutes: 2, crowd_level: "High", status: "operating" },
      "Bus Shuttle (Gate C Terminal)": { frequency_minutes: 8, delay_minutes: 5, crowd_level: "Medium", status: "operating" },
      "Main Parking Lot A": { capacity: 3000, occupied: 2780, delay_minutes: 10 },
      "VIP Parking Lot B": { capacity: 500, occupied: 320, delay_minutes: 2 }
    },
    volunteers: {
      total_deployed: 120,
      allocated: { "Gate A Operations": 25, "Gate B Operations": 15, "Gate C Operations": 30, "Gate D Operations": 10, "Concourse Navigators": 20, "Medical Support": 10, "Accessibility Support": 10 },
      on_standby: 15
    },
    sustainability: {
      energy_usage_kwh: 4500,
      solar_generation_kwh: 1200,
      water_consumption_liters: 25000,
      waste_recycled_kg: 850,
      waste_landfill_kg: 420,
      insights: [
        "Food Court 3 has excessive food waste (34.8 kg organic waste recorded this hour). Recommending moving 20% of raw ingredients to Food Court 1.",
        "High plastic packaging usage detected near Gate B. Increase recycling bin collection rate by volunteers."
      ]
    }
  };
}

function getMockRecommendations() {
  return [
    {
      title: "Open Gate D Backup Lanes",
      action: "Deploy 2 standby volunteers to Gate D security gates.",
      priority: "Medium",
      department: "Crowd Ops",
      reason: "Gate C crowds are spilling over to outer perimeter. Opening Gate D will balance North vs South ingress queues."
    },
    {
      title: "Redistribute Concession Stock",
      action: "Transfer 25% burger patties from FC3 to FC1.",
      priority: "Low",
      department: "Sustainability",
      reason: "FC1 has high demand while FC3 has excessive waste generation."
    },
    {
      title: "Increase Metro Train Capacity",
      action: "Notify transit partners to decrease headway to 3 minutes.",
      priority: "High",
      department: "Transport",
      reason: "Match kickoff is in 45 minutes; platform crowd density is exceeding optimal levels."
    }
  ];
}
