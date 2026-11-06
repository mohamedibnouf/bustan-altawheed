// بُستان التوحيد — بلا تسجيل دخول، التقدم يُحفظ في جهاز الطفل
const $ = (s, r = document) => r.querySelector(s);
const app = $("#app");
const AR = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

// ---------- الحالة ----------
const KEY = "bustan-v1";
let S = { stars: 0, lessons: {}, surahs: {}, games: 0, duas: 0 };
try { S = { ...S, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
const treeCount = () => Object.keys(S.lessons).length + Object.keys(S.surahs).length;

function addStars(n) {
  S.stars += n; save(); renderStats();
  $("#stars").parentElement.classList.remove("bump");
  void $("#stars").offsetWidth;
  $("#stars").parentElement.classList.add("bump");
}
// ---------- الهوية: ولد / بنت ----------
const logo = () => (S.theme === "girl" ? "logo-girl.svg" : "logo.svg");
const mascot = () => (S.theme === "girl" ? "🦋" : "🦉");
const hero = () => (S.theme === "girl" ? "يا بطلة" : "يا بطل");
function applyTheme() {
  document.body.classList.toggle("girl", S.theme === "girl");
  $("#who").textContent = S.theme === "girl" ? "👧" : "👦";
  $(".brand .logo").src = logo();
  $('link[rel="icon"]').href = logo();
}
function pickTheme(first) {
  modal(`<div class="big">${first ? "👋" : "🎨"}</div><h2>${first ? "أهلًا بك في بستان التوحيد!" : "اختر هويتك"}</h2><p>هل أنت...</p>
    <div class="pick"><button class="b" data-t="boy"><i>👦</i>ولد</button><button class="g" data-t="girl"><i>👧</i>بنت</button></div>`);
  $("#modalBox").querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => {
    S.theme = b.dataset.t; save(); applyTheme(); closeModal(); sfx.ok(); route();
    toast(S.theme === "girl" ? "أهلًا يا بطلة! 🌸" : "أهلًا يا بطل! 🌟");
  }));
}
$("#who").onclick = () => { sfx.tap(); pickTheme(false); };

function renderStats() { $("#stars").textContent = AR(S.stars); $("#trees").textContent = AR(treeCount()); }

// ---------- أصوات ----------
let ac;
function tone(freqs, dur = 0.12, type = "sine") {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * dur;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.8);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur * 2);
    });
  } catch {}
}
const sfx = {
  tap: () => tone([660], 0.05, "triangle"),
  ok: () => tone([523, 659, 784], 0.1),
  no: () => tone([300, 220], 0.15, "square"),
  win: () => tone([523, 659, 784, 1046, 784, 1046], 0.11),
};

// ---------- قصاصات الاحتفال ----------
const cv = $("#confetti"), cx = cv.getContext("2d");
let bits = [];
function confetti() {
  cv.width = innerWidth; cv.height = innerHeight;
  const cols = ["#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#a855f7", "#facc15"];
  for (let i = 0; i < 140; i++)
    bits.push({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - 0.5) * 16, vy: Math.random() * -14 - 4,
      s: Math.random() * 8 + 5, c: cols[i % cols.length], r: Math.random() * 6, life: 120 });
  if (bits.length === 140) requestAnimationFrame(tick);
}
function tick() {
  cx.clearRect(0, 0, cv.width, cv.height);
  bits.forEach((b) => { b.vy += 0.35; b.x += b.vx; b.y += b.vy; b.r += 0.1; b.life--;
    cx.save(); cx.translate(b.x, b.y); cx.rotate(b.r); cx.fillStyle = b.c; cx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); cx.restore(); });
  bits = bits.filter((b) => b.life > 0);
  if (bits.length) requestAnimationFrame(tick); else cx.clearRect(0, 0, cv.width, cv.height);
}

