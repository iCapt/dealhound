// DealHound's front page: hash routes, filter state in the hash, one render.
//   #/            the list, best deals first
//   #/?q=tv&cat=Electronics&store=Target&off=50&sort=saving   a filtered list
//   #/deal/<id>   one deal
// The list re-renders only its grid and count when a control changes, so the search
// box keeps focus while typing. window.__shotReady is false while a page renders and
// true once it is on screen, so a screenshot script knows when to capture.
import { deals } from './data.js';
import { filterDeals, sortDeals, counts } from './filters.js';
import { listPage, dealPage, missing } from './views.js';

const app = document.getElementById('app');
const allCounts = counts(deals);
const SORTS = ['discount', 'saving', 'price-asc', 'price-desc', 'name'];
const OFFS = [0, 20, 30, 50];

function parseState() {
  const query = location.hash.includes('?') ? location.hash.split('?')[1] : '';
  const params = new URLSearchParams(query);
  const off = Number(params.get('off') || 0);
  return {
    q: params.get('q') || '',
    category: params.get('cat') || '',
    store: params.get('store') || '',
    minDiscount: OFFS.includes(off) ? off : 0,
    sort: SORTS.includes(params.get('sort')) ? params.get('sort') : 'discount',
  };
}

function writeState(state) {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.category) params.set('cat', state.category);
  if (state.store) params.set('store', state.store);
  if (state.minDiscount) params.set('off', String(state.minDiscount));
  if (state.sort !== 'discount') params.set('sort', state.sort);
  const query = params.toString();
  history.replaceState(null, '', query ? `#/?${query}` : '#/');
}

function renderList(state) {
  const shown = sortDeals(filterDeals(deals, state), state.sort);
  const grid = app.querySelector('.grid');
  const count = app.querySelector('.count');
  if (!grid || !count) return;
  // Reuse the list page's markup for the rows and the count, without rebuilding
  // the controls (keeps the search box focused while typing).
  const page = listPage(deals, shown, state, allCounts);
  const doc = new DOMParser().parseFromString(page, 'text/html');
  grid.innerHTML = doc.querySelector('.grid').innerHTML;
  count.innerHTML = doc.querySelector('.count').innerHTML;
}

function render() {
  window.__shotReady = false;
  const match = location.hash.match(/^#\/deal\/([^/?]+)/);
  if (match) {
    const found = deals.find((d) => d.id === decodeURIComponent(match[1]));
    document.title = `${found ? found.p : 'Not found'} | DealHound`;
    app.innerHTML = found ? dealPage(found, deals) : missing();
  } else {
    const state = parseState();
    document.title = 'DealHound — Real Black Friday deals, checked';
    app.innerHTML = listPage(
      deals,
      sortDeals(filterDeals(deals, state), state.sort),
      state,
      allCounts,
    );
    const q = app.querySelector('#q');
    const category = app.querySelector('#category');
    const store = app.querySelector('#store');
    const off = app.querySelector('#minDiscount');
    const sort = app.querySelector('#sort');
    if (state.category) category.value = state.category;
    if (state.store) store.value = state.store;
    const apply = () => {
      const next = {
        q: q.value,
        category: category.value,
        store: store.value,
        minDiscount: Number(off.value),
        sort: sort.value,
      };
      writeState(next);
      renderList(next);
    };
    q.addEventListener('input', apply);
    category.addEventListener('change', apply);
    store.addEventListener('change', apply);
    off.addEventListener('change', apply);
    sort.addEventListener('change', apply);
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener('hashchange', render);
render();
