import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

export default function useMatching(path = "/matching") {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async (signal) => {
    const data = await api(path, { signal });
    setGroups(data); setError("");
  }, [path]);
  useEffect(() => {
    const controller = new AbortController();
    const load = () => refresh(controller.signal).catch((error) => {
      if (error.name !== "AbortError") setError(error.message);
    });
    void load();
    window.addEventListener("focus", load);
    return () => { controller.abort(); window.removeEventListener("focus", load); };
  }, [refresh]);

  async function save(body, editing) {
    const data = await api(path, { method: editing ? "PATCH" : "POST", body });
    setGroups(data); setError("");
    return data;
  }
  async function remove(id) {
    const data = await api(path, { method: "DELETE", body: { id } });
    setGroups(data); setError("");
  }
  return { groups, error, loading: groups === null && !error, save, remove };
}
