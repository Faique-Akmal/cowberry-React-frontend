// // src/store/travelSessionStore.ts
// import { create } from "zustand";
// import { devtools } from "zustand/middleware";
// import API from "../api/axios";

// // Types
// export interface TravelSession {
//   sessionId: number;
//   fullName: string;
//   userId: number;
//   username: string;
//   employeeCode: string;
//   startTime: string;
//   startLatitude: string;
//   startLongitude: string;
//   role?: string;
//   endTime: string;
//   endLatitude: string;
//   endLongitude: string;
//   startOdometer: string;
//   endOdometer: string;
//   totalDistance: number;
//   department?: string;
//   allocatedArea?: string;
//   totalSessions?: number;
// }

// export interface LocationLog {
//   id: number;
//   timestamp: string;
//   latitude: string;
//   longitude: string;
//   battery: number;
//   speed: number;
//   pause: boolean;
// }

// export interface FarmerTravelData {
//   sessionId: number;
//   userId: number;
//   startTime: string;
//   endTime: string;
//   startLatitude: number;
//   startLongitude: number;
//   endLatitude: number;
//   endLongitude: number;
//   startDescription: string;
//   endDescription: string;
//   status: string;
//   isActive: boolean;
//   totalDistance: number;
//   date: string;
//   durationMinutes: number;
//   startOdometerImage: string;
//   endOdometerImage: string;
//   locationLogs?: {
//     count: number;
//     data: LocationLog[];
//   };
//   farmerData?: {
//     count: number;
//     data: FarmerData[];
//   };
// }

// export interface FarmerData {
//   id: number;
//   farmerName: string;
//   farmerDescription: string;
//   farmerImage?: string;
//   createdAt: string;
// }

// interface ApiPaginationResponse {
//   success: boolean;
//   data: TravelSession[];
//   currentPage: number;
//   totalPages: number;
//   limit: number;
//   hasNextPage: boolean;
//   totalSessions: number;
// }

// interface SessionLogsResponse {
//   success: boolean;
//   sessionInfo: {
//     sessionId: number;
//     userId: number;
//     username: string;
//     employeeCode: string;
//     startTime: string;
//     endTime: string;
//     totalLogs: number;
//   };
//   pagination: {
//     currentPage: number;
//     totalPages: number;
//     limit: number;
//     hasNextPage: boolean;
//     hasPrevPage: boolean;
//     totalLogs: number;
//     logsInPage: number;
//   };
//   data: LocationLog[];
// }

// interface UserInfo {
//   userRole?: string;
//   department?: string;
//   allocatedArea?: string;
// }

// interface TravelSessionState {
//   // State
//   travelSessions: TravelSession[];
//   allTravelSessions: TravelSession[]; // For export and total calculations
//   sessionsMap: Record<string, TravelSession>;
//   sessionLogs: Record<number, LocationLog[]>;
//   loadingLogs: Record<number, boolean>;
//   logsPagination: Record<number, any>;
//   farmerTravelData: FarmerTravelData[];
//   allFarmerData: Record<string, any>;
//   selectedUser: string;
//   startDate: string;
//   endDate: string;
//   searchQuery: string;
//   currentPage: number;
//   totalPages: number;
//   hasMore: boolean;
//   totalSessionsCount: number;
//   totalDistanceAll: number; // Total distance across all pages
//   isLoading: boolean;
//   isLoadingMore: boolean;
//   isLoadingFarmerData: boolean;
//   farmerDataError: string | null;
//   selectedUserForFarmerData: string;
//   selectedSessionDate: string;
//   showFarmerDataModal: boolean;
//   isSearching: boolean;
//   currentUserInfo: UserInfo | null;
//   searchResults: TravelSession[]; // Store search results separately

