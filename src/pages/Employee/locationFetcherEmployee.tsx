// src/components/admin/AttendanceList.tsx
import React, { useEffect, useState, useRef } from "react";
import API from "../../api/axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { FaEye, FaSync, FaMapMarkerAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

interface Attendance {
  date: string;
  start_time: string;
  end_time: string;
  address: string;
  start_lat: string;
  start_lng: string;
  end_lat: string;
  end_lng: string;
  odometer_image: string;
  selfie_image: string;
  description: string;
  username: string;
  department: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    employee_code: string;
  };
}

interface LocationLog {
  id: number;
  latitude: string | number;
  longitude: string | number;
  timestamp: string;
  battery_level?: number | null;
  is_paused?: boolean;
  user?: number;
}

export default function AttendanceList() {
  const { t } = useTranslation();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [locations, setLocations] = useState<LocationLog[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [mapView, setMapView] = useState<Attendance | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");



   // 🆕 config state from backend
  const [config, setConfig] = useState({
    refresh_interval: 300, // fallback 5min
    pause_threshold: 2,  // fallback 2 min
    active: true,
  });

   useEffect(() => {
    fetchConfig();
    fetchData();
  }, []);

const fetchConfig = async () => {
    try {
      const res = await API.get("/location-log-config/");
      const cfg = res.data;
      setConfig({
        refresh_interval: cfg.refresh_interval || 5,
        pause_threshold: cfg.pause_threshold || 2,
        active: cfg.active,
      });
      console.log("⚙️ Config loaded:", cfg);
    } catch (err) {
      console.error("❌ Failed to fetch config", err);
    }
  };

  useEffect(() => {
    if (mapView) {
      fetchLocations(mapView.user.id, mapView.date);
      const isOngoing = !mapView.end_time || (!mapView.end_lat || !mapView.end_lng);
      if (isOngoing && autoRefresh) {
        console.log("🔄 Setting up auto-refresh for ongoing attendance");
        locationIntervalRef.current = setInterval(() => {
          fetchLocations(mapView.user.id, mapView.date);
        }, 5000); // Faster refresh for testing dummy data
      }
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [mapView, autoRefresh]);

  const fetchData = async () => {
    try {
      const [startRes, endRes] = await Promise.all([
        API.get("/attendance-start/"),
        API.get("/attendance-end/"),
      ]);

      const startData = startRes.data.results || [];
      const endData = endRes.data.results || [];

      const merged = startData.map((start: any) => {
        const startUserId = typeof start.user === 'object' ? start.user.id : start.user;

        const match = endData.find((end: any) => {
          const endUserId = typeof end.user === 'object' ? end.user.id : end.user;
          return endUserId === startUserId && end.date === start.date;
        });

        return {
          ...start,
          end_time: match?.end_time || "",
          end_lat: match?.end_lat || "",
          end_lng: match?.end_lng || "",
        };
      });

      setAttendances(merged);
      const uniqueDepts = Array.from(
        new Set(merged.map((a) => a.department?.trim()).filter(Boolean))
      );
      setDepartments(uniqueDepts);
    } catch (err) {
      console.error("Failed to fetch attendance data", err);
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };

 const fetchLocations = async (userId: number, date: string) => {
  setIsLoadingLocations(true);
  try {
    console.log(`🔍 Fetching locations for user ${userId} on ${date}`);
    let logs: LocationLog[] = [];

    // --- Try backend endpoint ---
    try {
      const res = await API.get(`/locations/?user=${userId}&date=${date}`);
      if (Array.isArray(res.data)) {
        logs = res.data;
      } else if (res.data.results) {
        logs = res.data.results;
      }
    } catch (err) {
      console.warn("Fallback to /locations/ all fetch");
      const res = await API.get("/locations/");
      const allLogs = res.data.results || res.data || [];
      logs = allLogs.filter((log: any) => {
        const logUserId = typeof log.user === "object" ? log.user.id : log.user;
        return logUserId === userId;
      });
    }

    // --- Normalize + filter ---
    if (mapView && logs.length > 0) {
      logs = filterAndSortLocations(logs, mapView);
    }

    console.log(`📍 Final location logs (${logs.length} points):`, logs);
    setLocations(logs);
    setLastUpdateTime(new Date());
  } catch (err) {
    console.error("❌ Failed to fetch location logs", err);
    setLocations([]);
  } finally {
    setIsLoadingLocations(false);
  }
};

const filterAndSortLocations = (locations: LocationLog[], attendance: Attendance): LocationLog[] => {
  if (!locations || locations.length === 0) return [];

  const validLogs = locations.filter(
    (log) => isValidCoordinate(log.latitude, log.longitude)
  );

  // normalize to YYYY-MM-DD (always UTC-safe)
  const attDate = new Date(attendance.date).toISOString().split("T")[0];

  const dateFilteredLogs = validLogs.filter((log) => {
    const logDate = new Date(log.timestamp).toISOString().split("T")[0];

    // ✅ Allow same date OR 1-day diff (timezone tolerance)
    const diffDays =
      Math.abs(
        (new Date(logDate).getTime() - new Date(attDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

    if (diffDays > 1) return false;

    // ✅ Time window check if available
    if (attendance.start_time && attendance.end_time) {
      const logTime = new Date(log.timestamp).getTime();
      const start = new Date(`${attendance.date}T${attendance.start_time}`).getTime() - 2 * 60 * 60 * 1000;
      const end = new Date(`${attendance.date}T${attendance.end_time}`).getTime() + 2 * 60 * 60 * 1000;
      return logTime >= start && logTime <= end;
    }

    return true;
  });

  // sort chronologically
  dateFilteredLogs.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  console.log(
    `✅ Filtered ${validLogs.length} → ${dateFilteredLogs.length} logs for ${attendance.date}`
  );
  return dateFilteredLogs;
};


  // Helper function to safely parse coordinates
  const parseCoordinate = (coord: string | number): number => {
    if (typeof coord === 'number') return coord;
    const parsed = parseFloat(coord);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to check if coordinates are valid
  const isValidCoordinate = (lat: string | number, lng: string | number): boolean => {
    const latNum = parseCoordinate(lat);
    const lngNum = parseCoordinate(lng);
    return latNum !== 0 && lngNum !== 0 && 
           Math.abs(latNum) <= 90 && Math.abs(lngNum) <= 180 &&
           !isNaN(latNum) && !isNaN(lngNum);
  };

  // Improved pause detection optimized for dummy data
  const detectPauses = (): LocationLog[] => {
    if (locations.length < 2) return [];
    
    const pauses: LocationLog[] = [];
    const PAUSE_THRESHOLD_MINUTES = 2; // Shorter threshold for dummy data
    
    for (let i = 1; i < locations.length; i++) {
      const prev = new Date(locations[i - 1].timestamp);
      const curr = new Date(locations[i].timestamp);
      const diffMinutes = (curr.getTime() - prev.getTime()) / 60000;
      
      // Mark as pause if gap is significant or explicitly marked as paused
      if (diffMinutes > PAUSE_THRESHOLD_MINUTES || locations[i].is_paused) {
        pauses.push(locations[i]);
      }
    }
    return pauses;
  };

  const openMap = (record: Attendance) => {
    console.log("🗺️ Opening map for:", record);
    setMapView(record);
    setLocations([]);
    setLastUpdateTime(null);
  };

  const closeMap = () => {
    setMapView(null);
    setLocations([]);
    setLastUpdateTime(null);
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const manualRefresh = () => {
    if (mapView) {
      fetchLocations(mapView.user.id, mapView.date);
    }
  };
const filteredData = attendances.filter((att) => {
  const matchDept = selectedDept
    ? att.department?.trim().toLowerCase() === selectedDept.toLowerCase()
    : true;

  const matchDate = selectedDate
    ? att.date === selectedDate
    : true;

  return matchDept && matchDate;
});


  // Enhanced polyline path building optimized for dummy data
  const buildPolylinePath = (): [number, number][] => {
    const path: [number, number][] = [];

    if (!mapView) return path;

    console.log("🛤️ Building polyline path...");

    // Start with the start coordinate if valid
    if (mapView.start_lat && mapView.start_lng && 
        isValidCoordinate(mapView.start_lat, mapView.start_lng)) {
      const startLat = parseCoordinate(mapView.start_lat);
      const startLng = parseCoordinate(mapView.start_lng);
      path.push([startLat, startLng]);
      console.log("📍 Added start point:", [startLat, startLng]);
    }

    // Add all valid location logs in chronological order
    locations.forEach((log, index) => {
      if (isValidCoordinate(log.latitude, log.longitude)) {
        const lat = parseCoordinate(log.latitude);
        const lng = parseCoordinate(log.longitude);
        path.push([lat, lng]);
        
        if (index < 5 || index % 10 === 0) { // Log first few and every 10th for debugging
          console.log(`📍 Added location log ${index + 1}/${locations.length}:`, [lat, lng]);
        }
      }
    });

    // Add end coordinate if attendance is completed and coordinates are valid
    if (mapView.end_time && mapView.end_lat && mapView.end_lng && 
        isValidCoordinate(mapView.end_lat, mapView.end_lng)) {
      const endLat = parseCoordinate(mapView.end_lat);
      const endLng = parseCoordinate(mapView.end_lng);
      
      // Only add end point if it's different from the last location log
      const lastPoint = path[path.length - 1];
      if (!lastPoint || 
          Math.abs(lastPoint[0] - endLat) > 0.0001 || 
          Math.abs(lastPoint[1] - endLng) > 0.0001) {
        path.push([endLat, endLng]);
        console.log("🏁 Added end point:", [endLat, endLng]);
      }
    }

    console.log(`🛤️ Complete polyline path: ${path.length} points`);
    return path;
  };

  // Calculate map center based on available coordinates
  const getMapCenter = (): [number, number] => {
    if (!mapView) return [21.1702, 72.8311]; 

    const allCoords: [number, number][] = [];

    // Add start coordinate
    if (isValidCoordinate(mapView.start_lat, mapView.start_lng)) {
      allCoords.push([parseCoordinate(mapView.start_lat), parseCoordinate(mapView.start_lng)]);
    }

    // Add location logs (sample a few for center calculation)
    const sampleSize = Math.min(locations.length, 20); // Don't use all points for center calculation
    const step = Math.max(1, Math.floor(locations.length / sampleSize));
    
    for (let i = 0; i < locations.length; i += step) {
      const log = locations[i];
      if (isValidCoordinate(log.latitude, log.longitude)) {
        allCoords.push([parseCoordinate(log.latitude), parseCoordinate(log.longitude)]);
      }
    }

    // Add end coordinate
    if (mapView.end_lat && mapView.end_lng && isValidCoordinate(mapView.end_lat, mapView.end_lng)) {
      allCoords.push([parseCoordinate(mapView.end_lat), parseCoordinate(mapView.end_lng)]);
    }

    if (allCoords.length === 0) {
      // Fallback to start coordinates or default
      return [
        parseCoordinate(mapView.start_lat) || 21.1702, 
        parseCoordinate(mapView.start_lng) || 72.8311
      ];
    }

    // Calculate center point
    const avgLat = allCoords.reduce((sum, coord) => sum + coord[0], 0) / allCoords.length;
    const avgLng = allCoords.reduce((sum, coord) => sum + coord[1], 0) / allCoords.length;

    console.log(`🎯 Map center calculated from ${allCoords.length} points:`, [avgLat, avgLng]);
    return [avgLat, avgLng];
  };

  // Calculate appropriate zoom level based on data spread
  const getMapZoom = (): number => {
    if (!mapView || locations.length < 2) return 15;

    const coords = locations
      .filter(log => isValidCoordinate(log.latitude, log.longitude))
      .map(log => [parseCoordinate(log.latitude), parseCoordinate(log.longitude)]);

    if (coords.length < 2) return 15;

    // Calculate bounds
    const lats = coords.map(coord => coord[0]);
    const lngs = coords.map(coord => coord[1]);
    
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRange = Math.max(latRange, lngRange);

    // Determine zoom based on coordinate spread
    if (maxRange > 0.1) return 10;      // Very spread out
    if (maxRange > 0.05) return 12;     // Spread out
    if (maxRange > 0.01) return 14;     // Moderate spread
    if (maxRange > 0.005) return 15;    // Close together
    return 16;                          // Very close together
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md dark:bg-black dark:text-white">
      <h2 className="text-2xl flex justify-center text-center font-bold mb-4 p-3 lg:border-b">{t("location.📊 Employee Attendance Records")}</h2>
      <div className="grid grid-cols-2 space-y-2 gap-5">
                    <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700 dark:text-white">
             {t("location.Filter by Date")}:
            </label>
            
          <input
  type="date"
  className="border border-gray-300 p-2 rounded-md w-full sm:w-64 dark:bg-gray-800 dark:text-black"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
  onFocus={(e) => {
    // Open calendar when the input gets focus
    if (e.target.showPicker) {
      e.target.showPicker();
    }
  }}
  onClick={(e) => {
    // Fallback: also trigger on click (some browsers need this)
    if (e.target.showPicker) {
      e.target.showPicker();
    }
  }}
  max={new Date().toISOString().split("T")[0]}
/>
     
          </div>


      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-700">
         {t("location.Filter by Department:")}
        </label>
        <select
          className="border border-gray-300 p-2 rounded-md w-full sm:w-64"
          onChange={(e) => setSelectedDept(e.target.value)}
          value={selectedDept}
        >
          <option value="">{t("location.Filter by Department")}:</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>
      </div>

      <div className="overflow-auto  border border-gray-300 rounded-md shadow-inner">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{t("location.Sr.no")}</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{t("location.Name")}</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{t("location.Employee Code")}</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{t("location.Date")}</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{t("location.Department")}</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{t("location.Start Time")}</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{t("location.End Time")}</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{t("location.Address")}</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{t("location.Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={item.user.id + "-" + item.date} className="hover:bg-green-500 transition-colors ">
                <td className="px-4 py-2">{idx + 1}</td>
                <td className="px-4 py-2">
                  {item.user.first_name} {item.user.last_name}
                </td>
                <td className="px-4 py-2">{item.user.employee_code}</td>
                <td className="px-4 py-2">{item.date}</td>
                <td className="px-4 py-2">{item.department}</td>
                <td className="px-4 py-2">{formatTime(item.start_time)}</td>
                <td className="px-4 py-2">
                  {formatTime(item.end_time) || (
                    <span className="text-green-600 font-medium">● Active</span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs max-w-32 truncate" title={item.address}>
                  {item.address}
                </td>
                <td className="px-4 py-2">
                  <button
                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                    onClick={() => openMap(item)}
                    title="View location tracking"
                  >
                    <FaMapMarkerAlt size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mapView && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-transparent w-full h-full relative">
            <button
              onClick={closeMap}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg z-[999] shadow-lg"
            >
              ✕ Close Map
            </button>

            {/* Enhanced map info panel with controls */}
            <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[999] max-w-sm">
              <h3 className="font-bold text-sm mb-2">
                📍 {mapView.user.first_name} {mapView.user.last_name}
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>📅 Date: {mapView.date}</p>
                <p>🕐 Start: {formatTime(mapView.start_time)}</p>
                {mapView.end_time && <p>🕐 End: {formatTime(mapView.end_time)}</p>}
                <p>📍 Location logs: <span className="font-semibold">{locations.length}</span> points</p>
                {lastUpdateTime && (
                  <p>🔄 Last update: {lastUpdateTime.toLocaleTimeString()}</p>
                )}
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center gap-2 mt-2 text-xs">
                {!mapView.end_time && (
                  <span className="text-green-600 font-medium">● Live tracking</span>
                )}
                {isLoadingLocations && (
                  <span className="text-blue-600">🔄 Updating...</span>
                )}
                {detectPauses().length > 0 && (
                  <span className="text-orange-600">⏸️ {detectPauses().length} pause(s)</span>
                )}
              </div>

              {/* Control buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={manualRefresh}
                  disabled={isLoadingLocations}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  <FaSync className={isLoadingLocations ? "animate-spin" : ""} />
                  Refresh
                </button>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-2 py-1 text-xs rounded ${
                    autoRefresh 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  Auto: {autoRefresh ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <MapContainer
              center={getMapCenter()}
              zoom={getMapZoom()}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
              key={`map-${mapView.user.id}-${mapView.date}-${locations.length}`}
            >
              <TileLayer
                attribution="Google Maps"
                url="https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}"
              />

              {/* Enhanced Polyline with better styling for dummy data */}
              {(() => {
                const path = buildPolylinePath();
                if (path.length >= 2) {
                  return (
                    <Polyline
                      positions={path}
                      pathOptions={{ 
                        color: mapView.end_time ? "#3B82F6" : "#10B981", // Blue for completed, green for ongoing
                        weight: 3, 
                        opacity: 0.8,
                        lineCap: "round",
                        lineJoin: "round",
                        dashArray: mapView.end_time ? undefined : "10, 5" // Dashed line for ongoing
                      }}
                    />
                  );
                }
                return null;
              })()}

              {/* Start Marker */}
              {isValidCoordinate(mapView.start_lat, mapView.start_lng) && (
                <Marker
                  position={[
                    parseCoordinate(mapView.start_lat),
                    parseCoordinate(mapView.start_lng),
                  ]}
                  icon={L.icon({
                    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
                    shadowUrl,
                    iconAnchor: [12, 41], 
                    iconSize: [25, 41],
                  })}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>🟢 Start Location</strong><br />
                      <strong>Employee:</strong> {mapView.user.first_name} {mapView.user.last_name}<br />
                      <strong>Time:</strong> {formatTime(mapView.start_time)}<br />
                      <strong>Coordinates:</strong> {parseCoordinate(mapView.start_lat).toFixed(5)}, {parseCoordinate(mapView.start_lng).toFixed(5)}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Location Log Markers - Optimized for dummy data visualization */}
              {locations.length > 0 && locations.length <= 100 && // Show individual markers for reasonable number of points
                locations.map((log, i) => {
                  if (!isValidCoordinate(log.latitude, log.longitude)) return null;

                  const lat = parseCoordinate(log.latitude);
                  const lng = parseCoordinate(log.longitude);
                  const isPaused = log.is_paused || false;

                  // Show every 3rd location log for dummy data (more frequent than real data)
                  if (i % 3 !== 0 && !isPaused) return null;

                  return (
                    <Marker
                      key={`log-${log.id || i}`}
                      position={[lat, lng]}
                      icon={L.icon({
                        iconUrl: isPaused 
                          ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png"
                          : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
                        shadowUrl,
                        iconAnchor: [12, 41], 
                        iconSize: [15, 24], // Slightly larger for better visibility
                      })}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>{isPaused ? '⏸️ Paused Location' : '🔵 Location Log'}</strong><br />
                          <strong>Time:</strong> {new Date(log.timestamp).toLocaleTimeString()}<br />
                          <strong>Date:</strong> {new Date(log.timestamp).toLocaleDateString()}<br />
                          <strong>Coordinates:</strong> {lat.toFixed(5)}, {lng.toFixed(5)}<br />
                          <strong>Log ID:</strong> {log.id}<br />
                          {log.battery_level && <><strong>Battery:</strong> {log.battery_level}%<br /></>}
                          {isPaused && <span style={{color: 'orange'}}><strong>Status:</strong> Paused</span>}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* Current Location Marker for ongoing attendance */}
              {!mapView.end_time && locations.length > 0 && (() => {
                const lastLocation = locations[locations.length - 1];
                if (isValidCoordinate(lastLocation.latitude, lastLocation.longitude)) {
                  const lat = parseCoordinate(lastLocation.latitude);
                  const lng = parseCoordinate(lastLocation.longitude);
                  
                  return (
                    <Marker
                      position={[lat, lng]}
                      icon={L.icon({
                        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
                        shadowUrl,
                        iconAnchor: [12, 41], 
                        iconSize: [30, 48], // Larger for current position
                      })}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>📍 Current Position</strong><br />
                          <strong>Employee:</strong> {mapView.user.first_name} {mapView.user.last_name}<br />
                          <strong>Last Update:</strong> {new Date(lastLocation.timestamp).toLocaleTimeString()}<br />
                          <strong>Coordinates:</strong> {lat.toFixed(5)}, {lng.toFixed(5)}<br />
                          <strong>Status:</strong> <span className="text-green-600">● Active</span>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })()}

              {/* Pause Markers - Enhanced for dummy data */}
              {detectPauses().map((log, i) => {
                if (!isValidCoordinate(log.latitude, log.longitude)) return null;
                
                const lat = parseCoordinate(log.latitude);
                const lng = parseCoordinate(log.longitude);

                return (
                  <Marker
                    key={`pause-${log.id || i}`}
                    position={[lat, lng]}
                    icon={L.icon({
                      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
                      shadowUrl,
                      iconAnchor: [12, 41], 
                      iconSize: [20, 32],
                    })}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>⏱️ Extended Pause</strong><br />
                        <strong>Paused at:</strong> {new Date(log.timestamp).toLocaleTimeString()}<br />
                        <strong>Date:</strong> {new Date(log.timestamp).toLocaleDateString()}<br />
                        <strong>Coordinates:</strong> {lat.toFixed(5)}, {lng.toFixed(5)}<br />
                        <strong>Reason:</strong> Gap in location tracking
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
             
              <div>

              {isValidCoordinate(mapView.end_lat, mapView.end_lng) && (
                <Marker
                  position={[
                    parseCoordinate(mapView.end_lat),
                    parseCoordinate(mapView.end_lng),
                  ]}
                  icon={L.icon({
                    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
                    shadowUrl,
                    iconAnchor: [12, 41], 
                    iconSize: [25, 41],
                  })}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>end Location</strong><br />
                      <strong>Employee:</strong> {mapView.user.first_name} {mapView.user.last_name}<br />
                      <strong>Time:</strong> {formatTime(mapView.end_time)}<br />
                      <strong>Coordinates:</strong> {parseCoordinate(mapView.end_lat).toFixed(5)}, {parseCoordinate(mapView.end_lng).toFixed(5)}
                    </div>
                  </Popup>
                </Marker>
              )}
            </div>
              {/* Summary overlay for dense data */}
              {locations.length > 100 && (
                <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded-lg text-sm z-[999]">
                  ⚠️ High density data ({locations.length} points) - Individual markers hidden for performance
                </div>
              )}
            </MapContainer>

            {/* Debug panel for development (remove in production) */}
            {process.env.NODE_ENV === 'development' && mapView && (
              <div className="absolute bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs z-[999] max-w-xs">
                <h4 className="font-bold mb-1">🔧 Debug Info</h4>
                <p>Total Locations: {locations.length}</p>
                <p>Map Center: {getMapCenter().map(c => c.toFixed(4)).join(', ')}</p>
                <p>Zoom Level: {getMapZoom()}</p>
                <p>Polyline Points: {buildPolylinePath().length}</p>
                <p>Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}</p>
                {lastUpdateTime && (
                  <p>Last Update: {lastUpdateTime.toLocaleTimeString()}</p>
                )}
              </div>
            )}

           
          </div>
        </div>
      )}
    </div>
  );
}