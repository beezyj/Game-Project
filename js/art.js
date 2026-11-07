// Stitch & Style — all drawing: fabrics, characters, garments, scenes, icons.
'use strict';

const Art = (() => {
  let uid = 0;
  const nid = p => p + (++uid);

  // ---------- color helpers ----------
  function hexToRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
  function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function shade(hex, amt) { // amt -1..1 (negative = darker)
    const [r, g, b] = hexToRgb(hex);
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
  }
  function lum(hex) { const [r, g, b] = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

  // ---------- fabric textures ----------
  // Returns { defs, fill } for a material in a color.
  function fabric(mat, hex) {
    const id = nid('f');
    const lt = shade(hex, 0.22), dk = shade(hex, -0.22), bg = `<rect width="100%" height="100%" fill="${hex}"/>`;
    let body;
    switch (mat) {
      case 'cotton': body = `<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse">${bg}<rect width="2" height="2" fill="${dk}" opacity=".12"/></pattern>`; break;
      case 'linen': body = `<pattern id="${id}" width="8" height="5" patternUnits="userSpaceOnUse">${bg}<path d="M0 1.5h5M3 4h5" stroke="${lt}" stroke-width=".8" opacity=".6"/></pattern>`; break;
      case 'wool': body = `<pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse">${bg}<circle cx="1.5" cy="2" r=".7" fill="${lt}" opacity=".5"/><circle cx="5" cy="5.5" r=".7" fill="${dk}" opacity=".5"/></pattern>`; break;
      case 'tweed': body = `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse">${bg}<path d="M0 0l4 4l-4 4M4 0l4 4l-4 4" stroke="${lt}" stroke-width="1.1" fill="none" opacity=".55"/><path d="M2 0l4 4l-4 4" stroke="${dk}" stroke-width=".8" fill="none" opacity=".5"/></pattern>`; break;
      case 'chiffon': body = `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${shade(hex, 0.15)}"/><path d="M0 10L10 0" stroke="${lt}" stroke-width="2" opacity=".45"/></pattern>`; break;
      case 'sequin': body = `<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse">${bg}<circle cx="1.5" cy="1.5" r="1.3" fill="${lt}" opacity=".85"/><circle cx="4" cy="4" r="1.3" fill="${shade(hex, 0.45)}" opacity=".9"/><circle cx="4.3" cy="3.6" r=".45" fill="#fff"/></pattern>`; break;
      case 'denim': body = `<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse">${bg}<path d="M0 4L4 0M-1 1L1 -1M3 5L5 3" stroke="${shade(hex, 0.3)}" stroke-width=".9" opacity=".7"/></pattern>`; break;
      case 'corduroy': body = `<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse">${bg}<rect width="1.6" height="4" fill="${lt}" opacity=".55"/><rect x="2.6" width=".6" height="4" fill="${dk}" opacity=".4"/></pattern>`; break;
      case 'jersey': body = `<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse">${bg}<path d="M0 0l2 3l2-3" stroke="${dk}" stroke-width=".6" fill="none" opacity=".35"/></pattern>`; break;
      case 'flannel': {
        const line = lum(hex) > 0.5 ? '#3a2c2c' : '#1a1416';
        body = `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse">${bg}
          <rect y="5" width="16" height="6" fill="${line}" opacity=".38"/><rect x="5" width="6" height="16" fill="${line}" opacity=".38"/>
          <rect y="13.5" width="16" height="1" fill="${lt}" opacity=".6"/><rect x="13.5" width="1" height="16" fill="${lt}" opacity=".6"/></pattern>`; break;
      }
      case 'tech': body = `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse">${bg}<path d="M0 .5H6M.5 0V6" stroke="${lt}" stroke-width=".6" opacity=".55"/></pattern>`; break;
      default: return { defs: '', fill: hex }; // silk, satin, velvet, leather, polyester: smooth (sheen added separately)
    }
    return { defs: body, fill: `url(#${id})` };
  }

  const SHEEN = { silk: 0.35, satin: 0.5, polyester: 0.3, leather: 0.45, sequin: 0.25, chiffon: 0.15, tech: 0.2, velvet: 0 };
  function overlays(mat) {
    const sh = nid('s'), sheen = SHEEN[mat] || 0;
    let defs = `<linearGradient id="${sh}" x1="0" x2="1" y1="0" y2="0.15">
        <stop offset="0" stop-color="#000" stop-opacity=".22"/>
        <stop offset=".32" stop-color="#fff" stop-opacity="${0.08 + sheen * 0.6}"/>
        <stop offset=".5" stop-color="#fff" stop-opacity="${sheen * 0.15}"/>
        <stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>`;
    let velvet = '';
    if (mat === 'velvet') {
      velvet = nid('v');
      defs += `<radialGradient id="${velvet}" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".7" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>`;
    }
    return { defs, shade: `url(#${sh})`, velvet: velvet ? `url(#${velvet})` : '' };
  }

  // ---------- body geometry ----------
  const BODY = { f: { sh: 25, wa: 16, hi: 24 }, m: { sh: 30, wa: 21, hi: 23 } };
  const X = 80;

  function mirror(svg) { return svg + `<g transform="translate(160 0) scale(-1 1)">${svg}</g>`; }

  // Each shape fn returns { d, hem?: {y, hw} }
  const SHAPES = {
    skirt: {
      bustle: P => ({ d: `M${X - P.wa - 2} 148 C${X - 40} 175 ${X - 48} 300 ${X - 52} 350 Q${X} 358 ${X + 58} 350 C${X + 58} 280 ${X + 66} 190 ${X + P.wa + 2} 148Z`, hem: { y: 352, hw: 55 },
        extra: (fill) => `<path d="M${X - P.wa - 2} 150 Q${X - 10} 225 ${X + 34} 200 Q${X + 56} 190 ${X + P.wa + 2} 150Z" fill="${fill}" opacity=".9"/><path d="M${X - P.wa} 152 Q${X - 8} 220 ${X + 34} 198" stroke="rgba(0,0,0,.25)" fill="none"/>` }),
      full: P => ({ d: `M${X - P.wa - 2} 148 C${X - 50} 200 ${X - 62} 300 ${X - 66} 350 Q${X} 360 ${X + 66} 350 C${X + 62} 300 ${X + 50} 200 ${X + P.wa + 2} 148Z`, hem: { y: 353, hw: 66 } }),
      swing: P => ({ d: `M${X - P.wa - 2} 148 C${X - 40} 172 ${X - 58} 228 ${X - 62} 256 Q${X} 266 ${X + 62} 256 C${X + 58} 228 ${X + 40} 172 ${X + P.wa + 2} 148Z`, hem: { y: 259, hw: 62 } }),
      pencil: P => ({ d: `M${X - P.wa - 1} 148 C${X - P.hi - 4} 172 ${X - P.hi - 1} 205 ${X - 21} 264 L${X + 21} 264 C${X + P.hi + 1} 205 ${X + P.hi + 4} 172 ${X + P.wa + 1} 148Z`, hem: { y: 264, hw: 21 } }),
      straight: P => ({ d: `M${X - P.hi - 4} 186 L${X - 30} 252 Q${X} 256 ${X + 30} 252 L${X + P.hi + 4} 186Z`, hem: { y: 254, hw: 30 } }),
      pleat: P => ({ d: `M${X - P.hi - 4} 186 L${X - 34} 250 Q${X} 254 ${X + 34} 250 L${X + P.hi + 4} 186Z`, hem: { y: 252, hw: 34 },
        extra: () => [-22, -11, 0, 11, 22].map(o => `<path d="M${X + o * 0.8} 190 L${X + o} 252" stroke="rgba(0,0,0,.22)" stroke-width="1"/>`).join('') }),
      aline: P => ({ d: `M${X - P.wa - 2} 148 L${X - 42} 252 Q${X} 260 ${X + 42} 252 L${X + P.wa + 2} 148Z`, hem: { y: 255, hw: 42 } }),
      maxi: P => ({ d: `M${X - P.wa - 2} 148 C${X - P.hi - 6} 180 ${X - 36} 290 ${X - 44} 348 Q${X} 354 ${X + 44} 348 C${X + 36} 290 ${X + P.hi + 6} 180 ${X + P.wa + 2} 148Z`, hem: { y: 350, hw: 44 } }),
      mermaid: P => ({ d: `M${X - P.wa - 1} 148 C${X - P.hi - 5} 180 ${X - P.hi} 230 ${X - 17} 285 Q${X - 22} 320 ${X - 50} 350 Q${X} 358 ${X + 50} 350 Q${X + 22} 320 ${X + 17} 285 C${X + P.hi} 230 ${X + P.hi + 5} 180 ${X + P.wa + 1} 148Z`, hem: { y: 353, hw: 50 } }),
    },
    pants: (kind, P) => {
      const c = 13;
      const kw = { straight: 11, slim: 9, flare: 10, wide: 19 }[kind];
      const aw = { straight: 11, slim: 7.5, flare: 22, wide: 23 }[kind];
      const inK = Math.max(1, c - kw), inA = Math.max(1, c - aw);
      const d = `M${X - P.wa - 1} 146 L${X + P.wa + 1} 146 Q${X + P.hi + 3} 168 ${X + P.hi + 2} 190 L${X + c + kw} 266 L${X + c + aw} 348 L${X + inA} 348 L${X + inK} 266 L${X} 196 L${X - inK} 266 L${X - inA} 348 L${X - c - aw} 348 L${X - c - kw} 266 L${X - P.hi - 2} 190 Q${X - P.hi - 3} 168 ${X - P.wa - 1} 146Z`;
      return { d, hem: { y: 348, hw: c + aw }, extra: () => `<path d="M${X} 196 L${X} 160" stroke="rgba(0,0,0,.2)"/><path d="M${X - P.wa - 1} 152 L${X + P.wa + 1} 152" stroke="rgba(0,0,0,.25)"/>` };
    },
    top: {
      fitted: P => ({ d: `M${X - P.sh - 2} 86 Q${X - P.sh} 77 ${X - 12} 76 Q${X} 90 ${X + 12} 76 Q${X + P.sh} 77 ${X + P.sh + 2} 86 L${X + P.wa + 2} 150 L${X} 158 L${X - P.wa - 2} 150Z` }),
      wrap: P => ({ d: `M${X - P.sh - 2} 86 Q${X - P.sh} 77 ${X - 10} 75 L${X} 112 L${X + 10} 75 Q${X + P.sh} 77 ${X + P.sh + 2} 86 L${X + P.wa + 2} 152 L${X - P.wa - 2} 152Z`,
        extra: () => `<path d="M${X - 10} 76 L${X + P.wa} 146" stroke="rgba(0,0,0,.25)" stroke-width="1.2" fill="none"/><path d="M${X - P.wa - 2} 148 L${X + P.wa + 2} 148" stroke="rgba(0,0,0,.25)" stroke-width="3"/>` }),
      slip: P => ({ d: `M${X - P.wa - 6} 92 Q${X} 104 ${X + P.wa + 6} 92 L${X + P.wa + 2} 150 L${X - P.wa - 2} 150Z`,
        extra: (fill) => `<path d="M${X - P.wa - 4} 93 L${X - 13} 76 M${X + P.wa + 4} 93 L${X + 13} 76" stroke="${fill}" stroke-width="1.6"/>` }),
      crop: P => ({ d: `M${X - P.sh - 2} 86 Q${X - P.sh} 77 ${X - 10} 75 Q${X} 84 ${X + 10} 75 Q${X + P.sh} 77 ${X + P.sh + 2} 86 L${X + P.wa + 3} 132 L${X - P.wa - 3} 132Z` }),
      blouse: P => ({ d: `M${X - P.sh - 2} 86 Q${X - P.sh} 77 ${X - 10} 74 L${X} 82 L${X + 10} 74 Q${X + P.sh} 77 ${X + P.sh + 2} 86 L${X + P.wa + 3} 152 L${X - P.wa - 3} 152Z`,
        extra: () => `<path d="M${X - 10} 74 L${X - 3} 90 L${X} 82 L${X + 3} 90 L${X + 10} 74" fill="#fff" stroke="rgba(0,0,0,.2)"/>` }),
      shirt: P => ({ d: `M${X - P.sh - 2} 86 Q${X - P.sh} 77 ${X - 9} 74 L${X} 84 L${X + 9} 74 Q${X + P.sh} 77 ${X + P.sh + 2} 86 L${X + P.hi + 3} 190 L${X - P.hi - 3} 190Z`, hem: { y: 190, hw: P.hi + 3 },
        extra: (fill) => `<path d="M${X - 9} 73 L${X - 4} 88 L${X} 84 L${X + 4} 88 L${X + 9} 73 L${X} 80Z" fill="${fill}" stroke="rgba(0,0,0,.3)"/><path d="M${X} 86 L${X} 188" stroke="rgba(0,0,0,.18)"/>` + [100, 120, 140, 160, 178].map(y => `<circle cx="${X + 2}" cy="${y}" r="1.1" fill="rgba(0,0,0,.35)"/>`).join('') }),
      tee: P => ({ d: `M${X - P.sh - 2} 86 Q${X - P.sh} 77 ${X - 10} 74 Q${X} 82 ${X + 10} 74 Q${X + P.sh} 77 ${X + P.sh + 2} 86 L${X + P.hi + 3} 188 L${X - P.hi - 3} 188Z`, hem: { y: 188, hw: P.hi + 3 } }),
      hoodie: P => ({ d: `M${X - P.sh - 4} 88 Q${X - P.sh - 2} 76 ${X - 12} 73 Q${X} 80 ${X + 12} 73 Q${X + P.sh + 2} 76 ${X + P.sh + 4} 88 L${X + P.hi + 6} 196 L${X - P.hi - 6} 196Z`, hem: { y: 196, hw: P.hi + 6 },
        back: (fill) => `<path d="M${X - 25} 80 Q${X - 30} 18 ${X} 16 Q${X + 30} 18 ${X + 25} 80Z" fill="${fill}" stroke="rgba(0,0,0,.3)"/>`,
        extra: (fill) => `<path d="M${X - 18} 154 L${X + 18} 154 L${X + 24} 182 L${X - 24} 182Z" fill="none" stroke="rgba(0,0,0,.28)"/><path d="M${X - 5} 80 L${X - 6} 110 M${X + 5} 80 L${X + 6} 110" stroke="#f2efe8" stroke-width="1.4"/><rect x="${X - P.hi - 6}" y="188" width="${(P.hi + 6) * 2}" height="8" fill="rgba(0,0,0,.15)"/>` }),
      drop: P => ({ d: `M${X - P.sh - 1} 86 Q${X - P.sh} 78 ${X - 12} 76 Q${X} 88 ${X + 12} 76 Q${X + P.sh} 78 ${X + P.sh + 1} 86 L${X + P.hi + 4} 192 L${X - P.hi - 4} 192Z`, hem: { y: 192, hw: P.hi + 4 } }),
    },
    vest: {
      waistcoat: P => ({ d: `M${X - P.sh + 4} 82 L${X - 8} 77 L${X} 116 L${X + 8} 77 L${X + P.sh - 4} 82 L${X + P.wa + 4} 158 L${X} 166 L${X - P.wa - 4} 158Z`,
        extra: () => [124, 136, 148].map(y => `<circle cx="${X}" cy="${y}" r="1.6" fill="#d8c27a" stroke="rgba(0,0,0,.3)" stroke-width=".5"/>`).join('') }),
    },
    sleeve: {
      long: P => `M${X - P.sh + 2} 78 Q${X - P.sh - 8} 80 ${X - P.sh - 11} 96 L${X - P.sh - 14} 140 L${X - P.sh - 13} 197 L${X - P.sh - 0} 197 L${X - P.sh - 1} 140 L${X - P.sh + 4} 104Z`,
      short: P => `M${X - P.sh + 2} 78 Q${X - P.sh - 8} 80 ${X - P.sh - 11} 96 L${X - P.sh - 13} 116 L${X - P.sh} 118 L${X - P.sh + 4} 100Z`,
      cap: P => `M${X - P.sh + 4} 78 Q${X - P.sh - 10} 79 ${X - P.sh - 9} 100 Q${X - P.sh} 98 ${X - P.sh + 4} 92Z`,
      puff: P => `M${X - P.sh + 6} 78 Q${X - P.sh - 20} 68 ${X - P.sh - 15} 102 Q${X - P.sh - 4} 110 ${X - P.sh + 4} 97Z`,
      mutton: P => `M${X - P.sh + 6} 78 Q${X - P.sh - 26} 66 ${X - P.sh - 18} 120 L${X - P.sh - 13} 197 L${X - P.sh} 197 L${X - P.sh - 1} 132 L${X - P.sh + 4} 102Z`,
      bell: P => `M${X - P.sh + 2} 78 Q${X - P.sh - 8} 80 ${X - P.sh - 11} 96 L${X - P.sh - 14} 140 L${X - P.sh - 26} 203 Q${X - P.sh - 10} 210 ${X - P.sh + 6} 202 L${X - P.sh - 1} 140 L${X - P.sh + 4} 104Z`,
    },
    outer: {
      frockcoat: P => ({ half: `M${X - P.sh - 3} 86 Q${X - P.sh - 1} 76 ${X - 11} 75 L${X - 4} 152 L${X - 9} 266 L${X - P.hi - 16} 262 L${X - P.wa - 4} 150Z`,
        lapel: `M${X - 11} 75 L${X - 4} 120 L${X - 15} 98Z`, hem: { y: 264, hw: P.hi + 16 } }),
      blazer: P => ({ half: `M${X - P.sh - 3} 86 Q${X - P.sh - 1} 76 ${X - 11} 75 L${X - 2} 132 L${X - 2} 198 L${X - P.hi - 6} 198 L${X - P.wa - 4} 150Z`,
        lapel: `M${X - 11} 75 L${X - 2} 128 L${X - 16} 100Z`, pocket: `M${X - P.hi + 2} 172 h14`, hem: { y: 198, hw: P.hi + 6 } }),
      jacket: P => ({ half: `M${X - P.sh - 3} 86 Q${X - P.sh - 1} 76 ${X - 11} 75 L${X - 5} 166 L${X - P.wa - 7} 166 L${X - P.wa - 5} 148Z`,
        lapel: `M${X - 11} 75 L${X - 5} 110 L${X - 21} 92 L${X - 18} 80Z`, pocket: `M${X - P.wa - 2} 128 h10`, hem: { y: 166, hw: P.wa + 7 } }),
      bomber: P => ({ half: `M${X - P.sh - 4} 86 Q${X - P.sh - 2} 76 ${X - 10} 75 L${X - 1} 172 L${X - P.hi - 3} 172 L${X - P.wa - 7} 150Z`,
        lapel: `M${X - 10} 75 L${X - 1} 82 L${X - 1} 88 L${X - 12} 82Z`, band: true, hem: { y: 172, hw: P.hi + 3 } }),
      trench: P => ({ half: `M${X - P.sh - 4} 86 Q${X - P.sh - 2} 76 ${X - 11} 75 L${X + 6} 150 L${X + 6} 266 L${X - P.hi - 14} 266 L${X - P.wa - 5} 150Z`,
        lapel: `M${X - 11} 75 L${X + 2} 118 L${X - 20} 96Z`, belt: true, hem: { y: 266, hw: P.hi + 14 } }),
    },
    hat: {
      tophat: (f, a) => `<path d="M64 24 L66 -16 Q80 -20 94 -16 L96 24Z" fill="${f}" stroke="rgba(0,0,0,.35)"/><rect x="64.5" y="14" width="31" height="6" fill="${a}"/><ellipse cx="80" cy="25" rx="27" ry="5" fill="${f}" stroke="rgba(0,0,0,.35)"/>`,
      bonnet: (f, a) => `<path d="M57 52 Q52 6 80 6 Q108 6 103 52 Q98 24 80 24 Q62 24 57 52Z" fill="${f}" stroke="rgba(0,0,0,.3)"/><path d="M60 50 Q66 60 74 64 M100 50 Q94 60 86 64" stroke="${a}" stroke-width="3" fill="none"/><circle cx="96" cy="16" r="5" fill="#e88aa3"/><circle cx="101" cy="22" r="3.5" fill="#f4d36b"/>`,
      cloche: (f, a) => `<path d="M59 34 Q58 6 80 6 Q102 6 101 34 Q104 38 99 40 L61 40 Q56 38 59 34Z" fill="${f}" stroke="rgba(0,0,0,.3)"/><path d="M60 27 Q80 22 100 27 L100 32 Q80 27 60 32Z" fill="${a}"/>`,
      fedora: (f, a) => `<path d="M63 28 Q62 4 80 6 Q98 4 97 28Z" fill="${f}" stroke="rgba(0,0,0,.3)"/><path d="M80 7 L80 14" stroke="rgba(0,0,0,.3)"/><rect x="63" y="20" width="34" height="5" fill="${a}"/><ellipse cx="80" cy="28" rx="31" ry="5.5" fill="${f}" stroke="rgba(0,0,0,.3)"/>`,
      cap: (f, a) => `<path d="M61 32 Q61 11 80 11 Q99 11 99 32Z" fill="${f}" stroke="rgba(0,0,0,.3)"/><path d="M68 32 Q86 26 110 34 Q96 40 70 36Z" fill="${a}" stroke="rgba(0,0,0,.3)"/><circle cx="80" cy="12" r="2" fill="${a}"/>`,
      beanie: (f, a) => `<path d="M61 34 Q61 10 80 10 Q99 10 99 34Z" fill="${f}" stroke="rgba(0,0,0,.3)"/><rect x="60" y="28" width="40" height="9" rx="3" fill="${a}"/>`,
    },
  };

  // ---------- hair ----------
  const HAIR = {
    updo:     { front: 'M62 44 Q60 20 80 19 Q100 20 98 44 Q95 30 80 28 Q65 30 62 44Z', top: '<circle cx="80" cy="16" r="9"/>' },
    messybun: { front: 'M62 44 Q60 20 80 19 Q100 20 98 44 Q95 30 84 27 Q70 31 62 44Z', top: '<circle cx="84" cy="15" r="8"/><path d="M90 12 q6 -4 5 4 M76 10 q-6 -3 -4 4" stroke-width="1.5" fill="none" class="hs"/>' },
    bob:      { back: 'M58 40 Q58 16 80 16 Q102 16 102 40 L102 62 Q96 64 92 58 L68 58 Q64 64 58 62Z', front: 'M61 42 Q61 18 80 18 Q99 18 99 42 L97 34 Q80 30 63 34Z' },
    waves:    { back: 'M58 40 Q57 15 80 15 Q103 15 102 40 Q106 60 100 80 Q104 92 96 98 L64 98 Q56 92 60 80 Q54 60 58 40Z', front: 'M61 46 Q59 18 80 18 Q101 18 99 46 Q96 30 86 27 Q76 34 63 46Z' },
    long:     { back: 'M58 38 Q58 15 80 15 Q102 15 102 38 L105 112 L55 112Z', front: 'M62 50 Q60 18 80 18 Q100 18 98 50 Q96 30 80 27 Q64 30 62 50Z' },
    curls:    { back: '<circle cx="64" cy="30" r="10"/><circle cx="72" cy="20" r="10"/><circle cx="88" cy="20" r="10"/><circle cx="96" cy="30" r="10"/><circle cx="60" cy="45" r="9"/><circle cx="100" cy="45" r="9"/><circle cx="62" cy="58" r="7"/><circle cx="98" cy="58" r="7"/>',
                front: '<circle cx="69" cy="26" r="7"/><circle cx="80" cy="22" r="8"/><circle cx="91" cy="26" r="7"/>', raw: true },
    ponytail: { back: 'M92 18 Q114 30 106 74 Q100 50 92 30Z', front: 'M62 42 Q61 19 80 19 Q99 19 98 42 Q94 28 80 27 Q66 28 62 42Z', top: '<ellipse cx="88" cy="16" rx="6" ry="5"/>' },
    afro:     { back: '<circle cx="80" cy="36" r="31"/>', front: 'M62 40 Q62 24 80 24 Q98 24 98 40 Q94 32 80 31 Q66 32 62 40Z', rawBack: true },
    side:     { front: 'M62 40 Q61 19 82 19 Q100 20 98 40 Q96 28 86 26 Q74 30 62 40Z' },
    slick:    { front: 'M62 38 Q62 20 80 20 Q98 20 98 38 Q90 26 80 27 Q70 26 62 38Z' },
    short:    { front: 'M62 39 Q61 20 80 19 Q99 20 98 39 L95 30 L90 33 L86 28 L80 32 L74 28 L70 33 L65 30Z' },
    pomp:     { front: 'M62 40 Q60 22 72 15 Q88 4 101 16 Q103 26 98 40 Q94 26 80 26 Q68 28 62 40Z' },
    shag:     { back: 'M59 36 Q59 16 80 16 Q101 16 101 36 L102 72 L94 66 L88 70 L72 70 L66 66 L58 72Z', front: 'M61 46 Q60 18 80 18 Q100 18 99 46 L95 34 L90 40 L86 32 L80 38 L74 32 L70 40 L65 34Z' },
    curtains: { back: 'M60 38 Q60 17 80 17 Q100 17 100 38 L100 58 L60 58Z', front: 'M62 50 Q60 19 80 19 Q100 19 98 50 Q94 32 82 28 L80 34 L78 28 Q66 32 62 50Z' },
    buzz:     { front: 'M63 36 Q63 21 80 21 Q97 21 97 36 Q90 27 80 27 Q70 27 63 36Z', op: 0.8 },
  };

  function hairPart(h, which, color) {
    const s = h[which]; if (!s) return '';
    if (s.startsWith('<')) return `<g fill="${color}">${s}</g>`;
    return `<path d="${s}" fill="${color}" ${h.op ? `opacity="${h.op}"` : ''}/>`;
  }

  function face(mood, skin) {
    const eye = '#2a1d18';
    const mouths = {
      happy: `<path d="M73 52 Q80 60 87 52" stroke="#8a3b3b" stroke-width="1.6" fill="#b84c4c"/>`,
      neutral: `<path d="M75 54 Q80 56 85 54" stroke="#8a3b3b" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
      sad: `<path d="M75 56 Q80 51 85 56" stroke="#8a3b3b" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
      wow: `<ellipse cx="80" cy="54" rx="3" ry="3.6" fill="#8a3b3b"/>`,
    };
    const eyes = mood === 'happy'
      ? `<path d="M71 44 Q74 41 77 44 M83 44 Q86 41 89 44" stroke="${eye}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
      : `<ellipse cx="74" cy="44" rx="2" ry="2.6" fill="${eye}"/><ellipse cx="86" cy="44" rx="2" ry="2.6" fill="${eye}"/><circle cx="74.7" cy="43.2" r=".7" fill="#fff"/><circle cx="86.7" cy="43.2" r=".7" fill="#fff"/>`;
    const brows = mood === 'sad'
      ? `<path d="M70 38 L77 36 M83 36 L90 38" stroke="${eye}" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`
      : `<path d="M70 37 Q74 35 77 37 M83 37 Q86 35 90 37" stroke="${eye}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>`;
    return eyes + brows + `<path d="M80 46 L79 50 L81 50" stroke="${shade(skin, -0.25)}" stroke-width="1" fill="none"/>
      <circle cx="70" cy="51" r="3.5" fill="#e86a6a" opacity=".18"/><circle cx="90" cy="51" r="3.5" fill="#e86a6a" opacity=".18"/>` + (mouths[mood] || mouths.neutral);
  }

  // ---------- garments ----------
  const FIXED = { w: '#f3f0e8', d: '#34313a', k: '#242227', b: '#4a6894' };

  // Build the layer list for an outfit {garment, mat, color, trim}.
  function outfitLayers(outfit, P) {
    const g = GARMENTS[outfit.garment];
    const hex = COLORS[outfit.color] ? COLORS[outfit.color].hex : outfit.color;
    const fab = fabric(outfit.mat, hex);
    const ov = overlays(outfit.mat);
    let defs = fab.defs + ov.defs;
    const fills = { m: fab.fill, a: shade(hex, -0.28) };
    // fixed-color parts get light textures of their own
    const denimFab = fabric('denim', FIXED.b); defs += denimFab.defs;
    fills.b = denimFab.fill; fills.w = FIXED.w; fills.d = FIXED.d; fills.k = FIXED.k;
    return { g, hex, defs, fills, ov };
  }

  const ORDER = { pants: 1, skirt: 2, top: 3, vest: 4, sleeve: 5, outer: 6, hat: 9 };
  const STROKE = 'stroke="rgba(30,18,24,.38)" stroke-width="1" stroke-linejoin="round"';

  function drawPieces(pieces, ctx, P) {
    // returns { back, main, hat, mainPaths[], hems[] }
    const out = { back: '', main: '', hat: '', mainPaths: [], hems: [], hasOuter: false };
    const sorted = pieces.slice().sort((a, b) => ORDER[a[0]] - ORDER[b[0]]);
    const shadeOv = (d, isMain) => `<path d="${d}" fill="${ctx.ov.shade}"/>` + (isMain && ctx.ov.velvet ? `<path d="${d}" fill="${ctx.ov.velvet}"/>` : '');
    for (const [part, kind, fk] of sorted) {
      const fill = ctx.fills[fk];
      const isMain = fk === 'm';
      const add = (d, extra) => {
        out.main += `<path d="${d}" fill="${fill}" ${STROKE}/>` + shadeOv(d, isMain) + (extra || '');
        if (isMain) out.mainPaths.push(d);
      };
      if (part === 'skirt') {
        const s = SHAPES.skirt[kind](P);
        add(s.d, s.extra ? s.extra(ctx.fills.a) : '');
        if (isMain) out.hems.push(s.hem);
      } else if (part === 'pants') {
        const s = SHAPES.pants(kind, P);
        add(s.d, s.extra());
        if (isMain) out.hems.push(s.hem);
      } else if (part === 'top') {
        const s = SHAPES.top[kind](P);
        if (s.back) out.back += s.back(fill);
        add(s.d, s.extra ? s.extra(fill) : '');
        if (isMain && s.hem) out.hems.push(s.hem);
      } else if (part === 'vest') {
        const s = SHAPES.vest[kind](P);
        add(s.d, s.extra());
      } else if (part === 'sleeve') {
        const d = SHAPES.sleeve[kind](P);
        const one = `<path d="${d}" fill="${fill}" ${STROKE}/><path d="${d}" fill="${ctx.ov.shade}"/>`;
        out.main += mirror(one);
        if (isMain) { out.mainPaths.push(d); out.mirrorMain = (out.mirrorMain || []).concat([d]); }
      } else if (part === 'outer') {
        out.hasOuter = true;
        const s = SHAPES.outer[kind](P);
        const sl = SHAPES.sleeve.long({ ...P, sh: P.sh + 2 });
        let half = `<path d="${sl}" fill="${fill}" ${STROKE}/><path d="${sl}" fill="${ctx.ov.shade}"/>`;
        half += `<path d="${s.half}" fill="${fill}" ${STROKE}/><path d="${s.half}" fill="${ctx.ov.shade}"/>`;
        half += `<path d="${s.lapel}" fill="${ctx.fills.a}" ${STROKE}/>`;
        if (s.pocket) half += `<path d="${s.pocket}" stroke="rgba(0,0,0,.35)" stroke-width="1.4"/>`;
        if (s.band) half += `<rect x="${X - P.hi - 3}" y="166" width="${P.hi + 2}" height="6" fill="${ctx.fills.a}"/>`;
        if (s.belt) half += `<rect x="${X - P.wa - 6}" y="146" width="${P.wa + 12}" height="7" fill="${ctx.fills.a}" ${STROKE}/>`;
        out.main += mirror(half);
        if (isMain) { out.mainPaths.push(s.half, sl); out.mirrorMain = (out.mirrorMain || []).concat([s.half, sl]); out.hems.push(s.hem); }
      } else if (part === 'hat') {
        out.hat += SHAPES.hat[kind](fill, fk === 'm' ? ctx.fills.a : shade(fk === 'k' || fk === 'd' ? '#555' : ctx.hex, -0.3));
        if (isMain) out.hatMain = kind;
      }
    }
    return out;
  }

  function trimSVG(trim, pieces, P, hex, clipId) {
    const tc = lum(hex) > 0.6 ? '#7a5a3a' : '#f6efe0';
    const hem = pieces.hems.sort((a, b) => b.y - a.y)[0];
    let s = '';
    switch (trim) {
      case 'lace':
        if (hem) {
          const n = Math.max(6, Math.round(hem.hw * 2 / 7));
          for (let i = 0; i <= n; i++) {
            const x = X - hem.hw + hem.hw * 2 * i / n;
            s += `<circle cx="${x.toFixed(1)}" cy="${hem.y}" r="4" fill="#fffaf0" stroke="#d6c9ae" stroke-width=".6"/><circle cx="${x.toFixed(1)}" cy="${hem.y}" r="1.3" fill="#e2d6bc"/>`;
          }
        }
        s += `<path d="M${X - 12} 78 Q${X} 92 ${X + 12} 78" stroke="#fffaf0" stroke-width="3" fill="none" stroke-dasharray="2 1.5"/>`;
        break;
      case 'buttons':
        for (let y = 96; y <= 146; y += 12) s += `<circle cx="${X}" cy="${y}" r="2.2" fill="${tc}" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>`;
        break;
      case 'ribbon':
        s += `<rect x="${X - P.wa - 4}" y="144" width="${(P.wa + 4) * 2}" height="9" rx="2" fill="${tc}" stroke="rgba(0,0,0,.25)"/>
              <path d="M${X} 148 L${X - 12} 140 L${X - 12} 156Z M${X} 148 L${X + 12} 140 L${X + 12} 156Z" fill="${tc}" stroke="rgba(0,0,0,.25)"/><circle cx="${X}" cy="148" r="3" fill="${tc}"/>`;
        break;
      case 'embroidery': {
        const flower = (x, y) => [0, 72, 144, 216, 288].map(a => `<circle cx="${(x + Math.cos(a * Math.PI / 180) * 3).toFixed(1)}" cy="${(y + Math.sin(a * Math.PI / 180) * 3).toFixed(1)}" r="2" fill="${tc}"/>`).join('') + `<circle cx="${x}" cy="${y}" r="1.6" fill="#e6b84a"/>`;
        s += flower(X - 10, 108) + flower(X + 11, 122) + flower(X - 4, 136);
        if (hem) s += flower(X - hem.hw * 0.5, hem.y - 10) + flower(X + hem.hw * 0.5, hem.y - 10);
        break;
      }
      case 'fringe':
        if (hem) {
          for (let x = X - hem.hw; x <= X + hem.hw; x += 3) s += `<path d="M${x.toFixed(1)} ${hem.y - 2} l${(Math.sin(x) * 1.5).toFixed(1)} 15" stroke="${tc}" stroke-width="1.2"/>`;
          s += `<path d="M${X - hem.hw} ${hem.y - 1} L${X + hem.hw} ${hem.y - 1}" stroke="${tc}" stroke-width="2"/>`;
        }
        break;
      case 'beads':
        s += `<rect x="0" y="60" width="160" height="300" fill="url(#beads_${clipId})" clip-path="url(#${clipId})"/>`;
        break;
      case 'rhinestones':
        [[X - 12, 82], [X, 92], [X + 12, 82], [X - P.wa, 146], [X + P.wa, 146], [X, 150], [X - 6, 120], [X + 8, 132]].forEach(([x, y]) => {
          s += `<path d="M${x} ${y - 4} L${x + 1.3} ${y} L${x} ${y + 4} L${x - 1.3} ${y}Z M${x - 4} ${y} L${x} ${y - 1.2} L${x + 4} ${y} L${x} ${y + 1.2}Z" fill="#fff" opacity=".95"/>`;
        });
        break;
      case 'patches':
        s += `<rect x="${X - 18}" y="112" width="12" height="11" rx="2" fill="#e4a33a" stroke="#fff" stroke-dasharray="1.5 1" transform="rotate(-8 ${X - 12} 117)"/>
              <circle cx="${X + 14}" cy="168" r="6" fill="#4a90c2" stroke="#fff" stroke-dasharray="1.5 1"/>
              <path d="M${X + 10} 232 l4 -7 l4 7z" fill="#d94a4a" stroke="#fff" stroke-width=".8"/>`;
        break;
      case 'studs':
        for (let i = 0; i < 6; i++) s += `<circle cx="${X - 22 + i * 2}" cy="${80 + i * 5}" r="1.4" fill="#e8e8ee" stroke="#777" stroke-width=".4"/><circle cx="${X + 22 - i * 2}" cy="${80 + i * 5}" r="1.4" fill="#e8e8ee" stroke="#777" stroke-width=".4"/>`;
        for (let i = 0; i < 7; i++) s += `<circle cx="${X - 15 + i * 5}" cy="152" r="1.4" fill="#e8e8ee" stroke="#777" stroke-width=".4"/>`;
        break;
      case 'print':
        s += `<path d="M${X} 104 l4 9 l10 1 l-7 7 l2 10 l-9 -5 l-9 5 l2 -10 l-7 -7 l10 -1z" fill="${tc}" opacity=".9"/>`;
        break;
    }
    return s;
  }

  // ---------- character ----------
  // opts: { body, skin (hex), hair, hairColor, beard, mood, outfit, base, mannequin }
  function character(o) {
    const P = BODY[o.body || 'f'];
    const skin = o.mannequin ? '#e6d8c2' : o.skin;
    const skinDk = shade(skin, -0.12);
    let defs = '', back = '', main = '', hat = '', trim = '';

    // Base outfit (what they walked in wearing) — used under accessory garments.
    let layers = null;
    const build = (outfit, pieceFilter) => {
      const ctx = outfitLayers(outfit, P);
      defs += ctx.defs;
      const pieces = pieceFilter ? GARMENTS[outfit.garment].pieces.filter(pieceFilter) : GARMENTS[outfit.garment].pieces;
      return { ctx, res: drawPieces(pieces, ctx, P) };
    };
    if (o.outfit) {
      const g = GARMENTS[o.outfit.garment];
      if (g.accessory && o.base) {
        const b = build(o.base, p => p[0] !== 'hat');
        back += b.res.back; main += b.res.main;
      }
      layers = build(o.outfit);
      back += layers.res.back; main += layers.res.main; hat = layers.res.hat;
      if (o.outfit.trim && o.outfit.trim !== 'none') {
        const clipId = nid('c');
        const paths = layers.res.mainPaths.map(d => `<path d="${d}"/>`).join('') + (layers.res.mirrorMain || []).map(d => `<path d="${d}" transform="translate(160 0) scale(-1 1)"/>`).join('');
        defs += `<clipPath id="${clipId}">${paths}</clipPath>
          <pattern id="beads_${clipId}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#fff" opacity=".85"/><circle cx="5" cy="5" r="1" fill="#f3d27a" opacity=".9"/></pattern>`;
        if (g.accessory) {
          const t = o.outfit.trim;
          if (t === 'ribbon') hat += `<path d="M60 27 Q80 22 100 27 L100 32 Q80 27 60 32Z" fill="#f6efe0"/><path d="M96 26 l8 -6 l2 10z" fill="#f6efe0"/>`;
          else if (t === 'beads') hat += Array.from({ length: 9 }, (_, k) => `<circle cx="${62 + k * 4.5}" cy="${29.5 - Math.sin(k / 8 * Math.PI) * 3}" r="1.6" fill="#f3d27a" stroke="#a07a2a" stroke-width=".4"/>`).join('');
          else if (t !== 'none') hat += `<circle cx="96" cy="28" r="4" fill="#e88aa3"/>`;
        } else trim = trimSVG(o.outfit.trim, layers.res, P, layers.ctx.hex, clipId);
      }
    }

    const hairDef = o.mannequin ? null : HAIR[o.hair || 'short'];
    const hc = o.hairColor || '#3a2618';
    const covered = layers && layers.res.hasOuter;

    // legs + arms + torso skin
    const legs = mirror(`<path d="M${X - P.hi + 1} 172 L${X - 1} 176 L${X - 6} 266 L${X - 7} 346 L${X - 17} 346 L${X - 19} 266Z" fill="${skin}" stroke="${skinDk}" stroke-width=".8"/>`);
    const shoes = o.mannequin ? '' : mirror(`<path d="M${X - 19} 344 Q${X - 22} 356 ${X - 8} 356 L${X - 5} 356 L${X - 6} 344Z" fill="#3a2a24"/>`);
    const arms = mirror(`<path d="M${X - P.sh + 2} 80 Q${X - P.sh - 8} 82 ${X - P.sh - 9} 100 L${X - P.sh - 12} 140 L${X - P.sh - 10} 196 L${X - P.sh - 3} 196 L${X - P.sh - 2} 140 L${X - P.sh + 3} 104Z" fill="${skin}" stroke="${skinDk}" stroke-width=".8"/>
      <ellipse cx="${X - P.sh - 6.5}" cy="201" rx="5.5" ry="6.5" fill="${skin}" stroke="${skinDk}" stroke-width=".8"/>`);
    const torso = `<path d="M${X - P.sh + 2} 80 Q${X} 72 ${X + P.sh - 2} 80 L${X + P.wa} 150 L${X + P.hi} 180 L${X - P.hi} 180 L${X - P.wa} 150Z" fill="${skin}" stroke="${skinDk}" stroke-width=".8"/>`;
    const neck = `<rect x="73" y="54" width="14" height="26" rx="5" fill="${skin}"/><path d="M73 68 Q80 74 87 68" stroke="${skinDk}" fill="none" opacity=".6"/>`;
    const head = `<ellipse cx="80" cy="42" rx="17.5" ry="20.5" fill="${skin}" stroke="${skinDk}" stroke-width=".8"/>` +
      (o.mannequin ? '' : `<ellipse cx="62.5" cy="45" rx="3" ry="4.5" fill="${skin}"/><ellipse cx="97.5" cy="45" rx="3" ry="4.5" fill="${skin}"/>`);
    // underwear-ish modesty base so mannequins / customers never look bare
    const under = o.mannequin ? '' : `<path d="M${X - P.sh + 6} 92 Q${X} 100 ${X + P.sh - 6} 92 L${X + P.wa} 150 L${X + P.hi} 182 L${X - P.hi} 182 L${X - P.wa} 150Z" fill="#e9e1d6"/>`;

    let beard = '';
    if (!o.mannequin && o.beard === 'mustache') beard = `<path d="M72 50 Q76 47 80 49 Q84 47 88 50 Q84 53 80 51 Q76 53 72 50Z" fill="${hc}"/>`;
    if (!o.mannequin && o.beard === 'full') beard = `<path d="M63 44 Q63 66 80 66 Q97 66 97 44 Q95 58 88 58 Q84 52 80 53 Q76 52 72 58 Q65 58 63 44Z" fill="${hc}"/>`;

    const stand = o.mannequin ? `<rect x="77" y="200" width="6" height="150" fill="#7a5a44"/><path d="M52 368 Q80 352 108 368Z" fill="#7a5a44"/>` : '';

    return `<svg viewBox="0 -24 160 404" xmlns="http://www.w3.org/2000/svg" class="char">
      <defs>${defs}</defs>
      ${stand}
      ${hairDef ? hairPart(hairDef, 'back', hc) : ''}
      ${back}
      ${o.mannequin ? '' : legs + shoes}
      ${arms}${torso}${under}${neck}
      ${main}
      ${trim}
      ${head}
      ${o.mannequin ? '' : face(o.mood || 'neutral', skin)}
      ${beard}
      ${hairDef ? hairPart(hairDef, 'front', hc) + (hairDef.top && !hat ? `<g fill="${hc}" stroke="${hc}">${hairDef.top}</g>` : '') : ''}
      ${hat}
    </svg>`;
  }

  // Small garment preview on a dress form (pattern book, catalogue).
  function garmentPreview(garmentId, mat = 'cotton', color = 'ivory', trim = 'none') {
    const g = GARMENTS[garmentId];
    return character({ body: g.who === 'm' ? 'm' : 'f', mannequin: true, outfit: { garment: garmentId, mat, color, trim } });
  }

  // ---------- icons ----------
  function bolt(mat, colorKey, w = 30, h = 64) {
    const hex = COLORS[colorKey].hex;
    const f = fabric(mat, hex), ov = overlays(mat);
    return `<svg viewBox="0 0 30 64" width="${w}" height="${h}"><defs>${f.defs}${ov.defs}</defs>
      <rect x="2" y="2" width="26" height="60" rx="3" fill="${f.fill}" stroke="rgba(0,0,0,.35)"/>
      <rect x="2" y="2" width="26" height="60" rx="3" fill="${ov.shade}"/>
      ${ov.velvet ? `<rect x="2" y="2" width="26" height="60" rx="3" fill="${ov.velvet}"/>` : ''}
      <rect x="2" y="8" width="26" height="3" fill="rgba(0,0,0,.15)"/><rect x="9" y="26" width="12" height="9" rx="1" fill="#f6efdc" stroke="rgba(0,0,0,.2)"/></svg>`;
  }
  function swatch(mat, colorKey, size = 44) {
    const hex = COLORS[colorKey].hex;
    const f = fabric(mat, hex), ov = overlays(mat);
    return `<svg viewBox="0 0 40 40" width="${size}" height="${size}"><defs>${f.defs}${ov.defs}</defs>
      <rect width="40" height="40" rx="6" fill="${f.fill}"/><rect width="40" height="40" rx="6" fill="${ov.shade}"/>${ov.velvet ? `<rect width="40" height="40" rx="6" fill="${ov.velvet}"/>` : ''}</svg>`;
  }
  function dyeJar(colorKey, size = 40) {
    const hex = COLORS[colorKey].hex;
    return `<svg viewBox="0 0 40 46" width="${size}" height="${size * 1.15}">
      <rect x="10" y="2" width="20" height="7" rx="2" fill="#8a6a50"/>
      <path d="M8 10 H32 Q36 12 36 18 V40 Q36 44 32 44 H8 Q4 44 4 40 V18 Q4 12 8 10Z" fill="rgba(255,255,255,.55)" stroke="rgba(0,0,0,.3)"/>
      <path d="M6 22 H34 V40 Q34 42 32 42 H8 Q6 42 6 40Z" fill="${hex}"/>
      <path d="M9 14 V38" stroke="#fff" stroke-width="2.5" opacity=".6" stroke-linecap="round"/></svg>`;
  }
  function trimIcon(trim, size = 44) {
    const c = '#c2456b';
    const icons = {
      none: `<path d="M12 12 L32 32 M32 12 L12 32" stroke="#b9a9a0" stroke-width="3" stroke-linecap="round"/>`,
      buttons: `<circle cx="14" cy="16" r="7" fill="#d8b46a" stroke="#8a6a3a"/><circle cx="29" cy="28" r="8" fill="#5a3a2a" stroke="#2a1a12"/>` + [[12,14],[16,14],[12,18],[16,18],[27,26],[31,26],[27,30],[31,30]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#2a1a12"/>`).join(''),
      lace: Array.from({ length: 5 }, (_, i) => `<circle cx="${6 + i * 8}" cy="24" r="5" fill="#fffaf0" stroke="#bfae8e"/><circle cx="${6 + i * 8}" cy="24" r="1.6" fill="#d6c7a7"/>`).join('') + '<rect x="2" y="14" width="40" height="5" fill="#fffaf0" stroke="#bfae8e"/>',
      ribbon: `<path d="M22 22 L6 12 L6 32Z M22 22 L38 12 L38 32Z" fill="${c}"/><circle cx="22" cy="22" r="4" fill="${c}" stroke="#7a2040"/><path d="M20 25 L14 40 M24 25 L30 40" stroke="${c}" stroke-width="4"/>`,
      embroidery: [0, 72, 144, 216, 288].map(a => `<circle cx="${(22 + Math.cos(a * Math.PI / 180) * 7).toFixed(1)}" cy="${(20 + Math.sin(a * Math.PI / 180) * 7).toFixed(1)}" r="5" fill="${c}"/>`).join('') + '<circle cx="22" cy="20" r="4" fill="#f0c04a"/><path d="M22 28 Q20 36 14 40 M20 34 Q14 32 12 34" stroke="#3a8a5a" stroke-width="2" fill="none"/>',
      fringe: '<rect x="4" y="8" width="36" height="6" fill="#d9a93a"/>' + Array.from({ length: 12 }, (_, i) => `<path d="M${6 + i * 3} 14 L${6 + i * 3} 38" stroke="#d9a93a" stroke-width="1.5"/>`).join(''),
      beads: Array.from({ length: 16 }, (_, i) => `<circle cx="${8 + (i % 4) * 9}" cy="${8 + Math.floor(i / 4) * 9}" r="3" fill="${i % 3 ? '#f3d27a' : '#fff'}" stroke="#b08a3a" stroke-width=".6"/>`).join(''),
      rhinestones: [[14, 14, 7], [30, 22, 9], [16, 32, 6]].map(([x, y, r]) => `<path d="M${x} ${y - r} L${x + r * .35} ${y} L${x} ${y + r} L${x - r * .35} ${y}Z M${x - r} ${y} L${x} ${y - r * .35} L${x + r} ${y} L${x} ${y + r * .35}Z" fill="#cfe8ff" stroke="#7aa0c8" stroke-width=".6"/>`).join(''),
      patches: `<rect x="5" y="6" width="18" height="16" rx="3" fill="#e4a33a" stroke="#fff" stroke-dasharray="2 1.5" transform="rotate(-10 14 14)"/><circle cx="30" cy="28" r="9" fill="#4a90c2" stroke="#fff" stroke-dasharray="2 1.5"/><path d="M10 38 l6 -10 l6 10z" fill="#d94a4a"/>`,
      studs: Array.from({ length: 9 }, (_, i) => `<path d="M${10 + (i % 3) * 12} ${8 + Math.floor(i / 3) * 12} l4 4 l-4 4 l-4 -4z" fill="#e8e8ee" stroke="#666"/>`).join(''),
      print: `<rect x="6" y="6" width="32" height="32" rx="4" fill="#28252d"/><path d="M22 10 l3 7 l8 1 l-6 5 l2 8 l-7 -4 l-7 4 l2 -8 l-6 -5 l8 -1z" fill="#f6d36b"/>`,
    };
    return `<svg viewBox="0 0 44 44" width="${size}" height="${size}">${icons[trim] || ''}</svg>`;
  }
  function toolIcon(kind, level, size = 56) {
    const metal = ['#7a7a80', '#a8a8b0', '#c8b070', '#4a8ac8'][level] || '#999';
    const icons = {
      shears: level === 3
        ? `<circle cx="30" cy="28" r="15" fill="#d0d4da" stroke="#555" stroke-width="2"/><circle cx="30" cy="28" r="4" fill="#555"/><rect x="26" y="40" width="9" height="18" rx="4" fill="#3a8ad0"/>`
        : `<path d="M10 52 L38 14" stroke="${metal}" stroke-width="5" stroke-linecap="round"/><path d="M14 14 L42 50" stroke="${shade(metal, -0.2)}" stroke-width="5" stroke-linecap="round"/>
           <circle cx="12" cy="54" r="6" fill="none" stroke="${level === 2 ? '#c2456b' : '#3a3a40'}" stroke-width="3"/><circle cx="44" cy="52" r="6" fill="none" stroke="${level === 2 ? '#c2456b' : '#3a3a40'}" stroke-width="3"/>` +
          (level === 2 ? `<path d="M22 32 l3 -3 l3 3 l3 -3" stroke="#555" fill="none"/>` : ''),
      sewing: level === 0
        ? `<path d="M14 50 L46 10" stroke="#9a9aa2" stroke-width="3" stroke-linecap="round"/><ellipse cx="44" cy="13" rx="2.5" ry="4" fill="none" stroke="#9a9aa2" stroke-width="1.5" transform="rotate(40 44 13)"/><path d="M44 13 Q30 30 40 46 Q50 56 30 56" stroke="#c2456b" stroke-width="1.5" fill="none"/>`
        : `<rect x="6" y="44" width="48" height="8" rx="2" fill="${level === 1 ? '#5a3a24' : '#cfc8bc'}"/><path d="M10 44 V18 Q10 12 18 12 H46 Q52 12 52 18 V28 H44 V22 H20 V44Z" fill="${level === 1 ? '#222' : level === 2 ? '#e8e0d0' : '#8ab4d8'}" stroke="#333"/><rect x="40" y="28" width="5" height="12" fill="#999"/><circle cx="30" cy="17" r="3" fill="#c9a040"/>` +
          (level === 1 ? `<path d="M14 18 q8 -4 16 0" stroke="#c9a040" fill="none"/>` : ''),
      iron: `<path d="M6 46 Q8 28 26 26 H50 V46Z" fill="${['#333', '#b8b8c0', '#5aa0d0', '#e0e0e8'][level]}" stroke="#222"/><path d="M22 26 Q24 14 34 14 H46 Q50 14 50 20 V26" fill="none" stroke="#3a3030" stroke-width="5"/>` +
        (level >= 2 ? `<path d="M14 54 q2 -4 0 -6 M22 56 q2 -4 0 -6 M30 54 q2 -4 0 -6" stroke="#9ac" fill="none" stroke-width="1.5"/>` : ''),
    };
    return `<svg viewBox="0 0 60 60" width="${size}" height="${size}">${icons[kind]}</svg>`;
  }

  // ---------- scenes ----------
  const THEMES = {
    victorian: { wall: '#6a3b4a', wall2: '#5a2f3e', paper: 'damask', trim: '#c9a24a', floor: '#6b4630', floor2: '#5a3a26', floorKind: 'planks', sky: ['#c8b89a', '#8a8a96'], night: false, wains: '#3e2418', counter: '#5a3420', light: 'gas', curtain: '#7a1f2e' },
    twenties:  { wall: '#1f3a3a', wall2: '#244444', paper: 'deco', trim: '#d4af5a', floor: '#2b2622', floor2: '#e8dcc0', floorKind: 'checker', sky: ['#e8c890', '#9ab0c0'], wains: '#16282a', counter: '#2a1e18', light: 'deco', curtain: '#0e2a2a' },
    fifties:   { wall: '#a8dccd', wall2: '#f6c8d4', paper: 'diamond', trim: '#e04a6a', floor: '#f2ece0', floor2: '#c23a4a', floorKind: 'checker', sky: ['#9ad4f6', '#e8f6ff'], wains: '#e04a6a', counter: '#e8e4dc', light: 'neon', curtain: null },
    seventies: { wall: '#e8a040', wall2: '#c86a2a', paper: 'groovy', trim: '#7a3a1a', floor: '#7a4a2a', floor2: '#6a3a1e', floorKind: 'shag', sky: ['#f6b860', '#f6dca0'], wains: '#6a3a1e', counter: '#7a4a28', light: 'globe', curtain: '#a85a20' },
    nineties:  { wall: '#2f4a46', wall2: '#3a5a54', paper: 'brick', trim: '#c23a3a', floor: '#6a6460', floor2: '#5a5450', floorKind: 'concrete', sky: ['#9aa6b4', '#cdd4dc'], wains: '#222', counter: '#2a2a2e', light: 'track', curtain: null },
    modern:    { wall: '#efebe4', wall2: '#e4ded4', paper: 'plain', trim: '#c2456b', floor: '#d8c4a4', floor2: '#cbb594', floorKind: 'oak', sky: ['#8ec5ee', '#e6f4ff'], wains: '#e4ded4', counter: '#f6f4f0', light: 'pendant', curtain: null },
  };

  function wallpaper(t, id) {
    switch (t.paper) {
      case 'damask': return `<pattern id="${id}" width="44" height="56" patternUnits="userSpaceOnUse"><rect width="44" height="56" fill="${t.wall}"/><rect x="0" width="4" height="56" fill="${t.wall2}"/>
        <path d="M22 8 Q30 18 22 28 Q14 18 22 8Z M22 28 Q32 34 22 48 Q12 34 22 28Z" fill="${shade(t.wall, 0.12)}"/><circle cx="22" cy="28" r="3" fill="${shade(t.wall, 0.18)}"/></pattern>`;
      case 'deco': return `<pattern id="${id}" width="60" height="40" patternUnits="userSpaceOnUse"><rect width="60" height="40" fill="${t.wall}"/>
        <path d="M0 40 Q30 0 60 40" fill="none" stroke="${t.trim}" stroke-width="1.2" opacity=".55"/><path d="M10 40 Q30 12 50 40 M20 40 Q30 24 40 40" fill="none" stroke="${t.trim}" stroke-width="1" opacity=".4"/><path d="M30 40 V18" stroke="${t.trim}" opacity=".4"/></pattern>`;
      case 'diamond': return `<pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="${t.wall}"/><path d="M20 4 L34 20 L20 36 L6 20Z" fill="${t.wall2}" opacity=".55"/><circle cx="20" cy="20" r="2" fill="#fff" opacity=".7"/></pattern>`;
      case 'groovy': return `<pattern id="${id}" width="70" height="70" patternUnits="userSpaceOnUse"><rect width="70" height="70" fill="${t.wall}"/><circle cx="35" cy="35" r="30" fill="${t.wall2}"/><circle cx="35" cy="35" r="20" fill="#f2c060"/><circle cx="35" cy="35" r="10" fill="${t.trim}"/><circle cx="0" cy="0" r="14" fill="#f2c060"/><circle cx="70" cy="0" r="14" fill="#f2c060"/><circle cx="0" cy="70" r="14" fill="#f2c060"/><circle cx="70" cy="70" r="14" fill="#f2c060"/></pattern>`;
      case 'brick': return `<pattern id="${id}" width="48" height="24" patternUnits="userSpaceOnUse"><rect width="48" height="24" fill="${t.wall}"/><path d="M0 12 H48 M0 0 H48 M24 0 V12 M0 12 V24 M48 12 V24" stroke="${shade(t.wall, -0.25)}" stroke-width="1.5"/></pattern>`;
      default: return `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${t.wall}"/></pattern>`;
    }
  }

  function floor(t, id) {
    switch (t.floorKind) {
      case 'planks': return `<pattern id="${id}" width="120" height="24" patternUnits="userSpaceOnUse"><rect width="120" height="24" fill="${t.floor}"/><path d="M0 0 H120 M0 12 H120 M40 0 V12 M100 12 V24" stroke="${t.floor2}" stroke-width="2"/></pattern>`;
      case 'checker': return `<pattern id="${id}" width="56" height="28" patternUnits="userSpaceOnUse"><rect width="56" height="28" fill="${t.floor}"/><rect width="28" height="14" fill="${t.floor2}"/><rect x="28" y="14" width="28" height="14" fill="${t.floor2}"/></pattern>`;
      case 'shag': return `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${t.floor}"/><path d="M1 8 l1 -5 M5 8 l1 -6" stroke="${t.floor2}" stroke-width="1.4"/></pattern>`;
      case 'concrete': return `<pattern id="${id}" width="200" height="60" patternUnits="userSpaceOnUse"><rect width="200" height="60" fill="${t.floor}"/><circle cx="40" cy="20" r="1" fill="${t.floor2}"/><circle cx="140" cy="44" r="1.4" fill="${t.floor2}"/><path d="M0 59 H200 M100 0 V60" stroke="${t.floor2}"/></pattern>`;
      default: return `<pattern id="${id}" width="160" height="20" patternUnits="userSpaceOnUse"><rect width="160" height="20" fill="${t.floor}"/><path d="M0 0 H160 M60 0 V20" stroke="${t.floor2}"/></pattern>`;
    }
  }

  function windowView(eraId, t) {
    const sky = nid('sky');
    let props = '';
    const bld = (fill) => `<path d="M30 270 V170 H70 V150 H100 V185 H130 V140 H170 V200 H210 V270Z" fill="${fill}"/>` +
      Array.from({ length: 10 }, (_, i) => `<rect x="${40 + (i % 5) * 34}" y="${180 + Math.floor(i / 5) * 30}" width="8" height="12" fill="#f6dc8a" opacity="${0.4 + (i % 3) * 0.2}"/>`).join('');
    switch (eraId) {
      case 'victorian': props = bld('#5a5560') + `<rect x="150" y="190" width="4" height="80" fill="#222"/><path d="M144 186 h16 l-3 10 h-10z" fill="#222"/><circle cx="152" cy="192" r="4" fill="#ffd27a"/><path d="M40 270 q20 -30 50 -6 l6 6z" fill="#3a2a22"/><circle cx="54" cy="266" r="6" fill="none" stroke="#222" stroke-width="2"/>`; break;
      case 'twenties': props = bld('#4a4a58') + `<path d="M50 262 q4 -18 30 -18 h30 q14 0 20 18z" fill="#1a1a1e"/><circle cx="66" cy="264" r="7" fill="#333" stroke="#999"/><circle cx="116" cy="264" r="7" fill="#333" stroke="#999"/>`; break;
      case 'fifties': props = bld('#d8b8c8') + `<rect x="120" y="150" width="70" height="24" rx="6" fill="#e04a6a"/><text x="155" y="167" font-size="12" text-anchor="middle" fill="#fff" font-family="Marker Felt, Comic Sans MS, cursive">DINER</text><path d="M44 262 q10 -20 40 -20 h40 q20 0 26 20z" fill="#5ac8c8"/>`; break;
      case 'seventies': props = `<circle cx="160" cy="170" r="26" fill="#ffd27a"/><path d="M30 270 V210 Q90 180 210 215 V270Z" fill="#c86a2a"/><path d="M30 270 V235 Q110 210 210 240 V270Z" fill="#8a4a1e"/>`; break;
      case 'nineties': props = bld('#6a7480') + `<rect x="48" y="200" width="40" height="30" fill="#3a3a44"/><text x="68" y="219" font-size="9" text-anchor="middle" fill="#ff5a5a" font-family="Impact, sans-serif">VIDEO</text>`; break;
      default: props = `<path d="M30 270 V130 H80 V270Z M90 270 V160 H140 V270Z M150 270 V110 H210 V270Z" fill="#b8ccd8"/>` + Array.from({ length: 12 }, (_, i) => `<rect x="${36 + (i % 6) * 30}" y="${140 + Math.floor(i / 6) * 40}" width="18" height="24" fill="#e6f4ff" opacity=".7"/>`).join(''); break;
    }
    return `<defs><linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.sky[0]}"/><stop offset="1" stop-color="${t.sky[1]}"/></linearGradient></defs>
      <rect x="28" y="72" width="184" height="200" fill="url(#${sky})"/>${props}
      <rect x="28" y="72" width="184" height="200" fill="#fff" opacity=".08"/>
      <path d="M120 72 V272 M28 170 H212" stroke="${t.trim}" stroke-width="5"/>
      <rect x="22" y="66" width="196" height="212" fill="none" stroke="${t.trim}" stroke-width="10"/>
      <rect x="16" y="276" width="208" height="10" fill="${shade(t.trim, -0.2)}"/>
      ${t.curtain ? `<path d="M12 58 H70 Q60 160 72 290 H12Z" fill="${t.curtain}"/><path d="M170 58 H228 V290 H168 Q180 160 170 58Z" fill="${t.curtain}"/><path d="M12 58 H228 V78 Q120 92 12 78Z" fill="${shade(t.curtain, -0.15)}"/>` : ''}`;
  }

  function lights(t) {
    switch (t.light) {
      case 'gas': return [330, 500].map(x => `<rect x="${x - 3}" y="110" width="6" height="22" fill="#b08a3a"/><path d="M${x - 10} 108 h20 l-4 -18 h-12z" fill="#fff6d0" opacity=".55" stroke="#b08a3a"/><ellipse cx="${x}" cy="98" rx="4" ry="7" fill="#ffcf5a"/><circle cx="${x}" cy="100" r="40" fill="#ffd27a" opacity=".13"/>`).join('');
      case 'deco': return `<rect x="414" y="0" width="2" height="40" fill="#d4af5a"/><path d="M390 40 h50 l-10 22 h-30z" fill="#e8d6a0" stroke="#d4af5a"/><circle cx="415" cy="70" r="70" fill="#ffe2a0" opacity=".12"/>`;
      case 'neon': return `<rect x="38" y="90" width="80" height="30" rx="8" fill="none" stroke="#ff4a8a" stroke-width="3" opacity=".9"/><text x="78" y="111" font-size="16" text-anchor="middle" fill="#ff8ab8" font-family="Marker Felt, Comic Sans MS, cursive">OPEN</text><rect x="414" y="0" width="2" height="34" fill="#888"/><path d="M396 34 h38 q-4 16 -19 16 q-15 0 -19 -16z" fill="#e04a6a"/>`;
      case 'globe': return [360, 470].map((x, i) => `<rect x="${x - 1}" y="0" width="2" height="${36 + i * 14}" fill="#5a3a1a"/><circle cx="${x}" cy="${48 + i * 14}" r="14" fill="#ffb84a"/><circle cx="${x}" cy="${48 + i * 14}" r="40" fill="#ffb84a" opacity=".12"/>`).join('') + `<path d="M250 0 v40" stroke="#7a5a3a" stroke-width="2"/><path d="M236 40 h28 l-4 18 h-20z" fill="#c86a3a"/><path d="M240 40 q-20 20 -14 46 M250 40 q0 30 -6 56 M260 40 q18 20 16 44" stroke="#3a8a3a" stroke-width="4" fill="none"/>`;
      case 'track': return `<rect x="300" y="14" width="220" height="5" fill="#222"/>` + [330, 410, 490].map(x => `<path d="M${x} 19 l-8 14 h16z" fill="#333"/><path d="M${x - 8} 33 L${x - 40} 200 L${x + 40} 200 L${x + 8} 33Z" fill="#fff6d0" opacity=".06"/>`).join('');
      default: return [360, 460].map(x => `<rect x="${x - 1}" y="0" width="2" height="44" fill="#333"/><path d="M${x - 16} 60 Q${x} 36 ${x + 16} 60Z" fill="#2a2a2e"/><circle cx="${x}" cy="60" r="36" fill="#fff6d8" opacity=".12"/>`).join('');
    }
  }

  function shopScene(era, state, eraIdx) {
    const t = THEMES[era.id];
    const wp = nid('wp'), fl = nid('fl');
    // fabric bolts on shelves: owned materials × era colors
    const mats = state.owned.mats.filter(m => MATERIALS[m]);
    const cols = era.colors.filter(c => state.owned.colors.includes(c));
    const palette = cols.length ? cols : state.owned.colors;
    let bolts = '';
    let i = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 7; col++) {
        const mat = mats[(i) % mats.length];
        const colr = palette[(i * 3 + row) % palette.length];
        if (i < mats.length * 2 || i < 6) {
          const x = 540 + col * 34, y = 76 + row * 64;
          bolts += `<g transform="translate(${x} ${y})">${bolt(mat, colr, 26, 54)}</g>`;
        }
        i++;
      }
    }
    // Family portraits for previous eras
    let frames = '';
    for (let e = 0; e < eraIdx; e++) {
      const x = 318 + e * 40;
      frames += `<rect x="${x}" y="72" width="32" height="40" fill="${t.trim}" rx="2"/><rect x="${x + 4}" y="76" width="24" height="32" fill="#d8c8a8"/>
        <ellipse cx="${x + 16}" cy="88" rx="6" ry="7" fill="#8a6a50"/><path d="M${x + 6} 108 Q${x + 16} 94 ${x + 26} 108Z" fill="#6a4a38"/>`;
    }
    const register = era.id === 'modern'
      ? `<rect x="690" y="244" width="46" height="30" rx="3" fill="#222"/><rect x="694" y="248" width="38" height="22" fill="#6ab0e0"/><rect x="708" y="272" width="10" height="6" fill="#555"/>`
      : era.id === 'nineties'
        ? `<rect x="680" y="236" width="60" height="38" rx="4" fill="#d8d4cc"/><rect x="688" y="242" width="30" height="12" fill="#3a5a3a"/><rect x="688" y="258" width="44" height="12" fill="#bbb"/>`
        : `<path d="M680 274 V244 Q680 234 690 232 H732 Q742 234 742 244 V274Z" fill="${era.id === 'fifties' ? '#c8c8d0' : '#b08a3a'}" stroke="#5a4020"/><rect x="690" y="224" width="40" height="12" rx="2" fill="#f6efdc" stroke="#5a4020"/>` +
          Array.from({ length: 6 }, (_, k) => `<circle cx="${692 + (k % 3) * 18}" cy="${252 + Math.floor(k / 3) * 12}" r="4" fill="#f6efdc" stroke="#5a4020"/>`).join('');
    const bg = `<svg viewBox="0 0 800 450" class="scene" xmlns="http://www.w3.org/2000/svg">
      <defs>${wallpaper(t, wp)}${floor(t, fl)}
        <linearGradient id="${wp}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".3" stop-color="#000" stop-opacity="0"/></linearGradient>
        <linearGradient id="${fl}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
      <rect width="800" height="336" fill="url(#${wp})"/>
      <rect y="250" width="800" height="86" fill="${t.wains}" opacity=".85"/><rect y="248" width="800" height="4" fill="${t.trim}"/>
      <rect width="800" height="336" fill="url(#${wp}v)"/>
      <rect y="336" width="800" height="114" fill="url(#${fl})"/><rect y="336" width="800" height="114" fill="url(#${fl}v)"/>
      <rect y="332" width="800" height="6" fill="${shade(t.wains, -0.3)}"/>
      ${windowView(era.id, t)}
      <g><rect x="232" y="118" width="78" height="218" fill="${shade(t.counter, -0.1)}" stroke="${t.trim}" stroke-width="5"/>
        <rect x="244" y="130" width="54" height="70" fill="#cfe2ea" opacity=".75"/><rect x="244" y="212" width="54" height="40" fill="${shade(t.counter, 0.08)}"/><rect x="244" y="262" width="54" height="56" fill="${shade(t.counter, 0.08)}"/>
        <circle cx="296" cy="236" r="4" fill="#d8b04a"/><path d="M262 108 h18 v6 h-18z" fill="#b08a3a"/><path d="M265 114 q6 14 12 0z" fill="#d8b04a" class="shopbell"/></g>
      ${lights(t)}
      <rect x="340" y="16" width="230" height="40" rx="6" fill="${shade(t.wains, -0.2)}" stroke="${t.trim}" stroke-width="3"/>
      <text x="455" y="43" font-size="20" text-anchor="middle" fill="${t.trim}" class="signfont">${era.shopName}</text>
      ${frames}
      <rect x="528" y="62" width="258" height="196" fill="${shade(t.counter, -0.25)}"/>
      ${[132, 196, 258].map(y => `<rect x="524" y="${y}" width="266" height="8" fill="${shade(t.counter, 0.1)}"/>`).join('')}
      ${bolts}
      <ellipse cx="400" cy="400" rx="150" ry="22" fill="${t.trim}" opacity=".18"/>
    </svg>`;
    const fg = `<svg viewBox="0 0 800 450" class="scene" xmlns="http://www.w3.org/2000/svg">
      <rect x="500" y="266" width="296" height="12" rx="3" fill="${shade(t.counter, 0.15)}"/>
      <rect x="506" y="278" width="284" height="100" fill="${t.counter}"/>
      <rect x="520" y="292" width="120" height="72" fill="none" stroke="${shade(t.counter, 0.18)}" stroke-width="3"/><rect x="654" y="292" width="120" height="72" fill="none" stroke="${shade(t.counter, 0.18)}" stroke-width="3"/>
      ${register}
      <g transform="translate(560 236)"><rect x="0" y="12" width="44" height="28" rx="4" fill="#c8e0e8" opacity=".7"/>${['#c2456b', '#3a7ac0', '#e0b030', '#4a9a5a'].map((c, k) => `<rect x="${4 + k * 10}" y="${k % 2 ? 4 : 8}" width="8" height="${k % 2 ? 32 : 28}" rx="2" fill="${c}"/>`).join('')}</g>
    </svg>`;
    return { back: bg, front: fg };
  }

  function workroomScene(era, tools) {
    const t = THEMES[era.id];
    const wp = nid('wp');
    return `<svg viewBox="0 0 800 450" class="scene" xmlns="http://www.w3.org/2000/svg">
      <defs>${wallpaper({ ...t, wall: shade(t.wall, -0.15), wall2: shade(t.wall2, -0.15) }, wp)}
        <linearGradient id="${wp}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98a5a"/><stop offset="1" stop-color="#8a5a34"/></linearGradient></defs>
      <rect width="800" height="450" fill="url(#${wp})"/>
      <rect width="800" height="450" fill="#000" opacity=".12"/>
      <rect x="600" y="20" width="170" height="150" fill="${t.sky[1]}" stroke="${t.trim}" stroke-width="8"/><path d="M685 20 V170 M600 95 H770" stroke="${t.trim}" stroke-width="4"/>
      <path d="M600 20 L520 330 L700 330 L770 20Z" fill="#fff7d8" opacity=".07"/>
      <rect x="226" y="24" width="350" height="150" rx="4" fill="#c9a87a" stroke="#7a5a3a" stroke-width="4"/>
      ${Array.from({ length: 60 }, (_, i) => `<circle cx="${242 + (i % 15) * 22}" cy="${40 + Math.floor(i / 15) * 34}" r="2" fill="#7a5a3a" opacity=".5"/>`).join('')}
      <g transform="translate(240 40)">${toolIcon('shears', tools.shears, 70)}</g>
      <g transform="translate(320 46)">${toolIcon('iron', tools.iron, 70)}</g>
      <g transform="translate(400 40)"><circle cx="30" cy="30" r="22" fill="#e8d24a" stroke="#8a7a2a" stroke-width="2"/><circle cx="30" cy="30" r="8" fill="#8a7a2a"/><path d="M30 52 Q40 90 20 120" stroke="#e8d24a" stroke-width="7" fill="none"/></g>
      <g transform="translate(476 40)"><ellipse cx="30" cy="40" rx="24" ry="20" fill="#c2456b"/><path d="M14 30 l-6 -14 M24 24 l-2 -16 M36 24 l4 -16 M44 32 l10 -10" stroke="#888" stroke-width="2"/>${['#fff', '#ffd24a', '#4a8ad0', '#222'].map((c, k) => `<circle cx="${[8, 22, 40, 54][k]}" cy="${[16, 8, 8, 22][k]}" r="3" fill="${c}"/>`).join('')}</g>
      <g transform="translate(250 118)">${['#c2456b', '#3a7ac0', '#e0b030', '#4a9a5a', '#7a3fa0', '#222', '#e86a3a'].map((c, k) => `<rect x="${k * 44}" y="0" width="22" height="34" rx="3" fill="${c}"/><rect x="${k * 44 - 3}" y="-3" width="28" height="6" rx="2" fill="#c9a06a"/><rect x="${k * 44 - 3}" y="31" width="28" height="6" rx="2" fill="#c9a06a"/>`).join('')}</g>
      <rect x="0" y="300" width="800" height="150" fill="url(#${wp}t)"/>
      <rect x="0" y="296" width="800" height="10" fill="#6a4024"/>
      ${Array.from({ length: 8 }, (_, i) => `<path d="M0 ${320 + i * 18} H800" stroke="#7a4a2a" opacity=".35"/>`).join('')}
      <rect x="40" y="312" width="720" height="128" fill="#3a6a5a" opacity=".9" rx="6"/>
      ${Array.from({ length: 24 }, (_, i) => `<path d="M${60 + i * 30} 312 V440" stroke="#fff" opacity=".12"/>`).join('')}
      ${Array.from({ length: 4 }, (_, i) => `<path d="M40 ${340 + i * 30} H760" stroke="#fff" opacity=".12"/>`).join('')}
    </svg>`;
  }

  return { character, garmentPreview, bolt, swatch, dyeJar, trimIcon, toolIcon, shopScene, workroomScene, shade, fabric, overlays, THEMES };
})();
