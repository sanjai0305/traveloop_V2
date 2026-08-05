import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { MainLayout } from "./components/layout/MainLayout";
import { Auth } from "./pages/Auth";
import { VerifyOtp } from "./pages/VerifyOtp";
import { Dashboard } from "./pages/Dashboard";
import { Agents } from "./pages/Agents";
import { Trips } from "./pages/Trips";
import { Bookings } from "./pages/Bookings";
import { Finance } from "./pages/Finance";
import { Settings } from "./pages/Settings";
import { Notifications } from "./pages/Notifications";
import { Referrals } from "./pages/Referrals";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, admin } = useAuthStore();
  const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";

  if (!isAdminLoggedIn && !isAuthenticated) {
    console.log("[ProtectedRoute] Unauthenticated access attempt. Redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && admin) {
    const userRole = (admin.role || "").toLowerCase().trim();
    const isSuper = userRole === "super_admin" || userRole === "super admin" || userRole === "admin";
    
    if (!isSuper) {
      const hasPermission = allowedRoles.some((r) => r.toLowerCase().trim() === userRole);
      if (!hasPermission) {
        console.warn(`[ProtectedRoute] Role '${admin.role}' missing required permission in:`, allowedRoles);
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth route */}
        <Route path="/login" element={<Auth />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/admin/verify-otp" element={<VerifyOtp />} />

        {/* Protected dashboard and features */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/agents"
          element={
            <ProtectedRoute allowedRoles={["Super Admin", "Support Admin", "Operations Admin"]}>
              <MainLayout>
                <Agents />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/agents" element={<Navigate to="/agents" replace />} />
        <Route path="/admin/users" element={<Navigate to="/agents" replace />} />

        <Route
          path="/trips"
          element={
            <ProtectedRoute allowedRoles={["Super Admin", "Operations Admin"]}>
              <MainLayout>
                <Trips />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/trips" element={<Navigate to="/trips" replace />} />

        <Route
          path="/bookings"
          element={
            <ProtectedRoute allowedRoles={["Super Admin", "Finance Admin"]}>
              <MainLayout>
                <Bookings />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/bookings" element={<Navigate to="/bookings" replace />} />

        <Route
          path="/finance"
          element={
            <ProtectedRoute allowedRoles={["Super Admin", "Finance Admin"]}>
              <MainLayout>
                <Finance />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/finance" element={<Navigate to="/finance" replace />} />
        <Route path="/admin/wallet" element={<Navigate to="/finance" replace />} />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Notifications />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/notifications" element={<Navigate to="/notifications" replace />} />

        <Route
          path="/referrals"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Referrals />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/referrals" element={<Navigate to="/referrals" replace />} />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/settings" element={<Navigate to="/settings" replace />} />

        {/* Catch-all */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
