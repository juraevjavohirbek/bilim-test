// getStore() site-wide bo‘lgani uchun yangi deploy ma’lumotlarni o‘chirmaydi.
// ETag sharti parallel o‘qituvchi o‘zgarishlarining yo‘qolishini oldini oladi.
async function modify(getStore, key, change) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const store = getStore();
    const current = await store.getWithMetadata(key, { type: "json", consistency: "strong" });
    if (current && !current.etag) throw new Error("Ombor ETag qaytarmadi; xavfsiz saqlashni bajarib bo‘lmadi.");
    const value = change(current?.data ?? null);
    const result = await store.setJSON(key, value, current ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
    if (result.modified) return value;
  }
  throw Object.assign(new Error("Ma’lumot boshqa joyda o‘zgaryapti. Qayta urinib ko‘ring."), { status: 409 });
}

export function createBlobStorage(getStore, seed, key = "data/tests.json") {
  async function load() {
    const store = getStore();
    const data = await store.get(key, { type: "json", consistency: "strong" });
    if (data !== null) return data;
    // Faqat birinchi ishga tushishda boshlang‘ich JSON ko‘chiriladi.
    await store.setJSON(key, seed, { onlyIfNew: true });
    const initialized = await store.get(key, { type: "json", consistency: "strong" });
    if (initialized === null) throw new Error("Savollar ombori ochilmadi.");
    return initialized;
  }
  return {
    load,
    async update(change) {
      await load();
      return modify(getStore, key, (data) => {
        if (data === null) throw new Error("Savollar ombori topilmadi.");
        change(data);
        return data;
      });
    },
  };
}

export function createBlobState(getStore) {
  return {
    get: (key) => getStore().get(key, { type: "json", consistency: "strong" }),
    set: (key, value) => getStore().setJSON(key, value),
    delete: (key) => getStore().delete(key),
    update: (key, change) => modify(getStore, key, change),
  };
}
