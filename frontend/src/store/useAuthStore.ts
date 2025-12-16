import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { showToast } from "../lib/toast";
import { AxiosError } from "axios";

interface IAuthStore {
  user: {
    _id: string;
    fullName: string;
    email: string;
    profilePicture: string;
    bio?: string;
    token?: string;
  } | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  signup: (formData: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  login: (formData: { email: string; password: string }) => Promise<void>;
  updateProfile: (formData: {
    fullName: string;
    email: string;
    bio?: string;
    profilePicture?: string;
  }) => Promise<void>;
}

// Cache key and expiration time (23 hours to have buffer before token expires)
const CACHE_KEY = "auth_user_cache";
const CACHE_EXPIRY_MS = 23 * 60 * 60 * 1000; // 23 hours in milliseconds

interface CachedUserData {
  user: {
    _id: string;
    fullName: string;
    email: string;
    profilePicture: string;
    bio?: string;
  };
  timestamp: number;
}

// Helper functions for cache management
const getCachedUser = (): CachedUserData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: CachedUserData = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (within 23 hours)
    if (now - parsed.timestamp < CACHE_EXPIRY_MS) {
      return parsed;
    }

    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error("Error reading auth cache:", error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCachedUser = (user: {
  _id: string;
  fullName: string;
  email: string;
  profilePicture: string;
  bio?: string;
}) => {
  try {
    const cacheData: CachedUserData = {
      user,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error caching auth data:", error);
  }
};

const clearCachedUser = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error("Error clearing auth cache:", error);
  }
};

export const useAuthStore = create<IAuthStore>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  initializeAuth: async () => {
    // Set loading state to prevent premature route rendering
    set({ isLoading: true, isInitialized: false });

    // Check for cached user data first
    const cached = getCachedUser();

    if (cached) {
      // Auto-login with cached data immediately
      set({ user: cached.user, isLoading: false, isInitialized: true });

      // Verify with server in background (silently)
      try {
        const response = await axiosInstance.get("/auth/check-auth");
        const userData = response.data.user;

        // Update cache with fresh data
        setCachedUser(userData);

        // Update user state with fresh data
        set({ user: userData });
      } catch (error) {
        const axiosError = error as AxiosError;

        if (axiosError?.response?.status === 401) {
          // Token invalid, clear cache and state
          clearCachedUser();
          set({ user: null });
        }
        // Silently handle other errors - keep cached data
      }
    } else {
      // No cache, user is not authenticated
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },
  checkAuth: async () => {
    set({ isLoading: true });

    // Check cache first
    const cached = getCachedUser();

    // Always fetch from server to get fresh data
    try {
      const response = await axiosInstance.get("/auth/check-auth");
      const userData = response.data.user;

      // Cache the fresh data
      setCachedUser(userData);

      set({ user: userData, isLoading: false, error: null });
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError?.response?.status === 401) {
        // Not authenticated - clear cache and state
        clearCachedUser();
        set({ user: null, isLoading: false, error: null });
      } else {
        // Network/server error - use cache if available
        if (cached) {
          set({ user: cached.user, isLoading: false, error: null });
          showToast.error("Using cached data. Please check your connection.");
        } else {
          set({
            error: axiosError.message || "An error occurred",
            isLoading: false,
          });
          set({ user: null });
          showToast.error("Failed to check authentication status");
        }
      }
    }
  },
  signup: async (formData) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post("/auth/signup", formData);
      const userData = response.data.user;

      // Cache the new user data
      setCachedUser(userData);

      set({ user: userData, isLoading: false });
      showToast.success(response.data.message);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      showToast.error("Failed to create account");
      console.log(error);
    }
  },
  logout: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post("/auth/logout");

      // Clear cache on logout
      clearCachedUser();

      set({ user: null, isLoading: false });
      showToast.success(response.data.message);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      showToast.error("Failed to logout");
    }
  },
  login: async (formData) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post("/auth/login", formData);
      const userData = response.data.user;

      // Cache the user data
      setCachedUser(userData);

      set({ user: userData, isLoading: false });
      showToast.success(response.data.message);
    } catch (error) {
      const axiosError = error as AxiosError;
      set({
        error: axiosError.message || "An error occurred",
        isLoading: false,
      });
      set({ user: null });
      showToast.error("Failed to login");
    }
  },
  updateProfile: async (formData) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.put(
        "/auth/update-profile",
        formData
      );
      const userData = response.data.user;

      // Update cache with fresh profile data
      setCachedUser(userData);

      set({ user: userData, isLoading: false });
      showToast.success(response.data.message);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      showToast.error("Failed to update profile");
    }
  },
}));
