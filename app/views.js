// DealHound R2 — views. Every number rendered here comes from data.js
// through verdict.js; nothing is hard-coded, nothing is invented.
// The detail view is an audit page, not a product page: the math is shown,
// the cross-store check is shown, and the verification box says exactly
// what was read and when.

import { DEALS, CHECKED } from './data.js';
import { scoreOf, tierOf, TIER_LABEL, TIER_BLURB, pctOff, saveOf, fmt$, cheapestStore, isLowestChecked, crossLine, sortByScore, scoreBreakdown } from './verdict.js';

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function dealById(id) {
  return DEALS.find((d) => d.id === id);
}

export function top10() {
  return sortByScore(DEALS).slice(0, 10);
}

export function top10Totals() {
  const list = top10();
  const totalPrice = Math.round(list.reduce((a, d) => a + d.sale, 0) * 100) / 100;
  const totalSave = Math.round(list.reduce((a, d) => a + saveOf(d), 0) * 100) / 100;
  return { list, totalPrice, totalSave };
}

// ---- card (used on the list, the Top 10 view, and the similar row) ----
// opts.compact (similar row) hides the evidence note and the cross line,
// so three cards fit in the space the audit page has left.
export function cardHTML(d, opts = {}) {
  const score = scoreOf(d);
  const tier = tierOf(d);
  const pct = pctOff(d);
  const save = saveOf(d);
  const best = cheapestStore(d);
  const inCompare = (opts.compare || []).includes(d.id);
  const compact = !!opts.compact;
  return `
<article class="card tier-${tier}" data-id="${esc(d.id)}">
  <div class="card-top">
    <span class="score" title="Verdict score ${score} out of 80">${score}<small>/80</small></span>
    <span class="verdict v-${tier}">${TIER_LABEL[tier]}</span>
    ${isLowestChecked(d) ? '<span class="lowest">Lowest checked</span>' : ''}
  </div>
  <h3 class="card-name"><a href="#/deal/${esc(d.id)}">${esc(d.name)}</a></h3>
  <p class="card-meta">${esc(d.brand)} · ${esc(d.cat)}</p>
  <div class="card-prices">
    <span class="sale">${fmt$(d.sale)}</span>
    <span class="usual"><s>${fmt$(d.usual)}</s></span>
    <span class="pct">−${pct}%</span>
    <span class="save">save ${fmt$(save)}</span>
  </div>
  ${compact ? '' : `<p class="card-cross">${esc(crossLine(d))}</p>
  <p class="card-note">${esc(d.note)}</p>`}
  <div class="card-actions">
    <a class="buy" href="${esc(d.url)}" target="_blank" rel="noopener">See it at ${esc(d.store)}</a>
    <a class="audit" href="#/deal/${esc(d.id)}">Audit →</a>
    <button class="cmp ${inCompare ? 'on' : ''}" data-compare="${esc(d.id)}" aria-pressed="${inCompare}">${inCompare ? '✓ Compare' : '+ Compare'}</button>
  </div>
  ${best.store !== d.store ? `<p class="card-cheapest">Cheapest checked: ${esc(best.store)} ${fmt$(best.price)}</p>` : ''}
</article>`;
}

// ---- audit stats bar ----
export function statsHTML(s) {
  return `
<div class="stats" role="status">
  <span><b>${s.total}</b> deals checked</span>
  <span><b>${s.multi}</b> with cross-store prices</span>
  <span><b>${s.top}</b> top deals · <b>${s.strong}</b> strong</span>
  <span><b>${s.doubtful}</b> usual price doubtful</span>
  <span><b>${fmt$(s.totalSave)}</b> saved if you bought one of each</span>
  <span>median <b>${s.medPct}%</b> off</span>
</div>`;
}

export const METHOD_LINE = 'Checked against a real usual price from a named source; compared at other stores where listed. Doubtful usual prices are flagged. No price history was measured.';

