import { create } from "zustand";
import { mockAuth, AdminUser, MOCK_ADMIN_USER, MOCK_TOKEN } from "../services/mockAuth";

interface AuthState {
  token: string | null;
  admin: AdminUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, admin: AdminUser) => void;
  updateAdminRole: (role: AdminUser["role"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Restore session synchronously from localStorage
  const isAuth = mockAuth.isAuthenticated();
  const currentUser = mockAuth.getCurrentUser() || (isAuth ? MOCK_ADMIN_USER : null);
  const token = isAuth ? (localStorage.getItem("adminToken") || MOCK_TOKEN) : null;

  return {
    token,
    admin: currentUser,
    isAuthenticated: isAuth,

    setAuth: (token, admin) => {
      localStorage.setItem("isAdminLoggedIn", "true");
      localStorage.setItem("adminToken", token);
      localStorage.setItem("admin_token", token);
      localStorage.setItem("adminUser", JSON.stringify(admin));
      localStorage.setItem("admin_profile", JSON.stringify(admin));

      set({ token, admin, isAuthenticated: true });
    },

    updateAdminRole: (role) => {
      set((state) => {
        if (!state.admin) return state;
        const updated = { ...state.admin, role };
        localStorage.setItem("adminUser", JSON.stringify(updated));
        localStorage.setItem("admin_profile", JSON.stringify(updated));
        return { admin: updated };
      });
    },

    logout: () => {
      mockAuth.logout();
      set({ token: null, admin: null, isAuthenticated: false });
    },
  };
});
