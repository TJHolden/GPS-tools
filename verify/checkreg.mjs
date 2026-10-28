// Verify the Registered voters view: CPS variable definitions, national registration by education
// (tool method) vs the Census Bureau's published 2024 table, and the live page in Registered view.
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import XLSX from "xlsx";
const KEY = "2ef2695ee4ba271321f9a5d5147dd83a509d7736";
const out = []; const log = (...a) => { const s = a.join(" "); console.log(s); out.push(s); };
const get = async (u) => { const r = await fetch(u + (u.includes("?") ? "&" : "?") + "key=" + KEY); const t = await r.text(); if (r.status === 204 || !t.trim()) return [[]]; if (!r.ok) throw new Error(r.status + " " + t.slice(0, 200)); return JSON.parse(t); };
const step = async (n, f) => { try { await f(); } catch (e) { log(`!! ${n} FAILED: ${e.message}`); } };
await step("published table", async () => {
  const idx = await (await fetch("https://www.census.gov/topics/public-sector/voting/data/tables.html")).text();
  const page = [...idx.matchAll(/href="([^"]*p20-5\d\d[^"]*\.html)"/g)].map(m => m[1]).find(u => /2024|58\d|59\d/.test(u));
  log("\n== Census tables page:", page);
  const html = await (await fetch(new URL(page, "https://www.census.gov").href)).text();
  const links = [...html.matchAll(/href="([^"]+\.xlsx)"/g)].map(m => new URL(m[1], "https://www.census.gov").href);
  log("xlsx links:", links.length); for (const l of links) log("  ", l);
  const t5 = links.find(l => /0?5[a-z]?\.xlsx$/i.test(l.split("/").pop()) && !/0?5[0-9]/.test(l.split("/").pop())) || links.find(l => /educ/i.test(l)); log("Table 5:", t5);
  const wb = XLSX.read(Buffer.from(await (await fetch(t5)).arrayBuffer()));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false });
  log("\n== Published Table 5 (first 40 rows)"); for (const r of rows.slice(0, 60)) log(r.filter(x => x !== undefined && x !== null && x !== "").join(" | "));
});
await step("page", async () => {
  const browser = await chromium.launch();
  for (const [st, name] of [["26", "Michigan"], ["16", "Idaho"]]) {
    const p = await browser.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.addInitScript(st => { localStorage.setItem("edu.state", st); localStorage.setItem("edu.geo2", "cd"); localStorage.setItem("edu.pop", "registered"); }, st);
    await p.goto(pathToFileURL(resolve("education/index.html")).href);
    await p.waitForFunction(() => /Loaded|reach|Census/.test(document.getElementById("status").textContent), null, { timeout: 90000 });
    const r = await p.evaluate(() => { const x = rollup(stateRow.t); return { status: document.getElementById("status").textContent, coll: x.coll, n: units.length, sums: units.every(u => Math.abs(u.r.ltColl + u.r.coll - 1) < 1e-9) }; });
    log(`\n${name} page: ${r.status} | statewide registered Coll+ ${(100 * r.coll).toFixed(1)}% | ${r.n} districts | groups add to 100%: ${r.sums} | errors: ${errs.length}`);
    await p.close();
  }
  await browser.close();
});
writeFileSync("verify/resultsreg.txt", out.join("\n") + "\n");
