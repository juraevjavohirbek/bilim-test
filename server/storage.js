import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { randomBytes } from "node:crypto";

export function createFileStorage(dataFile) {
  let queue = Promise.resolve();
  async function load() { return JSON.parse(await readFile(dataFile, "utf8")); }
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
