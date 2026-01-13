// src/components/admin/TravelSessions.tsx
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  FaUser, 
  FaRoute, 
  FaCalendarAlt,
  FaClock,
  FaRoad,
  FaDownload, FaFileCsv,
  FaInfoCircle,
  FaTimes,
  FaPlayCircle,
  FaStopCircle,
  FaMapPin,
  FaSearch,
  FaCar,
  FaEye,
  FaListAlt,
  FaLayerGroup,
  FaChartLine,
 
} from "react-icons/fa";

import ImageZoom from "../../components/ImageZoom";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl
});

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
  startOdometer: string;  
  endOdometer: string;   
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

interface FarmerTravelData {
  sessionId: number;
  userId: number;
  startTime: string;
  endTime: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  startDescription: string;
  endDescription: string;
  status: string;
  isActive: boolean;
  totalDistance: number;
  date: string;
  durationMinutes: number;
  startOdometerImage: string;
  endOdometerImage: string;
  locationLogs?: {
    count: number;
    data: LocationLog[];
  };
  farmerData?: {
    count: number;
    data: FarmerData[];
  };
}

interface FarmerData {
  id: number;
  farmerName: string;
  farmerDescription: string;
  farmerImage?: string;
  createdAt: string;
}

interface GroupedSession {
  userId: number;
  username: string;
  employeeCode: string;
  date: string;
  sessions: TravelSession[];
  totalSessions: number;
  totalDistance: number;
  firstSessionDistance: number;
  originalTotalDistance: number;
  activeSessions: number;
  startTime: string;
  endTime: string;
  totalPoints: number;
}

interface MultiSessionMapView {
  userId: number;
  username: string;
  employeeCode: string;
  date: string;
  sessions: TravelSession[];
  center: [number, number];
  zoom: number;
}

// Glassmorphism CSS classes
const glassmorphismClasses = {
  card: "backdrop-blur-lg bg-white/10 dark:bg-gray-800/30 border border-white/20 dark:border-gray-700/50 shadow-xl",
  cardHover: "hover:bg-white/15 dark:hover:bg-gray-800/40 hover:border-white/30 dark:hover:border-gray-600/50 transition-all duration-300",
  input: "backdrop-blur-sm bg-white/5 dark:bg-gray-800/20 border border-white/10 dark:border-gray-700/30 focus:border-white/30 dark:focus:border-blue-500/50 focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30",
  button: {
    primary: "backdrop-blur-sm bg-gradient-to-r from-blue-500/90 to-indigo-600/90 hover:from-blue-600 hover:to-indigo-700 border border-blue-400/20 dark:border-blue-500/30 text-white shadow-lg hover:shadow-xl transition-all duration-300",
    secondary: "backdrop-blur-sm bg-gradient-to-r from-purple-500/90 to-pink-600/90 hover:from-purple-600 hover:to-pink-700 border border-purple-400/20 dark:border-purple-500/30 text-white shadow-lg hover:shadow-xl transition-all duration-300",
    outline: "backdrop-blur-sm bg-white/5 dark:bg-gray-800/20 border border-white/20 dark:border-gray-600/50 text-gray-800 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-800/30 transition-all duration-300"
  },
  statCard: "backdrop-blur-lg bg-gradient-to-br from-white/15 to-white/5 dark:from-gray-800/30 dark:to-gray-900/20 border border-white/20 dark:border-gray-700/50 shadow-lg",
  modal: "backdrop-blur-xl bg-white/20 dark:bg-gray-900/30 border border-white/30 dark:border-gray-700/50 shadow-2xl"
};

// Color palette for session polylines
const SESSION_COLORS = [
  '#FF0000', '#0000FF', '#00FF00', '#FFA500', '#800080',
  '#FF69B4', '#00FFFF', '#FFD700', '#008000', '#FF4500',
  '#4B0082', '#FF1493', '#00FF7F', '#8B4513', '#000080',
  '#808000', '#DC143C', '#FF8C00', '#9932CC', '#20B2AA',
];

const getSessionColor = (index: number): string => {
  return SESSION_COLORS[index % SESSION_COLORS.length];
};

