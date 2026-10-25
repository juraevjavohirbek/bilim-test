import { mkdir, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { subjectThemes } from "../src/lib/subjectThemes.js";

// Bir xil fan bezaklaridan uchta alohida background-image fayli yaratiladi.
const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { SubjectArt } = await vite.ssrLoadModule("/src/components/LearningBackdrop.jsx");
  const directory = new URL("../src/assets/subject-backgrounds/", import.meta.url);
  await mkdir(directory, { recursive: true });
  for (const theme of Object.values(subjectThemes)) {
    for (let variant = 0; variant < 3; variant++) {
      const art = renderToStaticMarkup(createElement(SubjectArt, { theme, variant }))
        .replace('<svg ', '<svg width="480" height="620" ');
      const paper = [theme.paper, "#fff7e6", "#fff0f2"][variant];
      const positions = [
        { x: 1005, y: 80, rotation: -8, smallX: -130, smallY: 640 },
        { x: -115, y: -80, rotation: 12, smallX: 1220, smallY: 520 },
        { x: 1050, y: -140, rotation: 9, smallX: -160, smallY: 570 },
      ][variant];
      const lines = theme.key === "math" || theme.key === "physics" || theme.key === "computing"
        ? '<path d="M0 0H44V44" fill="none" stroke="currentColor" stroke-width="1"/>'
        : theme.key === "language" || theme.key === "english"
          ? '<path d="M0 43H44" stroke="currentColor" stroke-width="1"/>'
          : '<circle cx="3" cy="3" r="1.5" fill="currentColor"/>';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" style="color:${theme.color}">
<defs><linearGradient id="paper" x1="0" y1="0" x2="${variant === 1 ? 0 : 1}" y2="1"><stop stop-color="${paper}"/><stop offset="1" stop-color="${theme.paper}"/></linearGradient><pattern id="notebook" width="44" height="44" patternUnits="userSpaceOnUse">${lines}</pattern></defs>
<rect width="1600" height="1000" fill="url(#paper)"/><rect width="1600" height="1000" fill="url(#notebook)" opacity=".09"/>
<g transform="translate(${positions.x} ${positions.y}) rotate(${positions.rotation} 240 310)" opacity=".65">${art}</g>
<g transform="translate(${positions.smallX} ${positions.smallY}) scale(.7) rotate(-18 240 310)" opacity=".4">${art.replaceAll('id="school-', 'id="small-school-').replaceAll('href="#school-', 'href="#small-school-')}</g>
<circle cx="${variant === 1 ? 1280 : 280}" cy="${variant === 2 ? 160 : 780}" r="160" fill="${theme.color}" opacity=".035"/>
</svg>`;
      await writeFile(new URL(`${theme.key}-${variant}.svg`, directory), svg);
    }
  }
  console.log("Created 30 subject background images.");
} finally { await vite.close(); }
