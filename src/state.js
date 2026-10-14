/* Clankers helped me! - shared config + default state model. */
window.CLANK = window.CLANK || {};
(function (C) {
  'use strict';

  C.DEFAULT_DESC = 'Clankers helped me build my game!';

  C.CATEGORIES = [
    { id: 'fun',        label: 'Fun',        emoji: '🎉' },
    { id: 'innovation', label: 'Innovation', emoji: '💡' },
    { id: 'theme',      label: 'Theme',      emoji: '🎯' },
    { id: 'graphics',   label: 'Graphics',   emoji: '🎨' },
    { id: 'audio',      label: 'Audio',      emoji: '🎵' },
    { id: 'humor',      label: 'Humor',      emoji: '😂' },
    { id: 'mood',       label: 'Mood',       emoji: '🌙' }
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
    { id: '1080x1080', label: 'Square · 1080 × 1080' },
    { id: '1200x630',  label: 'Wide · 1200 × 630' },
    { id: '1200x1200', label: 'Large square · 1200 × 1200' },
    { id: '900x1200',  label: 'Portrait · 900 × 1200' }
  ];

  C.defaultState = function () {
    return {
      v: 1,
      title: '',
      desc: C.DEFAULT_DESC,
      img: '',
      size: C.SIZES[0].id,
      bg: true,
      categories: C.CATEGORIES.map(function (cat) { return { id: cat.id, on: false, note: '' }; }),
      tools: [],
      level: '',
      footer: ''
    };
  };

  /* Accepts both the compact share format (t/d/c/lv/...) and a full state object. */
  C.normalize = function (raw) {
    var d = C.defaultState();
    if (!raw || typeof raw !== 'object') return d;

    var out = d;
    out.title  = str(raw.t, str(raw.title, ''));
    out.desc   = str(raw.d, str(raw.desc, d.desc));
    out.img    = str(raw.img, '');
    out.footer = str(raw.f, str(raw.footer, ''));

    var sz = raw.sz != null ? raw.sz : raw.size;
    out.size = C.SIZES.some(function (s) { return s.id === sz; }) ? sz : d.size;
    out.bg = raw.bg === false ? false : true;

    var tools = Array.isArray(raw.tl) ? raw.tl : (Array.isArray(raw.tools) ? raw.tools : []);
    out.tools = tools.filter(function (x) { return typeof x === 'string' && x.trim(); }).map(function (x) { return x.trim(); });

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
