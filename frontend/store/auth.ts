import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/lib/types";
import api from "@/lib/api";

const ssrSafeStorage = createJSONStorage(() => ({
  getItem: (name: string) => (typeof window !== "undefined" ? localStorage.getItem(name) : null),
  setItem: (name: string, value: string) => { if (typeof window !== "undefined") localStorage.setItem(name, value); },
  removeItem: (name: string) => { if (typeof window !== "undefined") localStorage.removeItem(name); },
}));

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", data.access_token);
        set({ user: data.user, token: data.access_token });
      },

      register: async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        localStorage.setItem("token", data.access_token);
        set({ user: data.user, token: data.access_token });
      },

      setAuth: (user, token) => {
        localStorage.setItem("token", token);
        set({ user, token });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null });
      },

      isAdmin: () => get().user?.role === "admin",
    }),
    { name: "auth-storage", storage: ssrSafeStorage, partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
