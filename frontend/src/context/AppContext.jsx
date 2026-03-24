import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe } from "../api/client";

const AppContext = createContext(null);

function readStoredUserId() {
  const v = localStorage.getItem("userId");
  return v ? Number(v) : null;
}

export function AppProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem("authToken"));
  const [email, setEmailState] = useState(() => localStorage.getItem("userEmail") || "");
  const [userId, setUserId] = useState(readStoredUserId);
  const [trimester, setTrimester] = useState(() => {
    const v = localStorage.getItem("trimester");
    return v ? Number(v) : 1;
  });
  const [profile, setProfile] = useState(() => {
    try {
      const raw = localStorage.getItem("healthProfile");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [safePoses, setSafePoses] = useState(() => {
    try {
      const raw = localStorage.getItem("safePoses");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  const setAuth = useCallback((accessToken, user) => {
    localStorage.setItem("authToken", accessToken);
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("userId", String(user.id));
    setTokenState(accessToken);
    setEmailState(user.email);
    setUserId(user.id);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("healthProfile");
    localStorage.removeItem("safePoses");
    setTokenState(null);
    setEmailState("");
    setUserId(null);
    setProfile(null);
    setSafePoses([]);
    setVideos([]);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("authToken");
    if (!t) return;
    let cancelled = false;
    fetchMe()
      .then((user) => {
        if (!cancelled) setAuth(t, user);
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [setAuth, logout]);

  const value = useMemo(
    () => ({
      token,
      email,
      isAuthenticated: Boolean(token),
      setAuth,
      logout,
      userId,
      setUserId: (id) => {
        setUserId(id);
        if (id == null) localStorage.removeItem("userId");
        else localStorage.setItem("userId", String(id));
      },
      trimester,
      setTrimester: (t) => {
        setTrimester(t);
        localStorage.setItem("trimester", String(t));
      },
      profile,
      setProfile: (p) => {
        setProfile(p);
        if (p) localStorage.setItem("healthProfile", JSON.stringify(p));
        else localStorage.removeItem("healthProfile");
      },
      safePoses,
      setSafePoses: (poses) => {
        setSafePoses(poses);
        localStorage.setItem("safePoses", JSON.stringify(poses));
      },
      videos,
      setVideos,
      loading,
      setLoading,
    }),
    [token, email, setAuth, logout, userId, trimester, profile, safePoses, videos, loading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
