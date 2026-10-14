/* Clankers helped me! - URL (base64) + hashing helpers. */
window.CLANK = window.CLANK || {};
(function (C) {
  'use strict';

  /* ---------- base64 (UTF-8 safe, URL safe) ---------- */
  function bytesToBinary(bytes) {
    var out = '';
    var chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return out;
  }

  function utf8ToB64(str) {
    var bytes = new TextEncoder().encode(str);
    return btoa(bytesToBinary(bytes));
  }

  function b64ToUtf8(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function toUrlSafe(b64) {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromUrlSafe(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return s;
  }

  /* ---------- hashing ---------- */
  C.hashHex = function (str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= str.length;
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
    h ^= h >>> 15;
    return (h >>> 0).toString(16).padStart(8, '0');
  };

  /* ---------- compact payload ---------- */
  C.prune = function (state, dropImage) {
    var o = { v: 1 };
    if (state.title) o.t = state.title;
    o.d = state.desc || '';
    if (!dropImage && state.img) o.img = state.img;
    if (state.size && state.size !== C.SIZES[0].id) o.sz = state.size;
    if (state.bg === false) o.bg = false;

    var cats = (state.categories || []).filter(function (c) { return c.on; })
      .map(function (c) {
        var note = (c.note || '').trim();
        return note ? { i: c.id, n: note } : { i: c.id };
      });
    if (cats.length) o.c = cats;

    if (state.tools && state.tools.length) o.tl = state.tools;
    if (state.level !== '' && state.level != null) o.lv = String(state.level);
    if (state.footer) o.f = state.footer;
    return o;
  };

  C.encode = function (obj) { return toUrlSafe(utf8ToB64(JSON.stringify(obj))); };

  C.decode = function (token) {
    return JSON.parse(b64ToUtf8(fromUrlSafe(token)));
  };

  /* ---------- share URL ---------- */
  var MAX_PAYLOAD = 16000;

  C.baseUrl = function () {
    return location.href.split('#')[0].split('?')[0];
  };

  C.makeShare = function (state) {
    var payload = C.encode(C.prune(state, false));
    var dropped = false;
    if (payload.length > MAX_PAYLOAD && state.img) {
      payload = C.encode(C.prune(state, true));
      dropped = true;
    }
    var hash = C.hashHex(payload);
    return {
      url: C.baseUrl() + '?d=' + payload + '&h=' + hash,
      payload: payload,
      hash: hash,
      seed: parseInt(hash.slice(0, 8), 16) >>> 0,
      dropped: dropped
    };
  };

  C.readUrlState = function () {
    try {
      var src = (location.search && location.search.length > 1) ? location.search : location.hash;
      if (!src) return null;
      var params = new URLSearchParams(src.replace(/^[?#]/, ''));
      var d = params.get('d');
      if (!d) return null;
      return C.decode(d);
    } catch (e) {
      return null;
    }
  };
})(window.CLANK);
