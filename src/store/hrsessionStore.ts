// store/hrsessionStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import API from "../api/axios";
import { toast } from "react-hot-toast";

// Types
interface ReporteeInfo {
  id: number;
  username: string;
  fullName: string;
  employeeCode: string;
}

interface HRManagerInfo {
  id: number;
  username: string;
  fullName: string;
  employeeCode: string;
}

interface TravelSession {
  sessionId: number;
  userId: number;
  username: string;
  employeeCode: string;
  fullName: string;
  department: string | null;
  startTime: string;
  startLatitude: string;
  startLongitude: string;
  startDescription: string;
  endTime: string;
  endLatitude: string;
  endLongitude: string;
  endDescription: string;
  totalDistance: number;
  isApprovedByReportee: boolean;
  isRejectedByReportee: boolean;
  isApprovedByHR: boolean;
  isRejectedByHR: boolean;
  isFinalApproved: boolean | null;
  finalStatus: string;
  reporteeComments: string | null;
  reporteeApprovedAt: string | null;
  hrComments: string | null;
  hrApprovedAt: string | null;
  reporteeInfo: ReporteeInfo;
  hrManagerInfo: HRManagerInfo;
}

interface FilterState {
  searchTerm: string;
  sessionId: string;
  dateFrom: string;
  dateTo: string;
  status: string;
}

interface TravelSessionStore {
  // State
  sessions: TravelSession[];
  filteredSessions: TravelSession[];
  loading: boolean;
  loadingMore: boolean;
  // Separate from `loading` on purpose: `loading` drives the big list
  // spinner and is also toggled by fetchPendingSessions. If fetchSessionById
  // shared that same flag, a single-session lookup running at the same time
  // as a list fetch (e.g. right after mount) could flip `loading` back to
  // false while the OTHER request is still in flight, which the auto-open
  // effect watches as a dependency - causing it to re-evaluate mid-fetch.
  sessionLoading: boolean;
  processing: number | null;
  currentPage: number;
  hasMore: boolean;
  totalCount: number;
  filters: FilterState;

  // Actions
  setSessions: (sessions: TravelSession[]) => void;
  setFilteredSessions: (sessions: TravelSession[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setSessionLoading: (loading: boolean) => void;
  setProcessing: (sessionId: number | null) => void;
  setCurrentPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setTotalCount: (count: number) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetStore: () => void;

  // Async actions
  fetchPendingSessions: (page?: number, append?: boolean) => Promise<void>;
  fetchSessionById: (sessionId: number) => Promise<TravelSession | null>;
  handleAction: (
    sessionId: number,
    action: "approve" | "reject",
    comments?: string,
  ) => Promise<boolean>;
  refreshSessions: () => Promise<void>;
  applyFilters: () => void;
  findSessionInCache: (sessionId: number) => TravelSession | null;
  canApproveByHR: (session: TravelSession) => boolean;
}

const PAGE_SIZE = 20;

export const useTravelSessionStore = create<TravelSessionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      filteredSessions: [],
      loading: false,
      loadingMore: false,
      sessionLoading: false,
      processing: null,
      currentPage: 1,
      hasMore: true,
      totalCount: 0,
      filters: {
        searchTerm: "",
        sessionId: "",
        dateFrom: "",
        dateTo: "",
        status: "ALL",
      },

      // Basic setters
      setSessions: (sessions) => set({ sessions }),
      setFilteredSessions: (filteredSessions) => set({ filteredSessions }),
      setLoading: (loading) => set({ loading }),
      setLoadingMore: (loadingMore) => set({ loadingMore }),
      setSessionLoading: (sessionLoading) => set({ sessionLoading }),
      setProcessing: (processing) => set({ processing }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      setHasMore: (hasMore) => set({ hasMore }),
      setTotalCount: (totalCount) => set({ totalCount }),

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
        get().applyFilters();
      },

      resetStore: () => {
        set({
          sessions: [],
          filteredSessions: [],
          loading: false,
          loadingMore: false,
          sessionLoading: false,
          processing: null,
          currentPage: 1,
          hasMore: true,
          totalCount: 0,
          filters: {
            searchTerm: "",
            sessionId: "",
            dateFrom: "",
            dateTo: "",
            status: "ALL",
          },
        });
      },

      // Helper function to find session in cache
      findSessionInCache: (sessionId: number) => {
        const { sessions } = get();
        return sessions.find((s) => s.sessionId === sessionId) || null;
      },

      // Helper function to check if HR can approve
      canApproveByHR: (session: TravelSession) => {
        return !session.isApprovedByHR && !session.isRejectedByHR;
      },

      // Apply filters
      applyFilters: () => {
        const { sessions, filters } = get();
        let result = [...sessions];

        if (filters.searchTerm.trim()) {
          const searchLower = filters.searchTerm.toLowerCase().trim();
          result = result.filter(
            (session) =>
              session.fullName.toLowerCase().includes(searchLower) ||
              session.username.toLowerCase().includes(searchLower) ||
              session.employeeCode.toLowerCase().includes(searchLower) ||
              session.userId.toString().includes(searchLower),
          );
        }

        if (filters.sessionId.trim()) {
          const sessionIdNum = parseInt(filters.sessionId.trim());
          if (!isNaN(sessionIdNum)) {
            result = result.filter(
              (session) => session.sessionId === sessionIdNum,
            );
          }
        }

        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          result = result.filter(
            (session) => new Date(session.startTime) >= fromDate,
          );
        }

        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          result = result.filter(
            (session) => new Date(session.startTime) <= toDate,
          );
        }

