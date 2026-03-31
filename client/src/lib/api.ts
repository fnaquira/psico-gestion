import axios from "axios";
import { getToken, removeToken } from "./auth.js";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach Bearer token to every request
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token and redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      removeToken();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;
