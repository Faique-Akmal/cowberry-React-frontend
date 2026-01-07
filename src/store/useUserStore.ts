// useUserStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware"; // Optional: for debugging
import API from "../api/axios"; // Importing your provided axios instance
import { User, UserApiResponse } from "../types/userTypes";

interface UserState {
  // State
  users: User[]; // Master list of users
  filteredUsers: User[]; // List to be displayed (affected by search)
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  isInitialized: boolean; // Flag to prevent double fetching

  // Actions
  fetchUsers: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  resetStore: () => void;
}

export const useUserStore = create<UserState>()(
  devtools((set, get) => ({
    // Initial State
    users: [],
    filteredUsers: [],
    isLoading: false,
    error: null,
    searchQuery: "",
    isInitialized: false,

    // Actions
    fetchUsers: async () => {
      const { isInitialized, isLoading } = get();

      // Optimization: Prevent multiple calls if already fetched or currently fetching
      if (isInitialized || isLoading) {
        return;
      }

      set({ isLoading: true, error: null });

      try {
        // Using your specific API endpoint
        const response = await API.get<UserApiResponse>("/admin/users");

        if (response.data.success) {
          const fetchedUsers = response.data.data;

          set({
            users: fetchedUsers,
            filteredUsers: fetchedUsers, // Initially, filtered list = all users
            isInitialized: true,
            isLoading: false,
          });
        } else {
          throw new Error("API returned unsuccessful response");
        }
      } catch (err: any) {
        console.error("Failed to fetch users:", err);
        set({
          error:
            err.response?.data?.message ||
            err.message ||
            "Failed to fetch users",
          isLoading: false,
        });
      }
    },

    setSearchQuery: (query: string) => {
      const { users } = get();
      const lowerQuery = query.toLowerCase().trim();

      if (!lowerQuery) {
        // If search is empty, reset filtered list to full list
        set({ searchQuery: query, filteredUsers: users });
        return;
      }

      // Filter logic: Check ID, Name, or Full Name
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(lowerQuery) ||
          user.full_name.toLowerCase().includes(lowerQuery) ||
          user.role.toLowerCase().includes(lowerQuery) ||
          user.userId.toString().includes(lowerQuery)
      );

      set({ searchQuery: query, filteredUsers: filtered });
    },

    resetStore: () => {
      set({
        users: [],
        filteredUsers: [],
        isInitialized: false,
        searchQuery: "",
      });
    },
  }))
);
