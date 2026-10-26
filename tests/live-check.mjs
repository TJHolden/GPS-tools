// Loads the page against the live Census API and checks the math.
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const page_url = pathToFileURL(resolve("index.html")).href;
const cases = [
  { state: "26", geo: "cd", pop: "voters" },   // Michigan CDs, voters
  { state: "16", geo: "county", pop: "eligible" }, // Idaho counties, eligible
  { state: "06", geo: "sldl", pop: "adults" },  // California State House, adults 25+
];
const browser = await chromium.launch();
let failed = 0;
for (const c of cases) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((c) => {
    localStorage.setItem("edu.state", c.state);
    localStorage.setItem("edu.geo2", c.geo);
    localStorage.setItem("edu.pop", c.pop);
  }, c);
  await page.goto(page_url);
  await page.waitForFunction(() => /Loaded|Census|reach/.test(document.getElementById("status").textContent), null, { timeout: 60000 });
  const res = await page.evaluate(() => {
    const status = document.getElementById("status").textContent;
    const bad = [];
    const check = (name, r) => {
      const groups = r.hsLess + r.scA + r.bach + r.grad;
      if (Math.abs(groups - 1) > 1e-6) bad.push(`${name}: groups sum ${groups}`);
      if (Math.abs(r.coll - (r.bach + r.grad)) > 1e-9) bad.push(`${name}: Coll+ != 4-year + grad`);
      if (Math.abs(r.ltColl + r.coll - 1) > 1e-6) bad.push(`${name}: <Coll + Coll+ != 100%`);
      if (Math.abs(r.mLt + r.fLt - r.ltColl) > 1e-6 || Math.abs(r.mGe + r.fGe - r.coll) > 1e-6) bad.push(`${name}: gender cells don't add up`);
      if (!(r.total > 0)) bad.push(`${name}: zero total`);
    };
    // eslint-disable-next-line no-undef
    check("statewide", rollup(stateRow.t));
    // eslint-disable-next-line no-undef
    for (const u of units) check(u.name, u.r);
    // eslint-disable-next-line no-undef
    return { status, n: units.length, coll: rollup(stateRow.t).coll, bad: bad.slice(0, 10), err: document.getElementById("status").classList.contains("err") };
  }).catch((e) => ({ status: "evaluate failed: " + e.message, bad: ["page did not load data"], err: true }));
  const ok = !res.err && res.n > 0 && res.bad.length === 0 && errors.length === 0;
  console.log(`${ok ? "PASS" : "FAIL"} ${c.state}/${c.geo}/${c.pop}: ${res.status}${res.coll != null ? ` | statewide Coll+ ${(res.coll * 100).toFixed(1)}%` : ""}`);
  for (const b of [...res.bad, ...errors]) console.log("   - " + b);
  if (!ok) failed++;
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
