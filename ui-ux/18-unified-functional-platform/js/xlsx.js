/* ============================================================
   Unified Functional Platform — FIRST-PARTY SPREADSHEET SUPPORT.

   Reads and writes the subset of `.xlsx` a question import needs: a
   worksheet of text cells. Nothing else — no formulas, no styles, no
   charts, no macros.

   ── WHY THIS EXISTS AT ALL ───────────────────────────────────
   The stakeholder asked for spreadsheet import (CSV **and** XLSX).
   `README.md` records this build's technology as *"Dependency-free
   HTML + CSS + vanilla JS (ES5-style) … No framework, no build step,
   no backend"*, and `17-stakeholder-correction-blueprint/11` rules a
   CDN out of scope. A vendored SheetJS would break the first of those
   and a CDN script tag would break both, so neither was taken.

   What a reader actually needs turns out to be small and stable, and
   is implemented here from the published formats:
     · a ZIP container reader  (PKZIP APPNOTE — end-of-central-
       directory → central directory → local headers)
     · a raw DEFLATE decompressor (RFC 1951: stored, fixed-Huffman and
       dynamic-Huffman blocks)
     · enough SpreadsheetML (ECMA-376) to walk `sheet1.xml` and
       `sharedStrings.xml` into rows of strings

   ⚠ NO NETWORK. Nothing here fetches anything, at build time or at
   run time. The prototype still opens from `file://` with no server.

   ── WHAT IT DELIBERATELY DOES NOT DO ─────────────────────────
   It does not evaluate formulas — a cell carrying `<f>` is read at
   its CACHED VALUE `<v>`, which is what the spreadsheet last
   calculated, and a formula with no cached value reads as empty
   rather than as a guess. It does not apply number formats: a date
   cell arrives as the serial number Excel stores, and the question
   import has no date column, so nothing depends on it. It does not
   read `.xls` (the pre-2007 binary format), and says so.

   The WRITER emits STORED (uncompressed) entries only. A template is
   a handful of rows; compressing it would mean writing a DEFLATE
   encoder to save a few hundred bytes, and every spreadsheet
   application reads stored entries.
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.xlsx = (function () {
  'use strict';

  /* ============================================================
     RFC 1951 — raw DEFLATE decompression.
     ============================================================ */

  /* Length/distance tables, straight from RFC 1951 §3.2.5. */
  var LEN_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
                  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  var LEN_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
                   3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  var DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
                   257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
                   8193, 12289, 16385, 24577];
  var DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
                    7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  var CLEN_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

  /* A ceiling on the row index a worksheet may claim. A crafted
     `r="999999999"` would otherwise ask this to allocate a billion
     empty rows before it read a single cell. Beyond the ceiling the row
     is appended in document order instead, which is the behaviour this
     had before it honoured `r` at all. Excel's own limit is 1,048,576. */
  var MAX_ROW_INDEX = 1048576;

  /* A canonical Huffman decoder built from a list of code lengths
     (RFC 1951 §3.2.2). `counts` is how many codes of each length
     exist; `symbols` is every symbol ordered by (length, symbol). */
  function buildHuffman(lengths) {
    var maxBits = 0, i;
    for (i = 0; i < lengths.length; i++) { if (lengths[i] > maxBits) { maxBits = lengths[i]; } }
    var counts = new Array(maxBits + 1);
    for (i = 0; i <= maxBits; i++) { counts[i] = 0; }
    for (i = 0; i < lengths.length; i++) { if (lengths[i]) { counts[lengths[i]] += 1; } }
    var offsets = new Array(maxBits + 2), total = 0;
    for (i = 1; i <= maxBits; i++) { offsets[i] = total; total += counts[i]; }
    var symbols = new Array(total);
    for (i = 0; i < lengths.length; i++) {
      if (lengths[i]) { symbols[offsets[lengths[i]]++] = i; }
    }
    return { counts: counts, symbols: symbols, maxBits: maxBits };
  }

  function BitReader(bytes, start) {
    this.b = bytes; this.pos = start || 0; this.bit = 0; this.cur = 0;
  }
  BitReader.prototype.readBit = function () {
    if (this.bit === 0) {
      if (this.pos >= this.b.length) { throw new Error('deflate: out of input'); }
      this.cur = this.b[this.pos++]; this.bit = 8;
    }
    var v = this.cur & 1;
    this.cur >>= 1; this.bit -= 1;
    return v;
  };
  BitReader.prototype.readBits = function (n) {
    var v = 0;
    for (var i = 0; i < n; i++) { v |= this.readBit() << i; }
    return v;
  };
  BitReader.prototype.align = function () { this.bit = 0; };
  BitReader.prototype.decode = function (h) {
    var code = 0, first = 0, index = 0;
    for (var len = 1; len <= h.maxBits; len++) {
      code |= this.readBit();
      var count = h.counts[len] || 0;
      if (code - first < count) { return h.symbols[index + (code - first)]; }
      index += count;
      first = (first + count) << 1;
      code <<= 1;
    }
    throw new Error('deflate: bad Huffman code');
  };

  var FIXED_LIT = null, FIXED_DIST = null;
  function fixedTables() {
    if (FIXED_LIT) { return; }
    var l = new Array(288), i;
    for (i = 0; i < 144; i++) { l[i] = 8; }
    for (i = 144; i < 256; i++) { l[i] = 9; }
    for (i = 256; i < 280; i++) { l[i] = 7; }
    for (i = 280; i < 288; i++) { l[i] = 8; }
    FIXED_LIT = buildHuffman(l);
    var d = new Array(30);
    for (i = 0; i < 30; i++) { d[i] = 5; }
    FIXED_DIST = buildHuffman(d);
  }

  /* Grows geometrically rather than guessing the output size — a
     wrong guess is either a truncation or a wasted allocation. */
  function Sink() { this.buf = new Uint8Array(1024); this.len = 0; }
  Sink.prototype.push = function (byte) {
    if (this.len === this.buf.length) {
      var bigger = new Uint8Array(this.buf.length * 2);
      bigger.set(this.buf);
      this.buf = bigger;
    }
    this.buf[this.len++] = byte;
  };
  Sink.prototype.done = function () { return this.buf.subarray(0, this.len); };

  /* ⚠ AN OUTPUT CEILING. A few hundred bytes of DEFLATE can expand to
     gigabytes — the classic decompression bomb — and `Sink` doubles its
     buffer forever. A worksheet this build can usefully read is far
     below this, so refusing beyond it costs nothing real and turns a
     hung tab into a message. */
  var MAX_INFLATED = 64 * 1024 * 1024;

  function inflateRaw(bytes, start) {
    var br = new BitReader(bytes, start || 0);
    var out = new Sink();
    var last = 0;
    fixedTables();
    do {
      last = br.readBit();
      var type = br.readBits(2);
      if (type === 0) {
        /* Stored: byte-aligned, LEN then ~LEN then the bytes. */
        br.align();
        if (br.pos + 4 > bytes.length) { throw new Error('deflate: truncated stored block'); }
        var len = bytes[br.pos] | (bytes[br.pos + 1] << 8);
        br.pos += 4;
        if (out.len + len > MAX_INFLATED) { throw new Error('deflate: output too large'); }
        for (var i = 0; i < len; i++) {
          if (br.pos >= bytes.length) { throw new Error('deflate: truncated stored data'); }
          out.push(bytes[br.pos++]);
        }
        continue;
      }
      var lit, dist;
      if (type === 1) {
        lit = FIXED_LIT; dist = FIXED_DIST;
      } else if (type === 2) {
        var hlit = br.readBits(5) + 257;
        var hdist = br.readBits(5) + 1;
        var hclen = br.readBits(4) + 4;
        var clens = new Array(19), k;
        for (k = 0; k < 19; k++) { clens[k] = 0; }
        for (k = 0; k < hclen; k++) { clens[CLEN_ORDER[k]] = br.readBits(3); }
        var clTree = buildHuffman(clens);
        var lengths = [], prev = 0;
        while (lengths.length < hlit + hdist) {
          var sym = br.decode(clTree);
          if (sym < 16) { prev = sym; lengths.push(sym); }
          else if (sym === 16) {
            var r = 3 + br.readBits(2);
            while (r--) { lengths.push(prev); }
          } else if (sym === 17) {
            var r2 = 3 + br.readBits(3);
            while (r2--) { lengths.push(0); }
            prev = 0;
          } else {
            var r3 = 11 + br.readBits(7);
            while (r3--) { lengths.push(0); }
            prev = 0;
          }
        }
        lit = buildHuffman(lengths.slice(0, hlit));
        dist = buildHuffman(lengths.slice(hlit, hlit + hdist));
      } else {
        throw new Error('deflate: reserved block type');
      }

      for (;;) {
        if (out.len > MAX_INFLATED) { throw new Error('deflate: output too large'); }
        var s = br.decode(lit);
        if (s === 256) { break; }
        if (s < 256) { out.push(s); continue; }
        var li = s - 257;
        if (li >= LEN_BASE.length) { throw new Error('deflate: bad length symbol'); }
        var length = LEN_BASE[li] + br.readBits(LEN_EXTRA[li]);
        var ds = br.decode(dist);
        if (ds >= DIST_BASE.length) { throw new Error('deflate: bad distance symbol'); }
        var distance = DIST_BASE[ds] + br.readBits(DIST_EXTRA[ds]);
        if (distance > out.len) { throw new Error('deflate: distance beyond output'); }
        var from = out.len - distance;
        for (var n = 0; n < length; n++) { out.push(out.buf[from + n]); }
      }
    } while (!last);
    return out.done();
  }

  /* ============================================================
     CRC-32 (PKZIP / RFC 1952) — needed to WRITE a valid archive.
     ============================================================ */
  var CRC_TABLE = null;
  function crcTable() {
    if (CRC_TABLE) { return CRC_TABLE; }
    CRC_TABLE = new Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
      CRC_TABLE[n] = c >>> 0;
    }
    return CRC_TABLE;
  }
  function crc32(bytes) {
    var t = crcTable(), c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) { c = t[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /* ============================================================
     ZIP CONTAINER
     ============================================================ */

  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }

  /* UTF-8 decode. Written out rather than using TextDecoder so the
     same code runs in the browser and in the headless QA harness. */
  function utf8(bytes) {
    var out = '', i = 0, c, c2, c3, cp;
    while (i < bytes.length) {
      c = bytes[i++];
      if (c < 0x80) { out += String.fromCharCode(c); continue; }
      if (c < 0xE0) {
        c2 = bytes[i++] & 0x3F;
        out += String.fromCharCode(((c & 0x1F) << 6) | c2);
        continue;
      }
      if (c < 0xF0) {
        c2 = bytes[i++] & 0x3F; c3 = bytes[i++] & 0x3F;
        out += String.fromCharCode(((c & 0x0F) << 12) | (c2 << 6) | c3);
        continue;
      }
      cp = (((c & 0x07) << 18) | ((bytes[i++] & 0x3F) << 12) |
            ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F)) - 0x10000;
      out += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
    }
    return out;
  }
  function toUtf8(str) {
    var s = String(str == null ? '' : str), out = [], i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c < 0x80) { out.push(c); }
      else if (c < 0x800) { out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F)); }
      /* ⚠ THE NEXT UNIT MUST ACTUALLY BE A LOW SURROGATE.
         This checked only that a next character EXISTED, so a lone high
         surrogate followed by an ordinary letter produced a wrong code
         point AND swallowed that letter. A lone surrogate is not a
         character, so it is written as U+FFFD rather than as invalid
         UTF-8 that a spreadsheet application would reject. */
      else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length &&
               s.charCodeAt(i + 1) >= 0xDC00 && s.charCodeAt(i + 1) <= 0xDFFF) {
        var cp = 0x10000 + ((c - 0xD800) << 10) + (s.charCodeAt(++i) - 0xDC00);
        out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F),
                 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
      }
      else if (c >= 0xD800 && c <= 0xDFFF) { out.push(0xEF, 0xBF, 0xBD); }
      else { out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)); }
    }
    return new Uint8Array(out);
  }

  /* Reads the archive from its CENTRAL DIRECTORY, not by scanning for
     local headers: a local header's sizes may be zero with the real
     values in a trailing data descriptor, and only the central
     directory is guaranteed to carry them. */
  function unzip(bytes) {
    var eocd = -1;
    /* The end-of-central-directory record is at most 22 bytes plus a
       comment of up to 65535, so scan backwards over that window. */
    var lowest = Math.max(0, bytes.length - 22 - 65535);
    for (var i = bytes.length - 22; i >= lowest; i--) {
      if (bytes[i] === 0x50 && bytes[i + 1] === 0x4B && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
        eocd = i; break;
      }
    }
    if (eocd < 0) { throw new Error('Not a readable .xlsx file — no ZIP directory was found.'); }
    var count = u16(bytes, eocd + 10);
    var dirOffset = u32(bytes, eocd + 16);
    var files = {}, p = dirOffset;
    for (var n = 0; n < count; n++) {
      if (u32(bytes, p) !== 0x02014B50) { throw new Error('Not a readable .xlsx file — the ZIP directory is damaged.'); }
      var method = u16(bytes, p + 10);
      var compSize = u32(bytes, p + 20);
      var nameLen = u16(bytes, p + 28);
      var extraLen = u16(bytes, p + 30);
      var commentLen = u16(bytes, p + 32);
      var localOffset = u32(bytes, p + 42);
      var name = utf8(bytes.subarray(p + 46, p + 46 + nameLen));
      /* The local header's own name/extra lengths locate the data. */
      var lNameLen = u16(bytes, localOffset + 26);
      var lExtraLen = u16(bytes, localOffset + 28);
      var dataAt = localOffset + 30 + lNameLen + lExtraLen;
      var data;
      if (method === 0) { data = bytes.subarray(dataAt, dataAt + compSize); }
      else if (method === 8) { data = inflateRaw(bytes, dataAt); }
      else { throw new Error('Not a readable .xlsx file — it uses an unsupported compression method.'); }
      files[name] = data;
      p += 46 + nameLen + extraLen + commentLen;
    }
    return files;
  }

  /* STORED-only writer. Entries in the order given; the central
     directory mirrors them. */
  function zip(entries) {
    var local = [], central = [], offset = 0, i;
    function push(arr, v, n) { for (var k = 0; k < n; k++) { arr.push((v >>> (8 * k)) & 0xFF); } }
    for (i = 0; i < entries.length; i++) {
      var nameBytes = toUtf8(entries[i].name);
      var body = entries[i].data;
      var crc = crc32(body);
      var lh = [];
      push(lh, 0x04034B50, 4);
      push(lh, 20, 2);              /* version needed */
      push(lh, 0x0800, 2);          /* UTF-8 filename flag */
      push(lh, 0, 2);               /* stored */
      push(lh, 0, 2); push(lh, 0, 2); /* no timestamp — nothing here is time-dependent */
      push(lh, crc, 4);
      push(lh, body.length, 4);
      push(lh, body.length, 4);
      push(lh, nameBytes.length, 2);
      push(lh, 0, 2);
      for (var b = 0; b < nameBytes.length; b++) { lh.push(nameBytes[b]); }
      var ch = [];
      push(ch, 0x02014B50, 4);
      push(ch, 20, 2); push(ch, 20, 2);
      push(ch, 0x0800, 2); push(ch, 0, 2);
      push(ch, 0, 2); push(ch, 0, 2);
      push(ch, crc, 4);
      push(ch, body.length, 4); push(ch, body.length, 4);
      push(ch, nameBytes.length, 2);
      push(ch, 0, 2); push(ch, 0, 2); push(ch, 0, 2); push(ch, 0, 2);
      push(ch, 0, 4);
      push(ch, offset, 4);
      for (var b2 = 0; b2 < nameBytes.length; b2++) { ch.push(nameBytes[b2]); }
      local.push({ head: lh, body: body });
      central.push(ch);
      offset += lh.length + body.length;
    }
    var dirStart = offset, dirBytes = [];
    for (i = 0; i < central.length; i++) { dirBytes = dirBytes.concat(central[i]); }
    var end = [];
    push(end, 0x06054B50, 4);
    push(end, 0, 2); push(end, 0, 2);
    push(end, entries.length, 2); push(end, entries.length, 2);
    push(end, dirBytes.length, 4);
    push(end, dirStart, 4);
    push(end, 0, 2);
    var total = dirStart + dirBytes.length + end.length;
    var out = new Uint8Array(total), at = 0, j;
    for (i = 0; i < local.length; i++) {
      for (j = 0; j < local[i].head.length; j++) { out[at++] = local[i].head[j]; }
      out.set(local[i].body, at); at += local[i].body.length;
    }
    for (j = 0; j < dirBytes.length; j++) { out[at++] = dirBytes[j]; }
    for (j = 0; j < end.length; j++) { out[at++] = end[j]; }
    return out;
  }

  /* ============================================================
     SpreadsheetML — just enough of it.

     ── WHY THIS IS A SCANNER AND NOT A SET OF REGULAR EXPRESSIONS ──
     It used to be regular expressions, and the first version of them
     was wrong in a way that corrupted ORDINARY files rather than
     crafted ones:

       /<c(?:\s([^>]*))?>([\s\S]*?)<\/c>|<c\s([^>]*)\/>/

     The paired alternative comes first, and `[^>]*` happily eats the
     `/` of a SELF-CLOSING tag — so `<c r="B1" s="1"/>` matched as an
     OPEN tag, and its lazy body then ran forward to the NEXT cell's
     `</c>`, swallowing that cell whole. A self-closing `<c/>` is what
     Excel, LibreOffice and openpyxl all emit for a styled empty cell,
     so a perfectly normal workbook silently lost a column. `<t/>` and
     `<si/>` had the same defect, and `<sheet>` written in paired form
     was rejected outright as "no worksheet".

     The second problem was performance. Both alternatives need a
     closing tag, so a document missing one made the engine rescan from
     every start position — quadratic in the file size, on input this
     build reads from a file chooser.

     So the markup is walked ONCE, left to right, with `indexOf`. There
     is no backtracking to be catastrophic, both tag forms are handled
     explicitly, and everything is bounded (see the caps below).
     ============================================================ */

  /* Bounds. Beyond any of these the file is refused rather than
     truncated: a spreadsheet is a person's own work and silently
     reading half of it is worse than saying no. Excel's own limits are
     1,048,576 rows and 16,384 columns. */
  var MAX_COL_INDEX = 16383;          /* XFD */
  var MAX_CELLS = 400000;             /* whole-sheet cell budget */
  var MAX_XML_BYTES = 24 * 1024 * 1024;

  /* ONE pass, and the numeric references are resolved in the SAME pass
     as the named ones. Running them as separate passes let a numeric
     reference expand into the input of a later pass: `&#38;lt;`
     decoded to `&lt;` and was then decoded again to `<`, so a
     spreadsheet cell containing the literal text `&#38;lt;` came back
     as `<`. */
  var ENTITY_RE = /&(#x[0-9a-fA-F]+|#\d+|lt|gt|quot|apos|amp);/g;
  var NAMED_ENTITY = { lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' };
  function decodeEntities(s) {
    return String(s).replace(ENTITY_RE, function (whole, body) {
      if (body.charAt(0) === '#') {
        var n = body.charAt(1) === 'x' || body.charAt(1) === 'X'
          ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
        if (!isFinite(n) || n < 0 || n > 0x10FFFF) { return whole; }
        if (n <= 0xFFFF) { return String.fromCharCode(n); }
        n -= 0x10000;
        return String.fromCharCode(0xD800 + (n >> 10), 0xDC00 + (n & 0x3FF));
      }
      return NAMED_ENTITY[body];
    });
  }
  function escapeXml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
      /* Control characters are not legal in XML 1.0 and Excel refuses
         a file containing them. Dropping them is the only safe move. */
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  }

  /* ------------------------------------------------------------
     THE SCANNER.

     `scan(xml, name, onElement)` walks every `<name …>` element at any
     depth, once, and calls back with its attribute text and its inner
     markup. A self-closing element yields an empty inner string. An
     unterminated element ends the scan rather than rescanning.
     ------------------------------------------------------------ */
  function scan(xml, name, onElement) {
    var open = '<' + name;
    var close = '</' + name + '>';
    var i = 0, n = xml.length;
    while (i < n) {
      var at = xml.indexOf(open, i);
      if (at === -1) { return; }
      var after = xml.charAt(at + open.length);
      /* `<row` must not match `<rowBreaks`. A real element is followed
         by whitespace, `>` or `/`. */
      if (after !== '' && after !== '>' && after !== '/' && !/\s/.test(after)) {
        i = at + open.length;
        continue;
      }
      var gt = xml.indexOf('>', at);
      if (gt === -1) { return; }                       /* truncated — stop */
      var attrs = xml.slice(at + open.length, gt);
      if (attrs.charAt(attrs.length - 1) === '/') {
        /* SELF-CLOSING. Handled explicitly and first, which is the
           whole point of this rewrite. */
        if (onElement(attrs.slice(0, -1), '') === false) { return; }
        i = gt + 1;
        continue;
      }
      var bodyEnd = xml.indexOf(close, gt + 1);
      if (bodyEnd === -1) {
        /* No closing tag. The document is malformed; take what is
           there and stop, rather than rescanning from the next
           character and doing it all again for every start position. */
        onElement(attrs, xml.slice(gt + 1));
        return;
      }
      if (onElement(attrs, xml.slice(gt + 1, bodyEnd)) === false) { return; }
      i = bodyEnd + close.length;
    }
  }

  function attr(attrs, name) {
    var m = new RegExp('(?:^|\\s)' + name + '="([^"]*)"').exec(attrs);
    return m ? m[1] : null;
  }

  /* All the text inside one element, entities decoded, markup dropped.
     Used for <si> (a shared string, which may be split across several
     <t> runs) and for <is>. */
  function textOf(xml) {
    var out = '';
    scan(xml, 't', function (attrs, body) { out += decodeEntities(body); });
    return out;
  }

  function sharedStrings(files) {
    var raw = files['xl/sharedStrings.xml'];
    if (!raw) { return []; }
    var xml = utf8(raw), out = [];
    scan(xml, 'si', function (attrs, body) { out.push(textOf(body)); });
    return out;
  }

  /* "BC12" → 54. Column letters are base-26 with no zero.
     ⚠ BOUNDED. `parseSheet` densifies a row up to this index, so an
     unbounded value from a crafted `r="ZZZZZZZZ1"` would ask for an
     array of billions of entries before a single cell was read. */
  function colIndex(ref) {
    var letters = String(ref || '').replace(/[^A-Za-z]/g, '').toUpperCase();
    if (!letters || letters.length > 3) { return -1; }
    var n = 0;
    for (var i = 0; i < letters.length; i++) { n = n * 26 + (letters.charCodeAt(i) - 64); }
    n -= 1;
    return (n >= 0 && n <= MAX_COL_INDEX) ? n : -1;
  }

  function cellValue(attrs, inner, strings) {
    var type = attr(attrs, 't') || 'n';
    function v() {
      var got = null;
      scan(inner, 'v', function (a, body) { if (got === null) { got = decodeEntities(body); } });
      return got;
    }
    if (type === 's') {
      var idx = parseInt(v(), 10);
      return (!isNaN(idx) && strings[idx] !== undefined) ? strings[idx] : '';
    }
    if (type === 'inlineStr') { return textOf(inner); }
    if (type === 'b') {
      /* A boolean cell stores 1 / 0. The question import's own
         true/false column reads words, so these are surfaced as the
         words a person typed rather than as digits. */
      var b = v();
      return b === null ? '' : (String(b).trim() === '1' ? 'TRUE' : 'FALSE');
    }
    /* `str` (a formula's cached string), `e` (an error such as #REF!,
       whose text IS the value a validation message should name) and
       plain numbers all read their cached `<v>`. A formula with no
       cached value reads as empty rather than as a guess. */
    var raw = v();
    return raw === null ? '' : raw;
  }

  function parseSheet(xml, strings) {
    var rows = [];
    var cellBudget = MAX_CELLS;
    scan(xml, 'row', function (rowAttrs, body) {
      /* ⚠ THE ROW'S OWN NUMBER, NOT ITS POSITION IN THE FILE.
         A worksheet omits empty rows entirely, so appending in
         document order silently closes every gap — and a validator
         that reports "row 7" would be naming a row the person cannot
         find. `r` is the spreadsheet's own 1-based row number. */
      var rNum = parseInt(attr(rowAttrs, 'r'), 10);
      var rowAt = (!isNaN(rNum) && rNum >= 1 && rNum - 1 <= MAX_ROW_INDEX)
        ? rNum - 1 : rows.length;
      var cells = [];
      scan(body, 'c', function (cAttrs, inner) {
        if (cellBudget-- <= 0) { return false; }
        var value = cellValue(cAttrs, inner, strings);
        var at = colIndex(attr(cAttrs, 'r'));
        if (at < 0) { at = cells.length; }
        /* Blank cells are simply absent from the XML, so the column
           position has to come from the reference or the row would
           shift left wherever somebody left a cell empty. */
        while (cells.length < at) { cells.push(''); }
        cells[at] = value;
      });
      while (rows.length < rowAt) { rows.push([]); }
      rows[rowAt] = cells;
      if (cellBudget <= 0) { return false; }
    });
    return rows;
  }

  function sheetPaths(files) {
    var wb = files['xl/workbook.xml'];
    if (!wb) { return []; }
    var xml = utf8(wb);
    var relsRaw = files['xl/_rels/workbook.xml.rels'];
    var rels = {};
    if (relsRaw) {
      scan(utf8(relsRaw), 'Relationship', function (a) {
        var id = attr(a, 'Id'), tg = attr(a, 'Target');
        if (id && tg) {
          rels[id] = 'xl/' + decodeEntities(tg).replace(/^\/?xl\//, '').replace(/^\.\//, '');
        }
      });
    }
    var out = [];
    scan(xml, 'sheet', function (a) {
      var nm = attr(a, 'name');
      var rid = attr(a, 'r:id') || attr(a, 'id');
      out.push({
        name: nm ? decodeEntities(nm) : 'Sheet' + (out.length + 1),
        path: (rid && rels[rid]) ? rels[rid] : null
      });
    });
    /* A workbook whose relationships could not be resolved still has
       its sheets on disk in the conventional place. */
    out.forEach(function (sh, i) {
      if (!sh.path || !files[sh.path]) { sh.path = 'xl/worksheets/sheet' + (i + 1) + '.xml'; }
    });
    return out.filter(function (sh) { return !!files[sh.path]; });
  }

  /* ------------------------------------------------------------
     PUBLIC READ API.

     `read(buffer)` → { ok, sheets:[{name, rows}], error }
     `rows` are arrays of STRINGS, ragged exactly as the sheet is —
     the caller normalises against its own header, the same way
     `XRSLP.csv.parse` hands back raw rows.
     ------------------------------------------------------------ */
  function read(buffer) {
    var bytes;
    try {
      bytes = (buffer instanceof Uint8Array) ? buffer : new Uint8Array(buffer);
    } catch (e) {
      return { ok: false, sheets: [], error: 'The file could not be read.' };
    }
    if (bytes.length < 4) {
      return { ok: false, sheets: [], error: 'The file is empty.' };
    }
    /* The pre-2007 binary format is a different container entirely and
       is named rather than being reported as a damaged .xlsx. */
    if (bytes[0] === 0xD0 && bytes[1] === 0xCF) {
      return { ok: false, sheets: [],
        error: 'This is an older .xls workbook. Save it as .xlsx (or export it as CSV) and try again.' };
    }
    if (!(bytes[0] === 0x50 && bytes[1] === 0x4B)) {
      return { ok: false, sheets: [],
        error: 'This does not look like a spreadsheet file. Choose a .xlsx or .csv file.' };
    }
    var files;
    try { files = unzip(bytes); }
    catch (e) { return { ok: false, sheets: [], error: e.message || 'The file could not be opened.' }; }
    if (!files['xl/workbook.xml']) {
      return { ok: false, sheets: [],
        error: 'This ZIP file is not an Excel workbook — it has no worksheet inside it.' };
    }
    var strings;
    try { strings = sharedStrings(files); }
    catch (e) { strings = []; }
    var sheets = [];
    var oversized = false;
    try {
      sheetPaths(files).forEach(function (s) {
        if (oversized) { return; }
        /* Refused, not truncated: half a person's spreadsheet read
           silently is worse than being told to split it. */
        if (files[s.path].length > MAX_XML_BYTES) { oversized = true; return; }
        sheets.push({ name: s.name, rows: parseSheet(utf8(files[s.path]), strings) });
      });
      if (oversized) {
        return { ok: false, sheets: [],
          error: 'This worksheet is too large for this import to read. Split it and try again.' };
      }
    } catch (e) {
      return { ok: false, sheets: [], error: 'The worksheet could not be read: ' + (e.message || 'unknown error') };
    }
    if (!sheets.length) {
      return { ok: false, sheets: [], error: 'The workbook contains no worksheet.' };
    }
    return { ok: true, sheets: sheets, error: null };
  }

  /* Rows of the FIRST worksheet, blank rows dropped — the same
     contract `XRSLP.csv.parse` returns, so one validator can read
     either format. */
  function rowsOf(result) {
    if (!result || !result.ok || !result.sheets.length) { return []; }
    return result.sheets[0].rows.filter(function (r) { return !isBlankRow(r); });
  }
  /* Every row IN PLACE, blank rows included — for a caller that reports
     row numbers a person has to find in their own spreadsheet. */
  function rowsOfRaw(result) {
    if (!result || !result.ok || !result.sheets.length) { return []; }
    return result.sheets[0].rows;
  }
  function isBlankRow(r) {
    return !(r || []).some(function (v) { return String(v == null ? '' : v).trim() !== ''; });
  }

  /* ------------------------------------------------------------
     PUBLIC WRITE API — one worksheet of inline strings.

     Inline strings, not a shared-string table: a template is small,
     and an inline sheet is one file fewer to get wrong.
     ------------------------------------------------------------ */
  function colName(i) {
    var s = '';
    i += 1;
    while (i > 0) {
      var r = (i - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      i = Math.floor((i - 1) / 26);
    }
    return s;
  }

  function write(rows, sheetName) {
    var name = String(sheetName || 'Sheet1').replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31) || 'Sheet1';
    var body = (rows || []).map(function (cells, r) {
      return '<row r="' + (r + 1) + '">' + (cells || []).map(function (v, c) {
        var text = String(v == null ? '' : v);
        if (text === '') { return ''; }
        return '<c r="' + colName(c) + (r + 1) + '" t="inlineStr"><is><t xml:space="preserve">' +
          escapeXml(text) + '</t></is></c>';
      }).join('') + '</row>';
    }).join('');

    var sheet =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetData>' + body + '</sheetData></worksheet>';
    var workbook =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="' + escapeXml(name) + '" sheetId="1" r:id="rId1"/></sheets></workbook>';
    var wbRels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ' +
      'Target="worksheets/sheet1.xml"/></Relationships>';
    var rootRels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" ' +
      'Target="xl/workbook.xml"/></Relationships>';
    var types =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.' +
      'spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.' +
      'spreadsheetml.worksheet+xml"/></Types>';

    return zip([
      { name: '[Content_Types].xml', data: toUtf8(types) },
      { name: '_rels/.rels', data: toUtf8(rootRels) },
      { name: 'xl/workbook.xml', data: toUtf8(workbook) },
      { name: 'xl/_rels/workbook.xml.rels', data: toUtf8(wbRels) },
      { name: 'xl/worksheets/sheet1.xml', data: toUtf8(sheet) }
    ]);
  }

  /* Hands the browser an .xlsx file, through the same download
     helper every other export uses. */
  function download(filename, rows, sheetName) {
    var bytes = write(rows, sheetName);
    var blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    XRSLP.util.download(blob, filename);
    return filename;
  }

  function looksLikeXlsxName(name) {
    return /\.xlsx$/i.test(String(name || ''));
  }

  return {
    read: read, rowsOf: rowsOf, rowsOfRaw: rowsOfRaw, isBlankRow: isBlankRow,
    write: write, download: download,
    looksLikeXlsxName: looksLikeXlsxName,
    /* Exposed for the QA suite, which round-trips a workbook through
       both halves without touching a file system. */
    zip: zip, unzip: unzip, inflateRaw: inflateRaw, crc32: crc32,
    utf8: utf8, toUtf8: toUtf8
  };
})();
