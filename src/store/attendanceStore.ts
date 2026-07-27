import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import API from "../api/axios";

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
  zone?: string | null;
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
        let filtered = logs;

        if (role === "manager") {
          const myDepartment = localStorage.getItem("department");
          if (myDepartment) {
            filtered = filtered.filter(
              (log) =>
                (log.department || "").toLowerCase() ===
                myDepartment.toLowerCase(),
            );
          }
        } else if (
          role === "zonal manager" ||
          role === "zonal_manager" ||
          role === "zonalmanager"
        ) {
          const myZone = localStorage.getItem("zone");
          if (myZone) {
            filtered = filtered.filter(
              (log) => (log.zone || "").toLowerCase() === myZone.toLowerCase(),
            );
          }
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
