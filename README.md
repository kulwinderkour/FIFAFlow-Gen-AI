# StadiumMind ⚽
### AI Stadium Operations & Fan Intelligence Platform (FIFA World Cup 2026 Hackathon)

StadiumMind is a production-quality, high-performance Generative AI web application designed to solve real-world stadium operation challenges at MetLife Stadium during the FIFA World Cup 2026. The platform optimizes operations and navigation for four primary roles: **Fans**, **Organizers**, **Volunteers**, and **Emergency/Stadium Staff**.

---

## 📖 Problem Statement
Traditional stadium mobile apps only provide static maps and hardcoded FAQs. Large sports venues face dynamic challenges during massive events like the FIFA World Cup, including:
- **Crowd congestion** at gates during ingress/egress.
- **Accessibility constraints** for wheelchair, visually, and hearing impaired spectators.
- **Language barriers** for international travelers.
- **Volunteer coordination delay** during field incidents (e.g. lost children, medical triage).
- **Sustainability logistics** such as organic food waste in concessions.
- **Crisis management coordination** (e.g. fire alarms, storms, blackouts).

StadiumMind addresses these problems by leveraging Google Gemini Generative AI to understand real-time telemetry, predict crowding, and generate operational recommendations, SOPs, and voice-guided routing.

---

## 🛠 Tech Stack
### Backend
- **FastAPI (Python 3.10+)**: Async server REST APIs.
- **Google Gemini API**: Dynamic NLP reasoning, routing recommendations, SOP creation, translations.
- **SQLAlchemy & SQLite**: Local database persistence of incident logs, configurations, and chat histories.
- **Uvicorn**: Server engine.

### Frontend
- **React 18 & TypeScript & Vite**: Core SPA framework.
- **Tailwind CSS v3**: Dark-themed custom styling with high contrast modes, neon boundaries, and glassmorphism.
- **Framer Motion**: Smooth page entry transitions and hover feedback.
- **Leaflet & React-Leaflet**: Coordinates interactive maps showing food stalls, restrooms, elevators, heatmaps, and routing.
- **Recharts**: Telemetry charts representing scan velocities and wait queues.
- **Web Speech API**: In-browser **Speech-to-Text (STT)** and **Text-to-Speech (TTS)** voice support.

---

## 📂 Folder Structure
```
FIFA3/
├── backend/
│   ├── app/
│   │   ├── config.py             # Config loader
│   │   ├── database.py           # SQL Alchemy SQLite model declarations
│   │   ├── main.py               # Main FastAPI entry point
│   │   ├── schemas.py            # Pydantic input schemas
│   │   ├── routers/
│   │   │   ├── assistant.py      # Fan Assistant POST / history routes
│   │   │   ├── operations.py     # Live telemetry metrics / AI recommendation feeds
│   │   │   ├── transport.py      # Transport planner endpoints
│   │   │   └── emergency.py      # Simulation / volunteer incident logs
│   │   └── services/
│   │       ├── gemini_service.py # Gemini client + robust offline fallback models
│   │       └── simulator.py      # Telemetry state engine (crowds, food courts)
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env
│   └── run.py                    # Uvicorn entry wrapper
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx        # Shell sidebar + header countdowns + weather info
│   │   │   └── StadiumMap.tsx    # Leaflet MetLife map visualizer
│   │   ├── context/
│   │   │   └── AccessibilityContext.tsx # Contrast/TTS context
│   │   ├── pages/
│   │   │   ├── Home.tsx                  # Portal selectors
│   │   │   ├── FanAssistant.tsx          # Nav maps + STT/TTS chat
│   │   │   ├── OperationsDashboard.tsx   # Recharts charts + AI recommendations
│   │   │   ├── VolunteerAssistant.tsx    # Incident logger + SOP expander
│   │   │   ├── TransportPlanner.tsx      # Multi-modal egress scheduling
│   │   │   ├── EmergencyCenter.tsx       # Crisis matrix commander
│   │   │   └── Settings.tsx              # API configurations / Locale toggles
│   │   ├── services/
│   │   │   └── api.ts                    # Backend adapter + full client mocks
│   │   ├── App.tsx
│   │   ├── index.css                 # Custom glassmorphism / dark map tiles filter
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── README.md
└── implementation_plan.md
```

---

## ⚡ AI Cognitive Workflow
1. **Intake & Context Gathering:** Telemetry (scan rates, weather, wait queues) is continuously simulated.
2. **LLM Query Formulation:** When a fan asks a question (or a volunteer logs an incident), the server joins the telemetry state with user attributes (e.g. wheelchair mode, language) into a system instructions brief.
3. **Generative Processing:** Google Gemini API analyzes the prompt, checks capacity thresholds, and structures recommendations, directions, or SOP steps.
4. **Execution & Feedback Loop:** Organizers can review and click "Authorize Action" on the Operations Dashboard to dynamically adjust stadium metrics, closing the decision loop.
5. **Robust Local Fallback:** If the Gemini API key is missing, a rule-based AI engine parses query semantics locally to generate detailed instructions.

---

## 🚀 Installation & Local Launch

### Step 1: Clone and Configure Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your `.env` variables. Copy `.env.example` into `.env` and optionally paste your Google Gemini Key:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
5. Run the FastAPI server:
   ```bash
   python run.py
   ```
   The backend API will start on `http://127.0.0.1:8000`.

### Step 2: Configure and Compile Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm modules:
   ```bash
   npm install
   ```
3. Boot the Vite development server:
   ```bash
   npm run dev
   ```
   The React application will compile and start on `http://localhost:3000`. Any request targeting `/api` will automatically proxy to the FastAPI server.

---

## ♿ Accessibility Compliance (WCAG 2.1)
- **High Contrast Toggle:** Toggles high contrast CSS class styling (black and yellow layout colors) for visually impaired spectators.
- **Large Font Scaling:** Adjusts base typography sizes dynamically across all components.
- **Text-to-Speech Vocalizer:** Directly synthesizes text responses into clear verbal directions in English, Spanish, French, Portuguese, Hindi, or Arabic using the Web Speech API.
- **Stairless Routing Toggle:** Re-routes navigation path overlays exclusively through lifts/elevators on the Leaflet Map.

---

## 🔮 Future Improvements
- **Live Ticket Barcode Scanners:** Direct integration with Ticketmaster/FIFA ticketing APIs.
- **Sensory Map Layers:** Visual maps indicating low-sensory/quiet zones for neurodivergent fans.
- **Real-Time GPS Location:** Integrating HTML5 Geolocation API to pin live fan locations on the stadium Leaflet grid.
- **Multi-Agent Coordination:** Using Gemini to deploy automated drone patrols to gate bottlenecks.