        if (filters.status !== "ALL") {
          const canApproveByHR = get().canApproveByHR;
          if (filters.status === "PENDING_REPORTEE") {
            result = result.filter(
              (session) =>
                !session.isApprovedByReportee && !session.isRejectedByReportee,
            );
          } else if (filters.status === "APPROVED_REPORTEE") {
            result = result.filter((session) => session.isApprovedByReportee);
          } else if (filters.status === "REJECTED_REPORTEE") {
            result = result.filter((session) => session.isRejectedByReportee);
          } else if (filters.status === "PENDING_HR") {
            result = result.filter((session) => canApproveByHR(session));
          } else if (filters.status === "APPROVED_HR") {
            result = result.filter((session) => session.isApprovedByHR);
          } else if (filters.status === "REJECTED_HR") {
            result = result.filter((session) => session.isRejectedByHR);
          } else {
            result = result.filter(
              (session) => session.finalStatus === filters.status,
            );
          }
        }

        set({ filteredSessions: result });
      },

      // Fetch pending sessions with pagination
      fetchPendingSessions: async (
        page: number = 1,
        append: boolean = false,
      ) => {
        try {
          if (page === 1) {
            set({ loading: true });
          } else {
            set({ loadingMore: true });
          }

          const response = await API.get(
            "/tracking/travel-sessions/pending/hr",
            {
              params: {
                page: page,
                limit: PAGE_SIZE,
              },
            },
          );

          if (response.data.success) {
            const data = response.data.data || [];
            const pagination = response.data.pagination;

            const total = pagination?.total ?? data.length;
            const hasNextPage = pagination?.hasNextPage ?? false;

            if (append) {
              set((state) => ({
                sessions: [...state.sessions, ...data],
                totalCount: total,
                hasMore: hasNextPage,
              }));
            } else {
              set({
                sessions: data,
                totalCount: total,
                hasMore: hasNextPage,
              });
            }

            // Apply filters after updating sessions
            get().applyFilters();

            if (data.length === 0 && page === 1) {
              toast.success("No pending sessions found");
            }
          } else {
            toast.error(response.data.error || "Failed to fetch sessions");
          }
        } catch (error) {
          toast.error("Error fetching sessions");
        } finally {
          set({ loading: false, loadingMore: false });
        }
      },

      // Fetch single session by ID. A session that comes back "not found"
      // here almost always means the reportee hasn't approved/rejected it
      // yet - it hasn't landed in HR's queue - rather than a real permission
      // or data problem, so we surface that specific reason to the caller
      // instead of a generic "not found" message.
      // In hrsessionStore.ts - update fetchSessionById:

      fetchSessionById: async (sessionId: number) => {
        try {
          set({ sessionLoading: true });

          // First, check if the session exists in the current sessions list
          const existingSession = get().sessions.find(
            (s) => s.sessionId === sessionId,
          );
          if (existingSession) {
            // Already in cache, return it
            set({ sessionLoading: false });
            return existingSession;
          }

          const response = await API.get(
            `/tracking/travel-session/${sessionId}`,
          );

          if (response.data.success) {
            const session = response.data.data;

            // Check if this session has been acted on by reportee
            // If not, it shouldn't be in HR's queue yet
            if (
              !session.isApprovedByReportee &&
              !session.isRejectedByReportee
            ) {
              toast.error("Not yet updated by reportee");
              set({ sessionLoading: false });
              return null;
            }

            // Add session to cache if not already there
            set((state) => {
              const exists = state.sessions.some(
                (s) => s.sessionId === session.sessionId,
              );
              if (!exists) {
                return {
                  sessions: [session, ...state.sessions],
                };
              }
              return {};
            });
            get().applyFilters();
            toast.success(`Loaded session #${sessionId} for review`);
            set({ sessionLoading: false });
            return session;
          } else {
            toast.error("Session not found or not yet updated by reportee");
            set({ sessionLoading: false });
            return null;
          }
        } catch (error: any) {
          console.error("Error fetching session:", error);
          // Check if it's a 404 or similar - session doesn't exist in HR's queue
          if (error?.response?.status === 404) {
            toast.error("Session not found or not yet updated by reportee");
          } else {
            toast.error("Failed to load session");
          }
          set({ sessionLoading: false });
          return null;
        }
      },

      // Handle approve/reject action
      handleAction: async (
        sessionId: number,
        action: "approve" | "reject",
        comments?: string,
      ) => {
        try {
          set({ processing: sessionId });

          const response = await API.post(
            `/tracking/travel-session/${sessionId}/hr-approve`,
            {
              action: action,
              comments: comments?.trim() || `${action} by HR`,
            },
          );

          if (response.data.success) {
            toast.success(`Session ${action}ed successfully`);

            // Reset and reload from page 1
            set({
              currentPage: 1,
              hasMore: true,
            });

            await get().refreshSessions();
            return true;
          } else {
            toast.error(`Failed to ${action} session`);
            return false;
          }
        } catch (error) {
          toast.error(`Error ${action}ing session`);
          return false;
        } finally {
          set({ processing: null });
        }
      },

      // Refresh sessions
      refreshSessions: async () => {
        set({
          sessions: [],
          filteredSessions: [],
          currentPage: 1,
          hasMore: true,
        });
        await get().fetchPendingSessions(1, false);
      },
    }),
    {
      name: "hr-travel-session-storage",
      partialize: (state) => ({
        sessions: state.sessions,
        filteredSessions: state.filteredSessions,
        totalCount: state.totalCount,
        hasMore: state.hasMore,
        currentPage: state.currentPage,
        filters: state.filters,
      }),
    },
  ),
);