//   // Actions
//   setSearchQuery: (query: string) => void;
//   setSelectedUser: (userId: string) => void;
//   setStartDate: (date: string) => void;
//   setEndDate: (date: string) => void;
//   setCurrentUserInfo: (userInfo: UserInfo | null) => void;
//   fetchTravelSessions: (
//     page?: number,
//     append?: boolean,
//     filters?: any,
//   ) => Promise<void>;
//   fetchAllSessionsForExport: () => Promise<TravelSession[]>;
//   fetchSessionLogs: (
//     sessionId: number,
//     page?: number,
//   ) => Promise<LocationLog[]>;
//   fetchFarmerTravelData: (
//     userId: string,
//     sessionDate?: string,
//   ) => Promise<void>;
//   searchSessions: (searchTerm: string) => Promise<void>;
//   clearSearch: () => void;
//   resetFilters: () => void;
//   closeFarmerDataModal: () => void;
//   clearDateFilter: () => void;
//   loadMoreSessions: () => Promise<void>;
//   clearAllData: () => void;
// }

// // Helper functions for role-based filtering
// const normalizeRole = (role: string): string => {
//   if (!role) return "";
//   return role.toLowerCase().trim();
// };

// const isAdminOrHR = (role: string): boolean => {
//   const normalized = normalizeRole(role);
//   return (
//     normalized === "admin" ||
//     normalized === "superadmin" ||
//     normalized === "hr" ||
//     normalized === "hr_manager" ||
//     normalized.includes("admin") ||
//     normalized.includes("hr")
//   );
// };

// const isManager = (role: string): boolean => {
//   const normalized = normalizeRole(role);
//   return normalized === "manager" || normalized.includes("manager");
// };

// const isZonalManager = (role: string): boolean => {
//   const normalized = normalizeRole(role);
//   return (
//     normalized === "zonalmanager" ||
//     normalized === "zonal_manager" ||
//     normalized === "zonal manager" ||
//     normalized.includes("zonal")
//   );
// };

// const isHOD = (role: string): boolean => {
//   const normalized = normalizeRole(role);
//   return (
//     normalized === "headofdepartment" ||
//     normalized === "head_of_department" ||
//     normalized.includes("headofdepartment")
//   );
// };

// export const useTravelSessionStore = create<TravelSessionState>()(
//   devtools(
//     (set, get) => ({
//       // Initial state
//       travelSessions: [],
//       allTravelSessions: [],
//       sessionsMap: {},
//       sessionLogs: {},
//       loadingLogs: {},
//       logsPagination: {},
//       farmerTravelData: [],
//       allFarmerData: {},
//       selectedUser: "",
//       startDate: "",
//       endDate: "",
//       searchQuery: "",
//       currentPage: 1,
//       totalPages: 1,
//       hasMore: true,
//       totalSessionsCount: 0,
//       totalDistanceAll: 0,
//       isLoading: false,
//       isLoadingMore: false,
//       isLoadingFarmerData: false,
//       farmerDataError: null,
//       selectedUserForFarmerData: "",
//       selectedSessionDate: "",
//       showFarmerDataModal: false,
//       isSearching: false,
//       currentUserInfo: null,
//       searchResults: [],

//       // Actions
//       setSearchQuery: (query: string) => set({ searchQuery: query }),

//       setSelectedUser: (userId: string) => set({ selectedUser: userId }),

//       setStartDate: (date: string) => set({ startDate: date }),

//       setEndDate: (date: string) => set({ endDate: date }),

//       setCurrentUserInfo: (userInfo: UserInfo | null) =>
//         set({ currentUserInfo: userInfo }),

//       resetFilters: () =>
//         set({
//           selectedUser: "",
//           startDate: "",
//           endDate: "",
//           searchQuery: "",
//           currentPage: 1,
//           hasMore: true,
//           isSearching: false,
//           searchResults: [],
//         }),

//       clearDateFilter: () => set({ startDate: "", endDate: "" }),

//       closeFarmerDataModal: () =>
//         set({
//           showFarmerDataModal: false,
//           farmerTravelData: [],
//           farmerDataError: null,
//         }),

//       clearSearch: () => {
//         set({
//           searchQuery: "",
//           isSearching: false,
//           searchResults: [],
//         });
//         get().fetchTravelSessions(1, false);
//       },

//       clearAllData: () =>
//         set({
//           travelSessions: [],
//           allTravelSessions: [],
//           sessionsMap: {},
//           totalDistanceAll: 0,
//           totalSessionsCount: 0,
//         }),

