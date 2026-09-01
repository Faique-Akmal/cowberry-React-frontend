import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import API from "../api/axios";

export interface Zone {
  id: number;
  zoneId: string;
  name: string;
  area: string;
  city: string;
  state: string;
  description?: string;
  isActive?: boolean;
  pincode?: string;
}

export interface CheckLog {
  userId: number;
  fullName: string;
  employee_code: string;
  logType: "check_in" | "check_out";
  timestamp: string;
  latitude?: number;
  longitude?: number;
  location?: string | null;
  department?: string | null;
  zone?: Zone | string | null;
}

interface AttendanceState {
  logs: CheckLog[];
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;

  // Actions
  fetchLogs: (forceRefresh?: boolean) => Promise<void>;
  clearCache: () => void;
  getLogs: () => CheckLog[];
  getFilteredLogs: (filters?: any) => CheckLog[];
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      logs: [],
      isLoading: false,
      lastFetched: null,
      error: null,

      fetchLogs: async (forceRefresh = false) => {
        const { lastFetched, logs } = get();
        const now = Date.now();

        // Check if cache is still valid
        if (
          !forceRefresh &&
          lastFetched &&
          now - lastFetched < CACHE_DURATION &&
          logs.length > 0
        ) {
          console.log("Using cached attendance data");
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            set({ isLoading: false, error: "No access token found" });
            return;
          }

          const BULK_FETCH_PAGE_SIZE = 100;
          const MAX_PAGES_TO_FETCH = 500;
          let page = 1;
          let allData: CheckLog[] = [];

          while (true) {
            const response = await API.get<{
              success: boolean;
              data: CheckLog[];
              totalPages?: number;
              hasMore?: boolean;
            }>("/admin/check-logs", {
              headers: { Authorization: `Bearer ${token}` },
              params: { page, limit: BULK_FETCH_PAGE_SIZE },
            });

            if (!response.data.success) break;

            allData = allData.concat(response.data.data);

            const totalPages = response.data.totalPages;
            const responseHasMore =
              response.data.hasMore ??
              (totalPages
                ? page < totalPages
                : response.data.data.length === BULK_FETCH_PAGE_SIZE);

            if (!responseHasMore || page >= MAX_PAGES_TO_FETCH) break;
            page += 1;
          }

          set({
            logs: allData,
            lastFetched: Date.now(),
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error("Error fetching check logs:", error);
          set({
            isLoading: false,
            error: error?.message || "Failed to fetch logs",
          });
        }
      },

      clearCache: () => {
        set({ logs: [], lastFetched: null, error: null });
      },

      getLogs: () => {
        return get().logs;
      },

      getFilteredLogs: (filters?: any) => {
        const logs = get().logs;
        // Role-based filtering
        const role = (localStorage.getItem("userRole") || "")
          .trim()
          .toLowerCase();
        let filtered: CheckLog[];

        if (role === "hr" || role === "admin") {
          // Admin/HR see everything.
          filtered = logs;
        } else if (role === "manager") {
          const myDepartment = (localStorage.getItem("department") || "")
            .trim()
            .toLowerCase();
          // No department on record for this manager -> deny, don't leak all logs.
          filtered = myDepartment
            ? logs.filter(
                (log) =>
                  (log.department || "").trim().toLowerCase() === myDepartment,
              )
            : [];
        } else if (
          role === "zonal manager" ||
          role === "zonal_manager" ||
          role === "zonalmanager"
        ) {
          // log.zone is an object ({ id, zoneId, name, area, city, state, ... }),
          // never a plain string — calling .toLowerCase() on it directly (as the
          // old code did) throws a TypeError. Also read zoneId/zoneName, since
          // storing the zone object under the "zone" key coerces it to the
          // literal string "[object Object]".
          const myZoneId = (localStorage.getItem("zoneId") || "")
            .trim()
            .toLowerCase();
          const legacyZone = (localStorage.getItem("zone") || "")
            .trim()
            .toLowerCase();
          const myZoneName =
            (localStorage.getItem("zoneName") || "").trim().toLowerCase() ||
            (legacyZone !== "[object object]" ? legacyZone : "");

          // No zone on record for this zonal manager -> deny, don't leak all logs.
          filtered =
            myZoneId || myZoneName
              ? logs.filter((log) => {
                  const zone = log.zone;
                  if (!zone) return false;

                  if (typeof zone === "object") {
                    const logZoneCode = (zone.zoneId || "")
                      .trim()
                      .toLowerCase();
                    // localStorage's "zoneId" key isn't guaranteed to hold
                    // the zoneId *code* (e.g. "AHM001") — depending on how
                    // the session was populated it may instead hold the
                    // zone's numeric primary key (zone.id, e.g. "3"). Accept
                    // either so a mismatch in one doesn't hide a match in
                    // the other.
                    const logZoneNumericId =
                      zone.id != null
                        ? String(zone.id).trim().toLowerCase()
                        : "";
                    const logZoneName = (zone.name || "").trim().toLowerCase();

                    const idMatches =
                      !!myZoneId &&
                      (logZoneCode === myZoneId ||
                        logZoneNumericId === myZoneId);
                    const nameMatches =
                      !!myZoneName && logZoneName === myZoneName;

                    // OR, not first-match-wins: a mismatch on id must not
                    // block a match on name (or vice versa).
                    return idMatches || nameMatches;
                  }

                  const zoneStr = String(zone).trim().toLowerCase();
                  return (
                    (!!myZoneId && zoneStr === myZoneId) ||
                    (!!myZoneName && zoneStr === myZoneName)
                  );
                })
              : [];
        } else {
          // Unrecognized/missing role -> deny by default instead of
          // silently falling through to "see everything".
          filtered = [];
        }

        // Apply additional filters if provided
        if (filters) {
          if (filters.searchQuery) {
            const searchLower = filters.searchQuery.toLowerCase();
            filtered = filtered.filter((log) => {
              if (filters.searchType === "fullName") {
                return log.fullName.toLowerCase().includes(searchLower);
              } else {
                return log.employee_code.toLowerCase().includes(searchLower);
              }
            });
          }

          if (filters.startDate && filters.endDate) {
            filtered = filtered.filter((log) => {
              const logDate = new Date(log.timestamp);
              return logDate >= filters.startDate && logDate <= filters.endDate;
            });
          } else if (filters.startDate) {
            filtered = filtered.filter((log) => {
              const logDate = new Date(log.timestamp);
              return logDate >= filters.startDate;
            });
          } else if (filters.endDate) {
            filtered = filtered.filter((log) => {
              const logDate = new Date(log.timestamp);
              return logDate <= filters.endDate;
            });
          }
        }

        return filtered;
      },
    }),
    {
      name: "attendance-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        logs: state.logs,
        lastFetched: state.lastFetched,
      }),
    },
  ),
);
