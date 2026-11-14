document.documentElement.classList.add("js");

(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(id) { return document.getElementById(id); }
  function set(id, v) { var el = $(id); if (el) el.textContent = v; }
  function fmt(n) { try { return n.toLocaleString("id-ID"); } catch (e) { return String(n); } }

  /* ---------- Hitungan hari ---------- */
  // Ganti tanggal ini dengan tanggal jadian kalian (tahun, bulan 1-12, hari).
  var START = { y: 2026, m: 11, d: 5 };
  var months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var start = new Date(START.y, START.m - 1, START.d);
  var total = Math.max(0, Math.floor((today - start) / 86400000));

  var y = today.getFullYear() - start.getFullYear();
  var m = today.getMonth() - start.getMonth();
  var d = today.getDate() - start.getDate();
  if (d < 0) { m -= 1; d += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
  if (m < 0) { y -= 1; m += 12; }
  if (y < 0) { y = 0; m = 0; d = 0; }
  set("y", y); set("m", m); set("d", d);
  set("since", START.d + " " + months[START.m - 1] + " " + START.y);

  if (reduce || total < 2) {
    set("days", fmt(total));
  } else {
    var t0 = null, dur = 1400;
    (function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      set("days", fmt(Math.round(total * e)));
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  function tickSecs() {
    set("secs", fmt(Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000))));
  }
  tickSecs();
  setInterval(tickSecs, 1000);

  /* ---------- Kelopak melayang ---------- */
  var cv = $("petals"), hero = $("hero");
  if (cv && cv.getContext && !reduce) {
    var ctx = cv.getContext("2d"), petals = [], W = 0, H = 0, color = "#8E2F45", running = false, inView = true;
    var readColor = function () {
      try {
        var c = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
        if (c) color = c;
      } catch (e) {}
    };
    var make = function (initial) {
      return {
        x: Math.random() * W, y: initial ? Math.random() * H : -20,
        r: 5 + Math.random() * 7, vy: 0.25 + Math.random() * 0.5, vx: (Math.random() - 0.5) * 0.3,
        a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.03, sw: Math.random() * 6.28,
        o: 0.22 + Math.random() * 0.33
      };
    };
    var resize = function () {
      var r = hero.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.max(1, Math.round(W * dpr)); cv.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = W < 500 ? 12 : 22;
      petals = [];
      for (var i = 0; i < n; i++) petals.push(make(true));
    };
    var frame = function () {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = color;
      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.sw += 0.012;
        p.x += p.vx + Math.sin(p.sw) * 0.35;
        p.y += p.vy;
        p.a += p.va;
        if (p.y > H + 20) petals[i] = p = make(false);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.globalAlpha = p.o;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.2832);
        ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(frame);
    };
    var go = function () {
      if (running || !inView || document.hidden) return;
      running = true;
      requestAnimationFrame(frame);
    };
    var stop = function () { running = false; };

    readColor();
    resize();
    go();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else go(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (inView) go(); else stop();
      }).observe(hero);
    }
    try {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", readColor);
      new MutationObserver(readColor).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    } catch (e) {}
  }

  /* ---------- Muncul saat scroll ---------- */
  var rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Bilah baca + garis linimasa ---------- */
  var bar = $("bar"), tl = $("tl"), ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? (window.pageYOffset || 0) / max : 0;
      bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)) + ")";
      if (tl) {
        var r = tl.getBoundingClientRect();
        var f = (window.innerHeight * 0.65 - r.top) / Math.max(1, r.height);
        tl.style.setProperty("--tl", Math.min(1, Math.max(0, f)));
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Alasan ---------- */
  var reasons = [
    "Kamu mendengarkan sampai selesai, bahkan saat ceritaku berputar-putar.",
    "Kamu ingat hal-hal kecil yang pernah kuceritakan hanya sekali.",
    "Kamu tetap tenang saat aku panik.",
    "Cara kamu tertawa membuat hari yang buruk terasa lebih pendek.",
    "Kamu jujur, bahkan saat itu tidak enak didengar.",
    "Di mana pun kita berada, asal ada kamu, rasanya seperti pulang.",
    "Kamu mau belajar menyukai hal-hal yang kusukai.",
    "Kamu orang pertama yang ingin kuberi kabar."
  ];
  var ri = 0, rq = $("reason");
  $("next").addEventListener("click", function () {
    ri = (ri + 1) % reasons.length;
    var apply = function () {
      rq.textContent = reasons[ri];
      set("rcount", (ri + 1) + " dari " + reasons.length);
      rq.classList.remove("swap");
    };
    if (reduce) { apply(); return; }
    rq.classList.add("swap");
    setTimeout(apply, 180);
  });

  /* ---------- Kartu foto bisa dibalik ---------- */
  document.querySelectorAll(".card").forEach(function (c) {
    c.addEventListener("click", function () {
      var on = c.classList.toggle("flipped");
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
  });

  /* ---------- Penyimpanan kecil (tiap perangkat sendiri) ---------- */
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
    return null;
  }

  /* ---------- Hitung mundur bulan jadian ---------- */
  var cdTarget = null;
  function pad2(n) { return n < 10 ? "0" + n : String(n); }
  function cdSetup() {
    var n = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth()) + 1;
    var t;
    for (;;) {
      t = new Date(START.y, START.m - 1 + n, START.d);
      if (t.getTime() > Date.now()) break;
      n += 1;
    }
    cdTarget = t;
    set("cdTitle", n % 12 === 0 ? (n / 12) + " tahun jadian" : n + " bulan jadian");
    set("cdDate", t.getDate() + " " + months[t.getMonth()] + " " + t.getFullYear());
  }
  function cdTick() {
    var diff = cdTarget.getTime() - Date.now();
    if (diff <= 0) { cdSetup(); diff = cdTarget.getTime() - Date.now(); }
    set("cdD", Math.floor(diff / 86400000));
    set("cdH", pad2(Math.floor(diff / 3600000) % 24));
    set("cdM", pad2(Math.floor(diff / 60000) % 60));
    set("cdS", pad2(Math.floor(diff / 1000) % 60));
  }
  cdSetup(); cdTick();
  setInterval(cdTick, 1000);

  /* ---------- Kupon cinta ---------- */
  var used = store("kupon-v1") || {};
  function markCoupon(b, on) {
    b.classList.toggle("used", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    var st = b.querySelector(".state");
    if (st) st.textContent = on ? "Sudah ditukar" : "Ketuk untuk menukar";
  }
  document.querySelectorAll(".coupon").forEach(function (b) {
    var id = b.getAttribute("data-id");
    if (used[id]) markCoupon(b, true);
    b.addEventListener("click", function () {
      var on = !b.classList.contains("used");
      markCoupon(b, on);
      used[id] = on;
      store("kupon-v1", used);
    });
  });

  /* ---------- Kuis ---------- */
  // Ganti pertanyaan dan tanggapan dengan cerita kalian. Format: [teks pilihan, tanggapan].
  var QUIZ = [
    { q: "Siapa yang lebih dulu jatuh cinta?", o: [
      ["Aku", "Jawaban yang manis. Tapi aku curiga kamu cuma mengalah."],
      ["Kamu", "Ketahuan. Rahasiaku terbongkar."],
      ["Bersamaan", "Jawaban paling romantis."] ] },
    { q: "Siapa yang paling sering bilang \"terserah\" saat memilih tempat makan?", o: [
      ["Aku", "Benar, dan aku akan tetap mengulanginya."],
      ["Kamu", "Terserah itu artinya ada pilihan, kan?"],
      ["Kita berdua", "Makanya kita sering makan di tempat yang sama."] ] },
    { q: "Berapa lama kamu mau bersamaku?", o: [
      ["Selamanya", "Setuju. Sudah dicatat."],
      ["Selamanya, ditambah satu hari", "Kamu selalu menang kalau soal ini."],
      ["Lebih lama dari itu", "Aku tidak tahu itu mungkin, tapi aku mau mencoba."] ] }
  ];
  var QEND = "Semua jawabanmu benar, karena semuanya jawaban tentang kita.";
  var qi = 0, answered = false, done = false;
  var qprog = $("qprog"), qtext = $("qtext"), qopts = $("qopts"), qfb = $("qfb"), qnext = $("qnext");
  function showQ() {
    var q = QUIZ[qi];
    answered = false; done = false;
    qprog.textContent = "Pertanyaan " + (qi + 1) + " dari " + QUIZ.length;
    qtext.textContent = q.q;
    qfb.textContent = "";
    qnext.hidden = true;
    qopts.innerHTML = "";
    q.o.forEach(function (o) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "opt";
      b.textContent = o[0];
      b.addEventListener("click", function () {
        if (answered) return;
        answered = true;
        b.classList.add("picked");
        qfb.textContent = o[1];
        qnext.textContent = qi === QUIZ.length - 1 ? "Lihat hasilnya" : "Lanjut";
        qnext.hidden = false;
        qopts.querySelectorAll(".opt").forEach(function (x) { x.disabled = true; });
      });
      qopts.appendChild(b);
    });
  }
  qnext.addEventListener("click", function () {
    if (done) { qi = 0; showQ(); return; }
    if (qi < QUIZ.length - 1) { qi += 1; showQ(); return; }
    done = true;
    qprog.textContent = "Selesai";
    qtext.textContent = QEND;
    qopts.innerHTML = "";
    qfb.textContent = "";
    qnext.textContent = "Main lagi";
  });
  showQ();

  /* ---------- Buka kalau ---------- */
  document.querySelectorAll(".open > button").forEach(function (b) {
    b.addEventListener("click", function () {
      var box = b.parentNode, on = !box.classList.contains("on");
      box.classList.toggle("on", on);
      b.setAttribute("aria-expanded", on ? "true" : "false");
    });
  });

  /* ---------- Lagu kita ---------- */
  // Ganti judul dan artis dengan lagu kalian, juga teks di #songTitle dan #songArtist di atas.
  var SONG = { title: "Judul Lagu Kita", artist: "Nama Artis" };
  var sq = encodeURIComponent(SONG.title + " " + SONG.artist);
  $("yt").href = "https://www.youtube.com/results?search_query=" + sq;
  $("sp").href = "https://open.spotify.com/search/" + sq;
  set("songTitle", SONG.title);
  set("songArtist", SONG.artist);

  /* ---------- Pesan rahasia ---------- */
  $("sbtn").addEventListener("click", function () {
    var s = $("secret");
    s.hidden = !s.hidden;
  });

  /* ---------- Jadwal ngedate dan wishlist (disimpan bersama lewat Supabase) ---------- */
  var DAYS = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  var MON3 = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  var shared = { db: null, canWrite: true };
  var loaded = {};

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function ymd(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function parseYMD(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof s === "string" ? s : "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function dayDiff(d) { return Math.round((d - today) / 86400000); }
  function str(v) { return typeof v === "string" ? v : ""; }

  // Tanggal bawaan: Sabtu berikutnya.
  var dDate = $("dDate");
  dDate.min = ymd(today);
  dDate.value = ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() + ((((6 - today.getDay()) + 7) % 7) || 7)));

  function setEnabled(on) {
    ["dForm", "dChips", "wForm", "wChips"].forEach(function (id) {
      var box = $(id);
      if (!box) return;
      box.querySelectorAll("input,select,button").forEach(function (x) { x.disabled = !on; });
    });
  }
  setEnabled(false);

  function errMsg(e) {
    var c = e && e.code;
    if (c === "invalid_argument") return "Akun ini hanya bisa melihat, belum bisa mengubah.";
    if (c === "quota_exceeded") return "Penyimpanan penuh. Hapus beberapa item dulu.";
    return "Belum tersimpan. Coba lagi sebentar lagi.";
  }
  async function write(fn, statusId, okMsg) {
    try {
      await fn();
      set(statusId, okMsg || "");
      return true;
    } catch (e) {
      set(statusId, errMsg(e));
      return false;
    }
  }
  function armDelete(btn, run) {
    var armed = false, t = null;
    function reset() { armed = false; btn.textContent = "Hapus"; btn.classList.remove("arm"); }
    btn.addEventListener("click", function () {
      if (!armed) {
        armed = true;
        btn.textContent = "Yakin hapus?";
        btn.classList.add("arm");
        t = setTimeout(reset, 3000);
        return;
      }
      clearTimeout(t);
      btn.disabled = true;
      run();
    });
  }

  function dateCard(r, isPast) {
    var diff = dayDiff(r.d);
    var c = el("div", "dcard" + (isPast ? " past" : "") + (diff === 0 ? " today" : ""));
    var day = el("div", "dday");
    day.appendChild(el("span", "wk", DAYS[r.d.getDay()]));
    day.appendChild(el("b", "", String(r.d.getDate())));
    day.appendChild(el("span", "mn", MON3[r.d.getMonth()] + " " + r.d.getFullYear()));
    var body = el("div", "dbody");
    body.appendChild(el("h3", "", r.title));
    var bits = [];
    if (r.time) bits.push(r.time.replace(":", "."));
    if (r.place) bits.push(r.place);
    if (bits.length) body.appendChild(el("p", "meta", bits.join(" · ")));
    body.appendChild(el("span", "when", isPast ? Math.abs(diff) + " hari lalu" : diff === 0 ? "Hari ini" : diff === 1 ? "Besok" : diff + " hari lagi"));
    var del = el("button", "mini", "Hapus");
    del.type = "button";
    del.disabled = !shared.canWrite;
    armDelete(del, function () {
      write(function () { return shared.db.doc("dates/" + r.id).delete(); }, "dStatus", "Jadwal dihapus.");
    });
    c.appendChild(day); c.appendChild(body); c.appendChild(del);
    return c;
  }

  function renderDates(items) {
    var list = $("dList"), past = $("dPast");
    list.textContent = ""; past.textContent = "";
    var up = [], old = [];
    items.forEach(function (it) {
      var d = parseYMD(it.date), title = str(it.title).trim();
      if (!d || !title) return;
      var row = { id: it.id, title: title, time: str(it.time), place: str(it.place), d: d };
      (dayDiff(d) >= 0 ? up : old).push(row);
    });
    up.sort(function (a, b) { return (a.d - b.d) || (a.time < b.time ? -1 : a.time > b.time ? 1 : 0); });
    old.sort(function (a, b) { return b.d - a.d; });
    if (!up.length) {
      list.appendChild(el("p", "empty", (!shared.db || loaded.dates) ? "Belum ada rencana. Mulai dari satu hal kecil, misalnya makan berdua." : "Memuat rencana…"));
    }
    up.forEach(function (r) { list.appendChild(dateCard(r, false)); });
    old.forEach(function (r) { past.appendChild(dateCard(r, true)); });
    $("dPastWrap").hidden = !old.length;
    set("dPastN", old.length);
  }

  function renderWish(items) {
    var list = $("wList");
    list.textContent = "";
    var rows = [];
    items.forEach(function (it) {
      var title = str(it.title).trim();
      if (!title) return;
      rows.push({ id: it.id, title: title, kind: str(it.kind), by: it.by === "kamu" ? "kamu" : "aku", done: it.done === true, created: typeof it.created === "number" ? it.created : 0 });
    });
    rows.sort(function (a, b) { return ((a.done ? 1 : 0) - (b.done ? 1 : 0)) || (a.created - b.created); });
    var n = 0;
    rows.forEach(function (r) { if (r.done) n += 1; });
    set("wCount", rows.length ? n + " dari " + rows.length + " kesampaian" : "");
    $("wDone").hidden = !(rows.length && n === rows.length);
    if (!rows.length) {
      list.appendChild(el("p", "empty", (!shared.db || loaded.wishlist) ? "Belum ada isinya. Tulis satu hal yang ingin kamu lakukan bersamaku." : "Memuat wishlist…"));
    }
    rows.forEach(function (r) {
      var row = el("div", "witem" + (r.done ? " done" : ""));
      var cb = el("input");
      cb.type = "checkbox";
      cb.checked = r.done;
      cb.disabled = !shared.canWrite;
      cb.setAttribute("aria-label", "Sudah kesampaian: " + r.title);
      cb.addEventListener("change", function () {
        var want = cb.checked;
        cb.disabled = true;
        write(function () { return shared.db.doc("wishlist/" + r.id).update({ done: want }); }, "wStatus", "").then(function (ok) {
          if (!ok) { cb.checked = !want; cb.disabled = !shared.canWrite; }
        });
      });
      var mid = el("div");
      mid.appendChild(el("div", "wt", r.title));
      mid.appendChild(el("div", "wm", (r.kind ? r.kind + " · " : "") + "dari " + r.by));
      var del = el("button", "mini", "Hapus");
      del.type = "button";
      del.disabled = !shared.canWrite;
      armDelete(del, function () {
        write(function () { return shared.db.doc("wishlist/" + r.id).delete(); }, "wStatus", "Dihapus dari wishlist.");
      });
      row.appendChild(cb); row.appendChild(mid); row.appendChild(del);
      list.appendChild(row);
    });
  }

  function listen(coll, render, noteId) {
    var timer = setTimeout(function () {
      if (!loaded[coll]) set(noteId, "Belum tersambung ke penyimpanan. Daftar mungkin belum yang terbaru.");
    }, 10000);
    shared.db.collection(coll).onSnapshot(function (snap) {
      if (!snap.metadata.fromCache) { loaded[coll] = true; clearTimeout(timer); set(noteId, ""); }
      var items = snap.docs.map(function (d) {
        var o = { id: d.id }, x = d.data() || {};
        Object.keys(x).forEach(function (k) { o[k] = x[k]; });
        return o;
      });
      render(items);
    }, function () {
      clearTimeout(timer);
      set(noteId, "Daftar tidak bisa dibuka sekarang.");
    });
  }

  function chipsFill(boxId, inputId) {
    document.querySelectorAll("#" + boxId + " .chip").forEach(function (c) {
      c.addEventListener("click", function () {
        var inp = $(inputId);
        inp.value = c.textContent;
        inp.focus();
      });
    });
  }
  chipsFill("dChips", "dTitle");
  chipsFill("wChips", "wTitle");

  $("dForm").addEventListener("submit", async function (ev) {
    ev.preventDefault();
    if (!shared.db || !shared.canWrite) return;
    var title = $("dTitle").value.trim(), date = $("dDate").value;
    if (!title) { set("dStatus", "Tulis dulu mau ngapain."); $("dTitle").focus(); return; }
    if (!parseYMD(date)) { set("dStatus", "Pilih tanggalnya dulu."); $("dDate").focus(); return; }
    var btn = $("dAdd");
    btn.disabled = true;
    var ok = await write(function () {
      return shared.db.collection("dates").add({ title: title.slice(0, 80), date: date, time: $("dTime").value || "", place: $("dPlace").value.trim().slice(0, 80), created: Date.now() });
    }, "dStatus", "Jadwal tersimpan.");
    btn.disabled = false;
    if (ok) { $("dTitle").value = ""; $("dPlace").value = ""; $("dTime").value = ""; }
  });

  $("wForm").addEventListener("submit", async function (ev) {
    ev.preventDefault();
    if (!shared.db || !shared.canWrite) return;
    var title = $("wTitle").value.trim();
    if (!title) { set("wStatus", "Tulis dulu yang diinginkan."); $("wTitle").focus(); return; }
    var by = document.querySelector('input[name="wBy"]:checked');
    var btn = $("wAdd");
    btn.disabled = true;
    var ok = await write(function () {
      return shared.db.collection("wishlist").add({ title: title.slice(0, 80), kind: $("wKind").value, by: by && by.value === "kamu" ? "kamu" : "aku", done: false, created: Date.now() });
    }, "wStatus", "Masuk ke wishlist.");
    btn.disabled = false;
    if (ok) $("wTitle").value = "";
  });

  /* Penyimpanan bersama lewat Supabase (REST). Hanya memakai fetch, tanpa library. */
  function makeRestDb(base, key) {
    var api = base.replace(/\/+$/, "") + "/rest/v1/items";
    var head = { "apikey": key, "Content-Type": "application/json" };
    // Kunci lama (anon) berbentuk JWT dan boleh dikirim juga sebagai Bearer. Kunci publishable tidak.
    if (/^eyJ/.test(key)) head["Authorization"] = "Bearer " + key;
    var cache = {}, subs = {};

    function fail(status) {
      var e = new Error("http " + status);
      e.code = (status === 401 || status === 403) ? "invalid_argument" : "unavailable";
      return e;
    }
    function call(method, qs, body) {
      return fetch(api + qs, { method: method, headers: head, body: body ? JSON.stringify(body) : undefined })
        .then(function (r) {
          if (!r.ok) throw fail(r.status);
          return r.text();
        });
    }
    function fetchColl(coll) {
      return call("GET", "?coll=eq." + encodeURIComponent(coll) + "&select=id,data&order=created_at.asc").then(function (txt) {
        cache[coll] = txt ? JSON.parse(txt) : [];
      });
    }
    function push(coll) {
      var rows = cache[coll] || [];
      var snap = {
        metadata: { fromCache: false },
        docs: rows.map(function (r) { return { id: r.id, data: function () { return r.data; } }; })
      };
      (subs[coll] || []).forEach(function (s) { s.next(snap); });
    }
    function refresh(coll) { return fetchColl(coll).then(function () { push(coll); }); }
    function afterWrite(coll, p) {
      return p.then(function () { return refresh(coll).catch(function () {}); });
    }

    return {
      collection: function (coll) {
        return {
          add: function (data) { return afterWrite(coll, call("POST", "", { coll: coll, data: data })); },
          onSnapshot: function (next, error) {
            var sub = { next: next }, dead = false;
            (subs[coll] = subs[coll] || []).push(sub);
            fetchColl(coll).then(function () { if (!dead) push(coll); }, function (e) { if (error) error(e); });
            // Cek perubahan dari pasangan Anda tiap 15 detik selama halaman terbuka.
            var t = setInterval(function () { if (!document.hidden) refresh(coll).catch(function () {}); }, 15000);
            return function () {
              dead = true;
              clearInterval(t);
              subs[coll] = subs[coll].filter(function (x) { return x !== sub; });
            };
          }
        };
      },
      doc: function (path) {
        var parts = path.split("/"), coll = parts[0], id = parts[1];
        return {
          update: function (patch) {
            var row = (cache[coll] || []).filter(function (r) { return r.id === id; })[0];
            var merged = Object.assign({}, row ? row.data : {}, patch);
            return afterWrite(coll, call("PATCH", "?id=eq." + encodeURIComponent(id), { data: merged }));
          },
          delete: function () {
            return afterWrite(coll, call("DELETE", "?id=eq." + encodeURIComponent(id)));
          }
        };
      }
    };
  }

  function noDb() {
    var msg = "Bagian ini belum disambungkan ke penyimpanan. Isi alamat dan kunci Supabase di config.js (langkahnya ada di PANDUAN.md).";
    set("dNote", msg); set("wNote", msg);
    $("dNote").hidden = false; $("wNote").hidden = false;
    renderDates([]); renderWish([]);
  }
  (async function () {
    var cfg = window.APP_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseKey) { noDb(); return; }
    shared.db = makeRestDb(cfg.supabaseUrl, cfg.supabaseKey);
    shared.canWrite = true;
    setEnabled(true);
    listen("dates", renderDates, "dLoad");
    listen("wishlist", renderWish, "wLoad");
  })();

  /* ---------- Tombol hati ---------- */
  var msgs = [
    "Aku tahu. Aku juga sayang kamu.",
    "Dua kali? Berarti sayangku lebih banyak.",
    "Kamu tidak akan menang dari aku.",
    "Terus tekan. Aku tidak keberatan.",
    "Baiklah, kita seri."
  ];
  var count = 0, burst = $("burst"), heart = "♥︎";
  $("hb").addEventListener("click", function () {
    count += 1;
    set("hmsg", msgs[(count - 1) % msgs.length] + (count > 1 ? "  (" + count + "×)" : ""));
    if (reduce) return;
    for (var i = 0; i < 14; i++) {
      var h = document.createElement("span");
      h.className = "h";
      h.textContent = heart;
      var ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      var dist = 70 + Math.random() * 70;
      h.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      h.style.setProperty("--dy", Math.sin(ang) * dist - 30 + "px");
      h.style.setProperty("--r", (Math.random() * 60 - 30) + "deg");
      h.style.setProperty("--s", (14 + Math.random() * 16) + "px");
      h.addEventListener("animationend", function (ev) {
        if (ev.target.parentNode) ev.target.parentNode.removeChild(ev.target);
      });
      burst.appendChild(h);
    }
  });
})();
