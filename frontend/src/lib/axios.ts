import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:5001/api",
  withCredentials: true,
});

// Intercept responses to silently handle 401 errors on check-auth endpoint
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Silently handle 401 errors on check-auth (expected when user is not logged in)
    if (
      error?.response?.status === 401 &&
      error?.config?.url?.includes("/auth/check-auth")
    ) {
      // Return a rejected promise but don't throw - let the calling code handle it
      return Promise.reject(error);
    }
    // For all other errors, pass them through normally
    return Promise.reject(error);
  }
);
