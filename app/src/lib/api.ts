import axios from "axios";
import Cookies from "js-cookie";
import { useAuthStore } from "@/features/auth/authStore";
import { endClientSession } from "@/features/auth/session";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

const SESSION_AUTH_MESSAGES = new Set([
  "Authentication failed",
  "Invalid authorization header format",
  "Invalid or expired token",
  "Invalid token",
  "Missing authorization header",
  "Session expired, please sign in again",
  "Unauthorized",
]);

function isAuthenticationFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) return false;

  const payload = error.response.data as { message?: unknown } | undefined;
  const messages = Array.isArray(payload?.message) ? payload.message : [payload?.message];
  return messages.some(
    (message) => typeof message === "string" && SESSION_AUTH_MESSAGES.has(message),
  );
}

api.interceptors.request.use((config) => {
  const token = Cookies.get("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (useAuthStore.getState().user) {
    endClientSession("expired");
    throw new axios.CanceledError("The authenticated session has expired");
  }
  return config;
});

export function isSessionError(error: unknown): boolean {
  return axios.isCancel(error) || isAuthenticationFailure(error);
}

export function handleApiError(error: unknown): Promise<never> {
  if (isAuthenticationFailure(error)) {
    endClientSession("unauthorized");
  }
  return Promise.reject(error);
}

api.interceptors.response.use((response) => response, handleApiError);
