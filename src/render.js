/* Clankers helped me! - canvas renderer that draws the whole banner. */
window.CLANK = window.CLANK || {};
(function (C) {
  'use strict';

  var F = {
    head: '"Fredoka", "Trebuchet MS", "Segoe UI", sans-serif',
    body: '"Nunito", "Trebuchet MS", "Segoe UI", sans-serif'
  };
  var INK = '#1e2a44';
  var INK_SOFT = '#556180';
  var GAP = 22;

  /* ---------- little helpers ---------- */
  function rr(ctx, x, y, w, h, r) { C.roundRect(ctx, x, y, w, h, r); }

  function wrapText(ctx, text, maxWidth) {
    var words = String(text).replace(/\s+/g, ' ').trim().split(' ');
    var lines = [];
    var line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (!line || ctx.measureText(test).width <= maxWidth) line = test;
      else { lines.push(line); line = words[i]; }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  function fitFont(ctx, text, maxWidth, start, min, makeFont) {
    var size = start;
    ctx.font = makeFont(size);
    while (size > min && ctx.measureText(text).width > maxWidth) {
      size -= 2;
      ctx.font = makeFont(size);
    }
    return size;
  }

  function drawCover(ctx, img, x, y, w, h) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var s = Math.max(w / iw, h / ih);
    var dw = iw * s, dh = ih * s;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  /* ---------- chips ---------- */
  function layoutChips(ctx, entries, o) {
    ctx.font = o.font;
    var lineH = Math.round(o.fontSize * 1.3);
    var items = entries.map(function (e) {
      var lines = wrapText(ctx, e.text, o.maxW - o.padX * 2);
      var wMax = 0;
      lines.forEach(function (l) { wMax = Math.max(wMax, ctx.measureText(l).width); });
      return {
        lines: lines,
        w: Math.min(o.maxW, Math.ceil(wMax) + o.padX * 2),
        h: Math.max(o.minH, lines.length * lineH + o.padY * 2)
      };
    });

    var rows = [];
    var cur = { items: [], w: 0, h: 0 };
    items.forEach(function (it) {
      var extra = cur.items.length ? o.gapX + it.w : it.w;
      if (cur.items.length && cur.w + extra > o.maxW) {
        rows.push(cur);
        cur = { items: [], w: 0, h: 0 };
      }
      cur.items.push(it);
      cur.w += cur.items.length > 1 ? o.gapX + it.w : it.w;
      cur.h = Math.max(cur.h, it.h);
    });
    if (cur.items.length) rows.push(cur);

    var height = rows.reduce(function (s, r) { return s + r.h; }, 0);
    if (rows.length > 1) height += o.gapY * (rows.length - 1);
    return { rows: rows, height: height, font: o.font, fontSize: o.fontSize, padX: o.padX, padY: o.padY, lineH: lineH, gapX: o.gapX, gapY: o.gapY };
  }

  function drawChips(ctx, L, y, colors, ink) {
    ctx.font = L.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var cy = y;
    L.rows.forEach(function (row, ri) {
      var x = -row.w / 2;
      row.items.forEach(function (it, ii) {
        var col = colors[(ri + ii) % colors.length];
        var top = cy + (row.h - it.h) / 2;
        ctx.save();
        rr(ctx, x, top, it.w, it.h, it.h / 2);
        ctx.fillStyle = C.hexA(col, 0.16);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = C.hexA(col, 0.55);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = ink;
        var textH = it.lines.length * L.lineH;
        var ty = top + (it.h - textH) / 2 + L.lineH / 2;
        it.lines.forEach(function (l) {
          ctx.fillText(l, x + it.w / 2, ty);
          ty += L.lineH;
        });
        x += it.w + L.gapX;
      });
      cy += row.h + L.gapY;
    });
  }

  /* ---------- content blocks ---------- */
  function build(ctx, state, maxW, images, pal) {
    var blocks = [];
    var accent = pal.accent;
    var accent2 = pal.accent2;
    var chipsColors = pal.accents;

    /* 1. robot thumbnail */
    var RS = state.title ? 168 : 198;
    blocks.push({
      h: RS,
      draw: function (c, y) {
        var cx = 0, cy = y + RS / 2, r = RS / 2;
        var g = c.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.3);
        g.addColorStop(0, C.hexA(accent, 0.3));
        g.addColorStop(1, C.hexA(accent, 0));
        c.fillStyle = g;
        c.beginPath(); c.arc(cx, cy, r * 1.3, 0, Math.PI * 2); c.fill();

        c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2);
        c.fillStyle = '#ffffff'; c.fill();
        c.lineWidth = Math.max(4, r * 0.055);
        c.strokeStyle = C.hexA(accent, 0.55);
        c.stroke();

        var img = images && images.thumb;
        if (img) {
          c.save();
          c.beginPath(); c.arc(cx, cy, r - 8, 0, Math.PI * 2); c.clip();
          drawCover(c, img, cx - r + 8, cy - r + 8, (r - 8) * 2, (r - 8) * 2);
          c.restore();
        }
      }
    });

    /* 2. game title ribbon */
    if (state.title) {
      (function () {
        var makeFont = function (s) { return '700 ' + s + 'px ' + F.head; };
        var text = '🎮  ' + state.title;
        var size = fitFont(ctx, text, maxW - 80, 40, 20, makeFont);
        ctx.font = makeFont(size);
        var w = Math.min(maxW, ctx.measureText(text).width + 72);
        var h = Math.round(size * 2);
        blocks.push({
          h: h,
          draw: function (c, y) {
            c.font = makeFont(size);
            c.textAlign = 'center'; c.textBaseline = 'middle';
            var g = c.createLinearGradient(-w / 2, y, w / 2, y + h);
            g.addColorStop(0, accent); g.addColorStop(1, accent2);
            c.save();
            c.shadowColor = C.hexA(accent, 0.45); c.shadowBlur = 20; c.shadowOffsetY = 7;
            rr(c, -w / 2, y, w, h, h / 2);
            c.fillStyle = g; c.fill();
            c.restore();
            c.fillStyle = '#ffffff';
            c.fillText(text, 0, y + h / 2 + 1);
          }
        });
      })();
    }

    /* 3. AI disclosure tag + big heading */
    (function () {
      var tagFont = '800 19px ' + F.body;
      ctx.font = tagFont;
      var tagText = 'AI DISCLOSURE';
      var tagW = Math.ceil(ctx.measureText(tagText).width) + 48;
      var tagH = 36;
      var makeFont = function (s) { return '700 ' + s + 'px ' + F.head; };
      var headText = 'Clankers helped me!';
      var hs = fitFont(ctx, headText, maxW, 82, 34, makeFont);
      ctx.font = makeFont(hs);
      var headH = Math.round(hs * 1.2);
      var gapIn = 12;

      blocks.push({
        h: tagH + gapIn + headH,
        draw: function (c, y) {
          c.save();
          rr(c, -tagW / 2, y, tagW, tagH, tagH / 2);
          c.fillStyle = C.hexA(accent, 0.14); c.fill();
          c.lineWidth = 2; c.strokeStyle = C.hexA(accent, 0.5); c.stroke();
          c.font = tagFont; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillStyle = accent;
          try { c.letterSpacing = '3px'; } catch (e) {}
          c.fillText(tagText, 0, y + tagH / 2 + 1);
          try { c.letterSpacing = '0px'; } catch (e) {}
          c.restore();

          var hy = y + tagH + gapIn;
          c.save();
          c.font = makeFont(hs);
          c.textAlign = 'center'; c.textBaseline = 'top';
          c.lineJoin = 'round';
          c.lineWidth = Math.max(10, hs * 0.16);
          c.strokeStyle = '#ffffff';
          c.shadowColor = C.hexA(accent2, 0.35);
          c.shadowBlur = 0; c.shadowOffsetY = 5;
          c.strokeText(headText, 0, hy);
          c.shadowColor = 'transparent';
          c.fillStyle = accent;
          c.fillText(headText, 0, hy);
          c.restore();
        }
      });
    })();

    /* 4. description */
    if (state.desc && state.desc.trim()) {
      (function () {
        var font = '600 30px ' + F.body;
        ctx.font = font;
        var lines = wrapText(ctx, state.desc.trim(), maxW * 0.86);
        var lh = Math.round(30 * 1.38);
        blocks.push({
          h: lines.length * lh,
          draw: function (c, y) {
            c.font = font; c.fillStyle = INK;
            c.textAlign = 'center'; c.textBaseline = 'top';
            lines.forEach(function (l, i) { c.fillText(l, 0, y + i * lh); });
          }
        });
      })();
    }

    /* 5. category chips */
    var activeCats = (state.categories || []).filter(function (c) { return c.on; });
    if (activeCats.length) {
      (function () {
        var entries = activeCats.map(function (c) {
          var meta = C.categoryMeta(c.id);
          var note = (c.note || '').trim();
          return { text: meta.emoji + '  ' + meta.label + (note ? ' — ' + note : '') };
        });
        var L = layoutChips(ctx, entries, {
          maxW: maxW, font: '700 23px ' + F.body, fontSize: 23,
          padX: 20, padY: 12, minH: 52, gapX: 12, gapY: 12
        });
        blocks.push({
          h: L.height,
          draw: function (c, y) { drawChips(c, L, y, chipsColors, INK); }
        });
      })();
    }

    /* 6. level of AI used */
    var lv = C.levelMeta(state.level);
    if (lv) {
      (function () {
        var makeFont = function (s) { return '700 ' + s + 'px ' + F.head; };
        var text = lv.emoji + '  AI Level ' + lv.id + ' · ' + lv.name;
        var size = fitFont(ctx, text, maxW - 70, 32, 18, makeFont);
        ctx.font = makeFont(size);
        var w = Math.min(maxW, ctx.measureText(text).width + 66);
        var h = Math.round(size * 2);
        var descFont = 'italic 700 22px ' + F.body;
        ctx.font = descFont;
        var lines = wrapText(ctx, lv.desc, maxW * 0.86);
        var lh = Math.round(22 * 1.36);
        var gapIn = 12;

        blocks.push({
          h: h + gapIn + lines.length * lh,
          draw: function (c, y) {
            var g = c.createLinearGradient(-w / 2, y, w / 2, y + h);
            g.addColorStop(0, accent); g.addColorStop(1, accent2);
            c.save();
            c.shadowColor = C.hexA(accent, 0.35); c.shadowBlur = 16; c.shadowOffsetY = 6;
            rr(c, -w / 2, y, w, h, h / 2);
            c.fillStyle = g; c.fill();
            c.restore();

            c.font = makeFont(size);
            c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillStyle = '#ffffff';
            c.fillText(text, 0, y + h / 2 + 1);

            c.font = descFont; c.fillStyle = INK_SOFT;
            c.textBaseline = 'top';
            var dy = y + h + gapIn;
            lines.forEach(function (l, i) { c.fillText(l, 0, dy + i * lh); });
          }
        });
      })();
    }

    /* 7. AI tools */
    if (state.tools && state.tools.length) {
      (function () {
        var L = layoutChips(ctx, [{ text: '🧰  AI tools: ' + state.tools.join('  ·  ') }], {
          maxW: maxW, font: '700 23px ' + F.body, fontSize: 23,
          padX: 20, padY: 12, minH: 52, gapX: 12, gapY: 12
        });
        blocks.push({
          h: L.height,
          draw: function (c, y) { drawChips(c, L, y, [chipsColors[3]], INK); }
        });
      })();
    }

    /* 8. footer comment */
    if (state.footer && state.footer.trim()) {
      (function () {
        var font = 'italic 700 23px ' + F.body;
        ctx.font = font;
        var text = '💬  “' + state.footer.trim() + '”';
        var lines = wrapText(ctx, text, maxW * 0.86);
        var lh = Math.round(23 * 1.4);
        blocks.push({
          h: lines.length * lh,
          draw: function (c, y) {
            c.font = font; c.fillStyle = INK_SOFT;
            c.textAlign = 'center'; c.textBaseline = 'top';
            lines.forEach(function (l, i) { c.fillText(l, 0, y + i * lh); });
          }
        });
      })();
    }

    return blocks;
  }

  /* ---------- public render ---------- */
  C.render = function (canvas, state, opts) {
    opts = opts || {};
    var parts = String(state.size || '1080x1080').split('x');
    var W = parseInt(parts[0], 10) || 1080;
    var H = parseInt(parts[1], 10) || 1080;
    canvas.width = W;
    canvas.height = H;

    var ctx = canvas.getContext('2d');
    var seed = (opts.seed >>> 0) || 1;
    var pal = C.paletteFor(seed);

    if (state.bg === false) C.drawPlainBackground(ctx, W, H);
    else C.drawBackground(ctx, W, H, pal, C.rngFromSeed(seed ^ 0x9e3779b9));

    var margin = Math.round(Math.min(W, H) * 0.042);
    var px = margin, py = margin, pw = W - margin * 2, ph = H - margin * 2;
    var radius = Math.round(Math.min(W, H) * 0.045);

    ctx.save();
    ctx.shadowColor = 'rgba(20,30,60,0.22)';
    ctx.shadowBlur = 34; ctx.shadowOffsetY = 14;
    rr(ctx, px, py, pw, ph, radius);
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.fill();
    ctx.restore();

    rr(ctx, px, py, pw, ph, radius);
    ctx.lineWidth = Math.max(3, Math.min(W, H) * 0.006);
    ctx.strokeStyle = C.hexA(pal.accent, 0.35);
    ctx.stroke();

    var pad = Math.round(Math.min(W, H) * 0.055);
    var maxW = pw - pad * 2;
    var availH = ph - pad * 2;

    var content = build(ctx, state, maxW, { thumb: opts.thumb }, pal);
    if (!content.length) return;

    var totalH = content.reduce(function (s, b) { return s + b.h; }, 0) + GAP * (content.length - 1);
    var scale = Math.min(1, availH / totalH);

    ctx.save();
    ctx.translate(W / 2, py + pad + Math.max(0, (availH - totalH * scale) / 2));
    ctx.scale(scale, scale);
    var y = 0;
    content.forEach(function (b) {
      b.draw(ctx, y);
      y += b.h + GAP;
    });
    ctx.restore();
  };
})(window.CLANK);
