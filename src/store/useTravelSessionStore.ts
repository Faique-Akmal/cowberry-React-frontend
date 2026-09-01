import { create } from "zustand";
import API from "../api/axios";
import {
  TravelSession,
  LocationLog,
  UserInfo,
  UserListItem,
  ApiPaginationResponse,
  SessionLogsResponse,
  GroupedSession,
} from "../types/travelSession";
import {
  filterSessionsByRole,
  filterUsersByRole,
  filterAndMapLogsToSession,
  buildRoleScopedParams,
  formatDateOnly,
} from "../utils/travelSessionHelpers";

const SESSIONS_TTL_MS = 60_000; // don't refetch the full list more than once/minute unless forced
const FARMER_DATA_BATCH_SIZE = 5;
const FARMER_DATA_BATCH_PAUSE_MS = 300;
const FARMER_DATA_MAX_PAGES = 50;

/**
 * Stable key identifying "whose" role-scoped data is cached. The TTL cache
 * in loadAllSessions must never be reused across a change of user/role -
 * otherwise a fetch that ran before currentUserInfo was set (or for a
 * different user) can get served to a different zonal manager/HOD/manager
 * for up to SESSIONS_TTL_MS, bypassing role filtering entirely.
 */
const getUserScopeKey = (info: UserInfo | null): string => {
  if (!info?.userRole) return "anonymous";
  return [
    info.userRole || "",
    info.department || "",
    (info as any).zoneId || "",
  ]
    .join("|")
    .toLowerCase();
};

interface TravelSessionState {
  // ---- data ----
  travelSessions: TravelSession[];
  sessionsMap: Record<string, TravelSession>;
  users: UserListItem[];
  allSessions: TravelSession[];
  allFarmerData: Record<string, any>;
  farmerDataCache: Record<string, any[]>;
  sessionLogs: Record<number, LocationLog[]>;
  logsPagination: Record<number, any>;
  currentUserInfo: UserInfo | null;
  totalSessionsCount: number;
  lastUpdateTime: Date | null;
  lastFetchedAt: number | null;
  _lastFetchedUserKey: string | null;

  // ---- loading flags ----
  isLoadingSessions: boolean;
  loadingLogs: Record<number, boolean>;

  // ---- new flags for better state management ----
  isInitialized: boolean;
  initializationError: string | null;
  isDataStale: boolean;

  // ---- in-flight dedupe ----
  _inFlightSessionsPromise: Promise<void> | null;

  // ---- actions ----
  setCurrentUserInfo: (info: UserInfo | null) => void;
  loadAllSessions: (force?: boolean) => Promise<void>;
  refreshSessions: () => Promise<void>;
  fetchActiveSessionsOnly: () => Promise<void>;
  fetchSessionLogs: (
    sessionId: number,
    page?: number,
    opts?: { force?: boolean },
  ) => Promise<LocationLog[]>;
  loadFarmerDataForGroups: (
    groupedData: GroupedSession[],
  ) => Promise<Record<string, any>>;
  clearCache: () => void;

  // ---- new actions for better control ----
  initializeStore: () => Promise<void>;
  ensureDataLoaded: () => Promise<void>;
  markDataStale: () => void;
  resetStore: () => void;
}

