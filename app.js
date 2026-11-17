(() => {
  const D = window.DATA || {};
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => (n == null || isNaN(n) ? '—' : n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(Math.round(n)));
  const fx = (n) => (n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString('en-US') + 'x');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TIER = { core: 'Trading', nearby: 'Work / AI / Finance', broad: 'General' };

  // ---- saved / used state (per browser) ----
  const store = {
    get(k) { try { return new Set(JSON.parse(localStorage.getItem(k) || '[]')); } catch { return new Set(); } },
    set(k, s) { try { localStorage.setItem(k, JSON.stringify([...s])); } catch {} },
  };
  const saved = store.get('vmr_saved');
  const used = store.get('vmr_used');

  // ---- normalise every source into one shape ----
  const norm = (r, platform, src) => {
    const isIG = platform === 'Instagram';
    const x = r.x_followers || r.x_median || null;
    return {
      id: r.url, src, platform,
      rank: r.rank, format: r.format || '', creator: r.creator || '', tier: r.tier || '',
      views: r.views, x, xLabel: r.x_followers ? 'vs followers' : r.x_median ? 'vs their usual' : '',
      share_rate: r.share_rate, length_s: r.length_s, posted: r.posted || r.date_found || '',
      hook: r.hook || '', breakdown: r.breakdown || '', why: r.why_it_works || '',
      tv: r.trading_version || '', how: r.how_to_make || '',
      watched: (r.watched || '') === 'watched' || r.checked === 'yes',
      fromCaption: isIG || /not watched|from caption/i.test(r.watched || ''),
      caption: r.caption || '', url: r.url, date: r.date_found || '', flags: r.flags || '',
      characters: r.characters || '', tool: r.tool || '', scene: r.scene || '', motion: r.motion || '', status: r.status || '', difficulty: r.difficulty || '', cost: r.est_cost || '',
    };
  };
  const T = (D.tiktok || []).map((r) => norm(r, r.platform || 'TikTok', 'tiktok'));
  const I = (D.instagram || []).map((r) => norm(r, 'Instagram', 'instagram'));
  const TR = (D.tiktok_rest || []).map((r) => norm(r, 'TikTok', 'rest'));
  const IR = (D.instagram_rest || []).map((r) => norm(r, 'Instagram', 'rest'));
  const DY = (D.daily || []).map((r) => norm(r, 'TikTok', 'daily'));
  const AI = (D.ai || []).map((r) => norm(r, r.platform || 'TikTok', 'ai'));
  const ALL = [...TR, ...IR];
  const byId = new Map();
  [...DY, ...ALL, ...T, ...I, ...AI].forEach((it) => byId.set(it.id, it));

  // ---- state ----
  const st = { tab: (location.hash.slice(1) || 'tiktok'), tier: '', char: '', q: '', sort: 'rank', view: 'cards', hideUsed: false, plat: '', limit: 120 };
  try { const v = localStorage.getItem('vmr_view'); if (v) st.view = v; } catch {}

  const HINTS = {
    tiktok: 'Top 50 TikTok formats from the last 7 days. Tap the coral line to copy the trading version. ★ saves an idea, ✓ marks it as used once you have made it.',
    instagram: 'Top 50 Instagram reels from the last 14 days. Instagram gives no follower counts, so "vs their usual" compares against the account’s own recent reels. Hooks are written from captions, so watch before building.',
    ai: 'Videos a real person performs on camera, so Mark or Cyan can re-perform them with Genjutsu or Seedance. No clips with text pasted on top. Each card says who plays it, the scene to set up, the move to copy and roughly what it costs.',
    saved: 'Everything you starred, across both platforms. Saved in this browser.',
    daily: 'New outliers from each daily 24-hour scan, newest day first.',
    all: 'Every other outlier from the scans. Click a row to expand the caption and breakdown.',
  };

  // ---- filtering ----
  const match = (it) => {
    if (st.tab !== 'ai' && st.tier && it.tier !== st.tier) return false;
    if (st.tab === 'ai' && st.char) { if (st.char === '+' ? !it.characters.includes('+') : !it.characters.includes(st.char)) return false; }
    if (st.hideUsed && used.has(it.id)) return false;
    if (st.plat && it.platform !== st.plat) return false;
    if (st.q) {
      const hay = (it.format + ' ' + it.creator + ' ' + it.hook + ' ' + it.breakdown + ' ' + it.tv + ' ' + it.caption + ' ' + it.why).toLowerCase();
      return st.q.split(/\s+/).every((w) => hay.includes(w));
    }
    return true;
  };
  const sorter = (a, b) => {
    const k = st.sort === 'rank' && st.tab === 'all' ? 'views' : st.sort;
    if (k === 'rank') return (a.rank ?? 1e9) - (b.rank ?? 1e9);
    if (k === 'length_s') return (a.length_s ?? 1e9) - (b.length_s ?? 1e9);
    if (k === 'x') return (b.x ?? -1) - (a.x ?? -1);
    return (b[k] ?? -1) - (a[k] ?? -1);
  };

  // ---- renderers ----
  const aiCard = (it) => {
    const pl = it.platform === 'Instagram' ? '<span class="badge ig">Instagram</span>' : '<span class="badge tt">TikTok</span>';
    const st2 = it.status ? `<span class="badge ok">${esc(it.status)}</span>` : `<span class="badge">${esc(it.difficulty)}</span>`;
    const third = it.x ? `<div class="stat"><b>${fx(it.x)}</b><span>vs followers</span></div>` : `<div class="stat"><b>${it.length_s ? Math.round(it.length_s) + 's' : '—'}</b><span>length</span></div>`;
    return `<article class="card ${used.has(it.id) ? 'used' : ''} ${it.status ? 'made' : ''}" data-id="${esc(it.id)}">
      <div class="card-top"><span class="rank">#${it.rank}</span><div class="badges">${pl}<span class="badge core">${esc(it.characters)}</span>${st2}</div></div>
      <div><div class="format">${esc(it.format)}</div><div class="creator">${esc(it.creator)} · ${esc(it.tool)}</div></div>
      <div class="tv" data-copy="${esc(it.tv)}"><span class="lbl">On-screen text</span>${esc(it.tv)}<span class="copy">Copy</span></div>
      <div class="stats"><div class="stat"><b>${fmt(it.views)}</b><span>views</span></div>${third}<div class="stat"><b>${it.share_rate != null ? it.share_rate.toFixed(1) + '%' : '—'}</b><span>shared</span></div></div>
      <div class="field"><b>Scene:</b> ${esc(it.scene)}</div>
      <div class="field"><b>Move to copy:</b> ${esc(it.motion)}</div>
      <div class="more"><div class="field"><b>Why it works:</b> ${esc(it.why)}</div>${it.cost ? `<div class="field"><b>Rough cost:</b> ${esc(it.cost)}</div>` : ''}</div>
      <div class="actions">
        <a class="btn primary" href="${esc(it.url)}" target="_blank" rel="noopener">Watch ref ↗</a>
        <button class="btn" data-act="more">Details</button>
        <span class="spacer"></span>
        <button class="btn icon star ${saved.has(it.id) ? 'on' : ''}" data-act="save" title="Save idea">★</button>
        <button class="btn icon usedb ${used.has(it.id) ? 'on' : ''}" data-act="used" title="Mark as made">✓</button>
      </div>
    </article>`;
  };

  const card = (it) => {
    if (it.src === 'ai') return aiCard(it);
    const pl = it.platform === 'Instagram' ? '<span class="badge ig">Instagram</span>' : '<span class="badge tt">TikTok</span>';
    const seen = it.watched ? '<span class="badge ok">Watched</span>' : `<span class="badge warn">${it.fromCaption ? 'From caption' : 'Not watched'}</span>`;
    const tier = it.tier ? `<span class="badge ${it.tier === 'core' ? 'core' : ''}">${({core:'Trading',nearby:'Work / AI',broad:'General'})[it.tier] || it.tier}</span>` : '';
    const third = it.x ? `<div class="stat"><b>${fx(it.x)}</b><span>${it.xLabel}</span></div>` : `<div class="stat"><b>${esc(it.posted || '—')}</b><span>posted</span></div>`;
    const hasMore = it.why || it.how || it.breakdown;
    return `<article class="card ${used.has(it.id) ? 'used' : ''}" data-id="${esc(it.id)}">
      <div class="card-top"><span class="rank">${it.rank ? '#' + it.rank : ''}</span><div class="badges">${pl}${tier}${seen}</div></div>
      <div><div class="format">${esc(it.format || it.hook || it.creator)}</div><div class="creator">${esc(it.creator)} · ${it.length_s ? Math.round(it.length_s) + 's' : ''} ${it.posted ? '· ' + esc(it.posted) : ''}</div></div>
      ${it.tv ? `<div class="tv" data-copy="${esc(it.tv)}"><span class="lbl">Trading version</span>${esc(it.tv)}<span class="copy">Copy</span></div>` : ''}
      <div class="stats"><div class="stat"><b>${fmt(it.views)}</b><span>views</span></div>${third}<div class="stat"><b>${it.share_rate != null ? it.share_rate.toFixed(1) + '%' : '—'}</b><span>shared</span></div></div>
      ${it.hook ? `<div class="field"><b>Hook:</b> ${esc(it.hook)}</div>` : ''}
      ${hasMore ? `<div class="more">
        ${it.breakdown ? `<div class="field"><b>What happens:</b> ${esc(it.breakdown)}</div>` : ''}
        ${it.why ? `<div class="field"><b>Why it works:</b> ${esc(it.why)}</div>` : ''}
        ${it.how ? `<div class="field"><b>How to make it:</b> ${esc(it.how)}</div>` : ''}
      </div>` : ''}
      <div class="actions">
        <a class="btn primary" href="${esc(it.url)}" target="_blank" rel="noopener">Watch ↗</a>
        ${hasMore ? '<button class="btn" data-act="more">Details</button>' : ''}
        <span class="spacer"></span>
        <button class="btn icon star ${saved.has(it.id) ? 'on' : ''}" data-act="save" title="${saved.has(it.id) ? 'Saved (click to remove)' : 'Save idea'}">★</button>
        <button class="btn icon usedb ${used.has(it.id) ? 'on' : ''}" data-act="used" title="${used.has(it.id) ? 'Marked as made' : 'Mark as made'}">✓</button>
      </div>
    </article>`;
  };

  const table = (rows, cols) => {
    const head = cols.map((c) => `<th>${c.h}</th>`).join('');
    const body = rows.map((it) => `<tr data-id="${esc(it.id)}" class="${used.has(it.id) ? 'usedrow' : ''}">${cols.map((c) => c.td(it)).join('')}</tr>`).join('');
    return `<div class="tbl-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  };
  const C = {
    star: { h: '', td: (it) => `<td><button class="btn star ${saved.has(it.id) ? 'on' : ''}" data-act="save" title="Save">★</button></td>` },
    link: { h: '', td: (it) => `<td><a class="btn" href="${esc(it.url)}" target="_blank" rel="noopener">Watch ↗</a></td>` },
    plat: { h: 'Platform', td: (it) => `<td><span class="badge ${it.platform === 'Instagram' ? 'ig' : 'tt'}">${it.platform}</span></td>` },
    creator: { h: 'Creator', td: (it) => `<td>${esc(it.creator)}</td>` },
    tier: { h: 'Niche', td: (it) => `<td>${TIER[it.tier] || ''}</td>` },
    views: { h: 'Views', td: (it) => `<td class="n">${fmt(it.views)}</td>` },
    x: { h: 'Outlier', td: (it) => `<td class="n">${fx(it.x)}</td>` },
    sr: { h: 'Shared', td: (it) => `<td class="n">${it.share_rate != null ? it.share_rate.toFixed(1) + '%' : '—'}</td>` },
    len: { h: 'Length', td: (it) => `<td class="n">${it.length_s ? Math.round(it.length_s) + 's' : ''}</td>` },
    hook: { h: 'Hook', td: (it) => `<td class="wide"><div class="clip">${esc(it.hook)}</div></td>` },
    bd: { h: 'Content breakdown', td: (it) => `<td class="wide"><div class="clip">${esc(it.breakdown)}</div></td>` },
    tv: { h: 'Trading version', td: (it) => `<td class="wide"><div class="clip">${esc(it.tv)}</div></td>` },
    fmt: { h: 'Format', td: (it) => `<td class="wide"><b>${esc(it.format)}</b></td>` },
    cap: { h: 'Caption', td: (it) => `<td class="cap"><div class="clip">${esc(it.caption)}</div></td>` },
  };

  const render = () => {
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === st.tab));
    $('#hint').textContent = HINTS[st.tab] || '';
    const tableTab = st.tab === 'all' || st.tab === 'daily';
    $('#plat-wrap').hidden = !(st.tab === 'all' || st.tab === 'saved');
    $('#view-seg').style.display = tableTab ? 'none' : '';
    $('#tier-chips').hidden = st.tab === 'ai';
    $('#char-chips').hidden = st.tab !== 'ai';
    document.querySelectorAll('#view-seg button').forEach((b) => b.classList.toggle('on', b.dataset.view === st.view));

    let src;
    if (st.tab === 'tiktok') src = T;
    else if (st.tab === 'instagram') src = I;
    else if (st.tab === 'ai') src = AI;
    else if (st.tab === 'saved') src = [...saved].map((id) => byId.get(id)).filter(Boolean);
    else if (st.tab === 'daily') src = DY;
    else src = ALL;

    let rows = src.filter(match);
    if (st.tab !== 'daily') rows = rows.slice().sort(sorter);
    const main = $('#main');
    $('#empty').hidden = rows.length > 0;
    if (!rows.length) { main.innerHTML = ''; return; }

    if (st.tab === 'daily') {
      const days = {};
      rows.forEach((r) => (days[r.date] = days[r.date] || []).push(r));
      main.innerHTML = Object.keys(days).sort().reverse().map((d) => {
        const list = days[d].sort(sorter);
        return `<h3 class="day-head">${esc(new Date(d + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }))}<span>${list.length} new outliers</span></h3>` +
          table(list, [C.star, C.link, C.creator, C.tier, C.views, C.x, C.sr, C.len, C.tv, C.cap]);
      }).join('');
      return;
    }
    if (st.tab === 'all') {
      const shown = rows.slice(0, st.limit);
      main.innerHTML = table(shown, [C.star, C.link, C.plat, C.creator, C.tier, C.views, C.x, C.sr, C.len, C.hook, C.bd, C.cap]) +
        (rows.length > shown.length ? `<button class="btn load-more" data-act="loadmore">Show more (${rows.length - shown.length} left)</button>` : '');
      return;
    }
    if (st.view === 'list') {
      main.innerHTML = table(rows, [C.star, C.link, { h: '#', td: (it) => `<td class="n">${it.rank ?? ''}</td>` }, C.plat, C.fmt, C.creator, C.views, C.x, C.sr, C.tv, C.hook]);
    } else {
      main.innerHTML = `<div class="grid">${rows.map(card).join('')}</div>`;
    }
  };

  const counts = () => {
    $('#c-tiktok').textContent = T.length;
    $('#c-instagram').textContent = I.length;
    $('#c-saved').textContent = saved.size;
    $('#c-ai').textContent = AI.length;
    $('#c-daily').textContent = DY.length;
    $('#c-all').textContent = ALL.length;
  };

  const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1600); };
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); toast('Copied'); }
    catch { const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Copied'); }
  };

  // ---- events ----
  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.tab = b.dataset.tab; st.limit = 120; history.replaceState(null, '', '#' + st.tab); render(); window.scrollTo({ top: 0 }); });
  $('#tier-chips').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; st.tier = b.dataset.tier; document.querySelectorAll('#tier-chips .chip').forEach((c) => c.classList.toggle('on', c === b)); render(); });
  $('#char-chips').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; st.char = b.dataset.char; document.querySelectorAll('#char-chips .chip').forEach((c) => c.classList.toggle('on', c === b)); render(); });
  $('#view-seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.view = b.dataset.view; try { localStorage.setItem('vmr_view', st.view); } catch {} render(); });
  $('#sort').addEventListener('change', (e) => { st.sort = e.target.value; render(); });
  $('#plat').addEventListener('change', (e) => { st.plat = e.target.value; render(); });
  $('#hide-used').addEventListener('change', (e) => { st.hideUsed = e.target.checked; render(); });
  let qt; $('#q').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => { st.q = e.target.value.trim().toLowerCase(); render(); }, 120); });
  document.addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== $('#q')) { e.preventDefault(); $('#q').focus(); } if (e.key === 'Escape') { $('#q').value = ''; st.q = ''; render(); } });

  $('#main').addEventListener('click', (e) => {
    const tv = e.target.closest('.tv'); if (tv) { copy(tv.dataset.copy); return; }
    const b = e.target.closest('[data-act]');
    const holder = e.target.closest('[data-id]');
    if (b) {
      const act = b.dataset.act;
      if (act === 'loadmore') { st.limit += 200; render(); return; }
      const id = holder && holder.dataset.id;
      if (act === 'more') { holder.classList.toggle('open'); b.textContent = holder.classList.contains('open') ? 'Less' : 'Details'; return; }
      if (act === 'save') { saved.has(id) ? saved.delete(id) : saved.add(id); store.set('vmr_saved', saved); toast(saved.has(id) ? 'Saved' : 'Removed'); counts(); render(); return; }
      if (act === 'used') { used.has(id) ? used.delete(id) : used.add(id); store.set('vmr_used', used); render(); return; }
      return;
    }
    const tr = e.target.closest('tr[data-id]'); if (tr && !e.target.closest('a')) tr.classList.toggle('exp');
  });

  // ---- boot ----
  const m = D.meta || {};
  $('#meta-line').textContent = `Updated ${m.updated || ''} · ${T.length} TikTok + ${I.length} Instagram top formats · ${ALL.length} more outliers`;
  if (!['tiktok', 'instagram', 'ai', 'saved', 'daily', 'all'].includes(st.tab)) st.tab = 'tiktok';
  counts();
  render();
})();
