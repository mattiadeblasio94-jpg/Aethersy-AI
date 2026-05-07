import axios from "axios";
import { toast } from "sonner";

// Use relative path for Vercel (APIs on same domain)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
export const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("e360_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("e360_token");
      localStorage.removeItem("e360_user");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register" && window.location.pathname !== "/") {
        window.location.href = "/login";
      }
    }
    if (err.response && err.response.status === 402) {
      toast.error(err.response.data?.detail || "Upgrade richiesto", {
        action: {
          label: "Upgrade",
          onClick: () => { window.location.href = "/pricing"; },
        },
        duration: 6000,
      });
    }
    return Promise.reject(err);
  }
);