// ---- compact Top 10 strip above the grid ----
export function top10StripHTML() {
  const { list, totalPrice, totalSave } = top10Totals();
  const items = list.map((d, i) => `
    <a class="strip-item" href="#/deal/${esc(d.id)}">
      <span class="strip-rank">${i + 1}</span>
      <span class="strip-name">${esc(d.name)}</span>
      <span class="strip-score">${scoreOf(d)}</span>
      <span class="strip-save">save ${fmt$(saveOf(d))}</span>
    </a>`).join('');
  return `
<section class="strip" aria-label="Top 10 deals">
  <div class="strip-head">
    <h2>Top 10 deals</h2>
    <span class="strip-total">All 10: <b>${fmt$(totalPrice)}</b> · save <b>${fmt$(totalSave)}</b></span>
    <a class="strip-more" href="#/top10">Full list →</a>
  </div>
  <div class="strip-items">${items}</div>
</section>`;
}

// ---- filter chips with counts ----
export function chipsHTML(state, counts) {
  const chip = (key, id, label, n, active) =>
    `<button class="chip ${active ? 'on' : ''}" data-fkey="${key}" data-fval="${esc(String(id))}">${esc(label)} <span class="n">${n}</span></button>`;
  const catChips = counts.cats.map((c) => chip('cat', c.id, c.label, c.n, state.cat === c.id)).join('');
  const verdictChips = counts.verdicts.map((v) => chip('verdict', v.id, v.label, v.n, state.verdict === v.id)).join('');
  const minChips = counts.mins.map((m) => chip('min', m.id, m.label, m.n, state.min === m.id)).join('');
  const storeChips = counts.stores.map((s) => chip('store', s.id, s.label, s.n, state.store === s.id)).join('');
  return `
<div class="filters" role="group" aria-label="Filters">
  <div class="chip-row"><span class="chip-label">Category</span>${catChips}</div>
  <div class="chip-row"><span class="chip-label">Verdict</span>${verdictChips}</div>
  <div class="chip-row"><span class="chip-label">Cut &amp; store</span>
    <button class="chip real ${state.real ? 'on' : ''}" data-fkey="real" data-fval="1">Only real deals</button>${minChips}${storeChips}
  </div>
  <p class="score-formula">Score = discount (≤30) + dollars saved (≤10) + cross-store check (≤20) + brand (≤10) + usual-price trust (≤10) · max 80</p>
</div>`;
}

export function activeFiltersHTML(labels) {
  if (!labels.length) return '';
  const items = labels.map((l) => `<span class="active-filter">${esc(l.label)} <button data-clear="${esc(l.key)}" aria-label="Remove ${esc(l.label)}">×</button></span>`).join('');
  return `<div class="active-filters">${items}<button class="clear-all" data-clear="all">Clear all filters</button></div>`;
}

