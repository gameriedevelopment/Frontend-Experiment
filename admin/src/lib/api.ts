import axios from "axios";
import Cookies from "js-cookie";

export const API_URL = import.meta.env.VITE_API_URL || "/api/v1";
export const ADMIN_TOKEN_COOKIE = "admin_auth_token";

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

/** The admin list endpoints all page the same way. */
export interface AdminPage<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  hasMore?: boolean;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get(ADMIN_TOKEN_COOKIE);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // The JSON default would make axios serialise the form; this lets the browser add the boundary.
  if (config.data instanceof FormData) {
    config.headers["Content-Type"] = "multipart/form-data";
    config.timeout = 120_000;
  }
  return config;
});

type ExpiredListener = () => void;
const expiredListeners = new Set<ExpiredListener>();

/** The session layer subscribes so any 401 sends the operator back to sign in. */
export function onSessionExpired(listener: ExpiredListener) {
  expiredListeners.add(listener);
  return () => void expiredListeners.delete(listener);
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && Cookies.get(ADMIN_TOKEN_COOKIE)) {
      Cookies.remove(ADMIN_TOKEN_COOKIE);
      expiredListeners.forEach((listener) => listener());
    }
    return Promise.reject(error);
  },
);

export async function unwrap<T>(request: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  return (await request).data.data;
}
