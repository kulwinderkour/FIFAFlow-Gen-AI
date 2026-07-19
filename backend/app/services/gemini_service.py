import functools
import json
import logging

import google.generativeai as genai
from google.generativeai.types import HarmBlockThreshold, HarmCategory

from app.config import settings
from app.constants import INCLEMENT_WEATHER, SUSPICIOUS_QUERY_PATTERNS
from app.services.gemini_helpers import parse_gemini_json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini if key is provided
HAS_GEMINI_KEY = bool(settings.GEMINI_API_KEY.strip())
if HAS_GEMINI_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        logger.info("Gemini API key configured successfully.")
    except Exception as e:
        logger.error(f"Error configuring Gemini API: {e}")
        HAS_GEMINI_KEY = False
else:
    logger.info("No Gemini API key detected. Running in Local Simulation (Fallback) Mode.")

GEMINI_SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
}

@functools.lru_cache(maxsize=128)
def _cached_gemini_call(prompt: str, system_instruction: str) -> str:
    """Module-level LRU-cached Gemini API caller. Identical (prompt, system_instruction)
    pairs are served instantly from memory without making a new API call."""
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config={"temperature": 0.4},
        system_instruction=system_instruction,
        safety_settings=GEMINI_SAFETY_SETTINGS,
    )
    response = model.generate_content(prompt)
    return response.text

