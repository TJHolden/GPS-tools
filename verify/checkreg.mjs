// Pull the Census Bureau's published 2024 tables: Table 5 (education) and Table 4b (states).
import { writeFileSync } from "node:fs";
import XLSX from "xlsx";
const out = []; const log = (...a) => { const s = a.join(" "); console.log(s); out.push(s); };
const base = "https://www2.census.gov/programs-surveys/cps/tables/p20/587/";
for (const f of ["vote05_2024_1.xlsx", "vote04b_2024.xlsx"]) {
  try {
    const wb = XLSX.read(Buffer.from(await (await fetch(base + f)).arrayBuffer()));
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false });
    log(`\n== ${f}`);
    for (const r of rows) { const line = r.filter(x => x !== undefined && x !== null && x !== "").join(" | ");
      if (f.startsWith("vote05") ? !/^Margins/.test(line) : /^(Table|STATE|US|Michigan|MICHIGAN|Idaho|IDAHO|California|CALIFORNIA|Total|United)/i.test(line) || /Characteristics|registered/i.test(line)) log(line); }
  } catch (e) { log(`!! ${f}: ${e.message}`); }
}
writeFileSync("verify/resultsreg.txt", out.join("\n") + "\n");
