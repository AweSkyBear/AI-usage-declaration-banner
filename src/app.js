/* Clankers helped me! - admin UI wiring. */
(function () {
  'use strict';
  var C = window.CLANK;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  var canvas = $('#canvas');
  var els = {
    form: $('#form'),
    title: $('#fTitle'),
    desc: $('#fDesc'),
    footer: $('#fFooter'),
    level: $('#fLevel'),
    levelDesc: $('#levelDesc'),
    size: $('#fSize'),
    bg: $('#fBg'),
    thumbFile: $('#fThumb'),
    thumbClear: $('#btnThumbClear'),
    thumbPreview: $('#thumbPreview'),
    catWrap: $('#categories'),
    toolList: $('#toolList'),
    toolInput: $('#fTool'),
    addTool: $('#btnAddTool'),
    share: $('#shareUrl'),
    seed: $('#seedBadge'),
    hint: $('#hint'),
    toast: $('#toast'),
    previewCard: $('.preview-card'),
    previewCol: $('.preview')
  };

  var state = C.defaultState();
  var robotImg = null;
  var thumbImg = null;
  var timer = 0;

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

  function readAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'banner';
  }

  /* ---------- build UI ---------- */
  function buildCategories() {
    els.catWrap.innerHTML = '';
    C.CATEGORIES.forEach(function (cat) {
      var item = document.createElement('div');
      item.className = 'cat-item';
      item.dataset.cat = cat.id;

      var label = document.createElement('label');
      label.className = 'cat-head';

      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.cat = cat.id;

      var emoji = document.createElement('span');
      emoji.className = 'cat-emoji';
      emoji.textContent = cat.emoji;

      var text = document.createElement('span');
      text.className = 'cat-label';
      text.textContent = cat.label;

      label.append(cb, emoji, text);

      var note = document.createElement('input');
      note.type = 'text';
      note.className = 'cat-note';
      note.dataset.note = cat.id;
      note.placeholder = 'How did AI help with ' + cat.label + '? (optional)';

      item.append(label, note);
      els.catWrap.appendChild(item);
    });
  }

  function buildLevels() {
    els.level.innerHTML = '';
    var none = document.createElement('option');
    none.value = '';
    none.textContent = '— not specified —';
    els.level.appendChild(none);
    C.LEVELS.forEach(function (lv) {
      var o = document.createElement('option');
      o.value = lv.id;
      o.textContent = 'Level ' + lv.id + ' · ' + lv.name;
      o.title = lv.desc;
      els.level.appendChild(o);
    });
  }

  function buildSizes() {
    els.size.innerHTML = '';
    C.SIZES.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.label;
      els.size.appendChild(o);
    });
  }

  function renderTools() {
    els.toolList.innerHTML = '';
    state.tools.forEach(function (t, i) {
      var chip = document.createElement('span');
      chip.className = 'chip';

      var span = document.createElement('span');
      span.textContent = '🔧 ' + t;

      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'chip-x';
      x.textContent = '✕';
      x.title = 'Remove ' + t;
      x.addEventListener('click', function () {
        state.tools.splice(i, 1);
        renderTools();
        schedule(0);
      });

      chip.append(span, x);
      els.toolList.appendChild(chip);
    });
  }

  function addTool() {
    var v = els.toolInput.value.trim();
    if (!v) return;
    if (state.tools.indexOf(v) === -1) state.tools.push(v);
    els.toolInput.value = '';
    renderTools();
    schedule(0);
  }

  function syncLevelDesc() {
    var lv = C.levelMeta(els.level.value);
    els.levelDesc.textContent = lv ? lv.desc : '';
  }

  function highlightCat(target) {
    var item = target.closest ? target.closest('.cat-item') : null;
    if (!item) return;
    var cb = item.querySelector('input[data-cat]');
    if (cb) item.classList.toggle('on', cb.checked);
  }

  /* ---------- form <-> state ---------- */
  function readForm() {
    state.title = els.title.value.trim();
    state.desc = els.desc.value;
    state.footer = els.footer.value;
    state.level = els.level.value;
    state.size = els.size.value;
    state.bg = els.bg.checked;
    state.categories = C.CATEGORIES.map(function (cat) {
      var cb = els.catWrap.querySelector('input[data-cat="' + cat.id + '"]');
      var nt = els.catWrap.querySelector('input[data-note="' + cat.id + '"]');
      return { id: cat.id, on: !!(cb && cb.checked), note: nt ? nt.value.trim() : '' };
    });
  }

  function writeForm(s) {
    els.title.value = s.title || '';
    els.desc.value = s.desc || '';
    els.footer.value = s.footer || '';
    els.level.value = s.level || '';
    els.size.value = s.size || C.SIZES[0].id;
    els.bg.checked = s.bg !== false;

    C.CATEGORIES.forEach(function (cat) {
      var cb = els.catWrap.querySelector('input[data-cat="' + cat.id + '"]');
      var nt = els.catWrap.querySelector('input[data-note="' + cat.id + '"]');
      var item = els.catWrap.querySelector('.cat-item[data-cat="' + cat.id + '"]');
      var conf = (s.categories || []).filter(function (c) { return c.id === cat.id; })[0];
      if (cb) cb.checked = !!(conf && conf.on);
      if (nt) nt.value = (conf && conf.note) || '';
      if (item) item.classList.toggle('on', !!(conf && conf.on));
    });

    renderTools();
    syncLevelDesc();

    if (s.img) {
      els.thumbPreview.src = s.img;
      els.thumbPreview.hidden = false;
      els.thumbClear.hidden = false;
    } else {
      els.thumbPreview.hidden = true;
      els.thumbClear.hidden = true;
    }
  }

  /* ---------- render + share ---------- */
  function update() {
    readForm();
    var share = C.makeShare(state);
    els.share.value = share.url;
    els.seed.textContent = 'seed ' + share.hash.slice(0, 8);
    els.hint.textContent = share.dropped
      ? '⚠️ Custom thumbnail is too big to fit in a share link, so it is left out of the URL (it still appears in the downloaded PNG).'
      : 'Everything updates live. Copy the Share URL to reopen this exact banner.';
    C.render(canvas, state, { thumb: thumbImg || robotImg, seed: share.seed });
    try { history.replaceState(null, '', share.url); } catch (e) { /* file:// */ }
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
      toast(ok ? 'Share URL copied! 🔗' : 'Copy failed — select the field and press Ctrl+C.');
    });
  }

  function download() {
    var share = C.makeShare(state);
    var name = slug(state.title || 'clankers-helped-me') + '-' + share.hash.slice(0, 6) + '.png';
    canvas.toBlob(function (blob) {
      if (!blob) { toast('Could not export the image.'); return; }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      toast('PNG downloaded ⬇️');
    }, 'image/png');
  }

  /* ---------- surprise / reset ---------- */
  var SURPRISE = {
    desc: [
      'Clankers helped me build my game!',
      'The robots wrote the boring bits and I made it fun.',
      'Ships, sparks and a suspicious amount of AI assistance.',
      'I described it, the clankers coded it, we shipped it.',
      'Half of my jam game was typed by a very helpful robot.'
    ],
    footer: [
      'Made in 48 hours with too much coffee ☕',
      'Sleep is for people who finish early.',
      'Bugs were hand-made by humans 😌',
      'Beep boop, sorry for the jank 🤖',
      ''
    ],
    tools: [['ChatGPT'], ['GitHub Copilot'], ['Claude'], ['Cursor'], ['ChatGPT', 'Copilot'], ['Suno'], ['Midjourney', 'ElevenLabs']]
  };

  function surprise() {
    var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
    els.desc.value = pick(SURPRISE.desc);
    els.footer.value = pick(SURPRISE.footer);
    state.tools = pick(SURPRISE.tools).slice();
    els.level.value = String(Math.floor(Math.random() * 6));
    C.CATEGORIES.forEach(function (cat) {
      var cb = els.catWrap.querySelector('input[data-cat="' + cat.id + '"]');
      if (cb) cb.checked = Math.random() < 0.45;
      var item = els.catWrap.querySelector('.cat-item[data-cat="' + cat.id + '"]');
      if (item) item.classList.toggle('on', !!(cb && cb.checked));
    });
    els.bg.checked = true;
    renderTools();
    syncLevelDesc();
    update();
    toast('Rolled the dice 🎲');
  }

  function reset() {
    state = C.defaultState();
    thumbImg = robotImg;
    els.thumbFile.value = '';
    writeForm(state);
    update();
    toast('Back to defaults ↺');
  }

  /* ---------- events ---------- */
  function bind() {
    els.form.addEventListener('input', function (e) {
      if (e.target.matches('input[data-cat]')) highlightCat(e.target);
      schedule();
    });
    els.form.addEventListener('change', function (e) {
      if (e.target.matches('input[data-cat]')) highlightCat(e.target);
      if (e.target === els.level) syncLevelDesc();
      schedule(0);
    });
    els.form.addEventListener('submit', function (e) { e.preventDefault(); });

    els.toolInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addTool(); }
    });
    els.addTool.addEventListener('click', addTool);

    els.thumbFile.addEventListener('change', function () {
      var f = els.thumbFile.files && els.thumbFile.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('Please choose an image file.'); return; }
      readAsDataURL(f).then(function (url) {
        return C.loadImage(url).then(function (img) {
          state.img = url;
          thumbImg = img;
          els.thumbPreview.src = url;
          els.thumbPreview.hidden = false;
          els.thumbClear.hidden = false;
          update();
          toast('Thumbnail updated 🤖');
        });
      }).catch(function () { toast('Could not load that image.'); });
    });

    els.thumbClear.addEventListener('click', function () {
      state.img = '';
      thumbImg = robotImg;
      els.thumbFile.value = '';
      els.thumbPreview.hidden = true;
      els.thumbClear.hidden = true;
      update();
    });

    $('#btnGenerate').addEventListener('click', function () {
      update();
      els.previewCard.classList.remove('pulse');
      void els.previewCard.offsetWidth;
      els.previewCard.classList.add('pulse');
      els.previewCol.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast('Banner generated ✨');
    });
    $('#btnCopyShare').addEventListener('click', copyShare);
    $('#btnCopyField').addEventListener('click', copyShare);
    $('#btnDownload').addEventListener('click', download);
    $('#btnSurprise').addEventListener('click', surprise);
    $('#btnReset').addEventListener('click', reset);
  }

  /* ---------- boot ---------- */
  function boot() {
    buildCategories();
    buildLevels();
    buildSizes();

    var fromUrl = C.readUrlState();
    state = fromUrl ? C.normalize(fromUrl) : C.defaultState();

    C.loadRobot().then(function (img) {
      robotImg = img;
      thumbImg = img;
      if (state.img) {
        return C.loadImage(state.img).then(function (im) { thumbImg = im; })
          .catch(function () { thumbImg = robotImg; });
      }
    }).catch(function () {
      robotImg = null;
      thumbImg = null;
    }).then(continueBoot);
  }

  function continueBoot() {
    writeForm(state);
    bind();
    if (!thumbImg) thumbImg = robotImg;
    C.ensureFonts().then(function () {
      update();
    });
  }

  boot();
})();
