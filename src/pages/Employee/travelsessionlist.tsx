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
  FaPauseCircle,
  FaCheckCircle,
} from "react-icons/fa";

// Import FREE MUI DatePicker components
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

import ImageZoom from "../../components/ImageZoom";
import PageMeta from "../../components/common/PageMeta";
import LoadingAnimation from "../UiElements/loadingAnimation";

import { useTravelSessionStore } from "../../store/useTravelSessionStore";
import {
  TravelSession,
  GroupedSession,
  MultiSessionMapView,
  FarmerTravelData,
} from "../../types/travelSession";
import {
  glassmorphismClasses,
  getSessionColor,
  formatDateOnly,
  formatDateTime,
  formatTimeOnly,
  calculateDuration,
  parseCoordinate,
  isValidCoordinate,
  buildPolylinePath,
  getMapCenter,
  getMapZoom,
  groupSessionsByUserAndDate,
  detectPauses as detectPausesHelper,
  filterAndMapLogsToSession,
} from "../../utils/travelSessionHelpers";
import { exportAllTravelSessionsFromAPI } from "../../utils/exportTravelSessionsToExcel";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default function TravelSessions() {
  // ---------------------------------------------------------------------
  // Zustand store: shared, cached data + fetch actions.
  // ---------------------------------------------------------------------
  const travelSessions = useTravelSessionStore((s) => s.travelSessions);
  const sessionsMap = useTravelSessionStore((s) => s.sessionsMap);
  const users = useTravelSessionStore((s) => s.users);
  const allSessions = useTravelSessionStore((s) => s.allSessions);
  const sessionLogs = useTravelSessionStore((s) => s.sessionLogs);
  const loadingLogs = useTravelSessionStore((s) => s.loadingLogs);
  const currentUserInfo = useTravelSessionStore((s) => s.currentUserInfo);
  const totalSessionsCount = useTravelSessionStore((s) => s.totalSessionsCount);
  const lastUpdateTime = useTravelSessionStore((s) => s.lastUpdateTime);
  const isLoadingSessions = useTravelSessionStore((s) => s.isLoadingSessions);

  const setCurrentUserInfo = useTravelSessionStore((s) => s.setCurrentUserInfo);
  const loadAllSessions = useTravelSessionStore((s) => s.loadAllSessions);
  const refreshSessions = useTravelSessionStore((s) => s.refreshSessions);
  const fetchActiveSessionsOnly = useTravelSessionStore(
    (s) => s.fetchActiveSessionsOnly,
  );
  const fetchSessionLogs = useTravelSessionStore((s) => s.fetchSessionLogs);
  const loadFarmerDataForGroups = useTravelSessionStore(
    (s) => s.loadFarmerDataForGroups,
  );

  // ---------------------------------------------------------------------
  // Local, UI-only state
  // ---------------------------------------------------------------------
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedApprovalStatus, setSelectedApprovalStatus] =
    useState<string>("ALL");

  // Date state using Dayjs for MUI DatePicker
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  // Convert to string format for filtering
  const startDateStr = startDate?.format("YYYY-MM-DD") || "";
  const endDateStr = endDate?.format("YYYY-MM-DD") || "";
  const isDateFilterActive = Boolean(startDateStr || endDateStr);

  const [mapView, setMapView] = useState<TravelSession | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedSessionDate, setSelectedSessionDate] = useState<string>("");

  const [multiSessionMapView, setMultiSessionMapView] =
    useState<MultiSessionMapView | null>(null);
  const [viewMode, setViewMode] = useState<"grouped" | "individual">("grouped");

  const [farmerTravelData, setFarmerTravelData] = useState<FarmerTravelData[]>(
    [],
  );
  const [showFarmerDataModal, setShowFarmerDataModal] = useState(false);
  const [selectedUserForFarmerData, setSelectedUserForFarmerData] =
    useState<string>("");
  const [isLoadingFarmerData, setIsLoadingFarmerData] = useState(false);
  const [farmerDataError, setFarmerDataError] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);

  const [showLogMarkers, setShowLogMarkers] = useState(true);
  const [showLogMarkersMulti, setShowLogMarkersMulti] = useState(true);
  const [showPauseMarkers, setShowPauseMarkers] = useState(true);

  const [isSearching, setIsSearching] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const customIcons = useMemo(
    () => ({
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
    }),
    [],
  );

  // ---------------------------------------------------------------------
  // Current user info
  // ---------------------------------------------------------------------
  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem("user");
      let userData: any = null;
      if (userDataStr) {
        try {
          userData = JSON.parse(userDataStr);
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }

      let userRole = "";
      if (localStorage.getItem("userRole"))
        userRole = localStorage.getItem("userRole") || "";
      else if (localStorage.getItem("role"))
        userRole = localStorage.getItem("role") || "";
      else if (localStorage.getItem("user_role"))
        userRole = localStorage.getItem("user_role") || "";
      else if (userData?.userRole) userRole = userData.userRole;
      else if (userData?.role) userRole = userData.role;
      else if (userData?.user_role) userRole = userData.user_role;

      let department = localStorage.getItem("department") || "";
      if (!department && userData?.department) department = userData.department;
      else if (!department && userData?.dept) department = userData.dept;

      let allocatedArea = localStorage.getItem("allocatedarea") || "";
      if (!allocatedArea && userData?.allocatedArea)
        allocatedArea = userData.allocatedArea;
      else if (!allocatedArea && userData?.area) allocatedArea = userData.area;
      else if (!allocatedArea && userData?.allocated_area)
        allocatedArea = userData.allocated_area;

      setCurrentUserInfo({
        userRole: userRole.toLowerCase().trim(),
        department: department.toLowerCase().trim(),
        allocatedArea: allocatedArea.toLowerCase().trim(),
      });
    } catch (error) {
      console.error("Error getting user info from localStorage:", error);
      setCurrentUserInfo(null);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (currentUserInfo) {
      loadAllSessions();
    }
  }, [currentUserInfo, loadAllSessions]);

  // ---------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------
  const filteredSessions = useMemo(() => {
    let filtered = [...travelSessions];

    if (startDateStr || endDateStr) {
      filtered = filtered.filter((session) => {
        const sessionDate = formatDateOnly(session.startTime);
        if (startDateStr && !endDateStr) return sessionDate >= startDateStr;
        if (!startDateStr && endDateStr) return sessionDate <= endDateStr;
        if (startDateStr && endDateStr)
          return sessionDate >= startDateStr && sessionDate <= endDateStr;
        return true;
      });
    }

    if (selectedUser) {
      filtered = filtered.filter(
        (session) => session.userId.toString() === selectedUser,
      );
    }

    // NEW: Filter by approval status
    if (selectedApprovalStatus !== "ALL") {
      filtered = filtered.filter((session) => {
        const status = session.finalStatus?.toUpperCase() || "PENDING";
        return status === selectedApprovalStatus.toUpperCase();
      });
    }

    if (appliedSearch) {
      const query = appliedSearch.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.fullName.toLowerCase().includes(query) ||
          session.employeeCode.toLowerCase().includes(query),
      );
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  }, [
    startDateStr,
    endDateStr,
    selectedUser,
    selectedApprovalStatus,
    appliedSearch,
    travelSessions,
  ]);

  const groupedView: GroupedSession[] = useMemo(
    () => groupSessionsByUserAndDate(filteredSessions, sessionLogs),
    [filteredSessions, sessionLogs],
  );

  const totalSessions = filteredSessions.length;
  const activeSessions = filteredSessions.filter((s) => !s.endTime).length;
  const totalDistance = filteredSessions.reduce(
    (sum, s) => sum + s.totalDistance,
    0,
  );

  const detectPauses = useCallback(
    (sessionId: number) =>
      detectPausesHelper(sessionId, sessionLogs, travelSessions, sessionsMap),
    [sessionLogs, travelSessions, sessionsMap],
  );

  // ---------------------------------------------------------------------
  // Auto-refresh
  // ---------------------------------------------------------------------
  // useEffect(() => {
  //   if (autoRefresh) {
  //     locationIntervalRef.current = setInterval(() => {
  //       fetchActiveSessionsOnly();
  //     }, AUTO_REFRESH_INTERVAL_MS);
  //   }
  //   return () => {
  //     if (locationIntervalRef.current) {
  //       clearInterval(locationIntervalRef.current);
  //       locationIntervalRef.current = null;
  //     }
  //   };
  // }, [autoRefresh, fetchActiveSessionsOnly]);

  const manualRefresh = () => refreshSessions();

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const clearApprovalStatusFilter = () => {
    setSelectedApprovalStatus("ALL");
  };

  const handleSearchSubmit = () => {
    setAppliedSearch(searchQuery);
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setAppliedSearch("");
    setIsSearching(false);
  };

  // ---------------------------------------------------------------------
  // Map modals
  // ---------------------------------------------------------------------
  const openMap = async (session: TravelSession) => {
    setMapView(session);
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
        sessions: [...group.sessions].sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
        center: group.sessions.length
          ? getMapCenter(group.sessions[0], sessionLogs)
          : [21.1702, 72.8311],
        zoom: 13,
      });

      await Promise.all(
        group.sessions.map((session) =>
          sessionLogs[session.sessionId]
            ? Promise.resolve()
            : fetchSessionLogs(session.sessionId, 1),
        ),
      );

      const latestLogs = useTravelSessionStore.getState().sessionLogs;
      const allPoints: [number, number][] = [];

      group.sessions.forEach((session) => {
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
        filterAndMapLogsToSession(
          latestLogs[session.sessionId] || [],
          session,
        ).forEach((log) => {
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
        const sumLat = allPoints.reduce((sum, p) => sum + p[0], 0);
        const sumLng = allPoints.reduce((sum, p) => sum + p[1], 0);
        center = [sumLat / allPoints.length, sumLng / allPoints.length];

        const lats = allPoints.map((p) => p[0]);
        const lngs = allPoints.map((p) => p[1]);
        const maxRange = Math.max(
          Math.max(...lats) - Math.min(...lats),
          Math.max(...lngs) - Math.min(...lngs),
        );

        if (maxRange > 0.1) zoom = 10;
        else if (maxRange > 0.05) zoom = 12;
        else if (maxRange > 0.01) zoom = 14;
        else if (maxRange > 0.005) zoom = 15;
        else zoom = 16;
      }

      setMultiSessionMapView((prev) =>
        prev ? { ...prev, center, zoom } : null,
      );
    },
    [sessionLogs, fetchSessionLogs],
  );

  const closeMultiSessionMap = () => setMultiSessionMapView(null);

  // ---------------------------------------------------------------------
  // Updated Farmer / travel detail modal function
  // Now accepts sessionId to fetch specific session details
  // ---------------------------------------------------------------------
  const handleFetchTravelData = async (
    userId: string,
    sessionId?: string,
    sessionDate?: string,
  ) => {
    if (!userId) {
      alert("Please select a user first");
      return;
    }

    setIsLoadingFarmerData(true);
    setFarmerDataError(null);
    setSelectedUserForFarmerData(userId);
    if (sessionDate) setSelectedSessionDate(sessionDate);

    try {
      let response;

      // If sessionId is provided, fetch specific session details
      if (sessionId) {
        response = await API.get(
          `/tracking/locationlog/get_travel_session/${sessionId}`,
          { params: { userId } },
        );
      } else {
        // Original logic for fetching all sessions with filters
        const params: any = { userId };
        if (sessionDate) {
          params.startDate = sessionDate;
          params.endDate = sessionDate;
        } else {
          if (startDateStr) params.startDate = startDateStr;
          if (endDateStr) params.endDate = endDateStr;
        }

        response = await API.get(`/tracking/locationlog/get_travel_sessions`, {
          params,
        });
      }

      const data = response.data;

      // Handle the response for both single and multiple sessions
      if (data.success) {
        let sessionsData: FarmerTravelData[] = [];

        if (sessionId) {
          // Single session response
          const session = data.session || data.data;
          if (session) {
            sessionsData = [
              {
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
              },
            ];
          }
        } else {
          // Multiple sessions response
          if (data.sessions && data.sessions.data) {
            sessionsData = data.sessions.data.map((session: any) => ({
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
            }));
          }
        }

        if (sessionsData.length > 0) {
          setFarmerTravelData(sessionsData);
          setShowFarmerDataModal(true);
        } else {
          setFarmerDataError("No travel data found for the specified session");
          setFarmerTravelData([]);
          setShowFarmerDataModal(true);
        }
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

  // ---------------------------------------------------------------------
  // Export to Excel
  // ---------------------------------------------------------------------
  const exportToCSV = async () => {
    if (!startDateStr || !endDateStr) {
      alert("Please select both a start date and an end date to export.");
      return;
    }

    try {
      setIsExporting(true);

      await exportAllTravelSessionsFromAPI(startDateStr, endDateStr, {
        startDate: startDateStr,
        endDate: endDateStr,
        selectedUser,
        appliedSearch,
      });
    } catch (error: any) {
      console.error("Export failed:", error);
      alert(
        error?.message ||
          "Failed to export data. Please check console for details.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  // ---------------------------------------------------------------------
  // Image rendering
  // ---------------------------------------------------------------------
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

  // Helper function to get user name
  const getUserName = (userId: number) => {
    const user = users.find((u) => u.userId === userId);
    return user?.username || "Unknown User";
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-gray-100/50 via-white/30 to-blue-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
        <PageMeta
          title="Employee location tracker"
          description="Track Field employee here"
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

            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {lastUpdateTime && (
                  <span className="flex items-center gap-1 backdrop-blur-sm bg-white/20 dark:bg-gray-800/30 px-3 py-1 rounded-lg whitespace-nowrap">
                    <FaClock className="text-xs flex-shrink-0" />
                    Updated: {lastUpdateTime.toLocaleTimeString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={exportToCSV}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                    isExporting
                      ? "bg-gray-400 cursor-not-allowed"
                      : " bg-lantern-blue-600 hover:bg-blue-700"
                  } text-white transition-all whitespace-nowrap`}
                  title="Export grouped sessions with detailed farmer data"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <FaSync className="animate-spin flex-shrink-0" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <FaFileCsv className="flex-shrink-0" />
                      <span>Export To CSV</span>
                    </>
                  )}
                </button>

                <button
                  onClick={manualRefresh}
                  disabled={isLoadingSessions}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all whitespace-nowrap ${
                    isLoadingSessions ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  title="Force refresh (ignores cache)"
                >
                  <FaSync
                    className={
                      isLoadingSessions
                        ? "animate-spin flex-shrink-0"
                        : "flex-shrink-0"
                    }
                  />
                  <span>Refresh</span>
                </button>

                {/* <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                    autoRefresh
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  } transition-all whitespace-nowrap`}
                  title={
                    autoRefresh ? "Auto-refresh is ON" : "Auto-refresh is OFF"
                  }
                >
                  {autoRefresh ? (
                    <>
                      <FaSync className="animate-spin flex-shrink-0" />
                      <span>Auto Refresh (ON)</span>
                    </>
                  ) : (
                    <>
                      <FaSync className="flex-shrink-0" />
                      <span>Auto Refresh (OFF)</span>
                    </>
                  )}
                </button> */}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="relative mb-6">
            <div className="absolute -top-8 right-0 z-10">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                  showStats
                    ? " bg-lantern-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
                title={showStats ? "Hide statistics" : "Show statistics"}
              >
                {showStats ? (
                  <>
                    <FaTimes className="text-sm" />
                    <span className="text-sm font-medium hidden sm:inline">
                      Hide Stats
                    </span>
                  </>
                ) : (
                  <>
                    <FaChartLine className="text-sm" />
                    <span className="text-sm font-medium hidden sm:inline">
                      Show Stats
                    </span>
                  </>
                )}
              </button>
            </div>

            {showStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/20 dark:border-gray-700/50 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Total Sessions
                      </p>
                      <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                        {isDateFilterActive ||
                        selectedUser ||
                        appliedSearch ||
                        selectedApprovalStatus !== "ALL"
                          ? totalSessions
                          : totalSessionsCount}
                      </p>
                      {(isDateFilterActive ||
                        selectedUser ||
                        appliedSearch ||
                        selectedApprovalStatus !== "ALL") && (
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

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/20 dark:border-gray-700/50 transition-all duration-300 hover:scale-105">
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

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/20 dark:border-gray-700/50 transition-all duration-300 hover:scale-105">
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

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/20 dark:border-gray-700/50 transition-all duration-300 hover:scale-105">
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
            )}
          </div>

          {/* Filters */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 mb-6 shadow-lg border border-white/20 dark:border-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Employee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Employee
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Name or Emp code..."
                    className="w-full px-4 py-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-500/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchSubmit();
                    }}
                  />
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
                      className="px-3 py-1.5  bg-lantern-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-1 text-sm"
                    >
                      <FaSearch className="text-xs" />
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

              {/* Start Date Picker - FREE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaCalendarAlt className="inline mr-2" />
                  Start Date
                </label>
                <DatePicker
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      className:
                        "bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl",
                      placeholder: "Select start date",
                    },
                    popper: {
                      className: "z-50",
                    },
                  }}
                  disableFuture
                  format="MMM DD, YYYY"
                  maxDate={endDate || undefined}
                />
              </div>

              {/* End Date Picker - FREE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaCalendarAlt className="inline mr-2" />
                  End Date
                </label>
                <DatePicker
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      className:
                        "bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl",
                      placeholder: "Select end date",
                    },
                    popper: {
                      className: "z-50",
                    },
                  }}
                  disableFuture
                  format="MMM DD, YYYY"
                  minDate={startDate || undefined}
                />
              </div>

              {/* NEW: Approval Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaCheckCircle className="inline mr-2" />
                  Approval Status
                </label>
                <select
                  className="w-full px-4 py-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-500/30"
                  value={selectedApprovalStatus}
                  onChange={(e) => setSelectedApprovalStatus(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="APPROVED">✅ Approved</option>
                  <option value="REJECTED">❌ Rejected</option>
                  <option value="PENDING">⏳ Pending</option>
                </select>
              </div>
            </div>

            {/* Quick Actions and Clear Filter */}
            {(startDate ||
              endDate ||
              selectedUser ||
              appliedSearch ||
              selectedApprovalStatus !== "ALL") && (
              <div className="mt-3 flex flex-wrap items-center gap-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                {(startDate || endDate) && (
                  <button
                    onClick={clearDateFilter}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                  >
                    <FaTimes className="text-xs" />
                    Clear Date Filter
                  </button>
                )}
                {selectedUser && (
                  <button
                    onClick={() => setSelectedUser("")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                  >
                    <FaTimes className="text-xs" />
                    Clear User Filter
                  </button>
                )}
                {selectedApprovalStatus !== "ALL" && (
                  <button
                    onClick={clearApprovalStatusFilter}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                  >
                    <FaTimes className="text-xs" />
                    Clear Status Filter
                  </button>
                )}
                {appliedSearch && (
                  <button
                    onClick={handleClearSearch}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                  >
                    <FaTimes className="text-xs" />
                    Clear Search
                  </button>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  {startDate && endDate
                    ? `Selected: ${startDate.format("MMM D, YYYY")} - ${endDate.format("MMM D, YYYY")}`
                    : startDate
                      ? `From: ${startDate.format("MMM D, YYYY")}`
                      : endDate
                        ? `Until: ${endDate.format("MMM D, YYYY")}`
                        : ""}
                  {selectedUser &&
                    ` • User: ${getUserName(parseInt(selectedUser))}`}
                  {selectedApprovalStatus !== "ALL" &&
                    ` • Status: ${selectedApprovalStatus}`}
                  {appliedSearch && ` • Search: "${appliedSearch}"`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sessions List */}
        {isLoadingSessions && travelSessions.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center mt-9 p-10">
              <LoadingAnimation />
              <p className="text-gray-600 dark:text-gray-300">
                Loading travel sessions...
              </p>
            </div>
          </div>
        ) : viewMode === "grouped" ? (
          groupedView.length === 0 ? (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-12 text-center shadow-lg border border-white/20 dark:border-gray-700/50">
              <FaRoute className="text-gray-400 dark:text-gray-600 text-5xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No Travel Sessions Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {isDateFilterActive ||
                selectedUser ||
                appliedSearch ||
                selectedApprovalStatus !== "ALL"
                  ? "Try adjusting your filters to see more results."
                  : "No travel sessions recorded yet."}
              </p>
              {isDateFilterActive && (
                <button
                  onClick={clearDateFilter}
                  className="mt-4 px-4 py-2  bg-lantern-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  Clear Date Filter
                </button>
              )}
            </div>
          ) : (
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

                return (
                  <div
                    key={`${group.userId}-${group.date}`}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-700/50 dark:to-gray-600/50 px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-lantern-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
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
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                  Approved Sessions
                                </p>
                                <p className="text-lg font-bold text-gray-800 dark:text-white">
                                  {group.approvedSessions}
                                </p>
                              </div>
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

                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-50/50 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
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

                        <div className="bg-gray-50/50 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
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

                        <div className="bg-gray-50/50 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                            <FaRoad className="text-sm" />
                            <span className="text-xs font-medium">
                              Total Distance
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">
                            {(group.totalDistance / 1000).toFixed(2)} km
                          </p>
                        </div>

                        {/* "Details" button */}
                        {/* <div className="bg-gray-50/50 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center">
                          <button
                            onClick={() =>
                              handleFetchTravelData(
                                group.userId.toString(),
                                undefined,
                                group.date,
                              )
                            }
                            className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                              isLoadingFarmerData &&
                              selectedUserForFarmerData ===
                                group.userId.toString()
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-lantern-blue-600 hover:bg-blue-700"
                            } text-white`}
                            disabled={
                              isLoadingFarmerData &&
                              selectedUserForFarmerData ===
                                group.userId.toString()
                            }
                          >
                            {isLoadingFarmerData &&
                            selectedUserForFarmerData ===
                              group.userId.toString() ? (
                              <>
                                <FaSpinner className="animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <FaInfoCircle className="text-lg" />
                                <span className="font-semibold">Details</span>
                              </>
                            )}
                          </button>
                        </div> */}
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-md font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm rounded-lg">
                              <FaListAlt className="text-blue-500" />
                            </div>
                            Sessions ({group.sessions.length})
                          </h4>
                        </div>

                        <div className="space-y-3">
                          {group.sessions.map((session, sessionIndex) => {
                            const sessionDuration = calculateDuration(
                              session.startTime,
                              session.endTime,
                            );
                            const isActive = !session.endTime;

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
                                className="bg-gray-50/50 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50"
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
                                        </span>
                                        {isActive && (
                                          <span className="px-2 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                                            LIVE - Updating
                                          </span>
                                        )}
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
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <span
                                      className={`px-2 py-1 backdrop-blur-sm border text-xs font-semibold rounded-full flex items-center gap-1 ${
                                        session.finalStatus?.toUpperCase() ===
                                        "APPROVED"
                                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-700 dark:text-green-400"
                                          : session.finalStatus?.toUpperCase() ===
                                              "REJECTED"
                                            ? "bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-400/30 text-red-700 dark:text-red-400"
                                            : "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/30 text-yellow-700 dark:text-yellow-400"
                                      }`}
                                    >
                                      {session.finalStatus?.toUpperCase() ===
                                        "APPROVED" && "✅"}
                                      {session.finalStatus?.toUpperCase() ===
                                        "REJECTED" && "❌"}
                                      {(!session.finalStatus ||
                                        session.finalStatus?.toUpperCase() ===
                                          "PENDING" ||
                                        session.finalStatus?.toUpperCase() ===
                                          "UNDER_REVIEW") &&
                                        "⏳"}
                                      {session.finalStatus || "PENDING"}
                                    </span>
                                    <button
                                      onClick={() => openMap(session)}
                                      className="px-3 py-2 bg-lantern-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium flex items-center gap-2 text-white"
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

                      <div className="flex flex-col sm:flex-row gap-5">
                        <button
                          onClick={() => openMultiSessionMap(group)}
                          className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-lantern-blue-600 hover:bg-blue-600 rounded-xl text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          <FaLayerGroup className="text-xl" />
                          View All Sessions on Map
                          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                            {group.sessions.length} session
                            {group.sessions.length > 1 ? "s" : ""}
                          </span>
                        </button>

                        <div className="bg-gray-50/50 dark:bg-gray-700/30 backdrop-blur-sm rounded-xl px-6 border border-lantern-blue-600 dark:border-gray-700/50 flex items-center justify-center">
                          <button
                            onClick={() =>
                              handleFetchTravelData(
                                group.userId.toString(),
                                undefined,
                                group.date,
                              )
                            }
                            className={`w-full px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                              isLoadingFarmerData &&
                              selectedUserForFarmerData ===
                                group.userId.toString()
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-lantern-blue-600 hover:bg-blue-700"
                            } text-white`}
                            disabled={
                              isLoadingFarmerData &&
                              selectedUserForFarmerData ===
                                group.userId.toString()
                            }
                          >
                            {isLoadingFarmerData &&
                            selectedUserForFarmerData ===
                              group.userId.toString() ? (
                              <>
                                <FaSpinner className="animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <FaInfoCircle className="text-lg" />
                                <span className="font-semibold">Details</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-12 text-center shadow-lg border border-white/20 dark:border-gray-700/50">
            <FaRoute className="text-gray-400 dark:text-gray-600 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              No Travel Sessions Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {isDateFilterActive ||
              selectedUser ||
              appliedSearch ||
              selectedApprovalStatus !== "ALL"
                ? "Try adjusting your filters to see more results."
                : "No travel sessions recorded yet."}
            </p>
            {isDateFilterActive && (
              <button
                onClick={clearDateFilter}
                className="mt-4 px-4 py-2  bg-lantern-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                Clear Date Filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const sessionDuration = calculateDuration(
                session.startTime,
                session.endTime,
              );
              const isActive = !session.endTime;

              const logs = sessionLogs[session.sessionId] || [];
              const filteredLogs = filterAndMapLogsToSession(logs, session);
              const filteredLogCount = logs.length - filteredLogs.length;

              return (
                <div
                  key={session.sessionId}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-lantern-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
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
                      <div className="text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Approval
                        </p>
                        <span
                          className={`px-3 py-1 backdrop-blur-sm rounded-full text-sm font-semibold ${
                            session.finalStatus?.toUpperCase() === "APPROVED"
                              ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-700 dark:text-green-400"
                              : session.finalStatus?.toUpperCase() ===
                                  "REJECTED"
                                ? "bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-400/30 text-red-700 dark:text-red-400"
                                : "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 text-yellow-700 dark:text-yellow-400"
                          }`}
                        >
                          {session.finalStatus?.toUpperCase() === "APPROVED" &&
                            "✅"}
                          {session.finalStatus?.toUpperCase() === "REJECTED" &&
                            "❌"}
                          {(!session.finalStatus ||
                            session.finalStatus?.toUpperCase() === "PENDING" ||
                            session.finalStatus?.toUpperCase() ===
                              "UNDER_REVIEW") &&
                            "⏳"}
                          {session.finalStatus || "PENDING"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleFetchTravelData(
                            session.userId.toString(),
                            session.sessionId.toString(),
                            formatDateOnly(session.startTime),
                          )
                        }
                        className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                          isLoadingFarmerData &&
                          selectedUserForFarmerData ===
                            session.userId.toString()
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-lantern-blue-600 hover:bg-blue-700"
                        } text-white`}
                        disabled={
                          isLoadingFarmerData &&
                          selectedUserForFarmerData ===
                            session.userId.toString()
                        }
                      >
                        {isLoadingFarmerData &&
                        selectedUserForFarmerData ===
                          session.userId.toString() ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <FaInfoCircle />
                            Details
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => openMap(session)}
                        className="px-3 py-2 bg-lantern-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium flex items-center gap-2 text-white"
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
        )}

        {/* Farmer Data Modal - Same as before */}
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
                          Emp Code:{" "}
                          {
                            users.find(
                              (u) =>
                                u.userId.toString() ===
                                selectedUserForFarmerData,
                            )?.employeeCode
                          }
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
                                )?.fullName
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
                                {new Date(
                                  selectedSessionDate,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
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
                                    Duration: {duration.hours}h{" "}
                                    {duration.minutes}m
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

                              {/* <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                                  <FaMapPin />
                                  <span className="text-sm font-medium">
                                    Location Logs
                                  </span>
                                </div>
                                <p className="text-lg font-bold text-blue-500">
                                  {session.locationLogs?.count || 0}
                                </p>
                              </div> */}
                            </div>

                            {/* Odometer Images Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                                <div className="text-sm text-black dark:text-gray-400 mb-2 border-b border-gray-300 dark:border-gray-600 pb-2">
                                  Description : {session.startDescription}
                                </div>

                                <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                  Start Odometer
                                </h4>
                                {renderOdometerImage(
                                  session.startOdometerImage,
                                )}
                              </div>
                              <div className="bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
                                <div className="text-sm text-black dark:text-gray-400 mb-2 border-b border-gray-300 dark:border-gray-600 pb-2">
                                  Description : {session.endDescription}
                                </div>
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
        {/* Multi-Session Map Modal - Same as before */}
        {multiSessionMapView && (
          <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg w-full h-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50">
              <div className="bg-lantern-blue-600 p-3 text-white flex-shrink-0">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="min-w-0 flex-1 lg:flex-none">
                      <h2 className="text-xl sm:text-2xl font-bold truncate">
                        {multiSessionMapView.fullName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-blue-100 text-xs sm:text-sm">
                        <span className="whitespace-nowrap">
                          {multiSessionMapView.employeeCode}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="whitespace-nowrap">
                          {new Date(
                            multiSessionMapView.date,
                          ).toLocaleDateString("en-US", {
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

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                    <button
                      onClick={() =>
                        setShowLogMarkersMulti(!showLogMarkersMulti)
                      }
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-sm rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap ${
                        showLogMarkersMulti
                          ? "bg-white/30"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      <FaMapPin className="text-sm sm:text-base" />
                      <span className="hidden xs:inline">
                        {showLogMarkersMulti
                          ? "Hide Log Points"
                          : "Show Log Points"}
                      </span>
                      <span className="xs:hidden">
                        {showLogMarkersMulti ? "Hide Logs" : "Show Logs"}
                      </span>
                    </button>

                    <button
                      onClick={() => setShowPauseMarkers(!showPauseMarkers)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-sm rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap ${
                        showPauseMarkers
                          ? "bg-white/30"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      <FaPauseCircle className="text-sm sm:text-base" />
                      <span className="hidden xs:inline">
                        {showPauseMarkers
                          ? "Hide Pause Points"
                          : "Show Pause Points"}
                      </span>
                      <span className="xs:hidden">
                        {showPauseMarkers ? "Hide Pause" : "Show Pause"}
                      </span>
                    </button>

                    <button
                      onClick={closeMultiSessionMap}
                      className="bg-red-600 hover:bg-red-700 backdrop-blur-sm p-2 sm:p-4 rounded-xl transition-all flex-shrink-0"
                    >
                      <span className="text-xl sm:text-2xl">✕</span>
                    </button>
                  </div>
                </div>
              </div>

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

                  {multiSessionMapView.sessions.map((session, index) => {
                    const path = buildPolylinePath(session, sessionLogs);
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
                              {parseCoordinate(session.startLatitude).toFixed(
                                6,
                              )}
                              ,{" "}
                              {parseCoordinate(session.startLongitude).toFixed(
                                6,
                              )}
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

                  {multiSessionMapView.sessions.map((session, index) => {
                    if (
                      isValidCoordinate(
                        session.endLatitude,
                        session.endLongitude,
                      )
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

                  {showPauseMarkers &&
                    multiSessionMapView.sessions.map(
                      (session, sessionIndex) => {
                        const pauses = detectPauses(session.sessionId);
                        return pauses.map((pause, pauseIndex) => {
                          const pauseLog = pause.start;
                          if (
                            isValidCoordinate(
                              pauseLog.latitude,
                              pauseLog.longitude,
                            )
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
                                        <strong className="text-lg text-blue-600">
                                          ⏸️ Pause Point
                                        </strong>
                                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                          <span>
                                            Session #{session.sessionId}
                                          </span>
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
                                            {formatDateTime(
                                              pause.start.timestamp,
                                            )}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Pause End
                                          </p>
                                          <p className="font-medium">
                                            {formatDateTime(
                                              pause.end.timestamp,
                                            )}
                                          </p>
                                        </div>
                                      </div>

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
                      },
                    )}

                  {showLogMarkersMulti &&
                    multiSessionMapView.sessions.map(
                      (session, sessionIndex) => {
                        const logs = sessionLogs[session.sessionId] || [];
                        const filteredLogs = filterAndMapLogsToSession(
                          logs,
                          session,
                        );
                        return filteredLogs
                          .slice(0, 50)
                          .map((log, logIndex) => {
                            if (
                              isValidCoordinate(log.latitude, log.longitude)
                            ) {
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
                                          {parseCoordinate(
                                            log.latitude,
                                          ).toFixed(6)}
                                          ,{" "}
                                          {parseCoordinate(
                                            log.longitude,
                                          ).toFixed(6)}
                                        </div>
                                        <div>
                                          <strong>Speed:</strong>{" "}
                                          {log.speed
                                            ? `${(log.speed * 3.6).toFixed(2)} km/h`
                                            : "N/A"}
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
                      },
                    )}
                </MapContainer>
              </div>
            </div>
          </div>
        )}

        {/* Single Session Map Modal - Same as before */}
        {mapView && (
          <div className="fixed inset-0 z-50 bg-white/40 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg w-full h-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50">
              <div className="bg-lantern-blue-600 p-4 sm:p-6 text-white flex-shrink-0">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4">
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
                        <span className="hidden xs:inline text-blue-300">
                          •
                        </span>
                        <span className="whitespace-nowrap">
                          Session: #{mapView.sessionId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                    <button
                      onClick={() => setShowLogMarkers(!showLogMarkers)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-sm rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap ${
                        showLogMarkers
                          ? "bg-white/30"
                          : "bg-white/10 hover:bg-white/20"
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
                      className="bg-red-600 hover:bg-red-700 backdrop-blur-sm p-2 sm:p-3 rounded-xl transition-all flex-shrink-0"
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
                  center={getMapCenter(mapView, sessionLogs)}
                  zoom={getMapZoom(mapView, sessionLogs)}
                  scrollWheelZoom
                  style={{ height: "100%", width: "100%" }}
                  key={`map-${mapView.sessionId}-${lastUpdateTime?.getTime()}`}
                >
                  <TileLayer
                    attribution="Google Maps"
                    url="https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}"
                  />

                  {(() => {
                    const path = buildPolylinePath(mapView, sessionLogs);
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

                  {showPauseMarkers &&
                    (() => {
                      const pauses = detectPauses(mapView.sessionId);
                      return pauses.map((pause, pauseIndex) => {
                        const pauseLog = pause.start;
                        if (
                          isValidCoordinate(
                            pauseLog.latitude,
                            pauseLog.longitude,
                          )
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
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <strong className="text-lg text-blue-600 dark:text-blue-400">
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
                                          {formatDateTime(
                                            pause.start.timestamp,
                                          )}
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

                                    <div className="flex items-center">
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
                                      {parseCoordinate(log.latitude).toFixed(6)}
                                      ,{" "}
                                      {parseCoordinate(log.longitude).toFixed(
                                        6,
                                      )}
                                    </div>
                                    <div>
                                      <strong>Speed:</strong>{" "}
                                      {log.speed
                                        ? `${(log.speed * 3.6).toFixed(2)} km/h`
                                        : "N/A"}
                                    </div>
                                    <div>
                                      <strong>Battery:</strong>{" "}
                                      {log.battery ? `${log.battery}%` : "N/A"}
                                    </div>
                                    <div>
                                      <strong>Point #:</strong> {logIndex + 1}{" "}
                                      of {filteredLogs.length}
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
    </LocalizationProvider>
  );
}
