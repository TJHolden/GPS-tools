# Education by Geography

Live page: https://tjholden.github.io/education-lookup/

Educational attainment by congressional district, legislative district, county or city, from the Census Bureau, rolled into the GPS education groups (HS or less, Some college/Associate, 4-year, Grad, <Coll / Coll+ by gender).

Three views:
- **Voters** – citizens 18+ by education (ACS B29002) × the state's turnout rate by education (CPS Voting Supplement, 2024 or 2022).
- **Eligible voters** – citizens 18+ (ACS B29002).
- **All adults 25+** – ACS B15002.

`tests/live-check.mjs` runs on every push (GitHub Actions) against the live Census API and checks that the groups add up.