// ---------- نوافذ ----------
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("show"), 2600);
}
function modal(html) { $("#modalBox").innerHTML = html; $("#modal").classList.remove("hidden"); }
function closeModal() { $("#modal").classList.add("hidden"); }
$("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

const randDua = () => DUAS[Math.floor(Math.random() * DUAS.length)];
// نافذة الإنجاز مع تذكير بالدعاء للوالدين — عند كل إنجاز
function celebrate({ icon = "🏆", title, text, stars = 0, next }) {
  sfx.win(); confetti();
  modal(`<div class="big">${icon}</div><h2>${title}</h2>
    ${stars ? `<p style="font-size:22px">+${AR(stars)} ⭐</p>` : ""}
    ${text ? `<p>${text}</p>` : ""}
    <p style="margin-bottom:0">قبل أن تكمل... ادعُ معنا 🤲</p>
    <div class="dua">${randDua()}</div>
    <button class="btn gold" id="amen">آمين 🤲</button>`);
  $("#amen").onclick = () => { S.duas++; save(); closeModal(); toast("جزاك الله خيرًا 💚"); next && next(); };
}

// ---------- التنقل ----------
const routes = { home, lessons, lesson, quran, surah, games, memory, truefalse, garden };
function go(hash) { location.hash = hash; }
function route() {
  stopAudio();
  const [name, arg] = (location.hash.slice(1) || "home").split("/");
  (routes[name] || home)(arg);
  document.querySelectorAll(".tabs button").forEach((b) =>
    b.classList.toggle("act", name.startsWith(b.dataset.go) || (name === "lesson" && b.dataset.go === "lessons") || (name === "surah" && b.dataset.go === "quran") || (["memory","truefalse"].includes(name) && b.dataset.go === "games")));
  scrollTo({ top: 0, behavior: "smooth" });
}
document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-go]");
  if (g) { e.preventDefault(); sfx.tap(); go(g.dataset.go); }
});
addEventListener("hashchange", route);
const view = (html) => (app.innerHTML = `<div class="view">${html}</div>`);

// ---------- الرئيسية ----------
function home() {
  const done = Object.keys(S.lessons).length;
  const hi = [`أهلًا ${hero()}! 🌟`, "هيا نتعلم شيئًا جميلًا اليوم!", "كل نجمة تزرع شجرة في بستانك 🌳"][Math.floor(Math.random() * 3)];
  view(`
  <section class="hero">
    <img src="${logo()}" alt="شعار بستان التوحيد">
    <h1>بُستان التوحيد</h1>
    <p>نتعلّم توحيد الله بالدليل، ونحفظ جزء عمّ، ونزرع بستاننا!</p>
    <div><span class="mascot">${mascot()}</span><br><span class="speech">${hi}</span></div>
    <div style="margin-top:18px"><button class="btn gold" data-go="${done < LESSONS.length ? "lesson/" + (LESSONS.find((l) => !S.lessons[l.id]) || LESSONS[0]).id : "lessons"}">▶ ${done ? "أكمل رحلتك" : "ابدأ الرحلة"}</button></div>
  </section>
  ${installBox()}
  <div class="grid home-tiles">
    ${tile("lessons", "☝️", "#fef3c7", "دروس التوحيد", `${AR(done)} من ${AR(LESSONS.length)}`)}
    ${tile("quran", "📖", "#d1fae5", "جزء عمّ", `${AR(Object.keys(S.surahs).length)} سورة محفوظة`)}
    ${tile("games", "🎮", "#ede9fe", "ألعاب", "العب وتعلّم")}
    ${tile("garden", "🌳", "#dcfce7", "بستاني", `${AR(treeCount())} شجرة`)}
  </div>
  ${dedication()}`);
}
const tile = (go, ic, bg, t, p) => `<button class="card" data-go="${go}"><div class="ic" style="background:${bg}">${ic}</div><h3>${t}</h3><p>${p}</p></button>`;
const dedication = () => `<div class="dedic">
  <h3>🤍 صدقة جارية 🤍</h3>
  <p>هذا الموقع صدقة جارية عن</p>
  <p class="names">${DEDICATION.father} &nbsp;و&nbsp; ${DEDICATION.mother}</p>
  <p>رحمهما الله وغفر لهما — لا تنسَهما من دعائك</p>
  <button class="btn sm gold" id="duaBtn">🤲 ادعُ لهما الآن</button>
  <p class="ref" style="margin-top:8px">عدد الدعوات من هذا الجهاز: <b id="duaN">${AR(S.duas)}</b></p></div>`;
