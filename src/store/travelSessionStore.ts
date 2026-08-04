// src/store/travelSessionsStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import API from "../api/axios";

// Types
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

interface UserInfo {
  userRole?: string;
  department?: string;
  allocatedArea?: string;
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

// Store State
interface TravelSessionsState {
  // State
  travelSessions: TravelSession[];
  sessionsMap: Record<string, TravelSession>;
  selectedUser: string;
  startDate: string;
  endDate: string;
  users: {
    userId: number;
    fullName: string;
    username: string;
    employeeCode: string;
    department?: string;
    allocatedArea?: string;
  }[];
  isLoading: boolean;
  isLoadingMore: boolean;
  lastUpdateTime: Date | null;
  autoRefresh: boolean;
  searchQuery: string;
  appliedSearch: string;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  groupedView: GroupedSession[];
  viewMode: "grouped" | "individual";
  allSessions: TravelSession[];
  allFarmerData: Record<string, any>;
  totalSessionsCount: number;
  sessionLogs: Record<number, LocationLog[]>;
  loadingLogs: Record<number, boolean>;
  logsPagination: Record<number, any>;
  isSearching: boolean;
  showStats: boolean;
  isLoadingFarmerDataForExport: boolean;
  selectedUserForFarmerData: string;
  showFarmerDataModal: boolean;
  isLoadingFarmerData: boolean;
  farmerDataError: string | null;
  farmerTravelData: any[];
  currentUserInfo: UserInfo | null;
  mapView: TravelSession | null;
  multiSessionMapView: any | null;
  showLogMarkers: boolean;
  showLogMarkersMulti: boolean;
  showPauseMarkers: boolean;
  isExporting: boolean;
  selectedSessionDate: string;

  // Computed
  filteredSessions: TravelSession[];
  activeSessionsCount: number;
  totalDistance: number;

  // Actions
  setSelectedUser: (userId: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setSearchQuery: (query: string) => void;
  setAppliedSearch: (query: string) => void;
  setViewMode: (mode: "grouped" | "individual") => void;
  setAutoRefresh: (enabled: boolean) => void;
  setShowStats: (show: boolean) => void;
  setShowLogMarkers: (show: boolean) => void;
  setShowLogMarkersMulti: (show: boolean) => void;
  setShowPauseMarkers: (show: boolean) => void;
  setMapView: (session: TravelSession | null) => void;
  setMultiSessionMapView: (view: any | null) => void;
  setSelectedSessionDate: (date: string) => void;
  setSelectedUserForFarmerData: (userId: string) => void;
  setShowFarmerDataModal: (show: boolean) => void;
  setFarmerDataError: (error: string | null) => void;
  setFarmerTravelData: (data: any[]) => void;
  setIsLoadingFarmerData: (loading: boolean) => void;
  setIsExporting: (exporting: boolean) => void;

  // API Actions
  fetchTravelSessions: (page?: number, append?: boolean) => Promise<void>;
  loadMoreSessions: () => Promise<void>;
  loadMoreSessionsForUser: (userId: number, date: string) => Promise<void>;
  fetchActiveSessionsOnly: () => Promise<void>;
  fetchSessionLogs: (
    sessionId: number,
    page?: number,
  ) => Promise<LocationLog[]>;
  searchAllSessions: (searchTerm: string) => Promise<void>;
  loadAllSessionsForExport: () => Promise<void>;
  loadAllFarmerData: (sessions: TravelSession[]) => Promise<void>;
  exportToCSV: () => Promise<void>;
  handleFetchTravelData: (
    userId: string,
    sessionDate?: string,
  ) => Promise<void>;
  clearDateFilter: () => void;
  handleSearchSubmit: () => void;
  handleClearSearch: () => void;
  manualRefresh: () => void;
  getUserInfo: () => void;
  openMap: (session: TravelSession) => Promise<void>;
  closeMap: () => void;
  openMultiSessionMap: (group: GroupedSession) => Promise<void>;
  closeMultiSessionMap: () => void;
  closeFarmerDataModal: () => void;
  resetState: () => void;
}

// Helper functions
const filterSessionsByRole = (
  sessions: TravelSession[],
  userInfo: UserInfo | null,
): TravelSession[] => {
  if (!userInfo?.userRole) return sessions;

  const userRole = userInfo.userRole.toLowerCase().trim();

  // Admin or HR - can see all sessions
  if (
    ["admin", "superadmin", "hr", "hr_manager"].some((role) =>
      userRole.includes(role),
    )
  ) {
    return sessions;
  }

  // Manager or HOD
  if (userRole.includes("manager") || userRole.includes("headofdepartment")) {
    const department = userInfo.department?.toLowerCase().trim();
    if (!department) return [];
    return sessions.filter(
      (s) => (s.department || "").toLowerCase().trim() === department,
    );
  }

  // Zonal Manager
  if (userRole.includes("zonal")) {
    const area = userInfo.allocatedArea?.toLowerCase().trim();
    if (!area) return [];
    return sessions.filter(
      (s) => (s.allocatedArea || "").toLowerCase().trim() === area,
    );
  }

  return sessions;
};

const filterUsersByRole = (users: any[], userInfo: UserInfo | null) => {
  if (!userInfo?.userRole) return users;

  const userRole = userInfo.userRole.toLowerCase().trim();

  if (
    ["admin", "superadmin", "hr", "hr_manager"].some((role) =>
      userRole.includes(role),
    )
  ) {
    return users;
  }

  if (userRole.includes("manager") || userRole.includes("headofdepartment")) {
    const department = userInfo.department?.toLowerCase().trim();
    if (!department) return [];
    return users.filter(
      (u) => (u.department || "").toLowerCase().trim() === department,
    );
  }

  if (userRole.includes("zonal")) {
    const area = userInfo.allocatedArea?.toLowerCase().trim();
    if (!area) return [];
    return users.filter(
      (u) => (u.allocatedArea || "").toLowerCase().trim() === area,
    );
  }

  return users;
};

const formatDateOnly = (dateTimeStr: string): string => {
  if (!dateTimeStr) return "";
  const date = new Date(dateTimeStr);
  return date.toISOString().split("T")[0];
};

const calculateAdjustedGroupDistance = (sessions: TravelSession[]) => {
  if (sessions.length === 0) {
    return {
      totalDistance: 0,
      firstSessionDistance: 0,
      originalTotalDistance: 0,
      excludedSessions: 0,
    };
  }

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const originalTotalDistance = sortedSessions.reduce(
    (sum, s) => sum + (s.totalDistance || 0),
    0,
  );

  // ALL sessions included for ALL roles - NO EXCLUSIONS
  return {
    totalDistance: originalTotalDistance,
    firstSessionDistance: 0,
    originalTotalDistance,
    excludedSessions: 0,
  };
};

const filterLogsBySessionTime = (
  logs: LocationLog[],
  sessionStartTime: string,
  sessionEndTime?: string,
) => {
  if (!logs || logs.length === 0) return [];

  const sessionStart = new Date(sessionStartTime).getTime();
  const sessionEnd = sessionEndTime ? new Date(sessionEndTime).getTime() : null;
  const sessionDate = new Date(sessionStartTime);
  sessionDate.setHours(0, 0, 0, 0);
  const sessionDateStart = sessionDate.getTime();

  return logs.filter((log) => {
    const logTime = new Date(log.timestamp).getTime();
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);
    const logDateOnly = logDate.getTime();

    if (logDateOnly !== sessionDateStart) return false;
    if (sessionEnd) return logTime >= sessionStart && logTime <= sessionEnd;
    const now = new Date().getTime();
    return logTime >= sessionStart && logTime <= now;
  });
};

const filterAndMapLogsToSession = (
  logs: LocationLog[],
  session: TravelSession,
) => {
  if (!logs || logs.length === 0) return [];
  if (!session) return logs;
  return filterLogsBySessionTime(
    logs,
    session.startTime,
    session.endTime || undefined,
  );
};

// Create the store
export const useTravelSessionsStore = create<TravelSessionsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        travelSessions: [],
        sessionsMap: {},
        selectedUser: "",
        startDate: "",
        endDate: "",
        users: [],
        isLoading: false,
        isLoadingMore: false,
        lastUpdateTime: null,
        autoRefresh: false,
        searchQuery: "",
        appliedSearch: "",
        currentPage: 1,
        totalPages: 1,
        hasMore: true,
        groupedView: [],
        viewMode: "grouped",
        allSessions: [],
        allFarmerData: {},
        totalSessionsCount: 0,
        sessionLogs: {},
        loadingLogs: {},
        logsPagination: {},
        isSearching: false,
        showStats: true,
        isLoadingFarmerDataForExport: false,
        selectedUserForFarmerData: "",
        showFarmerDataModal: false,
        isLoadingFarmerData: false,
        farmerDataError: null,
        farmerTravelData: [],
        currentUserInfo: null,
        mapView: null,
        multiSessionMapView: null,
        showLogMarkers: true,
        showLogMarkersMulti: true,
        showPauseMarkers: true,
        isExporting: false,
        selectedSessionDate: "",

