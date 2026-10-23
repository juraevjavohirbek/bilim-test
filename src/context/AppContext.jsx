import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { AppContext } from "./context";

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [topics, setTopics] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async (signal) => {
    const [session, data] = await Promise.all([api("/session", { signal }), api("/tests", { signal })]);
    setUser(session.user);
    setTopics(data);
    setError("");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => refresh(controller.signal))
      .catch((err) => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setAuthLoading(false); });
    const onFocus = () => refresh(controller.signal).catch((err) => {
      if (err.name !== "AbortError") setError(err.message);
    });
    window.addEventListener("focus", onFocus);
    return () => { controller.abort(); window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  async function login(email, password) {
    const session = await api("/login", { method: "POST", body: { email, password } });
    setUser(session.user);
    setAuthLoading(false);
    await refresh();
  }

  async function logout() {
    await api("/logout", { method: "POST", body: {} });
    setUser(null);
    setTopics(null);
    await refresh();
  }

  async function mutate(path, method, body) {
    try {
      const data = await api(path, { method, body });
      setTopics(data);
      setError("");
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        setTopics(null);
        refresh().catch((error) => setError(error.message));
      }
      throw err;
    }
  }

  return <AppContext.Provider value={{ user, authLoading, topics, error, login, logout, mutate }}>{children}</AppContext.Provider>;
}

