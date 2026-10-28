import { Readable } from "node:stream";
import { createApiHandler } from "./api.js";
import { createBlobStorage, createBlobState } from "./blob-storage.js";
import { matchingSeed as defaultMatchingSeed } from "./matching-seed.js";
import crosswordSeed from "../src/data/crosswords.json" with { type: "json" };

// Netlify Fetch Request -> mahalliy server ham ishlatadigan API.
// HTTP port ochilmaydi; so‘rov bitta serverless function ichida bajariladi.
export function createNetlifyApi({ getStore, seed, matchingSeed = defaultMatchingSeed, accounts, secureCookies = true }) {
  const handler = createApiHandler({
    accounts,
    storage: createBlobStorage(getStore, seed),
    matchingStorage: createBlobStorage(getStore, matchingSeed, "data/matching.json"),
    crosswordStorage: createBlobStorage(getStore, crosswordSeed, "data/crosswords.json"),
    state: createBlobState(getStore),
    secureCookies,
  });
  return async (request, context = {}) => {
    const url = new URL(request.url);
    const incoming = request.body ? Readable.fromWeb(request.body) : Readable.from([]);
    incoming.method = request.method;
    incoming.url = url.pathname.replace(/^\/\.netlify\/functions\/api(?=\/|$)/, "/api") + url.search;
    incoming.headers = Object.fromEntries(request.headers);
    incoming.socket = { remoteAddress: context.ip || "unknown" };
    incoming.trustedOrigin = url.origin;
    const headers = new Headers();
    let result;
    let statusCode = 200;
    const outgoing = {
      setHeader(name, value) { headers.set(name, value); },
      writeHead(status, values) {
        statusCode = status;
        for (const [name, value] of Object.entries(values)) headers.set(name, value);
      },
      end(body) { result = new Response(body, { status: statusCode, headers }); },
    };
    await handler(incoming, outgoing);
    return result;
  };
}