        // Computed
        get filteredSessions() {
          const state = get();
          let filtered = [...state.travelSessions];

          if (state.startDate || state.endDate) {
            filtered = filtered.filter((session) => {
              const sessionDate = new Date(session.startTime);
              const sessionDateOnly = sessionDate.toISOString().split("T")[0];
              if (state.startDate && !state.endDate)
                return sessionDateOnly >= state.startDate;
              if (!state.startDate && state.endDate)
                return sessionDateOnly <= state.endDate;
              if (state.startDate && state.endDate) {
                return (
                  sessionDateOnly >= state.startDate &&
                  sessionDateOnly <= state.endDate
                );
              }
              return true;
            });
          }

          if (state.selectedUser) {
            filtered = filtered.filter(
              (session) => session.userId.toString() === state.selectedUser,
            );
          }

          if (state.appliedSearch) {
            const query = state.appliedSearch.toLowerCase();
            filtered = filtered.filter(
              (session) =>
                session.fullName.toLowerCase().includes(query) ||
                session.employeeCode.toLowerCase().includes(query),
            );
          }

          if (state.currentUserInfo?.userRole) {
            filtered = filterSessionsByRole(filtered, state.currentUserInfo);
          }

          return filtered.sort((a, b) => {
            const dateA = new Date(a.startTime).getTime();
            const dateB = new Date(b.startTime).getTime();
            if (Math.abs(dateA - dateB) > 86400000) return dateB - dateA;
            return a.sessionId - b.sessionId;
          });
        },

        get activeSessionsCount() {
          return get().filteredSessions.filter((s) => !s.endTime).length;
        },

        get totalDistance() {
          return get().filteredSessions.reduce(
            (sum, s) => sum + s.totalDistance,
            0,
          );
        },

        // Setters
        setSelectedUser: (userId) => set({ selectedUser: userId }),
        setStartDate: (date) => set({ startDate: date }),
        setEndDate: (date) => set({ endDate: date }),
        setSearchQuery: (query) => set({ searchQuery: query }),
        setAppliedSearch: (query) => set({ appliedSearch: query }),
        setViewMode: (mode) => set({ viewMode: mode }),
        setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
        setShowStats: (show) => set({ showStats: show }),
        setShowLogMarkers: (show) => set({ showLogMarkers: show }),
        setShowLogMarkersMulti: (show) => set({ showLogMarkersMulti: show }),
        setShowPauseMarkers: (show) => set({ showPauseMarkers: show }),
        setMapView: (session) => set({ mapView: session }),
        setMultiSessionMapView: (view) => set({ multiSessionMapView: view }),
        setSelectedSessionDate: (date) => set({ selectedSessionDate: date }),
        setSelectedUserForFarmerData: (userId) =>
          set({ selectedUserForFarmerData: userId }),
        setShowFarmerDataModal: (show) => set({ showFarmerDataModal: show }),
        setFarmerDataError: (error) => set({ farmerDataError: error }),
        setFarmerTravelData: (data) => set({ farmerTravelData: data }),
        setIsLoadingFarmerData: (loading) =>
          set({ isLoadingFarmerData: loading }),
        setIsExporting: (exporting) => set({ isExporting: exporting }),