// ---- the audit detail page ----
export function detailHTML(d) {
  const score = scoreOf(d);
  const bd = scoreBreakdown(d);
  const tier = tierOf(d);
  const pct = pctOff(d);
  const save = saveOf(d);
  const best = cheapestStore(d);
  const crossRows = (d.cross || []).slice().sort((a, b) => a.price - b.price).map((c) => `
    <tr${c.store === best.store ? ' class="best-row"' : ''}>
      <td>${esc(c.store)}</td><td>${fmt$(c.price)}</td>
      <td>${c.price === best.price ? 'cheapest' : '+' + fmt$(Math.round((c.price - best.price) * 100) / 100)}</td>
    </tr>`).join('');
  const similar = sortByScore(DEALS.filter((x) => x.cat === d.cat && x.id !== d.id)).slice(0, 3);
  const similarHTML = similar.length
    ? `<section class="similar"><h2>Similar deals in ${esc(d.cat)}</h2><div class="grid grid-3">${similar.map((x) => cardHTML(x, { compact: true })).join('')}</div></section>`
    : '';
  const otherStore = best.store !== d.store;
  return `
<section class="detail">
  <a class="back" href="#/">← All deals</a>
  <div class="detail-head">
    <div>
      <span class="verdict v-${tier} big">${TIER_LABEL[tier]}</span>
      <h1>${esc(d.name)}</h1>
      <p class="detail-meta">${esc(d.brand)} · ${esc(d.cat)} · sold by ${esc(d.store)}</p>
      <p class="detail-blurb">${esc(TIER_BLURB[tier])}</p>
    </div>
    <div class="detail-score"><span class="score big">${score}<small>/80</small></span><span class="score-label">verdict score</span></div>
  </div>
  <div class="price-hero">
    <div class="ph"><span class="ph-label">Sale price</span><span class="ph-sale">${fmt$(d.sale)}</span></div>
    <div class="ph"><span class="ph-label">Usual price</span><span class="ph-usual"><s>${fmt$(d.usual)}</s></span></div>
    <div class="ph"><span class="ph-label">Cut</span><span class="ph-pct">−${pct}%</span></div>
    <div class="ph"><span class="ph-label">You save</span><span class="ph-save">${fmt$(save)}</span></div>
  </div>
  <p class="math">The math: ${fmt$(d.usual)} − ${fmt$(d.sale)} = <b>${fmt$(save)}</b> saved, which is ${pct}% off the usual price.</p>
  <div class="detail-cols">
    <div class="detail-col">
      <h2>Same product, other stores</h2>
      <table class="cross">
        <thead><tr><th>Store</th><th>Price</th><th>vs cheapest</th></tr></thead>
        <tbody>${crossRows}</tbody>
      </table>
      <p class="cross-note">${esc(crossLine(d))}</p>
      <a class="buy big" href="${esc(d.url)}" target="_blank" rel="noopener">Buy at the cheapest checked: ${esc(best.store)} ${fmt$(best.price)}</a>
      ${otherStore ? `<p class="buy-alt">Also listed at ${esc(d.store)} for ${fmt$(d.sale)} — the button above is the cheapest price we found.</p>` : ''}
    </div>
    <div class="detail-col">
      <h2>How we checked this deal</h2>
      <dl class="verify">
        <div><dt>Store</dt><dd>${esc(d.store)}</dd></div>
        <div><dt>Checked</dt><dd>${esc(CHECKED)}</dd></div>
        <div><dt>Source read</dt><dd>${esc(d.src)}</dd></div>
        <div><dt>Usual price</dt><dd>${d.trust === 'differs' ? 'Disputed — sources disagree (see note below).' : d.trust === 'confirmed' ? 'Confirmed by more than one source.' : 'From one source only.'}</dd></div>
        <div><dt>Evidence</dt><dd>${esc(d.note)}</dd></div>
        <div><dt>Score</dt><dd>${score}/80 — discount ${bd.discount} + savings ${bd.savings} + cross-store ${bd.cross} + brand ${bd.brand} + trust ${bd.trust}</dd></div>
      </dl>
      ${d.trust === 'differs' ? '<p class="flag-note">Flag: the usual price for this model does not agree between the sources we read, so we scored it on the lowest trusted usual and marked it doubtful. Treat the discount as unproven until the usual is confirmed.</p>' : ''}
    </div>
  </div>
  ${similarHTML}
</section>`;
}

