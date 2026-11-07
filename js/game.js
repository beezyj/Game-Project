// Stitch & Style — game flow, screens and mini-games.
'use strict';

(() => {
  const stage = document.getElementById('stage');
  const fitEl = document.getElementById('fit');

  // ---------- scaling ----------
  function fit() {
    const s = Math.min(fitEl.clientWidth / 800, fitEl.clientHeight / 450);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 250));
  fit();
  document.getElementById('rotate-skip').onclick = () => { document.body.classList.add('portrait-ok'); fit(); };
  document.addEventListener('pointerdown', () => Sound.init(), true);
  document.addEventListener('gesturestart', e => e.preventDefault());

  // ---------- helpers ----------
  const rand = n => Math.floor(Math.random() * n);
  const pick = a => a[rand(a.length)];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const coin = '<i class="coin"></i>';
  const an = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
  const lc = s => s.toLowerCase();
  function pickPref(list, ok, p) { const good = list.filter(ok); return good.length && Math.random() < p ? pick(good) : pick(list); }
  function html(str) { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstChild; }
  function add(str) { const n = html(str); stage.appendChild(n); return n; }
  function toast(msg) {
    stage.querySelectorAll('.toast').forEach(t => t.remove());
    const t = add(`<div class="toast">${msg}</div>`);
    setTimeout(() => t.remove(), 2600);
  }
  function svgPoint(svg, e) {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  // ---------- state ----------
  const SAVE_KEY = 'stitchStyle.v2';
  let S;
  function giftEra(e) {
    Object.entries(GARMENTS).forEach(([id, g]) => { if (g.era === e && g.price === 0 && !S.owned.patterns.includes(id)) S.owned.patterns.push(id); });
    ERAS[e].colors.filter(c => !S.owned.colors.includes(c)).slice(0, 2).forEach(c => S.owned.colors.push(c));
  }
  function newState() {
    S = {
      era: 0, day: 1, money: 40, rep: 0, served: 0, custIdx: 0, todayMoney: 0, todayStars: 0,
      owned: { mats: ['cotton', 'wool'], colors: ['black', 'ivory', 'navy'], trims: ['none', 'buttons'], patterns: [], tools: { shears: 0, sewing: 0, iron: 0 } },
      order: null, work: null, patronPending: false, patronAnnounced: false, lastMade: null, finished: false,
      settings: { music: true, sfx: true }, best: 0,
    };
    giftEra(0);
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
  function loadSave() { try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function loadSettings() {
    const s = loadSave();
    if (s && s.settings) { Sound.setMusic(s.settings.music); Sound.setSfx(s.settings.sfx); }
  }
  const era = () => ERAS[S.era];
  const owns = (kind, id) => S.owned[kind].includes(id);
  const eraGarments = () => Object.entries(GARMENTS).filter(([, g]) => g.era === S.era);
  const heirFirst = () => era().heir.split(' ')[0].replace('“', '');

  function setEraClass() { stage.className = 'era-' + era().id; }

  // ---------- HUD ----------
  function hudHTML({ catalogue = false } = {}) {
    const e = era();
    const pct = S.finished ? 100 : clamp(S.rep / e.goal * 100, 0, 100);
    return `<div class="hud">
      <span class="chip">${e.year} · Day ${S.day}</span>
      <span class="chip" id="hud-money">${coin}${S.money}</span>
      <span class="chip">★ ${S.finished ? S.rep : `${Math.min(S.rep, e.goal)}/${e.goal}`}<span class="rep-bar"><i style="width:${pct}%"></i></span></span>
      <span class="spacer"></span>
      ${catalogue ? '<button class="icon-btn" data-hud="cat">📖 Supplies</button>' : ''}
      <button class="icon-btn ${Sound.musicOn ? '' : 'off'}" data-hud="music">♪</button>
      <button class="icon-btn" data-hud="menu">☰</button>
    </div>`;
  }
  function bindHud(onCatalogue) {
    stage.querySelectorAll('[data-hud]').forEach(b => b.onclick = async e => {
      e.stopPropagation();
      const k = b.dataset.hud;
      Sound.sfx('click');
      if (k === 'music') { Sound.setMusic(!Sound.musicOn); S.settings.music = Sound.musicOn; save(); b.classList.toggle('off', !Sound.musicOn); }
      if (k === 'menu') menu();
      if (k === 'cat' && onCatalogue) onCatalogue();
    });
  }
  function refreshMoney() { const m = stage.querySelector('#hud-money'); if (m) m.innerHTML = coin + S.money; }

  function modal(inner) {
    return new Promise(resolve => {
      const bg = add('<div class="modal-bg"></div>');
      const p = add(`<div class="panel" style="left:50%;top:50%;transform:translate(-50%,-50%);width:420px;z-index:71">${inner}</div>`);
      const close = v => { bg.remove(); p.remove(); resolve(v); };
      p.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { Sound.sfx('click'); close(b.dataset.v); });
      bg.onclick = () => close(null);
    });
  }

  async function menu() {
    const v = await modal(`<h2>Menu</h2>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn alt" data-v="music">Music: ${Sound.musicOn ? 'On' : 'Off'}</button>
        <button class="btn alt" data-v="sfx">Sound effects: ${Sound.sfxOn ? 'On' : 'Off'}</button>
        <button class="btn alt" data-v="help">How to play</button>
        <button class="btn alt" data-v="quit">Save &amp; quit to title</button>
        <button class="btn" data-v="close">Back to game</button>
      </div>`);
    if (v === 'music') { Sound.setMusic(!Sound.musicOn); S.settings.music = Sound.musicOn; save(); stage.querySelectorAll('[data-hud="music"]').forEach(b => b.classList.toggle('off', !Sound.musicOn)); return menu(); }
    if (v === 'sfx') { Sound.setSfx(!Sound.sfxOn); S.settings.sfx = Sound.sfxOn; save(); return menu(); }
    if (v === 'help') { await help(); return menu(); }
    if (v === 'quit') { save(); title(); }
  }

  function help() {
    return modal(`<h2>How to play</h2>
      <div style="font-size:14px;line-height:1.45;max-height:280px;overflow:auto;touch-action:pan-y">
      <p><b>Take orders.</b> Each customer tells you the garment, fabric, color and trim they want. It's pinned to your ticket.</p>
      <p><b>Make it in the workroom.</b> Pick the pattern, a fabric bolt and a dye. Then <b>cut</b> by tracing the chalk line with your finger, <b>sew</b> by tapping when the needle is in the green, add <b>trims</b>, and <b>press</b> it. Hold to heat the iron and let go at the right heat for that fabric.</p>
      <p><b>Grow the shop.</b> Earn money and stars. Buy fabrics, dyes, trims, patterns and better tools from the Supplies catalogue.</p>
      <p><b>Write history.</b> Earn enough stars and a famous patron will visit. Impress them, and the shop passes to the next generation in a new era of fashion.</p>
      </div><button class="btn" data-v="ok" style="width:100%;margin-top:8px">Got it</button>`);
  }

  // ---------- dialogue ----------
  // Returns a promise. With choices, resolves to the chosen index.
  function talk(who, text, { choices = null, thought = false } = {}) {
    return new Promise(resolve => {
      stage.querySelectorAll('.dialogue, .catcher').forEach(n => n.remove());
      const catcher = add('<div class="layer catcher" style="z-index:19"></div>');
      const box = add(`<div class="dialogue ${thought ? 'thought' : ''}">${who ? `<div class="who">${esc(who)}</div>` : ''}<div class="txt"></div></div>`);
      const txt = box.querySelector('.txt');
      let i = 0, done = false, timer;
      const finishTyping = () => {
        clearInterval(timer); txt.textContent = text; done = true;
        if (choices) {
          const c = html(`<div class="choices">${choices.map((c, k) => `<button class="btn ${k ? 'alt' : ''}" data-k="${k}">${c}</button>`).join('')}</div>`);
          box.appendChild(c);
          c.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); Sound.sfx('click'); cleanup(); resolve(+b.dataset.k); });
        } else box.appendChild(html('<div class="next">tap ▸</div>'));
      };
      const cleanup = () => { box.remove(); catcher.remove(); };
      timer = setInterval(() => { i += 2; txt.textContent = text.slice(0, i); if (i >= text.length) finishTyping(); }, 28);
      const tap = e => {
        if (e.target.closest('button')) return;
        if (!done) { finishTyping(); return; }
        if (!choices) { Sound.sfx('click'); cleanup(); resolve(); }
      };
      box.addEventListener('pointerdown', tap); catcher.addEventListener('pointerdown', tap);
    });
  }

  // ---------- actors ----------
  function actor(svg, { left, top, width, cls = '' }) {
    const a = add(`<div class="actor ${cls}" style="left:${left}px;top:${top}px;width:${width}px;height:${width * 404 / 160}px">${svg}</div>`);
    return a;
  }
  function customerSVG(c, outfit, mood) {
    return Art.character({ body: c.body, skin: c.skin, hair: c.hair, hairColor: c.hairColor, beard: c.beard, mood, outfit: outfit || c.base, base: c.base });
  }
  function heirSVG(eIdx, mood = 'happy') {
    const e = ERAS[eIdx], L = e.heirLook;
    const g = Object.entries(GARMENTS).find(([, g]) => g.era === eIdx && (g.who === L.body || g.who === 'any') && !g.accessory);
    return Art.character({ body: L.body, skin: SKINS[L.skin], hair: L.hair, hairColor: L.hairColor, mood,
      outfit: { garment: g[0], mat: g[1].mats[0], color: e.colors[1], trim: g[1].trims[0] } });
  }

  // ---------- customers ----------
  function baseOutfit(body) {
    const opts = eraGarments().filter(([, g]) => !g.accessory && (g.who === body || g.who === 'any'));
    const [gid, g] = pick(opts.length ? opts : Object.entries(GARMENTS).filter(([, g]) => !g.accessory && (g.who === body || g.who === 'any')));
    return { garment: gid, mat: g.mats[0], color: pick(['brown', 'gray', 'navy', 'beige', 'olive', 'sage', 'rust', 'plum']), trim: 'none' };
  }
  function makeCustomer() {
    const e = era();
    if (S.patronPending && S.custIdx === 0) {
      const p = e.patron;
      return { name: p.name, body: p.who, skin: SKINS[p.skin != null ? p.skin : 1], hair: p.hair, hairColor: p.hairColor, beard: null,
        base: baseOutfit(p.who), garment: p.garment, mat: p.mat, color: p.color, trim: p.trim, patron: true };
    }
    const avail = eraGarments().filter(([id]) => owns('patterns', id));
    const [gid, g] = pick(avail);
    const body = g.who === 'any' ? pick(['f', 'm']) : g.who;
    const hairList = body === 'f' ? e.hairF : e.hairM;
    return {
      name: pick(body === 'f' ? e.namesF : e.namesM), body, skin: pick(SKINS), hair: pick(hairList), hairColor: pick(HAIR_COLORS),
      beard: body === 'm' && Math.random() < e.beard ? pick(['mustache', 'full']) : null,
      base: baseOutfit(body), garment: gid,
      mat: pickPref(g.mats, m => owns('mats', m), 0.75),
      color: pickPref(e.colors, c => owns('colors', c), 0.7),
      trim: pickPref(g.trims, t => owns('trims', t), 0.75),
      line: pick(e.lines), patron: false,
    };
  }
  const TRIM_PHRASE = { none: 'no trim at all', buttons: 'handsome buttons', lace: 'lace trim', ribbon: 'a ribbon sash', embroidery: 'embroidery',
    fringe: 'fringe', beads: 'beading', rhinestones: 'rhinestones', patches: 'some patches', studs: 'studs', print: 'a graphic print' };
  const GREET = { victorian: 'Good day.', twenties: 'Hiya, darling!', fifties: 'Hi there!', seventies: 'Hey, far out shop!', nineties: 'Hey. Cool store.', modern: 'Hi! Love the energy in here.' };

  function ticketHTML(o, work) {
    const g = GARMENTS[o.garment];
    const chk = ok => ok ? ' <span class="ok">✓</span>' : '';
    return `<div class="ticket">
      <b>${esc(o.name)}</b>
      <div class="row">✂ ${esc(g.name)}${chk(work && work.garment === o.garment)}</div>
      <div class="row">▤ ${esc(MATERIALS[o.mat].name)}${chk(work && work.mat === o.mat)}</div>
      <div class="row"><span class="dot" style="background:${COLORS[o.color].hex}"></span> ${esc(COLORS[o.color].name)}${chk(work && work.color === o.color)}</div>
      <div class="row">✿ ${esc(TRIMS[o.trim].name)}${chk(work && work.trim === o.trim && work.step > 5)}</div>
    </div>`;
  }

  // ---------- scoring ----------
  function evaluate(o, w) {
    const g = GARMENTS[o.garment];
    const right = w.garment === o.garment;
    const mat = w.mat === o.mat ? 1 : g.mats.includes(w.mat) ? 0.6 : 0.2;
    const col = w.color === o.color ? 1 : era().colors.includes(w.color) ? 0.5 : 0.2;
    const trim = w.trim === o.trim ? 1 : g.trims.includes(w.trim) ? 0.5 : w.trim === 'none' ? 0.3 : 0.2;
    const design = right ? mat * 0.35 + col * 0.35 + trim * 0.3 : 0.1;
    const craft = (w.cut + w.sew + w.press) / 3;
    const total = design * 0.6 + craft * 0.4;
    const stars = clamp(Math.round(total * 5), 1, 5);
    const lines = [];
    if (!right) lines.push(`This is… ${an(lc(GARMENTS[w.garment].name))}? I ordered ${an(lc(g.name))}!`);
    else {
      lines.push(w.mat === o.mat ? `${MATERIALS[w.mat].name}! Exactly what I wanted.` : `${MATERIALS[w.mat].name}? I did ask for ${lc(MATERIALS[o.mat].name)}${mat > 0.5 ? ', but it works' : ''}.`);
      lines.push(w.color === o.color ? `And the ${lc(COLORS[o.color].name)} is perfect.` : `I was hoping for ${lc(COLORS[o.color].name)}, though.`);
      if (o.trim !== 'none') lines.push(w.trim === o.trim ? `Oh, the ${lc(TRIMS[o.trim].name)} is lovely!` : `Where's the ${lc(TRIMS[o.trim].name)} I asked for?`);
      else if (w.trim !== 'none') lines.push(`A little fussier than I wanted, but fine.`);
    }
    if (w.cut < 0.5) lines.push('The edges look a bit ragged…');
    if (w.sew < 0.5) lines.push('Some of the seams are puckered.');
    if (w.press < 0.35) lines.push('Is that… a scorch mark?');
    else if (w.press < 0.6) lines.push("It's still a touch wrinkled.");
    if (craft > 0.85) lines.push('And the craftsmanship is impeccable!');
    return { stars, total, design, craft, lines };
  }

  // ---------- SCREEN: title ----------
  function title() {
    const saved = loadSave();
    S = saved || null;
    const eIdx = saved ? saved.era : 0;
    stage.className = 'era-' + ERAS[eIdx].id;
    const sc = Art.shopScene(ERAS[eIdx], saved || { owned: { mats: ['cotton', 'wool', 'silk', 'velvet'], colors: ERAS[eIdx].colors } }, saved ? eIdx : 0);
    stage.innerHTML = sc.back + sc.front + '<div class="layer" style="background:rgba(20,10,14,.45)"></div>';
    add(`<div class="actor" style="left:600px;top:105px;width:110px;height:278px;z-index:6;filter:drop-shadow(0 8px 10px rgba(0,0,0,.4))">${Art.garmentPreview(eIdx === 0 ? 'ballgown' : Object.keys(GARMENTS).find(k => GARMENTS[k].era === eIdx), 'satin', 'crimson', 'lace')}</div>`);
    const card = add(`<div class="panel title-card">
      <h1>Stitch &amp; Style</h1>
      <div class="sub">A Century of Fashion</div>
      <div class="btns">
        ${saved ? `<button class="btn" data-a="cont">Continue · ${ERAS[saved.era].year}, Day ${saved.day}</button>` : ''}
        <button class="btn ${saved ? 'alt' : ''}" data-a="new">${saved ? 'New Game' : 'Open the Shop'}</button>
        <button class="btn alt small" data-a="help">How to play</button>
      </div>
      <p class="muted" style="font-size:11px;margin:12px 0 0">Sound on! (iPhone: flip the silent switch off)</p>
    </div>`);
    const startMusic = () => { Sound.init(); loadSettings(); Sound.music('title'); };
    card.querySelector('[data-a="new"]').onclick = async () => {
      startMusic(); Sound.sfx('click');
      if (saved) {
        const v = await modal(`<h2>Start over?</h2><p>This erases your current shop and all progress.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn alt" data-v="no">Cancel</button><button class="btn" data-v="yes">Start over</button></div>`);
        if (v !== 'yes') return;
      }
      newState(); save(); await story(0); shopScreen();
    };
    const c = card.querySelector('[data-a="cont"]');
    if (c) c.onclick = () => { startMusic(); Sound.sfx('click'); S = saved; S.settings = S.settings || { music: true, sfx: true }; resume(); };
    card.querySelector('[data-a="help"]').onclick = () => { startMusic(); help(); };
    // music starts on first touch anywhere
    stage.addEventListener('pointerdown', startMusic, { once: true });
  }

  function resume() {
    if (S.work) return workroom();
    shopScreen();
  }

  // ---------- SCREEN: story ----------
  function story(eIdx, extraLines) {
    return new Promise(resolve => {
      const e = ERAS[eIdx];
      stage.className = 'era-' + e.id;
      Sound.music(e.id);
      const lines = extraLines || e.story;
      stage.innerHTML = `<div class="story">
        <div class="portrait">${heirSVG(eIdx)}</div>
        <div style="flex:1">
          <div class="year">${e.year}</div>
          <div class="era-name">${esc(e.name.toUpperCase())}</div>
          <div class="lines"></div>
        </div>
        <div class="tap">tap to continue ▸</div>
      </div><div class="fade"></div>`;
      const box = stage.querySelector('.lines');
      let i = 0;
      const next = () => {
        if (i < lines.length) { box.appendChild(html(`<p>${esc(lines[i])}</p>`)); Sound.sfx('page'); i++; }
        else { stage.querySelector('.story').removeEventListener('pointerdown', next); resolve(); }
      };
      next();
      stage.querySelector('.story').addEventListener('pointerdown', next);
    });
  }

  // ---------- SCREEN: shop ----------
  const CUST_POS = { left: 380, top: 168, width: 110 };
  let custEl = null;

  function renderShop({ night = false, catalogue = true } = {}) {
    setEraClass();
    const e = era();
    const sc = Art.shopScene(e, S, S.era);
    stage.innerHTML = sc.back;
    // mannequin with the last garment made (or an era classic)
    const showcase = S.lastMade || (() => { const [gid, g] = eraGarments()[0]; return { garment: gid, mat: g.mats[0], color: e.colors[0], trim: g.trims[0] }; })();
    add(`<div class="actor" style="left:318px;top:126px;width:84px;height:212px;z-index:3">${Art.character({ body: GARMENTS[showcase.garment].who === 'm' ? 'm' : 'f', mannequin: true, outfit: showcase })}</div>`);
    // shopkeeper behind the counter
    actor(heirSVG(S.era, 'neutral'), { left: 612, top: 116, width: 100, cls: 'idle' }).style.zIndex = 4;
    const fg = html(sc.front); fg.style.zIndex = 7; stage.appendChild(fg);
    if (night) add('<div class="night"></div>');
    stage.insertAdjacentHTML('beforeend', hudHTML({ catalogue }));
    bindHud(async () => { await catalogue_(); });
  }

  function placeCustomer(c, outfit, mood, entering) {
    const startLeft = 214;
    add(`<div class="shadow" style="left:${(entering ? startLeft : CUST_POS.left) + 10}px;top:${CUST_POS.top + 258}px;width:90px"></div>`);
    custEl = actor(customerSVG(c, outfit, mood), { left: entering ? startLeft : CUST_POS.left, top: CUST_POS.top, width: CUST_POS.width, cls: entering ? 'walking' : 'idle' });
    custEl.style.zIndex = 8;
    return custEl;
  }
  function setCustomerLook(c, outfit, mood) { if (custEl) custEl.innerHTML = customerSVG(c, outfit, mood); }

  async function walkIn(c) {
    Sound.sfx('bell'); Sound.sfx('door');
    const bell = stage.querySelector('.shopbell'); if (bell) bell.animate([{ transform: 'rotate(-20deg)' }, { transform: 'rotate(20deg)' }, { transform: 'rotate(0)' }], { duration: 600, iterations: 2 });
    const el = placeCustomer(c, null, 'neutral', true);
    el.style.opacity = '0'; el.style.transition = 'left 1.8s linear, opacity .4s';
    await wait(60);
    el.style.opacity = '1'; el.style.left = CUST_POS.left + 'px';
    const sh = stage.querySelector('.shadow'); if (sh) sh.style.left = (CUST_POS.left + 10) + 'px';
    await wait(1850);
    el.classList.remove('walking'); el.classList.add('idle');
  }
  async function walkOut() {
    if (!custEl) return;
    custEl.classList.remove('idle'); custEl.classList.add('walking');
    custEl.style.transition = 'left 1.6s linear, opacity .5s 1.1s';
    custEl.style.left = '214px'; custEl.style.opacity = '0';
    const sh = stage.querySelector('.shadow'); if (sh) { sh.style.transition = 'left 1.6s linear, opacity .5s 1.1s'; sh.style.left = '224px'; sh.style.opacity = '0'; }
    await wait(900); Sound.sfx('door'); await wait(800);
  }

  function missingFor(o) {
    const miss = [];
    if (!owns('patterns', o.garment)) miss.push(`the ${GARMENTS[o.garment].name} pattern`);
    if (!owns('mats', o.mat)) miss.push(lc(MATERIALS[o.mat].name));
    if (!owns('colors', o.color)) miss.push(lc(COLORS[o.color].name) + ' dye');
    if (!owns('trims', o.trim)) miss.push(lc(TRIMS[o.trim].name));
    return miss;
  }

  async function shopScreen() {
    S.phase = 'shop'; save();
    Sound.music(era().id);
    if (S.custIdx >= CUSTOMERS_PER_DAY) return evening();
    renderShop();
    const isNew = !S.order;
    if (isNew) { S.order = makeCustomer(); save(); }
    const o = S.order, g = GARMENTS[o.garment];
    if (isNew) await walkIn(o); else placeCustomer(o, null, 'neutral', false);
    stage.insertAdjacentHTML('beforeend', ticketHTML(o));

    if (isNew) {
      if (o.patron) {
        if (!owns('patterns', o.garment)) S.owned.patterns.push(o.garment);
        save();
        Sound.sfx('fanfare');
        await talk(o.name, era().patron.intro);
        await talk(heirFirst(), `(${o.name} hands me a sketch of the design. A pattern for a ${g.name}! This could change everything.)`, { thought: true });
      } else {
        await talk(o.name, `${GREET[era().id]} I'm ${o.name}. I need ${an(lc(g.name))} for ${o.line}.`);
        await talk(o.name, o.trim === 'none'
          ? `I'd love it in ${lc(COLORS[o.color].name)} ${lc(MATERIALS[o.mat].name)}. Keep it simple, no trim.`
          : `I'd love it in ${lc(COLORS[o.color].name)} ${lc(MATERIALS[o.mat].name)}, with ${TRIM_PHRASE[o.trim]}.`);
      }
    }
    for (;;) {
      const miss = missingFor(o);
      const note = miss.length ? `We're out of ${miss.join(', ')}. The supplier catalogue should have it.` : `I have everything I need for this one.`;
      const ch = await talk(heirFirst(), note, { choices: ['To the workroom ✂', '📖 Supplies'], thought: true });
      if (ch === 0) break;
      await catalogue_();
    }
    S.work = { step: 0, garment: null, mat: null, color: null, trim: 'none', cut: 0, sew: 0, press: 0 };
    save();
    workroom();
  }

  // ---------- SCREEN: workroom ----------
  const STEPS = ['Pattern', 'Fabric', 'Dye', 'Cut', 'Sew', 'Trim', 'Press'];

  function workroom() {
    S.phase = 'work'; save();
    setEraClass();
    Sound.music(era().id);
    const w = S.work, o = S.order;
    stage.innerHTML = Art.workroomScene(era(), S.owned.tools);
    stage.insertAdjacentHTML('beforeend', ticketHTML(o, w));
    stage.insertAdjacentHTML('beforeend', `<div class="steps">${STEPS.map((s, i) => `<span class="${i === w.step ? 'on' : i < w.step ? 'done' : ''}">${i < w.step ? '✓ ' : ''}${s}</span>`).join('')}</div>`);
    const prev = add(`<div class="work-preview"></div>`);
    const drawPreview = () => {
      prev.innerHTML = w.garment
        ? Art.character({ body: GARMENTS[w.garment].who === 'm' ? 'm' : 'f', mannequin: true, outfit: { garment: w.garment, mat: w.mat || 'cotton', color: w.color || 'ivory', trim: w.step >= 5 ? w.trim : 'none' } })
        : Art.character({ body: 'f', mannequin: true });
    };
    drawPreview();
    const area = add('<div class="work-area"></div>');
    const next = (advance = true) => { if (advance) w.step++; save(); workroom(); };
    const nextBtn = (enabled, label = 'Next ▸') => {
      const b = add(`<button class="btn work-next" ${enabled ? '' : 'disabled'}>${label}</button>`);
      b.onclick = () => { Sound.sfx('select'); next(); };
      return b;
    };
    const backBtn = () => {
      if (w.step === 0) {
        const b = add('<button class="btn alt work-back">◂ Shop</button>');
        b.onclick = () => { Sound.sfx('click'); S.work = null; save(); shopScreen(); };
      } else if (w.step <= 2) {
        const b = add('<button class="btn alt work-back">◂ Back</button>');
        b.onclick = () => { Sound.sfx('click'); w.step--; save(); workroom(); };
      }
    };

    switch (w.step) {
      case 0: { // pattern
        const list = eraGarments();
        area.innerHTML = `<div class="work-head"><div class="title">Choose a pattern</div><div class="hint">Your pattern book for the ${esc(era().name)}. Locked patterns can be bought in Supplies.</div></div>
          <div class="grid" style="grid-template-columns:repeat(5,1fr)">${list.map(([id, g]) => {
            const own = owns('patterns', id);
            return `<div class="card ${w.garment === id ? 'on' : ''} ${own ? '' : 'locked'}" data-id="${id}">${own ? '' : '<span class="tag">🔒</span>'}
              <div style="width:86px;height:170px">${Art.garmentPreview(id)}</div>${esc(g.name)}</div>`;
          }).join('')}</div>`;
        const nb = nextBtn(!!w.garment);
        area.querySelectorAll('.card').forEach(c => c.onclick = () => {
          const id = c.dataset.id;
          if (!owns('patterns', id)) { toast(`🔒 The ${GARMENTS[id].name} pattern costs ${GARMENTS[id].price}. Buy it in Supplies.`); Sound.sfx('miss'); return; }
          w.garment = id; Sound.sfx('page'); save();
          area.querySelectorAll('.card').forEach(x => x.classList.toggle('on', x === c));
          nb.disabled = false; drawPreview();
        });
        backBtn();
        break;
      }
      case 1: { // fabric
        const mats = S.owned.mats;
        area.innerHTML = `<div class="work-head"><div class="title">Pull a bolt of fabric</div><div class="hint" id="mat-hint">Tap a bolt from the shelf.</div></div>
          <div class="grid" style="grid-template-columns:repeat(6,1fr)">${mats.map(m => `<div class="card ${w.mat === m ? 'on' : ''}" data-id="${m}">${Art.bolt(m, w.color || 'ivory', 40, 84)}${esc(MATERIALS[m].name)}</div>`).join('')}</div>`;
        const nb = nextBtn(!!w.mat);
        const hint = area.querySelector('#mat-hint');
        if (w.mat) hint.textContent = MATERIALS[w.mat].desc;
        area.querySelectorAll('.card').forEach(c => c.onclick = () => {
          w.mat = c.dataset.id; Sound.sfx('select'); save();
          area.querySelectorAll('.card').forEach(x => x.classList.toggle('on', x === c));
          hint.textContent = MATERIALS[w.mat].desc; nb.disabled = false; drawPreview();
        });
        backBtn();
        break;
      }
      case 2: { // dye
        const cols = S.owned.colors;
        area.innerHTML = `<div class="work-head"><div class="title">Dye the fabric</div><div class="hint">Pick a dye pot.</div></div>
          <div class="grid" style="grid-template-columns:repeat(8,1fr)">${cols.map(c => `<div class="card ${w.color === c ? 'on' : ''}" data-id="${c}" style="padding:4px">${Art.dyeJar(c, 34)}<span style="font-size:11px">${esc(COLORS[c].name)}</span></div>`).join('')}</div>`;
        const nb = nextBtn(!!w.color);
        area.querySelectorAll('.card').forEach(c => c.onclick = () => {
          w.color = c.dataset.id; Sound.sfx('select'); save();
          area.querySelectorAll('.card').forEach(x => x.classList.toggle('on', x === c));
          nb.disabled = false; drawPreview();
        });
        backBtn();
        break;
      }
      case 3: cutGame(area).then(score => { w.cut = score; next(); }); break;
      case 4: sewGame(area).then(score => { w.sew = score; next(); }); break;
      case 5: { // trims
        const trims = S.owned.trims;
        area.innerHTML = `<div class="work-head"><div class="title">Add finishing touches</div><div class="hint">Choose a trim (or none).</div></div>
          <div class="grid" style="grid-template-columns:repeat(6,1fr)">${trims.map(t => `<div class="card ${w.trim === t ? 'on' : ''}" data-id="${t}">${Art.trimIcon(t, 46)}${esc(TRIMS[t].name)}</div>`).join('')}</div>`;
        nextBtn(true);
        area.querySelectorAll('.card').forEach(c => c.onclick = () => {
          w.trim = c.dataset.id; Sound.sfx('select'); save();
          area.querySelectorAll('.card').forEach(x => x.classList.toggle('on', x === c));
          prev.innerHTML = Art.character({ body: GARMENTS[w.garment].who === 'm' ? 'm' : 'f', mannequin: true, outfit: { garment: w.garment, mat: w.mat, color: w.color, trim: w.trim } });
        });
        break;
      }
      case 6: pressGame(area).then(score => { w.press = score; save(); fitting(); }); break;
    }
  }

  // ---------- MINI-GAME: cutting ----------
  const CUT_PATHS = {
    dress: 'M38 4 L62 4 L67 30 L60 42 L90 96 L10 96 L40 42 L33 30 Z',
    coat: 'M32 4 L68 4 L84 16 L76 28 L70 24 L72 96 L28 96 L30 24 L24 28 L16 16 Z',
    top: 'M30 8 L42 8 Q50 16 58 8 L70 8 L92 26 L82 40 L72 32 L72 94 L28 94 L28 32 L18 40 L8 26 Z',
    jacket: 'M30 12 L42 12 Q50 20 58 12 L70 12 L92 32 L82 46 L72 38 L72 86 L28 86 L28 38 L18 46 L8 32 Z',
    pants: 'M26 4 L74 4 L82 96 L58 96 L50 38 L42 96 L18 96 Z',
    skirt: 'M36 8 L64 8 L92 88 Q50 98 8 88 Z',
    hat: 'M20 68 Q20 22 50 20 Q80 22 80 68 L94 76 Q50 90 6 76 Z',
  };
  const scalePath = (d, s, tx, ty) => d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, x, y) => `${(+x * s + tx).toFixed(1)} ${(+y * s + ty).toFixed(1)}`);

  function cutGame(area) {
    return new Promise(resolve => {
      const w = S.work;
      const tol = TOOLS.shears.items[S.owned.tools.shears].tol;
      const fab = Art.fabric(w.mat, COLORS[w.color].hex);
      const d = scalePath(CUT_PATHS[GARMENTS[w.garment].cut], 3.0, 346, 128);
      area.innerHTML = `<div class="work-head"><div class="title">Cut the pattern</div><div class="hint">Trace the chalk line with your finger. Start at the ✂ and go all the way round.</div></div>`;
      const svg = html(`<svg class="mg-svg" viewBox="0 0 800 450"><defs>${fab.defs}</defs>
        <rect x="316" y="114" width="368" height="328" rx="6" fill="rgba(0,0,0,.25)" transform="translate(4 6)"/>
        <rect x="316" y="114" width="368" height="328" rx="6" fill="${fab.fill}" stroke="rgba(0,0,0,.3)"/>
        <path id="cutline" d="${d}" fill="rgba(255,255,255,.08)" stroke="#fff" stroke-width="2.5" stroke-dasharray="7 6" opacity=".9"/>
        <g id="covered"></g>
        <path id="trail" d="" fill="none" stroke="rgba(30,10,20,.5)" stroke-width="1.5"/>
        <text id="start" font-size="26" fill="#fff" stroke="#000" stroke-width=".6">✂</text>
        <g id="shears" opacity="0"><text font-size="34" x="-12" y="12" fill="#fff" stroke="#222" stroke-width=".8">✂</text></g>
      </svg>`);
      stage.appendChild(svg);
      const label = add('<div class="meter-label" style="left:214px;top:130px;width:96px">Cut 0%</div>');
      const doneBtn = add('<button class="btn work-next" style="display:none">Finish cut ▸</button>');
      const pathEl = svg.querySelector('#cutline');
      const len = pathEl.getTotalLength();
      const N = Math.ceil(len / 5);
      const pts = Array.from({ length: N }, (_, i) => pathEl.getPointAtLength(i * len / N));
      const covered = new Array(N).fill(false);
      let coveredCount = 0, on = 0, off = 0, last = null, sinceSnip = 0, trail = '', finished = false;
      const startEl = svg.querySelector('#start'); startEl.setAttribute('x', pts[0].x - 10); startEl.setAttribute('y', pts[0].y + 8);
      const shears = svg.querySelector('#shears'), covG = svg.querySelector('#covered'), trailEl = svg.querySelector('#trail');
      const score = () => { const cov = coveredCount / N; const acc = on + off ? on / (on + off) : 0; return clamp(cov * (0.35 + 0.65 * acc), 0, 1); };
      const finish = () => {
        if (finished) return; finished = true;
        doneBtn.remove(); label.remove(); svg.remove();
        const sc = score();
        Sound.sfx(sc > 0.85 ? 'perfect' : sc > 0.6 ? 'good' : 'miss');
        resolve(sc);
      };
      doneBtn.onclick = finish;
      const visit = p => {
        let best = 1e9;
        for (let i = 0; i < N; i++) {
          const dx = pts[i].x - p.x, dy = pts[i].y - p.y, dd = dx * dx + dy * dy;
          if (dd < best) best = dd;
          if (dd <= tol * tol && !covered[i]) {
            covered[i] = true; coveredCount++;
            covG.insertAdjacentHTML('beforeend', `<circle cx="${pts[i].x.toFixed(1)}" cy="${pts[i].y.toFixed(1)}" r="2.6" fill="#ffe08a"/>`);
          }
        }
        if (Math.sqrt(best) <= tol) on++; else off++;
        return Math.sqrt(best) <= tol;
      };
      const move = e => {
        const p = svgPoint(svg, e);
        shears.setAttribute('transform', `translate(${p.x} ${p.y})`);
        if (last) {
          const dist = Math.hypot(p.x - last.x, p.y - last.y);
          const steps = Math.max(1, Math.ceil(dist / 4));
          let onLine = false;
          for (let s = 1; s <= steps; s++) onLine = visit({ x: last.x + (p.x - last.x) * s / steps, y: last.y + (p.y - last.y) * s / steps }) || onLine;
          sinceSnip += dist;
          if (sinceSnip > 28) { sinceSnip = 0; if (onLine) Sound.sfx('snip'); }
          trail += ` L${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        } else { visit(p); trail += ` M${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }
        trailEl.setAttribute('d', trail);
        last = p;
        const cov = coveredCount / N, acc = on + off ? on / (on + off) : 0;
        label.innerHTML = `Cut ${Math.round(cov * 100)}%<br>Accuracy ${Math.round(acc * 100)}%`;
        if (cov >= 0.7) doneBtn.style.display = '';
        if (cov >= 0.97) finish();
      };
      svg.addEventListener('pointerdown', e => { e.preventDefault(); svg.setPointerCapture(e.pointerId); last = null; shears.setAttribute('opacity', '1'); startEl.setAttribute('opacity', '0'); move(e); });
      svg.addEventListener('pointermove', e => { if (last) move(e); });
      const up = () => { last = null; shears.setAttribute('opacity', '0'); };
      svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    });
  }

  // ---------- MINI-GAME: sewing ----------
  function sewGame(area) {
    return new Promise(resolve => {
      const tool = TOOLS.sewing.items[S.owned.tools.sewing];
      const STITCHES = 6;
      const speed = (0.75 + S.era * 0.07 + Math.min(S.day, 8) * 0.02) * tool.speed;
      const zoneW = tool.zone;
      const fab = Art.fabric(S.work.mat, COLORS[S.work.color].hex);
      area.innerHTML = `<div class="work-head"><div class="title">Sew the seams</div><div class="hint">Tap anywhere when the needle is inside the green. Dark green is perfect!</div></div>`;
      const X0 = 240, W = 520;
      const svg = html(`<svg class="mg-svg" viewBox="0 0 800 450"><defs>${fab.defs}</defs>
        <g transform="translate(600 214)">${Art.toolIcon('sewing', S.owned.tools.sewing, 110)}</g>
        <rect x="${X0}" y="300" width="${W}" height="90" rx="6" fill="${fab.fill}" stroke="rgba(0,0,0,.3)"/>
        <path d="M${X0 + 20} 345 H${X0 + W - 20}" stroke="rgba(255,255,255,.6)" stroke-dasharray="4 6" stroke-width="2"/>
        <g id="stitches"></g>
        <rect x="${X0}" y="150" width="${W}" height="54" rx="12" fill="#f6ecd8" stroke="#8a6a4a" stroke-width="3"/>
        <rect id="zone" y="150" height="54" fill="rgba(58,138,90,.35)"/>
        <rect id="perfect" y="150" height="54" fill="rgba(58,138,90,.6)"/>
        <g id="needle"><rect x="-2.5" y="140" width="5" height="74" rx="2" fill="#3a3a44"/><circle cx="0" cy="146" r="5" fill="#c2456b"/></g>
        ${Array.from({ length: STITCHES }, (_, i) => `<circle class="pip" cx="${X0 + 30 + i * 30}" cy="232" r="8" fill="rgba(255,255,255,.35)" stroke="rgba(0,0,0,.3)"/>`).join('')}
      </svg>`);
      stage.appendChild(svg);
      const zone = svg.querySelector('#zone'), perfect = svg.querySelector('#perfect'), needle = svg.querySelector('#needle'), pips = svg.querySelectorAll('.pip'), stG = svg.querySelector('#stitches');
      let zl = 0, pos = 0, dir = 1, lastT = performance.now(), raf = 0, results = [], locked = false;
      const place = () => {
        zl = 0.05 + Math.random() * (0.9 - zoneW);
        zone.setAttribute('x', X0 + zl * W); zone.setAttribute('width', zoneW * W);
        perfect.setAttribute('x', X0 + (zl + zoneW * 0.35) * W); perfect.setAttribute('width', zoneW * 0.3 * W);
      };
      place();
      const loop = t => {
        const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
        pos += dir * speed * dt;
        if (pos > 1) { pos = 1; dir = -1; } else if (pos < 0) { pos = 0; dir = 1; }
        needle.setAttribute('transform', `translate(${X0 + pos * W} 0)`);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      svg.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (locked) return;
        const off = Math.abs(pos - (zl + zoneW / 2));
        const r = off <= zoneW * 0.15 ? 'perfect' : off <= zoneW / 2 ? 'good' : 'miss';
        results.push(r);
        const i = results.length - 1;
        pips[i].setAttribute('fill', r === 'perfect' ? '#3a8a5a' : r === 'good' ? '#a8d8b0' : '#c84a3a');
        const sx = X0 + 20 + i * ((W - 40) / STITCHES);
        stG.insertAdjacentHTML('beforeend', `<path d="M${sx} 345 h${(W - 40) / STITCHES - 6}" stroke="${r === 'miss' ? '#c84a3a' : '#222'}" stroke-width="3" ${r === 'miss' ? 'stroke-dasharray="3 5" transform="rotate(4 ' + sx + ' 345)"' : ''}/>`);
        Sound.sfx('stitch'); setTimeout(() => Sound.sfx('stitch'), 70); setTimeout(() => Sound.sfx(r), 120);
        const v = add(`<div class="verdict ${r}" style="left:${X0 + pos * W - 50}px;top:96px">${r === 'perfect' ? 'Perfect!' : r === 'good' ? 'Nice!' : 'Oops!'}</div>`);
        setTimeout(() => v.remove(), 700);
        locked = true;
        if (results.length >= STITCHES) {
          setTimeout(() => {
            cancelAnimationFrame(raf); svg.remove();
            resolve(results.reduce((a, r) => a + (r === 'perfect' ? 1 : r === 'good' ? 0.72 : 0.15), 0) / STITCHES);
          }, 800);
        } else setTimeout(() => { place(); locked = false; }, 300);
      });
    });
  }

  // ---------- MINI-GAME: pressing ----------
  function pressGame(area) {
    return new Promise(resolve => {
      const w = S.work;
      const tool = TOOLS.iron.items[S.owned.tools.iron];
      const heat = MATERIALS[w.mat].heat;
      const target = { low: 0.25, med: 0.5, high: 0.75 }[heat];
      const fab = Art.fabric(w.mat, COLORS[w.color].hex);
      const d = scalePath(CUT_PATHS[GARMENTS[w.garment].cut], 2.75, 300, 128);
      area.innerHTML = `<div class="work-head"><div class="title">Press the garment</div><div class="hint">Hold the button to heat the iron and let go at the right heat. ${esc(MATERIALS[w.mat].name)}: ${esc(MATERIALS[w.mat].desc)}</div></div>`;
      const GX = 712, GT = 120, GH = 270;
      const svg = html(`<svg class="mg-svg" viewBox="0 0 800 450" style="pointer-events:none"><defs>${fab.defs}
          <linearGradient id="therm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5aa0e0"/><stop offset=".5" stop-color="#f0c040"/><stop offset="1" stop-color="#e0402a"/></linearGradient></defs>
        <path d="${d}" fill="${fab.fill}" stroke="rgba(0,0,0,.35)"/>
        <path id="wrinkles" d="${d}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="10" stroke-dasharray="2 14"/>
        <g id="steam" opacity="0">${[0, 1, 2].map(i => `<circle cx="${400 + i * 30}" cy="240" r="16" fill="#fff" opacity=".7"/>`).join('')}</g>
        <g id="iron" style="transform:translate(560px,300px)">${Art.toolIcon('iron', S.owned.tools.iron, 100)}</g>
        <rect x="${GX}" y="${GT}" width="34" height="${GH}" rx="17" fill="#f6ecd8" stroke="#8a6a4a" stroke-width="3"/>
        <rect id="merc" x="${GX + 7}" width="20" rx="10" fill="url(#therm)"/>
        ${[['LOW', 0.25], ['MED', 0.5], ['HIGH', 0.75]].map(([l, v]) => `<path d="M${GX - 6} ${GT + GH - v * GH} h-8" stroke="#fff" stroke-width="2"/><text x="${GX - 18}" y="${GT + GH - v * GH + 4}" text-anchor="end" font-size="12" font-weight="700" fill="#fff" stroke="#000" stroke-width=".4">${l}</text>`).join('')}
        <path id="mark" d="M${GX + 38} 0 l10 -6 v12z" fill="#fff"/>
      </svg>`);
      stage.appendChild(svg);
      const merc = svg.querySelector('#merc'), mark = svg.querySelector('#mark'), iron = svg.querySelector('#iron'), steam = svg.querySelector('#steam'), wr = svg.querySelector('#wrinkles');
      const btn = add('<button class="btn gold" style="position:absolute;left:540px;top:396px;z-index:23;width:190px">🔥 Hold to heat</button>');
      const label = add('<div class="meter-label" style="left:214px;top:130px">Press 1 of 2</div>');
      let temp = 0, heating = false, raf = 0, lastT = 0, presses = [], busy = false, tick = 0;
      const draw = () => {
        const h = clamp(temp, 0, 1) * (GH - 14);
        merc.setAttribute('y', GT + GH - 7 - h); merc.setAttribute('height', h);
        mark.setAttribute('transform', `translate(0 ${GT + GH - clamp(temp, 0, 1) * GH})`);
      };
      draw();
      const loop = t => {
        const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
        if (heating) { temp += dt * 0.42; tick += dt; if (tick > 0.18) { tick = 0; Sound.sfx('heat'); } if (temp >= 1.02) release(); }
        draw();
        raf = requestAnimationFrame(loop);
      };
      const release = async () => {
        if (!heating) return;
        heating = false; busy = true; btn.classList.add('busy');
        const t = temp;
        const dd = Math.abs(t - target), half = tool.band / 2;
        let sc, verdict;
        if (dd <= half * 0.5) { sc = 1; verdict = 'perfect'; }
        else if (dd <= half) { sc = 0.8; verdict = 'good'; }
        else { sc = clamp(0.8 - (dd - half) * 3, 0.05, 0.6); verdict = 'miss'; }
        const scorched = t > target + half + 0.12;
        iron.animate([{ transform: 'translate(560px,300px)' }, { transform: 'translate(390px,200px)' }, { transform: 'translate(430px,230px)' }, { transform: 'translate(370px,250px)' }, { transform: 'translate(560px,300px)' }], { duration: 1100 });
        await wait(350);
        Sound.sfx(scorched ? 'sizzle' : 'steam');
        steam.setAttribute('opacity', '1'); steam.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-60px)', opacity: 0 }], { duration: 900 });
        if (scorched) svg.insertAdjacentHTML('beforeend', `<ellipse cx="${440 + presses.length * 40}" cy="250" rx="22" ry="12" fill="#3a2010" opacity=".55"/>`);
        else wr.setAttribute('opacity', String(Math.max(0, 1 - sc - presses.length * 0.3)));
        const v = add(`<div class="verdict ${verdict}" style="left:420px;top:110px">${scorched ? 'Scorched!' : verdict === 'perfect' ? 'Perfect!' : verdict === 'good' ? 'Nice!' : t < target ? 'Too cool!' : 'Too hot!'}</div>`);
        Sound.sfx(verdict === 'miss' ? 'miss' : verdict);
        presses.push(scorched ? Math.min(sc, 0.1) : sc);
        await wait(1100);
        v.remove(); steam.setAttribute('opacity', '0');
        temp = 0; busy = false; btn.classList.remove('busy');
        if (presses.length >= 2) {
          cancelAnimationFrame(raf); svg.remove(); btn.remove(); label.remove();
          resolve(presses.reduce((a, b) => a + b, 0) / presses.length);
        } else label.textContent = `Press ${presses.length + 1} of 2`;
      };
      btn.addEventListener('pointerdown', e => { e.preventDefault(); if (busy) return; btn.setPointerCapture(e.pointerId); heating = true; });
      btn.addEventListener('pointerup', release); btn.addEventListener('pointercancel', release);
      lastT = performance.now(); raf = requestAnimationFrame(loop);
    });
  }

  // ---------- SCREEN: fitting ----------
  async function fitting() {
    const o = S.order, w = S.work;
    const res = evaluate(o, w);
    const g = GARMENTS[o.garment];
    const basePay = o.patron ? era().patron.pay : g.pay;
    let pay = Math.round(basePay * (0.3 + 0.7 * res.total));
    const tip = res.stars === 5 && !o.patron ? Math.round(basePay * 0.25) : 0;
    pay += tip;
    const outfit = { garment: w.garment, mat: w.mat, color: w.color, trim: w.trim };
    const patronWin = o.patron && res.stars >= 3;
    // commit results before any animation (so a reload can't double-pay)
    S.money += pay; S.todayMoney += pay; S.todayStars += res.stars; S.served++; S.custIdx++;
    S.best = Math.max(S.best || 0, pay);
    if (!o.patron) S.rep += res.stars;
    S.lastMade = outfit; S.work = null; S.order = null;
    if (!S.patronPending && !S.finished && S.rep >= era().goal) S.patronPending = true;
    if (patronWin) S.patronPending = false;
    save();

    S.phase = 'fitting';
    renderShop({ catalogue: false });
    const mood = res.stars >= 4 ? 'happy' : res.stars === 3 ? 'neutral' : 'sad';
    placeCustomer(o, outfit, 'neutral', false);
    await wait(400);
    add('<div class="flash"></div>');
    const sp = add('<div class="sparkles"></div>');
    for (let i = 0; i < 18; i++) sp.insertAdjacentHTML('beforeend', `<i style="left:${CUST_POS.left + 10 + rand(100)}px;top:${CUST_POS.top + rand(250)}px;animation-delay:${(i * 0.06).toFixed(2)}s"></i>`);
    Sound.sfx('sparkle');
    setCustomerLook(o, outfit, 'wow');
    await wait(900);
    setCustomerLook(o, outfit, mood);
    if (res.stars >= 4) { custEl.classList.add('hop'); Sound.sfx('success'); } else if (res.stars <= 2) Sound.sfx('sad');
    const reaction = res.stars >= 5 ? "I'm speechless. It's perfect!" : res.stars === 4 ? 'Oh, this is wonderful!' : res.stars === 3 ? "It's nice. Not quite what I pictured, but nice." : res.stars === 2 ? 'Hmm… I suppose it will do.' : 'This is NOT what I asked for.';
    await talk(o.name, reaction + ' ' + res.lines.slice(0, 2).join(' '));
    if (res.lines.length > 2) await talk(o.name, res.lines.slice(2, 4).join(' '));

    // result card
    await new Promise(r => {
      const p = add(`<div class="panel" style="left:540px;top:60px;width:240px;text-align:center">
        <h2 style="margin:0">${o.patron ? 'Commission' : 'Order'} complete</h2>
        <div class="stars">${'★'.repeat(res.stars)}<span class="off">${'★'.repeat(5 - res.stars)}</span></div>
        <div style="font-size:13px;margin:4px 0">Design <b>${Math.round(res.design * 100)}%</b> · Craft <b>${Math.round(res.craft * 100)}%</b></div>
        <div style="font-size:26px;font-weight:800;color:var(--good);display:flex;gap:6px;justify-content:center;align-items:center">+${coin}${pay}</div>
        ${tip ? `<div class="muted" style="font-size:12px">including a ${tip} tip!</div>` : ''}
        <button class="btn" style="margin-top:10px;width:100%">Continue</button></div>`);
      Sound.sfx('coins'); refreshMoney();
      p.querySelector('button').onclick = () => { Sound.sfx('click'); p.remove(); r(); };
    });

    if (o.patron) {
      if (patronWin) return eraComplete(o);
      await talk(o.name, "This won't do for an occasion like mine. I'll come back tomorrow. Perhaps you'll do better.");
    }
    await walkOut();
    if (S.patronPending && !S.patronAnnounced) {
      S.patronAnnounced = true; save();
      await talk(heirFirst(), `(Word of the shop is spreading… I hear ${era().patron.name} may pay us a visit!)`, { thought: true });
    }
    shopScreen();
  }

  async function eraComplete(o) {
    Sound.sfx('fanfare');
    await talk(o.name, 'Magnificent. You have outdone yourself.');
    await walkOut();
    await talk(null, era().patron.outro);
    if (S.era === ERAS.length - 1) {
      S.finished = true; S.custIdx = Math.min(S.custIdx, CUSTOMERS_PER_DAY); save();
      await story(S.era, ['From one pair of shears in 1885 to the red carpet today: six generations of Harts, one shop, and every stitch in between.',
        'Fashion keeps changing. The craft lives on.', 'THE END. Thank you for playing! The shop stays open, so keep sewing as long as you like.']);
      return shopScreen();
    }
    S.era++; S.rep = 0; S.day = 1; S.custIdx = 0; S.todayMoney = 0; S.todayStars = 0;
    S.patronPending = false; S.patronAnnounced = false; S.lastMade = null;
    giftEra(S.era); save();
    await story(S.era);
    renderShop();
    const newPatterns = eraGarments().filter(([, g]) => g.price === 0).map(([, g]) => g.name);
    await talk(heirFirst(), `(The shop is mine now. I found new patterns in the drawer: ${newPatterns.join(' and ')}. Time to see what the ${era().year}s want to wear!)`, { thought: true });
    shopScreen();
  }

  // ---------- SCREEN: evening ----------
  async function evening() {
    renderShop({ night: true, catalogue: false });
    Sound.music(era().id);
    const e = era();
    const avg = (S.todayStars / CUSTOMERS_PER_DAY).toFixed(1);
    const p = add(`<div class="panel" style="left:50%;top:52%;transform:translate(-50%,-50%);width:400px;text-align:center">
      <h2>Closing time</h2>
      <div class="muted">${e.year} · Day ${S.day}</div>
      <div style="display:flex;justify-content:space-around;margin:12px 0">
        <div><div class="muted" style="font-size:12px">Earned</div><div style="font-size:26px;font-weight:800;color:var(--good);display:flex;gap:6px;align-items:center">${coin}${S.todayMoney}</div></div>
        <div><div class="muted" style="font-size:12px">Avg rating</div><div style="font-size:26px;font-weight:800;color:#c89a20">★ ${avg}</div></div>
      </div>
      <div style="font-size:13px;margin-bottom:12px">${S.finished ? 'The Hart legacy is complete. Keep sewing!' : S.patronPending ? `⭐ ${esc(e.patron.name)} will visit tomorrow!` : `Reputation: ${S.rep}/${e.goal} stars until a famous patron takes notice.`}</div>
      <div style="display:flex;gap:8px;justify-content:center"><button class="btn alt" data-a="cat">📖 Supplies</button><button class="btn" data-a="next">Open Day ${S.day + 1} ☀</button></div>
    </div>`);
    p.querySelector('[data-a="cat"]').onclick = () => { Sound.sfx('page'); catalogue_(); };
    p.querySelector('[data-a="next"]').onclick = () => {
      Sound.sfx('select');
      S.day++; S.custIdx = 0; S.todayMoney = 0; S.todayStars = 0; save();
      stage.insertAdjacentHTML('beforeend', '<div class="fade"></div>');
      shopScreen();
    };
  }

  // ---------- SCREEN: supplier catalogue ----------
  let catTab = 'fabrics';
  function catalogue_() {
    return new Promise(resolve => {
      Sound.sfx('page');
      const book = add(`<div class="book"><div class="tabs">
          ${[['fabrics', 'Fabrics'], ['dyes', 'Dyes'], ['trims', 'Trims'], ['patterns', 'Patterns'], ['tools', 'Tools']].map(([k, l]) => `<button data-tab="${k}">${l}</button>`).join('')}
          <div class="money">${coin}<span id="cat-money">${S.money}</span></div></div>
        <div class="pages"></div><button class="btn small close">Close ✕</button></div>`);
      const pages = book.querySelector('.pages');
      const buy = (price, apply, name) => {
        if (S.money < price) { Sound.sfx('miss'); toast("You can't afford that yet."); return; }
        S.money -= price; apply(); save(); Sound.sfx('buy'); toast(`Bought ${name}!`);
        book.querySelector('#cat-money').textContent = S.money; refreshMoney(); draw();
      };
      const item = (icon, name, desc, price, owned, id) =>
        `<div class="shop-item">${icon}<div>${esc(name)}</div>${desc ? `<div class="desc">${esc(desc)}</div>` : ''}
          ${owned ? '<div class="owned">✓ In stock</div>' : `<button class="btn small gold" data-buy="${id}" ${S.money < price ? 'disabled' : ''}>${coin} ${price}</button>`}</div>`;
      const grid = (inner, cols = 4) => `<div class="grid" style="grid-template-columns:repeat(${cols},1fr)">${inner}</div>`;
      const draw = () => {
        book.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === catTab));
        let h = '';
        if (catTab === 'fabrics') {
          const list = Object.entries(MATERIALS).filter(([, m]) => m.era <= S.era);
          h = `<h2>Fabrics</h2><p class="muted" style="margin:0 0 8px;font-size:13px">Each bolt lasts forever and can be dyed any color.</p>` +
            grid(list.map(([id, m]) => item(Art.swatch(id, 'ivory', 46), m.name, m.desc, m.price, owns('mats', id), 'mats:' + id)).join(''));
        } else if (catTab === 'dyes') {
          const ids = [...new Set(ERAS.slice(0, S.era + 1).flatMap(e => e.colors))];
          h = `<h2>Dyes</h2><p class="muted" style="margin:0 0 8px;font-size:13px">Colors in fashion this era are marked ★.</p>` +
            grid(ids.map(id => item(Art.dyeJar(id, 30), COLORS[id].name + (era().colors.includes(id) ? ' ★' : ''), '', 20 + ERAS.findIndex(e => e.colors.includes(id)) * 5, owns('colors', id), 'colors:' + id)).join(''), 6);
        } else if (catTab === 'trims') {
          const list = Object.entries(TRIMS).filter(([id, t]) => t.era <= S.era && id !== 'none');
          h = `<h2>Trims &amp; Notions</h2>` + grid(list.map(([id, t]) => item(Art.trimIcon(id, 44), t.name, '', t.price, owns('trims', id), 'trims:' + id)).join(''));
        } else if (catTab === 'patterns') {
          const list = eraGarments();
          h = `<h2>Patterns</h2><p class="muted" style="margin:0 0 8px;font-size:13px">New patterns bring new kinds of customers.</p>` +
            grid(list.map(([id, g]) => item(`<div style="width:56px;height:120px">${Art.garmentPreview(id)}</div>`, g.name, `Pays about ${g.pay}`, g.price, owns('patterns', id), 'patterns:' + id)).join(''), 5);
        } else {
          h = `<h2>Tools</h2><p class="muted" style="margin:0 0 8px;font-size:13px">Better tools make cutting, sewing and pressing easier.</p>` +
            Object.entries(TOOLS).map(([k, t]) => {
              const lvl = S.owned.tools[k], cur = t.items[lvl], nx = t.items[lvl + 1];
              const avail = nx && nx.era <= S.era;
              return `<div class="tool-row">${Art.toolIcon(k, lvl, 50)}<div class="info"><b>${t.label}:</b> ${esc(cur.name)}<br>
                ${nx ? `<span class="muted">Next: ${esc(nx.name)}${avail ? '' : ` (available in the ${ERAS[nx.era].year}s)`}</span>` : '<span class="muted">Best in the business!</span>'}</div>
                ${nx && avail ? `<button class="btn small gold" data-buy="tools:${k}" ${S.money < nx.price ? 'disabled' : ''}>${coin} ${nx.price}</button>` : ''}</div>`;
            }).join('');
        }
        pages.innerHTML = h;
        pages.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
          const [kind, id] = b.dataset.buy.split(':');
          if (kind === 'tools') { const nx = TOOLS[id].items[S.owned.tools[id] + 1]; buy(nx.price, () => S.owned.tools[id]++, nx.name); }
          else if (kind === 'mats') buy(MATERIALS[id].price, () => S.owned.mats.push(id), MATERIALS[id].name);
          else if (kind === 'colors') buy(20 + ERAS.findIndex(e => e.colors.includes(id)) * 5, () => S.owned.colors.push(id), COLORS[id].name + ' dye');
          else if (kind === 'trims') buy(TRIMS[id].price, () => S.owned.trims.push(id), TRIMS[id].name);
          else if (kind === 'patterns') buy(GARMENTS[id].price, () => S.owned.patterns.push(id), GARMENTS[id].name + ' pattern');
        });
      };
      book.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { catTab = b.dataset.tab; Sound.sfx('page'); draw(); });
      book.querySelector('.close').onclick = () => { Sound.sfx('page'); book.remove(); resolve(); };
      draw();
    });
  }

  // ---------- boot ----------
  loadSettings();
  title();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  // test hook
  window.__game = { get S() { return S; }, set S(v) { S = v; }, save, shopScreen, workroom, title, fitting, newState, giftEra };
})();