        // Get user info from localStorage
        getUserInfo: () => {
          try {
            const userDataStr = localStorage.getItem("user");
            let userData = null;
            if (userDataStr) {
              try {
                userData = JSON.parse(userDataStr);
              } catch (e) {}
            }

            let userRole =
              localStorage.getItem("userRole") ||
              localStorage.getItem("role") ||
              userData?.userRole ||
              userData?.role ||
              "";

            let department =
              localStorage.getItem("department") ||
              userData?.department ||
              userData?.dept ||
              "";

            let allocatedArea =
              localStorage.getItem("allocatedarea") ||
              userData?.allocatedArea ||
              userData?.area ||
              "";

            set({
              currentUserInfo: {
                userRole: userRole.toLowerCase().trim(),
                department: department.toLowerCase().trim(),
                allocatedArea: allocatedArea.toLowerCase().trim(),
              },
            });
          } catch (error) {
            console.error("Error getting user info:", error);
            set({ currentUserInfo: null });
          }
        },

        // Group sessions by user and date
        groupSessionsByUserAndDate: (sessions: TravelSession[]) => {
          const groupedMap = new Map<string, GroupedSession>();

          const sortedSessions = [...sessions].sort((a, b) => {
            return (
              new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            );
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
                  new Date(session.startTime) <
                  new Date(existingGroup.startTime)
                ) {
                  existingGroup.startTime = session.startTime;
                }
                const sessionEndTime = session.endTime || session.startTime;
                if (
                  new Date(sessionEndTime) > new Date(existingGroup.endTime)
                ) {
                  existingGroup.endTime = sessionEndTime;
                }
              }
            }
          });

          const sessionLogs = get().sessionLogs;

          const groups = Array.from(groupedMap.values()).map((group) => {
            const distanceData = calculateAdjustedGroupDistance(group.sessions);
            let totalPoints = 0;
            group.sessions.forEach((session) => {
              const logs = sessionLogs[session.sessionId] || [];
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
            const getLatestSessionTime = (group: GroupedSession) => {
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

        // API Actions
        fetchTravelSessions: async (page = 1, append = false) => {
          const state = get();
          if (page === 1) {
            set({ isLoading: true });
          } else {
            set({ isLoadingMore: true });
          }

          try {
            const params: any = { page };
            if (state.startDate) params.startDate = state.startDate;
            if (state.endDate) params.endDate = state.endDate;
            if (state.selectedUser) params.userId = state.selectedUser;
            if (state.searchQuery) params.search = state.searchQuery;

            // Apply role-based filtering
            if (state.currentUserInfo?.userRole) {
              const userRole = state.currentUserInfo.userRole
                .toLowerCase()
                .trim();
              if (
                userRole.includes("manager") ||
                userRole.includes("headofdepartment")
              ) {
                if (state.currentUserInfo.department) {
                  params.department = state.currentUserInfo.department;
                }
              }
              if (userRole.includes("zonal")) {
                if (state.currentUserInfo.allocatedArea) {
                  params.allocatedArea = state.currentUserInfo.allocatedArea;
                }
              }
            }

            const res = await API.get<ApiPaginationResponse>(
              "/admin/travel-sessions",
              { params },
            );

            if (res.data.success) {
              const sessions = res.data.data || [];
              let filteredSessions = sessions;

              if (state.currentUserInfo?.userRole) {
                filteredSessions = filterSessionsByRole(
                  sessions,
                  state.currentUserInfo,
                );
              }

              let updatedSessions: TravelSession[];
              if (append) {
                const existingIds = new Set(
                  state.travelSessions.map((s) => s.sessionId),
                );
                const newSessions = filteredSessions.filter(
                  (s) => !existingIds.has(s.sessionId),
                );
                updatedSessions = [...state.travelSessions, ...newSessions];
              } else {
                updatedSessions = filteredSessions;
              }

              // Update sessions
              set({
                travelSessions: updatedSessions,
                totalSessionsCount: res.data.totalSessions || sessions.length,
                currentPage: res.data.currentPage || 1,
                totalPages: res.data.totalPages || 1,
                hasMore: res.data.hasNextPage || false,
                lastUpdateTime: new Date(),
              });

              // Update users
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

              const filteredUsers = filterUsersByRole(
                uniqueUsers,
                state.currentUserInfo,
              );
              set({ users: filteredUsers });

              // Update sessions map
              const newCache: Record<string, TravelSession> = {};
              filteredSessions.forEach((session) => {
                const key = `${session.userId}-${session.sessionId}`;
                newCache[key] = session;
              });
              set((prev) => ({
                sessionsMap: { ...prev.sessionsMap, ...newCache },
              }));

              // Update grouped view
              const grouped = get().groupSessionsByUserAndDate(updatedSessions);
              set({ groupedView: grouped });
            }
          } catch (err) {
            console.error("Failed to fetch travel sessions", err);
          } finally {
            set({ isLoading: false, isLoadingMore: false });
          }
        },

        loadMoreSessions: async () => {
          const state = get();
          if (!state.hasMore || state.isLoading || state.isLoadingMore) return;
          const nextPage = state.currentPage + 1;
          await get().fetchTravelSessions(nextPage, true);
        },

        loadMoreSessionsForUser: async (userId: number, date: string) => {
          const state = get();
          const groupIndex = state.groupedView.findIndex(
            (g) => g.userId === userId && g.date === date,
          );
          if (groupIndex === -1) return;

          set((prev) => {
            const updated = [...prev.groupedView];
            updated[groupIndex] = { ...updated[groupIndex], isLoading: true };
            return { groupedView: updated };
          });

          try {
            const params: any = {
              userId,
              startDate: date,
              endDate: date,
              per_page: 1000,
            };

            if (state.currentUserInfo?.userRole) {
              const userRole = state.currentUserInfo.userRole
                .toLowerCase()
                .trim();
              if (
                userRole.includes("manager") ||
                userRole.includes("headofdepartment")
              ) {
                if (state.currentUserInfo.department)
                  params.department = state.currentUserInfo.department;
              }
              if (userRole.includes("zonal")) {
                if (state.currentUserInfo.allocatedArea)
                  params.allocatedArea = state.currentUserInfo.allocatedArea;
              }
            }

            const res = await API.get<ApiPaginationResponse>(
              "/admin/travel-sessions",
              { params },
            );

            if (res.data.success) {
              let filteredSessions = res.data.data || [];
              if (state.currentUserInfo?.userRole) {
                filteredSessions = filterSessionsByRole(
                  filteredSessions,
                  state.currentUserInfo,
                );
              }

              set((prev) => {
                const filtered = prev.travelSessions.filter(
                  (s) =>
                    !(
                      s.userId === userId &&
                      formatDateOnly(s.startTime) === date
                    ),
                );
                return { travelSessions: [...filtered, ...filteredSessions] };
              });

              set((prev) => {
                const updated = [...prev.groupedView];
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
                  const distanceData =
                    calculateAdjustedGroupDistance(allSessions);

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

                return { groupedView: updated };
              });

              const newCache: Record<string, TravelSession> = {};
              filteredSessions.forEach((session) => {
                const key = `${session.userId}-${session.sessionId}`;
                newCache[key] = session;
              });
              set((prev) => ({
                sessionsMap: { ...prev.sessionsMap, ...newCache },
              }));
            }
          } catch (err) {
            console.error("Failed to fetch more sessions for user", err);
            set((prev) => {
              const updated = [...prev.groupedView];
              updated[groupIndex] = {
                ...updated[groupIndex],
                isLoading: false,
              };
              return { groupedView: updated };
            });
          }
        },

        fetchActiveSessionsOnly: async () => {
          const state = get();
          try {
            const params: any = {};

            if (state.currentUserInfo?.userRole) {
              const userRole = state.currentUserInfo.userRole
                .toLowerCase()
                .trim();
              if (
                userRole.includes("manager") ||
                userRole.includes("headofdepartment")
              ) {
                if (state.currentUserInfo.department)
                  params.department = state.currentUserInfo.department;
              }
              if (userRole.includes("zonal")) {
                if (state.currentUserInfo.allocatedArea)
                  params.allocatedArea = state.currentUserInfo.allocatedArea;
              }
            }

            const res = await API.get("/admin/travel-sessions", { params });
            if (res.data.success) {
              const allSessions = res.data.data || [];
              let filteredSessions = allSessions;
              if (state.currentUserInfo?.userRole) {
                filteredSessions = filterSessionsByRole(
                  allSessions,
                  state.currentUserInfo,
                );
              }

              set((prev) => {
                const updatedSessions = [...prev.travelSessions];
                const activeSessionMap = new Map<number, TravelSession>();

                filteredSessions.forEach((session: TravelSession) => {
                  if (!session.endTime) {
                    activeSessionMap.set(session.sessionId, session);
                  }
                });

                updatedSessions.forEach((session, index) => {
                  if (
                    !session.endTime &&
                    activeSessionMap.has(session.sessionId)
                  ) {
                    updatedSessions[index] = activeSessionMap.get(
                      session.sessionId,
                    )!;
                    activeSessionMap.delete(session.sessionId);
                  }
                });

                activeSessionMap.forEach((session) => {
                  updatedSessions.push(session);
                });

                return {
                  travelSessions: updatedSessions.sort((a, b) => {
                    return (
                      new Date(b.startTime).getTime() -
                      new Date(a.startTime).getTime()
                    );
                  }),
                };
              });

              filteredSessions.forEach((session: TravelSession) => {
                if (!session.endTime) {
                  const key = `${session.userId}-${session.sessionId}`;
                  set((prev) => ({
                    sessionsMap: { ...prev.sessionsMap, [key]: session },
                  }));
                }
              });

              const grouped = get().groupSessionsByUserAndDate(
                get().travelSessions,
              );
              set({ groupedView: grouped, lastUpdateTime: new Date() });
            }
          } catch (err) {
            console.error("Failed to fetch active sessions", err);
          }
        },

        fetchSessionLogs: async (sessionId: number, page = 1) => {
          set((prev) => ({
            loadingLogs: { ...prev.loadingLogs, [sessionId]: true },
          }));

          try {
            const response = await API.get<SessionLogsResponse>(
              `/admin/travel-sessions/${sessionId}/logs`,
              { params: { page, limit: 100 } },
            );

            if (response.data.success) {
              const logs = response.data.data;
              const state = get();
              const session =
                state.sessionsMap[`${sessionId}`] ||
                state.travelSessions.find((s) => s.sessionId === sessionId);

              let filteredLogs = logs;
              if (session) {
                filteredLogs = filterAndMapLogsToSession(logs, session);
              }

              set((prev) => ({
                sessionLogs: {
                  ...prev.sessionLogs,
                  [sessionId]:
                    page === 1
                      ? filteredLogs
                      : [
                          ...(prev.sessionLogs[sessionId] || []),
                          ...filteredLogs,
                        ],
                },
                logsPagination: {
                  ...prev.logsPagination,
                  [sessionId]: response.data.pagination,
                },
              }));

              return filteredLogs;
            }
          } catch (error) {
            console.error(
              `Failed to fetch logs for session ${sessionId}:`,
              error,
            );
          } finally {
            set((prev) => ({
              loadingLogs: { ...prev.loadingLogs, [sessionId]: false },
            }));
          }
          return [];
        },

        searchAllSessions: async (searchTerm: string) => {
          if (!searchTerm.trim()) {
            set({ isSearching: false });
            await get().fetchTravelSessions(1, false);
            return;
          }

          set({ isLoading: true, isSearching: true });

          try {
            let allSessions: TravelSession[] = [];
            let page = 1;
            let hasMore = true;
            const maxPages = 10;
            let apiTotalSessions = 0;
            const state = get();

            while (hasMore && page <= maxPages) {
              const params: any = {
                page: page,
                limit: 100,
                search: searchTerm,
              };

              if (state.startDate) params.startDate = state.startDate;
              if (state.endDate) params.endDate = state.endDate;
              if (state.selectedUser) params.userId = state.selectedUser;

              if (state.currentUserInfo?.userRole) {
                const userRole = state.currentUserInfo.userRole
                  .toLowerCase()
                  .trim();
                if (
                  userRole.includes("manager") ||
                  userRole.includes("headofdepartment")
                ) {
                  if (state.currentUserInfo.department)
                    params.department = state.currentUserInfo.department;
                }
                if (userRole.includes("zonal")) {
                  if (state.currentUserInfo.allocatedArea)
                    params.allocatedArea = state.currentUserInfo.allocatedArea;
                }
              }

              const res = await API.get<ApiPaginationResponse>(
                "/admin/travel-sessions",
                { params },
              );

              if (res.data.success) {
                const sessions = res.data.data || [];
                allSessions = [...allSessions, ...sessions];
                if (page === 1)
                  apiTotalSessions = res.data.totalSessions || sessions.length;
                hasMore = res.data.hasNextPage || false;
                page++;
              } else {
                hasMore = false;
              }
            }

            let filteredSessions = allSessions;
            if (state.currentUserInfo?.userRole) {
              filteredSessions = filterSessionsByRole(
                allSessions,
                state.currentUserInfo,
              );
            }

            set({
              totalSessionsCount: apiTotalSessions,
              travelSessions: filteredSessions,
            });

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

            const filteredUsers = filterUsersByRole(
              uniqueUsers,
              state.currentUserInfo,
            );
            set({ users: filteredUsers });

            const grouped = get().groupSessionsByUserAndDate(filteredSessions);
            set({
              groupedView: grouped,
              currentPage: 1,
              totalPages: 1,
              hasMore: false,
              lastUpdateTime: new Date(),
            });
          } catch (err) {
            console.error("Failed to search sessions", err);
          } finally {
            set({ isLoading: false, isSearching: false });
          }
        },

        loadAllSessionsForExport: async () => {
          set({ isLoadingAllSessions: true });
          try {
            let allSessions: TravelSession[] = [];
            let currentPage = 1;
            let totalPages = 1;
            let hasMore = true;
            const state = get();

            while (hasMore) {
              const params: any = { page: currentPage, limit: 100 };
              if (state.startDate) params.startDate = state.startDate;
              if (state.endDate) params.endDate = state.endDate;

              if (state.currentUserInfo?.userRole) {
                const userRole = state.currentUserInfo.userRole
                  .toLowerCase()
                  .trim();
                if (
                  userRole.includes("manager") ||
                  userRole.includes("headofdepartment")
                ) {
                  if (state.currentUserInfo.department)
                    params.department = state.currentUserInfo.department;
                }
                if (userRole.includes("zonal")) {
                  if (state.currentUserInfo.allocatedArea)
                    params.allocatedArea = state.currentUserInfo.allocatedArea;
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
                if (currentPage < totalPages) currentPage++;
                else hasMore = false;
              } else {
                hasMore = false;
              }
            }

            let filteredSessions = allSessions;
            if (state.currentUserInfo?.userRole) {
              filteredSessions = filterSessionsByRole(
                allSessions,
                state.currentUserInfo,
              );
            }

            set({ allSessions: filteredSessions });
          } catch (err) {
            console.error("Failed to load all sessions for export", err);
          } finally {
            set({ isLoadingAllSessions: false });
          }
        },

        loadAllFarmerData: async (sessions: TravelSession[]) => {
          if (!sessions || sessions.length === 0) return;

          set({ isLoadingFarmerDataForExport: true });

          try {
            const farmerDataMap: Record<string, any> = {};
            const batchSize = 10;

            for (let i = 0; i < sessions.length; i += batchSize) {
              const batch = sessions.slice(i, i + batchSize);
              const promises = batch.map(async (session) => {
                try {
                  const key = `${session.userId}-${formatDateOnly(session.startTime)}`;
                  if (farmerDataMap[key]) return;

                  const response = await API.get(
                    `/tracking/locationlog/get_travel_sessions`,
                    {
                      params: {
                        userId: session.userId,
                        startDate: formatDateOnly(session.startTime),
                        endDate: formatDateOnly(session.startTime),
                      },
                      timeout: 5000,
                    },
                  );

                  if (response.data.success && response.data.sessions?.data) {
                    farmerDataMap[key] = response.data.sessions.data;
                  }
                } catch (error) {
                  console.error("Error fetching farmer data:", error);
                }
              });

              await Promise.all(promises);
            }

            set({ allFarmerData: farmerDataMap });
          } catch (err) {
            console.error("Failed to load farmer data:", err);
          } finally {
            set({ isLoadingFarmerDataForExport: false });
          }
        },

        handleFetchTravelData: async (userId: string, sessionDate?: string) => {
          if (!userId) {
            alert("Please select a user first");
            return;
          }

          set({
            isLoadingFarmerData: true,
            farmerDataError: null,
            selectedUserForFarmerData: userId,
          });

          if (sessionDate) {
            set({ selectedSessionDate: sessionDate });
          }

          try {
            const state = get();
            const params: any = { userId };

            if (sessionDate) {
              params.startDate = sessionDate;
              params.endDate = sessionDate;
            } else {
              if (state.startDate) params.startDate = state.startDate;
              if (state.endDate) params.endDate = state.endDate;
            }

            const response = await API.get(
              `/tracking/locationlog/get_travel_sessions`,
              { params },
            );
            const data = response.data;

            if (data.success && data.sessions && data.sessions.data) {
              const allSessions = data.sessions.data.map((session: any) => ({
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

              set({ farmerTravelData: allSessions, showFarmerDataModal: true });
            } else {
              set({
                farmerDataError: data.message || "No travel data found",
                farmerTravelData: [],
                showFarmerDataModal: true,
              });
            }
          } catch (error: any) {
            console.error("Error fetching travel data:", error);
            if (error.response) {
              set({
                farmerDataError: `Error ${error.response.status}: ${error.response.data?.message || "Server error"}`,
              });
            } else if (error.request) {
              set({
                farmerDataError:
                  "No response from server. Please check your connection.",
              });
            } else {
              set({
                farmerDataError:
                  "Failed to fetch travel session data. Please try again.",
              });
            }
            set({ showFarmerDataModal: true });
          } finally {
            set({ isLoadingFarmerData: false });
          }
        },

        clearDateFilter: () => {
          set({ startDate: "", endDate: "" });
        },

        handleSearchSubmit: () => {
          const state = get();
          set({ appliedSearch: state.searchQuery });
          if (!state.searchQuery.trim()) {
            get().fetchTravelSessions(1, false);
            return;
          }
          get().searchAllSessions(state.searchQuery);
        },

        handleClearSearch: () => {
          set({
            searchQuery: "",
            isSearching: false,
            currentPage: 1,
            hasMore: true,
          });
          get().fetchTravelSessions(1, false);
        },

        manualRefresh: () => {
          get().fetchTravelSessions(1, false);
          get().loadAllSessionsForExport();
        },

        openMap: async (session: TravelSession) => {
          set({ mapView: session, lastUpdateTime: new Date() });
          const state = get();
          if (!state.sessionLogs[session.sessionId]) {
            await get().fetchSessionLogs(session.sessionId, 1);
          }
        },

        closeMap: () => {
          set({ mapView: null });
        },

        openMultiSessionMap: async (group: GroupedSession) => {
          set({
            multiSessionMapView: {
              userId: group.userId,
              fullName: group.fullName || "",
              employeeCode: group.employeeCode,
              date: group.date,
              sessions: group.sessions.sort(
                (a, b) =>
                  new Date(a.startTime).getTime() -
                  new Date(b.startTime).getTime(),
              ),
              center: [21.1702, 72.8311],
              zoom: 13,
            },
          });

          const logPromises = group.sessions.map((session) => {
            const state = get();
            if (!state.sessionLogs[session.sessionId]) {
              return get().fetchSessionLogs(session.sessionId, 1);
            }
            return Promise.resolve();
          });

          await Promise.all(logPromises);

          const allPoints: [number, number][] = [];
          const state = get();

          group.sessions.forEach((session) => {
            const logs = state.sessionLogs[session.sessionId] || [];

            const parseCoord = (coord: string | number): number => {
              if (!coord) return 0;
              if (typeof coord === "number")
                return Math.abs(coord) > 180 ? 0 : coord;
              const parsed = parseFloat(String(coord).replace(/[^\d.-]/g, ""));
              return Math.abs(parsed) > 90 ? 0 : isNaN(parsed) ? 0 : parsed;
            };

            const isValidCoord = (
              lat: string | number,
              lng: string | number,
            ): boolean => {
              const latNum = parseCoord(lat);
              const lngNum = parseCoord(lng);
              return (
                latNum !== 0 &&
                lngNum !== 0 &&
                Math.abs(latNum) <= 90 &&
                Math.abs(lngNum) <= 180
              );
            };

            if (isValidCoord(session.startLatitude, session.startLongitude)) {
              allPoints.push([
                parseCoord(session.startLatitude),
                parseCoord(session.startLongitude),
              ]);
            }
            if (isValidCoord(session.endLatitude, session.endLongitude)) {
              allPoints.push([
                parseCoord(session.endLatitude),
                parseCoord(session.endLongitude),
              ]);
            }

            const filteredLogs = filterAndMapLogsToSession(logs, session);
            filteredLogs.forEach((log) => {
              if (isValidCoord(log.latitude, log.longitude)) {
                allPoints.push([
                  parseCoord(log.latitude),
                  parseCoord(log.longitude),
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

          set((prev) => ({
            multiSessionMapView: prev.multiSessionMapView
              ? {
                  ...prev.multiSessionMapView,
                  center,
                  zoom,
                }
              : null,
            lastUpdateTime: new Date(),
          }));
        },

        closeMultiSessionMap: () => {
          set({ multiSessionMapView: null });
        },

        closeFarmerDataModal: () => {
          set({
            showFarmerDataModal: false,
            farmerTravelData: [],
            farmerDataError: null,
          });
        },

        exportToCSV: async () => {
          set({ isExporting: true });

          try {
            const state = get();
            let sessionsToExport = [...state.allSessions];

            if (state.currentUserInfo?.userRole) {
              sessionsToExport = filterSessionsByRole(
                sessionsToExport,
                state.currentUserInfo,
              );
            }

            if (state.startDate || state.endDate) {
              sessionsToExport = sessionsToExport.filter((session) => {
                try {
                  const sessionDate = formatDateOnly(session.startTime);
                  if (state.startDate && !state.endDate)
                    return sessionDate >= state.startDate;
                  if (!state.startDate && state.endDate)
                    return sessionDate <= state.endDate;
                  if (state.startDate && state.endDate) {
                    return (
                      sessionDate >= state.startDate &&
                      sessionDate <= state.endDate
                    );
                  }
                  return true;
                } catch (error) {
                  return false;
                }
              });
            }

            if (state.selectedUser) {
              sessionsToExport = sessionsToExport.filter(
                (session) => session.userId.toString() === state.selectedUser,
              );
            }

            if (state.searchQuery) {
              const query = state.searchQuery.toLowerCase();
              sessionsToExport = sessionsToExport.filter(
                (session) =>
                  session.fullName.toLowerCase().includes(query) ||
                  session.employeeCode.toLowerCase().includes(query),
              );
            }

            if (sessionsToExport.length === 0) {
              alert("No travel sessions found with the current filters.");
              set({ isExporting: false });
              return;
            }

            const groupedData =
              get().groupSessionsByUserAndDate(sessionsToExport);

            if (groupedData.length === 0) {
              alert("No grouped sessions found after processing.");
              set({ isExporting: false });
              return;
            }

            // Build grouped data with farmer info
            const groupedDataWithFarmerInfo = await Promise.all(
              groupedData.map(async (group) => {
                const userDateKey = `${group.userId}-${group.date}`;
                let sessionFarmerData = state.allFarmerData[userDateKey] || [];

                if (sessionFarmerData.length === 0) {
                  try {
                    const response = await API.get(
                      `/tracking/locationlog/get_travel_sessions`,
                      {
                        params: {
                          userId: group.userId,
                          startDate: group.date,
                          endDate: group.date,
                        },
                        timeout: 10000,
                      },
                    );

                    if (response.data.success && response.data.sessions?.data) {
                      sessionFarmerData = response.data.sessions.data;
                      set((prev) => ({
                        allFarmerData: {
                          ...prev.allFarmerData,
                          [userDateKey]: sessionFarmerData,
                        },
                      }));
                    }
                  } catch (error) {
                    console.error(
                      `Error fetching farmer data for user ${group.userId}:`,
                      error,
                    );
                  }
                }

                const firstSessionStart = new Date(group.startTime);
                const lastSessionEnd = new Date(group.endTime);
                const totalDuration = Math.round(
                  (lastSessionEnd.getTime() - firstSessionStart.getTime()) /
                    60000,
                );
                const totalDistanceExcludingFirst = group.totalDistance;
                const reimbursementAmount = (
                  (totalDistanceExcludingFirst / 1000) *
                  3.5
                ).toFixed(2);

                const totalPauses = group.sessions.reduce((sum, session) => {
                  const logs = state.sessionLogs[session.sessionId] || [];
                  const filteredLogs = filterAndMapLogsToSession(logs, session);
                  let pauses = 0;
                  for (let i = 0; i < filteredLogs.length; i++) {
                    if (filteredLogs[i].pause === true) pauses++;
                  }
                  return sum + pauses;
                }, 0);

                let totalFarmersMet = 0;
                const sessionDetails = group.sessions.map(
                  (session, sessionIndex) => {
                    const matchingFarmerData = sessionFarmerData.find(
                      (f: any) => f.sessionId === session.sessionId,
                    );

                    const farmerCount =
                      matchingFarmerData?.farmerData?.count || 0;
                    totalFarmersMet += farmerCount;
                    const farmers = matchingFarmerData?.farmerData?.data || [];

                    const farmerDescriptions = farmers
                      .map(
                        (farmer: any, farmerIndex: number) =>
                          `Farmer ${farmerIndex + 1}: ${farmer.farmerName || "Unknown"} - ${farmer.farmerDescription || "No description"}`,
                      )
                      .join("; ");

                    return {
                      sessionNumber: sessionIndex + 1,
                      sessionId: session.sessionId,
                      sessionStartTime: formatDateOnly(session.startTime),
                      sessionEndTime: session.endTime
                        ? formatDateOnly(session.endTime)
                        : "Active",
                      sessionDistance: (session.totalDistance / 1000).toFixed(
                        2,
                      ),
                      sessionStatus: session.endTime ? "Completed" : "Active",
                      farmersCount: farmerCount,
                      farmerDescriptions: farmerDescriptions || "None",
                    };
                  },
                );

                return {
                  fullName: group.fullName,
                  "Employee Code": group.employeeCode,
                  Department: group.sessions[0]?.department || "N/A",
                  Role: group.sessions[0]?.role || "N/A",
                  "Allocated Area": group.sessions[0]?.allocatedArea || "N/A",
                  Date: group.date,
                  "Formatted Date": new Date(group.date).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    },
                  ),
                  "Start Time": new Date(group.startTime).toLocaleString(),
                  "End Time": new Date(group.endTime).toLocaleString(),
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
                    group.activeSessions > 0
                      ? "Has Active Sessions"
                      : "All Completed",
                  Notes: "All sessions included for all roles",
                  sessionDetails,
                };
              }),
            );

            const sortedData = groupedDataWithFarmerInfo.sort((a, b) => {
              return new Date(b.Date).getTime() - new Date(a.Date).getTime();
            });

            const maxSessions = Math.max(
              ...groupedData.map((g) => g.sessions.length),
              1,
            );

            // Build Excel workbook
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Travel Sessions");

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

            const sessionHeaders: string[] = [];
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

            sheet.columns = allHeaders.map((header) => ({
              header,
              key: header,
              width: header.toLowerCase().includes("description") ? 30 : 18,
            }));

            const headerRow = sheet.getRow(1);
            headerRow.eachCell((cell) => {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF1F4E78" },
              };
              cell.font = {
                color: { argb: "FFFFFFFF" },
                bold: true,
              };
              cell.alignment = { vertical: "middle", horizontal: "center" };
            });

            sortedData.forEach((row) => {
              const rowData: Record<string, any> = {};
              baseHeaders.forEach((h) => {
                rowData[h] = (row as any)[h] ?? "";
              });

              row.sessionDetails.forEach((session: any) => {
                const prefix = `Session ${session.sessionNumber}`;
                rowData[`${prefix} ID`] = session.sessionId;
                rowData[`${prefix} Start Time`] = session.sessionStartTime;
                rowData[`${prefix} End Time`] = session.sessionEndTime;
                rowData[`${prefix} Distance (km)`] = session.sessionDistance;
                rowData[`${prefix} Status`] = session.sessionStatus;
                rowData[`${prefix} Farmers Count`] = session.farmersCount;
                rowData[`${prefix} Farmer Descriptions`] =
                  session.farmerDescriptions;
              });

              sheet.addRow(rowData);
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const dateStr = new Date().toISOString().slice(0, 10);
            const filterInfo: string[] = [];
            if (state.startDate) filterInfo.push(`from-${state.startDate}`);
            if (state.endDate) filterInfo.push(`to-${state.endDate}`);
            if (state.selectedUser)
              filterInfo.push(`user-${state.selectedUser}`);
            if (state.searchQuery)
              filterInfo.push(`search-${state.searchQuery}`);
            const filename = `travel_sessions_${filterInfo.length ? filterInfo.join("_") : "all"}_${dateStr}.xlsx`;

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
            set({ isExporting: false });
          }
        },

        resetState: () => {
          set({
            travelSessions: [],
            sessionsMap: {},
            selectedUser: "",
            startDate: "",
            endDate: "",
            users: [],
            isLoading: false,
            isLoadingMore: false,
            lastUpdateTime: null,
            autoRefresh: false,
            searchQuery: "",
            appliedSearch: "",
            currentPage: 1,
            totalPages: 1,
            hasMore: true,
            groupedView: [],
            viewMode: "grouped",
            allSessions: [],
            allFarmerData: {},
            totalSessionsCount: 0,
            sessionLogs: {},
            loadingLogs: {},
            logsPagination: {},
            isSearching: false,
            showStats: true,
            isLoadingFarmerDataForExport: false,
            selectedUserForFarmerData: "",
            showFarmerDataModal: false,
            isLoadingFarmerData: false,
            farmerDataError: null,
            farmerTravelData: [],
            mapView: null,
            multiSessionMapView: null,
            showLogMarkers: true,
            showLogMarkersMulti: true,
            showPauseMarkers: true,
            isExporting: false,
            selectedSessionDate: "",
          });
        },
      }),
      {
        name: "travel-sessions-storage",
        partialize: (state) => ({
          selectedUser: state.selectedUser,
          startDate: state.startDate,
          endDate: state.endDate,
          viewMode: state.viewMode,
          autoRefresh: state.autoRefresh,
          showStats: state.showStats,
          showLogMarkers: state.showLogMarkers,
          showLogMarkersMulti: state.showLogMarkersMulti,
          showPauseMarkers: state.showPauseMarkers,
        }),
      },
    ),
    { name: "TravelSessionsStore" },
  ),
);

// Custom hook for component-specific selectors
export const useTravelSessions = () => {
  const store = useTravelSessionsStore();
  return {
    // State
    travelSessions: store.travelSessions,
    groupedView: store.groupedView,
    users: store.users,
    isLoading: store.isLoading,
    isLoadingMore: store.isLoadingMore,
    hasMore: store.hasMore,
    lastUpdateTime: store.lastUpdateTime,
    autoRefresh: store.autoRefresh,
    searchQuery: store.searchQuery,
    selectedUser: store.selectedUser,
    startDate: store.startDate,
    endDate: store.endDate,
    viewMode: store.viewMode,
    showStats: store.showStats,
    totalSessionsCount: store.totalSessionsCount,
    currentUserInfo: store.currentUserInfo,
    mapView: store.mapView,
    multiSessionMapView: store.multiSessionMapView,
    showLogMarkers: store.showLogMarkers,
    showLogMarkersMulti: store.showLogMarkersMulti,
    showPauseMarkers: store.showPauseMarkers,
    isExporting: store.isExporting,
    isLoadingFarmerDataForExport: store.isLoadingFarmerDataForExport,
    selectedUserForFarmerData: store.selectedUserForFarmerData,
    showFarmerDataModal: store.showFarmerDataModal,
    isLoadingFarmerData: store.isLoadingFarmerData,
    farmerDataError: store.farmerDataError,
    farmerTravelData: store.farmerTravelData,
    selectedSessionDate: store.selectedSessionDate,
    isSearching: store.isSearching,

    // Computed
    get filteredSessions() {
      return store.filteredSessions;
    },
    get activeSessionsCount() {
      return store.activeSessionsCount;
    },
    get totalDistance() {
      return store.totalDistance;
    },

    // Actions
    setSelectedUser: store.setSelectedUser,
    setStartDate: store.setStartDate,
    setEndDate: store.setEndDate,
    setSearchQuery: store.setSearchQuery,
    setAppliedSearch: store.setAppliedSearch,
    setViewMode: store.setViewMode,
    setAutoRefresh: store.setAutoRefresh,
    setShowStats: store.setShowStats,
    setShowLogMarkers: store.setShowLogMarkers,
    setShowLogMarkersMulti: store.setShowLogMarkersMulti,
    setShowPauseMarkers: store.setShowPauseMarkers,
    setMapView: store.setMapView,
    setMultiSessionMapView: store.setMultiSessionMapView,
    setSelectedSessionDate: store.setSelectedSessionDate,
    setSelectedUserForFarmerData: store.setSelectedUserForFarmerData,
    setShowFarmerDataModal: store.setShowFarmerDataModal,
    setFarmerDataError: store.setFarmerDataError,
    setFarmerTravelData: store.setFarmerTravelData,
    setIsLoadingFarmerData: store.setIsLoadingFarmerData,
    setIsExporting: store.setIsExporting,

    // API Actions
    fetchTravelSessions: store.fetchTravelSessions,
    loadMoreSessions: store.loadMoreSessions,
    loadMoreSessionsForUser: store.loadMoreSessionsForUser,
    fetchActiveSessionsOnly: store.fetchActiveSessionsOnly,
    fetchSessionLogs: store.fetchSessionLogs,
    searchAllSessions: store.searchAllSessions,
    loadAllSessionsForExport: store.loadAllSessionsForExport,
    loadAllFarmerData: store.loadAllFarmerData,
    exportToCSV: store.exportToCSV,
    handleFetchTravelData: store.handleFetchTravelData,
    clearDateFilter: store.clearDateFilter,
    handleSearchSubmit: store.handleSearchSubmit,
    handleClearSearch: store.handleClearSearch,
    manualRefresh: store.manualRefresh,
    getUserInfo: store.getUserInfo,
    openMap: store.openMap,
    closeMap: store.closeMap,
    openMultiSessionMap: store.openMultiSessionMap,
    closeMultiSessionMap: store.closeMultiSessionMap,
    closeFarmerDataModal: store.closeFarmerDataModal,
    resetState: store.resetState,
  };
};
