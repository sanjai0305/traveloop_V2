export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Finance Admin" | "Support Admin" | "Operations Admin";
  displayName?: string;
  twoFactorEnabled?: boolean;
}

export const MOCK_ADMIN_USER: AdminUser = {
  id: "admin_001",
  name: "Traveloop Administrator",
  displayName: "Traveloop Administrator",
  email: "admin@traveloop.ai",
  role: "Super Admin",
  twoFactorEnabled: false,
};

export const MOCK_TOKEN = "mock_admin_token_001_traveloop_demo";

export const mockAuth = {
  login: (email?: string, password?: string): { success: boolean; user: AdminUser; token: string } => {
    const userEmail = email?.trim() || MOCK_ADMIN_USER.email;
    const user: AdminUser = {
      ...MOCK_ADMIN_USER,
      email: userEmail,
    };

    localStorage.setItem("isAdminLoggedIn", "true");
    localStorage.setItem("adminToken", MOCK_TOKEN);
    localStorage.setItem("admin_token", MOCK_TOKEN);
    localStorage.setItem("adminUser", JSON.stringify(user));
    localStorage.setItem("admin_profile", JSON.stringify(user));

    return {
      success: true,
      user,
      token: MOCK_TOKEN,
    };
  },

  logout: (): void => {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("admin_profile");
  },

  getCurrentUser: (): AdminUser | null => {
    const savedUser = localStorage.getItem("adminUser") || localStorage.getItem("admin_profile");
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser) as AdminUser;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
    const hasToken = !!(localStorage.getItem("adminToken") || localStorage.getItem("admin_token"));
    return isLoggedIn || hasToken;
  },
};

export default mockAuth;
