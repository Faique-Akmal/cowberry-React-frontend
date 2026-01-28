// src/store/useZoneStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import API from "../api/axios"; // Aapka axios instance
import {
  Zone,
  Pagination,
  ZoneApiResponse,
  ZoneQueryParams,
} from "../types/zoneTypes";

interface ZoneState {
  // Data State
  zones: Zone[];
  pagination: Pagination | null;

  // UI States
  isLoading: boolean;
  isInitialized: boolean; // Track karega ki data ek baar fetch ho chuka hai ya nahi
  error: string | null;

  // Actions
  fetchZones: (
    params?: ZoneQueryParams,
    forceRefresh?: boolean,
  ) => Promise<void>;
  resetStore: () => void;
}

export const useZoneStore = create<ZoneState>()(
  devtools((set, get) => ({
    zones: [],
    pagination: null,
    isLoading: false,
    isInitialized: false,
    error: null,

    fetchZones: async (
      params = { page: 1, limit: 10 },
      forceRefresh = false,
    ) => {
      const { isInitialized, isLoading } = get();

      // Optimization: Agar data already loaded hai aur forceRefresh nahi hai, to API call mat karo
      if (isInitialized && !forceRefresh && !params.search) {
        return;
      }

      // Optimization: Agar already loading hai to duplicate call roko
      if (isLoading) return;

      set({ isLoading: true, error: null });

      try {
        // Axios interceptor automatically header me token attach karega
        const response = await API.get<ZoneApiResponse>("/auth/zones");

        if (response.data.success) {
          set({
            zones: response.data.data,
            pagination: response.data.pagination,
            isInitialized: true, // Mark as initialized
            isLoading: false,
          });
        }
      } catch (error: any) {
        // Error handling based on your axios interceptor logic
        const errorMessage =
          error.response?.data?.message || "Failed to fetch zones";
        set({ error: errorMessage, isLoading: false });
        console.error("Zone fetch error:", error);
      }
    },

    resetStore: () => {
      set({ zones: [], isInitialized: false, pagination: null, error: null });
    },
  })),
);
