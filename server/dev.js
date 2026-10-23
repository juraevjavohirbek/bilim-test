import { createServer } from "vite";
import { startApi } from "./index.js";

let api;
let vite;
try {
  api = await startApi();
  vite = await createServer();
  await vite.listen();
  vite.printUrls();
} catch (error) {
  console.error("Loyihani ishga tushirib bo‘lmadi:", error.message);
  api?.close();
  process.exitCode = 1;
}

async function stop() {
  await vite?.close();
  api?.close();
  process.exit();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
