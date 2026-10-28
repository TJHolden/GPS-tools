// Verify the All adults 18+ view (B15001) against live Census data and the published S1501 table.
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const KEY = "2ef2695ee4ba271321f9a5d5147dd83a509d7736";
const out = []; const log = (...a) => { const s = a.join(" "); console.log(s); out.push(s); };
const get = async (u) => { const r = await fetch(u + "&key=" + KEY); const t = await r.text(); if (!r.ok) throw new Error(r.status + " " + t.slice(0, 200)); return JSON.parse(t); };
try {
  const g = await (await fetch("https://api.census.gov/data/2024/acs/acs5/groups/B15001.json")).json();
  const lab = n => g.variables[`B15001_${String(n).padStart(3, "0")}E`]?.label;
  const used = { lessHS: [4,5,12,13,20,21,28,29,36,37,45,46,53,54,61,62,69,70,77,78], hs: [6,14,22,30,38,47,55,63,71,79], sc: [7,15,23,31,39,48,56,64,72,80], assoc: [8,16,24,32,40,49,57,65,73,81], bach: [9,17,25,33,41,50,58,66,74,82], grad: [10,18,26,34,42,51,59,67,75,83] };
  log("== B15001 labels used for each group");
  for (const [k, ns] of Object.entries(used)) for (const n of ns) log(k.padEnd(7), n, "|", lab(n));
  log("002 |", lab(2), "   043 |", lab(43), "   001 |", lab(1));
  const s = await get("https://api.census.gov/data/2024/acs/acs5/subject?get=NAME,S1501_C01_001E,S1501_C01_005E,S1501_C01_006E,S1501_C01_015E&for=state:26,16,06");
  const pub = {}; for (const r of s.slice(1)) pub[r[0]] = (+r[2] + +r[4]) / (+r[1] + +r[3]);
  const browser = await chromium.launch();
  log("\n== All adults 18+ Coll+: tool page vs published S1501 (18-24 BA+ plus 25+ BA+)");
  for (const [st, name] of [["26", "Michigan"], ["16", "Idaho"], ["06", "California"]]) {
    const p = await browser.newPage();
    await p.addInitScript(st => { localStorage.setItem("edu.state", st); localStorage.setItem("edu.geo2", "county"); localStorage.setItem("edu.pop", "adults"); }, st);
    await p.goto(pathToFileURL(resolve("education/index.html")).href);
    await p.waitForFunction(() => /Loaded|reach|Census/.test(document.getElementById("status").textContent), null, { timeout: 60000 });
    const r = await p.evaluate(() => { const x = rollup(stateRow.t); return { coll: x.coll, total: x.total, status: document.getElementById("status").textContent }; });
    log(name, "tool", (100 * r.coll).toFixed(1) + "%", "published", (100 * pub[name]).toFixed(1) + "%", "| adults 18+:", Math.round(r.total));
    await p.close();
  }
  await browser.close();
} catch (e) { log("!! FAILED", e.message); }
writeFileSync("verify/results18.txt", out.join("\n") + "\n");
