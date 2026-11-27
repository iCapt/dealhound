// Search, filter and sort for the deal list. Pure functions over the deal array: the
// page keeps its state in the location hash, and these functions turn that state into
// the deals shown. Nothing here touches the DOM.

// state: { q, category, store, minDiscount, sort }
//   q: free text, matched against product, store and category
//   category, store: exact match, or '' for all
//   minDiscount: 0, 20, 30 or 50 (percent)
//   sort: 'discount' | 'saving' | 'price-asc' | 'price-desc' | 'name'
export function filterDeals(deals, state) {
  const q = (state.q || '').trim().toLowerCase();
  return deals.filter((d) => {
    if (state.category && d.c !== state.category) return false;
    if (state.store && d.s !== state.store) return false;
    if (state.minDiscount && d.d < state.minDiscount) return false;
    if (q !== '' && !`${d.p} ${d.s} ${d.c}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function sortDeals(deals, sort) {
  const rows = [...deals];
  switch (sort) {
    case 'saving':
      rows.sort((x, y) => y.b - y.a - (x.b - x.a) || y.d - x.d);
      break;
    case 'price-asc':
      rows.sort((x, y) => x.a - y.a || y.d - x.d);
      break;
    case 'price-desc':
      rows.sort((x, y) => y.a - x.a || y.d - x.d);
      break;
    case 'name':
      rows.sort((x, y) => x.p.localeCompare(y.p));
      break;
    case 'discount':
    default:
      rows.sort((x, y) => y.d - x.d || x.a - y.a);
      break;
  }
  return rows;
}

// Counts for the filter dropdowns: how many deals each category and store holds.
export function counts(deals) {
  const byCategory = new Map();
  const byStore = new Map();
  for (const d of deals) {
    byCategory.set(d.c, (byCategory.get(d.c) || 0) + 1);
    byStore.set(d.s, (byStore.get(d.s) || 0) + 1);
  }
  return { byCategory, byStore };
}
