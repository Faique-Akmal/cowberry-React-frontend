import { create } from "zustand";
import API from "../api/axios";

interface PendingSession {
  sessionId: number;
  userId: number;
  fullName: string;
  employeeCode: string;
  startTime: string;
  endTime: string | null;
  totalDistance: number;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number | null;
  endLongitude: number | null;
  // Add other fields as needed
}

interface PendingSessionsStore {
  pendingSessions: PendingSession[];
  selectedSession: PendingSession | null;
  isLoading: boolean;
  error: string | null;
  fetchPendingSessions: () => Promise<void>;
  fetchSessionById: (sessionId: string) => Promise<void>;
  approveSession: (sessionId: number, remarks?: string) => Promise<void>;
  rejectSession: (sessionId: number, remarks: string) => Promise<void>;
  setSelectedSession: (session: PendingSession | null) => void;
  clearSelectedSession: () => void;
}

export const usePendingSessionsStore = create<PendingSessionsStore>(
  (set, get) => ({
    pendingSessions: [],
    selectedSession: null,
    isLoading: false,
    error: null,

    fetchPendingSessions: async () => {
      set({ isLoading: true, error: null });
      try {
        // Get current user from localStorage
        const userDataStr = localStorage.getItem("user");
        let userData = null;
        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr);
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }

        // Get user role and ID
        const userRole =
          localStorage.getItem("userRole") ||
          userData?.userRole ||
          userData?.role ||
          "";
        const userId =
          userData?.userId || userData?.id || localStorage.getItem("userId");

        // Prepare API params
        const params: any = {};

        // HR can see all pending sessions, regular users see only their own
        if (userRole.toUpperCase() !== "HR" && userId) {
          params.userId = userId;
        }

        const response = await API.get(
          "/tracking/locationlog/get_pending_sessions",
          { params },
        );

        if (response.data.success) {
          set({ pendingSessions: response.data.data || [], isLoading: false });
        } else {
          set({
            error: response.data.message || "Failed to fetch pending sessions",
            isLoading: false,
          });
        }
      } catch (error: any) {
        set({
          error: error.message || "Failed to fetch pending sessions",
          isLoading: false,
        });
      }
    },

    fetchSessionById: async (sessionId: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await API.get(
          `/tracking/locationlog/get_travel_session/${sessionId}`,
        );

        if (response.data.success) {
          const session = response.data.session || response.data.data;
          set({
            selectedSession: session,
            isLoading: false,
          });
        } else {
          set({
            error: response.data.message || "Failed to fetch session",
            isLoading: false,
          });
        }
      } catch (error: any) {
        set({
          error: error.message || "Failed to fetch session",
          isLoading: false,
        });
      }
    },

    approveSession: async (sessionId: number, remarks?: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await API.post(
          `/tracking/locationlog/approve_session/${sessionId}`,
          {
            remarks: remarks || "",
            status: "APPROVED",
          },
        );

        if (response.data.success) {
          // Update the selected session status
          const currentSelected = get().selectedSession;
          if (currentSelected && currentSelected.sessionId === sessionId) {
            set({
              selectedSession: {
                ...currentSelected,
                status: "APPROVED",
              } as PendingSession,
              isLoading: false,
            });
          }
          // Refresh pending sessions list
          await get().fetchPendingSessions();
        } else {
          set({
            error: response.data.message || "Failed to approve session",
            isLoading: false,
          });
        }
      } catch (error: any) {
        set({
          error: error.message || "Failed to approve session",
          isLoading: false,
        });
      }
    },

    rejectSession: async (sessionId: number, remarks: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await API.post(
          `/tracking/locationlog/reject_session/${sessionId}`,
          {
            remarks,
            status: "REJECTED",
          },
        );

        if (response.data.success) {
          // Update the selected session status
          const currentSelected = get().selectedSession;
          if (currentSelected && currentSelected.sessionId === sessionId) {
            set({
              selectedSession: {
                ...currentSelected,
                status: "REJECTED",
              } as PendingSession,
              isLoading: false,
            });
          }
          // Refresh pending sessions list
          await get().fetchPendingSessions();
        } else {
          set({
            error: response.data.message || "Failed to reject session",
            isLoading: false,
          });
        }
      } catch (error: any) {
        set({
          error: error.message || "Failed to reject session",
          isLoading: false,
        });
      }
    },

    setSelectedSession: (session: PendingSession | null) => {
      set({ selectedSession: session });
    },

    clearSelectedSession: () => {
      set({ selectedSession: null });
    },
  }),
);