document.addEventListener("click", (e) => {
  if (e.target.id !== "duaBtn") return;
  modal(`<div class="big">🤲</div><div class="dua">${randDua()}</div><button class="btn gold" id="amen2">آمين</button>`);
  $("#amen2").onclick = () => { S.duas++; save(); closeModal(); sfx.ok(); toast("تقبّل الله دعاءك 💚"); const n = $("#duaN"); n && (n.textContent = AR(S.duas)); };
});

// ---------- الدروس ----------
function lessons() {
  view(`<h2 class="sec">☝️ دروس التوحيد</h2><p class="lead">كل درس فيه قصة، ودليل من القرآن والسنة، وأسئلة ممتعة</p>
  <div class="grid">${LESSONS.map((l, i) => {
    const locked = i > 0 && !S.lessons[LESSONS[i - 1].id] && !S.lessons[l.id];
    return `<button class="card ${locked ? "locked" : ""}" ${locked ? "data-locked" : `data-go="lesson/${l.id}"`} style="border-color:${S.lessons[l.id] ? l.color : "transparent"}">
      ${S.lessons[l.id] ? `<span class="done">${"⭐".repeat(S.lessons[l.id])}</span>` : locked ? `<span class="done">🔒</span>` : ""}
      <div class="ic" style="background:${l.color}22">${l.icon}</div><h3>${AR(l.id)}. ${l.title}</h3><p>${l.sub}</p></button>`;
  }).join("")}</div>`);
  app.querySelectorAll("[data-locked]").forEach((b) => (b.onclick = () => { sfx.no(); toast("🔒 أكمل الدرس السابق أولًا!"); }));
}

function lesson(id) {
  const L = LESSONS.find((l) => l.id == id); if (!L) return lessons();
  const steps = [...L.slides.map((s) => ({ k: "slide", ...s })), { k: "proof" }, ...L.quiz.map((q) => ({ k: "quiz", ...q }))];
  let i = 0, right = 0;
  const draw = () => {
    const st = steps[i];
    let body = "";
    if (st.k === "slide") body = `<div class="big">${st.e}</div><div class="txt">${st.t}</div>`;
    else if (st.k === "proof")
      body = `<h2 style="color:${L.color}">📜 الدليل</h2>${L.proofs.map((p) => `<div class="proof ${p.type}">
        <span class="tag">${p.type === "ayah" ? "قال الله تعالى" : "قال رسول الله ﷺ"}</span>
        <div class="ayah">${p.type === "ayah" ? "﴿" + p.text + "﴾" : p.text}</div><div class="ref">${p.ref}</div></div>`).join("")}
        <div class="src">📚 المرجع: ${L.source}</div>`;
    else body = `<div class="big">🧠</div><div class="q">${st.q}</div><div class="answers">${st.a.map((a, j) => `<button class="ans" data-j="${j}">${a}</button>`).join("")}</div>`;
    view(`<div class="lesson-top"><button class="btn ghost sm" data-go="lessons">✕</button>
      <div class="progress"><i style="width:${(i / steps.length) * 100}%"></i></div><b>${L.icon}</b></div>
      <div class="slide" style="border-top:10px solid ${L.color}">${body}</div>
      ${st.k !== "quiz" ? `<div class="nav-row"><button class="btn ghost" id="prev" ${i ? "" : "style=visibility:hidden"}>→ السابق</button><button class="btn" id="next" style="background:${L.color}">${st.k === "proof" ? "هيا نختبر! 🧠" : "التالي ←"}</button></div>` : ""}`);
    if (st.k === "quiz") {
      let tried = false;
      app.querySelectorAll(".ans").forEach((b) => (b.onclick = () => {
        if (+b.dataset.j === st.c) {
          b.classList.add("right"); sfx.ok(); if (!tried) right++;
          app.querySelectorAll(".ans").forEach((x) => (x.disabled = true));
          setTimeout(() => { i++; i < steps.length ? draw() : finish(); }, 900);
        } else { b.classList.add("wrong"); sfx.no(); tried = true; toast("حاول مرة أخرى 💪"); }
      }));
    } else {
      $("#next").onclick = () => { sfx.tap(); i++; draw(); };
      $("#prev").onclick = () => { sfx.tap(); i--; draw(); };
    }
  };
  const finish = () => {
    const stars = Math.max(1, right), prev = S.lessons[L.id] || 0;
    if (stars > prev) { addStars(stars - prev); S.lessons[L.id] = stars; save(); }
    renderStats();
    const nxt = LESSONS.find((l) => l.id === L.id + 1);
    celebrate({ icon: "🌳", title: `أحسنت! أنهيت «${L.title}»`, stars, text: `${"⭐".repeat(stars)}<br>زُرعت شجرة جديدة في بستانك!`,
      next: () => go(nxt ? "lesson/" + nxt.id : "garden") });
  };
  draw();
}

