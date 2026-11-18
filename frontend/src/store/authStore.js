import { create } from "zustand";
import api from "../lib/axios";

const getCachedUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const cachedUser = getCachedUser();
const cachedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

const useAuthStore = create((set) => ({
  user: cachedUser,
  isAuthenticated: !!cachedUser && !!cachedToken,
  isLoading: true,

  checkAuth: async () => {
    try {
      const response = await api.get("/auth/validate");

      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // ONLY log out if the backend definitively rejected the token (401 Unauthorized)
      // Never log out on temporary network issues, database spin-ups, or 500 server errors
      const status = error.response?.status;
      if (status === 401) {
        console.warn("Session expired or token invalid (401). Clearing session.");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      } else {
        // Retain existing cached credentials to prevent unexpected logout on server blips
        console.warn("Validate check encountered server/network error:", error.message);
        const user = getCachedUser();
        const token = localStorage.getItem("token");
        set({
          user,
          isAuthenticated: !!user && !!token,
          isLoading: false,
        });
      }
    }
  },

  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    set({
      user: response.data.user,
      isAuthenticated: true,
      isLoading: false,
    });

    return response.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    set({ user });
  },
}));

export default useAuthStore;
