import { create } from "zustand";

interface Admin {
  id: string;
  email: string;
  displayName: string;
  role: "Super Admin" | "Finance Admin" | "Support Admin" | "Operations Admin";
  twoFactorEnabled: boolean;
}

interface AuthState {
  token: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  setAuth: (token: string, admin: Admin) => void;
  updateAdminRole: (role: Admin["role"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem("admin_token");
  const savedProfile = localStorage.getItem("admin_profile");

  let parsedAdmin: Admin | null = null;
  if (savedProfile) {
    try {
      parsedAdmin = JSON.parse(savedProfile);
    } catch {
      localStorage.removeItem("admin_profile");
    }
  }

  const hasValidSession = !!savedToken && !!parsedAdmin;

  return {
    token: savedToken,
    admin: parsedAdmin,
    isAuthenticated: hasValidSession,

    setAuth: (token, admin) => {
      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_profile", JSON.stringify(admin));
      set({ token, admin, isAuthenticated: true });
    },

    updateAdminRole: (role) => {
      set((state) => {
        if (!state.admin) return state;
        const updated = { ...state.admin, role };
        localStorage.setItem("admin_profile", JSON.stringify(updated));
        return { admin: updated };
      });
    },

    logout: () => {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_profile");
      set({ token: null, admin: null, isAuthenticated: false });
    },
  };
});