export const useTravelSessionStore = create<TravelSessionState>((set, get) => ({
  travelSessions: [],
  sessionsMap: {},
  users: [],
  allSessions: [],
  allFarmerData: {},
  farmerDataCache: {},
  sessionLogs: {},
  logsPagination: {},
  currentUserInfo: null,
  totalSessionsCount: 0,
  lastUpdateTime: null,
  lastFetchedAt: null,
  _lastFetchedUserKey: null,

  isLoadingSessions: false,
  loadingLogs: {},

  isInitialized: false,
  initializationError: null,
  isDataStale: false,

  _inFlightSessionsPromise: null,

  setCurrentUserInfo: (info) => {
    const prevKey = getUserScopeKey(get().currentUserInfo);
    const nextKey = getUserScopeKey(info);
    set({ currentUserInfo: info });
    // The role/department/zone this user is scoped to just changed (e.g.
    // first resolved from localStorage after starting as null/anonymous,
    // or a different user's info). Whatever is cached, if anything, was
    // fetched for the OLD scope - mark it stale so the next loadAllSessions
    // call re-fetches and re-filters instead of silently reusing it.
    if (prevKey !== nextKey) {
      set({ isDataStale: true });
    }
  },

  /**
   * Initialize the store - ensures data is loaded once
   */
  initializeStore: async () => {
    const state = get();

    // If already initialized, has data, AND that data belongs to the
    // current user's role scope, return. isDataStale gets set by
    // setCurrentUserInfo whenever the effective role/department/zone
    // changes, so this must not short-circuit past it.
    if (
      state.isInitialized &&
      state.travelSessions.length > 0 &&
      !state.isDataStale
    ) {
      return;
    }

    // If there's an initialization error, try again
    if (state.initializationError) {
      set({ initializationError: null });
    }

    await get().loadAllSessions();
    set({ isInitialized: true });
  },

  /**
   * Ensure data is loaded, useful for components that need data
   */
  ensureDataLoaded: async () => {
    const state = get();

    // If data is stale, refresh it
    if (state.isDataStale) {
      await get().refreshSessions();
      set({ isDataStale: false });
      return;
    }

    // If not initialized or no data, load it
    if (!state.isInitialized || state.travelSessions.length === 0) {
      await get().initializeStore();
    }
  },

  /**
   * Mark data as stale (useful when user changes or filters change)
   */
  markDataStale: () => {
    set({ isDataStale: true });
  },

  /**
   * Reset the store completely
   */
  resetStore: () => {
    set({
      travelSessions: [],
      sessionsMap: {},
      users: [],
      allSessions: [],
      allFarmerData: {},
      farmerDataCache: {},
      sessionLogs: {},
      logsPagination: {},
      totalSessionsCount: 0,
      lastUpdateTime: null,
      lastFetchedAt: null,
      _lastFetchedUserKey: null,
      isLoadingSessions: false,
      loadingLogs: {},
      isInitialized: false,
      initializationError: null,
      isDataStale: false,
      _inFlightSessionsPromise: null,
    });
  },

  /**
   * Loads the full, paginated session list from the API, applies role-based
   * filtering, and populates travelSessions / users / sessionsMap.
   *
   * TTL + in-flight dedupe means calling this from multiple places (initial
   * mount, filters changing, auto-refresh) will not cause redundant network
   * traffic as long as `force` isn't passed.
   */
  loadAllSessions: async (force = false) => {
    const state = get();
    const currentScopeKey = getUserScopeKey(state.currentUserInfo);
    const cacheMatchesCurrentUser =
      state._lastFetchedUserKey === currentScopeKey;

    // If force is false and there's an in-flight promise for the SAME user
    // scope, return it. A stale in-flight promise from a previous user's
    // scope must not be handed back here.
    if (!force && state._inFlightSessionsPromise && cacheMatchesCurrentUser) {
      return state._inFlightSessionsPromise;
    }

    // Check TTL cache - only reusable if it was fetched for this exact
    // user/role/department/zone. Otherwise (role hasn't resolved yet when
    // an earlier fetch ran, or a different user's data is cached), always
    // refetch and re-filter rather than silently showing another user's
    // scoped results.
    if (
      !force &&
      cacheMatchesCurrentUser &&
      state.lastFetchedAt &&
      Date.now() - state.lastFetchedAt < SESSIONS_TTL_MS &&
      state.travelSessions.length > 0
    ) {
      // Data is fresh enough, but ensure initialized flag is set
      if (!state.isInitialized) {
        set({ isInitialized: true });
      }
      return; // fresh enough, skip network call entirely
    }

    const run = async () => {
      set({
        isLoadingSessions: true,
        initializationError: null,
        isDataStale: false,
      });

      try {
        const currentUserInfo = get().currentUserInfo;
        const roleParams = buildRoleScopedParams(currentUserInfo);

        let allSessionsData: TravelSession[] = [];
        let currentPageNum = 1;
        let totalPagesNum = 1;
        let hasMorePages = true;

        while (hasMorePages) {
          const params: any = {
            page: currentPageNum,
            limit: 100,
            ...roleParams,
          };

          const res = await API.get<ApiPaginationResponse>(
            "/admin/travel-sessions",
            { params },
          );

          if (!res.data.success) {
            hasMorePages = false;
            break;
          }

          const sessions = res.data.data || [];
          allSessionsData = [...allSessionsData, ...sessions];

          currentPageNum = res.data.currentPage || currentPageNum;
          totalPagesNum = res.data.totalPages || totalPagesNum;
          hasMorePages = res.data.hasNextPage || false;

          if (currentPageNum < totalPagesNum) currentPageNum++;
          else hasMorePages = false;
        }

        const filteredSessions = currentUserInfo?.userRole
          ? filterSessionsByRole(allSessionsData, currentUserInfo)
          : allSessionsData;

        const newSessionsMap: Record<string, TravelSession> = {};
        filteredSessions.forEach((session) => {
          newSessionsMap[`${session.userId}-${session.sessionId}`] = session;
        });

        const uniqueUsers = Array.from(
          new Map(
            filteredSessions.map((session) => [
              session.userId,
              {
                userId: session.userId,
                fullName: session.fullName,
                username: session.username,
                employeeCode: session.employeeCode,
                department: session.department || "Unknown",
                allocatedArea: session.allocatedArea || "Unknown",
                // Needed for zonal-manager scoping in filterUsersByRole -
                // without this, uniqueUsers has no zone info to match
                // against and zonal managers get an empty users list even
                // though their sessions filter correctly.
                zone: (session as any).zone,
                zoneId: (session as any).zone?.id,
              } as UserListItem,
            ]),
          ).values(),
        );

        set({
          allSessions: filteredSessions,
          travelSessions: filteredSessions,
          sessionsMap: { ...get().sessionsMap, ...newSessionsMap },
          users: filterUsersByRole(uniqueUsers, currentUserInfo),
          totalSessionsCount: filteredSessions.length,
          lastUpdateTime: new Date(),
          lastFetchedAt: Date.now(),
          _lastFetchedUserKey: getUserScopeKey(currentUserInfo),
          isInitialized: true,
          isLoadingSessions: false,
          isDataStale: false,
          initializationError: null,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load travel sessions";
        console.error("Failed to load travel sessions", err);
        set({
          isLoadingSessions: false,
          initializationError: errorMessage,
          isInitialized: false,
        });
      } finally {
        set({
          isLoadingSessions: false,
          _inFlightSessionsPromise: null,
        });
      }
    };

    const promise = run();
    set({ _inFlightSessionsPromise: promise });
    return promise;
  },

  refreshSessions: () => get().loadAllSessions(true),

  /** Lightweight poll used by auto-refresh: only touches sessions without endTime. */
  fetchActiveSessionsOnly: async () => {
    try {
      const currentUserInfo = get().currentUserInfo;
      const params = buildRoleScopedParams(currentUserInfo);

      const res = await API.get("/admin/travel-sessions", { params });
      if (!res.data.success) return;

      const allSessionsData: TravelSession[] = res.data.data || [];
      const filtered = currentUserInfo?.userRole
        ? filterSessionsByRole(allSessionsData, currentUserInfo)
        : allSessionsData;

      set((state) => {
        const updatedSessions = [...state.travelSessions];
        const activeSessionMap = new Map<number, TravelSession>();

        filtered.forEach((session) => {
          if (!session.endTime)
            activeSessionMap.set(session.sessionId, session);
        });

        updatedSessions.forEach((session, index) => {
          if (!session.endTime && activeSessionMap.has(session.sessionId)) {
            updatedSessions[index] = activeSessionMap.get(session.sessionId)!;
            activeSessionMap.delete(session.sessionId);
          }
        });

        activeSessionMap.forEach((session) => updatedSessions.push(session));

        updatedSessions.sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
        );

        const newSessionsMap = { ...state.sessionsMap };
        filtered.forEach((session) => {
          if (!session.endTime) {
            newSessionsMap[`${session.userId}-${session.sessionId}`] = session;
          }
        });

        return {
          travelSessions: updatedSessions,
          sessionsMap: newSessionsMap,
          lastUpdateTime: new Date(),
          isDataStale: false,
        };
      });
    } catch (err) {
      console.error("Failed to fetch active sessions", err);
    }
  },

  /**
   * Fetches one page of GPS logs for a session. Cached: repeat calls for a
   * page already in state resolve instantly from memory unless `force`.
   */
  fetchSessionLogs: async (sessionId, page = 1, opts) => {
    const force = opts?.force ?? false;
    const state = get();

    if (!force && page === 1 && state.sessionLogs[sessionId]?.length) {
      return state.sessionLogs[sessionId];
    }

    set((s) => ({ loadingLogs: { ...s.loadingLogs, [sessionId]: true } }));

    try {
      const response = await API.get<SessionLogsResponse>(
        `/admin/travel-sessions/${sessionId}/logs`,
        { params: { page, limit: 100 } },
      );

      if (!response.data.success) return [];

      const logs = response.data.data;
      const session =
        get().sessionsMap[`${sessionId}`] ||
        get().travelSessions.find((s) => s.sessionId === sessionId);

      const filteredLogs = session
        ? filterAndMapLogsToSession(logs, session)
        : logs;

      set((s) => ({
        sessionLogs: {
          ...s.sessionLogs,
          [sessionId]:
            page === 1
              ? filteredLogs
              : [...(s.sessionLogs[sessionId] || []), ...filteredLogs],
        },
        logsPagination: {
          ...s.logsPagination,
          [sessionId]: response.data.pagination,
        },
      }));

      return filteredLogs;
    } catch (error) {
      console.error(`Failed to fetch logs for session ${sessionId}:`, error);
      return [];
    } finally {
      set((s) => ({ loadingLogs: { ...s.loadingLogs, [sessionId]: false } }));
    }
  },

  /**
   * Fetches farmer/travel-session detail data for every unique
   * (userId, exact date) implied by `groupedData`, reusing farmerDataCache
   * so re-running an export with the same filters costs zero extra requests.
   *
   * IMPORTANT: this endpoint only reliably supports single-day queries
   * (startDate === endDate, e.g. ...?startDate=2026-08-04&endDate=2026-08-04).
   * Earlier this collapsed every group's date into one min/max range per
   * user to save requests, but the endpoint does not correctly return every
   * session across a multi-day range - it would silently drop farmer data
   * for users who had sessions on more than one date. Querying one call per
   * (userId, date) - exactly matching the known-good single-day shape -
   * fixes that, and the per-date cache still makes repeat exports free.
   */
  loadFarmerDataForGroups: async (groupedData) => {
    const farmerDataMap: Record<string, any> = {};

    try {
      // Unique (userId, date) pairs - one entry per group, not collapsed.
      const userDatePairs = new Map<string, { userId: number; date: string }>();
      groupedData.forEach((group) => {
        const key = `${group.userId}:${group.date}`;
        if (!userDatePairs.has(key)) {
          userDatePairs.set(key, { userId: group.userId, date: group.date });
        }
      });

      const uniquePairs = Array.from(userDatePairs.values());

      const fetchSessionsForUserDate = async (
        userId: number,
        date: string,
      ): Promise<any[]> => {
        const cacheKey = `${userId}:${date}`;
        const cached = get().farmerDataCache[cacheKey];
        if (cached) return cached;

        const collected: any[] = [];
        let page = 1;
        let hasMorePages = true;
        let expectedCount: number | null = null;

        while (hasMorePages && page <= FARMER_DATA_MAX_PAGES) {
          try {
            const response = await API.get(
              `/tracking/locationlog/get_travel_sessions`,
              {
                params: {
                  userId,
                  startDate: date,
                  endDate: date,
                  page,
                  limit: 100,
                },
                timeout: 15000,
              },
            );

            if (!response.data.success) break;

            const pageData: any[] = response.data.sessions?.data || [];
            collected.push(...pageData);

            if (typeof response.data.sessions?.count === "number") {
              expectedCount = response.data.sessions.count;
            }

            const pagination =
              response.data.sessions?.pagination || response.data.pagination;

            if (pagination && typeof pagination.hasNextPage === "boolean") {
              hasMorePages = pagination.hasNextPage;
            } else if (
              pagination &&
              typeof pagination.totalPages === "number"
            ) {
              hasMorePages = page < pagination.totalPages;
            } else if (typeof response.data.sessions?.totalPages === "number") {
              hasMorePages = page < response.data.sessions.totalPages;
            } else if (
              typeof response.data.sessions?.hasNextPage === "boolean"
            ) {
              hasMorePages = response.data.sessions.hasNextPage;
            } else if (expectedCount !== null) {
              // Endpoint reports a total `count` but no real pagination -
              // trust that count over the page-size heuristic below.
              hasMorePages = collected.length < expectedCount;
            } else {
              hasMorePages = pageData.length >= 100;
            }

            page++;
          } catch (error) {
            console.error(
              `Error fetching farmer data page ${page} for user ${userId} on ${date}:`,
              error,
            );
            break;
          }
        }

        set((s) => ({
          farmerDataCache: { ...s.farmerDataCache, [cacheKey]: collected },
        }));
        return collected;
      };

      for (let i = 0; i < uniquePairs.length; i += FARMER_DATA_BATCH_SIZE) {
        const batch = uniquePairs.slice(i, i + FARMER_DATA_BATCH_SIZE);

        const batchPromises = batch.map(async ({ userId, date }) => {
          try {
            const sessionsForUserDate = await fetchSessionsForUserDate(
              userId,
              date,
            );
            sessionsForUserDate.forEach((session: any) => {
              const sessionDate = formatDateOnly(
                session.date || session.startTime,
              );
              const key = `${userId}-${sessionDate}`;
              if (!farmerDataMap[key]) farmerDataMap[key] = [];
              farmerDataMap[key].push(session);
            });
          } catch (error) {
            console.error(
              `Error fetching farmer data for user ${userId} on ${date}`,
              error,
            );
          }
        });

        await Promise.all(batchPromises);

        if (i + FARMER_DATA_BATCH_SIZE < uniquePairs.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, FARMER_DATA_BATCH_PAUSE_MS),
          );
        }
      }

      set((s) => ({ allFarmerData: { ...s.allFarmerData, ...farmerDataMap } }));
    } catch (err) {
      console.error("Failed to load farmer data", err);
    }

    return farmerDataMap;
  },

  clearCache: () =>
    set({
      travelSessions: [],
      sessionsMap: {},
      users: [],
      allSessions: [],
      allFarmerData: {},
      farmerDataCache: {},
      sessionLogs: {},
      logsPagination: {},
      totalSessionsCount: 0,
      lastUpdateTime: null,
      lastFetchedAt: null,
      _lastFetchedUserKey: null,
      isInitialized: false,
      initializationError: null,
      isDataStale: false,
    }),
}));
