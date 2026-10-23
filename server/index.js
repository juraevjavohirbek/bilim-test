import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createApiHandler } from "./api.js";
import { createFileStorage } from "./storage.js";
import { loadTeachers } from "./teachers.js";

const defaultDataFile = fileURLToPath(new URL("../data/tests.json", import.meta.url));

// Bu entry faqat mahalliy serverga tegishli; Netlify uni import qilmaydi.
function localTeachers() {
  const configured = loadTeachers();
  if (configured.length) return configured;
  try {
    return JSON.parse(readFileSync(new URL("./teachers.local.json", import.meta.url), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export function createApiServer({ dataFile = defaultDataFile, accounts = localTeachers(), ...options } = {}) {
  return createServer(createApiHandler({ storage: createFileStorage(dataFile), accounts, ...options }));
}

export async function startApi(port = 3001) {
  const server = createApiServer();
  await new Promise((ready, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", ready);
  });
  console.log(`BilimTest API: http://127.0.0.1:${server.address().port}`);
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startApi(Number(process.env.API_PORT || 3001)).catch((error) => {
    console.error("Server ochilmadi:", error.message);
    process.exitCode = 1;
  });
}
