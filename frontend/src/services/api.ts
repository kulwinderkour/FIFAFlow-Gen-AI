// StadiumMind Backend API Service

const BASE_URL = '';

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `API Error: ${res.status}`);
  }
  return res.json();
}

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
  fallback?: () => T
): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, options);
    return await handleResponse(res);
  } catch (error) {
    if (fallback) {
      return fallback();
    }
    throw error;
  }
}

function postJson(path: string, body: unknown) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  } satisfies RequestInit;
}

export const api = {
  async sendFanQuery(
    query: string,
    gate?: string,
    seat?: string,
    lang: string = 'en',
    accessibility?: Record<string, boolean>
  ) {
    return apiRequest(
      '/api/assistant/query',
      postJson('/api/assistant/query', { query, gate, seat, lang, accessibility }),
      () => ({
        answer: getClientMockAnswer(query, lang, accessibility?.stairless),
        timestamp: new Date().toISOString(),
      })
    );
  },

  async getChatHistory() {
    return apiRequest(
      '/api/assistant/history',
      undefined,
      () => JSON.parse(localStorage.getItem('stadium_chat_history') || '[]')
    );
  },

  async clearChatHistory() {
    return apiRequest(
      '/api/assistant/history',
      { method: 'DELETE' },
      () => {
        localStorage.removeItem('stadium_chat_history');
        return { status: 'success' };
      }
    );
  },

  async getTelemetry() {
    return apiRequest('/api/operations/telemetry', undefined, getMockTelemetry);
  },

  async getRecommendations() {
    return apiRequest(
      '/api/operations/recommendations',
      undefined,
      () => ({ recommendations: getMockRecommendations() })
    );
  },

  async updateSettings(settings: { weather?: string; match_time_minutes?: number; attendance?: number }) {
    return apiRequest(
      '/api/operations/settings',
      postJson('/api/operations/settings', settings),
      () => ({ status: 'success' })
    );
  },

  async getTransportPlan(query: string, lang: string = 'en') {
    return apiRequest(
      '/api/transport/plan',
      postJson('/api/transport/plan', { query, lang }),
      () => ({
        query,
        plan: '### Travel Recommendation (Offline Mode)\n- **Exit Gate:** Gate B\n- **Route:** Walk to Metro Line 1 (120 meters).\n- **Status:** Metro running every 4 minutes. Allow 20 minutes egress delay.\n- **Arrival:** Estimated arrival at downtown station: 35 minutes. Your journey is safe!',
        transit_status: getMockTelemetry().transit,
      })
    );
  },

  async getEmergencyStatus() {
    return apiRequest('/api/emergency/status', undefined, () => ({
      type: localStorage.getItem('mock_emergency_type') || 'none',
      severity: localStorage.getItem('mock_emergency_severity') || 'low',
      instructions: localStorage.getItem('mock_emergency_instructions') || '',
      announcement: localStorage.getItem('mock_emergency_announcement') || '',
      priority_actions: JSON.parse(localStorage.getItem('mock_emergency_actions') || '[]'),
    }));
  },

  async simulateEmergency(type: string, severity: string = 'medium') {
    return apiRequest(
      '/api/emergency/simulate',
      postJson('/api/emergency/simulate', { type, severity }),
      () => {
        localStorage.setItem('mock_emergency_type', type);
        if (type === 'none') {
          localStorage.setItem('mock_emergency_severity', 'low');
          localStorage.setItem('mock_emergency_instructions', '');
          localStorage.setItem('mock_emergency_announcement', '');
          localStorage.setItem('mock_emergency_actions', '[]');
        } else {
          localStorage.setItem('mock_emergency_severity', severity);
          const announcements: Record<string, string> = {
            fire_alarm: 'ATTENTION FANS. AN EMERGENCY EVACUATION IS IN PROGRESS. PLEASE PROCEED TO GATES A OR C. DO NOT USE ELEVATORS.',
            power_failure: 'ATTENTION FANS. WE ARE EXPERIENCING A POWER OUTAGE. AUXILIARY SYSTEM ACTIVE. PLEASE REMAIN CALM.',
            heavy_rain: 'ATTENTION FANS. HEAVY WEATHER SYSTEM DETECTED. PLEASE TAKE SHELTER IN COVERED AREAS.',
            medical_emergency: 'ATTENTION FANS. FIRST AID PERSONNEL IN ROUTE TO SECTION C.',
          };
          const actions: Record<string, string[]> = {
            fire_alarm: ['Evacuate North Concourse', 'Override gates to exit-only', 'Dispatch responders'],
            power_failure: ['Engage backup power', 'Halt ticket gates', 'Direct stadium lighting'],
            heavy_rain: ['Distribute rain ponchos', 'Clear drainage grates', 'Increase shuttle frequency'],
            medical_emergency: ['Clear stretcher corridor', 'Alert nearest hospital', 'Direct ambulance'],
          };
          localStorage.setItem('mock_emergency_announcement', announcements[type] || '');
          localStorage.setItem('mock_emergency_actions', JSON.stringify(actions[type] || []));
          localStorage.setItem('mock_emergency_instructions', `Standard operating response for ${type} is active.`);
        }
        return { status: 'success' };
      }
    );
  },

  async getIncidents() {
    return apiRequest(
      '/api/emergency/incidents',
      undefined,
      () => JSON.parse(localStorage.getItem('mock_incidents') || '[]')
    );
  },

  async reportIncident(incident: { type: string; location: string; description: string; reported_by: string }) {
    return apiRequest(
      '/api/emergency/incidents',
      postJson('/api/emergency/incidents', incident),
      () => {
        const mockIncidents = JSON.parse(localStorage.getItem('mock_incidents') || '[]');
        const newInc = {
          id: Math.floor(Math.random() * 10000),
          ...incident,
          status: 'active',
          timestamp: new Date().toISOString(),
          sop_steps: [
            'Report location coordinates to central dispatch.',
            'Secure area safety parameters.',
            'Administer standard guidelines according to training.',
            'Coordinate arrival of field supervisor.',
          ],
          emergency_contact: 'Volunteer Supervisor (Ch. 9)',
        };
        mockIncidents.unshift(newInc);
        localStorage.setItem('mock_incidents', JSON.stringify(mockIncidents));
        return newInc;
      }
    );
  },

  async resolveIncident(incidentId: number) {
    return apiRequest(
      `/api/emergency/incidents/${incidentId}/resolve`,
      { method: 'POST' },
      () => {
        const mockIncidents = JSON.parse(localStorage.getItem('mock_incidents') || '[]');
        const updated = mockIncidents.map((inc: { id: number; status: string }) =>
          inc.id === incidentId ? { ...inc, status: 'resolved' } : inc
        );
        localStorage.setItem('mock_incidents', JSON.stringify(updated));
        return { status: 'success' };
      }
    );
  },

  async getSystemStatus() {
    return apiRequest('/api/system/status', undefined, () => ({ gemini_api_configured: false }));
  },
};

