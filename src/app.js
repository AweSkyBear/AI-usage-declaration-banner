/* AI Usage - admin UI wiring. */
(function () {
  'use strict';
  var C = window.AIU;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  var canvas = $('#canvas');
  var els = {
    text: $('#fText'),
    size: $('#fSize'),
    share: $('#shareUrl'),
    sizeBadge: $('#sizeBadge'),
    hint: $('#hint'),
    sharedBy: $('#sharedBy'),
    toast: $('#toast'),
    previewTitle: $('.preview-title')
  };

  var state = C.defaultState();
  var timer = 0;
  var sharedMode = false;
  var keepEditFlag = false;
  var hashCur = '';
  var animT = 0;
  var rafId = 0;
  var animStart = 0;
  var motionOk = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- helpers ---------- */
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { els.toast.classList.remove('show'); }, 2600);
  }

  function schedule(delay) {
    clearTimeout(timer);
    timer = setTimeout(function () { timer = 0; update(); }, delay == null ? 70 : delay);
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || '';
  }

  function stamp(d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  function fileName() {
    var t = slug(state.text);
    return ['ai-usage', t, stamp(new Date())].filter(Boolean).join('-') + '.png';
  }

  /* ---------- build UI ---------- */
  function buildSizes() {
    els.size.innerHTML = '';
    C.SIZES.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.label;
      els.size.appendChild(o);
    });
    els.size.value = C.DEFAULT_SIZE;
  }

  /* ---------- form <-> state ---------- */
  function readForm() {
    state.text = els.text.value;
    state.size = els.size.value;
  }

  function writeForm(s) {
    els.text.value = s.text || '';
    els.size.value = s.size || C.DEFAULT_SIZE;
  }

  /* ---------- render + share ---------- */
  function paint(t) {
    C.render(canvas, state, { animate: motionOk && !sharedMode, time: t });
  }

  function startAnim() {
    if (!motionOk || rafId) return;
    var step = function (ts) {
      if (!animStart) animStart = ts;
      animT = (ts - animStart) / 1000;
      paint(animT);
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  }

  function stopAnim() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  function editUrl(url) {
    if (!keepEditFlag) return url;
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'e=1';
  }

  function update() {
    if (!sharedMode) readForm();
    var share = C.makeShare(state);
    hashCur = share.hash;
    animT = animT || 0;
    paint(animT);
    els.sizeBadge.textContent = canvas.width + ' × ' + canvas.height;
    if (sharedMode) return;

    els.share.value = share.url;
    try { history.replaceState(null, '', editUrl(share.url)); } catch (e) { /* file:// */ }
    startAnim();
  }

  /* ---------- read-only shared link ---------- */
  function enterSharedMode() {
    document.body.classList.add('shared');
    els.sharedBy.textContent = 'Shared banner';
    els.sharedBy.hidden = false;
    if (els.previewTitle) els.previewTitle.textContent = 'Banner';
    Array.prototype.forEach.call(
      document.querySelectorAll('input, select, button'),
      function (el) {
        /* Download stays usable in the shared view; fork/GitHub are shared-only. */
        if (!el.classList.contains('shared-only') && el.id !== 'btnDownload') el.disabled = true;
      }
    );
  }

  /* ---------- fork a shared link back into the editor ---------- */
  function exitSharedMode() {
    sharedMode = false;
    keepEditFlag = true;
    document.body.classList.remove('shared');
    els.sharedBy.hidden = true;
    if (els.previewTitle) els.previewTitle.textContent = 'Preview';
    Array.prototype.forEach.call(
      document.querySelectorAll('input, select, button'),
      function (el) { el.disabled = false; }
    );
    writeForm(state);
    update();
    toast('Forked — edit away.');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function copyShare() {
    var url = C.makeShare(state).url;
    copyText(url).then(function (ok) {
      toast(ok ? 'Share URL copied.' : 'Copy failed — select the field and press Ctrl+C.');
    });
  }

  function download() {
    var name = fileName();
    stopAnim();
    paint(0);
    canvas.toBlob(function (blob) {
      if (!blob) { toast('Could not export the image.'); startAnim(); return; }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      toast('PNG downloaded.');
      startAnim();
    }, 'image/png');
  }

  /* ---------- events ---------- */
  function bind() {
    els.text.addEventListener('input', function () { schedule(); });
    els.size.addEventListener('change', function () { schedule(0); });

    $('#btnGenerate').addEventListener('click', function () {
      update();
      toast('Banner generated.');
    });
    $('#btnCopyShare').addEventListener('click', copyShare);
    $('#btnCopyField').addEventListener('click', copyShare);
    $('#btnDownload').addEventListener('click', download);
    $('#btnEditShared').addEventListener('click', exitSharedMode);
  }

  /* ---------- boot ---------- */
  function boot() {
    buildSizes();

    var fromUrl = C.readUrlState();
    var editFlag = /[?&]e=1(?:&|$)/.test(location.search);
    sharedMode = !!fromUrl && !editFlag;
    keepEditFlag = !!fromUrl && editFlag;
    state = fromUrl ? C.normalize(fromUrl) : C.defaultState();

    writeForm(state);
    if (sharedMode) enterSharedMode();
    bind();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAnim(); else if (!sharedMode) startAnim();
    });
    update();
  }

  boot();
})();
