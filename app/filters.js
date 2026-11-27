// DealHound R2 — filters. All state lives in the URL hash, so a filtered
// view can be shared and the back button works. No storage, no network.
//
// Hash shapes:
//   #/                                  the full list, default sort (score)
//   #/?cat=Audio&store=Amazon&verdict=strong&min=30&real=1&q=airpods
//   #/deal/<id>                         one deal's audit page
//   #/top10                             the ten best deals, ranked
//   #/compare                           the compare tray, side by side

import { DEALS } from './data.js';
import { scoreOf, tierOf, TIER_LABEL, pctOff, saveOf } from './verdict.js';

export const CATEGORIES = [...new Set(DEALS.map((d) => d.cat))];

export const STORES = [...new Set(DEALS.flatMap((d) => (d.cross || []).map((c) => c.store)))].sort();

export const VERDICTS = ['top', 'strong', 'good', 'routine', 'modest', 'doubtful'];

export const MIN_PCTS = [0, 20, 30, 50];

export const SORTS = [
  { id: 'score', label: 'Best score first' },
  { id: 'pct', label: 'Biggest % off first' },
  { id: 'save', label: 'Most dollars saved first' },
  { id: 'price', label: 'Lowest price first' },
];

export function defaultState() {
  return { q: '', cat: '', store: '', verdict: '', min: 0, real: false, sort: 'score' };
}

export function parseHash(hash) {
  const state = defaultState();
  const raw = (hash || '').replace(/^#/, '');
  if (raw.startsWith('/deal/')) return { view: 'deal', id: raw.slice(6).split('?')[0], state };
  if (raw === '/top10') return { view: 'top10', state };
  if (raw === '/compare') return { view: 'compare', state };
  const qIndex = raw.indexOf('?');
  if (qIndex !== -1) {
    const params = new URLSearchParams(raw.slice(qIndex + 1));
    state.q = params.get('q') || '';
    state.cat = params.get('cat') || '';
    state.store = params.get('store') || '';
    state.verdict = params.get('verdict') || '';
    state.min = Number(params.get('min') || 0);
    state.real = params.get('real') === '1';
    state.sort = params.get('sort') || 'score';
  }
  return { view: 'list', state };
}

export function stateToHash(state) {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.cat) p.set('cat', state.cat);
  if (state.store) p.set('store', state.store);
  if (state.verdict) p.set('verdict', state.verdict);
  if (state.min) p.set('min', String(state.min));
  if (state.real) p.set('real', '1');
  if (state.sort && state.sort !== 'score') p.set('sort', state.sort);
  const qs = p.toString();
  return '#/' + (qs ? '?' + qs : '');
}

export function applyFilters(deals, state) {
  let out = deals.slice();
  if (state.real) out = out.filter((d) => tierOf(d) !== 'doubtful');
  if (state.verdict) out = out.filter((d) => tierOf(d) === state.verdict);
  if (state.cat) out = out.filter((d) => d.cat === state.cat);
  if (state.store) out = out.filter((d) => (d.cross || []).some((c) => c.store === state.store));
  if (state.min) out = out.filter((d) => pctOff(d) >= state.min);
  if (state.q) {
    const q = state.q.toLowerCase();
    out = out.filter((d) => (d.name + ' ' + d.brand + ' ' + d.cat + ' ' + d.store).toLowerCase().includes(q));
  }
  const s = state.sort || 'score';
  if (s === 'pct') out.sort((a, b) => pctOff(b) - pctOff(a) || scoreOf(b) - scoreOf(a));
  else if (s === 'save') out.sort((a, b) => saveOf(b) - saveOf(a) || scoreOf(b) - scoreOf(a));
  else if (s === 'price') out.sort((a, b) => a.sale - b.sale || scoreOf(b) - scoreOf(a));
  else out.sort((a, b) => scoreOf(b) - scoreOf(a) || saveOf(b) - saveOf(a));
  return out;
}

// Counts for the chips: how many deals each chip would show, given the
// other filters (so a chip never promises a number it cannot deliver).
export function chipCounts(state) {
  const base = (key, value) => {
    const s = { ...state, [key]: value };
    return applyFilters(DEALS, s).length;
  };
  const cats = CATEGORIES.map((c) => ({ id: c, label: c, n: base('cat', c) }));
  const verdicts = VERDICTS.map((v) => ({ id: v, label: TIER_LABEL[v], n: base('verdict', v) }));
  const mins = MIN_PCTS.filter((m) => m > 0).map((m) => ({ id: m, label: m + '% off or more', n: base('min', m) }));
  const stores = STORES.map((s) => ({ id: s, label: s, n: base('store', s) }));
  return { cats, verdicts, mins, stores };
}

export function activeFilterLabels(state) {
  const labels = [];
  if (state.q) labels.push({ key: 'q', label: 'Search: "' + state.q + '"' });
  if (state.cat) labels.push({ key: 'cat', label: 'Category: ' + state.cat });
  if (state.store) labels.push({ key: 'store', label: 'Store: ' + state.store });
  if (state.verdict) labels.push({ key: 'verdict', label: 'Verdict: ' + TIER_LABEL[state.verdict] });
  if (state.min) labels.push({ key: 'min', label: 'At least ' + state.min + '% off' });
  if (state.real) labels.push({ key: 'real', label: 'Only real deals' });
  return labels;
}

export function clearOne(state, key) {
  const next = { ...state };
  if (key === 'q') next.q = '';
  if (key === 'cat') next.cat = '';
  if (key === 'store') next.store = '';
  if (key === 'verdict') next.verdict = '';
  if (key === 'min') next.min = 0;
  if (key === 'real') next.real = false;
  return next;
}
