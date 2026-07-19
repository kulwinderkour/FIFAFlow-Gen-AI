import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Setup MetLife Stadium coordinates as central venue
const STADIUM_CENTER: [number, number] = [40.8135, -74.0744];

// Coordinate nodes for gates, seats, facilities
const COORDINATES: Record<string, [number, number]> = {
  "Gate A": [40.8148, -74.0744], // North Gate
  "Gate B": [40.8135, -74.0725], // East Gate
  "Gate C": [40.8122, -74.0744], // South Gate
  "Gate D": [40.8135, -74.0763], // West Gate
  "Section 100": [40.8141, -74.0740],
  "Section 200": [40.8138, -74.0732],
  "Section A24": [40.8130, -74.0738],
  "Food Court 1": [40.8145, -74.0744],
  "Food Court 2": [40.8135, -74.0730],
  "Food Court 3": [40.8125, -74.0744],
  "Restroom North": [40.8146, -74.0740],
  "Restroom East": [40.8136, -74.0728],
  "Restroom South": [40.8124, -74.0740],
  "Elevator East Lobby": [40.8134, -74.0732],
  "Elevator West Lobby": [40.8136, -74.0756],
};

// Custom markup for markers using Tailwind styles
const createCustomIcon = (htmlContent: string) => {
  return L.divIcon({
    html: `<div class="flex items-center justify-center">${htmlContent}</div>`,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const icons = {
  gate: createCustomIcon(`<div class="bg-fifa-blue border border-fifa-teal text-fifa-teal p-1.5 rounded-full shadow-neon-blue font-bold text-xs w-8 h-8 flex items-center justify-center">G</div>`),
  food: createCustomIcon(`<div class="bg-slate-900 border border-fifa-gold text-fifa-gold p-1.5 rounded-full shadow-neon-gold text-xs">🍔</div>`),
  restroom: createCustomIcon(`<div class="bg-blue-600 border border-white text-white p-1.5 rounded-full text-xs">🚹</div>`),
  elevator: createCustomIcon(`<div class="bg-emerald-600 border border-emerald-300 text-emerald-200 p-1.5 rounded-full text-xs">🛗</div>`),
  emergency: createCustomIcon(`<div class="bg-red-600 border border-white text-white p-1.5 rounded-full shadow-neon-red animate-bounce text-xs">⚠️</div>`),
};

// Component to dynamically re-focus map center
const MapFocusController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface StadiumMapProps {
  routeStart?: string;
  routeEnd?: string;
  highlightCategory?: 'all' | 'restrooms' | 'food' | 'accessibility';
  heatmapData?: any;
  emergencyActive?: string;
}

export const StadiumMap: React.FC<StadiumMapProps> = ({ 
  routeStart, 
  routeEnd, 
  highlightCategory = 'all', 
  heatmapData,
  emergencyActive = 'none' 
}) => {
  
  // Calculate route polyline path — memoized on routing/accessibility changes only
  const routePath = useMemo(() => {
    if (!routeStart || !routeEnd) return null;
    const startNode = COORDINATES[routeStart];
    const endNode = COORDINATES[routeEnd] || COORDINATES["Section A24"];
    if (!startNode || !endNode) return null;
    // Route via Elevator lobby when accessibility mode is active
    if (highlightCategory === 'accessibility') {
      return [startNode, COORDINATES["Elevator East Lobby"], endNode];
    }
    return [startNode, endNode];
  }, [routeStart, routeEnd, highlightCategory]);

  // Determine heatmap coloring based on gate scans
  const getGateColor = (gateName: string) => {
    if (!heatmapData || !heatmapData[gateName]) return '#10b981'; // default green
    const flow = heatmapData[gateName].current_flow;
    const capacity = heatmapData[gateName].capacity;
    const ratio = flow / capacity;
    
    if (ratio > 0.75) return '#ff1744'; // red (congested)
    if (ratio > 0.45) return '#fbbf24'; // amber (moderate)
    return '#10b981'; // green (low congestion)
  };

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer 
        center={STADIUM_CENTER} 
        zoom={16.5} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-leaflet-tiles" // Restyled to dark theme in index.css
        />

        <MapFocusController center={STADIUM_CENTER} zoom={16.5} />

        {/* 1. Large Circular Boundary representing Stadium outline */}
        <Circle 
          center={STADIUM_CENTER} 
          radius={280} 
          pathOptions={{ color: '#00b4d8', fill: false, weight: 2, dashArray: '5, 10' }} 
        />

        {/* 2. Heatmaps for Gate Congestion */}
        {heatmapData && Object.keys(heatmapData).map((gate) => {
          const coords = COORDINATES[gate];
          if (!coords) return null;
          const color = getGateColor(gate);
          const val = heatmapData[gate];
          return (
            <Circle
              key={gate}
              center={coords}
              radius={70}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.25,
                weight: 1.5
              }}
            >
              <Popup>
                <div className="text-slate-900 font-semibold p-1">
                  <h4 className="font-extrabold text-sm">{gate}</h4>
                  <p className="text-xs">Flow Rate: {val.current_flow} / {val.capacity} spectators</p>
                  <p className="text-xs">Processing Time: {Math.ceil(val.current_flow / val.scan_rate)}s per row</p>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* 3. Concession Markers (Food Courts) */}
        {(highlightCategory === 'all' || highlightCategory === 'food') && (
          <>
            <Marker position={COORDINATES["Food Court 1"]} icon={icons.food}>
              <Popup>
                <div className="text-slate-900 font-bold text-xs p-1">
                  <h4 className="font-extrabold">Food Court 1 (North)</h4>
                  <p>Popular: FIFA Classic Hotdog</p>
                </div>
              </Popup>
            </Marker>
            <Marker position={COORDINATES["Food Court 2"]} icon={icons.food}>
              <Popup>
                <div className="text-slate-900 font-bold text-xs p-1">
                  <h4 className="font-extrabold">Food Court 2 (East)</h4>
                  <p>Popular: Veggie Nachos</p>
                </div>
              </Popup>
            </Marker>
            <Marker position={COORDINATES["Food Court 3"]} icon={icons.food}>
              <Popup>
                <div className="text-slate-900 font-bold text-xs p-1">
                  <h4 className="font-extrabold">Food Court 3 (South)</h4>
                  <p>Popular: Angus Beef Burger (Excess waste warning)</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* 4. Restroom Markers */}
        {(highlightCategory === 'all' || highlightCategory === 'restrooms') && (
          <>
            <Marker position={COORDINATES["Restroom North"]} icon={icons.restroom}>
              <Popup><span className="text-slate-900 font-bold text-xs">Restroom (Gate A North)</span></Popup>
            </Marker>
            <Marker position={COORDINATES["Restroom East"]} icon={icons.restroom}>
              <Popup><span className="text-slate-900 font-bold text-xs">Restroom (Gate B East)</span></Popup>
            </Marker>
            <Marker position={COORDINATES["Restroom South"]} icon={icons.restroom}>
              <Popup><span className="text-slate-900 font-bold text-xs">Restroom (Gate C South)</span></Popup>
            </Marker>
          </>
        )}

        {/* 5. Accessibility Elevators */}
        {(highlightCategory === 'all' || highlightCategory === 'accessibility') && (
          <>
            <Marker position={COORDINATES["Elevator East Lobby"]} icon={icons.elevator}>
              <Popup><span className="text-slate-900 font-bold text-xs">Elevator Lobby East (Wheelchair Accessible Lift)</span></Popup>
            </Marker>
            <Marker position={COORDINATES["Elevator West Lobby"]} icon={icons.elevator}>
              <Popup><span className="text-slate-900 font-bold text-xs">Elevator Lobby West (Wheelchair Accessible Lift)</span></Popup>
            </Marker>
          </>
        )}

        {/* 6. Active Emergency Markers */}
        {emergencyActive !== 'none' && (
          <Marker position={STADIUM_CENTER} icon={icons.emergency}>
            <Popup>
              <div className="text-red-600 font-bold text-xs">
                <h3>⚠️ CRISIS COMMAND SECTOR</h3>
                <p>Status: Active Emergency Simulation</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 7. Dynamic Route Path Overlay */}
        {routePath && (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: highlightCategory === 'accessibility' ? '#10b981' : '#00b4d8',
              weight: 5,
              opacity: 0.85,
              dashArray: '1, 8',
              lineCap: 'round'
            }}
          />
        )}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-xs space-y-1.5 z-[1000] max-w-[200px] glass-panel shadow-2xl">
        <h4 className="font-extrabold text-[10px] tracking-wider text-slate-400 uppercase">Stadium Legend</h4>
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-3.5 rounded-full bg-fifa-blue border border-fifa-teal flex items-center justify-center text-[8px] text-fifa-teal">G</div>
          <span>Security Entrance Gates</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>🍔</span>
          <span>Food Concession Courts</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>🚹</span>
          <span>Public Restrooms</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>🛗</span>
          <span>Accessible Elevators</span>
        </div>
        {routePath && (
          <div className="flex items-center space-x-2 mt-1 border-t border-slate-800 pt-1.5">
            <div className={`w-6 h-1 border-b-2 border-dashed ${highlightCategory === 'accessibility' ? 'border-emerald-500' : 'border-cyan-500'}`} />
            <span className="font-semibold text-slate-300">Planned Route</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default StadiumMap;
