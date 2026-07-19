import datetime
import random

from sqlalchemy.orm import Session

from app.constants import INCLEMENT_WEATHER
from app.database import DBEmergencyState
from app.db_utils import get_setting_value

class StadiumSimulator:
    @staticmethod
    def get_stadium_telemetry(db: Session):
        # Create local random generator to avoid side-effects on global random state
        local_random = random.Random(42)

        # Fetch current dynamic settings
        weather = get_setting_value(db, "weather", "Clear")
        match_time = int(get_setting_value(db, "match_time_minutes", "45"))
        attendance = int(get_setting_value(db, "attendance", "68000"))
        crisis_state = db.query(DBEmergencyState).filter(DBEmergencyState.key == "active_crisis").first()
        crisis_type = crisis_state.type if crisis_state else "none"
        
        # Calculate crowd factor based on time and weather
        # Crowd is highest right before match starts (0-30 mins) and after match ends
        if match_time > 60:
            crowd_multiplier = 0.5
        elif match_time > 0:
            crowd_multiplier = 1.0 - (match_time / 120.0) # builds up
        else:
            crowd_multiplier = 0.8 # match live or post match
            
        if weather in INCLEMENT_WEATHER:
            concession_multiplier = 1.3 # more people stay inside concourses
            transit_multiplier = 1.5 # delays
        else:
            concession_multiplier = 1.0
            transit_multiplier = 1.0
            
        # Emergency multiplier
        if crisis_type != "none":
            crowd_multiplier *= 1.4
            transit_multiplier *= 2.0
        
        # Gates
        gates = {
            "Gate A": {
                "capacity": 8000,
                "current_flow": int(3200 + local_random.randint(-200, 200) * crowd_multiplier),
                "scan_rate": int(45 + local_random.randint(-5, 5)),
                "security_lanes_open": 8,
                "status": "normal" if crisis_type == "none" else "evacuation_exit"
            },
            "Gate B": {
                "capacity": 5000,
                "current_flow": int(1800 + local_random.randint(-150, 150) * crowd_multiplier),
                "scan_rate": int(28 + local_random.randint(-3, 3)),
                "security_lanes_open": 5,
                "status": "normal" if crisis_type == "none" else "evacuation_exit"
            },
            "Gate C": {
                "capacity": 9000,
                "current_flow": int(4100 + local_random.randint(-300, 300) * crowd_multiplier),
                "scan_rate": int(52 + local_random.randint(-5, 5)),
                "security_lanes_open": 10,
                "status": "normal" if crisis_type == "none" else "evacuation_exit"
            },
            "Gate D": {
                "capacity": 4000,
                "current_flow": int(800 + local_random.randint(-50, 50) * crowd_multiplier),
                "scan_rate": int(12 + local_random.randint(-2, 2)),
                "security_lanes_open": 3,
                "status": "normal" if crisis_type != "fire_alarm" else "closed"
            }
        }
        
        # Food Courts
        food_courts = {
            "Food Court 1 (North Concourse)": {
                "wait_time_minutes": int(15 * concession_multiplier + local_random.randint(-2, 3)),
                "queue_length": int(25 * concession_multiplier + local_random.randint(-5, 5)),
                "popular_item": "FIFA Classic Hotdog",
                "stock_level": 82, # percentage
                "food_waste_kg": 12.4
            },
            "Food Court 2 (East Concourse)": {
                "wait_time_minutes": int(5 * concession_multiplier + local_random.randint(-1, 1)),
                "queue_length": int(8 * concession_multiplier + local_random.randint(-2, 2)),
                "popular_item": "Veggie Nachos",
                "stock_level": 94,
                "food_waste_kg": 4.1
            },
            "Food Court 3 (South Concourse)": {
                "wait_time_minutes": int(28 * concession_multiplier + local_random.randint(-3, 4)),
                "queue_length": int(42 * concession_multiplier + local_random.randint(-8, 8)),
                "popular_item": "Angus Beef Burger",
                "stock_level": 45, # high demand, potential waste or shortage
                "food_waste_kg": 34.8 # excessive waste!
            }
        }
        
        # Transit
        transit = {
            "Metro Line 1 (Stadium Station)": {
                "frequency_minutes": 4 if crisis_type == "none" else 2,
                "delay_minutes": int(2 * transit_multiplier + local_random.randint(0, 2)),
                "crowd_level": "High" if crowd_multiplier > 0.7 else "Medium",
                "status": "operating"
            },
            "Bus Shuttle (Gate C Terminal)": {
                "frequency_minutes": 8,
                "delay_minutes": int(5 * transit_multiplier + local_random.randint(-1, 3)),
                "crowd_level": "Very High" if crowd_multiplier > 0.8 else "Medium",
                "status": "operating"
            },
            "Main Parking Lot A": {
                "capacity": 3000,
                "occupied": int(2780 + local_random.randint(-20, 20)),
                "delay_minutes": int(10 * transit_multiplier + local_random.randint(-2, 4))
            },
            "VIP Parking Lot B": {
                "capacity": 500,
                "occupied": int(320 + local_random.randint(-10, 10)),
                "delay_minutes": int(2 * transit_multiplier)
            }
        }
        
        # Volunteers
        volunteers = {
            "total_deployed": 120,
            "allocated": {
                "Gate A Operations": 25,
                "Gate B Operations": 15,
                "Gate C Operations": 30,
                "Gate D Operations": 10,
                "Concourse Navigators": 20,
                "Medical Support Liaison": 10,
                "Accessibility Escorts": 10
            },
            "on_standby": 15
        }
        
        # Sustainability
        sustainability = {
            "energy_usage_kwh": int(4500 + local_random.randint(-100, 100)),
            "solar_generation_kwh": 1200 if weather == "Clear" else 250,
            "water_consumption_liters": int(25000 + local_random.randint(-1000, 1000)),
            "waste_recycled_kg": 850,
            "waste_landfill_kg": 420,
            "insights": [
                "Food Court 3 has excessive food waste (34.8 kg organic waste recorded this hour). Recommending moving 20% of raw ingredients to Food Court 1.",
                "High plastic packaging usage detected near Gate B. Increase recycling bin collection rate by volunteers."
            ]
        }
        
        return {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "weather": weather,
            "match_time_minutes": match_time,
            "attendance": attendance,
            "active_crisis": crisis_type,
            "gates": gates,
            "food_courts": food_courts,
            "transit": transit,
            "volunteers": volunteers,
            "sustainability": sustainability
        }