//       // Fetch all sessions for export
//       fetchAllSessionsForExport: async () => {
//         const { startDate, endDate, selectedUser, currentUserInfo } = get();

//         try {
//           let allSessions: TravelSession[] = [];
//           let page = 1;
//           let hasMore = true;
//           const limit = 100;

//           while (hasMore) {
//             const params: any = { page, limit };

//             if (startDate) params.startDate = startDate;
//             if (endDate) params.endDate = endDate;
//             if (selectedUser) params.userId = selectedUser;

//             // Apply role-based filtering
//             if (currentUserInfo?.userRole) {
//               const userRole = currentUserInfo.userRole.toLowerCase().trim();

//               if (isManager(userRole) || isHOD(userRole)) {
//                 if (currentUserInfo.department) {
//                   params.department = currentUserInfo.department;
//                 }
//               }

//               if (isZonalManager(userRole)) {
//                 if (currentUserInfo.allocatedArea) {
//                   params.allocatedArea = currentUserInfo.allocatedArea;
//                 }
//               }
//             }

//             const res = await API.get<ApiPaginationResponse>(
//               "/admin/travel-sessions",
//               { params },
//             );

//             if (res.data.success) {
//               const sessions = res.data.data || [];
//               allSessions = [...allSessions, ...sessions];
//               hasMore = res.data.hasNextPage || false;
//               page++;
//             } else {
//               hasMore = false;
//             }
//           }

//           set({ allTravelSessions: allSessions });
//           return allSessions;
//         } catch (err) {
//           console.error("Failed to fetch all sessions for export", err);
//           return [];
//         }
//       },

//       // Fetch travel sessions with pagination
//       fetchTravelSessions: async (
//         page: number = 1,
//         append: boolean = false,
//         customFilters?: any,
//       ) => {
//         const {
//           selectedUser,
//           startDate,
//           endDate,
//           searchQuery,
//           currentUserInfo,
//         } = get();

//         if (page === 1) {
//           set({ isLoading: true });
//         } else {
//           set({ isLoadingMore: true });
//         }

//         try {
//           const params: any = { page, limit: 20 };

//           // Only apply filters if not searching
//           if (!searchQuery) {
//             if (startDate) params.startDate = startDate;
//             if (endDate) params.endDate = endDate;
//             if (selectedUser) params.userId = selectedUser;
//           }

//           // Apply custom filters if provided
//           if (customFilters) {
//             Object.assign(params, customFilters);
//           }

//           // Apply role-based filtering at API level
//           if (currentUserInfo?.userRole) {
//             const userRole = currentUserInfo.userRole.toLowerCase().trim();

//             if (isManager(userRole) || isHOD(userRole)) {
//               if (currentUserInfo.department) {
//                 params.department = currentUserInfo.department;
//               }
//             }

//             if (isZonalManager(userRole)) {
//               if (currentUserInfo.allocatedArea) {
//                 params.allocatedArea = currentUserInfo.allocatedArea;
//               }
//             }
//           }

//           const res = await API.get<ApiPaginationResponse>(
//             "/admin/travel-sessions",
//             { params },
//           );

//           if (res.data.success) {
//             const sessions = res.data.data || [];

//             // Apply role-based filtering on response
//             let filteredSessions = sessions;
//             if (currentUserInfo?.userRole) {
//               const userRole = currentUserInfo.userRole.toLowerCase().trim();
//               // Apply filtering logic here
//               filteredSessions = sessions;
//             }

//             // Calculate total distance for all sessions
//             const totalDist = filteredSessions.reduce(
//               (sum, s) => sum + (s.totalDistance || 0),
//               0,
//             );

//             set((state) => {
//               const existingIds = new Set(
//                 state.travelSessions.map((s) => s.sessionId),
//               );
//               const newSessions = filteredSessions.filter(
//                 (s) => !existingIds.has(s.sessionId),
//               );

//               // Update total distance
//               let newTotalDistance = state.totalDistanceAll;
//               if (append) {
//                 newTotalDistance += totalDist;
//               } else {
//                 newTotalDistance = totalDist;
//               }

