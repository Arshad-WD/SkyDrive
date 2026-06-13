import { create } from "zustand";

interface User {
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, email: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (token, email) => {
    localStorage.setItem("skydrive_token", token);
    document.cookie = `skydrive_token=${token}; path=/; max-age=86400; SameSite=Strict`;
    
    // Derive name from email if not already present
    const namePart = email.split("@")[0];
    const derivedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    
    const user = {
      name: localStorage.getItem("skydrive_username") || derivedName,
      email,
    };
    
    localStorage.setItem("skydrive_user", JSON.stringify(user));
    
    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    localStorage.removeItem("skydrive_token");
    localStorage.removeItem("skydrive_user");
    localStorage.removeItem("skydrive_username");
    document.cookie = "skydrive_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initialize: () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("skydrive_token");
    const userJson = localStorage.getItem("skydrive_user");

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem("skydrive_token");
        localStorage.removeItem("skydrive_user");
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
