# Guidant Tools

Live: https://tjholden.github.io/GPS-tools/

- **Rim Weighting** (`weighting/`) – reads an SPSS .sav in the browser, builds rake schemes, writes SPSSINC RAKE syntax. Data never leaves the computer.
- **Education by Geography** (`education/`) – education mix by district, county or city: Voters (ACS B29002 × CPS Voting Supplement turnout by education), Registered voters (ACS B29002 × CPS registration rate by education), Eligible voters (ACS B29002), All adults 18+ (ACS B15001). Picks up new CPS and ACS releases automatically.

`tests/live-check.mjs` runs on every push and every Monday (GitHub Actions): Education is checked against the live Census API; the other pages must load without script errors.
