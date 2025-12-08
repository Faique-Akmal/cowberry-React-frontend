// src/components/admin/TravelSessions.tsx
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
import { 
  FaSync, 
  FaMapMarkerAlt, 
  FaUser, 
  FaRoute, 
  FaCalendarAlt,
  FaClock,
  FaRoad,
  FaPlayCircle,
  FaStopCircle,
  FaPauseCircle,
  FaMapPin,
  FaSearch,
  FaFilter,
  FaEye,
  FaListAlt
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// Interface for Travel Sessions API response
interface TravelSession {
  sessionId: number;
  userId: number;
  username: string;
  employeeCode: string;
  startTime: string;
  startLatitude: string;
  startLongitude: string;
  endTime: string;
  endLatitude: string;
  endLongitude: string;
  totalDistance: number;
  logs: LocationLog[];
}

interface LocationLog {
  id: number;
  timestamp: string;
  latitude: string;
  longitude: string;
  battery: number;
  speed: number;
  pause: boolean;
}

interface PauseInterval {
  start: LocationLog;
  end: LocationLog;
  durationMinutes: number;
}

const LOCAL_CACHE_KEY = "travelSessionsCache_v1";

export default function AttendanceList() {
  const { t } = useTranslation();
  const { themeConfig } = useTheme();
  const [travelSessions, setTravelSessions] = useState<TravelSession[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, TravelSession>>({});
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [mapView, setMapView] = useState<TravelSession | null>(null);
  const [users, setUsers] = useState<{ userId: number; username: string; employeeCode: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setSessionsMap(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load travel sessions cache", e);
    }
  }, []);

  // Persist map to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(sessionsMap));
    } catch (e) {
      console.warn("Failed to save travel sessions cache", e);
    }
  }, [sessionsMap]);

  useEffect(() => {
    fetchTravelSessions();
  }, []);

  useEffect(() => {
    if (mapView && autoRefresh) {
      const isOngoing = !mapView.endTime || mapView.endTime === mapView.startTime;
      
      if (isOngoing) {
        console.log("🔄 Setting up auto-refresh for ongoing session");
        locationIntervalRef.current = setInterval(() => {
          fetchTravelSessions();
        }, 10000); // Refresh every 10 seconds for ongoing sessions
      }
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [mapView, autoRefresh]);

  const fetchTravelSessions = async () => {
    setIsLoading(true);
    try {
      const res = await API.get("/admin/travel-sessions");
      if (res.data.success) {
        const sessions = res.data.data || [];
        setTravelSessions(sessions);
        
        // Extract unique users
        const uniqueUsers = Array.from(
          new Map(
            sessions.map(session => [
              session.userId,
              { userId: session.userId, username: session.username, employeeCode: session.employeeCode }
            ])
          ).values()
        );
        setUsers(uniqueUsers);
        
        // Update cache
        const newCache: Record<string, TravelSession> = {};
        sessions.forEach(session => {
          const key = `${session.userId}-${session.sessionId}`;
          newCache[key] = session;
        });
        setSessionsMap(prev => ({ ...prev, ...newCache }));
        
        setLastUpdateTime(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch travel sessions", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return "-";
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  const formatTimeOnly = (dateTimeStr: string) => {
    if (!dateTimeStr) return "-";
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateOnly = (dateTimeStr: string) => {
    if (!dateTimeStr) return "-";
    const date = new Date(dateTimeStr);
    return date.toISOString().split('T')[0];
  };

  const formatShortDate = (dateTimeStr: string) => {
    if (!dateTimeStr) return "-";
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const buildPolylinePath = (session: TravelSession): [number, number][] => {
    const path: [number, number][] = [];
    
    if (!session || !session.logs || session.logs.length === 0) return path;
    
    // Add all log points
    session.logs.forEach(log => {
      if (isValidCoordinate(log.latitude, log.longitude)) {
        path.push([parseCoordinate(log.latitude), parseCoordinate(log.longitude)]);
      }
    });
    
    return path;
  };

  const getMapCenter = (session: TravelSession): [number, number] => {
    if (!session || !session.logs || session.logs.length === 0) {
      return [21.1702, 72.8311]; // Default center
    }
    
    const validLogs = session.logs.filter(log => 
      isValidCoordinate(log.latitude, log.longitude)
    );
    
    if (validLogs.length === 0) return [21.1702, 72.8311];
    
    // Calculate average of all points
    const sumLat = validLogs.reduce((sum, log) => sum + parseCoordinate(log.latitude), 0);
    const sumLng = validLogs.reduce((sum, log) => sum + parseCoordinate(log.longitude), 0);
    
    return [sumLat / validLogs.length, sumLng / validLogs.length];
  };

  const getMapZoom = (session: TravelSession): number => {
    if (!session || !session.logs || session.logs.length < 2) return 15;
    
    const validLogs = session.logs.filter(log => 
      isValidCoordinate(log.latitude, log.longitude)
    );
    
    if (validLogs.length < 2) return 15;
    
    const lats = validLogs.map(log => parseCoordinate(log.latitude));
    const lngs = validLogs.map(log => parseCoordinate(log.longitude));
    
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRange = Math.max(latRange, lngRange);
    
    if (maxRange > 0.1) return 10;
    if (maxRange > 0.05) return 12;
    if (maxRange > 0.01) return 14;
    if (maxRange > 0.005) return 15;
    return 16;
  };

  const detectPauses = (logs: LocationLog[], pauseThresholdMinutes: number = 2): PauseInterval[] => {
    if (!logs || logs.length < 2) return [];
    
    const pauses: PauseInterval[] = [];
    
    for (let i = 1; i < logs.length; i++) {
      const prev = new Date(logs[i - 1].timestamp);
      const curr = new Date(logs[i].timestamp);
      const diffMinutes = (curr.getTime() - prev.getTime()) / 60000;
      
      if (diffMinutes > pauseThresholdMinutes || logs[i].pause) {
        pauses.push({
          start: logs[i - 1],
          end: logs[i],
          durationMinutes: diffMinutes,
        });
      }
    }
    
    return pauses;
  };

  const openMap = (session: TravelSession) => {
    console.log("🗺️ Opening map for session:", session.sessionId);
    setMapView(session);
    setLastUpdateTime(new Date());
  };

  const closeMap = () => {
    setMapView(null);
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const manualRefresh = () => {
    fetchTravelSessions();
  };

  const filterSessions = () => {
    let filtered = travelSessions;
    
    if (selectedDate) {
      filtered = filtered.filter(session => 
        formatDateOnly(session.startTime) === selectedDate
      );
    }
    
    if (selectedUser) {
      filtered = filtered.filter(session => 
        session.userId.toString() === selectedUser
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.username.toLowerCase().includes(query) ||
        session.employeeCode.toLowerCase().includes(query)
      );
    }
    
    // Sort by start time (newest first)
    return filtered.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  };

  const filteredSessions = filterSessions();

  // Calculate stats
  const totalSessions = filteredSessions.length;
  const activeSessions = filteredSessions.filter(s => !s.endTime).length;
  const totalDistance = filteredSessions.reduce((sum, s) => sum + s.totalDistance, 0);

  // Group sessions by date for display
  const sessionsByDate = filteredSessions.reduce((acc, session) => {
    const date = formatDateOnly(session.startTime);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, TravelSession[]>);

  return (
    <div   
      style={{
        backgroundColor: themeConfig.content.background,
        color: themeConfig.content.text,
      }} 
      className="p-4 md:p-6 rounded-xl"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <FaRoute className="text-blue-500" />
              Travel Sessions
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Track employee travel activities and paths
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {lastUpdateTime && (
                <span className="flex items-center gap-1">
                  <FaClock className="text-xs" />
                  Updated: {lastUpdateTime.toLocaleTimeString()}
                </span>
              )}
            </div>
            <button
              onClick={manualRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <FaSync className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
                <p className="text-2xl font-bold mt-1">{totalSessions}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FaListAlt className="text-blue-500 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Sessions</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{activeSessions}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaPlayCircle className="text-green-500 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Distance</p>
                <p className="text-2xl font-bold mt-1">{(totalDistance / 1000).toFixed(1)} km</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FaRoad className="text-purple-500 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaSearch className="inline mr-2" />
                Search Employee
              </label>
              <input
                type="text"
                placeholder="Search by name or employee code..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaUser className="inline mr-2" />
                Filter by User
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                onChange={(e) => setSelectedUser(e.target.value)}
                value={selectedUser}
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.userId} value={user.userId.toString()}>
                    {user.username} ({user.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Filter by Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FaRoute className="text-gray-300 dark:text-gray-600 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Travel Sessions Found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {selectedDate || selectedUser || searchQuery 
              ? "Try adjusting your filters to see more results." 
              : "No travel sessions recorded yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(sessionsByDate).map(([date, dateSessions]) => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Date Header */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaCalendarAlt className="text-gray-400" />
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {dateSessions.length} session{dateSessions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Sessions List */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {dateSessions.map((session) => {
                  const isActive = !session.endTime;
                  const pauses = detectPauses(session.logs || []);
                  const duration = session.endTime 
                    ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
                    : Math.round((new Date().getTime() - new Date(session.startTime).getTime()) / 60000);
                  
                  return (
                    <div key={session.sessionId} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left Section - User Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {session.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg text-gray-800 dark:text-white">
                                  {session.username}
                                </h4>
                                {isActive && (
                                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Employee Code: {session.employeeCode} • Session ID: #{session.sessionId}
                              </p>
                            </div>
                          </div>

                          {/* Session Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                                <FaClock className="text-sm" />
                                <span className="text-xs font-medium">Start Time</span>
                              </div>
                              <p className="text-sm font-semibold">{formatTimeOnly(session.startTime)}</p>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                                <FaStopCircle className="text-sm" />
                                <span className="text-xs font-medium">End Time</span>
                              </div>
                              <p className="text-sm font-semibold">
                                {session.endTime ? formatTimeOnly(session.endTime) : "—"}
                              </p>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                                <FaRoad className="text-sm" />
                                <span className="text-xs font-medium">Distance</span>
                              </div>
                              <p className="text-sm font-semibold">
                                {(session.totalDistance / 1000).toFixed(2)} km
                              </p>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                                <FaMapPin className="text-sm" />
                                <span className="text-xs font-medium">Points</span>
                              </div>
                              <p className="text-sm font-semibold">
                                {session.logs?.length || 0}
                              </p>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                              Duration: {Math.floor(duration / 60)}h {duration % 60}m
                            </span>
                            {pauses.length > 0 && (
                              <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                                <FaPauseCircle className="inline mr-1" />
                                {pauses.length} Pause{pauses.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right Section - Action Button */}
                        <div className="lg:ml-4">
                          <button
                            onClick={() => openMap(session)}
                            className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-semibold whitespace-nowrap"
                          >
                            <FaEye className="text-lg" />
                            View Travel Path
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map Modal */}
      {mapView && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full h-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Map Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <FaUser className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{mapView.username}</h2>
                    <p className="text-blue-100">Employee Code: {mapView.employeeCode} • Session ID: #{mapView.sessionId}</p>
                  </div>
                </div>
                <button
                  onClick={closeMap}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-all"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
              
              {/* Session Stats */}
              {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <p className="text-xs text-blue-100 mb-1">Start Time</p>
                  <p className="font-bold text-sm">{formatTimeOnly(mapView.startTime)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <p className="text-xs text-blue-100 mb-1">End Time</p>
                  <p className="font-bold text-sm">{mapView.endTime ? formatTimeOnly(mapView.endTime) : "Active"}</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <p className="text-xs text-blue-100 mb-1">Distance</p>
                  <p className="font-bold text-lg">{(mapView.totalDistance / 1000).toFixed(1)} km</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <p className="text-xs text-blue-100 mb-1">Points</p>
                  <p className="font-bold text-lg">{mapView.logs?.length || 0}</p>
                </div>
              </div> */}

              {/* Controls */}
                {/* <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      autoRefresh 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    <FaSync className={autoRefresh ? "animate-spin" : ""} />
                    Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={manualRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all disabled:opacity-50"
                  >
                    <FaSync className={isLoading ? "animate-spin" : ""} />
                    Refresh Now
                  </button>
                </div> */}
              </div>

            {/* Map Container */}
            <div className="flex-1 relative">
              <MapContainer
                center={getMapCenter(mapView)}
                zoom={getMapZoom(mapView)}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
                key={`map-${mapView.sessionId}`}
              >
                <TileLayer
                  attribution="Google Maps"
                  url="https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}"
                />

                {/* Polyline for the travel path */}
                {(() => {
                  const path = buildPolylinePath(mapView);
                  if (path.length >= 2) {
                    return (
                      <Polyline
                        positions={path}
                        pathOptions={{
                          color: mapView.endTime ? "#3B82F6" : "#10B981",
                          weight: 6,
                          opacity: 0.8,
                          lineCap: "round",
                          lineJoin: "round",
                          dashArray: mapView.endTime ? undefined : "10, 5"
                        }}
                      />
                    );
                  }
                  return null;
                })()}

                {/* Start marker */}
                {isValidCoordinate(mapView.startLatitude, mapView.startLongitude) && (
                  <Marker
                    position={[
                      parseCoordinate(mapView.startLatitude), 
                      parseCoordinate(mapView.startLongitude)
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
                        <strong>🟢 Start Point</strong><br />
                        <strong>User:</strong> {mapView.username}<br />
                        <strong>Time:</strong> {formatDateTime(mapView.startTime)}<br />
                        <strong>Coordinates:</strong> {parseCoordinate(mapView.startLatitude).toFixed(6)}, {parseCoordinate(mapView.startLongitude).toFixed(6)}
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Markers for important points */}
                {mapView.logs && mapView.logs.length > 0 && mapView.logs.length <= 100 && (
                  <>
                    {mapView.logs.map((log, index) => {
                      if (!isValidCoordinate(log.latitude, log.longitude)) return null;
                      
                      // Show markers for specific points: start, end, pauses, and every 5th point
                      const isStart = index === 0;
                      const isEnd = index === mapView.logs.length - 1;
                      const isPause = log.pause;
                      const shouldShow = isStart || isEnd || isPause || index % 5 === 0;
                      
                      if (!shouldShow) return null;
                      
                      const lat = parseCoordinate(log.latitude);
                      const lng = parseCoordinate(log.longitude);
                      
                      return (
                        <Marker
                          key={`log-${log.id}`}
                          position={[lat, lng]}
                          icon={L.icon({
                            iconUrl: isStart 
                              ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"
                              : isEnd
                              ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
                              : isPause
                              ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png"
                              : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
                            shadowUrl,
                            iconAnchor: [12, 41],
                            iconSize: [20, 32],
                          })}
                        >
                          <Popup>
                            <div className="text-sm">
                              <strong>
                                {isStart ? '🟢 Start' : isEnd ? '🔴 End' : isPause ? '⏸️ Pause' : '🔵 Point'}
                              </strong><br />
                              <strong>Time:</strong> {formatDateTime(log.timestamp)}<br />
                              <strong>Speed:</strong> {log.speed?.toFixed(2)} km/h<br />
                              <strong>Battery:</strong> {log.battery}%<br />
                              <strong>Coordinates:</strong> {lat.toFixed(6)}, {lng.toFixed(6)}<br />
                              <strong>Point:</strong> {index + 1} of {mapView.logs.length}
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </>
                )}

                {/* Current position marker for ongoing session */}
                {!mapView.endTime && mapView.logs && mapView.logs.length > 0 && (() => {
                  const lastLog = mapView.logs[mapView.logs.length - 1];
                  if (isValidCoordinate(lastLog.latitude, lastLog.longitude)) {
                    const lat = parseCoordinate(lastLog.latitude);
                    const lng = parseCoordinate(lastLog.longitude);
                    
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
                            <strong>User:</strong> {mapView.username}<br />
                            <strong>Last Update:</strong> {formatDateTime(lastLog.timestamp)}<br />
                            <strong>Speed:</strong> {lastLog.speed?.toFixed(2)} km/h<br />
                            <strong>Battery:</strong> {lastLog.battery}%<br />
                            <strong>Coordinates:</strong> {lat.toFixed(6)}, {lng.toFixed(6)}<br />
                            <strong>Status:</strong> <span className="text-green-600">● Active</span>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })()}

                {/* Pause intervals */}
                {detectPauses(mapView.logs || []).map((pause, index) => {
                  if (!isValidCoordinate(pause.start.latitude, pause.start.longitude)) return null;
                  
                  const lat = parseCoordinate(pause.start.latitude);
                  const lng = parseCoordinate(pause.start.longitude);
                  
                  return (
                    <Marker
                      key={`pause-${index}`}
                      position={[lat, lng]}
                      icon={L.icon({
                        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
                        shadowUrl,
                        iconAnchor: [12, 41],
                        iconSize: [20, 32],
                      })}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>⏸️ Pause Interval</strong><br />
                          <strong>Start:</strong> {formatDateTime(pause.start.timestamp)}<br />
                          <strong>End:</strong> {formatDateTime(pause.end.timestamp)}<br />
                          <strong>Duration:</strong> {pause.durationMinutes.toFixed(1)} minutes<br />
                          <strong>Coordinates:</strong> {lat.toFixed(6)}, {lng.toFixed(6)}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* End marker */}
                {isValidCoordinate(mapView.endLatitude, mapView.endLongitude) && (
                  <Marker
                    position={[
                      parseCoordinate(mapView.endLatitude), 
                      parseCoordinate(mapView.endLongitude)
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
                        <strong>🔴 End Point</strong><br />
                        <strong>User:</strong> {mapView.username}<br />
                        <strong>Time:</strong> {formatDateTime(mapView.endTime)}<br />
                        <strong>Coordinates:</strong> {parseCoordinate(mapView.endLatitude).toFixed(6)}, {parseCoordinate(mapView.endLongitude).toFixed(6)}<br />
                        <strong>Total Distance:</strong> {mapView.totalDistance?.toFixed(2)} meters
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}