// ---------- جزء عمّ ----------
function quran() {
  view(`<h2 class="sec">📖 جزء عمّ</h2><p class="lead">اضغط على السورة، استمع للشيخ مشاري العفاسي، وكرّر حتى تحفظ</p>
  <div class="grid surahs">${[...JUZ_AMMA].reverse().map(([n, name, c], i) => {
    const col = ["#10b981", "#0ea5e9", "#a855f7", "#f59e0b", "#ec4899"][i % 5];
    return `<button class="card" data-go="surah/${n}" style="border-color:${S.surahs[n] ? col : "transparent"}">
      ${S.surahs[n] ? '<span class="done">🌟</span>' : ""}
      <div class="snum" style="background:${col}"><span>${AR(n)}</span></div><h3>${name}</h3><p>${AR(c)} آيات</p></button>`;
  }).join("")}</div>`);
}

let audio = new Audio(), playing = false;
function stopAudio() { playing = false; audio.pause(); }

async function getSurah(n) {
  const ck = "surah-" + n;
  try { const c = localStorage.getItem(ck); if (c) return JSON.parse(c); } catch {}
  const r = await fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,ar.alafasy`);
  const j = await r.json();
  const ayahs = j.data[0].ayahs.map((a, i) => {
    let t = a.text;
    if (i === 0 && n !== 1 && n !== 9) t = t.split(" ").slice(4).join(" "); // البسملة تُعرض منفصلة
    return { t, au: j.data[1].ayahs[i].audio };
  });
  try { localStorage.setItem(ck, JSON.stringify(ayahs)); } catch {}
  return ayahs;
}

async function surah(n) {
  n = +n; const meta = JUZ_AMMA.find((s) => s[0] === n); if (!meta) return quran();
  view(`<div class="loader">📖</div>`);
  let ay;
  try { ay = await getSurah(n); } catch {
    return view(`<div class="slide"><div class="big">📡</div><div class="txt">نحتاج اتصالًا بالإنترنت لتحميل السورة أول مرة</div><button class="btn" onclick="route()">حاول مجددًا</button></div>`);
  }
  if (location.hash !== "#surah/" + n) return;
  let cur = -1, repeat = 1, hide = false;
  view(`<div class="lesson-top"><button class="btn ghost sm" data-go="quran">✕</button><h2 style="margin:0;flex:1;text-align:center">سورة ${meta[1]}</h2></div>
  <div class="controls">
    <button class="btn" id="play">▶ استمع</button>
    <button class="btn ghost toggle" id="rep">🔁 كرّر كل آية: ١</button>
    <button class="btn ghost toggle" id="hid">🙈 اختبر حفظي</button>
  </div>
  <div class="mushaf"><div class="sname">سورة ${meta[1]}</div>
    <div class="basmala">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
    <div class="verses">${ay.map((a, i) => `<span class="v" data-i="${i}"><span class="vt">${a.t}</span><span class="vn">${AR(i + 1)}</span></span> `).join("")}</div>
  </div>
  <p class="lead" style="margin-top:12px">💡 اضغط على أي آية لتسمعها وحدها${hide ? "" : "، وفي وضع «اختبر حفظي» اضغط لتكشفها"}</p>
  <div style="text-align:center"><button class="btn gold" id="memo">${S.surahs[n] ? "🌟 محفوظة — راجعها" : "✅ حفظتُ السورة!"}</button></div>`);

  const vs = [...app.querySelectorAll(".v")];
  const mark = () => vs.forEach((v, i) => v.classList.toggle("on", i === cur));
  const playOne = (i, times, cont) => {
    cur = i; mark(); vs[i].scrollIntoView({ block: "center", behavior: "smooth" });
    vs[i].classList.remove("hide");
    let left = times;
    audio.src = ay[i].au; audio.play().catch(() => {});
    audio.onended = () => {
      if (!playing) return;
      if (--left > 0) return audio.play();
      if (hide) vs[i].classList.add("hide");
      if (cont && i + 1 < ay.length) playOne(i + 1, times, true);
      else { playing = false; cur = -1; mark(); $("#play").textContent = "▶ استمع"; }
    };
  };
  $("#play").onclick = () => {
    if (playing) { stopAudio(); $("#play").textContent = "▶ استمع"; return; }
    playing = true; $("#play").textContent = "⏸ إيقاف"; playOne(cur < 0 ? 0 : cur, repeat, true);
  };
  $("#rep").onclick = (e) => { repeat = repeat >= 5 ? 1 : repeat + (repeat === 1 ? 2 : 2); e.target.textContent = `🔁 كرّر كل آية: ${AR(repeat)}`; e.target.classList.toggle("on", repeat > 1); };
  $("#hid").onclick = (e) => { hide = !hide; e.target.classList.toggle("on", hide); vs.forEach((v) => v.classList.toggle("hide", hide)); };
  vs.forEach((v, i) => (v.onclick = () => {
    if (v.classList.contains("hide")) { v.classList.remove("hide"); sfx.tap(); return; }
    playing = true; $("#play").textContent = "⏸ إيقاف"; playOne(i, repeat, false);
  }));
  $("#memo").onclick = () => {
    stopAudio();
    if (S.surahs[n]) return toast("ما شاء الله! استمر في المراجعة 🌟");
    S.surahs[n] = Date.now(); save(); addStars(5);
    celebrate({ icon: "📖", title: `بارك الله فيك! حفظت سورة ${meta[1]}`, stars: 5, text: "قال ﷺ: «خيركم من تعلّم القرآن وعلّمه» [رواه البخاري]", next: () => go("quran") });
  };
}

// ---------- الألعاب ----------
function games() {
  view(`<h2 class="sec">🎮 ألعاب التوحيد</h2><p class="lead">العب واجمع النجوم</p>
  <div class="grid home-tiles">
    ${tile("memory", "🃏", "#ede9fe", "لعبة الذاكرة", "طابق اسم الله بمعناه")}
    ${tile("truefalse", "✅", "#dcfce7", "صح أم خطأ؟", "مع الدليل")}
  </div>`);
}

function memory() {
  const pick = [...NAMES].sort(() => Math.random() - 0.5).slice(0, 6);
  const cards = pick.flatMap((x, k) => [{ k, s: `<div><div style="font-size:26px">${x.e}</div>${x.n}</div>` }, { k, s: x.m }]).sort(() => Math.random() - 0.5);
  let open = [], got = 0, moves = 0, lock = false;
  view(`<div class="lesson-top"><button class="btn ghost sm" data-go="games">✕</button><h2 style="margin:0;flex:1;text-align:center">🃏 طابق الاسم بمعناه</h2><b id="mv">٠</b></div>
  <div class="memory">${cards.map((c, i) => `<button class="mc" data-i="${i}"><div class="in"><div class="f">✨</div><div class="b">${c.s}</div></div></button>`).join("")}</div>
  <p class="src" style="text-align:center">📚 المعاني مبسّطة من تفسير السعدي — ﴿وَلِلَّهِ ٱلْأَسْمَآءُ ٱلْحُسْنَىٰ فَٱدْعُوهُ بِهَا﴾</p>`);
  const els = [...app.querySelectorAll(".mc")];
  els.forEach((el, i) => (el.onclick = () => {
    if (lock || el.classList.contains("open") || el.classList.contains("got")) return;
    sfx.tap(); el.classList.add("open"); open.push(i);
    if (open.length < 2) return;
    moves++; $("#mv").textContent = AR(moves); lock = true;
    const [a, b] = open;
    if (cards[a].k === cards[b].k) {
      setTimeout(() => { els[a].classList.add("got"); els[b].classList.add("got"); sfx.ok(); open = []; lock = false;
        toast(`${pick[cards[a].k].n}: ${pick[cards[a].k].m}`);
        if (++got === pick.length) { S.games++; addStars(3); save(); celebrate({ icon: "🃏", title: "رائع! طابقت كل الأسماء", stars: 3, text: `في ${AR(moves)} محاولة`, next: () => go("games") }); }
      }, 500);
    } else setTimeout(() => { els[a].classList.remove("open"); els[b].classList.remove("open"); sfx.no(); open = []; lock = false; }, 950);
  }));
}

function truefalse() {
  const qs = [...TRUE_FALSE].sort(() => Math.random() - 0.5).slice(0, 6);
  let i = 0, score = 0;
  const draw = () => {
    const q = qs[i];
    view(`<div class="lesson-top"><button class="btn ghost sm" data-go="games">✕</button><div class="progress"><i style="width:${(i / qs.length) * 100}%"></i></div><b>${AR(score)}⭐</b></div>
    <div class="slide"><div class="big">🤔</div><div class="q">${q.s}</div>
    <div class="tf"><button class="btn" data-v="1">✔️ صح</button><button class="btn" style="background:#ef4444;box-shadow:0 6px 0 #991b1b" data-v="0">✖️ خطأ</button></div><div id="why"></div></div>`);
    app.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => {
      const ok = (b.dataset.v === "1") === q.t;
      ok ? (sfx.ok(), score++) : sfx.no();
      app.querySelectorAll("[data-v]").forEach((x) => (x.disabled = true));
      $("#why").innerHTML = `<div class="proof ${ok ? "" : "hadith"}"><span class="tag">${ok ? "إجابة صحيحة 🎉" : "الجواب: " + (q.t ? "صح" : "خطأ")}</span><div class="ayah" style="font-size:24px">${q.why}</div></div>
        <button class="btn" id="nx">التالي ←</button>`;
      $("#nx").onclick = () => { i++; i < qs.length ? draw() : (S.games++, addStars(score), save(),
        celebrate({ icon: "✅", title: `أجبت ${AR(score)} من ${AR(qs.length)}`, stars: score, next: () => go("games") })); };
    }));
  };
  draw();
}

// ---------- بستاني ----------
function garden() {
  const plants = ["🌳", "🌲", "🌴", "🌻", "🌷", "🌸", "🌺", "🍎"];
  const lt = Object.keys(S.lessons).length, st = Object.keys(S.surahs).length;
  const items = [...Array(lt)].map((_, i) => plants[i % 4]).concat([...Array(st)].map((_, i) => plants[4 + (i % 4)]));
  const badges = [
    ["🌱", "أول خطوة", lt >= 1], ["☝️", "الموحّد الصغير", lt >= 5], ["👑", "بطل التوحيد", lt >= LESSONS.length],
    ["📖", "حافظ أول سورة", st >= 1], ["📚", "حافظ ١٠ سور", st >= 10], ["🏅", "حافظ جزء عمّ", st >= JUZ_AMMA.length],
    ["⭐", "٥٠ نجمة", S.stars >= 50], ["🎮", "لاعب ماهر", S.games >= 5], ["🤲", "بارّ بالدعاء", S.duas >= 10],
  ];
  view(`<h2 class="sec">🌳 بستاني</h2><p class="lead">كل درس تنهيه يزرع شجرة، وكل سورة تحفظها تزرع زهرة!</p>
  <div class="garden"><span class="sun">🌞</span>${items.length ? items.map((p, i) => `<span class="plant" style="animation-delay:${i * 0.08}s">${p}</span>`).join("") : `<p style="font-size:22px;font-weight:800;color:#065f46;margin:auto">🌱 بستانك ينتظر أول شجرة!</p>`}</div>
  <h2 class="sec" style="margin-top:20px">🏅 أوسمتي</h2>
  <div class="badges">${badges.map(([i, t, on]) => `<div class="badge ${on ? "" : "off"}"><i>${i}</i><b>${t}</b></div>`).join("")}</div>
  ${dedication()}
  <div class="refs"><h3>📚 مراجعنا العلمية (للوالدين والمعلمين)</h3>
    <p class="ref">كل معلومة في الموقع مقرونة بدليلها من القرآن الكريم أو السنة الصحيحة، ومأخوذة من كتب علماء أهل السنة المعتمدة:</p>
    <ul>${REFERENCES.aqeedah.map(([a, b]) => `<li><b>${a}</b> — ${b}</li>`).join("")}</ul>
    <h3>🧠 طرق التعليم المستخدمة</h3>
    <ul>${REFERENCES.pedagogy.map(([a, b]) => `<li><b>${a}</b> — ${b}</li>`).join("")}</ul>
    <p class="ref">نص القرآن: الرسم العثماني عبر AlQuran.cloud — التلاوة: الشيخ مشاري راشد العفاسي.</p>
    <button class="btn ghost sm" id="reset">🔄 البدء من جديد</button>
  </div>`);
  $("#reset").onclick = () => { if (confirm("هل تريد مسح كل التقدم؟")) { const d = S.duas; S = { stars: 0, lessons: {}, surahs: {}, games: 0, duas: d, theme: S.theme }; save(); renderStats(); garden(); } };
}

// ---------- التثبيت كتطبيق ----------
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
let installEvt = null;
const installed = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; const b = $("#installBox"); b && (b.hidden = false); });
addEventListener("appinstalled", () => { installEvt = null; toast("تم تثبيت التطبيق 🎉"); const b = $("#installBox"); b && (b.hidden = true); });
const installBox = () => installed() ? "" : `<div class="install" id="installBox">
  <img src="icons/icon-192.png" alt=""><div><b>ثبّت «بستان التوحيد» على جوالك</b><small>يفتح مثل التطبيق بضغطة واحدة</small></div>
  <button class="btn sm" id="installBtn">📲 ثبّت</button></div>`;
document.addEventListener("click", async (e) => {
  if (!e.target.closest("#installBtn")) return;
  if (installEvt) { installEvt.prompt(); await installEvt.userChoice; installEvt = null; return; }
  modal(isIOS
    ? `<div class="big">📲</div><h2>التثبيت على الآيفون والآيباد</h2>
       <ol class="steps"><li>افتح الموقع في متصفح <b>سفاري</b></li><li>اضغط زر المشاركة <b>⬆️</b> أسفل الشاشة</li>
       <li>اختر <b>«إضافة إلى الشاشة الرئيسية»</b> ➕</li><li>اضغط <b>«إضافة»</b> — وسيظهر التطبيق بجانب تطبيقاتك 🎉</li></ol>
       <button class="btn" onclick="closeModal()">فهمت</button>`
    : `<div class="big">📲</div><h2>طريقة التثبيت</h2>
       <ol class="steps"><li>افتح قائمة المتصفح <b>⋮</b> (أعلى الشاشة)</li><li>اختر <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b></li>
       <li>اضغط <b>«تثبيت»</b> — وسيظهر التطبيق بجانب تطبيقاتك 🎉</li></ol>
       <p class="ref">على الكمبيوتر: اضغط أيقونة التثبيت ⊕ في شريط العنوان</p>
       <button class="btn" onclick="closeModal()">فهمت</button>`);
});

applyTheme();
renderStats();
route();
if (!S.theme) pickTheme(true);
