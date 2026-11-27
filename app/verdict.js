// DealHound R2 — verdict scoring. One formula, applied the same way to
// every deal, from fields the builder actually verified (sale, usual,
// cross-store prices, brand, usual-price trust). Nothing here uses a price
// history, a 12-month low, or a 90-day average — none of those was measured.
//
// Score (0–80):
//   discount  0–30  min(30, round(pctOff * 0.6))   — how deep the cut is
//   savings   0–10  min(10, floor(dollarsSaved / 12)) — how much cash it saves
//   cross     0–20  3+ stores checked = 20, 2 stores = 14, 1 store = 6
//   brand     0–10  known brand = 10, lesser-known = 6
//   trust     0–10  usual confirmed by 2+ sources = 10, one source = 7,
//                   usual differs between sources = 4 (and flagged)
// The site states this formula in one line above the list.

export function pctOff(d) {
  if (!d.usual || d.usual <= d.sale) return 0;
  return Math.round((100 * (d.usual - d.sale)) / d.usual);
}

export function saveOf(d) {
  return Math.max(0, Math.round((d.usual - d.sale) * 100) / 100);
}

export function scoreOf(d) {
  const b = scoreBreakdown(d);
  return b.discount + b.savings + b.cross + b.brand + b.trust;
}

// The five components, exposed so the audit page can show the exact
// breakdown instead of recomputing it in the view.
export function scoreBreakdown(d) {
  const pct = pctOff(d);
  const discount = Math.min(30, Math.round(pct * 0.6));
  const savings = Math.min(10, Math.floor(saveOf(d) / 12));
  const n = (d.cross || []).length;
  const cross = n >= 3 ? 20 : n === 2 ? 14 : 6;
  const brand = d.tier === 'known' ? 10 : 6;
  const trust = d.trust === 'confirmed' ? 10 : d.trust === 'single' ? 7 : 4;
  return { discount, savings, cross, brand, trust, total: discount + savings + cross + brand + trust };
}

// Verdict tiers. A deal whose usual price disagrees between sources gets
// the doubtful-usual flag instead of a praise tier, however high it scores:
// the site would rather mark a shaky "usual" than pretend it is solid.
export function tierOf(d) {
  if (d.trust === 'differs') return 'doubtful';
  const s = scoreOf(d);
  if (s >= 80) return 'top';
  if (s >= 65) return 'strong';
  if (s >= 50) return 'good';
  if (s >= 35) return 'routine';
  return 'modest';
}

export const TIER_LABEL = {
  top: 'TOP DEAL',
  strong: 'STRONG DEAL',
  good: 'GOOD VALUE',
  routine: 'ROUTINE SALE',
  modest: 'MODEST CUT',
  doubtful: 'USUAL PRICE DOUBTFUL',
};

export const TIER_BLURB = {
  top: 'Deep cut, big cash saving, price confirmed at more than one store.',
  strong: 'A solid cut on a known brand, worth buying now.',
  good: 'A real saving, though not the deepest cut on the list.',
  routine: 'A normal sale price — fine, but nothing special.',
  modest: 'A small cut. Buy it if you wanted it anyway.',
  doubtful: 'The usual price does not agree between sources — we score it on the lowest trusted usual and flag it here.',
};

// "Only real deals" = hide the doubtful-usual tier (and nothing else).
export function isRealDeal(d) {
  return tierOf(d) !== 'doubtful';
}

export function cheapestStore(d) {
  const list = (d.cross || []).slice().sort((a, b) => a.price - b.price);
  return list.length ? list[0] : { store: d.store, price: d.sale };
}

// True when the price shown is the cheapest price we found for this
// product across the stores we checked (and we checked at least two):
// an honest "lowest" badge that needs no price history.
export function isLowestChecked(d) {
  const list = d.cross || [];
  if (list.length < 2) return false;
  return cheapestStore(d).store === d.store;
}

export function crossLine(d) {
  const list = (d.cross || []).slice().sort((a, b) => a.price - b.price);
  if (list.length <= 1) return 'Only checked at ' + d.store + '.';
  const best = list[0];
  const worst = list[list.length - 1];
  const gap = Math.round((worst.price - best.price) * 100) / 100;
  const parts = list.map((c) => c.store + ' ' + fmt$(c.price));
  if (gap <= 0.009) return parts.join(' · ') + ' — same price everywhere checked.';
  return parts.join(' · ') + ' — save ' + fmt$(gap) + ' at ' + best.store + '.';
}

export function fmt$(n) {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return '$—';
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}

export function fmtPct(d) {
  return pctOff(d) + '% off';
}

// Deals sorted the way the cover is sorted: score first, then dollars saved.
export function sortByScore(deals) {
  return deals.slice().sort((a, b) => {
    const s = scoreOf(b) - scoreOf(a);
    if (s !== 0) return s;
    return saveOf(b) - saveOf(a);
  });
}

export function auditStats(deals) {
  const scored = deals.map((d) => ({ d, s: scoreOf(d), t: tierOf(d) }));
  const total = deals.length;
  const multi = deals.filter((d) => (d.cross || []).length >= 2).length;
  const doubtful = scored.filter((x) => x.t === 'doubtful').length;
  const top = scored.filter((x) => x.t === 'top').length;
  const strong = scored.filter((x) => x.t === 'strong').length;
  const stores = [...new Set(deals.flatMap((d) => (d.cross || []).map((c) => c.store)))].length;
  const totalSave = Math.round(deals.reduce((a, d) => a + saveOf(d), 0));
  const avgPct = Math.round(deals.reduce((a, d) => a + pctOff(d), 0) / Math.max(1, total));
  const medPct = median(deals.map((d) => pctOff(d)));
  return { total, multi, doubtful, top, strong, stores, totalSave, avgPct, medPct };
}

function median(xs) {
  const s = xs.slice().sort((a, b) => a - b);
  if (!s.length) return 0;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}
