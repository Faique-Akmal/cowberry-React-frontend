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
import { FaSync, FaMapMarkerAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

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

  department: string;
  user: {
    id: number;
    first_name: string;
      username: string;
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
  user?: number | { id: number };
} 
interface PauseInterval {
  start: LocationLog;
  end: LocationLog;
  durationMinutes: number;
}

/**
 * Local cache version key for localStorage - bump this if you change the shape
 */
const LOCAL_CACHE_KEY = "locCache_v1";

export default function AttendanceList() {
  const { t } = useTranslation();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  // Per user+date cache: key format `${userId}-${date}`
  const [locationsMap, setLocationsMap] = useState<Record<string, LocationLog[]>>({});
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [mapView, setMapView] = useState<Attendance | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
 const { themeConfig } = useTheme();
  // config state from backend
  const [config, setConfig] = useState({
    // refresh_interval: 300, // seconds fallback
    // pause_threshold: 2, // minutes fallback
    // active: true,
  });

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setLocationsMap(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load location cache", e);
    }
  }, []);

  // Persist map to localStorage on change (throttle could be added)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(locationsMap));
    } catch (e) {
      console.warn("Failed to save location cache", e);
    }
  }, [locationsMap]);

  useEffect(() => {
    fetchConfig();
    fetchData();
  }, []);

   const fetchConfig = async () => {
    try {
      const res = await API.get("/location-log-config"); 
      // assume API returns an array, pick the active one
      const activeConfig = Array.isArray(res.data)
        ? res.data.find((c) => c.active)
        : res.data;
      setConfig(activeConfig);
    } catch (err) {
      console.error("Failed to fetch config:", err);
    }
  };

  useEffect(() => {
    if (mapView) {
      // Immediately show cached logs (if present), then fetch latest
      const key = cacheKey(mapView.user.id, mapView.date);
      const cached = locationsMap[key];
      if (cached && cached.length > 0) {
        setLastUpdateTime(new Date()); // indicate we have something
      }
      fetchLocations(mapView.user.id, mapView.date);

      const isOngoing = !mapView.end_time || (!mapView.end_lat || !mapView.end_lng);
      if (isOngoing && autoRefresh) {
        console.log("🔄 Setting up auto-refresh for ongoing attendance");
        // use configured refresh_interval (in seconds)
        const ms = (config.refresh_interval || 300) * 1000;
        locationIntervalRef.current = setInterval(() => {
          fetchLocations(mapView.user.id, mapView.date);
        }, Math.max(5000, ms)); // never lower than 5s for safety
      }
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapView, autoRefresh, config.refresh_interval]); 

  const fetchData = async () => {
  try {
    // ✅ Fetch all pages for both start and end
    const [startData, endData] = await Promise.all([
      fetchAllPages("/attendance-start/"),
      fetchAllPages("/attendance-end/"),
    ]);

    // ✅ Merge start + end data by user & date
    const merged = startData.map((start: any) => {
      const startUserId = typeof start.user === "object" ? start.user.id : start.user;

      const match = endData.find((end: any) => {
        const endUserId = typeof end.user === "object" ? end.user.id : end.user;
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

    // ✅ Extract unique departments
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

  // Helper key generator
  const cacheKey = (userId: number, date: string) => `${userId}-${date}`;

  // Fetch locations and store into locationsMap keyed by user+date
const fetchLocations = async (userId: number, date: string) => {
  setIsLoadingLocations(true);
  try {
    console.log(`🔍 Fetching locations for user ${userId} on ${date}`);

    // ✅ Fetch all pages, not just page 1
    const allLogs: LocationLog[] = await fetchAllPages(`/locations/?user=${userId}&date=${date}`);

    // Normalize user id
    const normalizedLogs = allLogs.map((log) => ({
      ...log,
      user: typeof log.user === "object" ? log.user.id : log.user,
    }));

    // Filter by correct user/date and sort
    const filtered = normalizedLogs
      .filter((log) => {
        const logUserId = log.user as number;
        if (logUserId !== userId) return false;

        try {
          const logDate = new Date(log.timestamp).toISOString().split("T")[0];
          const targetDate = new Date(date).toISOString().split("T")[0];
          return logDate === targetDate;
        } catch {
          return false;
        }
      })
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    console.log(`📍 Final location logs (${filtered.length} points) for ${userId}-${date}`);

    // Save in state
    setLocationsMap((prev) => {
      const key = cacheKey(userId, date);
      const existing = prev[key] || [];
      const newVal = filtered.length >= existing.length ? filtered : mergeLogs(existing, filtered);
      return { ...prev, [key]: newVal };
    });

    setLastUpdateTime(new Date());
  } catch (err) {
    console.error("❌ Failed to fetch location logs", err);
  } finally {
    setIsLoadingLocations(false);
  }
};


  // mergeLogs: merges two arrays of logs deduping by id and keeping chronological order
  const mergeLogs = (a: LocationLog[], b: LocationLog[]): LocationLog[] => {
    const byId = new Map<number | string, LocationLog>();
    [...a, ...b].forEach((l) => {
      if (l && (l as any).id != null) byId.set((l as any).id, l);
      else byId.set(JSON.stringify([l.latitude, l.longitude, l.timestamp]), l);
    });
    const merged = Array.from(byId.values()).sort((x, y) => new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime());
    return merged;
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

      // Allow same date OR 1-day diff (timezone tolerance)
      const diffDays =
        Math.abs(
          (new Date(logDate).getTime() - new Date(attDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );

      if (diffDays > 1) return false;

      // Time window check if available (with 2-hour buffer)
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

  // Helper parse/validate functions

  const fetchAllPages = async (url: string, acc: any[] = []): Promise<any[]> => {
  try {
    const res = await API.get(url);
    const results: any[] = res.data.results || res.data;
    const combined = [...acc, ...results];

    if (res.data.next) {
      return fetchAllPages(res.data.next, combined);
    }

    return combined;
  } catch (err) {
    console.error("Error fetching paginated data:", err);
    return acc;
  }
};


  const parseCoordinate = (coord: string | number): number => {
    if (typeof coord === "number") return coord;
    const parsed = parseFloat(String(coord));
    return isNaN(parsed) ? 0 : parsed;
  };
  

  const isValidCoordinate = (lat: string | number, lng: string | number): boolean => {
    const latNum = parseCoordinate(lat);
    const lngNum = parseCoordinate(lng);
    return latNum !== 0 && lngNum !== 0 &&
      Math.abs(latNum) <= 90 && Math.abs(lngNum) <= 180 &&
      !isNaN(latNum) && !isNaN(lngNum);
  };

  // detectPauses for given logs
const detectPausesFor = (logs: LocationLog[], pauseThresholdSec: number): PauseInterval[] => {
  if (!logs || logs.length < 2) return [];

  const pauses: PauseInterval[] = [];
  const PAUSE_THRESHOLD_MINUTES = pauseThresholdSec / 60;

  for (let i = 1; i < logs.length; i++) {
    const prev = new Date(logs[i - 1].timestamp);
    const curr = new Date(logs[i].timestamp);
    const diffMinutes = (curr.getTime() - prev.getTime()) / 60000;

    if (diffMinutes > PAUSE_THRESHOLD_MINUTES || logs[i].is_paused) {
      pauses.push({
        start: logs[i - 1],
        end: logs[i],
        durationMinutes: diffMinutes,
      });
    }
  }

  return pauses;
};

  const openMap = (record: Attendance) => {
    console.log("🗺️ Opening map for:", record);
    setMapView(record);
    setLastUpdateTime(null);

    // Load cached logs if any (we keep other users' logs intact)
    const key = cacheKey(record.user.id, record.date);
    if (!locationsMap[key]) {
      // optimistic: try load from localStorage (already loaded into locationsMap on mount)
      // but also fetch fresh
      fetchLocations(record.user.id, record.date);
    } else {
      // update lastUpdateTime to show there's cached data
      setLastUpdateTime(new Date());
    }
  };

  const closeMap = () => {
    setMapView(null);
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

  // Build polyline path for a specific attendance (uses that attendance's cached logs)
  const buildPolylinePath = (attendance: Attendance): [number, number][] => {
    const path: [number, number][] = [];
    if (!attendance) return path;

    const key = cacheKey(attendance.user.id, attendance.date);
    const logs = locationsMap[key] || [];

    // Start coordinate
    if (attendance.start_lat && attendance.start_lng &&
      isValidCoordinate(attendance.start_lat, attendance.start_lng)) {
      path.push([parseCoordinate(attendance.start_lat), parseCoordinate(attendance.start_lng)]);
    }

    logs.forEach((log) => {
      if (isValidCoordinate(log.latitude, log.longitude)) {
        path.push([parseCoordinate(log.latitude), parseCoordinate(log.longitude)]);
      }
    });

    // End coordinate if completed (and not duplicate)
    if (attendance.end_time && attendance.end_lat && attendance.end_lng &&
      isValidCoordinate(attendance.end_lat, attendance.end_lng)) {
      const endLat = parseCoordinate(attendance.end_lat);
      const endLng = parseCoordinate(attendance.end_lng);
      const lastPoint = path[path.length - 1];
      if (!lastPoint || Math.abs(lastPoint[0] - endLat) > 0.0001 || Math.abs(lastPoint[1] - endLng) > 0.0001) {
        path.push([endLat, endLng]);
      }
    }

    return path;
  };

  const getMapCenter = (attendance: Attendance): [number, number] => {
    if (!attendance) return [21.1702, 72.8311];

    const allCoords: [number, number][] = [];

    // start
    if (isValidCoordinate(attendance.start_lat, attendance.start_lng)) {
      allCoords.push([parseCoordinate(attendance.start_lat), parseCoordinate(attendance.start_lng)]);
    }

    const key = cacheKey(attendance.user.id, attendance.date);
    const logs = locationsMap[key] || [];

    // sample up to 20 points to calculate center
    const sampleSize = Math.min(logs.length, 20);
    const step = Math.max(1, Math.floor(logs.length / Math.max(1, sampleSize)));
    for (let i = 0; i < logs.length; i += step) {
      const log = logs[i];
      if (isValidCoordinate(log.latitude, log.longitude)) {
        allCoords.push([parseCoordinate(log.latitude), parseCoordinate(log.longitude)]);
      }
    }

    // end
    if (attendance.end_lat && attendance.end_lng && isValidCoordinate(attendance.end_lat, attendance.end_lng)) {
      allCoords.push([parseCoordinate(attendance.end_lat), parseCoordinate(attendance.end_lng)]);
    }

    if (allCoords.length === 0) {
      return [
        parseCoordinate(attendance.start_lat) || 21.1702,
        parseCoordinate(attendance.start_lng) || 72.8311,
      ];
    }

    const avgLat = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length;
    const avgLng = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length;
    return [avgLat, avgLng];
  };

  const getMapZoom = (attendance: Attendance): number => {
    if (!attendance) return 15;
    const key = cacheKey(attendance.user.id, attendance.date);
    const logs = locationsMap[key] || [];

    if (logs.length < 2) return 15;

    const coords = logs
      .filter((log) => isValidCoordinate(log.latitude, log.longitude))
      .map((log) => [parseCoordinate(log.latitude), parseCoordinate(log.longitude)]) as [number, number][];

    if (coords.length < 2) return 15;

    const lats = coords.map((c) => c[0]);
    const lngs = coords.map((c) => c[1]);

    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRange = Math.max(latRange, lngRange);

    if (maxRange > 0.1) return 10;
    if (maxRange > 0.05) return 12;
    if (maxRange > 0.01) return 14;
    if (maxRange > 0.005) return 15;
    return 16;
  };

  // Helpers to get logs for current mapView
  const currentKey = mapView ? cacheKey(mapView.user.id, mapView.date) : null;
  const currentLogs = currentKey ? locationsMap[currentKey] || [] : [];
  const currentPauses = detectPausesFor(currentLogs);

  return (
    <div   
       
       style={{
        backgroundColor: themeConfig.content.background,
        color: themeConfig.content.text,
      }} 
    className="p-4 bg-white rounded-xl shadow-md dark:bg-black dark:text-white">
      <h2 className="text-2xl flex justify-center text-center font-bold mb-4 p-3 lg:border-b">{t("location.📊 Employee Attendance Records")}</h2>
      <div className="grid grid-cols-2 space-y-2 gap-5">
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-white">
            {t("location.Filter by Date")}:
          </label>
          <input
            type="date"
            className="border border-gray-300 p-2 rounded-md w-full sm:w-64 dark:bg-gray-800 dark:text-white"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="mt-4">
          <label className="block mb-1 font-medium text-gray-700">
            {t("location.Filter by Department:")}
          </label>
          <select
            className="border border-gray-300 p-2 rounded-md w-full sm:w-64 dark:bg-black dark:text-white"
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

      <div className="overflow-auto  border border-gray-300 rounded-md shadow-inner mt-4">
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
                  {item.user.username}
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

            {/* Info panel */}
            <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[999] max-w-sm">
              <h3 className="font-bold text-sm mb-2">
                📍 {mapView.user.first_name} {mapView.user.last_name}
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>📅 Date: {mapView.date}</p>
                <p>🕐 Start: {formatTime(mapView.start_time)}</p>
                {mapView.end_time && <p>🕐 End: {formatTime(mapView.end_time)}</p>}
                <p>📍 Location logs: <span className="font-semibold">{currentLogs.length}</span> points</p>
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
                {currentPauses.length > 0 && (
                  <span className="text-orange-600">⏸️ {currentPauses.length} pause(s)</span>
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
                  className={`px-2 py-1 text-xs rounded ${autoRefresh ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
                >
                  Auto: {autoRefresh ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <MapContainer
              center={getMapCenter(mapView)}
              zoom={getMapZoom(mapView)}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
              key={`map-${mapView.user.id}-${mapView.date}-${currentLogs.length}`}
            >
              <TileLayer
                attribution="Google Maps"
                url="https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}"
              />

              {/* Polyline for this attendance (only this user/date) */}
              {(() => {
                const path = buildPolylinePath(mapView);
                if (path.length >= 2) {
                  return (
                    <Polyline
                      positions={path}
                      pathOptions={{
                        color: mapView.end_time ? "#3B82F6" : "#10B981",
                        weight: 8,
                        opacity: 0.8,
                        lineCap: "round",
                        lineJoin: "round",
                        dashArray: mapView.end_time ? undefined : "10, 5"
                      }}
                    />
                  );
                }
                return null;
              })()}

              {/* Start marker */}
              {isValidCoordinate(mapView.start_lat, mapView.start_lng) && (
                <Marker
                  position={[parseCoordinate(mapView.start_lat), parseCoordinate(mapView.start_lng)]}
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
                      {/* <strong>Coordinates:</strong> {parseCoordinate(mapView.start_lat).toFixed(5)}, {parseCoordinate(mapView.start_lng).toFixed(5)} */}
                        <p>Address: {mapView.address}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Markers for location logs (throttled for performance) */}
              {currentLogs.length > 0 && currentLogs.length <= 100 &&
                currentLogs.map((log, i) => {
                  if (!isValidCoordinate(log.latitude, log.longitude)) return null;
                  const lat = parseCoordinate(log.latitude);
                  const lng = parseCoordinate(log.longitude);
                  const isPaused = log.is_paused || false;
                  if (i % 3 !== 0 && !isPaused) return null;

                  return (
                    <Marker
                      key={`log-${log.id || i}`}
                      position={[lat, lng]}
                      icon={L.icon({
                        iconUrl: isPaused ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png" : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
                        shadowUrl,
                        iconAnchor: [12, 41],
                        iconSize: [15, 24],
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
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* Current position marker for ongoing attendance */}
              {!mapView.end_time && currentLogs.length > 0 && (() => {
                const lastLocation = currentLogs[currentLogs.length - 1];
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
                        iconSize: [30, 48],
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

           {/* Pause markers */}
{currentPauses.map((pause, i) => {
  if (!isValidCoordinate(pause.start.latitude, pause.start.longitude)) return null;

  const lat = parseCoordinate(pause.start.latitude);
  const lng = parseCoordinate(pause.start.longitude);

  return (
    <Marker
      key={`pause-${pause.start.id || i}`}
      position={[lat, lng]}
      icon={L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
        shadowUrl,
        iconAnchor: [12, 41],
        iconSize: [20, 32],
      })}
    >
      <Popup>
        <div className="text-sm">
          <strong>⏱️ Pause Detected</strong>
          <br />
          <strong>Start:</strong>{" "}
          {new Date(pause.start.timestamp).toLocaleTimeString()}
          <br />
          <strong>End:</strong>{" "}
          {new Date(pause.end.timestamp).toLocaleTimeString()}
          <br />
          <strong>Duration:</strong>{" "}
          {pause.durationMinutes.toFixed(1)} minutes
          <br />
          <strong>Coordinates:</strong> {lat.toFixed(5)}, {lng.toFixed(5)}
        </div>
      </Popup>
    </Marker>
  );
})}

              {/* End marker */}
              {isValidCoordinate(mapView.end_lat, mapView.end_lng) && (
                <Marker
                  position={[parseCoordinate(mapView.end_lat), parseCoordinate(mapView.end_lng)]}
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

              {/* High density overlay */}
              {/* {currentLogs.length > 100 && (
                <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded-lg text-sm z-[999]">
                  ⚠️ High density data ({currentLogs.length} points) - Individual markers hidden for performance
                </div>
              )} */}
            </MapContainer>

            {/* Debug panel */}
            {process.env.NODE_ENV === 'development' && mapView && (
              <div className="absolute bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs z-[999] max-w-xs">
                <h4 className="font-bold mb-1">🔧 Debug Info</h4>
                <p>Total Locations (this view): {currentLogs.length}</p>
                <p>Map Center: {getMapCenter(mapView).map(c => c.toFixed(4)).join(', ')}</p>
                <p>Zoom Level: {getMapZoom(mapView)}</p>
                <p>Polyline Points: {buildPolylinePath(mapView).length}</p>
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
