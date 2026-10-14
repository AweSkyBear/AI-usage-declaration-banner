/* Clankers helped me! - seeded RNG, palette and playful backgrounds. */
window.CLANK = window.CLANK || {};
(function (C) {
  'use strict';

  /* ---------- deterministic RNG ---------- */
  C.rngFromSeed = function (seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* ---------- colour ---------- */
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; };
    var a = s * Math.min(l, 1 - l);
    var f = function (n) {
      var v = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * v).toString(16).padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
  }
  C.hslToHex = hslToHex;

  C.hexA = function (hex, alpha) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  };

  C.paletteFor = function (seed) {
    var rand = C.rngFromSeed((seed >>> 0) || 1);
    var hue = Math.floor(rand() * 360);
    var h2 = (hue + 35 + Math.floor(rand() * 90)) % 360;
    var h3 = (hue + 190 + Math.floor(rand() * 80)) % 360;
    return {
      hue: hue,
      accent:  hslToHex(hue, 76, 50),
      accent2: hslToHex(h2, 82, 54),
      bg1: hslToHex(hue, 88, 91),
      bg2: hslToHex(h3, 85, 89),
      accents: [
        hslToHex(hue, 78, 56),
        hslToHex(h2, 80, 54),
        hslToHex(h3, 78, 58),
        hslToHex((hue + 120) % 360, 74, 54),
        hslToHex((hue + 300) % 360, 76, 58)
      ]
    };
  };

  /* ---------- shapes ---------- */
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  C.roundRect = rr;

  function star(ctx, cx, cy, spikes, outer, inner) {
    var rot = -Math.PI / 2;
    var step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    for (var i = 0; i < spikes; i++) {
      rot += step; ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
      rot += step; ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    }
    ctx.closePath();
  }

  /* ---------- backgrounds ---------- */
  C.drawPlainBackground = function (ctx, W, H) {
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#f2f5fb');
    g.addColorStop(1, '#e5ecf8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    var step = Math.min(W, H) * 0.06;
    ctx.fillStyle = 'rgba(30,42,68,.05)';
    for (var y = step / 2; y < H; y += step) {
      for (var x = step / 2; x < W; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, step * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  C.drawBackground = function (ctx, W, H, pal, rand) {
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, pal.bg1);
    g.addColorStop(1, pal.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    var A = pal.accents;
    var R = function (a, b) { return a + rand() * (b - a); };
    var pick = function () { return A[Math.floor(rand() * A.length)]; };
    var kind = Math.floor(rand() * 6);

    if (kind === 0) {
      /* confetti */
      for (var i = 0; i < 110; i++) {
        var x = R(-40, W + 40), y = R(-40, H + 40);
        var s = R(0.6, 2.4) * Math.min(W, H) * 0.028;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(R(0, Math.PI * 2));
        ctx.fillStyle = C.hexA(pick(), R(0.45, 0.9));
        var t = Math.floor(rand() * 3);
        if (t === 0) { ctx.beginPath(); ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2); ctx.fill(); }
        else if (t === 1) { rr(ctx, -s, -s * 0.5, s * 2, s, s * 0.5); ctx.fill(); }
        else { star(ctx, 0, 0, 5, s, s * 0.45); ctx.fill(); }
        ctx.restore();
      }
    } else if (kind === 1) {
      /* bubbles */
      for (var b = 0; b < 26; b++) {
        var br = R(0.05, 0.28) * Math.min(W, H);
        ctx.beginPath();
        ctx.arc(R(0, W), R(0, H), br, 0, Math.PI * 2);
        ctx.fillStyle = C.hexA(pick(), R(0.08, 0.22));
        ctx.fill();
      }
    } else if (kind === 2) {
      /* diagonal stripes */
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.PI / 7);
      ctx.translate(-W, -H);
      var bw = Math.min(W, H) * 0.12;
      var span = (W + H) * 1.8;
      for (var sx = 0; sx < span; sx += bw * 2) {
        ctx.fillStyle = C.hexA(pick(), 0.16);
        ctx.fillRect(sx, 0, bw, span);
      }
      ctx.restore();
    } else if (kind === 3) {
      /* jittered dot grid */
      var step = Math.min(W, H) * 0.075;
      for (var gy = step / 2; gy < H + step; gy += step) {
        for (var gx = step / 2; gx < W + step; gx += step) {
          ctx.beginPath();
          ctx.arc(gx + R(-step * 0.15, step * 0.15), gy + R(-step * 0.15, step * 0.15), step * R(0.08, 0.2), 0, Math.PI * 2);
          ctx.fillStyle = C.hexA(pick(), R(0.2, 0.5));
          ctx.fill();
        }
      }
    } else if (kind === 4) {
      /* waves */
      var bands = 7;
      for (var wv = 0; wv < bands; wv++) {
        var base = (wv + 0.5) * (H / bands);
        var amp = R(0.02, 0.07) * H;
        var freq = R(1.2, 3.2);
        ctx.beginPath();
        ctx.moveTo(-20, base);
        for (var wx = -20; wx <= W + 20; wx += 12) {
          ctx.lineTo(wx, base + Math.sin((wx / W) * Math.PI * freq + wv) * amp);
        }
        ctx.lineTo(W + 20, H + 20);
        ctx.lineTo(-20, H + 20);
        ctx.closePath();
        ctx.fillStyle = C.hexA(pick(), 0.14);
        ctx.fill();
      }
    } else {
      /* soft blobs */
      for (var bl = 0; bl < 5; bl++) {
        var bx = R(0, W), by = R(0, H), brr = R(0.2, 0.5) * Math.min(W, H);
        var col = pick();
        for (var k = 0; k < 4; k++) {
          ctx.beginPath();
          ctx.arc(bx, by, brr * (1 - k * 0.22), 0, Math.PI * 2);
          ctx.fillStyle = C.hexA(col, 0.06);
          ctx.fill();
        }
      }
    }

    /* sparkle dust on top of every pattern */
    for (var sp = 0; sp < 14; sp++) {
      ctx.save();
      ctx.translate(R(0, W), R(0, H));
      ctx.rotate(R(0, Math.PI));
      ctx.fillStyle = 'rgba(255,255,255,' + R(0.4, 0.85).toFixed(2) + ')';
      var ss = R(0.012, 0.03) * Math.min(W, H);
      star(ctx, 0, 0, 4, ss, ss * 0.4);
      ctx.fill();
      ctx.restore();
    }
  };
})(window.CLANK);
