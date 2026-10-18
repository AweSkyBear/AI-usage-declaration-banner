/* AI Usage - URL (base64) + hashing helpers. */
window.AIU = window.AIU || {};
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
  C.prune = function (state) {
    var o = { v: 2 };
    o.x = state.text || '';
    if (state.size && state.size !== C.DEFAULT_SIZE) o.sz = state.size;
    return o;
  };

  C.encode = function (obj) { return toUrlSafe(utf8ToB64(JSON.stringify(obj))); };

  C.decode = function (token) {
    return JSON.parse(b64ToUtf8(fromUrlSafe(token)));
  };

  /* ---------- share URL ---------- */
  C.baseUrl = function () {
    return location.href.split('#')[0].split('?')[0];
  };

  C.makeShare = function (state) {
    var payload = C.encode(C.prune(state));
    var hash = C.hashHex(payload);
    return {
      url: C.baseUrl() + '?d=' + payload + '&h=' + hash,
      payload: payload,
      hash: hash
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
})(window.AIU);