// ---- Top 10 full view ----
export function top10ViewHTML() {
  const { list, totalPrice, totalSave } = top10Totals();
  const rows = list.map((d, i) => `
    <li class="top10-row">
      <span class="top10-rank">${i + 1}</span>
      <a class="top10-name" href="#/deal/${esc(d.id)}">${esc(d.name)}</a>
      <span class="top10-cat">${esc(d.cat)}</span>
      <span class="top10-score">${scoreOf(d)}/80</span>
      <span class="top10-price">${fmt$(d.sale)} <s>${fmt$(d.usual)}</s></span>
      <span class="top10-save">save ${fmt$(saveOf(d))}</span>
      <a class="buy small" href="${esc(d.url)}" target="_blank" rel="noopener">See it at ${esc(d.store)}</a>
    </li>`).join('');
  return `
<section class="top10-page">
  <a class="back" href="#/">← All deals</a>
  <h1>The 10 best deals, ranked by verdict score</h1>
  <p class="top10-summary">Buying all ten costs <b>${fmt$(totalPrice)}</b> and saves <b>${fmt$(totalSave)}</b> against their usual prices. Ranked by the same score as the main list — discount depth, dollars saved, cross-store check, brand, and usual-price trust.</p>
  <ol class="top10-list">${rows}</ol>
</section>`;
}

// ---- compare view: up to 3 deals, side by side ----
export function compareHTML(ids) {
  const list = ids.map(dealById).filter(Boolean);
  if (!list.length) {
    return `<section class="compare-empty"><a class="back" href="#/">← All deals</a><h1>Compare stores &amp; deals</h1><p>No deals picked yet. Use the “+ Compare” button on any card to add up to three deals, then come back here.</p></section>`;
  }
  const row = (label, fn) => `<tr><th>${label}</th>${list.map((d) => `<td>${fn(d)}</td>`).join('')}</tr>`;
  return `
<section class="compare-page">
  <a class="back" href="#/">← All deals</a>
  <h1>Compare ${list.length} deal${list.length > 1 ? 's' : ''}</h1>
  <table class="compare-table">
    <thead><tr><th></th>${list.map((d) => `<th><a href="#/deal/${esc(d.id)}">${esc(d.name)}</a></th>`).join('')}</tr></thead>
    <tbody>
      ${row('Verdict score', (d) => scoreOf(d) + '/80')}
      ${row('Verdict', (d) => TIER_LABEL[tierOf(d)])}
      ${row('Sale price', (d) => fmt$(d.sale))}
      ${row('Usual price', (d) => fmt$(d.usual))}
      ${row('Cut', (d) => '−' + pctOff(d) + '%')}
      ${row('You save', (d) => fmt$(saveOf(d)))}
      ${row('Cheapest checked', (d) => { const b = cheapestStore(d); return esc(b.store) + ' ' + fmt$(b.price); })}
      ${row('Stores checked', (d) => String((d.cross || []).length))}
      ${row('Buy', (d) => `<a class="buy small" href="${esc(d.url)}" target="_blank" rel="noopener">See it at ${esc(d.store)}</a>`)}
    </tbody>
  </table>
  <p class="compare-note">The cheapest price per deal comes from the cross-store table on each deal's audit page. Prices were checked on Friday 28 November 2026 (WITA); stores change them during the sale.</p>
</section>`;
}

export const FOOTER_HTML = `
<footer class="site-footer">
  <h2>How we checked</h2>
  <p>Every price on this page was read from a named source on Friday 28 November 2026 (WITA): The Verge's Apple deals page, Popular Science's best Black Friday deals, WIRED's best Black Friday deals, CNN Underscored's LEGO and Dyson deal pages, Yahoo Shopping's kitchen deals, CNET's LG C6 deal, the New York Post's Beats Studio Pro deal, and Best Buy and Walmart store pages. Sale prices and usual prices are the ones those pages showed. Where the same product appeared at more than one store, every price found is listed — most products cost the same at every store, so a cross-store check mostly confirms the price is real, it does not find a bargain.</p>
  <p>A deal is only listed if a real usual price was shown next to the sale price. If two sources disagreed about the usual price, the deal is flagged "usual price doubtful" and scored on the lowest trusted usual. No 12-month price history and no 90-day average is shown anywhere on this site, because none was measured.</p>
  <p>DealHound is a one-page static site. It works offline and stores nothing about you.</p>
</footer>`;
