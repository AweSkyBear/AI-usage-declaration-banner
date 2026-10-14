/* Clankers helped me! - admin UI wiring. */
(function () {
  'use strict';
  var C = window.CLANK;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  /* Attach a listener only when the element exists, so a stale/mismatched
     page can't throw and silently disable every other handler. */
  var on = function (sel, ev, fn) {
    var el = typeof sel === 'string' ? $(sel) : sel;
    if (el) el.addEventListener(ev, fn);
    return el;
  };

  var canvas = $('#canvas');
  var els = {
    form: $('#form'),
    title: $('#fTitle'),
    nickname: $('#fNickname'),
    headline: $('#fHeadline'),
    desc: $('#fDesc'),
    footer: $('#fFooter'),
    level: $('#fLevel'),
    levelDesc: $('#levelDesc'),
    size: $('#fSize'),
    bg: $('#fBg'),
    showPrice: $('#fShowPrice'),
    thumbFile: $('#fThumb'),
    thumbClear: $('#btnThumbClear'),
    thumbPreview: $('#thumbPreview'),
    catWrap: $('#categories'),
    toolList: $('#toolList'),
    toolInput: $('#fTool'),
    addTool: $('#btnAddTool'),
    share: $('#shareUrl'),
    seed: $('#seedBadge'),
    sizeBadge: $('#sizeBadge'),
    hint: $('#hint'),
    sharedBy: $('#sharedBy'),
    toast: $('#toast'),
    previewCard: $('.preview-card'),
    previewCol: $('.preview')
  };

  var state = C.defaultState();
  var robotImg = null;
  var thumbImg = null;
  var timer = 0;
  var sharedMode = false;
  var keepEditFlag = false;
  var seedCur = 1;
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

  function readAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || '';
  }

  function stamp(d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  function fileName() {
    var parts = ['clankers-helped-me-build'];
    var t = slug(state.title);
    if (t) parts.push(t);
    var n = slug(state.nickname);
    if (n) parts.push('by', n);
    parts.push(stamp(new Date()));
    return parts.join('-') + '.png';
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
      /* The banner's default size is Super Compact (512 x 512). */
      if (s.id === C.DEFAULT_SIZE) o.selected = true;
      els.size.appendChild(o);
    });
    els.size.value = C.DEFAULT_SIZE;
  }

  function renderToolRows() {
    els.toolList.innerHTML = '';
    state.tools.forEach(function (tool, i) {
      var row = document.createElement('div');
      row.className = 'tool-item';

      /* ---- name + remove ---- */
      var head = document.createElement('div');
      head.className = 'tool-head';

      var icon = document.createElement('span');
      icon.className = 'tool-emoji';
      icon.textContent = '🔧';

      var name = document.createElement('input');
      name.type = 'text';
      name.className = 'tool-name';
      name.placeholder = 'Tool name (e.g. ChatGPT)';
      name.value = tool.name || '';
      name.addEventListener('input', function () {
        tool.name = name.value;
        remove.title = 'Remove ' + (name.value.trim() || 'tool');
        schedule();
      });

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'chip-x';
      remove.textContent = '✕';
      remove.title = 'Remove ' + (tool.name || 'tool');
      remove.addEventListener('click', function () {
        state.tools.splice(i, 1);
        renderToolRows();
        schedule(0);
      });

      head.append(icon, name, remove);

      /* ---- how it helped ---- */
      var note = document.createElement('input');
      note.type = 'text';
      note.className = 'tool-note';
      note.placeholder = 'How did AI help with this tool? (optional)';
      note.value = tool.note || '';
      note.addEventListener('input', function () {
        tool.note = note.value;
        schedule();
      });

      /* ---- price ---- */
      var priceRow = document.createElement('div');
      priceRow.className = 'tool-price';

      var mode = document.createElement('select');
      mode.className = 'price-mode';
      C.PRICE_MODES.forEach(function (m) {
        var opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.label;
        mode.appendChild(opt);
      });
      mode.value = tool.priceMode || 'none';

      var amount = document.createElement('input');
      amount.type = 'text';
      amount.className = 'price-amt';
      amount.value = tool.price || '';

      var unit = document.createElement('span');
      unit.className = 'price-unit';

      function syncPrice() {
        tool.priceMode = mode.value;
        tool.price = amount.value;
        amount.disabled = mode.value === 'none';
        amount.placeholder = mode.value === 'tokens' ? 'e.g. 150k' : 'e.g. $20';
        unit.textContent = mode.value === 'tokens' ? 'tokens' : (mode.value === 'month' ? '/ month' : '');
        schedule();
      }
      syncPrice();
      mode.addEventListener('change', syncPrice);
      amount.addEventListener('input', syncPrice);

      priceRow.append(mode, amount, unit);
      row.append(head, note, priceRow);
      els.toolList.appendChild(row);
    });
  }

  function addTool() {
    var v = els.toolInput.value.trim();
    if (!v) return;
    state.tools.push(C.newTool(v));
    els.toolInput.value = '';
    renderToolRows();
    var inputs = els.toolList.querySelectorAll('.tool-name');
    if (inputs.length) inputs[inputs.length - 1].focus();
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
    state.nickname = els.nickname.value.trim();
    state.headline = els.headline.value.trim() || C.DEFAULT_HEADLINE;
    state.desc = els.desc.value;
    state.footer = els.footer.value;
    state.level = els.level.value;
    state.size = els.size.value;
    state.bg = els.bg.checked;
    state.showToolPrice = els.showPrice.checked;
    state.categories = C.CATEGORIES.map(function (cat) {
      var cb = els.catWrap.querySelector('input[data-cat="' + cat.id + '"]');
      var nt = els.catWrap.querySelector('input[data-note="' + cat.id + '"]');
      return { id: cat.id, on: !!(cb && cb.checked), note: nt ? nt.value.trim() : '' };
    });
  }

  function writeForm(s) {
    els.title.value = s.title || '';
    els.nickname.value = s.nickname || '';
    els.headline.value = s.headline || C.DEFAULT_HEADLINE;
    els.desc.value = s.desc || '';
    els.footer.value = s.footer || '';
    els.level.value = s.level || '';
    els.size.value = s.size || C.DEFAULT_SIZE;
    els.bg.checked = s.bg !== false;
    els.showPrice.checked = s.showToolPrice !== false;

    C.CATEGORIES.forEach(function (cat) {
      var cb = els.catWrap.querySelector('input[data-cat="' + cat.id + '"]');
      var nt = els.catWrap.querySelector('input[data-note="' + cat.id + '"]');
      var item = els.catWrap.querySelector('.cat-item[data-cat="' + cat.id + '"]');
      var conf = (s.categories || []).filter(function (c) { return c.id === cat.id; })[0];
      if (cb) cb.checked = !!(conf && conf.on);
      if (nt) nt.value = (conf && conf.note) || '';
      if (item) item.classList.toggle('on', !!(conf && conf.on));
    });

    renderToolRows();
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
  function paint(t) {
    C.render(canvas, state, {
      thumb: thumbImg || robotImg, seed: seedCur, time: t, animate: motionOk
    });
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
    seedCur = share.seed;
    animT = animT || 0;
    paint(animT);
    els.sizeBadge.textContent = canvas.width + ' × ' + canvas.height;
    if (sharedMode) return;

    els.share.value = share.url;
    els.seed.textContent = 'seed ' + share.hash.slice(0, 8);
    els.hint.textContent = share.dropped
      ? '⚠️ Custom thumbnail is too big to fit in a share link, so it is left out of the URL (it still appears in the downloaded PNG).'
      : 'Everything updates live. Copy the Share URL to reopen this exact banner.';
    try { history.replaceState(null, '', editUrl(share.url)); } catch (e) { /* file:// */ }
    startAnim();
  }

  /* ---------- read-only shared link ---------- */
  function enterSharedMode() {
    document.body.classList.add('shared');

    els.sharedBy.textContent = '';
    if (state.nickname) {
      els.sharedBy.append('Shared by ');
      var who = document.createElement('span');
      who.textContent = state.nickname;
      els.sharedBy.append(who);
    } else {
      els.sharedBy.textContent = 'Shared banner';
    }
    els.sharedBy.hidden = false;

    var heading = $('.preview-title');
    if (heading) heading.textContent = 'Banner';

    var lock = function (nodes) {
      Array.prototype.forEach.call(nodes, function (el) { el.disabled = true; });
    };
    lock(els.form.querySelectorAll('input, textarea, select, button'));
    lock(document.querySelectorAll('.topbar-actions .btn'));
  }

  /* ---------- fork a shared link back into the editor ---------- */
  function exitSharedMode() {
    sharedMode = false;
    keepEditFlag = true;
    document.body.classList.remove('shared');
    els.sharedBy.hidden = true;

    var heading = $('.preview-title');
    if (heading) heading.textContent = 'Live preview';

    var unlock = function (nodes) {
      Array.prototype.forEach.call(nodes, function (el) { el.disabled = false; });
    };
    unlock(els.form.querySelectorAll('input, textarea, select, button'));
    unlock(document.querySelectorAll('.topbar-actions .btn'));

    writeForm(state);
    if (!thumbImg && state.img) {
      C.loadImage(state.img).then(function (im) { thumbImg = im; update(); }, function () {});
    }
    update();
    toast('Forked — edit away! 🍴');
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
      toast('PNG downloaded ⬇️');
      startAnim();
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
    tools: [
      [{ name: 'ChatGPT', note: 'Wrote the boilerplate', priceMode: 'month', price: '$20' }],
      [{ name: 'GitHub Copilot', note: 'Autocomplete for everything', priceMode: 'month', price: '$10' }],
      [{ name: 'Claude', note: 'Debugged my collision code', priceMode: 'tokens', price: '1.2M' }],
      [{ name: 'Cursor', priceMode: 'month', price: '$20' }],
      [{ name: 'ChatGPT' }, { name: 'GitHub Copilot' }],
      [{ name: 'Suno', note: 'Generated the soundtrack', priceMode: 'month', price: '$10' }],
      [{ name: 'Midjourney' }, { name: 'ElevenLabs', note: 'Character voices', priceMode: 'month', price: '$22' }]
    ],
    headline: [
      'Clankers helped me!',
      'A robot wrote this game with me',
      'Beep boop, we made a game',
      'I prompted, the clankers shipped',
      'Humans dreamt it, clankers built it'
    ]
  };

  function surprise() {
    var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
    els.headline.value = pick(SURPRISE.headline);
    els.desc.value = pick(SURPRISE.desc);
    els.footer.value = pick(SURPRISE.footer);
    state.tools = pick(SURPRISE.tools).map(C.normalizeTool).filter(Boolean);
    els.level.value = String(Math.floor(Math.random() * 6));
    C.CATEGORIES.forEach(function (cat) {
      var cb = els.catWrap.querySelector('input[data-cat="' + cat.id + '"]');
      if (cb) cb.checked = Math.random() < 0.45;
      var item = els.catWrap.querySelector('.cat-item[data-cat="' + cat.id + '"]');
      if (item) item.classList.toggle('on', !!(cb && cb.checked));
    });
    els.bg.checked = true;
    renderToolRows();
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

    on('#btnGenerate', 'click', function () {
      update();
      els.previewCard.classList.remove('pulse');
      void els.previewCard.offsetWidth;
      els.previewCard.classList.add('pulse');
      els.previewCol.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast('Banner generated ✨');
    });
    on('#btnCopyShare', 'click', copyShare);
    on('#btnCopyField', 'click', copyShare);
    on('#btnDownload', 'click', download);
    on('#btnEditShared', 'click', exitSharedMode);
    on('#btnSurprise', 'click', surprise);
    on('#btnReset', 'click', reset);
  }

  /* ---------- boot ---------- */
  function boot() {
    /* Visible in DevTools: confirms which build/size default is actually loaded. */
    try {
      console.log('%cClankers helped me! %c build v6 ',
        'font-weight:800;color:#ff5d8f', 'color:#5a6a8c',
        '· C.DEFAULT_SIZE =', C.DEFAULT_SIZE,
        '· SIZES[0] =', C.SIZES[0] && C.SIZES[0].id);
    } catch (e) { /* ignore */ }

    buildCategories();
    buildLevels();
    buildSizes();

    var fromUrl = C.readUrlState();
    var editFlag = /[?&]e=1(?:&|$)/.test(location.search);
    sharedMode = !!fromUrl && !editFlag;
    keepEditFlag = !!fromUrl && editFlag;
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
    if (sharedMode) enterSharedMode();
    bind();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAnim(); else startAnim();
    });
    if (!thumbImg) thumbImg = robotImg;
    C.ensureFonts().then(function () {
      update();
    });
  }

  boot();
})();
