export async function api(path, { method = "GET", body, ...options } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, credentials: "same-origin", cache: "no-store", ...options,
      ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Serverga ulanib bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) {
    const error = new Error(data?.error ?? "Serverdan ma’lumot kelmadi. Sahifani yangilab, qayta urinib ko‘ring.");
    error.status = response.status;
    throw error;
  }
  return data;
}
