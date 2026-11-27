// HTML for each page, built from the deal data. Every value is escaped before it goes
// into the page. The list page renders the controls and the deal cards; the detail
// page renders one deal with its verdict, its evidence and the links a shopper needs.
import { verdict, evidence, usd, saved } from './verdict.js';

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function options(map, allLabel) {
  const rows = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return (
    `<option value="">${escape(allLabel)}</option>` +
    rows.map(([name, n]) => `<option value="${escape(name)}">${escape(name)} (${n})</option>`).join('')
  );
}

export function controls(state, { byCategory, byStore }) {
  const off = (v, label) => `<option value="${v}"${state.minDiscount === v ? ' selected' : ''}>${label}</option>`;
  const sort = (v, label) => `<option value="${v}"${state.sort === v ? ' selected' : ''}>${label}</option>`;
  return `<section class="controls" aria-label="Search and filter deals">
  <label class="search">Search
    <input type="search" id="q" value="${escape(state.q || '')}" placeholder="Headphones, TV, LEGO…" autocomplete="off">
  </label>
  <label>Category
    <select id="category">${options(byCategory, 'All categories')}</select>
  </label>
  <label>Store
    <select id="store">${options(byStore, 'All stores')}</select>
  </label>
  <label>Discount
    <select id="minDiscount">
      ${off(0, 'Any discount')}
      ${off(20, '20% off or more')}
      ${off(30, '30% off or more')}
      ${off(50, '50% off or more')}
    </select>
  </label>
  <label>Sort
    <select id="sort">
      ${sort('discount', 'Biggest discount')}
      ${sort('saving', 'Biggest saving ($)')}
      ${sort('price-asc', 'Lowest price')}
      ${sort('price-desc', 'Highest price')}
      ${sort('name', 'Name A–Z')}
    </select>
  </label>
</section>`;
}

export function card(d) {
  const v = verdict(d);
  return `<li><article class="card">
  <p class="card-top"><span class="store">${escape(d.s)}</span><span class="cat">${escape(d.c)}</span></p>
  <h3><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.p)}</a></h3>
  <p class="prices"><span class="sale">${usd(d.a)}</span> <s class="usual">${usd(d.b)}</s> <span class="off">−${d.d}%</span></p>
  <p class="verdict ${v.cls}"><strong>${v.label}</strong> · ${escape(v.reason)}</p>
  <p class="meta">Checked 27 Nov 2026, ${escape(d.t)} WITA${d.n ? ` · ${escape(d.n)}` : ''}</p>
  <p class="actions"><a class="btn" href="#/deal/${encodeURIComponent(d.id)}">View deal</a> <a class="store-link" href="${escape(d.u)}" target="_blank" rel="noopener">At ${escape(d.s)} ↗</a></p>
</article></li>`;
}

function rows(shown) {
  if (shown.length === 0) {
    return '<li class="empty">No deal matches. Try a different search or filter — or <a href="#/">clear everything</a>.</li>';
  }
  return shown.map(card).join('');
}

export function listPage(deals, shown, state, counts) {
  return `${controls(state, counts)}
<p class="count">Showing <strong>${shown.length}</strong> of ${deals.length} deals</p>
<ul class="grid">${rows(shown)}</ul>`;
}

function moreFrom(deals, d, key, limit) {
  const rest = deals
    .filter((x) => x.id !== d.id && x[key] === d[key])
    .slice(0, limit);
  if (rest.length === 0) return '';
  const title = key === 's' ? `More from ${d.s}` : `More in ${d.c}`;
  return `<section class="more"><h2>${escape(title)}</h2><ul class="grid">${rest.map(card).join('')}</ul></section>`;
}

export function dealPage(d, deals) {
  const v = verdict(d);
  return `<p class="back"><a href="#/">&larr; All deals</a></p>
<article class="detail">
  <p class="card-top"><span class="store">${escape(d.s)}</span><span class="cat">${escape(d.c)}</span></p>
  <h1>${escape(d.p)}</h1>
  <p class="prices big"><span class="sale">${usd(d.a)}</span> <s class="usual">${usd(d.b)}</s> <span class="off">−${d.d}%</span></p>
  <p class="save">You save ${usd(saved(d))} against the usual price.</p>
  <div class="verdict-box ${v.cls}">
    <p class="verdict ${v.cls}"><strong>${v.label}</strong> · ${escape(v.reason)}</p>
    <p class="evidence">${escape(evidence(d))}</p>
  </div>
  ${d.n ? `<p class="note">On the store page: ${escape(d.n)}</p>` : ''}
  <dl>
    <dt>Store</dt><dd>${escape(d.s)}</dd>
    <dt>Category</dt><dd>${escape(d.c)}</dd>
    <dt>Sale price</dt><dd>${usd(d.a)}</dd>
    <dt>Usual price</dt><dd>${usd(d.b)}</dd>
    <dt>Discount</dt><dd>${d.d}% off — you save ${usd(saved(d))}</dd>
    <dt>Price checked</dt><dd>27 Nov 2026, ${escape(d.t)} WITA</dd>
  </dl>
  <p><a class="btn big" href="${escape(d.u)}" target="_blank" rel="noopener">Buy at ${escape(d.s)} ↗</a></p>
  <p class="fine">Prices move: the store page is the price that counts. This page lists what the store showed when it was checked.</p>
</article>
${moreFrom(deals, d, 's', 3)}
${moreFrom(deals, d, 'c', 3)}`;
}

export function missing() {
  return `<h1>Not found</h1>
<p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}
