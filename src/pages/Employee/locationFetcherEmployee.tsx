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
  FaDownload,
  FaFileCsv,
  FaInfoCircle,
  FaTimes,
  FaPlayCircle,
  FaMapPin,
  FaSearch,
  FaCar,
  FaEye,
  FaListAlt,
  FaLayerGroup,
  FaChartLine,
  FaSpinner,
  FaChevronDown,
  FaPauseCircle,
} from "react-icons/fa";

import ImageZoom from "../../components/ImageZoom";
import PageMeta from "../../components/common/PageMeta";

import LoadingAnimation from "../UiElements/loadingAnimation";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

// Interface for Travel Sessions API response
interface TravelSession {
  sessionId: number;
  fullName: string;
  userId: number;
  username: string;
  employeeCode: string;
  startTime: string;
  startLatitude: string;
  startLongitude: string;
  role?: string;
  endTime: string;
  endLatitude: string;
  endLongitude: string;
  startOdometer: string;
  endOdometer: string;
  totalDistance: number;
  department?: string;
  allocatedArea?: string;
  totalSessions?: number;
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
  fullName?: string;
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
  isLoading?: boolean;
  hasMoreSessions?: boolean;
  allSessionsLoaded?: boolean;
}

interface MultiSessionMapView {
  userId: number;
  username: string;
  fullName: string;
  employeeCode: string;
  date: string;
  sessions: TravelSession[];
  center: [number, number];
  zoom: number;
}

interface ApiPaginationResponse {
  success: boolean;
  data: TravelSession[];
  currentPage: number;
  totalPages: number;
  limit: number;
  hasNextPage: boolean;
  totalSessions: number;
}

interface UserInfo {
  userRole?: string;
  department?: string;
  allocatedArea?: string;
}

// Interface for logs API response
interface SessionLogsResponse {
  success: boolean;
  sessionInfo: {
    sessionId: number;
    userId: number;
    username: string;
    employeeCode: string;
    startTime: string;
    endTime: string;
    totalLogs: number;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    totalLogs: number;
    logsInPage: number;
  };
  data: LocationLog[];
}

// ============ FIX: Utility function to filter logs by session time ============
const filterLogsBySessionTime = (
  logs: LocationLog[],
  sessionStartTime: string,
  sessionEndTime?: string,
): LocationLog[] => {
  if (!logs || logs.length === 0) return [];

  const sessionStart = new Date(sessionStartTime).getTime();
  const sessionEnd = sessionEndTime ? new Date(sessionEndTime).getTime() : null;

  // Get the session date (without time)
  const sessionDate = new Date(sessionStartTime);
  sessionDate.setHours(0, 0, 0, 0);
  const sessionDateStart = sessionDate.getTime();
  const sessionDateEnd = sessionDateStart + 24 * 60 * 60 * 1000 - 1; // End of the day

  // Filter logs that fall within the session's date and time range
  return logs.filter((log) => {
    const logTime = new Date(log.timestamp).getTime();

    // First, check if log is on the same date as the session
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);
    const logDateOnly = logDate.getTime();

    // If log is not on the same date as session, filter it out
    if (logDateOnly !== sessionDateStart) {
      return false;
    }

    // If session has ended, check if log is between start and end time
    if (sessionEnd) {
      return logTime >= sessionStart && logTime <= sessionEnd;
    }

    // For active sessions, allow logs from session start to current time
    // with a small buffer for timezone differences
    const now = new Date().getTime();
    return logTime >= sessionStart && logTime <= now;
  });
};

// ============ FIX: Filter and map logs to session ============
const filterAndMapLogsToSession = (
  logs: LocationLog[],
  session: TravelSession,
): LocationLog[] => {
  if (!logs || logs.length === 0) return [];
  if (!session) return logs;

  // Filter logs by the session's actual time range
  return filterLogsBySessionTime(
    logs,
    session.startTime,
    session.endTime || undefined,
  );
};

// ============ FIX: Role-based filtering helper functions ============
// Helper to normalize role string for comparison
const normalizeRole = (role: string): string => {
  if (!role) return "";
  return role.toLowerCase().trim();
};

// Check if user has admin or HR role (can see all)
const isAdminOrHR = (role: string): boolean => {
  const normalized = normalizeRole(role);
  return (
    normalized === "admin" ||
    normalized === "superadmin" ||
    normalized === "hr" ||
    normalized === "hr_manager" ||
    normalized.includes("admin") ||
    normalized.includes("hr")
  );
};

// Check if user is a Manager
const isManager = (role: string): boolean => {
  const normalized = normalizeRole(role);
  return (
    normalized === "manager" ||
    normalized === "manager" ||
    normalized.includes("manager")
  );
};

// Check if user is a Zonal Manager
const isZonalManager = (role: string): boolean => {
  const normalized = normalizeRole(role);
  return (
    normalized === "zonalmanager" ||
    normalized === "zonal_manager" ||
    normalized === "zonal manager" ||
    normalized.includes("zonal")
  );
};

// Check if user is HOD
const isHOD = (role: string): boolean => {
  const normalized = normalizeRole(role);
  return (
    normalized === "headofdepartment" ||
    normalized === "headofdepartment" ||
    normalized === "headofdepartment" ||
    normalized.includes("headofdepartment")
  );
};

// Glassmorphism CSS classes
const glassmorphismClasses = {
  card: "backdrop-blur-lg bg-white/10 dark:bg-gray-800/30 border border-white/20 dark:border-gray-700/50 shadow-xl",
  cardHover:
    "hover:bg-white/15 dark:hover:bg-gray-800/40 hover:border-white/30 dark:hover:border-gray-600/50 transition-all duration-300",
  input:
    "backdrop-blur-sm bg-white/5 dark:bg-gray-800/20 border border-white/10 dark:border-gray-700/30 focus:border-white/30 dark:focus:border-blue-500/50 focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30",
  button: {
    primary:
      "backdrop-blur-sm bg-lantern-blue-600 hover:from-blue-600 hover:to-indigo-700 border border-blue-400/20 dark:border-blue-500/30 text-white shadow-lg hover:shadow-xl transition-all duration-300",
    secondary:
      "backdrop-blur-sm bg-gradient-to-r from-purple-500/90 to-pink-600/90 hover:from-purple-600 hover:to-pink-700 border border-purple-400/20 dark:border-purple-500/30 text-white shadow-lg hover:shadow-xl transition-all duration-300",
    outline:
      "backdrop-blur-sm bg-white/5 dark:bg-gray-800/20 border border-white/20 dark:border-gray-600/50 text-gray-800 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-800/30 transition-all duration-300",
  },
  statCard:
    "backdrop-blur-lg bg-gradient-to-br from-white/15 to-white/5 dark:from-gray-800/30 dark:to-gray-900/20 border border-white/20 dark:border-gray-700/50 shadow-lg",
  modal:
    "backdrop-blur-xl bg-white/20 dark:bg-gray-900/30 border border-white/30 dark:border-gray-700/50 shadow-2xl",
};

// Color palette for session polylines
const SESSION_COLORS = [
  "#FF0000",
  "#0000FF",
  "#00FF00",
  "#FFA500",
  "#800080",
  "#FF69B4",
  "#00FFFF",
  "#FFD700",
  "#008000",
  "#FF4500",
  "#4B0082",
  "#FF1493",
  "#00FF7F",
  "#8B4513",
  "#000080",
  "#808000",
  "#DC143C",
  "#FF8C00",
  "#9932CC",
  "#20B2CD",
];

const getSessionColor = (index: number): string => {
  return SESSION_COLORS[index % SESSION_COLORS.length];
};