export default function AttendanceList() {

  const [travelSessions, setTravelSessions] = useState<TravelSession[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, TravelSession>>({});
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [mapView, setMapView] = useState<TravelSession | null>(null);
  const [users, setUsers] = useState<{ userId: number; username: string; employeeCode: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeSessionsOnly, setActiveSessionsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedSessionDate, setSelectedSessionDate] = useState<string>("");
  
  // Grouped view states
  const [groupedView, setGroupedView] = useState<GroupedSession[]>([]);
  const [multiSessionMapView, setMultiSessionMapView] = useState<MultiSessionMapView | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('grouped');
  
  // Farmer data state
  const [farmerTravelData, setFarmerTravelData] = useState<FarmerTravelData[]>([]);
  const [showFarmerDataModal, setShowFarmerDataModal] = useState(false);
  const [selectedUserForFarmerData, setSelectedUserForFarmerData] = useState<string>("");
  const [isLoadingFarmerData, setIsLoadingFarmerData] = useState(false);
  const [farmerDataError, setFarmerDataError] = useState<string | null>(null);
  
  // Map marker states
  const [showLogMarkers, setShowLogMarkers] = useState(true);
  const [showLogMarkersMulti, setShowLogMarkersMulti] = useState(true);
  
  // Custom icons for markers
  const customIcons = {
    startIcon: new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }),
    endIcon: new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }),
    activeIcon: new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  };

  // Format date without time (YYYY-MM-DD)
  const formatDateOnly = useCallback((dateTimeStr: string): string => {
    if (!dateTimeStr) return "";
    const date = new Date(dateTimeStr);
    return date.toISOString().split('T')[0];
  }, []);
  
  // Calculate distance minus first session distance
  const calculateAdjustedGroupDistance = useCallback((sessions: TravelSession[]): {
    totalDistance: number;
    firstSessionDistance: number;
    originalTotalDistance: number;
  } => {
    if (sessions.length === 0) {
      return { totalDistance: 0, firstSessionDistance: 0, originalTotalDistance: 0 };
    }
    
    // Sort sessions by start time to identify the first session
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    const firstSession = sortedSessions[0];
    const firstSessionDistance = firstSession.totalDistance || 0;
    
    // Calculate total of all sessions
    const originalTotalDistance = sortedSessions.reduce((sum, session) => 
      sum + (session.totalDistance || 0), 0
    );
    
    // Subtract first session's distance
    const adjustedDistance = Math.max(0, originalTotalDistance - firstSessionDistance);
    
    return {
      totalDistance: adjustedDistance,
      firstSessionDistance: firstSessionDistance,
      originalTotalDistance: originalTotalDistance
    };
  }, []);
  
  // Group sessions by user and date with correct sorting
  const groupSessionsByUserAndDate = useCallback((sessions: TravelSession[]): GroupedSession[] => {
    const groupedMap = new Map<string, GroupedSession>();
    
    // First sort sessions by date (newest first)
    const sortedSessions = [...sessions].sort((a, b) => {
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
    
    sortedSessions.forEach(session => {
      const dateKey = formatDateOnly(session.startTime);
      const groupKey = `${session.userId}-${dateKey}`;
      
      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          userId: session.userId,
          username: session.username,
          employeeCode: session.employeeCode,
          date: dateKey,
          sessions: [session],
          totalSessions: 1,
          totalDistance: 0,
          firstSessionDistance: 0,
          originalTotalDistance: 0,
          activeSessions: session.endTime ? 0 : 1,
          startTime: session.startTime,
          endTime: session.endTime || session.startTime,
          totalPoints: session.logs?.length || 0
        });
      } else {
        const existingGroup = groupedMap.get(groupKey)!;
        
        // Add session to the group while maintaining chronological order
        const insertIndex = existingGroup.sessions.findIndex(s => 
          new Date(s.startTime).getTime() > new Date(session.startTime).getTime()
        );
        
        if (insertIndex === -1) {
          existingGroup.sessions.push(session);
        } else {
          existingGroup.sessions.splice(insertIndex, 0, session);
        }
        
        existingGroup.totalSessions += 1;
        existingGroup.activeSessions += session.endTime ? 0 : 1;
        existingGroup.totalPoints += session.logs?.length || 0;
        
        if (new Date(session.startTime) < new Date(existingGroup.startTime)) {
          existingGroup.startTime = session.startTime;
        }
        
        const sessionEndTime = session.endTime || session.startTime;
        if (new Date(sessionEndTime) > new Date(existingGroup.endTime)) {
          existingGroup.endTime = sessionEndTime;
        }
      }
    });
    
    // Calculate adjusted distances for each group and sort groups
    const groups = Array.from(groupedMap.values()).map(group => {
      const distanceData = calculateAdjustedGroupDistance(group.sessions);
      
      return {
        ...group,
        totalDistance: distanceData.totalDistance,
        firstSessionDistance: distanceData.firstSessionDistance,
        originalTotalDistance: distanceData.originalTotalDistance
      };
    });
    
    // Sort groups by date (newest first), then by user ID
    return groups.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.userId - a.userId;
    });
  }, [formatDateOnly, calculateAdjustedGroupDistance]);
  
  // Calculate duration in hours and minutes
  const calculateDuration = useCallback((startTime: string, endTime: string) => {
    if (!startTime) return { hours: 0, minutes: 0 };
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  }, []);
  
  useEffect(() => {
    fetchTravelSessions();
  }, []);
  
  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      const refreshInterval = activeSessionsOnly ? 10000 : 30000; // 10s for active, 30s for all
      
      locationIntervalRef.current = setInterval(() => {
        if (activeSessionsOnly) {
          fetchActiveSessionsOnly();
        } else {
          fetchTravelSessions();
        }
      }, refreshInterval);
    }
    
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [autoRefresh, activeSessionsOnly]);
  
  // Fetch all travel sessions
  const fetchTravelSessions = async () => {
    setIsLoading(true);
    try {
      const res = await API.get("/admin/travel-sessions");
      if (res.data.success) {
        const sessions = res.data.data || [];
        setTravelSessions(sessions);
        
        const uniqueUsers = Array.from(
          new Map(
            sessions.map(session => [
              session.userId,
              { userId: session.userId, username: session.username, employeeCode: session.employeeCode }
            ])
          ).values()
        );
        setUsers(uniqueUsers);
        
        const newCache: Record<string, TravelSession> = {};
        sessions.forEach(session => {
          const key = `${session.userId}-${session.sessionId}`;
          newCache[key] = session;
        });
        setSessionsMap(newCache);
        
        const filtered = filterSessions(sessions);
        const grouped = groupSessionsByUserAndDate(filtered);
        setGroupedView(grouped);
        
        setLastUpdateTime(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch travel sessions", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch only active sessions
  const fetchActiveSessionsOnly = async () => {
    try {
      const res = await API.get("/admin/travel-sessions");
      if (res.data.success) {
        const allSessions = res.data.data || [];
        
        // Update only active sessions
        setTravelSessions(prevSessions => {
          const updatedSessions = [...prevSessions];
          const activeSessionMap = new Map<number, TravelSession>();
          
          // Create map of active sessions from new data
          allSessions.forEach((session: TravelSession) => {
            if (!session.endTime) {
              activeSessionMap.set(session.sessionId, session);
            }
          });
          
          // Update existing active sessions
          updatedSessions.forEach((session, index) => {
            if (!session.endTime && activeSessionMap.has(session.sessionId)) {
              updatedSessions[index] = activeSessionMap.get(session.sessionId)!;
              activeSessionMap.delete(session.sessionId);
            }
          });
          
          // Add new active sessions
          activeSessionMap.forEach(session => {
            updatedSessions.push(session);
          });
          
          // Sort with newest dates first
          return updatedSessions.sort((a, b) => {
            const dateA = new Date(a.startTime);
            const dateB = new Date(b.startTime);
            return dateB.getTime() - dateA.getTime();
          });
        });
        
        // Update sessions map
        allSessions.forEach((session: TravelSession) => {
          if (!session.endTime) {
            const key = `${session.userId}-${session.sessionId}`;
            setSessionsMap(prev => ({ ...prev, [key]: session }));
          }
        });
        
        // Update grouped view
        const filtered = filterSessions(travelSessions);
        const grouped = groupSessionsByUserAndDate(filtered);
        setGroupedView(grouped);
        
        setLastUpdateTime(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch active sessions", err);
    }
  };
  
  const handleFetchTravelData = async (userId: string, sessionDate?: string) => {
    if (!userId) {
      alert("Please select a user first");
      return;
    }
    
    setIsLoadingFarmerData(true);
    setFarmerDataError(null);
    setSelectedUserForFarmerData(userId);
    
    if (sessionDate) {
      setSelectedSessionDate(sessionDate);
    }
    
    try {
      const response = await API.get(`/tracking/locationlog/get_travel_sessions`, {
        params: { userId }
      });
      
      const data = response.data;
      
      if (data.success && data.sessions && data.sessions.data) {
        const allSessions: FarmerTravelData[] = data.sessions.data.map((session: any) => ({
          sessionId: session.sessionId,
          userId: session.userId || data.user?.id,
          startTime: session.startTime,
          endTime: session.endTime,
          startLatitude: session.startLatitude,
          startLongitude: session.startLongitude,
          endLatitude: session.endLatitude,
          endLongitude: session.endLongitude,
          startDescription: session.startDescription || '',
          endDescription: session.endDescription || '',
          status: session.status,
          isActive: session.isActive,
          totalDistance: session.totalDistance,
          date: session.date,
          durationMinutes: session.durationMinutes,
          startOdometerImage: session.startOdometerImage || '',
          endOdometerImage: session.endOdometerImage || '',
          locationLogs: session.locationLogs,
          farmerData: session.farmerData
        }));
        
        let filteredSessions = allSessions;
        
        if (sessionDate) {
          filteredSessions = allSessions.filter(session => {
            const sessionDateStr = formatDateOnly(session.date || session.startTime);
            return sessionDateStr === sessionDate;
          });
        }
        
        setFarmerTravelData(filteredSessions);
        setShowFarmerDataModal(true);
      } else {
        setFarmerDataError(data.message || "No travel data found");
        setFarmerTravelData([]);
        setShowFarmerDataModal(true);
      }
      
    } catch (error: any) {
      console.error("Error fetching travel data:", error);
      
      if (error.response) {
        setFarmerDataError(`Error ${error.response.status}: ${error.response.data?.message || 'Server error'}`);
      } else if (error.request) {
        setFarmerDataError("No response from server. Please check your connection.");
      } else {
        setFarmerDataError("Failed to fetch travel session data. Please try again.");
      }
      
      setShowFarmerDataModal(true);
    } finally {
      setIsLoadingFarmerData(false);
    }
  };
  
  const closeFarmerDataModal = () => {
    setShowFarmerDataModal(false);
    setFarmerTravelData([]);
    setFarmerDataError(null);
  };
  
  const formatDateTime = useCallback((dateTimeStr: string) => {
    if (!dateTimeStr) return "-";
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  }, []);
  
  const formatTimeOnly = useCallback((dateTimeStr: string) => {
    if (!dateTimeStr) return "-";
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);
  
  const formatShortDate = useCallback((dateTimeStr: string) => {
    if (!dateTimeStr) return "-";
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);
  
  // Improved coordinate parsing
  const parseCoordinate = useCallback((coord: string | number): number => {
    if (coord === null || coord === undefined) return 0;
    
    if (typeof coord === "number") {
      return Math.abs(coord) > 180 ? 0 : coord;
    }
    
    const str = String(coord).trim();
    if (!str) return 0;
    
    // Remove any non-numeric characters except decimal point and minus sign
    const cleaned = str.replace(/[^\d.-]/g, '');
    if (!cleaned) return 0;
    
    const parsed = parseFloat(cleaned);
    
    // Validate latitude range
    if (Math.abs(parsed) > 90) return 0;
    
    return isNaN(parsed) ? 0 : parsed;
  }, []);
  
  const isValidCoordinate = useCallback((lat: string | number, lng: string | number): boolean => {
    const latNum = parseCoordinate(lat);
    const lngNum = parseCoordinate(lng);
    
    return latNum !== 0 && lngNum !== 0 &&
      Math.abs(latNum) <= 90 && Math.abs(lngNum) <= 180 &&
      !isNaN(latNum) && !isNaN(lngNum);
  }, [parseCoordinate]);
  
  // Helper function to calculate distance between two coordinates in meters
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }, []);
  
  // Helper function to smooth the path
  const smoothPath = useCallback((points: [number, number][]): [number, number][] => {
    if (points.length < 3) return points;
    
    const smoothed: [number, number][] = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];
      
      // Simple moving average smoothing (makes path look more natural)
      const smoothedLat = (prev[0] + current[0] + next[0]) / 3;
      const smoothedLng = (prev[1] + current[1] + next[1]) / 3;
      
      smoothed.push([smoothedLat, smoothedLng]);
    }
    
    smoothed.push(points[points.length - 1]);
    return smoothed;
  }, []);
  
  // IMPROVED: Build polyline path with gap handling and smoothing
  const buildPolylinePath = useCallback((session: TravelSession): [number, number][] => {
    const path: [number, number][] = [];
    
    if (!session || !session.logs || session.logs.length === 0) return path;
    
    // Sort logs by timestamp to ensure chronological order
    const sortedLogs = [...session.logs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Parameters for gap detection
    const MAX_REASONABLE_SPEED_KMH = 120; // Maximum reasonable speed (120 km/h)
    const MAX_TIME_GAP_MINUTES = 10; // Maximum time gap to connect points
    
    let lastValidPoint: [number, number] | null = null;
    let lastValidTime: Date | null = null;
    
    sortedLogs.forEach((log, index) => {
      if (isValidCoordinate(log.latitude, log.longitude)) {
        const currentPoint: [number, number] = [
          parseCoordinate(log.latitude), 
          parseCoordinate(log.longitude)
        ];
        const currentTime = new Date(log.timestamp);
        
        if (lastValidPoint && lastValidTime) {
          const timeDiffMs = currentTime.getTime() - lastValidTime.getTime();
          const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
          
          const distanceMeters = calculateDistance(
            lastValidPoint[0], lastValidPoint[1],
            currentPoint[0], currentPoint[1]
          );
          const distanceKm = distanceMeters / 1000;
          
          // Calculate speed (km/h) between points
          const speedKmh = timeDiffHours > 0 ? distanceKm / timeDiffHours : 0;
          
          // Check if this connection is reasonable
          if (timeDiffMs < MAX_TIME_GAP_MINUTES * 60 * 1000 && speedKmh < MAX_REASONABLE_SPEED_KMH) {
            // Reasonable connection - add the point
            path.push(currentPoint);
          } else if (speedKmh >= MAX_REASONABLE_SPEED_KMH) {
            // Unreasonably high speed - likely GPS jump
            // Add a duplicate point to create a visual break
            path.push([lastValidPoint[0], lastValidPoint[1]]);
            path.push(currentPoint);
          } else {
            // Too long time gap - just add point (line will continue)
            path.push(currentPoint);
          }
        } else {
          // First valid point
          path.push(currentPoint);
        }
        
        lastValidPoint = currentPoint;
        lastValidTime = currentTime;
      }
    });
    
    // Apply smoothing to make the path look more natural
    return smoothPath(path);
  }, [isValidCoordinate, parseCoordinate, calculateDistance, smoothPath]);
  
  const getMapCenter = useCallback((session: TravelSession): [number, number] => {
    if (!session) return [21.1702, 72.8311];
    
    // Try to use start coordinates first
    if (isValidCoordinate(session.startLatitude, session.startLongitude)) {
      return [parseCoordinate(session.startLatitude), parseCoordinate(session.startLongitude)];
    }
    
    // Fallback to logs if available
    if (session.logs && session.logs.length > 0) {
      const validLogs = session.logs.filter(log => 
        isValidCoordinate(log.latitude, log.longitude)
      );
      
      if (validLogs.length > 0) {
        const sumLat = validLogs.reduce((sum, log) => sum + parseCoordinate(log.latitude), 0);
        const sumLng = validLogs.reduce((sum, log) => sum + parseCoordinate(log.longitude), 0);
        return [sumLat / validLogs.length, sumLng / validLogs.length];
      }
    }
    
    // Default fallback
    return [21.1702, 72.8311];
  }, [isValidCoordinate, parseCoordinate]);
  
  const getMapZoom = useCallback((session: TravelSession): number => {
    if (!session) return 13;
    
    const validPoints: [number, number][] = [];
    
    // Add start point if valid
    if (isValidCoordinate(session.startLatitude, session.startLongitude)) {
      validPoints.push([parseCoordinate(session.startLatitude), parseCoordinate(session.startLongitude)]);
    }
    
    // Add end point if valid
    if (isValidCoordinate(session.endLatitude, session.endLongitude)) {
      validPoints.push([parseCoordinate(session.endLatitude), parseCoordinate(session.endLongitude)]);
    }
    
    // Add log points
    if (session.logs) {
      session.logs.forEach(log => {
        if (isValidCoordinate(log.latitude, log.longitude)) {
          validPoints.push([parseCoordinate(log.latitude), parseCoordinate(log.longitude)]);
        }
      });
    }
    
    if (validPoints.length < 2) return 13;
    
    const lats = validPoints.map(p => p[0]);
    const lngs = validPoints.map(p => p[1]);
    
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRange = Math.max(latRange, lngRange);
    
    if (maxRange > 0.1) return 10;
    if (maxRange > 0.05) return 12;
    if (maxRange > 0.01) return 14;
    if (maxRange > 0.005) return 15;
    return 16;
  }, [isValidCoordinate, parseCoordinate]);
  
  const detectPauses = useCallback((logs: LocationLog[], pauseThresholdMinutes: number = 2): PauseInterval[] => {
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
  }, []);
  
  const openMap = (session: TravelSession) => {
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
  
  const openMultiSessionMap = useCallback((group: GroupedSession) => {
    const allPoints: [number, number][] = [];
    
    // Collect all valid coordinates from all sessions
    group.sessions.forEach(session => {
      // Add start point
      if (isValidCoordinate(session.startLatitude, session.startLongitude)) {
        allPoints.push([
          parseCoordinate(session.startLatitude), 
          parseCoordinate(session.startLongitude)
        ]);
      }
      
      // Add end point
      if (isValidCoordinate(session.endLatitude, session.endLongitude)) {
        allPoints.push([
          parseCoordinate(session.endLatitude), 
          parseCoordinate(session.endLongitude)
        ]);
      }
      
      // Add log points
      if (session.logs) {
        session.logs.forEach(log => {
          if (isValidCoordinate(log.latitude, log.longitude)) {
            allPoints.push([parseCoordinate(log.latitude), parseCoordinate(log.longitude)]);
          }
        });
      }
    });
    
    let center: [number, number] = [21.1702, 72.8311];
    let zoom = 13;
    
    if (allPoints.length > 0) {
      const sumLat = allPoints.reduce((sum, point) => sum + point[0], 0);
      const sumLng = allPoints.reduce((sum, point) => sum + point[1], 0);
      center = [sumLat / allPoints.length, sumLng / allPoints.length];
      
      const lats = allPoints.map(p => p[0]);
      const lngs = allPoints.map(p => p[1]);
      const latRange = Math.max(...lats) - Math.min(...lats);
      const lngRange = Math.max(...lngs) - Math.min(...lngs);
      const maxRange = Math.max(latRange, lngRange);
      
      if (maxRange > 0.1) zoom = 10;
      else if (maxRange > 0.05) zoom = 12;
      else if (maxRange > 0.01) zoom = 14;
      else if (maxRange > 0.005) zoom = 15;
      else zoom = 16;
    }
    
    setMultiSessionMapView({
      userId: group.userId,
      username: group.username,
      employeeCode: group.employeeCode,
      date: group.date,
      sessions: group.sessions.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
      center,
      zoom,
    });
    
    setLastUpdateTime(new Date());
  }, [isValidCoordinate, parseCoordinate]);
  
  const closeMultiSessionMap = () => {
    setMultiSessionMapView(null);
  };
  
  const manualRefresh = () => {
    if (activeSessionsOnly && autoRefresh) {
      fetchActiveSessionsOnly();
    } else {
      fetchTravelSessions();
    }
  };
  
  // Clear date filter function
  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };
  
  // Check if date filter is active
  const isDateFilterActive = startDate || endDate;
  
  // Filter sessions with date range and sorting
  const filterSessions = useCallback((sessions: TravelSession[] = travelSessions) => {
    let filtered = [...sessions];
    
    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.startTime);
        const sessionDateOnly = sessionDate.toISOString().split('T')[0];
        
        if (startDate && !endDate) {
          return sessionDateOnly >= startDate;
        }
        
        if (!startDate && endDate) {
          return sessionDateOnly <= endDate;
        }
        
        if (startDate && endDate) {
          return sessionDateOnly >= startDate && sessionDateOnly <= endDate;
        }
        
        return true;
      });
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
    
    // Sort by date descending (newest first) but keep natural order within same date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();
      
      // Sort by date descending
      if (Math.abs(dateA - dateB) > 86400000) { // More than 1 day difference
        return dateB - dateA; // Newer dates first
      }
      
      // If same date, keep original order (by sessionId)
      return a.sessionId - b.sessionId;
    });
  }, [startDate, endDate, selectedUser, searchQuery, travelSessions]);
  
  const filteredSessions = useMemo(() => filterSessions(), [filterSessions]);
  
  useEffect(() => {
    const grouped = groupSessionsByUserAndDate(filteredSessions);
    setGroupedView(grouped);
  }, [filteredSessions, groupSessionsByUserAndDate]);
  
  const totalSessions = filteredSessions.length;
  const activeSessions = filteredSessions.filter(s => !s.endTime).length;
  const totalDistance = filteredSessions.reduce((sum, s) => sum + s.totalDistance, 0);
  
  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      
      // We need to fetch farmer data for all sessions first
      const groupedDataWithFarmerInfo = await Promise.all(
        groupedView.map(async (group) => {
          try {
            // Fetch farmer data for this user on this date
            const response = await API.get(`/tracking/locationlog/get_travel_sessions`, {
              params: { userId: group.userId }
            });
            
            const data = response.data;
            let sessionFarmerData = [];
            
            if (data.success && data.sessions && data.sessions.data) {
              const allSessions = data.sessions.data.map((session: any) => ({
                sessionId: session.sessionId,
                startTime: session.startTime,
                endTime: session.endTime,
                totalDistance: session.totalDistance,
                startOdometerImage: session.startOdometerImage || '',
                endOdometerImage: session.endOdometerImage || '',
                farmerData: session.farmerData || { count: 0, data: [] }
              }));
              
              // Filter sessions for this specific date
              sessionFarmerData = allSessions.filter(session => {
                const sessionDate = formatDateOnly(session.startTime);
                return sessionDate === group.date;
              });
            }
            
            // Calculate totals
            const firstSessionStart = new Date(group.startTime);
            const lastSessionEnd = new Date(group.endTime);
            const totalDuration = Math.round((lastSessionEnd.getTime() - firstSessionStart.getTime()) / 60000);
            const totalDistanceExcludingFirst = group.totalDistance;
            const reimbursementAmount = ((totalDistanceExcludingFirst / 1000) * 3.5).toFixed(2);
            
            const totalPauses = group.sessions.reduce((sum, session) => {
              const pauses = detectPauses(session.logs || []);
              return sum + pauses.length;
            }, 0);
            
            // Count total farmers met
            const totalFarmersMet = sessionFarmerData.reduce((sum, session) => 
              sum + (session.farmerData?.count || 0), 0
            );
            
            // Build session details with farmer information
            const sessionDetails = group.sessions.map((session, index) => {
              const matchingFarmerData = sessionFarmerData.find(f => f.sessionId === session.sessionId);
              const farmerCount = matchingFarmerData?.farmerData?.count || 0;
              const farmers = matchingFarmerData?.farmerData?.data || [];
              
              // Format farmer descriptions
              const farmerDescriptions = farmers.map((farmer, farmerIndex) => 
                `Farmer ${farmerIndex + 1}: ${farmer.farmerName || 'Unknown'} - ${farmer.farmerDescription || 'No description'}`
              ).join('; ');
              
              // Format farmer image URLs
              const farmerImageUrls = farmers.map((farmer, farmerIndex) => 
                farmer.farmerImage || ''
              ).filter(url => url).join('; ');
              
              return {
                sessionNumber: index + 1,
                sessionId: session.sessionId,
                sessionStartTime: formatTimeOnly(session.startTime),
                sessionEndTime: session.endTime ? formatTimeOnly(session.endTime) : 'Active',
                sessionDistance: (session.totalDistance / 1000).toFixed(2),
                sessionStatus: session.endTime ? 'Completed' : 'Active',
                farmersCount: farmerCount,
                farmerDescriptions: farmerDescriptions || 'None',
                farmerImageUrls: farmerImageUrls || 'None',
                startOdometerImage: matchingFarmerData?.startOdometerImage || '',
                endOdometerImage: matchingFarmerData?.endOdometerImage || ''
              };
            });
            
            return {
              // Group info
              'User ID': group.userId,
              'Username': group.username,
              'Employee Code': group.employeeCode,
              'Date': group.date,
              'Formatted Date': new Date(group.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }),
              'Start Time': formatDateTime(group.startTime),
              'End Time': formatDateTime(group.endTime),
              'Total Sessions': group.totalSessions,
              'Active Sessions': group.activeSessions,
              'Original Total Distance (km)': (group.originalTotalDistance / 1000).toFixed(2),
              'Original Total Reimbursement(km)': ((group.originalTotalDistance / 1000)*3.5).toFixed(2),
              'First Session Distance (km)': (group.firstSessionDistance / 1000).toFixed(2),
              'Payable Distance excluding first session(km)': (totalDistanceExcludingFirst / 1000).toFixed(2),
              'Payable Amount (₹)': reimbursementAmount,
              'Total Farmers Met': totalFarmersMet,
              'Duration (minutes)': totalDuration,
              
              'Total Pauses Count': totalPauses,
              'Status': group.activeSessions > 0 ? 'Has Active Sessions' : 'All Completed',
              'Notes': `Excluding first session distance: ${(group.firstSessionDistance / 1000).toFixed(2)} km`,
              
              // Individual session columns (flattened)
              ...sessionDetails.reduce((acc, session, idx) => {
                const prefix = `Session ${session.sessionNumber}`;
                return {
                  ...acc,
                  [`${prefix} ID`]: session.sessionId,
                  [`${prefix} Start Time`]: session.sessionStartTime,
                  [`${prefix} End Time`]: session.sessionEndTime,
                  [`${prefix} Distance (km)`]: session.sessionDistance,
                  [`${prefix} Status`]: session.sessionStatus,
                  [`${prefix} Farmers Count`]: session.farmersCount,
                  [`${prefix} Farmer Descriptions`]: session.farmerDescriptions,
                };
              }, {}),
              
              // For reference
              sessionDetails: sessionDetails // Keep this for debugging if needed
            };
            
          } catch (error) {
            console.error(`Error fetching data for user ${group.userId} on ${group.date}:`, error);
            // Return basic data without farmer info if API fails
            return {
              'User ID': group.userId,
              'Username': group.username,
              'Employee Code': group.employeeCode,
              'Date': group.date,
              'Error': 'Failed to fetch farmer data',
              ...group.sessions.reduce((acc, session, idx) => {
                const prefix = `Session ${idx + 1}`;
                return {
                  ...acc,
                  [`${prefix} ID`]: session.sessionId,
                  [`${prefix} Distance (km)`]: (session.totalDistance / 1000).toFixed(2),
                  [`${prefix} Status`]: session.endTime ? 'Completed' : 'Active'
                };
              }, {})
            };
          }
        })
      );
      
      // Sort by date (newest first) and then by user ID
      const sortedData = groupedDataWithFarmerInfo.sort((a, b) => {
        const dateCompare = new Date(b.Date).getTime() - new Date(a.Date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b['User ID'] - a['User ID'];
      });
      
      // Determine maximum number of sessions in any group to create dynamic headers
      const maxSessions = Math.max(...groupedView.map(group => group.sessions.length));
      
      // Build dynamic headers
      const baseHeaders = [
        'User ID',
        'Username',
        'Employee Code',
        'Date',
        'Formatted Date',
        'Start Time',
        'End Time',
        'Total Sessions',
        'Active Sessions',
        'Original Total Distance (km)',
        'Original Total Reimbursement(km)',
        'First Session Distance (km)',
        'Payable Distance excluding first session(km)',
        'Payable Amount (₹)',
        'Total Farmers Met',
        'Duration (minutes)',
        
        'Total Pauses Count',
        'Status',
        'Notes'
      ];
      
      // Add session-specific headers for each session
      const sessionHeaders = [];
      for (let i = 1; i <= maxSessions; i++) {
        sessionHeaders.push(
          `Session ${i} ID`,
          `Session ${i} Start Time`,
          `Session ${i} End Time`,
          `Session ${i} Distance (km)`,
          `Session ${i} Farmers Count`,
          `Session ${i} Farmer Descriptions`,
          `Session ${i} Farmer Image URLs`,
          `Session ${i} Start Odometer Image`,
          `Session ${i} End Odometer Image`,
          `Session ${i} Notes`
        );
      }
      
      const allHeaders = [...baseHeaders, ...sessionHeaders];
      
      // Build CSV content
      const csvContent = [
        allHeaders.join(','),
        ...sortedData.map(row => 
          allHeaders.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '""';
            const stringValue = String(value);
            // Handle CSV escaping
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes(';')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `travel_sessions_detailed_${dateStr}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Build session polyline path for multi-session view
  const buildSessionPolylinePath = useCallback((session: TravelSession): [number, number][] => {
    const path: [number, number][] = [];
    
    if (!session || !session.logs || session.logs.length === 0) return path;
    
    // Sort logs by timestamp to ensure chronological order
    const sortedLogs = [...session.logs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Parameters for gap detection
    const MAX_REASONABLE_SPEED_KMH = 120; // Maximum reasonable speed (120 km/h)
    const MAX_TIME_GAP_MINUTES = 10; // Maximum time gap to connect points
    
    let lastValidPoint: [number, number] | null = null;
    let lastValidTime: Date | null = null;
    
    sortedLogs.forEach((log, index) => {
      if (isValidCoordinate(log.latitude, log.longitude)) {
        const currentPoint: [number, number] = [
          parseCoordinate(log.latitude), 
          parseCoordinate(log.longitude)
        ];
        const currentTime = new Date(log.timestamp);
        
        if (lastValidPoint && lastValidTime) {
          const timeDiffMs = currentTime.getTime() - lastValidTime.getTime();
          const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
          
          const distanceMeters = calculateDistance(
            lastValidPoint[0], lastValidPoint[1],
            currentPoint[0], currentPoint[1]
          );
          const distanceKm = distanceMeters / 1000;
          
          // Calculate speed (km/h) between points
          const speedKmh = timeDiffHours > 0 ? distanceKm / timeDiffHours : 0;
          
          // Check if this connection is reasonable
          if (timeDiffMs < MAX_TIME_GAP_MINUTES * 60 * 1000 && speedKmh < MAX_REASONABLE_SPEED_KMH) {
            // Reasonable connection - add the point
            path.push(currentPoint);
          } else if (speedKmh >= MAX_REASONABLE_SPEED_KMH) {
            // Unreasonably high speed - likely GPS jump
            // Add a duplicate point to create a visual break
            path.push([lastValidPoint[0], lastValidPoint[1]]);
            path.push(currentPoint);
          } else {
            // Too long time gap - just add point (line will continue)
            path.push(currentPoint);
          }
        } else {
          // First valid point
          path.push(currentPoint);
        }
        
        lastValidPoint = currentPoint;
        lastValidTime = currentTime;
      }
    });
    
    // Apply smoothing to make the path look more natural
    return smoothPath(path);
  }, [isValidCoordinate, parseCoordinate, calculateDistance, smoothPath]);
  
  const renderIndividualView = useMemo(() => {
    const groupedByDate = groupSessionsByUserAndDate(filteredSessions).reduce((acc, group) => {
      if (!acc[group.date]) acc[group.date] = [];
      acc[group.date].push(...group.sessions);
      return acc;
    }, {} as Record<string, TravelSession[]>);
    
    return (
      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([date, dateSessions]) => (
          <div key={date} className={`${glassmorphismClasses.card} rounded-2xl overflow-hidden`}>
            <div className="px-6 py-4 border-b border-white/10 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-blue-400" />
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {dateSessions.length} session{dateSessions.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div className="divide-y divide-white/5 dark:divide-gray-700/50">
              {dateSessions.map((session) => {
                const duration = calculateDuration(session.startTime, session.endTime);
                const isActive = !session.endTime;
                
                return (
                  <div key={session.sessionId} className="p-6 hover:bg-white/5 dark:hover:bg-gray-800/20 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/80 to-indigo-600/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-semibold">
                            {session.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg text-gray-800 dark:text-white">
                                {session.username}
                              </h4>
                              {isActive && (
                                <span className="px-2 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 dark:border-green-500/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Employee Code: {session.employeeCode} • Session ID: #{session.sessionId}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-white/10 dark:border-gray-700/50">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                              <FaClock className="text-sm" />
                              <span className="text-xs font-medium">Start Time</span>
                            </div>
                            <p className="text-sm font-semibold">{formatTimeOnly(session.startTime)}</p>
                          </div>
                          
                          <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-white/10 dark:border-gray-700/50">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                              <FaStopCircle className="text-sm" />
                              <span className="text-xs font-medium">End Time</span>
                            </div>
                            <p className="text-sm font-semibold">
                              {session.endTime ? formatTimeOnly(session.endTime) : "—"}
                            </p>
                          </div>
                          
                          <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-white/10 dark:border-gray-700/50">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                              <FaRoad className="text-sm" />
                              <span className="text-xs font-medium">Distance</span>
                            </div>
                            <p className="text-sm font-semibold">
                              {(session.totalDistance / 1000).toFixed(2)} km
                            </p>
                          </div>
                          
                          <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-white/10 dark:border-gray-700/50">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                              <FaMapPin className="text-sm" />
                              <span className="text-xs font-medium">Points</span>
                            </div>
                            <p className="text-sm font-semibold">
                              {session.logs?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFetchTravelData(
                            session.userId.toString(), 
                            formatDateOnly(session.startTime)
                          )}
                          className={`px-4 py-3 ${glassmorphismClasses.button.secondary} rounded-xl font-semibold flex items-center gap-2`}
                        >
                          <FaInfoCircle />
                          Details
                        </button>
                        <button
                          onClick={() => openMap(session)}
                          className={`px-4 py-3 ${glassmorphismClasses.button.primary} rounded-xl font-semibold flex items-center gap-2`}
                        >
                          <FaEye />
                          Map
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
    );
  }, [filteredSessions, groupSessionsByUserAndDate, calculateDuration, formatTimeOnly, formatDateOnly]);

  const renderOdometerImage = (imageData: string) => {
    if (!imageData || imageData.trim() === '') {
      return (
        <div className="bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center border border-white/10 dark:border-gray-700/50">
          <FaCar className="text-gray-400 dark:text-gray-600 text-3xl mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No odometer image</p>
        </div>
      );
    }
    
    if (imageData.startsWith('data:image') || imageData.startsWith('/9j/') || imageData.length > 1000) {
      return (
        <ImageZoom
          src={imageData.startsWith('data:image') ? imageData : `data:image/jpeg;base64,${imageData}`}
          alt="Odometer Image"
          className="rounded-xl"
        />
      );
    }
    
    return (
      <ImageZoom
        src={imageData}
        alt="Odometer Image"
        className="rounded-xl"
      />
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-gray-100/50 via-white/30 to-blue-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm rounded-xl">
                <FaRoute className="text-blue-500" />
              </div>
              Travel Sessions
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Track employee travel activities and paths
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {lastUpdateTime && (
                <span className="flex items-center gap-1 backdrop-blur-sm bg-white/20 dark:bg-gray-800/30 px-3 py-1 rounded-lg">
                  <FaClock className="text-xs" />
                  Updated: {lastUpdateTime.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <button
              onClick={exportToCSV}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white transition-all`}
              title="Export grouped sessions with detailed farmer data"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FaSync className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FaFileCsv />
                  Export To CSV
                </>
              )}
            </button>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                autoRefresh 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              } transition-all`}
              title={autoRefresh ? "Auto-refresh is ON" : "Auto-refresh is OFF"}
            >
              {autoRefresh ? (
                <>
                  <FaSync className="animate-spin" />
                  Auto Refresh (ON)
                </>
              ) : (
                <>
                  <FaSync />
                  Auto Refresh (OFF)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${glassmorphismClasses.statCard} rounded-2xl p-4 backdrop-blur-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Sessions</p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">{totalSessions}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl">
                <FaListAlt className="text-blue-500 text-xl" />
              </div>
            </div>
          </div>
          
          <div className={`${glassmorphismClasses.statCard} rounded-2xl p-4 backdrop-blur-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Active Sessions</p>
                <p className="text-2xl font-bold mt-1 text-green-500">{activeSessions}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-xl">
                <FaPlayCircle className="text-green-500 text-xl" />
              </div>
            </div>
          </div>
          
          <div className={`${glassmorphismClasses.statCard} rounded-2xl p-4 backdrop-blur-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Distance</p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">{(totalDistance / 1000).toFixed(1)} km</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-sm rounded-xl">
                <FaRoad className="text-purple-500 text-xl" />
              </div>
            </div>
          </div>
          
          <div className={`${glassmorphismClasses.statCard} rounded-2xl p-4 backdrop-blur-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Users</p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">{users.length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500/20 to-amber-600/20 backdrop-blur-sm rounded-xl">
                <FaUser className="text-orange-500 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${glassmorphismClasses.card} rounded-2xl p-4 mb-6 backdrop-blur-lg`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaSearch className="inline mr-2" />
                Search Employee
              </label>
              <input
                type="text"
                placeholder="Search by name or employee code..."
                className={`w-full px-4 py-2 ${glassmorphismClasses.input} rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaUser className="inline mr-2" />
                Filter by User
              </label>
              <select
                className={`w-full px-4 py-2 ${glassmorphismClasses.input} rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30`}
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
            
            {/* Date Range Filter */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FaCalendarAlt className="inline mr-2" />
                  Filter by Date Range
                </label>
                {isDateFilterActive && (
                  <button
                    onClick={clearDateFilter}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                  >
                    Clear Date Filter
                  </button>
                )}
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className={`w-full px-4 py-2 ${glassmorphismClasses.input} rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30`}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || new Date().toISOString().split("T")[0]}
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className={`w-full px-4 py-2 ${glassmorphismClasses.input} rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30`}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              
              {isDateFilterActive && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <FaCalendarAlt className="text-xs" />
                  <span>
                    Showing sessions {startDate && `from ${new Date(startDate).toLocaleDateString()}`}
                    {startDate && endDate && ' to '}
                    {endDate && `${!startDate ? 'until ' : ''}${new Date(endDate).toLocaleDateString()}`}
                  </span>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaChartLine className="inline mr-2" />
                View Mode
              </label>
              <select
                className={`w-full px-4 py-2 ${glassmorphismClasses.input} rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30`}
                onChange={(e) => setViewMode(e.target.value as 'grouped' | 'individual')}
                value={viewMode}
              >
                <option value="grouped">Grouped by User/Date</option>
                <option value="individual">Individual Sessions</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List - Grouped View */}
      {groupedView.length === 0 ? (
        <div className={`${glassmorphismClasses.card} rounded-2xl p-12 text-center backdrop-blur-lg`}>
          <FaRoute className="text-gray-400 dark:text-gray-600 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Travel Sessions Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {isDateFilterActive || selectedUser || searchQuery 
              ? "Try adjusting your filters to see more results." 
              : "No travel sessions recorded yet."}
          </p>
          {isDateFilterActive && (
            <button
              onClick={clearDateFilter}
              className={`px-4 py-2 ${glassmorphismClasses.button.outline} rounded-xl`}
            >
              Clear Date Filter
            </button>
          )}
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-6">
          {groupedView.map((group) => {
            const groupDuration = calculateDuration(group.startTime, group.endTime);
            const formattedDate = new Date(group.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            return (
              <div key={`${group.userId}-${group.date}`} className={`${glassmorphismClasses.card} ${glassmorphismClasses.cardHover} rounded-2xl overflow-hidden backdrop-blur-lg`}>
                {/* Group Header */}
                <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 px-6 py-4 border-b border-white/10 dark:border-gray-700/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/80 to-indigo-600/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {group.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                          {group.username} 
                          <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-300">
                            ({group.employeeCode})
                          </span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                            <FaCalendarAlt className="text-sm" />
                            <span className="text-sm">
                              {formattedDate}
                            </span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 backdrop-blur-sm rounded-full text-xs font-semibold ${
                              group.activeSessions > 0 
                                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-700 dark:text-green-400'
                                : 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-700 dark:text-blue-400'
                            }`}>
                              {group.activeSessions > 0 ? `${group.activeSessions} Active` : 'All Completed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-600 dark:text-gray-300">Sessions</p>
                            <p className="text-lg font-bold text-gray-800 dark:text-white">{group.totalSessions}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 dark:text-gray-300">Distance</p>
                            <p className="text-lg font-bold text-gray-800 dark:text-white">{(group.totalDistance / 1000).toFixed(1)} km</p>
                            {group.firstSessionDistance > 0 && group.totalSessions > 1 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                (Excluding first session: {(group.firstSessionDistance / 1000).toFixed(1)} km)
                              </p>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 dark:text-gray-300">Reimbursement</p>
                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                              ₹ {((group.totalDistance / 1000) * 3.5).toFixed(1)}
                            </p>
                          </div>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Content */}
                <div className="p-6">
                  {/* Group Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                        <FaClock className="text-sm" />
                        <span className="text-xs font-medium">First Session</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatTimeOnly(group.sessions[0].startTime)}</p>
                    </div>
                    
                    <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                        <FaClock className="text-sm" />
                        <span className="text-xs font-medium">Last Session</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {formatTimeOnly(group.sessions[group.sessions.length - 1].endTime || 
                                      group.sessions[group.sessions.length - 1].startTime)}
                      </p>
                    </div>
                    
                    <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                        <FaRoad className="text-sm" />
                        <span className="text-xs font-medium">Total Distance</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{(group.totalDistance / 1000).toFixed(2)} km</p>
                      {group.firstSessionDistance > 0 && group.totalSessions > 1 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Original: {(group.originalTotalDistance / 1000).toFixed(2)} km
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                        <FaMapPin className="text-sm" />
                        <span className="text-xs font-medium">Total Points</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{group.totalPoints}</p>
                    </div>
                  </div>

                  {/* Session List */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm rounded-lg">
                        <FaListAlt className="text-blue-500" />
                      </div>
                      Sessions ({group.sessions.length})
                    </h4>
                    <div className="space-y-3">
                      {group.sessions.map((session, sessionIndex) => {
                        const sessionDuration = calculateDuration(session.startTime, session.endTime);
                        const isActive = !session.endTime;
                        const isFirstSession = sessionIndex === 0;
                        
                        return (
                          <div key={session.sessionId} className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold backdrop-blur-sm"
                                     style={{ backgroundColor: getSessionColor(sessionIndex) }}>
                                  {sessionIndex + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-800 dark:text-white">
                                      Session #{session.sessionId}
                                      {isFirstSession && (
                                        <span className="ml-2 px-2 py-1 backdrop-blur-sm bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                                          First Session (Excluded)
                                        </span>
                                      )}
                                    </span>
                                    {isActive && (
                                      <span className="px-2 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                                        LIVE - Updating
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    <span>{formatTimeOnly(session.startTime)} - {session.endTime ? formatTimeOnly(session.endTime) : 'Active'}</span>
                                    <span>•</span>
                                    <span>{(session.totalDistance / 1000).toFixed(2)} km</span>
                                    <span>•</span>
                                    <span>{Math.floor(sessionDuration.hours)}h {sessionDuration.minutes}m</span>
                                    {isFirstSession && (
                                      <>
                                        <span>•</span>
                                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                                          Distance excluded from total
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleFetchTravelData(
                                    session.userId.toString(), 
                                    group.date
                                  )}
                                  className={`px-3 py-2 bg-green-700 rounded-xl text-sm font-medium flex items-center gap-2`}
                                >
                                  <FaInfoCircle />
                                  Details
                                </button>
                                <button
                                  onClick={() => openMap(session)}
                                  className={`px-3 py-2 ${glassmorphismClasses.button.primary} rounded-xl text-sm font-medium flex items-center gap-2`}
                                >
                                  <FaEye />
                                  Single Map
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => openMultiSessionMap(group)}
                      className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-green-700 rounded-xl font-semibold`}
                    >
                      <FaLayerGroup className="text-xl" />
                      View All Sessions on Map
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                        {group.sessions.length} session{group.sessions.length > 1 ? 's' : ''}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        renderIndividualView
      )}

      {/* Farmer Data Modal */}
      {showFarmerDataModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div className={`${glassmorphismClasses.modal} w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600/90 to-orange-600/90 backdrop-blur-sm p-4 text-white flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg flex-shrink-0">
                    <FaCar className="text-lg" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold truncate">Travel Session Details</h2>
                    <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
                      <span className="truncate backdrop-blur-sm bg-white/10 px-2 py-1 rounded">
                        User ID: {selectedUserForFarmerData}
                      </span>
                      {users.find(u => u.userId.toString() === selectedUserForFarmerData)?.username && (
                        <>
                          <span className="text-white/50">•</span>
                          <span className="truncate">
                            User: {users.find(u => u.userId.toString() === selectedUserForFarmerData)?.username}
                          </span>
                        </>
                      )}
                      {selectedSessionDate && (
                        <>
                          <span className="text-white/50">•</span>
                          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded">
                            <FaCalendarAlt className="text-xs" />
                            <span className="truncate">
                              {new Date(selectedSessionDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                  <div className="text-center backdrop-blur-sm bg-white/10 px-3 py-2 rounded-lg">
                    <p className="text-xs opacity-80">Sessions</p>
                    <p className="font-bold">{farmerTravelData.length}</p>
                  </div>
                  {farmerTravelData.length > 0 && (
                    <div className="text-center backdrop-blur-sm bg-white/10 px-3 py-2 rounded-lg">
                      <p className="text-xs opacity-80">Showing</p>
                      <p className="font-bold">1-{Math.min(farmerTravelData.length, 10)}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={closeFarmerDataModal}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-lg transition-all flex-shrink-0"
                  title="Close"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingFarmerData ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading travel session data...</p>
                  </div>
                </div>
              ) : farmerDataError ? (
                <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-xl p-8 text-center">
                  <FaInfoCircle className="text-red-500 text-4xl mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Error Loading Data</h3>
                  <p className="text-red-600 dark:text-red-300">{farmerDataError}</p>
                </div>
              ) : farmerTravelData.length === 0 ? (
                <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 backdrop-blur-sm rounded-xl p-12 text-center border border-white/10 dark:border-gray-700/50">
                  <FaCar className="text-gray-400 dark:text-gray-600 text-5xl mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Travel Data Found</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    No travel sessions recorded for this user.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10 dark:border-gray-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Total Sessions</p>
                        <p className="text-2xl font-bold text-purple-500">{farmerTravelData.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Active Sessions</p>
                        <p className="text-2xl font-bold text-green-500">
                          {farmerTravelData.filter(s => s.isActive).length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Total Distance</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                          {(farmerTravelData.reduce((sum, s) => sum + (s.totalDistance || 0), 0) / 1000).toFixed(1)} km
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Total Farmers Met</p>
                        <p className="text-2xl font-bold text-orange-500">
                          {farmerTravelData.reduce((sum, s) => sum + (s.farmerData?.count || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sessions List */}
                  {farmerTravelData.map((session, index) => {
                    const duration = calculateDuration(session.startTime, session.endTime);
                    const farmerCount = session.farmerData?.count || 0;
                    
                    return (
                      <div key={session.sessionId} className={`${glassmorphismClasses.card} rounded-2xl overflow-hidden backdrop-blur-lg mb-6`}>
                        <div className="bg-gradient-to-r from-gray-500/10 via-gray-600/10 to-gray-700/10 px-6 py-4 border-b border-white/10 dark:border-gray-700/50">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-sm p-2 rounded-xl">
                                <FaRoute className="text-purple-500 dark:text-purple-400" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                                  Session #{session.sessionId}
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <span className={`px-2 py-1 backdrop-blur-sm rounded-full text-xs font-semibold ${session.isActive ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-700 dark:text-green-400' : 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-700 dark:text-blue-400'}`}>
                                    {session.status}
                                  </span>
                                  <span className="px-2 py-1 backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-full text-xs text-gray-600 dark:text-gray-400">
                                    {formatDateOnly(session.startTime)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 md:mt-0">
                              <div className="text-right">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {formatTimeOnly(session.startTime)} - {session.endTime ? formatTimeOnly(session.endTime) : 'Active'}
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                  Duration: {duration.hours}h {duration.minutes}m
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          {/* Session Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                                <FaClock />
                                <span className="text-sm font-medium">Duration</span>
                              </div>
                              <p className="text-lg font-bold text-gray-800 dark:text-white">
                                {duration.hours}h {duration.minutes}m
                              </p>
                            </div>
                            
                            <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                                <FaRoad />
                                <span className="text-sm font-medium">Distance</span>
                              </div>
                              <p className="text-lg font-bold text-gray-800 dark:text-white">
                                {(session.totalDistance / 1000).toFixed(2)} km
                              </p>
                            </div>
                            
                            <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                                <FaUser />
                                <span className="text-sm font-medium">Farmers Met</span>
                              </div>
                              <p className="text-lg font-bold text-purple-500">
                                {farmerCount}
                              </p>
                            </div>
                            
                            <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                                <FaMapPin />
                                <span className="text-sm font-medium">Location Logs</span>
                              </div>
                              <p className="text-lg font-bold text-blue-500">
                                {session.locationLogs?.count || 0}
                              </p>
                            </div>
                          </div>
                          
                          {/* Odometer Images Section */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                Start Odometer
                              </h4>
                              {renderOdometerImage(session.startOdometerImage)}
                            </div>
                            <div>
                              <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                End Odometer
                              </h4>
                              {renderOdometerImage(session.endOdometerImage)}
                            </div>
                          </div>
                          
                          {/* Farmer Data Section */}
                          {farmerCount > 0 && session.farmerData?.data && (
                            <div className="mb-6">
                              <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-sm rounded-lg">
                                  <FaUser className="text-purple-500" />
                                </div>
                                Farmers Met During This Session ({farmerCount})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {session.farmerData.data.map((farmer, farmerIndex) => (
                                  <div key={farmer.id || farmerIndex} className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <h5 className="font-bold text-gray-800 dark:text-white">
                                          {farmer.farmerName || `Farmer #${farmerIndex + 1}`}
                                        </h5>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                          Recorded: {formatDateTime(farmer.createdAt)}
                                        </p>
                                      </div>
                                      <span className="px-2 py-1 backdrop-blur-sm bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-400/30 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-full">
                                        ID: {farmer.id}
                                      </span>
                                    </div>
                                    
                                    {farmer.farmerDescription && (
                                      <div className="mb-3">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                          {farmer.farmerDescription}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {farmer.farmerImage && farmer.farmerImage.trim() !== '' && (
                                      <div className="mt-3">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Farmer Image:</p>
                                        <div className="rounded-xl overflow-hidden max-w-xs">
                                          {renderOdometerImage(farmer.farmerImage)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gradient-to-r from-gray-500/10 to-gray-600/10 backdrop-blur-sm border-t border-white/10 dark:border-gray-700/50 p-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Showing {farmerTravelData.length} session{farmerTravelData.length !== 1 ? 's' : ''}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      alert('Export functionality to be implemented');
                    }}
                    className={`px-4 py-2 ${glassmorphismClasses.button.primary} rounded-xl font-medium flex items-center gap-2`}
                  >
                    <FaDownload />
                    Export Data
                  </button>
                  <button
                    onClick={closeFarmerDataModal}
                    className={`px-6 py-2 ${glassmorphismClasses.button.outline} rounded-xl font-medium`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Session Map Modal */}
      {multiSessionMapView && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div className={`${glassmorphismClasses.modal} w-full h-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Map Header */}
            <div className="bg-gradient-to-r from-blue-500/90 to-indigo-600/90 backdrop-blur-sm p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <FaUser className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{multiSessionMapView.username}</h2>
                    <p className="text-blue-100">
                      {multiSessionMapView.employeeCode} • 
                      {new Date(multiSessionMapView.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })} • 
                      {multiSessionMapView.sessions.length} Session{multiSessionMapView.sessions.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowLogMarkersMulti(!showLogMarkersMulti)}
                    className={`px-4 py-2 backdrop-blur-sm rounded-lg flex items-center gap-2 ${showLogMarkersMulti ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    <FaMapPin />
                    {showLogMarkersMulti ? 'Hide Log Points' : 'Show Log Points'}
                  </button>
                  <button
                    onClick={closeMultiSessionMap}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all"
                  >
                    <span className="text-2xl">✕</span>
                  </button>
                </div>
              </div>
              
              {/* Session Legend */}
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {multiSessionMapView.sessions.map((session, index) => (
                    <div key={session.sessionId} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getSessionColor(index) }}
                      ></div>
                      <span className="text-sm font-medium">
                        Session #{session.sessionId}: {formatTimeOnly(session.startTime)} - {session.endTime ? formatTimeOnly(session.endTime) : 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
              <MapContainer
                center={multiSessionMapView.center}
                zoom={multiSessionMapView.zoom}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
                key={`multi-map-${multiSessionMapView.userId}-${multiSessionMapView.date}`}
              >
                <TileLayer
                  attribution="Google Maps"
                  url="https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}"
                />

                {/* Render all session polylines with different colors */}
                {multiSessionMapView.sessions.map((session, index) => {
                  const path = buildSessionPolylinePath(session);
                  if (path.length >= 2) {
                    const isActive = !session.endTime;
                    return (
                      <Polyline
                        key={`session-${session.sessionId}`}
                        positions={path}
                        pathOptions={{
                          color: getSessionColor(index),
                          weight: 5,
                          opacity: 0.8,
                          lineCap: "round",
                          lineJoin: "round",
                          dashArray: isActive ? "10, 5" : undefined,
                        }}
                      />
                    );
                  }
                  return null;
                })}

                {/* Start markers for each session */}
                {multiSessionMapView.sessions.map((session, index) => {
                  if (isValidCoordinate(session.startLatitude, session.startLongitude)) {
                    return (
                      <Marker
                        key={`start-${session.sessionId}`}
                        position={[
                          parseCoordinate(session.startLatitude), 
                          parseCoordinate(session.startLongitude)
                        ]}
                        icon={customIcons.startIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <strong>🟢 Start (Session #{session.sessionId})</strong><br />
                            <strong>Time:</strong> {formatDateTime(session.startTime)}<br />
                            <strong>Coordinates:</strong> {parseCoordinate(session.startLatitude).toFixed(6)}, {parseCoordinate(session.startLongitude).toFixed(6)}<br />
                            <div 
                              className="inline-block w-3 h-3 rounded-full mr-1"
                              style={{ backgroundColor: getSessionColor(index) }}
                            ></div>
                            <span>Session Color</span>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })}

                {/* End markers for each session */}
                {multiSessionMapView.sessions.map((session, index) => {
                  if (isValidCoordinate(session.endLatitude, session.endLongitude)) {
                    const isActive = !session.endTime;
                    return (
                      <Marker
                        key={`end-${session.sessionId}`}
                        position={[
                          parseCoordinate(session.endLatitude), 
                          parseCoordinate(session.endLongitude)
                        ]}
                        icon={isActive ? customIcons.activeIcon : customIcons.endIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <strong>{isActive ? '🟡 Active' : '🔴 End'} (Session #{session.sessionId})</strong><br />
                            <strong>Time:</strong> {isActive ? 'Active' : formatDateTime(session.endTime)}<br />
                            <strong>Coordinates:</strong> {parseCoordinate(session.endLatitude).toFixed(6)}, {parseCoordinate(session.endLongitude).toFixed(6)}<br />
                            <strong>Distance:</strong> {(session.totalDistance / 1000).toFixed(2)} km<br />
                            <div 
                              className="inline-block w-3 h-3 rounded-full mr-1"
                              style={{ backgroundColor: getSessionColor(index) }}
                            ></div>
                            <span>Session Color</span>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })}

                {/* Log points markers for each session */}
                {showLogMarkersMulti && multiSessionMapView.sessions.map((session, sessionIndex) => (
                  session.logs && session.logs.slice(0, 50).map((log, logIndex) => { // Limit to 50 points per session for performance
                    if (isValidCoordinate(log.latitude, log.longitude)) {
                      const isPausePoint = log.pause;
                      
                      return (
                        <Marker
                          key={`log-${session.sessionId}-${log.id || logIndex}`}
                          position={[
                            parseCoordinate(log.latitude), 
                            parseCoordinate(log.longitude)
                          ]}
                          icon={L.divIcon({
                            className: 'custom-marker',
                            html: `
                              <div style="
                                width: 8px;
                                height: 8px;
                                background-color: ${getSessionColor(sessionIndex)};
                                border: 1px solid white;
                                border-radius: 50%;
                                opacity: 0.7;
                                cursor: pointer;
                              "></div>
                            `,
                            iconSize: [8, 8],
                            iconAnchor: [4, 4]
                          })}
                        >
                          <Popup>
                            <div className="text-sm min-w-[200px]">
                              <div className="flex items-center gap-2 mb-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: getSessionColor(sessionIndex) }}
                                ></div>
                                <strong>Session #{session.sessionId} - Point #{logIndex + 1}</strong>
                              </div>
                              <div className="space-y-1">
                                <div><strong>Time:</strong> {formatDateTime(log.timestamp)}</div>
                                <div><strong>Coordinates:</strong> {parseCoordinate(log.latitude).toFixed(6)}, {parseCoordinate(log.longitude).toFixed(6)}</div>
                                <div><strong>Speed:</strong> {log.speed ? `${log.speed} km/h` : 'N/A'}</div>
                                <div><strong>Status:</strong> {isPausePoint ? '⏸️ Pause' : 'Moving'}</div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    }
                    return null;
                  })
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* Single Session Map Modal */}
      {mapView && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div className={`${glassmorphismClasses.modal} w-full h-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="bg-gradient-to-r from-blue-500/90 to-indigo-600/90 backdrop-blur-sm p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <FaUser className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{mapView.username}</h2>
                    <p className="text-blue-100">Employee Code: {mapView.employeeCode} • Session ID: #{mapView.sessionId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowLogMarkers(!showLogMarkers)}
                    className={`px-4 py-2 backdrop-blur-sm rounded-lg flex items-center gap-2 ${showLogMarkers ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    <FaMapPin />
                    {showLogMarkers ? 'Hide Log Points' : 'Show Log Points'}
                  </button>
                  <button
                    onClick={closeMap}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all"
                  >
                    <span className="text-2xl">✕</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 relative">
              <MapContainer
                center={getMapCenter(mapView)}
                zoom={getMapZoom(mapView)}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
                key={`map-${mapView.sessionId}-${lastUpdateTime?.getTime()}`}
              >
                <TileLayer
                  attribution="Google Maps"
                  url="https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}"
                />

                {/* Polyline for the travel path */}
                {(() => {
                  const path = buildPolylinePath(mapView);
                  if (path.length >= 2) {
                    const isActive = !mapView.endTime;
                    return (
                      <Polyline
                        positions={path}
                        pathOptions={{
                          color: isActive ? "#10B981" : "#3B82F6",
                          weight: 6,
                          opacity: 0.8,
                          lineCap: "round",
                          lineJoin: "round",
                          dashArray: isActive ? "10, 5" : undefined
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
                    icon={customIcons.startIcon}
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

                {/* End marker */}
                {isValidCoordinate(mapView.endLatitude, mapView.endLongitude) && (
                  <Marker
                    position={[
                      parseCoordinate(mapView.endLatitude), 
                      parseCoordinate(mapView.endLongitude)
                    ]}
                    icon={!mapView.endTime ? customIcons.activeIcon : customIcons.endIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>{!mapView.endTime ? '🟡 Active Point' : '🔴 End Point'}</strong><br />
                        <strong>User:</strong> {mapView.username}<br />
                        <strong>Time:</strong> {!mapView.endTime ? 'Active' : formatDateTime(mapView.endTime)}<br />
                        <strong>Coordinates:</strong> {parseCoordinate(mapView.endLatitude).toFixed(6)}, {parseCoordinate(mapView.endLongitude).toFixed(6)}<br />
                        <strong>Total Distance:</strong> {(mapView.totalDistance / 1000).toFixed(2)} km
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Log points markers */}
                {showLogMarkers && mapView.logs && mapView.logs.map((log, logIndex) => {
                  if (isValidCoordinate(log.latitude, log.longitude)) {
                    const logDate = new Date(log.timestamp);
                    const isPausePoint = log.pause || 
                      (logIndex > 0 && 
                       (new Date(log.timestamp).getTime() - 
                        new Date(mapView.logs[logIndex - 1].timestamp).getTime()) > 
                        2 * 60 * 1000); // 2 minute threshold
                    
                    return (
                      <Marker
                        key={`log-${log.id || logIndex}`}
                        position={[
                          parseCoordinate(log.latitude), 
                          parseCoordinate(log.longitude)
                        ]}
                        icon={L.divIcon({
                          className: 'custom-marker',
                          html: `
                            <div style="
                              width: 12px;
                              height: 12px;
                              background-color: ${isPausePoint ? '#FFA500' : '#6366F1'};
                              border: 2px solid white;
                              border-radius: 50%;
                              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                              cursor: pointer;
                            "></div>
                          `,
                          iconSize: [12, 12],
                          iconAnchor: [6, 6]
                        })}
                      >
                        <Popup>
                          <div className="text-sm min-w-[200px]">
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: isPausePoint ? '#FFA500' : '#6366F1' }}
                              ></div>
                              <strong>{isPausePoint ? '⏸️ Pause Point' : '📍 Log Point'}</strong>
                            </div>
                            <div className="space-y-1">
                              <div><strong>Time:</strong> {formatDateTime(log.timestamp)}</div>
                              <div><strong>Coordinates:</strong> {parseCoordinate(log.latitude).toFixed(6)}, {parseCoordinate(log.longitude).toFixed(6)}</div>
                              <div><strong>Speed:</strong> {log.speed ? `${log.speed} km/h` : 'N/A'}</div>
                              <div><strong>Battery:</strong> {log.battery ? `${log.battery}%` : 'N/A'}</div>
                              <div><strong>Point #:</strong> {logIndex + 1} of {mapView.logs.length}</div>
                              {log.pause && <div className="text-amber-600 font-medium">⏸️ Pause detected</div>}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}