function getClientMockAnswer(query: string, lang: string, stairless?: boolean) {
  const q = query.toLowerCase();
  const step = stairless
    ? 'Use Elevator Corridor B Lift 2 (ramp access on Level 1).'
    : 'Walk 70 meters straight and take Gate B stairs.';

  if (q.includes('restroom') || q.includes('bath') || q.includes('toilet') || q.includes('baño') || q.includes('wc')) {
    return `**StadiumMind Fan Assistant** (Offline Mode)\n\nWalk 50m towards the Gate B concourse. The closest restroom is immediately beside Food Court 2.\n- **Estimated walking time:** 2 minutes.\n- **Accessibility:** Fully wheelchair-accessible toilet. ${stairless ? 'Elevator path cleared.' : ''}`;
  }
  if (q.includes('food') || q.includes('eat') || q.includes('burger') || q.includes('hotdog')) {
    return `**StadiumMind Fan Assistant** (Offline Mode)\n\nFood Court 2 (East Concourse) is located 80m away. \n- **Wait time:** 5 minutes (Short Queue).\n- **Special items:** Veggie Nachos & Classic Footlongs.\n- **Accessibility:** Ramps fully open. ${step}`;
  }
  return `**StadiumMind Fan Assistant** (Offline Mode)\n\nRoute planned from Gate B to Section A24:\n1. Pass through security Gate B.\n2. Proceed straight towards the North corridor.\n3. ${step}\n- **Estimated time:** 4 minutes. Enjoy the World Cup match!`;
}

