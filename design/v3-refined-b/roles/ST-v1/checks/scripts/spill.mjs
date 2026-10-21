// Content spilling out of the nearest visible box (card, panel, pill, button), or clipped by a hidden-overflow box,
// even when the page itself does not scroll sideways. Same rule as fx_shoot.mjs.
export async function spillReport(page) {
  return page.evaluate(() => {
    const isBox = cs => parseFloat(cs.borderLeftWidth) > 0 || parseFloat(cs.borderRightWidth) > 0 || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.boxShadow !== 'none';
    const spill = [];
    for (const d of document.querySelectorAll('body *')) {
      const dcs = getComputedStyle(d);
      if (dcs.display === 'none' || dcs.display === 'contents' || dcs.position === 'absolute' || dcs.position === 'fixed' || d.closest('.xr-sr')) continue;
      const r = d.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
      for (let a = d.parentElement; a && a !== document.body; a = a.parentElement) {
        const acs = getComputedStyle(a);
        if (acs.display === 'contents' || acs.display === 'inline') continue;
        if (acs.overflowX === 'auto' || acs.overflowX === 'scroll') break;
        const b = a.getBoundingClientRect();
        if (acs.overflowX !== 'visible' && b.width <= 2) break;
        if (acs.overflowX !== 'visible' && acs.textOverflow === 'ellipsis') break;   // deliberate one-line truncation with an ellipsis
        if (acs.overflowX !== 'visible') { if (r.right > b.right + 1 || r.left < b.left - 1) spill.push('clipped by ' + String(a.className || a.tagName).slice(0, 40) + ' ⊃ ' + String(d.className || d.tagName).slice(0, 30)); break; }
        if (!isBox(acs)) continue;
        if (r.right > b.right + 1 || r.left < b.left - 1) spill.push(String(a.className || a.tagName).slice(0, 40) + ' ⊃ ' + String(d.className || d.tagName).slice(0, 30) + ' ' + Math.round(Math.max(r.right - b.right, b.left - r.left)) + 'px');
        break;
      }
    }
    return spill.slice(0, 6);
  });
}
