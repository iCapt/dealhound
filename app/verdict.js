// The verdict: is this really a deal? It compares the sale price with the store's own
// usual price shown on the same page, and nothing else. A deep cut is strong evidence;
// a small cut is a routine sale. The verdict never claims a price history nobody
// measured, and it never calls a deal a new low: the evidence is the two prices on the
// store's page and the time they were read, shown next to every verdict.
export function verdict(d) {
  if (d.d >= 50) {
    return {
      label: 'DEEP CUT',
      cls: 'deep',
      reason: 'Half price or better against the store’s own usual price.',
    };
  }
  if (d.d >= 30) {
    return {
      label: 'STRONG DEAL',
      cls: 'strong',
      reason: 'A big cut against the store’s own usual price.',
    };
  }
  if (d.d >= 20) {
    return {
      label: 'SOLID DEAL',
      cls: 'solid',
      reason: 'A clear saving against the store’s own usual price.',
    };
  }
  if (d.d >= 10) {
    return {
      label: 'MODEST',
      cls: 'modest',
      reason: 'A small saving — worth it only if you wanted it anyway.',
    };
  }
  return {
    label: 'ROUTINE SALE',
    cls: 'routine',
    reason: 'Barely below the usual price — not a bargain on price alone.',
  };
}

// The evidence line under a verdict: what was compared, where, and when.
export function evidence(d) {
  return `Sale ${usd(d.a)} against the store’s usual ${usd(d.b)} — both read on ${d.s}’s page, 27 Nov 2026 at ${d.t} WITA.`;
}

export function usd(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function saved(d) {
  return d.b - d.a;
}