function getMockTelemetry() {
  return {
    timestamp: new Date().toISOString(),
    weather: 'Clear',
    match_time_minutes: 45,
    attendance: 68000,
    active_crisis: 'none',
    gates: {
      'Gate A': { capacity: 8000, current_flow: 3500, scan_rate: 45, security_lanes_open: 8, status: 'normal' },
      'Gate B': { capacity: 5000, current_flow: 1800, scan_rate: 28, security_lanes_open: 5, status: 'normal' },
      'Gate C': { capacity: 9000, current_flow: 4100, scan_rate: 52, security_lanes_open: 10, status: 'normal' },
      'Gate D': { capacity: 4000, current_flow: 800, scan_rate: 12, security_lanes_open: 3, status: 'normal' },
    },
    food_courts: {
      'Food Court 1 (North Concourse)': { wait_time_minutes: 15, queue_length: 25, popular_item: 'FIFA Classic Hotdog', stock_level: 82, food_waste_kg: 12.4 },
      'Food Court 2 (East Concourse)': { wait_time_minutes: 5, queue_length: 8, popular_item: 'Veggie Nachos', stock_level: 94, food_waste_kg: 4.1 },
      'Food Court 3 (South Concourse)': { wait_time_minutes: 28, queue_length: 42, popular_item: 'Angus Beef Burger', stock_level: 45, food_waste_kg: 34.8 },
    },
    transit: {
      'Metro Line 1 (Stadium Station)': { frequency_minutes: 4, delay_minutes: 2, crowd_level: 'High', status: 'operating' },
      'Bus Shuttle (Gate C Terminal)': { frequency_minutes: 8, delay_minutes: 5, crowd_level: 'Medium', status: 'operating' },
      'Main Parking Lot A': { capacity: 3000, occupied: 2780, delay_minutes: 10 },
      'VIP Parking Lot B': { capacity: 500, occupied: 320, delay_minutes: 2 },
    },
    volunteers: {
      total_deployed: 120,
      allocated: {
        'Gate A Operations': 25,
        'Gate B Operations': 15,
        'Gate C Operations': 30,
        'Gate D Operations': 10,
        'Concourse Navigators': 20,
        'Medical Support': 10,
        'Accessibility Support': 10,
      },
      on_standby: 15,
    },
    sustainability: {
      energy_usage_kwh: 4500,
      solar_generation_kwh: 1200,
      water_consumption_liters: 25000,
      waste_recycled_kg: 850,
      waste_landfill_kg: 420,
      insights: [
        'Food Court 3 has excessive food waste (34.8 kg organic waste recorded this hour). Recommending moving 20% of raw ingredients to Food Court 1.',
        'High plastic packaging usage detected near Gate B. Increase recycling bin collection rate by volunteers.',
      ],
    },
  };
}

function getMockRecommendations() {
  return [
    {
      title: 'Open Gate D Backup Lanes',
      action: 'Deploy 2 standby volunteers to Gate D security gates.',
      priority: 'Medium',
      department: 'Crowd Ops',
      reason: 'Gate C crowds are spilling over to outer perimeter. Opening Gate D will balance North vs South ingress queues.',
    },
    {
      title: 'Redistribute Concession Stock',
      action: 'Transfer 25% burger patties from FC3 to FC1.',
      priority: 'Low',
      department: 'Sustainability',
      reason: 'FC1 has high demand while FC3 has excessive waste generation.',
    },
    {
      title: 'Increase Metro Train Capacity',
      action: 'Notify transit partners to decrease headway to 3 minutes.',
      priority: 'High',
      department: 'Transport',
      reason: 'Match kickoff is in 45 minutes; platform crowd density is exceeding optimal levels.',
    },
  ];
}
