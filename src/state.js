/* Clankers helped me! - shared config + default state model. */
window.CLANK = window.CLANK || {};
(function (C) {
  'use strict';

  C.DEFAULT_DESC = 'Clankers helped me build my game!';
  C.DEFAULT_HEADLINE = 'Clankers helped me!';
  C.DEFAULT_SIZE = '512x512';

  C.CATEGORIES = [
    { id: 'code',       label: 'Code generation / game logic', emoji: '💻' },
    { id: 'learning',   label: 'Learning',   emoji: '📚' },
    { id: 'testing',    label: 'Testing',    emoji: '🧪' },
    { id: 'fun',        label: 'Fun',        emoji: '🎉' },
    { id: 'innovation', label: 'Innovation', emoji: '💡' },
    { id: 'theme',      label: 'Theme',      emoji: '🎯' },
    { id: 'graphics',   label: 'Graphics',   emoji: '🎨' },
    { id: 'audio',      label: 'Audio',      emoji: '🎵' },
    { id: 'humor',      label: 'Humor',      emoji: '😂' },
    { id: 'mood',       label: 'Mood',       emoji: '🌙' }
  ];

  C.PRICE_MODES = [
    { id: 'none',   label: 'Free (0$)' },
    { id: 'tokens', label: 'Price in API tokens' },
    { id: 'month',  label: 'Price per month' }
  ];

  C.LEVELS = [
    { id: '0', name: 'Manual',              emoji: '✋', desc: 'Manual coding with zero AI assistance.' },
    { id: '1', name: 'Autocomplete',        emoji: '⌨️', desc: 'Basic inline autocomplete for isolated tasks.' },
    { id: '2', name: 'AI Pairing',          emoji: '🤝', desc: 'Interactive AI pairing with multi-file awareness.' },
    { id: '3', name: 'Code Review',         emoji: '🔍', desc: "The human's primary role shifts to code review as AI writes major functional blocks." },
    { id: '4', name: 'Autonomous Agents',   emoji: '🤖', desc: 'Autonomous agents execute high-level specs through self-correcting loops.' },
    { id: '5', name: 'Dark Software Factory', emoji: '🏭', desc: 'The dark software factory: software generated from specifications with zero human intervention.' }
  ];

  C.SIZES = [
    { id: '512x512',   label: 'Super compact · 512 × 512' },
    { id: '1080x1080', label: 'Square · 1080 × 1080' },
    { id: '1200x630',  label: 'Wide · 1200 × 630' },
    { id: '1200x1200', label: 'Large square · 1200 × 1200' },
    { id: '900x1200',  label: 'Portrait · 900 × 1200' },
    { id: '250x250',   label: 'Tiny · 250 × 250' }
  ];

  C.defaultState = function () {
    return {
      v: 1,
      title: '',
      nickname: '',
      headline: C.DEFAULT_HEADLINE,
      desc: C.DEFAULT_DESC,
      img: '',
      size: C.DEFAULT_SIZE,
      bg: true,
      showToolPrice: true,
      categories: C.CATEGORIES.map(function (cat) { return { id: cat.id, on: false, note: '' }; }),
      tools: [],
      level: '',
      footer: ''
    };
  };

  /* Accepts both the compact share format (t/d/c/lv/...) and a full state object. */
  /* AI tool entry: { name, note, priceMode, price } */
  C.newTool = function (name) {
    return { name: name || '', note: '', priceMode: 'none', price: '' };
  };

  C.normalizeTool = function (t) {
    if (typeof t === 'string') return t.trim() ? C.newTool(t.trim()) : null;
    if (!t || typeof t !== 'object') return null;

    var name = str(t.n, str(t.name, '')).trim();
    if (!name) return null;

    var tool = C.newTool(name);
    tool.note = str(t.h, str(t.note, ''));

    var mode = t.priceMode, price = t.price;
    if (typeof t.p === 'string' && t.p.indexOf(':') > 0) {
      var ix = t.p.indexOf(':');
      mode = t.p.slice(0, ix);
      price = t.p.slice(ix + 1);
    }
    tool.priceMode = C.PRICE_MODES.some(function (m) { return m.id === mode; }) ? mode : 'none';
    tool.price = str(price, '');
    return tool;
  };

  C.normalize = function (raw) {
    var d = C.defaultState();
    if (!raw || typeof raw !== 'object') return d;

    var out = d;
    out.title  = str(raw.t, str(raw.title, ''));
    out.nickname = str(raw.by, str(raw.nickname, ''));
    out.headline = str(raw.hd, str(raw.headline, d.headline)) || d.headline;
    out.desc   = str(raw.d, str(raw.desc, d.desc));
    out.img    = str(raw.img, '');
    out.footer = str(raw.f, str(raw.footer, ''));

    var sz = raw.sz != null ? raw.sz : raw.size;
    out.size = C.SIZES.some(function (s) { return s.id === sz; }) ? sz : d.size;
    out.bg = raw.bg === false ? false : true;
    out.showToolPrice = (raw.sp === false || raw.showToolPrice === false) ? false : true;

    var tools = Array.isArray(raw.tl) ? raw.tl : (Array.isArray(raw.tools) ? raw.tools : []);
    out.tools = tools.map(C.normalizeTool).filter(Boolean);

    var lv = raw.lv != null ? raw.lv : raw.level;
    out.level = lv != null ? String(lv) : '';
    if (!C.LEVELS.some(function (l) { return l.id === out.level; })) out.level = '';

    var rawCats = Array.isArray(raw.c) ? raw.c : (Array.isArray(raw.categories) ? raw.categories : []);
    var map = {};
    rawCats.forEach(function (rc) {
      if (!rc) return;
      if (typeof rc === 'string') { map[rc] = { on: true, note: '' }; return; }
      var id = rc.i || rc.id;
      if (!id) return;
      map[id] = { on: rc.on === undefined ? true : !!rc.on, note: str(rc.n, str(rc.note, '')) };
    });
    out.categories = C.CATEGORIES.map(function (cat) {
      var m = map[cat.id];
      return { id: cat.id, on: m ? m.on : false, note: m ? m.note : '' };
    });

    return out;
  };

  C.categoryMeta = function (id) {
    for (var i = 0; i < C.CATEGORIES.length; i++) {
      if (C.CATEGORIES[i].id === id) return C.CATEGORIES[i];
    }
    return { id: id, label: id, emoji: '✨' };
  };

  C.levelMeta = function (id) {
    for (var i = 0; i < C.LEVELS.length; i++) {
      if (C.LEVELS[i].id === String(id)) return C.LEVELS[i];
    }
    return null;
  };

  function str(v, fallback) { return typeof v === 'string' ? v : fallback; }
})(window.CLANK);
