import { create } from "zustand";
import { IS_DEMO, isDemoToken, makeDemoAdmin } from "../lib/demoMode";

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
  // ── Restore session from localStorage (sync) ───────────────────────────────
  const savedToken =
    localStorage.getItem("adminToken") || localStorage.getItem("admin_token");
  const savedProfile = localStorage.getItem("admin_profile");

  let parsedAdmin: Admin | null = null;

  // In real mode (IS_DEMO === false), if token is a demo token, clear it so user authenticates with real backend
  if (!IS_DEMO && savedToken && isDemoToken(savedToken)) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_profile");
    console.info("[AuthStore] Discarded demo session token for real backend authentication.");
  } else if (savedToken && isDemoToken(savedToken)) {
    if (savedProfile) {
      try {
        parsedAdmin = JSON.parse(savedProfile);
      } catch {
        localStorage.removeItem("admin_profile");
      }
    }

    // If profile missing but token is demo, recreate a sensible demo profile
    if (!parsedAdmin) {
      const email =
        savedToken.replace(/^demo_admin_token_[a-z0-9]+_[a-z0-9]+_/, "") ||
        "demo@traveloop.com";
      parsedAdmin = makeDemoAdmin(email) as Admin;
      localStorage.setItem("admin_profile", JSON.stringify(parsedAdmin));
    }

    console.info("[DemoMode] Demo session restored from localStorage.");
  }
  // Case 2: Real token
  else if (savedToken && savedProfile) {
    try {
      parsedAdmin = JSON.parse(savedProfile);
    } catch {
      localStorage.removeItem("admin_profile");
    }
  }

  const isAuth = !!savedToken && (IS_DEMO || !isDemoToken(savedToken)) && !!parsedAdmin;

  return {
    token: savedToken,
    admin: parsedAdmin,
    isAuthenticated: isAuth,

    setAuth: (token, admin) => {
      localStorage.setItem("admin_token", token);
      localStorage.setItem("adminToken", token);
      localStorage.setItem("admin_profile", JSON.stringify(admin));

      if (isDemoToken(token)) {
        console.info(`[DemoMode] Demo session established for ${admin.email}`);
      }

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
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin_profile");
      set({ token: null, admin: null, isAuthenticated: false });
      console.info("[Auth] Session cleared — redirecting to /login");
    },
  };
});
