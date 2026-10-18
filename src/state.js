/* AI Usage - shared config + default state model. */
window.AIU = window.AIU || {};
(function (C) {
  'use strict';

  C.DEFAULT_TEXT = 'AI usage: this project was made with AI assistance.';
  C.DEFAULT_SIZE = '270x80';

  C.SIZES = [
    { id: '270x80',  label: 'Small · 270 × 80' },
    { id: '480x110', label: 'Large · 480 × 110' }
  ];

  C.defaultState = function () {
    return {
      v: 2,
      text: C.DEFAULT_TEXT,
      size: C.DEFAULT_SIZE
    };
  };

  /* Accepts both the current compact format (x/sz) and a full state object.
     Legacy v1 payloads (d/sz from the old generator) are read as text/size
     so that previously shared links keep working. */
  C.normalize = function (raw) {
    var d = C.defaultState();
    if (!raw || typeof raw !== 'object') return d;

    var out = d;
    out.text = str(raw.x, str(raw.text, str(raw.d, d.text)));
    var sz = raw.sz != null ? raw.sz : raw.size;
    out.size = C.SIZES.some(function (s) { return s.id === sz; }) ? sz : d.size;
    return out;
  };

  function str(v, fallback) { return typeof v === 'string' ? v : fallback; }
})(window.AIU);
