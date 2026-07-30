// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getApiUrl } from "../utils/api";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { sendPasswordReset, signOutUser } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  // true once /auth/me background refresh is done (or confirmed not needed)
  const [userRefreshed, setUserRefreshed] = useState(false);

  // Ref to ensure we only finalize startup once (prevents double-fire from onAuthStateChanged)
  const initializedRef = useRef(false);

  // ─── CLEAN LOGOUT (internal helper) ───────────────────────────────────────
  const performLogout = useCallback(() => {
    signOutUser().catch((err) => console.warn("[Auth] Firebase SignOut error:", err));
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setFirebaseUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  // ─── STARTUP AUTH INITIALIZATION ──────────────────────────────────────────
  useEffect(() => {
    let unsubscribe = null;

    // Helper to check if a token string is actually corrupted
    const isTokenCorrupted = (t) => !t || t === "null" || t === "undefined" || t === "NaN" || t.trim() === "" || t === "[object Object]" || t.split('.').length !== 3;

    // Safety timeout: if Firebase never fires onAuthStateChanged (offline / cold start),
    // release the loading gate after 6 seconds so the app is never permanently stuck.
    const safetyTimer = setTimeout(() => {
      if (!initializedRef.current) {
        console.warn("[Auth] onAuthStateChanged never fired. Releasing loading gate via safety timeout.");

        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser && !isTokenCorrupted(storedToken)) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);
            setIsAuthenticated(true);
            console.log("[Auth] Safety timeout: restored session from localStorage.");
          } catch (e) {
            console.error("[Auth] Safety timeout: failed to parse cached user.", e);
            performLogout();
          }
        } else {
          if (storedToken && isTokenCorrupted(storedToken)) {
            console.warn(`[Auth] Safety timeout: found corrupted token '${storedToken}'. Wiping local storage.`);
            performLogout();
          }
          setIsAuthenticated(false);
        }

        initializedRef.current = true;
        setLoading(false);
        setIsInitialized(true);
        // Safety path: no background call will run, mark user as fresh immediately
        setUserRefreshed(true);
      }
    }, 6000);

    const initAuth = () => {
      let storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (isTokenCorrupted(storedToken)) {
        if (storedToken) {
          console.warn(`[Auth] Startup: found corrupted token '${storedToken}'. Wiping local storage.`);
          performLogout();
        }
        storedToken = null;
      }

      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        // If safety timeout already resolved, ignore subsequent Firebase events
        if (initializedRef.current) {
          return;
        }

        try {
          if (fbUser && !fbUser.isAnonymous) {
            // ── FIREBASE USER IS AUTHENTICATED (Google SSO path) ──────────────
            if (storedToken && storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                setUser({
                  ...parsedUser,
                  uid: fbUser.uid,
                  displayName:
                    fbUser.displayName ||
                    `${parsedUser.firstName} ${parsedUser.lastName}`,
                  email: fbUser.email || parsedUser.email,
                  photoURL: fbUser.photoURL || parsedUser.avatar,
                });
                setToken(storedToken);
                setIsAuthenticated(true);

                // Server-side verify the stored JWT even on Google sessions
                verifyTokenInBackground(storedToken);
              } catch (e) {
                console.error("[Auth] Failed to parse cached user data:", e);
                performLogout();
                setUserRefreshed(true);
              }
            } else {
              // Firebase has a user but no local JWT — sign out of Firebase cleanly
              console.warn("[Auth] Firebase user without matching JWT. Signing out Firebase.");
              signOutUser().catch(() => {});
              setIsAuthenticated(false);
              setUserRefreshed(true);
            }
          } else {
            // ── NO FIREBASE USER (email/password JWT path or logged out) ──────
            if (storedToken && storedUser) {
              // Restore from localStorage without touching Firebase auth
              try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setToken(storedToken);
                setIsAuthenticated(true);
                console.log("[Auth] Restored JWT session from localStorage.");

                // Verify token with backend in the background
                verifyTokenInBackground(storedToken);
              } catch (e) {
                console.error("[Auth] Failed to parse stored user:", e);
                performLogout();
                setUserRefreshed(true);
              }
            } else {
              setIsAuthenticated(false);
              setUserRefreshed(true);
            }
          }
        } catch (unexpectedError) {
          console.error("[Auth] Unexpected error during auth initialization:", unexpectedError);
          performLogout();
        } finally {
          initializedRef.current = true;
          clearTimeout(safetyTimer);
          setLoading(false);
          setIsInitialized(true);
        }
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  // ─── LISTEN FOR auth:expired EVENT (dispatched by fetch interceptor) ──────
  useEffect(() => {
    const handleAuthExpired = () => {
      console.warn("[Auth] auth:expired event received. Forcing logout.");
      performLogout();
    };
    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, [performLogout]);

  // ─── BACKGROUND TOKEN VERIFICATION ────────────────────────────────────────
  // Verifies stored JWT with backend silently. Forces logout on 401/404.
  // Does NOT block startup — runs after loading is already released.
  const verifyTokenInBackground = useCallback(async (storedToken) => {
    try {
      const res = await fetch(getApiUrl("auth/me"), {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.status === 401 || res.status === 403 || res.status === 404) {
        console.warn("[Auth] Background token verification failed (status:", res.status, "). Logging out.");
        performLogout();
        setUserRefreshed(true);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          localStorage.setItem("user", JSON.stringify(data.user));
          console.log("[Auth] Background token verified. User refreshed.");
        }
      }
    } catch (err) {
      // Network failure — keep cached session, do not force logout
      console.warn("[Auth] Background token verification network error (offline?). Keeping cache:", err.message);
    } finally {
      setUserRefreshed(true);
    }
  }, [performLogout]);

  // ─── REFRESH USER DATA ────────────────────────────────────────────────────
  const refreshUserData = useCallback(async () => {
    const storedToken = localStorage.getItem("token") || token;
    if (!storedToken) return null;

    try {
      const res = await fetch(getApiUrl("auth/me"), {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.status === 401 || res.status === 403) {
        console.warn("[Auth] refreshUserData: token rejected (status:", res.status, "). Logging out.");
        performLogout();
        return null;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          window.dispatchEvent(new CustomEvent("userUpdated", { detail: data.user }));
          return data.user;
        }
      }

      return null;
    } catch (err) {
      console.error("[Auth] refreshUserData failed (network error):", err);
      return null;
    }
  }, [token, performLogout]);

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  const handleLogin = useCallback((userData, userToken) => {
    if (!userToken || userToken === "null" || userToken === "undefined" || userToken === "NaN" || userToken === "[object Object]" || userToken.trim() === "" || userToken.split('.').length !== 3) {
      console.error("[Auth] handleLogin: Refusing to store corrupted/invalid token:", userToken);
      return;
    }

    // Synchronous — state is committed immediately.
    setUser((prev) => {
      const merged = (prev && prev.email === userData.email) ? { ...prev, ...userData } : userData;
      localStorage.setItem("user", JSON.stringify(merged));
      return merged;
    });
    setToken(userToken);
    setIsAuthenticated(true);
    localStorage.setItem("token", userToken);
    console.log("[Auth] handleLogin: session committed for", userData.email);
  }, []);

  // ─── LOGOUT ────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    performLogout();
  }, [performLogout]);

  // ─── UPDATE USER ───────────────────────────────────────────────────────────
  const handleUpdateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  const contextValue = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    loading,
    isInitialized,
    firebaseUser,
    userRefreshed,
    login: handleLogin,
    logout: handleLogout,
    updateUser: handleUpdateUser,
    refreshUserData,
    sendPasswordReset,
  }), [
    user,
    token,
    isAuthenticated,
    loading,
    isInitialized,
    firebaseUser,
    userRefreshed,
    handleLogin,
    handleLogout,
    handleUpdateUser,
    refreshUserData
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