export default function AttendanceList() {
  const [travelSessions, setTravelSessions] = useState<TravelSession[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, TravelSession>>(
    {},
  );
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [mapView, setMapView] = useState<TravelSession | null>(null);
  const [users, setUsers] = useState<
    {
      userId: number;
      fullName: string;
      username: string;
      employeeCode: string;
      department?: string;
      allocatedArea?: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeSessionsOnly, setActiveSessionsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedSessionDate, setSelectedSessionDate] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Grouped view states
  const [groupedView, setGroupedView] = useState<GroupedSession[]>([]);
  const [multiSessionMapView, setMultiSessionMapView] =
    useState<MultiSessionMapView | null>(null);
  const [viewMode, setViewMode] = useState<"grouped" | "individual">("grouped");

  // Farmer data state
  const [farmerTravelData, setFarmerTravelData] = useState<FarmerTravelData[]>(
    [],
  );
  const [showFarmerDataModal, setShowFarmerDataModal] = useState(false);
  const [selectedUserForFarmerData, setSelectedUserForFarmerData] =
    useState<string>("");
  const [isLoadingFarmerData, setIsLoadingFarmerData] = useState(false);
  const [farmerDataError, setFarmerDataError] = useState<string | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Map marker states
  const [showLogMarkers, setShowLogMarkers] = useState(true);
  const [showLogMarkersMulti, setShowLogMarkersMulti] = useState(true);
  const [showPauseMarkers, setShowPauseMarkers] = useState(true);

  // State for all sessions and farmer data
  const [allSessions, setAllSessions] = useState<TravelSession[]>([]);
  const [allFarmerData, setAllFarmerData] = useState<Record<string, any>>({});
  const [isLoadingAllSessions, setIsLoadingAllSessions] = useState(false);

  // Current user info from localStorage
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);

  const [totalSessionsCount, setTotalSessionsCount] = useState<number>(0);

  // NEW: State for session logs
  const [sessionLogs, setSessionLogs] = useState<Record<number, LocationLog[]>>(
    {},
  );
  const [loadingLogs, setLoadingLogs] = useState<Record<number, boolean>>({});
  const [logsPagination, setLogsPagination] = useState<Record<number, any>>({});

  const [isSearching, setIsSearching] = useState(false);

  // Custom icons for markers
  const customIcons = {
    startIcon: new L.Icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    }),
    endIcon: new L.Icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    }),
    activeIcon: new L.Icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    }),
    pauseIcon: new L.Icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [19, 31],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [21, 21],
    }),
  };

  // ============ FIX: Updated getUserInfo with better role detection ============
  // Get current user info from localStorage
  useEffect(() => {
    const getUserInfo = () => {
      try {
        const userDataStr = localStorage.getItem("user");
        let userData = null;
        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr);
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }

        // Try multiple sources for role
        let userRole = "";
        if (localStorage.getItem("userRole")) {
          userRole = localStorage.getItem("userRole") || "";
        } else if (localStorage.getItem("role")) {
          userRole = localStorage.getItem("role") || "";
        } else if (localStorage.getItem("user_role")) {
          userRole = localStorage.getItem("user_role") || "";
        } else if (userData?.userRole) {
          userRole = userData.userRole;
        } else if (userData?.role) {
          userRole = userData.role;
        } else if (userData?.user_role) {
          userRole = userData.user_role;
        }

        // Try multiple sources for department
        let department = localStorage.getItem("department") || "";
        if (!department && userData?.department) {
          department = userData.department;
        } else if (!department && userData?.dept) {
          department = userData.dept;
        }

        // Try multiple sources for allocated area
        let allocatedArea = localStorage.getItem("allocatedarea") || "";
        if (!allocatedArea && userData?.allocatedArea) {
          allocatedArea = userData.allocatedArea;
        } else if (!allocatedArea && userData?.area) {
          allocatedArea = userData.area;
        } else if (!allocatedArea && userData?.allocated_area) {
          allocatedArea = userData.allocated_area;
        }

      

        setCurrentUserInfo({
          userRole: userRole.toLowerCase().trim(),
          department: department.toLowerCase().trim(),
          allocatedArea: allocatedArea.toLowerCase().trim(),
        });
      } catch (error) {
        console.error("Error getting user info from localStorage:", error);
        setCurrentUserInfo(null);
      }
    };

    getUserInfo();
  }, []);

  // ============ FIX: Updated filterSessionsByRole with correct logic ============
  const filterSessionsByRole = useCallback(
    (sessions: TravelSession[]): TravelSession[] => {
      if (!currentUserInfo?.userRole) {
        return sessions;
      }

      const userRole = currentUserInfo.userRole.toLowerCase().trim();

      // Admin or HR - can see all sessions
      if (isAdminOrHR(userRole)) {
        return sessions;
      }

      // Manager - can only see sessions of their department users
      if (isManager(userRole) || isHOD(userRole)) {
        const managerDepartment = currentUserInfo.department
          ?.toLowerCase()
          .trim();
        if (!managerDepartment) {
          console.warn("Manager/HOD role but no department found");
          return [];
        }

        const filtered = sessions.filter((session) => {
          const sessionDept = (session.department || "").toLowerCase().trim();
          return sessionDept === managerDepartment;
        });

       
        return filtered;
      }

      // Zonal Manager - can only see sessions of users in their zone
      if (isZonalManager(userRole)) {
        const zonalArea = currentUserInfo.allocatedArea?.toLowerCase().trim();
        if (!zonalArea) {
          console.warn("ZonalManager role but no allocated area found");
          return [];
        }

        const filtered = sessions.filter((session) => {
          const sessionArea = (session.allocatedArea || "")
            .toLowerCase()
            .trim();
          return sessionArea === zonalArea;
        });

       
        return filtered;
      }

      // Default: return all sessions if no specific role matches
      return sessions;
    },
    [currentUserInfo],
  );

  // ============ FIX: Updated filterUsersByRole with correct logic ============
  const filterUsersByRole = useCallback(
    (usersList: typeof users): typeof users => {
      if (!currentUserInfo?.userRole) {
        return usersList;
      }

      const userRole = currentUserInfo.userRole.toLowerCase().trim();

      // Admin or HR - can see all users
      if (isAdminOrHR(userRole)) {
        return usersList;
      }

      // Manager or HOD - can only see users in their department
      if (isManager(userRole) || isHOD(userRole)) {
        const managerDepartment = currentUserInfo.department
          ?.toLowerCase()
          .trim();
        if (!managerDepartment) {
          console.warn("Manager/HOD role but no department found");
          return [];
        }

        const filtered = usersList.filter((user) => {
          const userDept = (user.department || "").toLowerCase().trim();
          return userDept === managerDepartment;
        });

        return filtered;
      }

      // Zonal Manager - can only see users in their zone
      if (isZonalManager(userRole)) {
        const zonalArea = currentUserInfo.allocatedArea?.toLowerCase().trim();
        if (!zonalArea) {
          console.warn("ZonalManager role but no allocated area found");
          return [];
        }

        const filtered = usersList.filter((user) => {
          const userArea = (user.allocatedArea || "").toLowerCase().trim();
          return userArea === zonalArea;
        });

       
        return filtered;
      }

      // Default: return all users
      return usersList;
    },
    [currentUserInfo],
  );

  // ============ FIX: Check if user has permission to view a specific session ============
  const hasPermissionToViewSession = useCallback(
    (session: TravelSession): boolean => {
      if (!currentUserInfo?.userRole) {
        return true;
      }

      const userRole = currentUserInfo.userRole.toLowerCase().trim();

      // Admin or HR - can view all
      if (isAdminOrHR(userRole)) {
        return true;
      }

      // Manager or HOD - can only view sessions of their department
      if (isManager(userRole) || isHOD(userRole)) {
        const managerDepartment = currentUserInfo.department
          ?.toLowerCase()
          .trim();
        if (!managerDepartment) return false;
        const sessionDept = (session.department || "").toLowerCase().trim();
        return sessionDept === managerDepartment;
      }

      // Zonal Manager - can only view sessions of their zone
      if (isZonalManager(userRole)) {
        const zonalArea = currentUserInfo.allocatedArea?.toLowerCase().trim();
        if (!zonalArea) return false;
        const sessionArea = (session.allocatedArea || "").toLowerCase().trim();
        return sessionArea === zonalArea;
      }

      return true;
    },
    [currentUserInfo],
  );

  // Format date without time (YYYY-MM-DD)
  const formatDateOnly = useCallback((dateTimeStr: string): string => {
    if (!dateTimeStr) return "";
    const date = new Date(dateTimeStr);
    return date.toISOString().split("T")[0];
  }, []);

  // Calculate distance minus first session distance
  const calculateAdjustedGroupDistance = useCallback(
    (
      sessions: TravelSession[],
    ): {
      totalDistance: number;
      firstSessionDistance: number;
      originalTotalDistance: number;
      excludedSessions: number;
    } => {
      if (sessions.length === 0) {
        return {
          totalDistance: 0,
          firstSessionDistance: 0,
          originalTotalDistance: 0,
          excludedSessions: 0,
        };
      }

      // sort by start time
      const sortedSessions = [...sessions].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );

      const role = (sortedSessions[0].role || "")
        .toLowerCase()
        .replace(/\s/g, "");
     

      const originalTotalDistance = sortedSessions.reduce(
        (sum, s) => sum + (s.totalDistance || 0),
        0,
      );

      // Exclude first session ONLY for fieldemployee
      const shouldExcludeFirst = role === "fieldemployee";
     

      if (!shouldExcludeFirst) {
        return {
          totalDistance: originalTotalDistance,
          firstSessionDistance: 0,
          originalTotalDistance,
          excludedSessions: 0,
        };
      }

      const firstSessionDistance = sortedSessions[0].totalDistance || 0;

      return {
        totalDistance: originalTotalDistance - firstSessionDistance,
        firstSessionDistance,
        originalTotalDistance,
        excludedSessions: 1,
      };
    },
    [],
  );

  // ============ FIX: Updated fetchSessionLogs with filtering ============
  const fetchSessionLogs = async (sessionId: number, page: number = 1) => {
    setLoadingLogs((prev) => ({ ...prev, [sessionId]: true }));

    try {
      const response = await API.get<SessionLogsResponse>(
        `/admin/travel-sessions/${sessionId}/logs`,
        {
          params: { page, limit: 100 },
        },
      );

      if (response.data.success) {
        const logs = response.data.data;

        // Get the session from cache or state
        const session =
          sessionsMap[`${sessionId}`] ||
          travelSessions.find((s) => s.sessionId === sessionId);

        let filteredLogs = logs;

        // ============ FIX: Filter logs by session time ============
        if (session) {
          filteredLogs = filterAndMapLogsToSession(logs, session);

          // Log filtering info for debugging
          if (filteredLogs.length < logs.length) {
            console.group(`Session ${sessionId} - Log Filtering`);
           
            
            console.groupEnd();
          }
        }

        // Update session logs with filtered logs
        setSessionLogs((prev) => ({
          ...prev,
          [sessionId]:
            page === 1
              ? filteredLogs
              : [...(prev[sessionId] || []), ...filteredLogs],
        }));

        // Store pagination info
        setLogsPagination((prev) => ({
          ...prev,
          [sessionId]: response.data.pagination,
        }));

        return filteredLogs;
      }
    } catch (error) {
      console.error(`Failed to fetch logs for session ${sessionId}:`, error);
    } finally {
      setLoadingLogs((prev) => ({ ...prev, [sessionId]: false }));
    }

    return [];
  };

  // Group sessions by user and date with correct sorting
  const groupSessionsByUserAndDate = useCallback(
    (sessions: TravelSession[]): GroupedSession[] => {
      const groupedMap = new Map<string, GroupedSession>();

      const sortedSessions = [...sessions].sort((a, b) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateB.getTime() - dateA.getTime();
      });

      sortedSessions.forEach((session) => {
        const dateKey = formatDateOnly(session.startTime);
        const groupKey = `${session.userId}-${dateKey}`;

        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, {
            userId: session.userId,
            username: session.username,
            employeeCode: session.employeeCode,
            fullName: session.fullName,
            date: dateKey,
            sessions: [session],
            totalSessions: 1,
            totalDistance: 0,
            firstSessionDistance: 0,
            originalTotalDistance: 0,
            activeSessions: session.endTime ? 0 : 1,
            startTime: session.startTime,
            endTime: session.endTime || session.startTime,
            totalPoints: 0,
            isLoading: false,
            hasMoreSessions: false,
            allSessionsLoaded: true,
          });
        } else {
          const existingGroup = groupedMap.get(groupKey)!;

          const sessionExists = existingGroup.sessions.some(
            (s) => s.sessionId === session.sessionId,
          );
          if (!sessionExists) {
            const insertIndex = existingGroup.sessions.findIndex(
              (s) =>
                new Date(s.startTime).getTime() >
                new Date(session.startTime).getTime(),
            );

            if (insertIndex === -1) {
              existingGroup.sessions.push(session);
            } else {
              existingGroup.sessions.splice(insertIndex, 0, session);
            }

            existingGroup.totalSessions += 1;
            existingGroup.activeSessions += session.endTime ? 0 : 1;

            if (
              new Date(session.startTime) < new Date(existingGroup.startTime)
            ) {
              existingGroup.startTime = session.startTime;
            }

            const sessionEndTime = session.endTime || session.startTime;
            if (new Date(sessionEndTime) > new Date(existingGroup.endTime)) {
              existingGroup.endTime = sessionEndTime;
            }
          }
        }
      });

      const groups = Array.from(groupedMap.values()).map((group) => {
       
        const distanceData = calculateAdjustedGroupDistance(group.sessions);
       
        // Calculate total points from filtered logs
        let totalPoints = 0;
        group.sessions.forEach((session) => {
          const logs = sessionLogs[session.sessionId] || [];
          // Use filtered logs for point count
          const filteredLogs = filterAndMapLogsToSession(logs, session);
          totalPoints += filteredLogs.length;
        });

        return {
          ...group,
          totalDistance: distanceData.totalDistance,
          firstSessionDistance: distanceData.firstSessionDistance,
          originalTotalDistance: distanceData.originalTotalDistance,
          totalPoints: totalPoints,
        };
      });

      return groups.sort((a, b) => {
        const getLatestSessionTime = (group: GroupedSession): Date => {
          const latestSession = group.sessions.reduce((latest, current) => {
            const latestTime = new Date(latest.startTime).getTime();
            const currentTime = new Date(current.startTime).getTime();
            return currentTime > latestTime ? current : latest;
          }, group.sessions[0]);
          return new Date(latestSession.startTime);
        };

        const aLatestTime = getLatestSessionTime(a);
        const bLatestTime = getLatestSessionTime(b);

        return bLatestTime.getTime() - aLatestTime.getTime();
      });
    },
    [formatDateOnly, calculateAdjustedGroupDistance, sessionLogs],
  );

  // Calculate duration in hours and minutes
  const calculateDuration = useCallback(
    (startTime: string, endTime: string) => {
      if (!startTime) return { hours: 0, minutes: 0 };

      const start = new Date(startTime);
      const end = endTime ? new Date(endTime) : new Date();
      const durationMs = end.getTime() - start.getTime();

      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

      return { hours, minutes };
    },
    [],
  );

  // Initial fetch
  useEffect(() => {
    if (currentUserInfo) {
      fetchTravelSessions();
      loadAllSessionsForExport();
    }
  }, [currentUserInfo]);

  // Fetch all travel sessions with pagination
  const fetchTravelSessions = async (
    page: number = 1,
    append: boolean = false,
  ) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params: any = { page };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedUser) params.userId = selectedUser;
      if (searchQuery) params.search = searchQuery;

      // ============ FIX: Apply role-based filtering at API level ============
      if (currentUserInfo?.userRole) {
        const userRole = currentUserInfo.userRole.toLowerCase().trim();

        // Manager or HOD - filter by department at API level
        if (isManager(userRole) || isHOD(userRole)) {
          if (currentUserInfo.department) {
            params.department = currentUserInfo.department;
          }
        }

        // Zonal Manager - filter by allocated area at API level
        if (isZonalManager(userRole)) {
          if (currentUserInfo.allocatedArea) {
            params.allocatedArea = currentUserInfo.allocatedArea;
          }
        }

        // Admin/HR - no additional filters
      }

      const res = await API.get<ApiPaginationResponse>(
        "/admin/travel-sessions",
        { params },
      );

      if (res.data.success) {
        const sessions = res.data.data || [];

        setTotalSessionsCount(res.data.totalSessions || sessions.length);

        // ============ FIX: Apply role-based filtering on the response ============
        let filteredSessions = sessions;
        if (currentUserInfo?.userRole) {
          filteredSessions = filterSessionsByRole(sessions);
        }

        if (append) {
          setTravelSessions((prev) => {
            const existingIds = new Set(prev.map((s) => s.sessionId));
            const newSessions = filteredSessions.filter(
              (s) => !existingIds.has(s.sessionId),
            );
            return [...prev, ...newSessions];
          });
        } else {
          setTravelSessions(filteredSessions);
        }

        const allLoadedSessions = append
          ? [...travelSessions, ...filteredSessions]
          : filteredSessions;

        // ============ FIX: Filter users based on role ============
        const uniqueUsers = Array.from(
          new Map(
            filteredSessions.map((session) => [
              session.userId,
              {
                userId: session.userId,
                fullName: session.fullName,
                employeeCode: session.employeeCode,
                department: session.department || "Unknown",
                allocatedArea: session.allocatedArea || "Unknown",
              },
            ]),
          ).values(),
        );

        const filteredUsers = filterUsersByRole(uniqueUsers);
        setUsers(filteredUsers);

        const newCache: Record<string, TravelSession> = {};
        filteredSessions.forEach((session) => {
          const key = `${session.userId}-${session.sessionId}`;
          newCache[key] = session;
        });
        setSessionsMap((prev) => ({ ...prev, ...newCache }));

        const grouped = groupSessionsByUserAndDate(allLoadedSessions);
        setGroupedView(grouped);

        setCurrentPage(res.data.currentPage || 1);
        setTotalPages(res.data.totalPages || 1);
        setHasMore(res.data.hasNextPage || false);

        setLastUpdateTime(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch travel sessions", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load more sessions for infinite scroll
  const loadMoreSessions = async () => {
    if (!hasMore || isLoading || isLoadingMore) return;

    const nextPage = currentPage + 1;
    await fetchTravelSessions(nextPage, true);
  };

  // Load more sessions for a specific user on a specific date
  const loadMoreSessionsForUser = async (userId: number, date: string) => {
    const groupIndex = groupedView.findIndex(
      (g) => g.userId === userId && g.date === date,
    );
    if (groupIndex === -1) return;

    setGroupedView((prev) => {
      const updated = [...prev];
      updated[groupIndex] = {
        ...updated[groupIndex],
        isLoading: true,
      };
      return updated;
    });

    try {
      const params: any = {
        userId,
        startDate: date,
        endDate: date,
        per_page: 1000,
      };

      // ============ FIX: Apply role-based filtering at API level ============
      if (currentUserInfo?.userRole) {
        const userRole = currentUserInfo.userRole.toLowerCase().trim();

        if (isManager(userRole) || isHOD(userRole)) {
          if (currentUserInfo.department) {
            params.department = currentUserInfo.department;
          }
        }

        if (isZonalManager(userRole)) {
          if (currentUserInfo.allocatedArea) {
            params.allocatedArea = currentUserInfo.allocatedArea;
          }
        }
      }

      const res = await API.get<ApiPaginationResponse>(
        "/admin/travel-sessions",
        { params },
      );

      if (res.data.success) {
        const userDateSessions = res.data.data || [];

        // ============ FIX: Apply role-based filtering ============
        let filteredSessions = userDateSessions;
        if (currentUserInfo?.userRole) {
          filteredSessions = filterSessionsByRole(userDateSessions);
        }

        setTravelSessions((prev) => {
          const filtered = prev.filter(
            (s) =>
              !(s.userId === userId && formatDateOnly(s.startTime) === date),
          );
          return [...filtered, ...filteredSessions];
        });

        setGroupedView((prev) => {
          const updated = [...prev];
          const group = updated[groupIndex];

          const existingSessionIds = new Set(
            group.sessions.map((s) => s.sessionId),
          );
          const newSessions = filteredSessions.filter(
            (s) => !existingSessionIds.has(s.sessionId),
          );

          if (newSessions.length > 0) {
            const allSessions = [...group.sessions, ...newSessions].sort(
              (a, b) =>
                new Date(b.startTime).getTime() -
                new Date(a.startTime).getTime(),
            );

            const distanceData = calculateAdjustedGroupDistance(allSessions);

            updated[groupIndex] = {
              ...group,
              sessions: allSessions,
              totalSessions: allSessions.length,
              totalDistance: distanceData.totalDistance,
              firstSessionDistance: distanceData.firstSessionDistance,
              originalTotalDistance: distanceData.originalTotalDistance,
              isLoading: false,
              hasMoreSessions: false,
              allSessionsLoaded: true,
            };
          } else {
            updated[groupIndex] = {
              ...group,
              isLoading: false,
              hasMoreSessions: false,
              allSessionsLoaded: true,
            };
          }

          return updated;
        });

        const newCache: Record<string, TravelSession> = {};
        filteredSessions.forEach((session) => {
          const key = `${session.userId}-${session.sessionId}`;
          newCache[key] = session;
        });
        setSessionsMap((prev) => ({ ...prev, ...newCache }));
      }
    } catch (err) {
      console.error("Failed to fetch more sessions for user", err);
      setGroupedView((prev) => {
        const updated = [...prev];
        updated[groupIndex] = {
          ...updated[groupIndex],
          isLoading: false,
        };
        return updated;
      });
    }
  };

  // Fetch only active sessions
  const fetchActiveSessionsOnly = async () => {
    try {
      const params: any = {};

      // ============ FIX: Apply role-based filtering ============
      if (currentUserInfo?.userRole) {
        const userRole = currentUserInfo.userRole.toLowerCase().trim();

        if (isManager(userRole) || isHOD(userRole)) {
          if (currentUserInfo.department) {
            params.department = currentUserInfo.department;
          }
        }

        if (isZonalManager(userRole)) {
          if (currentUserInfo.allocatedArea) {
            params.allocatedArea = currentUserInfo.allocatedArea;
          }
        }
      }

      const res = await API.get("/admin/travel-sessions", { params });
      if (res.data.success) {
        const allSessions = res.data.data || [];

        // ============ FIX: Apply role-based filtering ============
        let filteredSessions = allSessions;
        if (currentUserInfo?.userRole) {
          filteredSessions = filterSessionsByRole(allSessions);
        }

        setTravelSessions((prevSessions) => {
          const updatedSessions = [...prevSessions];
          const activeSessionMap = new Map<number, TravelSession>();

          filteredSessions.forEach((session: TravelSession) => {
            if (!session.endTime) {
              activeSessionMap.set(session.sessionId, session);
            }
          });

          updatedSessions.forEach((session, index) => {
            if (!session.endTime && activeSessionMap.has(session.sessionId)) {
              updatedSessions[index] = activeSessionMap.get(session.sessionId)!;
              activeSessionMap.delete(session.sessionId);
            }
          });

          activeSessionMap.forEach((session) => {
            updatedSessions.push(session);
          });

          return updatedSessions.sort((a, b) => {
            const dateA = new Date(a.startTime);
            const dateB = new Date(b.startTime);
            return dateB.getTime() - dateA.getTime();
          });
        });

        filteredSessions.forEach((session: TravelSession) => {
          if (!session.endTime) {
            const key = `${session.userId}-${session.sessionId}`;
            setSessionsMap((prev) => ({ ...prev, [key]: session }));
          }
        });

        const grouped = groupSessionsByUserAndDate(travelSessions);
        setGroupedView(grouped);

        setLastUpdateTime(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch active sessions", err);
    }
  };

  const handleFetchTravelData = async (
    userId: string,
    sessionDate?: string,
  ) => {
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
      const params: any = { userId };

      if (sessionDate) {
        params.startDate = sessionDate;
        params.endDate = sessionDate;
      } else {
        if (startDate) {
          params.startDate = startDate;
        }
        if (endDate) {
          params.endDate = endDate;
        }
      }

      const response = await API.get(
        `/tracking/locationlog/get_travel_sessions`,
        { params },
      );

      const data = response.data;

      if (data.success && data.sessions && data.sessions.data) {
        const allSessions: FarmerTravelData[] = data.sessions.data.map(
          (session: any) => ({
            sessionId: session.sessionId,
            userId: session.userId || data.user?.id,
            startTime: session.startTime,
            endTime: session.endTime,
            startLatitude: session.startLatitude,
            startLongitude: session.startLongitude,
            endLatitude: session.endLatitude,
            endLongitude: session.endLongitude,
            startDescription: session.startDescription || "",
            endDescription: session.endDescription || "",
            status: session.status,
            isActive: session.isActive,
            totalDistance: session.totalDistance,
            date: session.date,
            durationMinutes: session.durationMinutes,
            startOdometerImage: session.startOdometerImage || "",
            endOdometerImage: session.endOdometerImage || "",
            locationLogs: session.locationLogs,
            farmerData: session.farmerData,
          }),
        );

        setFarmerTravelData(allSessions);
        setShowFarmerDataModal(true);
      } else {
        setFarmerDataError(data.message || "No travel data found");
        setFarmerTravelData([]);
        setShowFarmerDataModal(true);
      }
    } catch (error: any) {
      console.error("Error fetching travel data:", error);

      if (error.response) {
        setFarmerDataError(
          `Error ${error.response.status}: ${error.response.data?.message || "Server error"}`,
        );
      } else if (error.request) {
        setFarmerDataError(
          "No response from server. Please check your connection.",
        );
      } else {
        setFarmerDataError(
          "Failed to fetch travel session data. Please try again.",
        );
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

  // search query
  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) {
      fetchTravelSessions(1, false);
      return;
    }

    setIsSearching(true);
    searchAllSessions(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setCurrentPage(1);
    setHasMore(true);
    fetchTravelSessions(1, false);
  };

  const searchAllSessions = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      fetchTravelSessions(1, false);
      setIsSearching(false);
      return;
    }

    setIsLoading(true);
    setIsSearching(true);

    try {
      let allSessions: TravelSession[] = [];
      let page = 1;
      let hasMore = true;
      const maxPages = 10;
      let apiTotalSessions = 0;

      while (hasMore && page <= maxPages) {
        const params: any = {
          page: page,
          limit: 100,
          search: searchTerm,
        };

        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (selectedUser) params.userId = selectedUser;

        // ============ FIX: Apply role-based filtering ============
        if (currentUserInfo?.userRole) {
          const userRole = currentUserInfo.userRole.toLowerCase().trim();

          if (isManager(userRole) || isHOD(userRole)) {
            if (currentUserInfo.department) {
              params.department = currentUserInfo.department;
            }
          }

          if (isZonalManager(userRole)) {
            if (currentUserInfo.allocatedArea) {
              params.allocatedArea = currentUserInfo.allocatedArea;
            }
          }
        }

        const res = await API.get<ApiPaginationResponse>(
          "/admin/travel-sessions",
          { params },
        );

        if (res.data.success) {
          const sessions = res.data.data || [];
          allSessions = [...allSessions, ...sessions];

          if (page === 1) {
            apiTotalSessions = res.data.totalSessions || sessions.length;
          }

          hasMore = res.data.hasNextPage || false;
          page++;
        } else {
          hasMore = false;
        }
      }

      // ============ FIX: Apply role-based filtering ============
      let filteredSessions = allSessions;
      if (currentUserInfo?.userRole) {
        filteredSessions = filterSessionsByRole(allSessions);
      }

      setTotalSessionsCount(apiTotalSessions);

      setTravelSessions(filteredSessions);

      // ============ FIX: Filter users based on role ============
      const uniqueUsers = Array.from(
        new Map(
          filteredSessions.map((session) => [
            session.userId,
            {
              userId: session.userId,
              fullName: session.fullName,
              employeeCode: session.employeeCode,
              department: session.department || "Unknown",
              allocatedArea: session.allocatedArea || "Unknown",
            },
          ]),
        ).values(),
      );

      const filteredUsers = filterUsersByRole(uniqueUsers);
      setUsers(filteredUsers);

      const grouped = groupSessionsByUserAndDate(filteredSessions);
      setGroupedView(grouped);

      setCurrentPage(1);
      setTotalPages(1);
      setHasMore(false);

      setLastUpdateTime(new Date());
    } catch (err) {
      console.error("Failed to search sessions", err);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const formatDateTime = useCallback((dateTimeStr: string) => {
    if (!dateTimeStr) return "-";
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  }, []);

  const formatTimeOnly = useCallback((dateTimeStr: string) => {
    if (!dateTimeStr) return "-";
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, []);

  const formatShortDate = useCallback((dateTimeStr: string) => {
    if (!dateTimeStr) return "-";
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, []);

  // Improved coordinate parsing
  const parseCoordinate = useCallback((coord: string | number): number => {
    if (coord === null || coord === undefined) return 0;

    if (typeof coord === "number") {
      return Math.abs(coord) > 180 ? 0 : coord;
    }

    const str = String(coord).trim();
    if (!str) return 0;

    const cleaned = str.replace(/[^\d.-]/g, "");
    if (!cleaned) return 0;

    const parsed = parseFloat(cleaned);

    if (Math.abs(parsed) > 90) return 0;

    return isNaN(parsed) ? 0 : parsed;
  }, []);

  const isValidCoordinate = useCallback(
    (lat: string | number, lng: string | number): boolean => {
      const latNum = parseCoordinate(lat);
      const lngNum = parseCoordinate(lng);

      return (
        latNum !== 0 &&
        lngNum !== 0 &&
        Math.abs(latNum) <= 90 &&
        Math.abs(lngNum) <= 180 &&
        !isNaN(latNum) &&
        !isNaN(lngNum)
      );
    },
    [parseCoordinate],
  );

  // Helper function to calculate distance between two coordinates in meters
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    },
    [],
  );

  // Helper function to smooth the path
  const smoothPath = useCallback(
    (points: [number, number][]): [number, number][] => {
      if (points.length < 3) return points;

      const smoothed: [number, number][] = [points[0]];

      for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const current = points[i];
        const next = points[i + 1];

        const smoothedLat = (prev[0] + current[0] + next[0]) / 3;
        const smoothedLng = (prev[1] + current[1] + next[1]) / 3;

        smoothed.push([smoothedLat, smoothedLng]);
      }

      smoothed.push(points[points.length - 1]);
      return smoothed;
    },
    [],
  );

  // ============ FIX: Updated buildPolylinePath with filtered logs ============
  const buildPolylinePath = useCallback(
    (session: TravelSession): [number, number][] => {
      const logs = sessionLogs[session.sessionId] || [];

      // Filter logs by session time range
      const filteredLogs = filterAndMapLogsToSession(logs, session);

      const path: [number, number][] = [];

      if (filteredLogs.length === 0) return path;

      const sortedLogs = [...filteredLogs].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      sortedLogs.forEach((log) => {
        if (isValidCoordinate(log.latitude, log.longitude)) {
          const currentPoint: [number, number] = [
            parseCoordinate(log.latitude),
            parseCoordinate(log.longitude),
          ];
          path.push(currentPoint);
        }
      });

      return smoothPath(path);
    },
    [isValidCoordinate, parseCoordinate, smoothPath, sessionLogs],
  );

  // ============ FIX: Updated getMapCenter with filtered logs ============
  const getMapCenter = useCallback(
    (session: TravelSession): [number, number] => {
      if (!session) return [21.1702, 72.8311];

      if (isValidCoordinate(session.startLatitude, session.startLongitude)) {
        return [
          parseCoordinate(session.startLatitude),
          parseCoordinate(session.startLongitude),
        ];
      }

      const logs = sessionLogs[session.sessionId] || [];
      const filteredLogs = filterAndMapLogsToSession(logs, session);

      if (filteredLogs.length > 0) {
        const validLogs = filteredLogs.filter((log) =>
          isValidCoordinate(log.latitude, log.longitude),
        );

        if (validLogs.length > 0) {
          const sumLat = validLogs.reduce(
            (sum, log) => sum + parseCoordinate(log.latitude),
            0,
          );
          const sumLng = validLogs.reduce(
            (sum, log) => sum + parseCoordinate(log.longitude),
            0,
          );
          return [sumLat / validLogs.length, sumLng / validLogs.length];
        }
      }

      return [21.1702, 72.8311];
    },
    [isValidCoordinate, parseCoordinate, sessionLogs],
  );

  // ============ FIX: Updated getMapZoom with filtered logs ============
  const getMapZoom = useCallback(
    (session: TravelSession): number => {
      if (!session) return 13;

      const validPoints: [number, number][] = [];

      if (isValidCoordinate(session.startLatitude, session.startLongitude)) {
        validPoints.push([
          parseCoordinate(session.startLatitude),
          parseCoordinate(session.startLongitude),
        ]);
      }

      if (isValidCoordinate(session.endLatitude, session.endLongitude)) {
        validPoints.push([
          parseCoordinate(session.endLatitude),
          parseCoordinate(session.endLongitude),
        ]);
      }

      const logs = sessionLogs[session.sessionId] || [];
      const filteredLogs = filterAndMapLogsToSession(logs, session);

      filteredLogs.forEach((log) => {
        if (isValidCoordinate(log.latitude, log.longitude)) {
          validPoints.push([
            parseCoordinate(log.latitude),
            parseCoordinate(log.longitude),
          ]);
        }
      });

      if (validPoints.length < 2) return 13;

      const lats = validPoints.map((p) => p[0]);
      const lngs = validPoints.map((p) => p[1]);

      const latRange = Math.max(...lats) - Math.min(...lats);
      const lngRange = Math.max(...lngs) - Math.min(...lngs);
      const maxRange = Math.max(latRange, lngRange);

      if (maxRange > 0.1) return 10;
      if (maxRange > 0.05) return 12;
      if (maxRange > 0.01) return 14;
      if (maxRange > 0.005) return 15;
      return 16;
    },
    [isValidCoordinate, parseCoordinate, sessionLogs],
  );

  // ============ FIX: Updated detectPauses with filtered logs ============
  const detectPauses = useCallback(
    (sessionId: number): PauseInterval[] => {
      const logs = sessionLogs[sessionId] || [];

      const session =
        travelSessions.find((s) => s.sessionId === sessionId) ||
        sessionsMap[`${sessionId}`];

      const filteredLogs = session
        ? filterAndMapLogsToSession(logs, session)
        : logs;

      if (filteredLogs.length < 2) return [];

      const pauses: PauseInterval[] = [];
      let currentPause: PauseInterval | null = null;

      for (let i = 0; i < filteredLogs.length; i++) {
        const log = filteredLogs[i];

        if (log.pause === true) {
          if (!currentPause) {
            currentPause = {
              start: log,
              end: log,
              durationMinutes: 0,
            };
          } else {
            currentPause.end = log;
          }
        } else if (currentPause) {
          const startTime = new Date(currentPause.start.timestamp);
          const endTime = new Date(currentPause.end.timestamp);
          currentPause.durationMinutes =
            (endTime.getTime() - startTime.getTime()) / 60000;

          if (currentPause.durationMinutes >= 1) {
            pauses.push(currentPause);
          }
          currentPause = null;
        }
      }

      if (currentPause) {
        const startTime = new Date(currentPause.start.timestamp);
        const endTime = new Date(currentPause.end.timestamp);
        currentPause.durationMinutes =
          (endTime.getTime() - startTime.getTime()) / 60000;

        if (currentPause.durationMinutes >= 1) {
          pauses.push(currentPause);
        }
      }

      return pauses;
    },
    [sessionLogs, travelSessions, sessionsMap],
  );

  const openMap = async (session: TravelSession) => {
    setMapView(session);
    setLastUpdateTime(new Date());

    if (!sessionLogs[session.sessionId]) {
      await fetchSessionLogs(session.sessionId, 1);
    }
  };

  const closeMap = () => {
    setMapView(null);
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const openMultiSessionMap = useCallback(
    async (group: GroupedSession) => {
      setMultiSessionMapView({
        userId: group.userId,
        fullName: group.fullName || "",
        employeeCode: group.employeeCode,
        date: group.date,
        sessions: group.sessions.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
        center: group.sessions.length
          ? getMapCenter(group.sessions[0])
          : [21.1702, 72.8311],
        zoom: 13,
      });

      const logPromises = group.sessions.map((session) => {
        if (!sessionLogs[session.sessionId]) {
          return fetchSessionLogs(session.sessionId, 1);
        }
        return Promise.resolve();
      });

      await Promise.all(logPromises);

      const allPoints: [number, number][] = [];

      group.sessions.forEach((session) => {
        const logs = sessionLogs[session.sessionId] || [];

        if (isValidCoordinate(session.startLatitude, session.startLongitude)) {
          allPoints.push([
            parseCoordinate(session.startLatitude),
            parseCoordinate(session.startLongitude),
          ]);
        }

        if (isValidCoordinate(session.endLatitude, session.endLongitude)) {
          allPoints.push([
            parseCoordinate(session.endLatitude),
            parseCoordinate(session.endLongitude),
          ]);
        }

        const filteredLogs = filterAndMapLogsToSession(logs, session);
        filteredLogs.forEach((log) => {
          if (isValidCoordinate(log.latitude, log.longitude)) {
            allPoints.push([
              parseCoordinate(log.latitude),
              parseCoordinate(log.longitude),
            ]);
          }
        });
      });

      let center: [number, number] = [21.1702, 72.8311];
      let zoom = 13;

      if (allPoints.length > 0) {
        const sumLat = allPoints.reduce((sum, point) => sum + point[0], 0);
        const sumLng = allPoints.reduce((sum, point) => sum + point[1], 0);
        center = [sumLat / allPoints.length, sumLng / allPoints.length];

        const lats = allPoints.map((p) => p[0]);
        const lngs = allPoints.map((p) => p[1]);
        const latRange = Math.max(...lats) - Math.min(...lats);
        const lngRange = Math.max(...lngs) - Math.min(...lngs);
        const maxRange = Math.max(latRange, lngRange);

        if (maxRange > 0.1) zoom = 10;
        else if (maxRange > 0.05) zoom = 12;
        else if (maxRange > 0.01) zoom = 14;
        else if (maxRange > 0.005) zoom = 15;
        else zoom = 16;
      }

      setMultiSessionMapView((prev) =>
        prev
          ? {
              ...prev,
              center,
              zoom,
            }
          : null,
      );

      setLastUpdateTime(new Date());
    },
    [isValidCoordinate, parseCoordinate, sessionLogs, getMapCenter],
  );

  const closeMultiSessionMap = () => {
    setMultiSessionMapView(null);
  };

  const manualRefresh = () => {
    fetchTravelSessions(1, false);
    loadAllSessionsForExport();
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const isDateFilterActive = startDate || endDate;

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchTravelSessions(1, false);
  }, [startDate, endDate, selectedUser]);

  useEffect(() => {
    if (searchQuery.trim()) {
      // Search is handled by the search button
    }
  }, [searchQuery]);

  const filteredSessions = useMemo(() => {
    let filtered = [...travelSessions];

    if (startDate || endDate) {
      filtered = filtered.filter((session) => {
        const sessionDate = new Date(session.startTime);
        const sessionDateOnly = sessionDate.toISOString().split("T")[0];

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
      filtered = filtered.filter(
        (session) => session.userId.toString() === selectedUser,
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.fullName.toLowerCase().includes(query) ||
          session.employeeCode.toLowerCase().includes(query),
      );
    }

    // ============ FIX: Apply role-based filtering on filtered sessions ============
    if (currentUserInfo?.userRole) {
      filtered = filterSessionsByRole(filtered);
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();

      if (Math.abs(dateA - dateB) > 86400000) {
        return dateB - dateA;
      }

      return a.sessionId - b.sessionId;
    });
  }, [
    startDate,
    endDate,
    selectedUser,
    searchQuery,
    travelSessions,
    currentUserInfo,
    filterSessionsByRole,
  ]);

  useEffect(() => {
    const grouped = groupSessionsByUserAndDate(filteredSessions);
    setGroupedView(grouped);
  }, [filteredSessions, groupSessionsByUserAndDate]);

  const totalSessions = filteredSessions.length;
  const activeSessions = filteredSessions.filter((s) => !s.endTime).length;
  const totalDistance = filteredSessions.reduce(
    (sum, s) => sum + s.totalDistance,
    0,
  );

  const buildSessionPolylinePath = useCallback(
    (session: TravelSession): [number, number][] => {
      const logs = sessionLogs[session.sessionId] || [];
      const filteredLogs = filterAndMapLogsToSession(logs, session);

      const path: [number, number][] = [];

      if (filteredLogs.length === 0) return path;

      const sortedLogs = [...filteredLogs].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      sortedLogs.forEach((log) => {
        if (isValidCoordinate(log.latitude, log.longitude)) {
          path.push([
            parseCoordinate(log.latitude),
            parseCoordinate(log.longitude),
          ]);
        }
      });

      return smoothPath(path);
    },
    [isValidCoordinate, parseCoordinate, smoothPath, sessionLogs],
  );

  // Enhanced exportToCSV function using cached data
  const exportToCSV = async () => {
    try {
      setIsExporting(true);

      let sessionsToExport = [...allSessions];

      // ============ FIX: Apply role-based filtering for export ============
      if (currentUserInfo?.userRole) {
        sessionsToExport = filterSessionsByRole(sessionsToExport);
      }

      if (startDate || endDate) {
        sessionsToExport = sessionsToExport.filter((session) => {
          try {
            const sessionDate = formatDateOnly(session.startTime);

            if (startDate && !endDate) {
              return sessionDate >= startDate;
            }

            if (!startDate && endDate) {
              return sessionDate <= endDate;
            }

            if (startDate && endDate) {
              return sessionDate >= startDate && sessionDate <= endDate;
            }

            return true;
          } catch (error) {
            console.error("Error parsing session date:", error, session);
            return false;
          }
        });
      }

      if (selectedUser) {
        sessionsToExport = sessionsToExport.filter(
          (session) => session.userId.toString() === selectedUser,
        );
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        sessionsToExport = sessionsToExport.filter(
          (session) =>
            session.fullName.toLowerCase().includes(query) ||
            session.employeeCode.toLowerCase().includes(query),
        );
      }

      if (sessionsToExport.length === 0) {
        alert("No travel sessions found with the current filters.");
        setIsExporting(false);
        return;
      }

      const groupedData = groupSessionsByUserAndDate(sessionsToExport);

      if (groupedData.length === 0) {
        alert("No grouped sessions found after processing.");
        setIsExporting(false);
        return;
      }

      const groupedDataWithFarmerInfo = groupedData.map((group, index) => {
        const userDateKey = `${group.userId}-${group.date}`;
        let sessionFarmerData = allFarmerData[userDateKey] || [];

        const firstSessionStart = new Date(group.startTime);
        const lastSessionEnd = new Date(group.endTime);
        const totalDuration = Math.round(
          (lastSessionEnd.getTime() - firstSessionStart.getTime()) / 60000,
        );
        const totalDistanceExcludingFirst = group.totalDistance;
        const reimbursementAmount = (
          (totalDistanceExcludingFirst / 1000) *
          3.5
        ).toFixed(2);

        const totalPauses = group.sessions.reduce((sum, session) => {
          const pauses = detectPauses(session.sessionId);
          return sum + pauses.length;
        }, 0);

        let totalFarmersMet = 0;
        const sessionDetails = group.sessions.map((session, sessionIndex) => {
          const matchingFarmerData = sessionFarmerData.find(
            (f: any) => f.sessionId === session.sessionId,
          );

          const farmerCount = matchingFarmerData?.farmerData?.count || 0;
          totalFarmersMet += farmerCount;
          const farmers = matchingFarmerData?.farmerData?.data || [];

          const farmerDescriptions = farmers
            .map(
              (farmer: any, farmerIndex: number) =>
                `Farmer ${farmerIndex + 1}: ${farmer.farmerName || "Unknown"} - ${farmer.farmerDescription || "No description"}`,
            )
            .join("; ");

          const farmerImageUrls = farmers
            .map((farmer: any) => farmer.farmerImage || "")
            .filter((url: string) => url)
            .join("; ");

          return {
            sessionNumber: sessionIndex + 1,
            sessionId: session.sessionId,
            sessionStartTime: formatTimeOnly(session.startTime),
            sessionEndTime: session.endTime
              ? formatTimeOnly(session.endTime)
              : "Active",
            sessionDistance: (session.totalDistance / 1000).toFixed(2),
            sessionStatus: session.endTime ? "Completed" : "Active",
            farmersCount: farmerCount,
            farmerDescriptions: farmerDescriptions || "None",
            farmerImageUrls: farmerImageUrls || "None",
            startOdometerImage: matchingFarmerData?.startOdometerImage || "",
            endOdometerImage: matchingFarmerData?.endOdometerImage || "",
          };
        });

        return {
          fullName: group.fullName,
          "Employee Code": group.employeeCode,
          Department: group.sessions[0]?.department || "N/A",
          Role: group.sessions[0]?.role || "N/A",
          "Allocated Area": group.sessions[0]?.allocatedArea || "N/A",
          Date: group.date,
          "Formatted Date": new Date(group.date).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          "Start Time": formatDateTime(group.startTime),
          "End Time": formatDateTime(group.endTime),
           "Payable Distance(km)": (
            totalDistanceExcludingFirst / 1000
          ).toFixed(2),
          "Payable Amount (₹)": reimbursementAmount,
          "Total Sessions": group.totalSessions,
          "Active Sessions": group.activeSessions,
          "Total Distance (km)": (
            group.originalTotalDistance / 1000
          ).toFixed(2),
          "Total Reimbursement(km)": (
            (group.originalTotalDistance / 1000) *
            3.5
          ).toFixed(2),
          "First Session Distance (km)": (
            group.firstSessionDistance / 1000
          ).toFixed(2),
         
          "Total Farmers Met": totalFarmersMet,
          "Duration (minutes)": totalDuration,
          "Total Pauses Count": totalPauses,
          Status:
            group.activeSessions > 0 ? "Has Active Sessions" : "All Completed",
          Notes: `Excluding first session distance: ${(group.firstSessionDistance / 1000).toFixed(2)} km`,

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
              [`${prefix} Farmer Image URLs`]: session.farmerImageUrls,
              [`${prefix} Start Odometer Image`]: session.startOdometerImage,
              [`${prefix} End Odometer Image`]: session.endOdometerImage,
            };
          }, {}),
        };
      });

      const sortedData = groupedDataWithFarmerInfo.sort((a, b) => {
        const dateCompare =
          new Date(b.Date).getTime() - new Date(a.Date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b["User ID"] - a["User ID"];
      });

      const maxSessions = Math.max(
        ...groupedData.map((group) => group.sessions.length),
        1,
      );

      const baseHeaders = [
        "fullName",
        "Employee Code",
        "Department",
        "Role",
        "Allocated Area",
        "Date",
        "Formatted Date",
        "Start Time",
        "End Time",
         "Payable Distance(km)",
        "Payable Amount (₹)",
        "Total Sessions",
        "Active Sessions",
        "Total Distance (km)",
        "Total Reimbursement(km)",
        "First Session Distance (km)",
       
        "Total Farmers Met",
        "Duration (minutes)",
        "Total Pauses Count",
        "Status",
        "Notes",
      ];

      const sessionHeaders = [];
      for (let i = 1; i <= maxSessions; i++) {
        sessionHeaders.push(
          `Session ${i} ID`,
          `Session ${i} Start Time`,
          `Session ${i} End Time`,
          `Session ${i} Distance (km)`,
          `Session ${i} Status`,
          `Session ${i} Farmers Count`,
          `Session ${i} Farmer Descriptions`,
        );
      }

      const allHeaders = [...baseHeaders, ...sessionHeaders];

      const csvContent = [
        allHeaders.join(","),
        ...sortedData.map((row) =>
          allHeaders
            .map((header) => {
              const value = row[header];
              if (value === null || value === undefined) return '""';
              const stringValue = String(value);
              if (/[,"\n\r]/.test(stringValue)) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(","),
        ),
      ].join("\r\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      const filterInfo = [];
      if (startDate) filterInfo.push(`from-${startDate}`);
      if (endDate) filterInfo.push(`to-${endDate}`);
      if (selectedUser) filterInfo.push(`user-${selectedUser}`);
      if (searchQuery) filterInfo.push(`search-${searchQuery}`);
      const filename = `travel_sessions_${filterInfo.length ? filterInfo.join("_") : "all"}_${dateStr}.csv`;

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please check console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  // Load all sessions for export (with pagination)
  const loadAllSessionsForExport = async () => {
    setIsLoadingAllSessions(true);
    try {
      let allSessions: TravelSession[] = [];
      let currentPage = 1;
      let totalPages = 1;
      let hasMore = true;

      while (hasMore) {
        const params: any = { page: currentPage, limit: 100 };

        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        // ============ FIX: Apply role-based filtering for export ============
        if (currentUserInfo?.userRole) {
          const userRole = currentUserInfo.userRole.toLowerCase().trim();

          if (isManager(userRole) || isHOD(userRole)) {
            if (currentUserInfo.department) {
              params.department = currentUserInfo.department;
            }
          }

          if (isZonalManager(userRole)) {
            if (currentUserInfo.allocatedArea) {
              params.allocatedArea = currentUserInfo.allocatedArea;
            }
          }
        }

        const res = await API.get<ApiPaginationResponse>(
          "/admin/travel-sessions",
          { params },
        );

        if (res.data.success) {
          const sessions = res.data.data || [];
          allSessions = [...allSessions, ...sessions];

          currentPage = res.data.currentPage || currentPage;
          totalPages = res.data.totalPages || totalPages;
          hasMore = res.data.hasNextPage || false;

          if (currentPage < totalPages) {
            currentPage++;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      // ============ FIX: Apply role-based filtering ============
      let filteredSessions = allSessions;
      if (currentUserInfo?.userRole) {
        filteredSessions = filterSessionsByRole(allSessions);
      }

      setAllSessions(filteredSessions);
    } catch (err) {
      console.error("Failed to load all sessions for export", err);
    } finally {
      setIsLoadingAllSessions(false);
    }
  };

  // Load farmer data for all sessions
  const loadAllFarmerData = async (userIds: number[], dates: string[]) => {
    const farmerDataMap: Record<string, any> = {};

    try {
      const batchSize = 5;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batchUserIds = userIds.slice(i, i + batchSize);
        const batchDates = dates.slice(i, i + batchSize);

        const batchPromises = batchUserIds.map(async (userId, index) => {
          const date = batchDates[index];
          try {
            const response = await API.get(
              `/tracking/locationlog/get_travel_sessions`,
              {
                params: {
                  userId,
                  startDate: date,
                  endDate: date,
                },
                timeout: 10000,
              },
            );

            if (response.data.success && response.data.sessions?.data) {
              const key = `${userId}-${date}`;
              farmerDataMap[key] = response.data.sessions.data;
            }
          } catch (error) {
            console.error(
              `Error fetching farmer data for user ${userId}`,
              error,
            );
          }
        });

        await Promise.all(batchPromises);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setAllFarmerData(farmerDataMap);
    } catch (err) {
      console.error("Failed to load farmer data", err);
    }
  };

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      const refreshInterval = activeSessionsOnly ? 10000 : 30000;

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

  // Infinite scroll observer for main pagination
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
          !isLoadingMore
        ) {
          loadMoreSessions();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoading, isLoadingMore]);

  const renderOdometerImage = (imageData: string) => {
    if (!imageData || imageData.trim() === "") {
      return (
        <div className="bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center border border-white/10 dark:border-gray-700/50">
          <FaCar className="text-gray-400 dark:text-gray-600 text-3xl mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No odometer image
          </p>
        </div>
      );
    }

    if (
      imageData.startsWith("data:image") ||
      imageData.startsWith("/9j/") ||
      imageData.length > 1000
    ) {
      return (
        <ImageZoom
          src={
            imageData.startsWith("data:image")
              ? imageData
              : `data:image/jpeg;base64,${imageData}`
          }
          alt="Odometer Image"
          className="rounded-xl"
        />
      );
    }

    return (
      <ImageZoom src={imageData} alt="Odometer Image" className="rounded-xl" />
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-gray-100/50 via-white/30 to-blue-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      <PageMeta
        title="Employee location tracker"
        description="Track Fieldemployee here"
      />
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm rounded-xl">
                  <FaRoute className="text-blue-500" />
                </div>
                Travel Sessions
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isExporting ? "bg-gray-400" : "bg-lantern-blue-600 hover:bg-lantern-yellow-400"} text-white transition-all`}
              title="Export grouped sessions with detailed farmer data (using cached data)"
              disabled={isExporting}
            >
              {isExporting ? (
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
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
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
          <div
            className={`${glassmorphismClasses.statCard} rounded-2xl p-4 backdrop-blur-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total Sessions
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                  {isDateFilterActive || selectedUser || searchQuery
                    ? totalSessions
                    : totalSessionsCount}
                </p>
                {(isDateFilterActive || selectedUser || searchQuery) && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Filtered results (of {totalSessionsCount} total)
                  </p>
                )}
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl">
                <FaListAlt className="text-blue-500 text-xl" />
              </div>
            </div>
          </div>

          <div
            className={`${glassmorphismClasses.statCard} rounded-2xl p-4 backdrop-blur-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Active Sessions
                </p>
                <p className="text-2xl font-bold mt-1 text-green-500">
                  {activeSessions}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-xl">
                <FaPlayCircle className="text-green-500 text-xl" />
              </div>
            </div>
          </div>

          <div
            className={`${glassmorphismClasses.statCard} rounded-2xl p-4 backdrop-blur-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total Distance
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                  {(totalDistance / 1000).toFixed(1)} km
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-sm rounded-xl">
                <FaRoad className="text-purple-500 text-xl" />
              </div>
            </div>
          </div>

          <div
            className={`${glassmorphismClasses.statCard} rounded-2xl p-4 backdrop-blur-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Users
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                  {users.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500/20 to-amber-600/20 backdrop-blur-sm rounded-xl">
                <FaUser className="text-orange-500 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className={`${glassmorphismClasses.card} rounded-2xl p-4 mb-6 backdrop-blur-lg`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Search Employee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaSearch className="inline mr-2" />
                Search Employee
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or employee code..."
                  className={`w-full px-4 py-2 pl-10 pr-24 ${glassmorphismClasses.input} rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30`}
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);

                    if (!value.trim()) {
                      fetchTravelSessions(1, false);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearchSubmit();
                    }
                  }}
                />

                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <FaSearch className="text-sm" />
                </div>

                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                      title="Clear search"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  )}

                  <button
                    onClick={handleSearchSubmit}
                    className="px-3 py-1.5 bg-lantern-blue-600 hover:bg-lantern-blue-700 text-white rounded-lg transition-all flex items-center gap-1 text-sm"
                  >
                    <FaSearch className="text-xs" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </div>

              {isSearching && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Searching for "{searchQuery}"...
                </div>
              )}
            </div>

            {/* Date Range Picker */}
            <div className="lg:col-span-1">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FaCalendarAlt className="inline mr-2" />
                  Date Range
                </label>
                {isDateFilterActive && (
                  <button
                    onClick={clearDateFilter}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Select date range"
                  className={`w-full px-4 py-2 ${glassmorphismClasses.input} rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30 cursor-pointer`}
                  value={
                    startDate && endDate
                      ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                      : startDate
                        ? `From ${new Date(startDate).toLocaleDateString()}`
                        : endDate
                          ? `Until ${new Date(endDate).toLocaleDateString()}`
                          : "Select date range"
                  }
                  readOnly
                  onClick={() => {
                    const picker = document.getElementById("dateRangePicker");
                    if (picker) {
                      picker.classList.toggle("hidden");
                    }
                  }}
                />

                {/* Date Range Picker Dropdown */}
                <div
                  id="dateRangePicker"
                  className="relative top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 hidden"
                  style={{ minWidth: "300px" }}
                >
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        className={`w-full px-3 py-2 ${glassmorphismClasses.input} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (e.target.value && endDate) {
                            document
                              .getElementById("dateRangePicker")
                              ?.classList.add("hidden");
                          }
                        }}
                        max={endDate || new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        className={`w-full px-3 py-2 ${glassmorphismClasses.input} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          if (startDate && e.target.value) {
                            document
                              .getElementById("dateRangePicker")
                              ?.classList.add("hidden");
                          }
                        }}
                        min={startDate}
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        const today = new Date();
                        const sevenDaysAgo = new Date(today);
                        sevenDaysAgo.setDate(today.getDate() - 7);
                        setStartDate(sevenDaysAgo.toISOString().split("T")[0]);
                        setEndDate(today.toISOString().split("T")[0]);
                        document
                          .getElementById("dateRangePicker")
                          ?.classList.add("hidden");
                      }}
                      className="flex-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const thirtyDaysAgo = new Date(today);
                        thirtyDaysAgo.setDate(today.getDate() - 30);
                        setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
                        setEndDate(today.toISOString().split("T")[0]);
                        document
                          .getElementById("dateRangePicker")
                          ?.classList.add("hidden");
                      }}
                      className="flex-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const firstDayOfMonth = new Date(
                          today.getFullYear(),
                          today.getMonth(),
                          1,
                        );
                        setStartDate(
                          firstDayOfMonth.toISOString().split("T")[0],
                        );
                        setEndDate(today.toISOString().split("T")[0]);
                        document
                          .getElementById("dateRangePicker")
                          ?.classList.add("hidden");
                      }}
                      className="flex-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                        document
                          .getElementById("dateRangePicker")
                          ?.classList.add("hidden");
                      }}
                      className="flex-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        document
                          .getElementById("dateRangePicker")
                          ?.classList.add("hidden");
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        document
                          .getElementById("dateRangePicker")
                          ?.classList.add("hidden");
                        fetchTravelSessions(1, false);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {isDateFilterActive && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <FaCalendarAlt className="text-xs flex-shrink-0" />
                  <span className="truncate">
                    {startDate && endDate
                      ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                      : startDate
                        ? `From ${new Date(startDate).toLocaleDateString()}`
                        : endDate
                          ? `Until ${new Date(endDate).toLocaleDateString()}`
                          : ""}
                  </span>
                </div>
              )}
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaChartLine className="inline mr-2" />
                View Mode
              </label>
              <select
                className={`w-full px-4 py-2 ${glassmorphismClasses.input} rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30`}
                onChange={(e) =>
                  setViewMode(e.target.value as "grouped" | "individual")
                }
                value={viewMode}
              >
                <option value="grouped">Group Session</option>
                <option value="individual">Individual Sessions</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List - Conditional Rendering based on viewMode */}
      {isLoading && currentPage === 1 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center mt-9 p-10">
            <LoadingAnimation />
            <p className="text-gray-600 dark:text-gray-300">
              Loading travel sessions...
            </p>
          </div>
        </div>
      ) : viewMode === "grouped" ? (
        /* Grouped View */
        groupedView.length === 0 ? (
          <div
            className={`${glassmorphismClasses.card} rounded-2xl p-12 text-center backdrop-blur-lg`}
          >
            <FaRoute className="text-gray-400 dark:text-gray-600 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              No Travel Sessions Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
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
        ) : (
          <>
            <div className="space-y-6">
              {groupedView.map((group) => {
                const groupDuration = calculateDuration(
                  group.startTime,
                  group.endTime,
                );
                const formattedDate = new Date(group.date).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                );

                const hasMoreSessions =
                  group.sessions.length > 0 && !group.allSessionsLoaded;

                return (
                  <div
                    key={`${group.userId}-${group.date}`}
                    className={`${glassmorphismClasses.card} ${glassmorphismClasses.cardHover} rounded-2xl overflow-hidden backdrop-blur-lg`}
                  >
                    {/* Group Header */}
                    <div className="bg-white px-6 py-4 border-b border-white/10 dark:border-gray-700/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-lantern-blue-600 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {group.fullName?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                              {group.fullName}
                              <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-300">
                                ({group.employeeCode})
                              </span>
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                <FaCalendarAlt className="text-sm" />
                                <span className="text-sm">{formattedDate}</span>
                              </div>
                              <span className="text-gray-400">•</span>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`px-2 py-1 backdrop-blur-sm rounded-full text-xs font-semibold ${
                                    group.activeSessions > 0
                                      ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-700 dark:text-green-400"
                                      : "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-700 dark:text-blue-400"
                                  }`}
                                >
                                  {group.activeSessions > 0
                                    ? `${group.activeSessions} Active`
                                    : "All Completed"}
                                </span>
                                {hasMoreSessions && (
                                  <span className="px-2 py-1 backdrop-blur-sm bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                                    More sessions available
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                  Sessions
                                </p>
                                <p className="text-lg font-bold text-gray-800 dark:text-white">
                                  {group.totalSessions}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                  Distance
                                </p>
                                <p className="text-lg font-bold text-gray-800 dark:text-white">
                                  {(group.totalDistance / 1000).toFixed(1)} km
                                </p>
                                {group.firstSessionDistance > 0 &&
                                  group.totalSessions > 1 && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      (Excluding first session:{" "}
                                      {(
                                        group.firstSessionDistance / 1000
                                      ).toFixed(1)}{" "}
                                      km)
                                    </p>
                                  )}
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                  Reimbursement
                                </p>
                                <p className="text-lg font-bold text-gray-800 dark:text-white">
                                  ₹{" "}
                                  {((group.totalDistance / 1000) * 3.5).toFixed(
                                    1,
                                  )}
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
                            <span className="text-xs font-medium">
                              First Session
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">
                            {formatTimeOnly(group.sessions[0].startTime)}
                          </p>
                        </div>

                        <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                            <FaClock className="text-sm" />
                            <span className="text-xs font-medium">
                              Last Session
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">
                            {formatTimeOnly(
                              group.sessions[group.sessions.length - 1]
                                .endTime ||
                                group.sessions[group.sessions.length - 1]
                                  .startTime,
                            )}
                          </p>
                        </div>

                        <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                            <FaRoad className="text-sm" />
                            <span className="text-xs font-medium">
                              Total Distance
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">
                            {(group.totalDistance / 1000).toFixed(2)} km
                          </p>
                          {group.firstSessionDistance > 0 &&
                            group.totalSessions > 1 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Original:{" "}
                                {(group.originalTotalDistance / 1000).toFixed(
                                  2,
                                )}{" "}
                                km
                              </p>
                            )}
                        </div>

                        <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                            <FaMapPin className="text-sm" />
                            <span className="text-xs font-medium">
                              Total Points
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">
                            {group.totalPoints}
                          </p>
                        </div>
                      </div>

                      {/* Session List */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-md font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm rounded-lg">
                              <FaListAlt className="text-blue-500" />
                            </div>
                            Sessions ({group.sessions.length})
                          </h4>

                          {hasMoreSessions && (
                            <button
                              onClick={() =>
                                loadMoreSessionsForUser(
                                  group.userId,
                                  group.date,
                                )
                              }
                              disabled={group.isLoading}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                                group.isLoading
                                  ? "bg-gray-400"
                                  : "bg-gradient-to-r from-amber-500/90 to-orange-600/90 hover:from-amber-600 hover:to-orange-700"
                              } text-white transition-all`}
                            >
                              {group.isLoading ? (
                                <>
                                  <FaSpinner className="animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <FaChevronDown />
                                  Load All Sessions
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {group.sessions.map((session, sessionIndex) => {
                            const sessionDuration = calculateDuration(
                              session.startTime,
                              session.endTime,
                            );
                            const isActive = !session.endTime;
                            const normalizedRole = (session.role || "")
                              .toLowerCase()
                              .replace(/\s+/g, "");

                            const isFirstSession =
                              normalizedRole === "fieldemployee" &&
                              sessionIndex === 0;

                            // Check if logs were filtered
                            const logs = sessionLogs[session.sessionId] || [];
                            const filteredLogs = filterAndMapLogsToSession(
                              logs,
                              session,
                            );
                            const filteredLogCount =
                              logs.length - filteredLogs.length;

                            return (
                              <div
                                key={session.sessionId}
                                className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50"
                              >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold backdrop-blur-sm"
                                      style={{
                                        backgroundColor:
                                          getSessionColor(sessionIndex),
                                      }}
                                    >
                                      {sessionIndex + 1}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
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
                                        {/* ============ FIX: Show filtered logs warning ============ */}
                                        {filteredLogCount > 0 && (
                                          <span className="px-2 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full flex items-center gap-1">
                                            <FaInfoCircle className="text-xs" />
                                            {filteredLogCount} offline logs
                                            filtered
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        <span>
                                          {formatTimeOnly(session.startTime)} -{" "}
                                          {session.endTime
                                            ? formatTimeOnly(session.endTime)
                                            : "Active"}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          {(
                                            session.totalDistance / 1000
                                          ).toFixed(2)}{" "}
                                          km
                                        </span>
                                        <span>•</span>
                                        <span>
                                          {Math.floor(sessionDuration.hours)}h{" "}
                                          {sessionDuration.minutes}m
                                        </span>
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
                                      onClick={() =>
                                        handleFetchTravelData(
                                          session.userId.toString(),
                                          group.date,
                                        )
                                      }
                                      className={`px-3 py-2 bg-lantern-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-2`}
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
                          className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-lantern-blue-600 rounded-xl text-white font-semibold `}
                        >
                          <FaLayerGroup className="text-xl " />
                          View All Sessions on Map
                          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                            {group.sessions.length} session
                            {group.sessions.length > 1 ? "s" : ""}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infinite scroll loader for main pagination */}
            <div ref={observerTarget} className="py-8">
              {isLoadingMore && (
                <div className="flex items-center justify-center">
                  <FaSpinner className="animate-spin text-2xl text-blue-500 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Loading more sessions...
                  </span>
                </div>
              )}
              {!hasMore && currentPage > 1 && (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p>All {travelSessions.length} sessions loaded</p>
                  <p className="text-sm mt-1">
                    Showing {groupedView.length} grouped sessions
                  </p>
                </div>
              )}
            </div>
          </>
        )
      ) : /* Individual Sessions View */
      filteredSessions.length === 0 ? (
        <div
          className={`${glassmorphismClasses.card} rounded-2xl p-12 text-center backdrop-blur-lg`}
        >
          <FaRoute className="text-gray-400 dark:text-gray-600 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            No Travel Sessions Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
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
      ) : (
        <>
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const sessionDuration = calculateDuration(
                session.startTime,
                session.endTime,
              );
              const isActive = !session.endTime;

              // Check if logs were filtered
              const logs = sessionLogs[session.sessionId] || [];
              const filteredLogs = filterAndMapLogsToSession(logs, session);
              const filteredLogCount = logs.length - filteredLogs.length;

              return (
                <div
                  key={session.sessionId}
                  className={`${glassmorphismClasses.card} ${glassmorphismClasses.cardHover} rounded-2xl p-4 backdrop-blur-lg`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-lantern-blue-600 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold">
                        {session.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">
                          {session.fullName}
                          <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-300">
                            ({session.employeeCode})
                          </span>
                          {session.department && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              • {session.department}
                            </span>
                          )}
                          {session.allocatedArea && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              [{session.allocatedArea}]
                            </span>
                          )}
                          {/* ============ FIX: Show filtered logs warning ============ */}
                          {filteredLogCount > 0 && (
                            <span className="ml-2 px-2 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full inline-flex items-center gap-1">
                              <FaInfoCircle className="text-xs" />
                              {filteredLogCount} offline logs filtered
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                            <FaCalendarAlt className="text-xs" />
                            <span>{formatDateTime(session.startTime)}</span>
                          </div>
                          {session.endTime && (
                            <>
                              <span className="text-gray-400">→</span>
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                                <FaClock className="text-xs" />
                                <span>{formatTimeOnly(session.endTime)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Distance
                        </p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">
                          {(session.totalDistance / 1000).toFixed(2)} km
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Duration
                        </p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">
                          {sessionDuration.hours}h {sessionDuration.minutes}m
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Status
                        </p>
                        <span
                          className={`px-3 py-1 backdrop-blur-sm rounded-full text-sm font-semibold ${
                            isActive
                              ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-700 dark:text-green-400"
                              : "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-700 dark:text-blue-400"
                          }`}
                        >
                          {isActive ? "Active" : "Completed"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleFetchTravelData(
                            session.userId.toString(),
                            formatDateOnly(session.startTime),
                          )
                        }
                        className={`px-3 py-2 bg-lantern-blue-600 rounded-xl text-sm font-medium flex items-center gap-2`}
                      >
                        <FaInfoCircle />
                        Details
                      </button>
                      <button
                        onClick={() => openMap(session)}
                        className={`px-3 py-2 ${glassmorphismClasses.button.primary} rounded-xl text-sm font-medium flex items-center gap-2`}
                      >
                        <FaEye />
                        View Map
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite scroll loader for individual view */}
          <div ref={observerTarget} className="py-8">
            {isLoadingMore && (
              <div className="flex items-center justify-center">
                <FaSpinner className="animate-spin text-2xl text-blue-500 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">
                  Loading more sessions...
                </span>
              </div>
            )}
            {!hasMore && currentPage > 1 && (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p>All {filteredSessions.length} sessions loaded</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Farmer Data Modal */}
      {showFarmerDataModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div
            className={`${glassmorphismClasses.modal} w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}
          >
            {/* Modal Header */}
            <div className="bg-lantern-blue-600 backdrop-blur-sm p-2 text-white flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg flex-shrink-0">
                    <FaCar className="text-lg" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold truncate">
                      Travel Session Details
                    </h2>
                    <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
                      <span className="truncate backdrop-blur-sm bg-white/10 px-2 py-1 rounded">
                        User ID: {selectedUserForFarmerData}
                      </span>
                      {users.find(
                        (u) =>
                          u.userId.toString() === selectedUserForFarmerData,
                      )?.username && (
                        <>
                          <span className="text-white/50">•</span>
                          <span className="truncate">
                            User:{" "}
                            {
                              users.find(
                                (u) =>
                                  u.userId.toString() ===
                                  selectedUserForFarmerData,
                              )?.username
                            }
                          </span>
                        </>
                      )}
                      {selectedSessionDate && (
                        <>
                          <span className="text-white/50">•</span>
                          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded">
                            <FaCalendarAlt className="text-xs" />
                            <span className="truncate">
                              {new Date(selectedSessionDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
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
                    <p className="text-gray-600 dark:text-gray-300">
                      Loading travel session data...
                    </p>
                  </div>
                </div>
              ) : farmerDataError ? (
                <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-xl p-8 text-center">
                  <FaInfoCircle className="text-red-500 text-4xl mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
                    Error Loading Data
                  </h3>
                  <p className="text-red-600 dark:text-red-300">
                    {farmerDataError}
                  </p>
                </div>
              ) : farmerTravelData.length === 0 ? (
                <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 backdrop-blur-sm rounded-xl p-12 text-center border border-white/10 dark:border-gray-700/50">
                  <FaCar className="text-gray-400 dark:text-gray-600 text-5xl mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                    No Travel Data Found
                  </h3>
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
                        <p className="text-sm text-white dark:text-gray-300">
                          Total Sessions
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {farmerTravelData.length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white dark:text-gray-300">
                          Active Sessions
                        </p>
                        <p className="text-2xl font-bold text-green-500">
                          {farmerTravelData.filter((s) => s.isActive).length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white dark:text-gray-300">
                          Total Distance
                        </p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                          {(
                            farmerTravelData.reduce(
                              (sum, s) => sum + (s.totalDistance || 0),
                              0,
                            ) / 1000
                          ).toFixed(1)}{" "}
                          km
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white dark:text-gray-300">
                          Total Events
                        </p>
                        <p className="text-2xl font-bold text-orange-500">
                          {farmerTravelData.reduce(
                            (sum, s) => sum + (s.farmerData?.count || 0),
                            0,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sessions List */}
                  {farmerTravelData.map((session, index) => {
                    const duration = calculateDuration(
                      session.startTime,
                      session.endTime,
                    );
                    const farmerCount = session.farmerData?.count || 0;

                    return (
                      <div
                        key={session.sessionId}
                        className={`${glassmorphismClasses.card} rounded-2xl overflow-hidden backdrop-blur-lg mb-6`}
                      >
                        <div className="bg-gradient-to-r from-gray-500/10 via-gray-600/10 to-gray-700/10 px-6 py-4 border-b border-white/10 dark:border-gray-700/50">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className=" backdrop-blur-sm p-2 rounded-xl">
                                <FaRoute className="text-lantern-blue-600 " />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                                  Session #{session.sessionId}
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <span
                                    className={`px-2 py-1 backdrop-blur-sm rounded-full text-xs font-semibold ${session.isActive ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-700 dark:text-green-400" : "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-700 dark:text-blue-400"}`}
                                  >
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
                                  {formatTimeOnly(session.startTime)} -{" "}
                                  {session.endTime
                                    ? formatTimeOnly(session.endTime)
                                    : "Active"}
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                  Duration: {duration.hours}h {duration.minutes}
                                  m
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
                                <span className="text-sm font-medium">
                                  Duration
                                </span>
                              </div>
                              <p className="text-lg font-bold text-gray-800 dark:text-white">
                                {duration.hours}h {duration.minutes}m
                              </p>
                            </div>

                            <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                                <FaRoad />
                                <span className="text-sm font-medium">
                                  Distance
                                </span>
                              </div>
                              <p className="text-lg font-bold text-gray-800 dark:text-white">
                                {(session.totalDistance / 1000).toFixed(2)} km
                              </p>
                            </div>

                            <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                                <FaUser className="text-lantern-blue-600" />
                                <span className="text-sm font-medium">
                                  Events
                                </span>
                              </div>
                              <p className="text-lg font-bold text-lantern-blue-600">
                                {farmerCount}
                              </p>
                            </div>

                            <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                                <FaMapPin />
                                <span className="text-sm font-medium">
                                  Location Logs
                                </span>
                              </div>
                              <p className="text-lg font-bold text-blue-500">
                                {session.locationLogs?.count || 0}
                              </p>
                            </div>
                          </div>

                          {/* Odometer Images Section */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h4 className="text-md font-semibold p-2 text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                Start Odometer
                              </h4>
                              {renderOdometerImage(session.startOdometerImage)}
                              <div className="mt-2 border p-2    border-gray-300/20 dark:border-gray-600/30 pt-2">
                                <p>{session.startDescription}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-md font-semibold p-2 text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                End Odometer
                              </h4>
                              {renderOdometerImage(session.endOdometerImage)}
                              <div className="mt-2 border p-2 border-gray-300/20 dark:border-gray-600/30 pt-2">
                                <p>{session.endDescription}</p>
                              </div>
                            </div>
                          </div>

                          {/* Farmer Data Section */}
                          {farmerCount > 0 && session.farmerData?.data && (
                            <div className="mb-6">
                              <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <div className="p-2  backdrop-blur-sm rounded-lg">
                                  <FaUser className="text-lantern-blue-600" />
                                </div>
                                Events in this session ({farmerCount})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {session.farmerData.data.map(
                                  (farmer, farmerIndex) => (
                                    <div
                                      key={farmer.id || farmerIndex}
                                      className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50"
                                    >
                                      <div className="flex justify-between items-start mb-3">
                                        <div>
                                          <h5 className="font-bold text-gray-800 dark:text-white">
                                            {farmer.farmerName ||
                                              `Farmer #${farmerIndex + 1}`}
                                          </h5>
                                          <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Recorded:{" "}
                                            {formatDateTime(farmer.createdAt)}
                                          </p>
                                        </div>
                                        <span className="px-2 py-1 backdrop-blur-sm  border border-purple-400/30 text-lantern-blue-600 dark:text-purple-400 text-xs font-semibold rounded-full">
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

                                      {farmer.farmerImage &&
                                        farmer.farmerImage.trim() !== "" && (
                                          <div className="mt-3">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                              Farmer Image:
                                            </p>
                                            <div className="rounded-xl overflow-hidden max-w-xs">
                                              {renderOdometerImage(
                                                farmer.farmerImage,
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  ),
                                )}
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
          </div>
        </div>
      )}

      {/* Multi-Session Map Modal */}
      {multiSessionMapView && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div
            className={`${glassmorphismClasses.modal} w-full h-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col`}
          >
            {/* Map Header */}
          <div className="bg-lantern-blue-600 backdrop-blur-sm p-3 text-white flex-shrink-0">
  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
    {/* Left Section - Employee Info */}
    <div className="flex items-center gap-4 w-full lg:w-auto">
      <div className="min-w-0 flex-1 lg:flex-none">
        <h2 className="text-xl sm:text-2xl font-bold truncate">
          {multiSessionMapView.fullName}
        </h2>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-blue-100 text-xs sm:text-sm">
          <span className="whitespace-nowrap">{multiSessionMapView.employeeCode}</span>
          <span className="hidden sm:inline">•</span>
          <span className="whitespace-nowrap">
            {new Date(multiSessionMapView.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="whitespace-nowrap">
            {multiSessionMapView.sessions.length} Session
            {multiSessionMapView.sessions.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>

    {/* Right Section - Action Buttons */}
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
      <button
        onClick={() => setShowLogMarkersMulti(!showLogMarkersMulti)}
        className={`px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-sm rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap ${
          showLogMarkersMulti ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
        }`}
      >
        <FaMapPin className="text-sm sm:text-base" />
        <span className="hidden xs:inline">
          {showLogMarkersMulti ? "Hide Log Points" : "Show Log Points"}
        </span>
        <span className="xs:hidden">
          {showLogMarkersMulti ? "Hide Logs" : "Show Logs"}
        </span>
      </button>

      <button
        onClick={() => setShowPauseMarkers(!showPauseMarkers)}
        className={`px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-sm rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap ${
          showPauseMarkers ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
        }`}
      >
        <FaPauseCircle className="text-sm sm:text-base" />
        <span className="hidden xs:inline">
          {showPauseMarkers ? "Hide Pause Points" : "Show Pause Points"}
        </span>
        <span className="xs:hidden">
          {showPauseMarkers ? "Hide Pause" : "Show Pause"}
        </span>
      </button>

      <button
        onClick={closeMultiSessionMap}
        className="bg-red-600 hover:bg-red-900 backdrop-blur-sm p-2 sm:p-4 rounded-xl transition-all flex-shrink-0"
      >
        <span className="text-xl sm:text-2xl ">✕</span>
      </button>
    </div>
  </div>
</div>

            {/* Map Container */}
            <div className="flex-1 relative">
              {multiSessionMapView.sessions.some(
                (session) => loadingLogs[session.sessionId],
              ) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <div className="text-white text-center">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading session logs...</p>
                  </div>
                </div>
              )}
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
                  if (
                    isValidCoordinate(
                      session.startLatitude,
                      session.startLongitude,
                    )
                  ) {
                    return (
                      <Marker
                        key={`start-${session.sessionId}`}
                        position={[
                          parseCoordinate(session.startLatitude),
                          parseCoordinate(session.startLongitude),
                        ]}
                        icon={customIcons.startIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <strong>
                              🟢 Start (Session #{session.sessionId})
                            </strong>
                            <br />
                            <strong>Time:</strong>{" "}
                            {formatDateTime(session.startTime)}
                            <br />
                            <strong>Coordinates:</strong>{" "}
                            {parseCoordinate(session.startLatitude).toFixed(6)},{" "}
                            {parseCoordinate(session.startLongitude).toFixed(6)}
                            <br />
                            <div
                              className="inline-block w-3 h-3 rounded-full mr-1"
                              style={{
                                backgroundColor: getSessionColor(index),
                              }}
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
                  if (
                    isValidCoordinate(session.endLatitude, session.endLongitude)
                  ) {
                    const isActive = !session.endTime;
                    return (
                      <Marker
                        key={`end-${session.sessionId}`}
                        position={[
                          parseCoordinate(session.endLatitude),
                          parseCoordinate(session.endLongitude),
                        ]}
                        icon={
                          isActive
                            ? customIcons.activeIcon
                            : customIcons.endIcon
                        }
                      >
                        <Popup>
                          <div className="text-sm">
                            <strong>
                              {isActive ? "🟡 Active" : "🔴 End"} (Session #
                              {session.sessionId})
                            </strong>
                            <br />
                            <strong>Time:</strong>{" "}
                            {isActive
                              ? "Active"
                              : formatDateTime(session.endTime)}
                            <br />
                            <strong>Coordinates:</strong>{" "}
                            {parseCoordinate(session.endLatitude).toFixed(6)},{" "}
                            {parseCoordinate(session.endLongitude).toFixed(6)}
                            <br />
                            <strong>Distance:</strong>{" "}
                            {(session.totalDistance / 1000).toFixed(2)} km
                            <br />
                            <div
                              className="inline-block w-3 h-3 rounded-full mr-1"
                              style={{
                                backgroundColor: getSessionColor(index),
                              }}
                            ></div>
                            <span>Session Color</span>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })}

                {/* Pause markers for each session */}
                {showPauseMarkers &&
                  multiSessionMapView.sessions.map((session, sessionIndex) => {
                    const pauses = detectPauses(session.sessionId);
                    return pauses.map((pause, pauseIndex) => {
                      const pauseLog = pause.start;
                      if (
                        isValidCoordinate(pauseLog.latitude, pauseLog.longitude)
                      ) {
                        return (
                          <Marker
                            key={`pause-${session.sessionId}-${pauseIndex}`}
                            position={[
                              parseCoordinate(pauseLog.latitude),
                              parseCoordinate(pauseLog.longitude),
                            ]}
                            icon={customIcons.pauseIcon}
                          >
                            <Popup>
                              <div className="text-sm min-w-[200px]">
                                <div className="flex items-center gap-2 mb-3">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                    style={{
                                      backgroundColor:
                                        getSessionColor(sessionIndex),
                                    }}
                                  >
                                    <span className="font-bold text-sm">
                                      {sessionIndex + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <strong className="text-lg text-lantern-blue-600 ">
                                      ⏸️ Pause Point
                                    </strong>
                                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                      <span>Session #{session.sessionId}</span>
                                      <span>•</span>
                                      <span>Pause #{pauseIndex + 1}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Pause Start
                                      </p>
                                      <p className="font-medium">
                                        {formatDateTime(pause.start.timestamp)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Pause End
                                      </p>
                                      <p className="font-medium">
                                        {formatDateTime(pause.end.timestamp)}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-lg font-bold px-3 rounded-full bg-red-300 text-black dark:text-gray-400">
                                      Pause Duration -
                                      <span className="text-sm">
                                        {" "}
                                        {Math.round(pause.durationMinutes)}{" "}
                                        minutes
                                      </span>
                                    </p>
                                  </div>

                                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                      <span>
                                        <strong>Coordinates:</strong>{" "}
                                        {parseCoordinate(
                                          pauseLog.latitude,
                                        ).toFixed(6)}
                                        ,{" "}
                                        {parseCoordinate(
                                          pauseLog.longitude,
                                        ).toFixed(6)}
                                      </span>
                                    </div>
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{
                                        backgroundColor:
                                          getSessionColor(sessionIndex),
                                      }}
                                    ></div>
                                    <span>Session Color</span>
                                  </div>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }
                      return null;
                    });
                  })}
                {/* Log points markers for each session */}
                {showLogMarkersMulti &&
                  multiSessionMapView.sessions.map((session, sessionIndex) => {
                    const logs = sessionLogs[session.sessionId] || [];
                    const filteredLogs = filterAndMapLogsToSession(
                      logs,
                      session,
                    );
                    return filteredLogs.slice(0, 50).map((log, logIndex) => {
                      if (isValidCoordinate(log.latitude, log.longitude)) {
                        const isPausePoint = log.pause;

                        return (
                          <Marker
                            key={`log-${session.sessionId}-${log.id || logIndex}`}
                            position={[
                              parseCoordinate(log.latitude),
                              parseCoordinate(log.longitude),
                            ]}
                            icon={L.divIcon({
                              className: "custom-marker",
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
                              iconAnchor: [4, 4],
                            })}
                          >
                            <Popup>
                              <div className="text-sm min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor:
                                        getSessionColor(sessionIndex),
                                    }}
                                  ></div>
                                  <strong>
                                    Session #{session.sessionId} - Point #
                                    {logIndex + 1}
                                  </strong>
                                </div>
                                <div className="space-y-1">
                                  <div>
                                    <strong>Time:</strong>{" "}
                                    {formatDateTime(log.timestamp)}
                                  </div>
                                  <div>
                                    <strong>Coordinates:</strong>{" "}
                                    {parseCoordinate(log.latitude).toFixed(6)},{" "}
                                    {parseCoordinate(log.longitude).toFixed(6)}
                                  </div>
                                  <div>
                                    <strong>Speed:</strong>{" "}
                                    {log.speed ? `${log.speed} km/h` : "N/A"}
                                  </div>
                                  <div>
                                    <strong>Status:</strong>{" "}
                                    {isPausePoint ? "⏸️ Pause" : "Moving"}
                                  </div>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }
                      return null;
                    });
                  })}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* Single Session Map Modal */}
      {mapView && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div
            className={`${glassmorphismClasses.modal} w-full h-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col`}
          >
           <div className="bg-lantern-blue-600 backdrop-blur-sm p-4 sm:p-6 text-white flex-shrink-0">
  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4">
    {/* Left Section - Employee Info */}
    <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
      <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl flex-shrink-0">
        <FaUser className="text-xl sm:text-2xl" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-xl sm:text-2xl font-bold truncate">
          {mapView.fullName}
        </h2>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-blue-100 text-xs sm:text-sm">
          <span className="whitespace-nowrap">
            Employee: {mapView.employeeCode}
          </span>
          <span className="hidden xs:inline text-blue-300">•</span>
          <span className="whitespace-nowrap">
            Session: #{mapView.sessionId}
          </span>
        </div>
      </div>
    </div>

    {/* Right Section - Action Buttons */}
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
      <button
        onClick={() => setShowLogMarkers(!showLogMarkers)}
        className={`px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-sm rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap ${
          showLogMarkers ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
        }`}
      >
        <FaMapPin className="text-sm sm:text-base" />
        <span className="hidden xs:inline">
          {showLogMarkers ? "Hide Log Points" : "Show Log Points"}
        </span>
        <span className="xs:hidden">
          {showLogMarkers ? "Hide Logs" : "Show Logs"}
        </span>
      </button>

      <button
        onClick={closeMap}
        className="bg-red-600 hover:bg-red-900 backdrop-blur-sm p-2 sm:p-3 rounded-xl transition-all flex-shrink-0"
      >
        <span className="text-xl sm:text-2xl">✕</span>
      </button>
    </div>
  </div>
</div>

            <div className="flex-1 relative">
              {loadingLogs[mapView.sessionId] && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <div className="text-white text-center">
                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                    <p>Loading session logs...</p>
                  </div>
                </div>
              )}
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
                          dashArray: isActive ? "10, 5" : undefined,
                        }}
                      />
                    );
                  }
                  return null;
                })()}

                {/* Start marker */}
                {isValidCoordinate(
                  mapView.startLatitude,
                  mapView.startLongitude,
                ) && (
                  <Marker
                    position={[
                      parseCoordinate(mapView.startLatitude),
                      parseCoordinate(mapView.startLongitude),
                    ]}
                    icon={customIcons.startIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>🟢 Start Point</strong>
                        <br />
                        <strong>User:</strong> {mapView.fullName}
                        <br />
                        <strong>Time:</strong>{" "}
                        {formatDateTime(mapView.startTime)}
                        <br />
                        <strong>Coordinates:</strong>{" "}
                        {parseCoordinate(mapView.startLatitude).toFixed(6)},{" "}
                        {parseCoordinate(mapView.startLongitude).toFixed(6)}
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* End marker */}
                {isValidCoordinate(
                  mapView.endLatitude,
                  mapView.endLongitude,
                ) && (
                  <Marker
                    position={[
                      parseCoordinate(mapView.endLatitude),
                      parseCoordinate(mapView.endLongitude),
                    ]}
                    icon={
                      !mapView.endTime
                        ? customIcons.activeIcon
                        : customIcons.endIcon
                    }
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>
                          {!mapView.endTime
                            ? "🟡 Active Point"
                            : "🔴 End Point"}
                        </strong>
                        <br />
                        <strong>User:</strong> {mapView.fullName}
                        <br />
                        <strong>Time:</strong>{" "}
                        {!mapView.endTime
                          ? "Active"
                          : formatDateTime(mapView.endTime)}
                        <br />
                        <strong>Coordinates:</strong>{" "}
                        {parseCoordinate(mapView.endLatitude).toFixed(6)},{" "}
                        {parseCoordinate(mapView.endLongitude).toFixed(6)}
                        <br />
                        <strong>Total Distance:</strong>{" "}
                        {(mapView.totalDistance / 1000).toFixed(2)} km
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Pause markers */}
                {showPauseMarkers &&
                  (() => {
                    const pauses = detectPauses(mapView.sessionId);
                    return pauses.map((pause, pauseIndex) => {
                      const pauseLog = pause.start;
                      if (
                        isValidCoordinate(pauseLog.latitude, pauseLog.longitude)
                      ) {
                        return (
                          <Marker
                            key={`pause-${pauseIndex}`}
                            position={[
                              parseCoordinate(pauseLog.latitude),
                              parseCoordinate(pauseLog.longitude),
                            ]}
                            icon={customIcons.pauseIcon}
                          >
                            <Popup>
                              <div className="text-sm min-w-[200px]">
                                <div className="flex items-center gap-2 ">
                                  <div>
                                    <strong className="text-lg text-lantern-blue-700 dark:text-lantern-blue-400">
                                      ⏸️ Pause Point
                                    </strong>
                                  </div>
                                </div>

                                <div className="">
                                  <div className="grid grid-cols-2 gap-1">
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Pause Start
                                      </p>
                                      <p className="font-medium">
                                        {formatDateTime(pause.start.timestamp)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Pause End
                                      </p>
                                      <p className="font-medium">
                                        {formatDateTime(pause.end.timestamp)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center ">
                                    <div>
                                      <p className="text-lg font-bold px-3 rounded-full bg-red-300 text-black dark:text-gray-400">
                                        Pause Duration -
                                        <span className="text-sm">
                                          {" "}
                                          {Math.round(
                                            pause.durationMinutes,
                                          )}{" "}
                                          minutes
                                        </span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                      <span>
                                        <strong>Coordinates:</strong>{" "}
                                        {parseCoordinate(
                                          pauseLog.latitude,
                                        ).toFixed(6)}
                                        ,{" "}
                                        {parseCoordinate(
                                          pauseLog.longitude,
                                        ).toFixed(6)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <span>
                                        <strong>Battery:</strong>{" "}
                                        {pauseLog.battery
                                          ? `${pauseLog.battery}%`
                                          : "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }
                      return null;
                    });
                  })()}

                {/* Log points markers */}
                {showLogMarkers &&
                  (() => {
                    const logs = sessionLogs[mapView.sessionId] || [];
                    const filteredLogs = filterAndMapLogsToSession(
                      logs,
                      mapView,
                    );
                    return filteredLogs.map((log, logIndex) => {
                      if (isValidCoordinate(log.latitude, log.longitude)) {
                        const isPausePoint = log.pause === true;

                        return (
                          <Marker
                            key={`log-${log.id || logIndex}`}
                            position={[
                              parseCoordinate(log.latitude),
                              parseCoordinate(log.longitude),
                            ]}
                            icon={L.divIcon({
                              className: "custom-marker",
                              html: `
                            <div style="
                              width: 12px;
                              height: 12px;
                              background-color: ${isPausePoint ? "#FFA500" : "#6366F1"};
                              border: 2px solid white;
                              border-radius: 50%;
                              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                              cursor: pointer;
                            "></div>
                          `,
                              iconSize: [12, 12],
                              iconAnchor: [6, 6],
                            })}
                          >
                            <Popup>
                              <div className="text-sm min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor: isPausePoint
                                        ? "#FFA500"
                                        : "#6366F1",
                                    }}
                                  ></div>
                                  <strong>
                                    {isPausePoint
                                      ? "⏸️ Pause Point"
                                      : "📍 Log Point"}
                                  </strong>
                                </div>
                                <div className="space-y-1">
                                  <div>
                                    <strong>Time:</strong>{" "}
                                    {formatDateTime(log.timestamp)}
                                  </div>
                                  <div>
                                    <strong>Coordinates:</strong>{" "}
                                    {parseCoordinate(log.latitude).toFixed(6)},{" "}
                                    {parseCoordinate(log.longitude).toFixed(6)}
                                  </div>
                                  <div>
                                    <strong>Speed:</strong>{" "}
                                    {log.speed ? `${log.speed} km/h` : "N/A"}
                                  </div>
                                  <div>
                                    <strong>Battery:</strong>{" "}
                                    {log.battery ? `${log.battery}%` : "N/A"}
                                  </div>
                                  <div>
                                    <strong>Point #:</strong> {logIndex + 1} of{" "}
                                    {filteredLogs.length}
                                  </div>
                                  {log.pause && (
                                    <div className="text-amber-600 font-medium">
                                      ⏸️ Pause detected
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }
                      return null;
                    });
                  })()}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
