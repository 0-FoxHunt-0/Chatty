import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { showToast } from "../lib/toast";

interface IAuthStore {
  user: {
    _id: string;
    fullName: string;
    email: string;
    profilePicture: string;
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
      set({ error: (error as Error).message, isLoading: false });
      set({ user: null });
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
}));
