import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "/api", // Use relative path instead of absolute
  withCredentials: true,
});