class GeminiService:
    @staticmethod
    def is_suspicious_query(query: str) -> bool:
        """Simple heuristic check for prompt injection or system bypass attempts."""
        if not query:
            return False
        lower_query = query.lower()
        return any(pattern in lower_query for pattern in SUSPICIOUS_QUERY_PATTERNS)

    @staticmethod
    def _call_gemini(prompt: str, system_instruction: str = "") -> str:
        """Delegates to the module-level LRU-cached Gemini caller.
        Identical (prompt, system_instruction) pairs are served from cache."""
        if not HAS_GEMINI_KEY:
            raise ValueError("No API Key Available")
        try:
            return _cached_gemini_call(prompt, system_instruction)
        except Exception as exc:
            logger.error("Gemini API invocation error: %s. Falling back to simulator.", exc)
            raise

    @classmethod
    def answer_fan_query(cls, query: str, context: dict, lang: str = "en", accessibility_mode: dict = None) -> str:
        """Answers fan questions regarding stadium navigation, routes, concessions, and restrooms."""
        system_prompt = (
            "You are StadiumMind AI, the official FIFA 2026 Stadium Fan Assistant.\n"
            "Respond to the user request. You MUST answer in the language requested or matches the user language context.\n"
            "Available languages: English, Spanish (Español), French (Français), Hindi (हिन्दी), Arabic (العربية), Portuguese (Português).\n"
            "Keep the response professional, highly structured, clear, and encouraging.\n"
            "Use bullet points, clear estimated times, and direct instructions.\n"
            f"Current Stadium Context: {json.dumps(context)}\n"
            f"User Accessibility Settings: {json.dumps(accessibility_mode or {})}\n"
            "If accessibility settings indicate stairless/wheelchair requirement, prioritize elevator routing and avoid stairs."
        )
        
        user_prompt = f"User Query: {query}\nProvide directions, food concessions, or restrooms based on the context."
        
        try:
            return cls._call_gemini(user_prompt, system_prompt)
        except Exception:
            return cls._fallback_fan_query(query, context, lang, accessibility_mode)

    @classmethod
    def generate_ops_recommendations(cls, telemetry: dict, lang: str = "en") -> list:
        """Generates operational adjustments based on live crowd telemetry and explain why."""
        system_prompt = (
            "You are StadiumMind AI Operations Intelligence, analyzing real-time FIFA 2026 stadium telemetry.\n"
            "Generate 4-5 strategic operational recommendations based on current gate densities, concession queues, weather, and match start countdown.\n"
            "For each recommendation, provide: Title, Action, Priority (High/Medium/Low), Target Department, and a detailed reason explaining WHY it is needed.\n"
            "Format the output strictly as a JSON list of objects: "
            '[{"title": "Open Gate D", "action": "Redirect flow to Gate D. Open 5 additional security lanes.", "priority": "High", "department": "Security", "reason": "Gate A is reaching 90% capacity while Gate D is underutilized at 20%."}]'
        )
        
        user_prompt = f"Telemetry: {json.dumps(telemetry)}. Generate recommendations."
        
        try:
            raw_response = cls._call_gemini(user_prompt, system_prompt)
            return parse_gemini_json(raw_response)
        except Exception:
            return cls._fallback_ops_recommendations(telemetry, lang)

    @classmethod
    def answer_volunteer_query(cls, query: str, context: dict, lang: str = "en") -> dict:
        """Generates standard operating procedures (SOP), contacts, and next steps for volunteer issues."""
        system_prompt = (
            "You are StadiumMind AI Volunteer Coordinator. Help the volunteer with their on-pitch incident.\n"
            "Create standard operating procedures (SOP) tailored for FIFA World Cup operations.\n"
            "Return a JSON object with: \n"
            "{\n"
            '  "title": "Incident SOP title",\n'
            '  "sop_steps": ["step 1", "step 2", "step 3"],\n'
            '  "emergency_contact": "Department & Phone",\n'
            '  "info_desk": "Location of nearest help desk",\n'
            '  "next_actions": "Immediate next task"\n'
            "}"
        )
        
        user_prompt = f"Incident reported by volunteer: '{query}'. Context: {json.dumps(context)}."
        
        try:
            raw_response = cls._call_gemini(user_prompt, system_prompt)
            return parse_gemini_json(raw_response)
        except Exception:
            return cls._fallback_volunteer_query(query, context, lang)

    @classmethod
    def plan_transport(cls, query: str, telemetry: dict, lang: str = "en") -> str:
        """Calculates optimal transit route and departure time based on train schedules and exit congestion."""
        system_prompt = (
            "You are StadiumMind AI Transport Coordinator.\n"
            "Formulate a custom travel recommendation considering current gate congestion, weather delays, and the user request.\n"
            "Detail: Recommended Exit Gate, Walk time to transit, Expected transit delay, and Recommended Mode (Metro, Bus, Rideshare, Parking)."
        )
        user_prompt = f"User Request: '{query}'\nLive Transport Status: {json.dumps(telemetry)}"
        
        try:
            return cls._call_gemini(user_prompt, system_prompt)
        except Exception:
            return cls._fallback_transport(query, telemetry, lang)

    @classmethod
    def analyze_emergency(cls, emergency_type: str, telemetry: dict, lang: str = "en") -> dict:
        """Generates active evacuation guidelines, PA announcement text, and volunteer grid deployment."""
        system_prompt = (
            "You are the StadiumMind Emergency Command AI.\n"
            "An emergency scenario has been simulated: " + emergency_type + "\n"
            "Create immediate strategic operations plans. Return a JSON object containing:\n"
            "{\n"
            '  "severity": "CRITICAL" or "WARNING",\n'
            '  "evacuation_strategy": "Evacuation path recommendations...",\n'
            '  "staff_allocation": "Immediate deployment coordinates...",\n'
            '  "public_announcement": "Public announcer script to read over speakers...",\n'
            '  "priority_actions": ["Priority action 1", "Priority action 2"]\n'
            "}"
        )
        
        user_prompt = f"Emergency Telemetry: {json.dumps(telemetry)}. Generate plans."
        
        try:
            raw_response = cls._call_gemini(user_prompt, system_prompt)
            return parse_gemini_json(raw_response)
        except Exception:
            return cls._fallback_emergency(emergency_type, telemetry, lang)

    # =========================================================================
    # LOCAL FALLBACK METHODS (When Gemini API key is missing or calls fail)
    # =========================================================================
    
    @staticmethod
    def _fallback_fan_query(query: str, context: dict, lang: str, accessibility: dict) -> str:
        q = query.lower()
        stairless = accessibility and accessibility.get("stairless", False)
        
        # Translation maps for basic sentences
        translations = {
            "en": {
                "route_info": "Based on stadium heuristics:\n- **Shortest Walking Route:** From Gate B, walk 70 meters straight along Concourse A to Section 24.\n- **Elevator Availability:** Available on Level 1, near Concourse B Lift lobby.\n- **Wheelchair Route:** Accessible elevator path via Lift 3 is active.",
                "restroom": "Walk 50 meters straight from your current position, take the first right. Nearest restroom is located near Gate B entrance (unisex and accessible stalls available). Estimated time: 2 minutes.",
                "food": "Food Court 2 (East Concourse) is closest (80 meters). It has short queues (5-minute wait time). They serve Veggie Nachos and Classic Hotdogs.",
                "unknown": "Hello! I am your AI Stadium Assistant. How can I help you navigate Gate gates, seat rows, accessible elevators, or find hot food concession stands?"
            },
            "es": {
                "route_info": "Según la heurística del estadio:\n- **Ruta de caminata más corta:** Desde la Puerta B, camine 70 metros recto por el Pasillo A hasta la Sección 24.\n- **Disponibilidad de ascensores:** Disponible en el Nivel 1, cerca del vestíbulo del ascensor del Pasillo B.\n- **Ruta para sillas de ruedas:** La ruta accesible del ascensor a través del Elevador 3 está activa.",
                "restroom": "Camine 50 metros recto desde su posición actual, tome la primera a la derecha. El baño más cercano se encuentra cerca de la entrada de la Puerta B. Tiempo estimado: 2 minutos.",
                "food": "El Patio de Comidas 2 es el más cercano (80 metros). Tiene filas cortas (5 minutos de espera). Sirven nachos vegetarianos y perritos calientes clásicos.",
                "unknown": "¡Hola! Soy su Asistente de IA del Estadio. ¿Cómo puedo ayudarle a navegar por las puertas, filas de asientos, ascensores accesibles o encontrar puestos de comida?"
            },
            "fr": {
                "route_info": "Selon les données du stade:\n- **Itinéraire le plus court:** Depuis la Porte B, marchez 70 mètres tout droit dans le Hall A jusqu'à la Section 24.\n- **Ascenseurs:** Disponible au Niveau 1, près du Hall B.\n- **Fauteuil roulant:** Itinéraire accessible par l'Ascenseur 3 actif.",
                "restroom": "Marchez 50 mètres tout droit, prenez la première à droite. Les toilettes les plus proches sont situées près de la Porte B. Temps estimé: 2 minutes.",
                "food": "L'Aire de restauration 2 est la plus proche (80 mètres). File d'attente courte (5 minutes). Ils proposent des Nachos végétariens et des Hot-dogs.",
                "unknown": "Bonjour! Je suis votre Assistant IA du Stade. Comment puis-je vous aider à trouver les portes, sièges, ascenseurs ou stands de nourriture ?"
            },
            "hi": {
                "route_info": "स्टेडियम विवरण के अनुसार:\n- **सबसे छोटा मार्ग:** गेट B से सीधे 70 मीटर चलें, फिर सेक्शन 24 की ओर मुड़ें।\n- **लिफ्ट की उपलब्धता:** लेवल 1 पर लिफ्ट 3 सक्रिय है।\n- **व्हीलचेयर मार्ग:** लिफ्ट 3 के माध्यम से सुगम मार्ग उपलब्ध है।",
                "restroom": "वर्तमान स्थिति से 50 मीटर सीधे चलें, पहला दायाँ मोड़ लें। निकटतम शौचालय गेट B के पास स्थित है। अनुमानित समय: 2 मिनट।",
                "food": "फूड कोर्ट 2 सबसे पास है (80 मीटर)। यहाँ कम भीड़ है (5 मिनट प्रतीक्षा)। वेजी नचोस और क्लासिक हॉटडॉग उपलब्ध हैं।",
                "unknown": "नमस्ते! मैं आपका स्टेडियम एआई सहायक हूँ। क्या मैं गेट, सीट नंबर, लिफ्ट या भोजन स्टालों को खोजने में आपकी मदद कर सकता हूँ?"
            },
            "ar": {
                "route_info": "بناءً على معلومات الاستاد:\n- **أقصر مسار مشي:** من البوابة B، امشِ 70 مترًا مباشرةً في الممر A إلى القسم 24.\n- **المصاعد:** متوفرة في الطابق 1 بالقرب من الممر B.\n- **مسار الكراسي المتحركة:** مسار المصعد الميسر عبر المصعد 3 نشط حاليًا.",
                "restroom": "امشِ 50 مترًا مباشرةً من موقعك الحالي، ثم خذ أول منعطف يمينًا. أقرب دورة مياه تقع بالقرب من مدخل البوابة B. الوقت المقدر: دقيقتان.",
                "food": "ساحة الطعام 2 هي الأقرب (80 مترًا). طوابير الانتظار قصيرة (5 دقائق). يقدمون ناتشوز الخضروات والهوت دوج الكلاسيكي.",
                "unknown": "مرحباً! أنا مساعد الذكاء الاصطناعي للاستاد. كيف يمكنني مساعدتك في الملاحة بين البوابات، مقاعد الجلوس، المصاعد الميسرة، أو العثور على منافذ الطعام؟"
            },
            "pt": {
                "route_info": "De acordo com as rotas do estádio:\n- **Rota mais curta:** Do Portão B, caminhe 70 metros em frente pelo Corredor A até a Seção 24.\n- **Elevadores:** Disponível no Nível 1, próximo ao elevador do Corredor B.\n- **Cadeirante:** Rota acessível pelo Elevador 3 ativa.",
                "restroom": "Caminhe 50 metros em frente, vire na primeira à direita. O banheiro mais próximo fica próximo à entrada do Portão B. Tempo estimado: 2 minutos.",
                "food": "A Praça de Alimentação 2 é a mais próxima (80 metros). Filas curtas (5 minutos de espera). Servem Nachos e Cachorro Quente clássico.",
                "unknown": "Olá! Sou o seu Assistente de IA do Estádio. Como posso ajudar com portões, assentos, elevadores ou praças de alimentação?"
            }
        }
        
        # Select translation dictionary (fallback to English)
        t = translations.get(lang, translations["en"])
        
        if stairless:
            elevator_add = "\n- **Note:** Stairless access mode enabled. We have bypassed all stairs and mapped a route exclusively using ramps and Elevators 1 and 3."
        else:
            elevator_add = ""
            
        if "restroom" in q or "rest room" in q or "washroom" in q or "toilet" in q or "baño" in q or "toilette" in q:
            return t["restroom"] + elevator_add
        elif "food" in q or "hungry" in q or "comida" in q or "eat" in q or "hotdog" in q or "burger" in q:
            return t["food"] + elevator_add
        elif "gate" in q or "seat" in q or "route" in q or "where" in q or "cómo" in q:
            return t["route_info"] + elevator_add
        else:
            return t["unknown"] + elevator_add

    @staticmethod
    def _fallback_ops_recommendations(telemetry: dict, lang: str) -> list:
        # Standard intelligent recommendations based on typical live metrics
        weather = telemetry.get("weather", "Clear")
        active_crisis = telemetry.get("active_crisis", "none")
        
        recs = []
        
        # Gate congestion analysis
        gate_a_flow = telemetry.get("gates", {}).get("Gate A", {}).get("current_flow", 0)
        gate_d_flow = telemetry.get("gates", {}).get("Gate D", {}).get("current_flow", 0)
        
        if gate_a_flow > 3000:
            recs.append({
                "title": "Redirect Gate A to Gate B/D",
                "action": "Adjust dynamic signage outside Gate A. Instruct volunteer stewards to guide arriving spectators towards the underutilized Gate D entry zone.",
                "priority": "High",
                "department": "Crowd Control",
                "reason": f"Gate A is currently scanning at peak load ({gate_a_flow} spectators), causing outdoor queues to spill into roadways, whereas Gate D has capacity ({gate_d_flow} current flow)."
            })
            recs.append({
                "title": "Open Additional Security Lanes",
                "action": "Deploy 3 additional security personnel to Gate A to activate lanes 9, 10, and 11.",
                "priority": "High",
                "department": "Security Ops",
                "reason": "Wait time at Gate A security scan has exceeded 12 minutes. Activating extra lanes will reduce processing time below the target 5 minutes."
            })
            
        # Food Court queues
        fc3_wait = telemetry.get("food_courts", {}).get("Food Court 3 (South Concourse)", {}).get("wait_time_minutes", 0)
        if fc3_wait > 20:
            recs.append({
                "title": "Queue Load Balancing - Food Court 3",
                "action": "Push a notification to the Fan App offering a 10% discount coupon at Food Court 2 (East Concourse) to balance queue lines.",
                "priority": "Medium",
                "department": "Concessions",
                "reason": f"Food Court 3 has a high wait time of {fc3_wait} minutes due to its proximity to Section C, while Food Court 2 is virtually empty (under 8-minute wait)."
            })

        # Weather recommendations
        if weather in INCLEMENT_WEATHER:
            recs.append({
                "title": "Distribute Complimentary Ponchos",
                "action": "Mobilize standby volunteers to distribution centers near Gate entries to hand out recyclable ponchos.",
                "priority": "High",
                "department": "Sustainability & Fan Experience",
                "reason": f"Inclement weather ({weather}) is affecting outdoor security queue areas. Handing out ponchos reduces spectator frustration and keeps lines moving."
            })
            recs.append({
                "title": "Increase Concourse Floor Maintenance",
                "action": "Deploy additional sanitation staff to dry floors in North and South entry concourses.",
                "priority": "High",
                "department": "Facilities",
                "reason": "Rainwater tracked in by spectators creates slip-and-fall hazards on polished concrete walkways."
            })
        else:
            recs.append({
                "title": "Sustainability Check: Organic Waste Transfer",
                "action": "Coordinate transport of surplus inventory from Food Court 3 to Food Court 1 to match high demand.",
                "priority": "Low",
                "department": "Sustainability Operations",
                "reason": "Excess inventory of perishable items in Food Court 3 is projected to create 30kg+ of food waste if not re-allocated to high-demand areas."
            })
            
        if active_crisis != "none":
            recs.insert(0, {
                "title": "URGENT: Execute Emergency Evacuation Protocol",
                "action": "Halt inbound ticketing gates. Divert all staff to evacuation egress pathways. Sound verbal announcement via PA.",
                "priority": "CRITICAL",
                "department": "Command Center",
                "reason": f"An emergency event ({active_crisis}) is active. The stadium must transition immediately to exit-only flow configuration."
            })
            
        return recs[:4]

    @staticmethod
    def _fallback_volunteer_query(query: str, context: dict, lang: str) -> dict:
        q = query.lower()
        
        if "lost" in q or "child" in q or "niño" in q or "enfant" in q:
            return {
                "title": "FIFA SOP: Lost Child Protocol",
                "sop_steps": [
                    "Stay with the child in the exact location found for at least 5 minutes; do NOT walk them around.",
                    "Report child details (age, clothing, language, first name) immediately to the nearest Security Coordinator.",
                    "Wait for a verified Stadium Steward or Police officer to escort the child to the main Lost & Found Facility near Gate A Lobby.",
                    "Record the officer's badge number and log it in the StadiumMind Incident log."
                ],
                "emergency_contact": "Child Protection Liaison (Channel 4 / Ext 402)",
                "info_desk": "Main Information Desk (Level 1, North Concourse near Gate A)",
                "next_actions": "Verify if the child speaks English, Spanish, or French, and check if they have a wristband containing parent contact details."
            }
        elif "medical" in q or "injury" in q or "pain" in q or "heart" in q or "faint" in q:
            return {
                "title": "FIFA SOP: Medical Emergency Response",
                "sop_steps": [
                    "Verify responsiveness and airway. If unconscious, call the Medical Liaison immediately.",
                    "Instruct a nearby fan to fetch the nearest automated external defibrillator (AED) located in the concourse cabinets.",
                    "Do NOT attempt to move the casualty unless they are in immediate danger.",
                    "Stay with the patient, administer basic comfort, and clear a 3-meter radius around them to let the response team work."
                ],
                "emergency_contact": "Paramedic Dispatch (Channel 1 / Speeddial #911)",
                "info_desk": "First Aid Station C (South Concourse behind Section 104)",
                "next_actions": "Clear the aisle walkway so the stretcher team has immediate access when they arrive."
            }
        else:
            return {
                "title": "FIFA SOP: General Incident Reporting",
                "sop_steps": [
                    "Assess the situation and ensure your own personal safety first.",
                    "Log the incident details in the StadiumMind Volunteer portal.",
                    "Contact your Area Supervisor via two-way radio if assistance is required."
                ],
                "emergency_contact": "Volunteer Help Desk (Channel 9 / Ext 900)",
                "info_desk": "Volunteer Lounge (Gate D Basement)",
                "next_actions": "Keep the surrounding area calm and await instructions from security staff."
            }

    @staticmethod
    def _fallback_transport(query: str, telemetry: dict, lang: str) -> str:
        q = query.lower()
        delay_metro = telemetry.get("transit", {}).get("Metro Line 1 (Stadium Station)", {}).get("delay_minutes", 2)
        delay_bus = telemetry.get("transit", {}).get("Bus Shuttle (Gate C Terminal)", {}).get("delay_minutes", 5)
        
        # Translation maps for transit response
        if "train" in q or "metro" in q or "subway" in q:
            return (
                f"### Custom Travel Recommendation (Metro Line 1)\n"
                f"- **Recommended Exit Gate:** Exit via **Gate B** (closest walk, 3 minutes to station platform).\n"
                f"- **Walking Distance:** 120 meters.\n"
                f"- **Current Transit Delay:** {delay_metro} minutes delay reported due to boarding congestion.\n"
                f"- **Action Plan:** Leave your seat immediately. The metro is running at high frequency (every 2-4 minutes). "
                f"With a {delay_metro}m delay and a 3m walk, you will arrive at the platform in approximately 8 minutes, leaving 37 minutes buffer before your train departs."
            )
        elif "bus" in q or "shuttle" in q:
            return (
                f"### Custom Travel Recommendation (Bus Shuttle)\n"
                f"- **Recommended Exit Gate:** Exit via **Gate C** (Bus shuttle terminal is right outside).\n"
                f"- **Walking Distance:** 60 meters.\n"
                f"- **Current Transit Delay:** {delay_bus} minutes delay due to street traffic.\n"
                f"- **Action Plan:** Direct shuttle service to the downtown transit hub is operational. Expect moderate boarding lines at Gate C bays."
            )
        else:
            return (
                f"### Custom Travel Recommendation (General Transit Plan)\n"
                f"- **Recommended Exit Gate:** **Gate D** (least congested gate, shortest exit queue).\n"
                f"- **Walk to Parking Lot A:** 8 minutes. Parking queue delay is 10 minutes.\n"
                f"- **Rideshare Egress Area:** Located outside Gate B. Surge pricing is active, estimated wait time for rideshare pickup is 15 minutes.\n"
                f"- **Recommendation:** If you need to depart within 45 minutes, we recommend walking to **Gate B** to board **Metro Line 1**, which has dedicated tracks and avoids road congestion."
            )

    @staticmethod
    def _fallback_emergency(emergency_type: str, telemetry: dict, lang: str) -> dict:
        if emergency_type == "fire_alarm":
            return {
                "severity": "CRITICAL",
                "evacuation_strategy": "Evacuate Sections A and B immediately via Gates A and B. Sections C and D should egress via Gate C. Gate D is designated for emergency responder access only.",
                "staff_allocation": "Deploy all available security staff to clear stairwells on Level 2. Position volunteers at concourse junctions to direct crowds away from the North Concourse.",
                "public_announcement": "LADIES AND GENTLEMEN, PLEASE ATTENTION. WE ARE INVESTIGATING AN INCIDENT IN THE NORTH CONCOURSE. PLEASE REMAIN CALM AND PROCEED IMMEDIATELY TO THE NEAREST EXIT GATES A OR C. DO NOT USE ELEVATORS.",
                "priority_actions": [
                    "Initiate automated fire suppression systems in North Concourse food concessions.",
                    "Deactivate turnstile gates at all entrances to ensure free-flowing egress.",
                    "Dispatch emergency responders to Level 1 Concession 3 kitchen area."
                ]
            }
        elif emergency_type == "heavy_rain" or emergency_type == "storm":
            return {
                "severity": "WARNING",
                "evacuation_strategy": "Maintain standard exit gates. Open all concourse lobby doors to permit indoor waiting. Advise spectators to shelter in place until the storm peak passes.",
                "staff_allocation": "Deploy maintenance staff with wet vacuums to Gates B and C. Move volunteers under covered roofing sections to guide incoming fans.",
                "public_announcement": "ATTENTION FANS. A HEAVY RAINSTORM IS CURRENTLY PASSING OVER THE STADIUM area. FOR YOUR SAFETY, PLEASE REMAIN UNDER THE COVERED CONCOURSES. ACCESSIBLE SHUTTLES ARE POSITIONED AT GATE C TERMINAL.",
                "priority_actions": [
                    "Distribute rain ponchos at Gate entries.",
                    "Extend food court operating hours as fans shelter in concourses.",
                    "Increase shuttle bus frequency to reduce outdoor waiting times."
                ]
            }
        elif emergency_type == "power_failure":
            return {
                "severity": "CRITICAL",
                "evacuation_strategy": "Engage secondary battery lighting. Stop all ticket scanning. Egress is optional but guided. Instruct fans to remain in seats unless directed by stewards.",
                "staff_allocation": "Position staff with megaphones at all major gate exits. Dispatch electrical response crew to Substation B.",
                "public_announcement": "ATTENTION SPECTATORS. WE ARE EXPERIENCING A TEMPORARY POWER INTERRUPTION. AUXILIARY POWER HAS ENGAGED. PLEASE REMAIN SEATED AND CALM while our engineers work to restore service.",
                "priority_actions": [
                    "Verify backup generator load is within safety thresholds.",
                    "Verify PA system and emergency lighting are operational.",
                    "Manual override locks on all perimeter safety gates."
                ]
            }
        else:
            return {
                "severity": "WARNING",
                "evacuation_strategy": "Standard exit routing. Clear corridors for medical transport vehicles.",
                "staff_allocation": "Deploy Medical Support Liaisons to the section of the medical alert.",
                "public_announcement": "ATTENTION FANS. MEDICAL RESPONSE IS ACTIVE IN SECTION C. PLEASE CLEAR THE WALKWAYS FOR FIRST AID PERSONNEL. THANK YOU FOR YOUR COOPERATION.",
                "priority_actions": [
                    "Clear first-aid access routes.",
                    "Establish telemetry link with local hospital dispatch."
                ]
            }
