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
    bio: string;
    token: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  signup: (formData: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  login: (formData: { email: string; password: string }) => Promise<void>;
}

export const useAuthStore = create<IAuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get("/auth/check-auth");
      set({ user: response.data.user, isLoading: false });
    } catch (error) {
      // Silently handle 401 errors (expected when user is not logged in)
      // Only show toasts for unexpected errors
      const axiosError = error as AxiosError;
      if (axiosError?.response?.status === 401) {
        set({ user: null, isLoading: false, error: null });
      } else {
        set({
          error: axiosError.message || "An error occurred",
          isLoading: false,
        });
        set({ user: null });
        showToast.error("Failed to check authentication status");
      }
    }
  },
  signup: async (formData) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post("/auth/signup", formData);
      set({ user: response.data.user, isLoading: false });
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
      set({ user: response.data.user, isLoading: false });
      showToast.success(response.data.message);
    } catch (error) {
      const axiosError = error as AxiosError;
      set({ error: axiosError.message || "An error occurred", isLoading: false });
      set({ user: null });
      showToast.error("Failed to login");
    }
  },
}));
