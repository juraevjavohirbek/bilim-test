import { readFile, writeFile, rename, unlink, link } from "node:fs/promises";
import { randomBytes } from "node:crypto";

export function createFileStorage(dataFile, seed) {
  let queue = Promise.resolve();
  async function load() {
    try { return JSON.parse(await readFile(dataFile, "utf8")); }
    catch (error) {
      if (error.code !== "ENOENT" || seed === undefined) throw error;
      const temporary = `${dataFile}.${randomBytes(6).toString("hex")}.tmp`;
      try {
        await writeFile(temporary, `${JSON.stringify(seed, null, 2)}\n`, { flag: "wx" });
        await link(temporary, dataFile).catch((error) => { if (error.code !== "EEXIST") throw error; });
      } finally { await unlink(temporary).catch(() => {}); }
      return JSON.parse(await readFile(dataFile, "utf8"));
    }
  }
  return {
    load,
    update(change) {
      const task = queue.then(async () => {
        const data = await load();
        change(data);
        const temporary = `${dataFile}.${randomBytes(6).toString("hex")}.tmp`;
        try {
          await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, { flag: "wx" });
          await rename(temporary, dataFile);
        } finally { await unlink(temporary).catch(() => {}); }
        return data;
      });
      queue = task.catch(() => {});
      return task;
    },
  };
}

export function createMemoryState() {
  const values = new Map();
  return {
    async get(key) { return structuredClone(values.get(key) ?? null); },
    async set(key, value) { values.set(key, structuredClone(value)); },
    async delete(key) { values.delete(key); },
    async update(key, change) {
      const value = change(structuredClone(values.get(key) ?? null));
      values.set(key, structuredClone(value));
      return value;
    },
  };
}
