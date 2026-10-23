import { getStore } from "@netlify/blobs";
import seed from "../../data/tests.json" with { type: "json" };
import { createNetlifyApi } from "../../server/netlify-api.js";
import { loadTeachers } from "../../server/teachers.js";

let api;

export default async function handler(request, context) {
  try {
    api ??= createNetlifyApi({
      getStore: () => getStore({ name: "bilimtest", consistency: "strong" }),
      seed,
      accounts: loadTeachers(),
    });
    return await api(request, context);
  } catch (error) {
    console.error("Netlify API ochilmadi:", error.message);
    return Response.json({ error: "Server sozlamalarini tekshiring. Keyinroq qayta urinib ko‘ring." }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
