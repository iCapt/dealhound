# DealHound — Black Friday deals that are actually deals

A one-page static site that lists 75 Black Friday deals and scores each one
0–95, so the best deals lead and the fake ones get flagged instead of
promoted.

## What it does

- **Verdict score (0–95) per deal.** Discount depth (≤30) + dollars saved
  (≤25) + cross-store check (≤20) + brand (≤10) + usual-price trust (≤10).
  The list is sorted by this score, not by raw % off — so a $1,300 TV
  saving and a $100 AirPods saving are judged on the same scale, and a
  generic product at "−89%" does not outrank a real branded deal.
- **Cross-store prices on every card and on every audit page.** Where the
  same product was listed at more than one store, every price found is
  shown. Most products cost the same at every store (MAP pricing), so the
  cross-store check mostly confirms the price is real — the site says that
  plainly instead of pretending it found arbitrage.
- **Verdict tiers, including a doubtful-usual flag.** TOP DEAL (≥80),
  STRONG DEAL (65–79), GOOD VALUE (50–64), ROUTINE SALE (35–49), MODEST
  CUT (<35), and USUAL PRICE DOUBTFUL when two sources disagree about the
  usual price. A "Only real deals" filter hides the doubtful ones.
- **Every deal page is an audit page.** Sale + usual + % + dollars saved,
  the subtraction shown as a line ("the math"), a cross-store table with a
  "buy at the cheapest checked" button, a verification box (store, time
  checked, source read, evidence sentence), and a row of similar deals.
- **Two tools.** A Top 10 list (rank + total price + total saved) and a
  compare view (up to three deals side by side).
- **Filters with counts.** Category, verdict, minimum discount, and store
  chips, each showing how many deals it matches; active filters can be
  removed one by one or cleared all at once. Search and four sort orders.

## How the prices were checked

Every price was read on Friday 28 November 2026 (WITA) from a named
source: The Verge's Apple deals page, Popular Science's best Black Friday
deals, WIRED's best Black Friday deals, CNN Underscored's LEGO and Dyson
deal pages, and Yahoo Shopping's kitchen deals. A deal is listed only if a
real usual price was shown next to the sale price. If two sources disagreed
about the usual price, the deal is flagged and scored on the lowest trusted
usual. **No 12-month price history and no 90-day average is shown anywhere
on this site, because none was measured.**

## Run it

```
node serve.ts            # preview at http://127.0.0.1:8080/
MAKEFUN_OUTPUT_DIR=out node main.ts   # build: out/app/, out/screenshots/, out/dossier.json
```

Static site, no network, no storage, no cookies. The hash routes are
`#/`, `#/deal/<id>`, `#/top10`, `#/compare`; filter state lives in the hash.

## Files

```
app/
  index.html   page shell
  data.js      75 deals, each with sale, usual, cross-store prices, source, trust
  verdict.js   score formula + tiers + audit stats
  filters.js   hash state, filter application, chip counts
  views.js     cards, audit detail page, Top 10, compare
  main.js      router + event wiring
  style.css    dark green + cream
main.ts        build entry (copies app/ + screenshots/, writes dossier.json)
serve.ts       local preview server
screenshots/  4 screenshots (cover, filter, detail, phone)
LICENSE        MIT
```
