// DealHound R2 — app shell. Hash router + filter state + compare tray.
// Static site: no network, no storage, no cookies. Filter state lives in
// the hash; the compare tray lives in memory for the session. After every
// render the page sets data-shot-ready, so a screenshot tool can wait for
// the list (or the audit page) to be fully painted before capturing.

import { DEALS } from './data.js';
import { parseHash, stateToHash, applyFilters, chipCounts, activeFilterLabels, clearOne, defaultState } from './filters.js';
import { cardHTML, statsHTML, top10StripHTML, chipsHTML, activeFiltersHTML, detailHTML, top10ViewHTML, compareHTML, FOOTER_HTML, METHOD_LINE, dealById, esc } from './views.js';
import { auditStats, sortByScore } from './verdict.js';

const compare = new Set();
let currentState = defaultState();

const el = (id) => document.getElementById(id);

function renderList(state) {
  const counts = chipCounts(state);
  const filtered = applyFilters(DEALS, state);
  const labels = activeFilterLabels(state);
  const totalSave = Math.round(filtered.reduce((a, d) => a + Math.max(0, d.usual - d.sale), 0));
  el('stats').innerHTML = statsHTML(auditStats(DEALS));
  el('method').textContent = METHOD_LINE;
  el('method').style.display = '';
  el('searchRow').style.display = '';
  el('strip').innerHTML = top10StripHTML();
  el('filters').innerHTML = chipsHTML(state, counts);
  el('active').innerHTML = activeFiltersHTML(labels);
  const sortSel = el('sort');
  if (sortSel) sortSel.value = state.sort || 'score';
  const q = el('q');
  if (q && q.value !== state.q) q.value = state.q;
  const cards = filtered.map((d) => cardHTML(d, { compare: [...compare] })).join('');
  el('view').innerHTML = `
    <div class="list-head">
      <h2>${filtered.length} deal${filtered.length === 1 ? '' : 's'}${state.real ? ' · only real deals' : ''}</h2>
      <span class="list-save">Buying one of each: save ${'$' + totalSave.toLocaleString('en-US')}</span>
    </div>
    <div class="grid">${cards || '<p class="empty">No deals match those filters. Clear a filter and try again.</p>'}</div>
    <p class="compare-link"><a href="#/compare">Compare (${compare.size}) →</a> Pick up to three deals with “+ Compare” on any card.</p>`;
  el('footer').innerHTML = FOOTER_HTML;
}

function renderDetail(id) {
  const d = dealById(id);
  el('stats').innerHTML = statsHTML(auditStats(DEALS));
  el('method').textContent = '';
  el('method').style.display = 'none';
  el('searchRow').style.display = 'none';
  el('strip').innerHTML = '';
  el('filters').innerHTML = '';
  el('active').innerHTML = '';
  el('view').innerHTML = d
    ? detailHTML(d)
    : '<p class="empty">That deal is not on the list. <a href="#/">Back to all deals</a></p>';
  el('footer').innerHTML = FOOTER_HTML;
}

function renderTop10() {
  el('stats').innerHTML = statsHTML(auditStats(DEALS));
  el('method').textContent = '';
  el('method').style.display = 'none';
  el('searchRow').style.display = 'none';
  el('strip').innerHTML = '';
  el('filters').innerHTML = '';
  el('active').innerHTML = '';
  el('view').innerHTML = top10ViewHTML();
  el('footer').innerHTML = FOOTER_HTML;
}

function renderCompare() {
  el('stats').innerHTML = statsHTML(auditStats(DEALS));
  el('method').textContent = '';
  el('method').style.display = 'none';
  el('searchRow').style.display = 'none';
  el('strip').innerHTML = '';
  el('filters').innerHTML = '';
  el('active').innerHTML = '';
  el('view').innerHTML = compareHTML([...compare]);
  el('footer').innerHTML = FOOTER_HTML;
}

function render() {
  const { view, id, state } = parseHash(location.hash);
  currentState = state;
  if (view === 'deal') renderDetail(id);
  else if (view === 'top10') renderTop10();
  else if (view === 'compare') renderCompare();
  else renderList(state);
  document.documentElement.setAttribute('data-shot-ready', 'true');
  window.__shotReady = true;
}

function go(state) {
  location.hash = stateToHash(state);
}

document.addEventListener('click', (ev) => {
  const chip = ev.target.closest('[data-fkey]');
  if (chip) {
    const key = chip.getAttribute('data-fkey');
    const val = chip.getAttribute('data-fval');
    const next = { ...currentState };
    if (key === 'real') next.real = !currentState.real;
    else if (key === 'min') next.min = currentState.min === Number(val) ? 0 : Number(val);
    else if (key === 'cat') next.cat = currentState.cat === val ? '' : val;
    else if (key === 'store') next.store = currentState.store === val ? '' : val;
    else if (key === 'verdict') next.verdict = currentState.verdict === val ? '' : val;
    go(next);
    return;
  }
  const clr = ev.target.closest('[data-clear]');
  if (clr) {
    const key = clr.getAttribute('data-clear');
    if (key === 'all') go(defaultState());
    else go(clearOne(currentState, key));
    return;
  }
  const cmp = ev.target.closest('[data-compare]');
  if (cmp) {
    const id = cmp.getAttribute('data-compare');
    if (compare.has(id)) compare.delete(id);
    else if (compare.size < 3) compare.add(id);
    render();
    return;
  }
});

document.addEventListener('input', (ev) => {
  if (ev.target && ev.target.id === 'q') {
    const next = { ...currentState, q: ev.target.value };
    history.replaceState(null, '', stateToHash(next));
    render();
  }
});
document.addEventListener('change', (ev) => {
  if (ev.target && ev.target.id === 'sort') {
    go({ ...currentState, sort: ev.target.value });
  }
});

window.addEventListener('hashchange', render);
render();
