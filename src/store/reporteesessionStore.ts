// store/reporteesessionStore.ts
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
  canApproveByReportee: (session: TravelSession) => boolean;
}

const PAGE_SIZE = 20;

// The currently logged-in user's id, read fresh on every call (not cached
// in a module-level constant) so switching accounts in the same browser
// tab is picked up immediately instead of sticking to whoever was logged
// in when the module first loaded.
const getCurrentUserId = (): number | null => {
  const raw = localStorage.getItem("userId");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
};

// Defensive client-side scoping: only sessions where the LOGGED-IN user is
// the one listed in `reporteeInfo` belong in this reportee's queue. This
// guards against two things the backend response alone doesn't protect
// against: (1) `/pending/reportee` ever returning sessions outside the
// caller's own scope, and (2) zustand's `persist` middleware replaying a
// PREVIOUS reportee's cached sessions from localStorage after a different
// user logs in on the same browser (top-level `userId`/`username` on a
// session belong to the traveler, not the reportee, so they can't be used
// for this check - `reporteeInfo.id` is the actual approver).
const scopeToCurrentReportee = (data: TravelSession[]): TravelSession[] => {
  const currentUserId = getCurrentUserId();
  if (currentUserId === null) return data;
  return data.filter((session) => session.reporteeInfo?.id === currentUserId);
};

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
        const match = sessions.find((s) => s.sessionId === sessionId);
        if (!match) return null;
        const currentUserId = getCurrentUserId();
        if (
          currentUserId !== null &&
          match.reporteeInfo?.id !== currentUserId
        ) {
          return null;
        }
        return match;
      },

      // Helper function to check if reportee can approve
      canApproveByReportee: (session: TravelSession) => {
        return !session.isApprovedByReportee && !session.isRejectedByReportee;
      },

      // Apply filters
      applyFilters: () => {
        const { sessions, filters } = get();
        // Scope first: never let another reportee's session (e.g. replayed
        // from persisted localStorage after an account switch) leak through
        // regardless of which status/search filters are active.
        let result = scopeToCurrentReportee(sessions);

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
          const canApproveByReportee = get().canApproveByReportee;
          if (filters.status === "PENDING_REPORTEE") {
            result = result.filter((session) => canApproveByReportee(session));
          } else if (filters.status === "APPROVED_REPORTEE") {
            result = result.filter((session) => session.isApprovedByReportee);
          } else if (filters.status === "REJECTED_REPORTEE") {
            result = result.filter((session) => session.isRejectedByReportee);
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
            "/tracking/travel-sessions/pending/reportee",
            {
              params: {
                page: page,
                limit: PAGE_SIZE,
              },
            },
          );

          if (response.data.success) {
            const rawData = response.data.data || [];
            // The endpoint is meant to already be scoped to the caller, but
            // scope again on the frontend so a backend regression can't
            // surface someone else's pending approvals in this reportee's list.
            const data = scopeToCurrentReportee(rawData);
            const pagination = response.data.pagination;

            // total/hasNextPage describe the backend's (unscoped) result set,
            // which is fine for driving "load more" - we still want to keep
            // paging through the backend list even if this particular page
            // happened to scope down to fewer/zero rows for this reportee.
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

            if (rawData.length === 0 && page === 1) {
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

      // Fetch single session by ID. Used both for the cache-miss path in
      // the normal list AND for "open this exact session" deep links
      // (clicking a row elsewhere and landing on the pending list).
      //
      // Mirrors the HR store's approach: a direct hit on
      // GET /tracking/travel-session/:id is tried first, but if it comes
      // back empty/unauthorized we fall back to scanning
      // /tracking/travel-sessions/pending/reportee page by page - the same
      // endpoint that already powers this list and is known to be scoped
      // correctly - before giving up. This is what makes "click a pending
      // session and land exactly on it" reliable instead of only working
      // when the session already happens to be in the loaded cache.
      fetchSessionById: async (sessionId: number) => {
        try {
          set({ sessionLoading: true });

          // Already in cache (and scoped to this reportee)? Skip the
          // network call entirely.
          const cached = get().findSessionInCache(sessionId);
          if (cached) {
            return cached;
          }

          const currentUserId = getCurrentUserId();
          const belongsToCurrentReportee = (session: TravelSession) =>
            currentUserId === null ||
            session.reporteeInfo?.id === currentUserId;

          // 1) Try the direct single-session endpoint.
          try {
            const response = await API.get(
              `/tracking/travel-session/${sessionId}`,
            );

            if (response.data.success && response.data.data) {
              const session: TravelSession = response.data.data;

              if (!belongsToCurrentReportee(session)) {
                console.warn(
                  `Session #${sessionId} is not in the current user's reportee queue.`,
                );
              } else {
                set((state) => {
                  const exists = state.sessions.some(
                    (s) => s.sessionId === session.sessionId,
                  );
                  if (!exists) {
                    return { sessions: [session, ...state.sessions] };
                  }
                  return {};
                });
                get().applyFilters();
                toast.success(`Loaded session #${sessionId} for review`);
                return session;
              }
            }
          } catch (directFetchError) {
            // Swallow and fall through to the page-scan fallback below -
            // the direct endpoint may reject this session for reasons
            // unrelated to it not existing (e.g. permission scoping).
            console.warn(
              `Direct fetch of session #${sessionId} failed, falling back to scanning the pending reportee list.`,
              directFetchError,
            );
          }

          // 2) Fallback - scan this reportee's own pending list. Uses local
          // variables only (never touches currentPage/hasMore), so the
          // visible list's normal infinite-scroll pagination is untouched.
          const MAX_SCAN_PAGES = 25;
          for (let page = 1; page <= MAX_SCAN_PAGES; page++) {
            const listResponse = await API.get(
              "/tracking/travel-sessions/pending/reportee",
              { params: { page, limit: PAGE_SIZE } },
            );

            if (!listResponse.data.success) break;

            const pageData: TravelSession[] = listResponse.data.data || [];
            const match = pageData.find(
              (s) => s.sessionId === sessionId && belongsToCurrentReportee(s),
            );

            if (match) {
              set((state) => {
                const exists = state.sessions.some(
                  (s) => s.sessionId === match.sessionId,
                );
                if (!exists) {
                  return { sessions: [match, ...state.sessions] };
                }
                return {};
              });
              get().applyFilters();
              toast.success(`Loaded session #${sessionId} for review`);
              return match;
            }

            const hasNextPage = listResponse.data.pagination?.hasNextPage;
            if (!hasNextPage) break;
          }

          toast.error(
            "Session not found or you don't have permission to view it",
          );
          return null;
        } catch (error) {
          console.error("Error fetching session:", error);
          toast.error("Failed to load session.");
          return null;
        } finally {
          set({ sessionLoading: false });
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
            `/tracking/travel-session/${sessionId}/reportee-approve`,
            {
              action: action,
              comments: comments?.trim() || `${action} by Reportee`,
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
      name: "travel-session-storage",
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