//               return {
//                 travelSessions: append
//                   ? [...state.travelSessions, ...newSessions]
//                   : filteredSessions,
//                 totalSessionsCount:
//                   res.data.totalSessions || filteredSessions.length,
//                 currentPage: res.data.currentPage || page,
//                 totalPages: res.data.totalPages || 1,
//                 hasMore: res.data.hasNextPage || false,
//                 isLoading: false,
//                 isLoadingMore: false,
//                 isSearching: false,
//                 totalDistanceAll: newTotalDistance,
//               };
//             });

//             // Update sessions map
//             const newCache: Record<string, TravelSession> = {};
//             filteredSessions.forEach((session) => {
//               const key = `${session.userId}-${session.sessionId}`;
//               newCache[key] = session;
//             });
//             set((state) => ({
//               sessionsMap: { ...state.sessionsMap, ...newCache },
//             }));
//           }
//         } catch (err) {
//           console.error("Failed to fetch travel sessions", err);
//           set({ isLoading: false, isLoadingMore: false, isSearching: false });
//         }
//       },

//       // Fetch session logs
//       fetchSessionLogs: async (sessionId: number, page: number = 1) => {
//         set((state) => ({
//           loadingLogs: { ...state.loadingLogs, [sessionId]: true },
//         }));

//         try {
//           const response = await API.get<SessionLogsResponse>(
//             `/admin/travel-sessions/${sessionId}/logs`,
//             { params: { page, limit: 100 } },
//           );

//           if (response.data.success) {
//             const logs = response.data.data;

//             set((state) => ({
//               sessionLogs: {
//                 ...state.sessionLogs,
//                 [sessionId]:
//                   page === 1
//                     ? logs
//                     : [...(state.sessionLogs[sessionId] || []), ...logs],
//               },
//               logsPagination: {
//                 ...state.logsPagination,
//                 [sessionId]: response.data.pagination,
//               },
//               loadingLogs: { ...state.loadingLogs, [sessionId]: false },
//             }));

//             return logs;
//           }
//         } catch (error) {
//           console.error(
//             `Failed to fetch logs for session ${sessionId}:`,
//             error,
//           );
//           set((state) => ({
//             loadingLogs: { ...state.loadingLogs, [sessionId]: false },
//           }));
//         }

//         return [];
//       },

//       // Fetch farmer travel data
//       fetchFarmerTravelData: async (userId: string, sessionDate?: string) => {
//         const { startDate, endDate } = get();

//         set({
//           isLoadingFarmerData: true,
//           farmerDataError: null,
//           selectedUserForFarmerData: userId,
//           showFarmerDataModal: true,
//         });

//         if (sessionDate) {
//           set({ selectedSessionDate: sessionDate });
//         }

//         try {
//           const params: any = { userId };

//           if (sessionDate) {
//             params.startDate = sessionDate;
//             params.endDate = sessionDate;
//           } else {
//             if (startDate) params.startDate = startDate;
//             if (endDate) params.endDate = endDate;
//           }

//           const response = await API.get(
//             `/tracking/locationlog/get_travel_sessions`,
//             { params },
//           );
//           const data = response.data;

//           if (data.success && data.sessions && data.sessions.data) {
//             const sessions: FarmerTravelData[] = data.sessions.data.map(
//               (session: any) => ({
//                 sessionId: session.sessionId,
//                 userId: session.userId || data.user?.id,
//                 startTime: session.startTime,
//                 endTime: session.endTime,
//                 startLatitude: session.startLatitude,
//                 startLongitude: session.startLongitude,
//                 endLatitude: session.endLatitude,
//                 endLongitude: session.endLongitude,
//                 startDescription: session.startDescription || "",
//                 endDescription: session.endDescription || "",
//                 status: session.status,
//                 isActive: session.isActive,
//                 totalDistance: session.totalDistance,
//                 date: session.date,
//                 durationMinutes: session.durationMinutes,
//                 startOdometerImage: session.startOdometerImage || "",
//                 endOdometerImage: session.endOdometerImage || "",
//                 locationLogs: session.locationLogs,
//                 farmerData: session.farmerData,
//               }),
//             );

