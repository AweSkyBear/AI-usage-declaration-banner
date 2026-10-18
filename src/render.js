/* AI Usage - canvas renderer that draws the banner. */
window.AIU = window.AIU || {};
(function (C) {
  'use strict';

  var F = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

  /* Restrained, near-monochrome palette. Flat fills only, no gradients. */
  var INK = '#24292f';
  var INK_SOFT = '#58606c';
  var LINE = '#d5d9df';
  var CARD = '#ffffff';
  var CHIP_BODY = '#f6f7f9';
  var CHIP_DIE = '#e9ecf1';
  var CHIP_EDGE = '#9aa2ad';

  /* Per-size metrics. Banner height grows when the text needs more lines. */
  var METRICS = {
    '270x80': {
      W: 270, baseH: 80, padX: 12, padY: 11,
      chip: 26, headerGap: 6,
      titleFont: '600 12px ' + F, titleTrack: 0.6,
      bodyFont: '400 12px ' + F, lineH: 15
    },
    '480x110': {
      W: 480, baseH: 110, padX: 16, padY: 13,
      chip: 32, headerGap: 8,
      titleFont: '600 14px ' + F, titleTrack: 0.8,
      bodyFont: '400 13px ' + F, lineH: 17
    }
  };

  function metricsFor(sizeId) {
    return METRICS[sizeId] || METRICS[C.DEFAULT_SIZE];
  }

  /* ---------- helpers ---------- */
  function wrapText(ctx, text, maxWidth) {
    var words = String(text).replace(/\s+/g, ' ').trim().split(' ');
    var lines = [];
    var line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (!line || ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        lines.push(line);
        line = words[i];
      }
      /* Hard-break a single word that is wider than the whole column. */
      while (ctx.measureText(line).width > maxWidth && line.length > 1) {
        var cut = line.length - 1;
        while (cut > 1 && ctx.measureText(line.slice(0, cut) + '-').width > maxWidth) cut--;
        lines.push(line.slice(0, cut) + '-');
        line = line.slice(cut);
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  /* ---------- micro-chip mark ----------
     Flat, monochrome chip: square body, three pins per side, a silicon die
     with a pin-1 notch, and one small status LED (the only accent colour). */
  function drawChip(ctx, x, y, s, ledAlpha) {
    var pad = s * 0.11;              /* room for the pins */
    var body = s - pad * 2;
    var bx = x + pad, by = y + pad;
    var pinH = s * 0.075;

    /* pins: 3 per side */
    ctx.fillStyle = CHIP_EDGE;
    for (var i = 0; i < 3; i++) {
      var off = (i + 1) * (body / 4);
      ctx.fillRect(bx - pad, by + off - pinH / 2, pad + 0.5, pinH);          /* left  */
      ctx.fillRect(bx + body - 0.5, by + off - pinH / 2, pad + 0.5, pinH);   /* right */
      ctx.fillRect(bx + off - pinH / 2, by - pad, pinH, pad + 0.5);          /* top   */
      ctx.fillRect(bx + off - pinH / 2, by + body - 0.5, pinH, pad + 0.5);   /* bottom*/
    }

    /* body */
    ctx.lineWidth = Math.max(1, s * 0.045);
    ctx.strokeStyle = INK;
    ctx.fillStyle = CHIP_BODY;
    ctx.fillRect(bx, by, body, body);
    ctx.strokeRect(bx, by, body, body);

    /* die */
    var die = body * 0.46;
    var dx = bx + (body - die) / 2, dy = by + (body - die) / 2;
    ctx.lineWidth = Math.max(1, s * 0.035);
    ctx.strokeStyle = CHIP_EDGE;
    ctx.fillStyle = CHIP_DIE;
    ctx.fillRect(dx, dy, die, die);
    ctx.strokeRect(dx, dy, die, die);

    /* pin-1 notch */
    ctx.beginPath();
    ctx.arc(bx + body * 0.22, by + body * 0.22, Math.max(1.2, s * 0.055), 0, Math.PI * 2);
    ctx.fillStyle = CHIP_EDGE;
    ctx.fill();

    /* status LED */
    ctx.beginPath();
    ctx.arc(bx + body * 0.5, by + body * 0.5, Math.max(1.4, s * 0.075), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(58,110,165,' + ledAlpha.toFixed(3) + ')';
    ctx.fill();
  }

  /* ---------- public render ---------- */
  C.render = function (canvas, state, opts) {
    opts = opts || {};
    var M = metricsFor(state.size);
    var W = M.W;
    var ctx = canvas.getContext('2d');

    var text = String(state.text || '').trim();
    var maxTextW = W - M.padX * 2;

    ctx.font = M.bodyFont;
    var lines = wrapText(ctx, text, maxTextW);

    /* Grow past the base height when the text needs more room. */
    var headerH = M.chip;
    var needed = M.padY * 2 + headerH + M.headerGap + lines.length * M.lineH;
    var H = Math.max(M.baseH, needed);

    canvas.width = W;
    canvas.height = H;

    /* card: flat fill, square corners, 1px frame */
    ctx.fillStyle = CARD;
    ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.strokeStyle = LINE;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    /* header row: chip mark + title */
    var ledAlpha = opts.animate ? 0.55 + 0.35 * (0.5 + 0.5 * Math.sin((opts.time || 0) * 2.2)) : 0.85;
    drawChip(ctx, M.padX, M.padY, M.chip, ledAlpha);

    ctx.font = M.titleFont;
    try { ctx.letterSpacing = M.titleTrack + 'px'; } catch (e) {}
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = INK;
    var titleX = M.padX + M.chip + Math.round(M.chip * 0.38);
    var titleY = M.padY + M.chip / 2;
    ctx.fillText('Declaring AI usage', titleX, titleY);
    try { ctx.letterSpacing = '0px'; } catch (e) {}

    /* the user's line */
    ctx.font = M.bodyFont;
    ctx.fillStyle = INK_SOFT;
    ctx.textBaseline = 'top';
    var ty = M.padY + headerH + M.headerGap;
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], M.padX, ty + i * M.lineH);
    }
  };
})(window.AIU);