//             set({
//               farmerTravelData: sessions,
//               isLoadingFarmerData: false,
//               farmerDataError: null,
//             });
//           } else {
//             set({
//               farmerTravelData: [],
//               isLoadingFarmerData: false,
//               farmerDataError: data.message || "No travel data found",
//             });
//           }
//         } catch (error: any) {
//           console.error("Error fetching travel data:", error);

//           let errorMessage =
//             "Failed to fetch travel session data. Please try again.";
//           if (error.response) {
//             errorMessage = `Error ${error.response.status}: ${error.response.data?.message || "Server error"}`;
//           } else if (error.request) {
//             errorMessage =
//               "No response from server. Please check your connection.";
//           }

//           set({
//             isLoadingFarmerData: false,
//             farmerDataError: errorMessage,
//             farmerTravelData: [],
//           });
//         }
//       },

//       // Search sessions - FIXED
//       searchSessions: async (searchTerm: string) => {
//         if (!searchTerm.trim()) {
//           get().fetchTravelSessions(1, false);
//           set({ isSearching: false, searchResults: [] });
//           return;
//         }

//         set({ isSearching: true, isLoading: true });

//         try {
//           const params: any = {
//             search: searchTerm.trim(),
//             limit: 1000, // Get all results at once for search
//           };

//           const { startDate, endDate, selectedUser, currentUserInfo } = get();

//           if (startDate) params.startDate = startDate;
//           if (endDate) params.endDate = endDate;
//           if (selectedUser) params.userId = selectedUser;

//           // Apply role-based filtering
//           if (currentUserInfo?.userRole) {
//             const userRole = currentUserInfo.userRole.toLowerCase().trim();

//             if (isManager(userRole) || isHOD(userRole)) {
//               if (currentUserInfo.department) {
//                 params.department = currentUserInfo.department;
//               }
//             }

//             if (isZonalManager(userRole)) {
//               if (currentUserInfo.allocatedArea) {
//                 params.allocatedArea = currentUserInfo.allocatedArea;
//               }
//             }
//           }

//           const res = await API.get<ApiPaginationResponse>(
//             "/admin/travel-sessions",
//             { params },
//           );

//           if (res.data.success) {
//             const sessions = res.data.data || [];

//             // Calculate total distance for search results
//             const totalDist = sessions.reduce(
//               (sum, s) => sum + (s.totalDistance || 0),
//               0,
//             );

//             set({
//               travelSessions: sessions,
//               searchResults: sessions,
//               totalSessionsCount: sessions.length,
//               totalDistanceAll: totalDist,
//               currentPage: 1,
//               totalPages: 1,
//               hasMore: false,
//               isLoading: false,
//               isSearching: false,
//             });

//             // Update sessions map
//             const newCache: Record<string, TravelSession> = {};
//             sessions.forEach((session) => {
//               const key = `${session.userId}-${session.sessionId}`;
//               newCache[key] = session;
//             });
//             set((state) => ({
//               sessionsMap: { ...state.sessionsMap, ...newCache },
//             }));
//           } else {
//             set({
//               travelSessions: [],
//               searchResults: [],
//               totalSessionsCount: 0,
//               totalDistanceAll: 0,
//               isLoading: false,
//               isSearching: false,
//             });
//           }
//         } catch (err) {
//           console.error("Failed to search sessions", err);
//           set({
//             isLoading: false,
//             isSearching: false,
//             travelSessions: [],
//             searchResults: [],
//             totalSessionsCount: 0,
//             totalDistanceAll: 0,
//           });
//         }
//       },

//       loadMoreSessions: async () => {
//         const { hasMore, isLoading, isLoadingMore, currentPage, searchQuery } =
//           get();
//         if (!hasMore || isLoading || isLoadingMore) return;

//         // Don't load more if searching
//         if (searchQuery) return;

//         const nextPage = currentPage + 1;
//         await get().fetchTravelSessions(nextPage, true);
//       },
//     }),
//     { name: "TravelSessionStore" },
//   ),
// );
