/* =========================================================
   휴대폰 동작 코드 — 내용은 data.js 에서 고치고, 이 파일은 보통 건드리지 않아도 됩니다.
   테스트 팁: 주소 뒤에 ?speed=10 을 붙이면 timeline 이 10배 빨리 진행됩니다.
   ========================================================= */
(() => {
"use strict";

const S = window.STORY || {};
const CFG = S.settings || {};
const SPEED = Math.max(0.1, Number(new URLSearchParams(location.search).get("speed")) || 1);

/* ---------- 도우미 ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const br = s => esc(s).replace(/\n/g, "<br>");
const toEl = str => { const t = document.createElement("template"); t.innerHTML = str.trim(); return t.content.firstElementChild; };
const pad = n => String(n).padStart(2, "0");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const digits = s => String(s || "").replace(/\D/g, "");

/* ---------- 휴대폰 속 시계 ---------- */
const T0_PHONE = new Date(`${CFG.date || "2027-03-13"}T${CFG.time || "00:00:00"}`).getTime();
const T0_REAL = Date.now();
const now = () => new Date(T0_PHONE + (Date.now() - T0_REAL));
const DAYS = "일월화수목금토";
const clock12 = d => `${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`;
const ampm = d => `${d.getHours() < 12 ? "오전" : "오후"} ${clock12(d)}`;
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dateLabel = d => `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`;
const fmtTime = t => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || ""));
  if (!m) return t || "";
  const H = +m[1];
  return `${H < 12 ? "오전" : "오후"} ${H % 12 || 12}:${m[2]}`;
};
const durText = ms => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}분 ${s % 60}초`; };
const formatNum = n => {
  const d = digits(n);
  if (/^02/.test(d)) return d.replace(/^(02)(\d{3,4})(\d{4})$/, "$1-$2-$3");
  return d.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
};

/* ---------- 아이콘 ---------- */
const ICON = {
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  talk: '<path d="M21 11.5c0 4.4-4 8-9 8-1.3 0-2.6-.2-3.7-.7L3 20.5l1.6-4.2A7.6 7.6 0 0 1 3 11.5c0-4.4 4-8 9-8s9 3.6 9 8z"/>',
  sms: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  news: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/>',
  school: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3.5 2.5 8.5 2.5 12 0v-5"/><path d="M22 9v6"/>',
  map: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  gallery: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M21 15.5l-5-5-9.5 9.5"/>',
  memo: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9.5 12h6M9.5 16h6"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  alert: '<path d="M12 3.5l9.5 17h-19z"/><path d="M12 10v4.5M12 17.6v.1"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6z"/>',
  del: '<path d="M9 5h11v14H9l-6-7z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  group: '<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5M15.5 14.5c3 0 5.5 1.6 5.5 4.5"/>'
};
const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[name] || ""}</svg>`;
const BACK = `<button class="back" aria-label="뒤로">${svg("back")}</button>`;

/* ---------- 앱 목록 ---------- */
const APPS = {
  phone:    { name: "전화",   icon: "phone",    bg: "linear-gradient(160deg,#4cd964,#1f9d47)", open: () => phoneApp("recent") },
  talk:     { name: "톡",     icon: "talk",     bg: "linear-gradient(160deg,#8b6dff,#5a3be0)", open: () => chatList("talk") },
  sms:      { name: "메시지", icon: "sms",      bg: "linear-gradient(160deg,#5b9bff,#2d63e0)", open: () => chatList("sms") },
  news:     { name: (S.news && S.news.portal) || "뉴스", icon: "news", bg: "linear-gradient(160deg,#ff7b5c,#e5482b)", open: () => newsHome() },
  school:   { name: "학교",   icon: "school",   bg: "linear-gradient(160deg,#2c5291,#142748)", open: () => schoolHome() },
  map:      { name: "지도",   icon: "map",      bg: "linear-gradient(160deg,#22c3b3,#0e8c80)", open: () => mapApp() },
  gallery:  { name: "갤러리", icon: "gallery",  bg: "linear-gradient(160deg,#f783ac,#d6336c)", open: () => galleryHome() },
  memo:     { name: "메모",   icon: "memo",     bg: "linear-gradient(160deg,#ffd43b,#f59f00)", open: () => memoList() },
  camera:   { name: "카메라", icon: "camera",   bg: "linear-gradient(160deg,#6b7280,#3b4048)" },
  clock:    { name: "시계",   icon: "clock",    bg: "linear-gradient(160deg,#3a3d45,#0f1013)" },
  settings: { name: "설정",   icon: "settings", bg: "linear-gradient(160deg,#9aa1ad,#6b7280)" },
  alert:    { name: "긴급재난문자", icon: "alert", bg: "linear-gradient(160deg,#ff6b6b,#d9363e)" }
};
const appName = id => (S.appNames && S.appNames[id]) || (APPS[id] && APPS[id].name) || id;

/* ---------- 아바타 ---------- */
const COLORS = ["#f08c6c", "#6c9ef0", "#62b67a", "#b48cf0", "#e9a94f", "#4fb5ae", "#e87a9a", "#8a94a8"];
const colorOf = s => { let x = 7; for (const ch of String(s)) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return COLORS[x % COLORS.length]; };
const initialOf = s => (String(s).replace(/[([].*$/, "").trim() || "?").charAt(0);
const avatar = (name, cls = "") => `<span class="av ${cls}" style="background:${colorOf(name)}">${esc(initialOf(name))}</span>`;
const iconAv = (icon, bg, cls = "") => `<span class="av ${cls}" style="background:${bg}">${svg(icon)}</span>`;

/* =========================================================
   상태
   ========================================================= */
const chats = [...(S.chats || []), ...(S.sms || [])].map((c, i) => ({
  app: "talk", replies: [], ...c,
  messages: (c.messages || []).map(m => ({ ...m, read: !c.neverRead })),
  unread: c.unread || 0, sent: 0, rank: i, typing: false
}));
const chatById = id => chats.find(c => c.id === id);

const st = {
  battery: CFG.battery ?? 80,
  signal: CFG.signal ?? 4,
  net: CFG.network ?? "LTE",
  down: false,
  calls: (S.calls || []).map(c => ({ ...c })),
  missedNew: (S.calls || []).filter(c => c.dir === "missed").length,
  articles: ((S.news && S.news.articles) || []).map(a => ({ ...a })),
  trending: [...((S.news && S.news.trending) || [])],
  notices: ((S.school && S.school.notices) || []).map(n => ({ ...n })),
  newNews: 0, newNotices: 0,
  lockNotis: [],
  locked: true, started: false, off: false,
  inCall: false, callEndedAt: 0, callCount: {}, rankSeq: 0,
  nextDrain: 0, stopSiren: null
};

/* =========================================================
   소리 · 진동
   ========================================================= */
let AC = null;
function ac() {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
  } catch (e) { AC = null; }
  return AC;
}
function beep(freq, dur, { type = "sine", vol = 0.1, at = 0 } = {}) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.setValueAtTime(vol, t + Math.max(0.02, dur - 0.03));
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
const ding = () => { beep(1046, 0.12, { vol: 0.08 }); beep(1568, 0.2, { vol: 0.06, at: 0.12 }); };
const softDing = () => beep(1318, 0.08, { vol: 0.04 });
const keyTone = () => beep(700 + Math.random() * 600, 0.08, { vol: 0.04 });
const errTone = () => [950, 1400, 1800].forEach((f, i) => beep(f, 0.28, { type: "square", vol: 0.03, at: i * 0.33 }));
const hangupTone = () => [0, 0.25, 0.5].forEach(at => beep(480, 0.15, { vol: 0.05, at }));
function loopSound(fn, period) { fn(); const id = setInterval(fn, period); return () => clearInterval(id); }
const ringback = () => loopSound(() => { beep(440, 1, { vol: 0.05 }); beep(480, 1, { vol: 0.035 }); }, 3000);
const ringtone = () => loopSound(() => {
  [0, 0.18, 0.36, 0.54, 0.9, 1.08, 1.26, 1.44].forEach((at, i) => beep(i % 2 ? 1175 : 1568, 0.15, { type: "triangle", vol: 0.07, at }));
  vibrate([400, 200, 400]);
}, 2600);
function siren(sec) {
  const a = ac(); if (!a || !sec) return () => {};
  const t = a.currentTime, g = a.createGain(), o1 = a.createOscillator(), o2 = a.createOscillator();
  o1.type = "sawtooth"; o2.type = "square";
  for (let i = 0; i < sec * 2; i++) {
    o1.frequency.setValueAtTime(i % 2 ? 960 : 1280, t + i * 0.5);
    o2.frequency.setValueAtTime(i % 2 ? 480 : 640, t + i * 0.5);
  }
  g.gain.setValueAtTime(0.05, t); g.gain.setValueAtTime(0.05, t + sec - 0.1); g.gain.linearRampToValueAtTime(0, t + sec);
  o1.connect(g); o2.connect(g); g.connect(a.destination);
  o1.start(t); o2.start(t); o1.stop(t + sec); o2.stop(t + sec);
  return () => { try { g.gain.cancelScheduledValues(a.currentTime); g.gain.setValueAtTime(0, a.currentTime); o1.stop(); o2.stop(); } catch (e) {} };
}
const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

/* =========================================================
   화면 쌓기 (뷰 스택)
   ========================================================= */
const viewsEl = $("#views"), sbEl = $("#statusbar"), navEl = $("#navbar"), bannerEl = $("#banner"),
      overlayEl = $("#overlay"), toastEl = $("#toast"), screenEl = $("#screen"), device = $("#device");
const stack = [];
const top = () => stack[stack.length - 1];

/* opt.light: 밝은 앱(상태표시줄 글자가 검정) · opt.sbBg: 상태표시줄 뒤 색 */
function makeView(cls, inner, opt = {}) {
  const el = toEl(`<div class="view ${cls}">${inner}</div>`);
  if (opt.light) { el.style.setProperty("--sb-bg", opt.sbBg || "#fff"); el.style.setProperty("--nav-bg", "#fff"); }
  else if (opt.sbBg) el.style.setProperty("--sb-bg", opt.sbBg);
  if (opt.navBg) el.style.setProperty("--nav-bg", opt.navBg);
  return el;
}
function push(entry) { viewsEl.appendChild(entry.el); stack.push(entry); chrome(); if (stack.length > 1) arm(); return entry; }
function removeEntry(entry, animate = true) {
  const i = stack.indexOf(entry); if (i < 0) return;
  stack.splice(i, 1);
  entry.onClose && entry.onClose();
  if (animate) { entry.el.classList.add("pop-out"); setTimeout(() => entry.el.remove(), 200); }
  else entry.el.remove();
  const t = top(); t && t.refresh && t.refresh();
  chrome();
}
const pop = () => { if (stack.length > 1) removeEntry(top()); };
function popTo(pred) {
  while (stack.length > 1 && !pred(top())) removeEntry(top(), false);
}
function setRoot(entry) {
  stack.splice(0).forEach(e => { e.onClose && e.onClose(); e.el.remove(); });
  entry.el.classList.add("fade");
  return push(entry);
}
function chrome() {
  const t = top() || {};
  sbEl.classList.toggle("dark", !!t.light && !t.sbWhite);
  navEl.classList.toggle("dark", !!t.light || !!t.navDark);
  navEl.classList.toggle("hide", !!t.noNav);
  renderStatus();
}
function update() { stack.forEach(e => e.refresh && e.refresh()); renderStatus(); }

/* ---------- 상태표시줄 ---------- */
function appBadge(id) {
  if (id === "talk" || id === "sms") return chats.filter(c => c.app === id).reduce((s, c) => s + c.unread, 0);
  if (id === "phone") return st.missedNew;
  if (id === "news") return st.newNews;
  if (id === "school") return st.newNotices;
  return 0;
}
function renderStatus() {
  const d = now();
  const icons = ["talk", "sms", "phone"].filter(a => appBadge(a) > 0);
  const bars = [1, 2, 3, 4].map(i => `<b class="${i <= st.signal && !st.down ? "on" : ""}"></b>`).join("");
  sbEl.innerHTML =
    `<div class="sb-l"><span>${clock12(d)}</span><span class="noti">${icons.map(a => `<span class="mini">${svg(APPS[a].icon)}</span>`).join("")}</span></div>` +
    `<div class="sb-r"><span class="net">${st.down ? "서비스 없음" : esc(st.net)}</span><span class="sig">${bars}</span>` +
    `<span class="bat ${st.battery <= 15 ? "low" : ""}">${st.battery}%<span class="cell"><i style="width:${st.battery}%"></i></span></span></div>`;
}

/* ---------- 토스트 · 배너 ---------- */
let toastT;
function toast(text) {
  toastEl.textContent = text; toastEl.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 2600);
}
const ncardHTML = n => {
  const a = APPS[n.app] || APPS.alert;
  return `<button class="ncard ${n.app === "alert" ? "alert" : ""}"><span class="ic" style="background:${a.bg}">${svg(a.icon)}</span>` +
    `<span class="tx"><span class="top"><span>${esc(appName(n.app))}</span><span>${esc(n.when || "지금")}</span></span>` +
    `<b>${esc(n.title)}${n.count > 1 ? ` <small>(${n.count})</small>` : ""}</b><span class="msg">${esc(n.text)}</span></span></button>`;
};
let bannerT, bannerSeq = 0;
function showBanner(n) {
  const seq = ++bannerSeq;
  bannerEl.innerHTML = ncardHTML(n);
  bannerEl.classList.remove("out"); bannerEl.hidden = false;
  bannerEl.style.animation = "none"; void bannerEl.offsetWidth; bannerEl.style.animation = "";
  $(".ncard", bannerEl).onclick = () => { hideBanner(true); n.open && n.open(); };
  clearTimeout(bannerT);
  bannerT = setTimeout(() => {
    bannerEl.classList.add("out");
    setTimeout(() => { if (seq === bannerSeq) { bannerEl.hidden = true; bannerEl.classList.remove("out"); } }, 250);
  }, 4000);
}
function hideBanner() { clearTimeout(bannerT); bannerSeq++; bannerEl.hidden = true; }

function addLockNoti(n) {
  const i = st.lockNotis.findIndex(x => x.key === n.key);
  if (i >= 0) st.lockNotis.splice(i, 1);
  st.lockNotis.unshift(n);
}
function notify(n) {
  if (st.off) return;
  n.when = n.when || "지금";
  vibrate([120]);
  ding();
  if (st.locked) { addLockNoti(n); return; }
  const t = top();
  if (t && t.call) return;                    // 통화 중에는 배너를 띄우지 않음
  showBanner(n);
}

/* =========================================================
   첫 안내 · 잠금화면 · 홈
   ========================================================= */
function wallpaper(el) {
  if (CFG.wallpaper) el.style.background = `url("${CFG.wallpaper}") center / cover`;
}

function introView() {
  const I = CFG.intro || {};
  const el = makeView("intro",
    `<h1>${esc(I.title || "")}</h1><p>${br(I.text || "")}</p>${I.sound ? `<p class="snd">${esc(I.sound)}</p>` : ""}` +
    `<button class="go">${esc(I.button || "시작")}</button>`);
  $(".go", el).onclick = start;
  return { el, noNav: true, intro: true };
}

function start() {
  ac();
  st.started = true;
  tlStart = Date.now();
  st.nextDrain = CFG.batteryDrainSec || 0;
  seedLockNotis();
  sbEl.hidden = false;
  setRoot(lockView());
}

const lastMsg = c => [...c.messages].reverse().find(m => !m.day);
function seedLockNotis() {
  const items = [];
  chats.filter(c => c.unread > 0).forEach(c => {
    const l = lastMsg(c);
    items.push({
      key: "chat:" + c.id, app: c.id === "alert" ? "alert" : c.app,
      title: c.group ? c.title : c.title,
      text: l ? (c.group && l.from ? `${l.from}: ${l.text}` : l.text) : "",
      count: c.unread, when: fmtTime(l && l.time), sort: (l && l.time) || "",
      open: () => openChat(c)
    });
  });
  const missed = st.calls.filter(c => c.dir === "missed");
  if (missed.length) items.push({
    key: "missed", app: "phone", title: `부재중 전화 ${missed.length}통`,
    text: [...new Set(missed.map(c => c.name))].join(", "),
    when: fmtTime(missed[0].time), sort: missed[0].time || "",
    open: () => phoneApp("recent")
  });
  items.sort((a, b) => String(b.sort).localeCompare(String(a.sort)));
  st.lockNotis = items;
}

function lockView() {
  const el = makeView("wall lock",
    `<div class="clock"></div><div class="date"></div><div class="notis"></div>` +
    `<button class="hint">${svg("up")}<span>위로 밀어서 잠금 해제</span></button>`);
  wallpaper(el);
  const entry = { el, lock: true };
  entry.tick = () => { $(".clock", el).textContent = clock12(now()); $(".date", el).textContent = dateLabel(now()); };
  entry.refresh = () => {
    const list = st.lockNotis, max = 4, box = $(".notis", el);
    box.innerHTML = list.slice(0, max).map(ncardHTML).join("") +
      (list.length > max ? `<div class="more">알림 ${list.length - max}개 더</div>` : "");
    $$(".ncard", box).forEach((b, i) => { b.onclick = () => unlock(list[i].open); });
  };
  // 위로 밀어서 잠금 해제
  let y0 = null, dy = 0;
  el.addEventListener("pointerdown", e => { if (e.target.closest(".ncard, .hint")) return; y0 = e.clientY; dy = 0; });
  el.addEventListener("pointermove", e => {
    if (y0 === null) return;
    dy = Math.min(0, e.clientY - y0);
    el.style.transform = `translateY(${dy * 0.5}px)`; el.style.opacity = String(1 + dy / 500);
  });
  const end = () => { if (y0 === null) return; y0 = null; el.style.transform = ""; el.style.opacity = ""; if (dy < -60) unlock(); };
  el.addEventListener("pointerup", end); el.addEventListener("pointerleave", end); el.addEventListener("pointercancel", end);
  $(".hint", el).onclick = () => unlock();
  entry.tick(); entry.refresh();
  return entry;
}

function unlock(then) {
  if (!st.locked) return;
  st.locked = false;
  st.lockNotis = [];
  setRoot(homeView());
  if (then) then();
}

function homeView() {
  const appBtn = id => APPS[id]
    ? `<button class="app" data-app="${id}"><span class="ic" style="background:${APPS[id].bg}">${svg(APPS[id].icon)}</span><span class="lb">${esc(appName(id))}</span><i class="badge" hidden></i></button>`
    : "";
  const W = CFG.weather || {};
  const dock = S.dock || [];
  const el = makeView("wall home",
    `<div class="widget"><div><div class="t"></div><div class="d"></div></div>` +
    `<div class="w">${esc(W.city || "")}<b>${esc(W.temp || "")}</b>${esc(W.desc || "")}</div></div>` +
    `<div class="grid">${(S.home || []).map(appBtn).join("")}</div>` +
    `<div class="dock" style="--n:${dock.length || 1}">${dock.map(appBtn).join("")}</div>`);
  wallpaper(el);
  $$(".app", el).forEach(b => { b.onclick = () => openApp(b.dataset.app); });
  const entry = { el, home: true };
  entry.tick = () => {
    const d = now();
    $(".t", el).innerHTML = `${clock12(d)}<small>${d.getHours() < 12 ? "오전" : "오후"}</small>`;
    $(".d", el).textContent = dateLabel(d);
  };
  entry.refresh = () => $$(".app", el).forEach(b => {
    const n = appBadge(b.dataset.app), bd = $(".badge", b);
    bd.hidden = !n; bd.textContent = n > 99 ? "99+" : n;
  });
  entry.tick(); entry.refresh();
  return entry;
}

function openApp(id) {
  const a = APPS[id];
  if (a && a.open) a.open();
  else toast((S.appMessages && S.appMessages[id]) || "앱을 열 수 없습니다.");
}

/* =========================================================
   메신저 · 문자
   ========================================================= */
const bump = c => { c.rank = -(++st.rankSeq); };

function chatTimeLabel(c) {
  let lastDay = null, last = null;
  for (const m of c.messages) { if (m.day) lastDay = m.day; else last = m; }
  if (!last) return "";
  if (last.live) return fmtTime(last.time);
  const d = now(), today = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  const md = /(\d+월 \d+일)/.exec(lastDay || "");
  if (md && md[1] !== today) return md[1];
  return fmtTime(last.time);
}
const chatAvatar = (c, cls = "") =>
  c.id === "alert" ? iconAv("alert", "#e5484d", cls) : c.group ? iconAv("group", "#9aa3b5", cls) : avatar(c.title, cls);

function chatList(app) {
  const el = makeView("", `<header class="appbar big">${BACK}<h1>${esc(appName(app))}</h1></header><div class="scroll"><div class="list"></div></div>`, { light: true });
  const entry = { el, light: true, id: "list:" + app };
  entry.refresh = () => {
    const list = chats.filter(c => c.app === app).sort((a, b) => a.rank - b.rank);
    $(".list", el).innerHTML = list.map(c => {
      const l = lastMsg(c);
      return `<button class="row" data-id="${esc(c.id)}">${chatAvatar(c)}<span class="mid"><div class="nm">${esc(c.title)}</div>` +
        `<div class="pv">${esc(l ? l.text : "")}</div></span><span class="rt"><span>${esc(chatTimeLabel(c))}</span>` +
        `${c.unread ? `<i class="badge sm">${c.unread > 99 ? "99+" : c.unread}</i>` : ""}</span></button>`;
    }).join("") || `<div class="empty">대화가 없습니다.</div>`;
    $$(".row", el).forEach(b => { b.onclick = () => openChat(chatById(b.dataset.id)); });
  };
  entry.refresh();
  return push(entry);
}

function openChat(c) {
  if (!c) return;
  const t = top();
  if (t && t.id === "chat:" + c.id) return;
  if (!stack.some(e => e.id === "list:" + c.app)) chatList(c.app);
  chatRoom(c);
}

function renderMsgs(c) {
  const ms = c.messages;
  const who = x => (x.me ? "@me" : (x.from || c.title));
  let out = "";
  ms.forEach((m, i) => {
    if (m.day) { out += `<div class="dayline">${esc(m.day)}</div>`; return; }
    const prev = ms[i - 1], next = ms[i + 1], sender = who(m);
    const same = x => x && !x.day && who(x) === sender;
    const cont = same(prev);
    const time = same(next) && next.time === m.time ? "" : `<span>${esc(fmtTime(m.time))}</span>`;
    const fresh = m.fresh ? "new" : "";
    if (m.me) {
      const mark = m.failed ? `<span class="fail">! 전송 실패</span>` : (!m.read ? `<span class="rd">1</span>` : "");
      out += `<div class="m me ${fresh}"><div class="stack"><div class="bub">${esc(m.text)}</div></div><div class="meta">${mark}${time}</div></div>`;
    } else if (c.app === "sms") {
      out += `<div class="m ${fresh}"><div class="stack"><div class="bub">${esc(m.text)}</div></div><div class="meta">${time}</div></div>`;
    } else {
      out += `<div class="m ${cont ? "cont" : ""} ${fresh}"><div class="avs">${avatar(sender, "sm")}</div>` +
        `<div class="stack"><div class="who">${esc(sender)}</div><div class="bub">${esc(m.text)}</div></div><div class="meta">${time}</div></div>`;
    }
    m.fresh = false;
  });
  if (c.typing) {
    out += `<div class="m new"><div class="avs">${c.app === "sms" ? "" : avatar(c.typingFrom || c.title, "sm")}</div>` +
      `<div class="stack"><div class="bub typing"><i></i><i></i><i></i></div></div></div>`;
  }
  return out;
}

function chatRoom(c) {
  const sms = c.app === "sms";
  const el = makeView(`room ${sms ? "sms" : ""} ${c.id === "alert" ? "alertroom" : ""}`,
    `<header class="appbar"><button class="back" aria-label="뒤로">${svg("back")}</button><h1>${esc(c.title)}</h1></header>` +
    `<div class="scroll"><div class="msgs"></div></div>` +
    `<form class="composer"><input placeholder="${sms ? "문자 메시지" : "메시지 입력"}" enterkeyhint="send" autocomplete="off">` +
    `<button disabled aria-label="보내기">${svg("send")}</button></form>`, { light: true });
  const entry = { el, light: true, id: "chat:" + c.id };
  const sc = $(".scroll", el), box = $(".msgs", el), input = $("input", el), btn = $(".composer button", el);
  entry.refresh = () => {
    c.unread = 0;
    box.innerHTML = renderMsgs(c);
    sc.scrollTop = sc.scrollHeight;
  };
  input.oninput = () => { btn.disabled = !input.value.trim(); };
  $(".composer", el).onsubmit = e => {
    e.preventDefault();
    const text = input.value.trim(); if (!text) return;
    input.value = ""; btn.disabled = true;
    sendMsg(c, text);
  };
  push(entry);
  update();
  return entry;
}

const defaultFrom = c => {
  if (c.replyFrom) return c.replyFrom;
  if (!c.group) return c.title;
  const l = [...c.messages].reverse().find(m => !m.day && !m.me && m.from);
  return l ? l.from : c.title;
};

function sendMsg(c, text) {
  const m = { me: true, text, time: hhmm(now()), live: true, fresh: true, read: false };
  c.messages.push(m); bump(c);
  if (st.down || c.sendFail) {
    m.failed = true;
    toast(st.down ? "네트워크에 연결되어 있지 않아\n메시지를 보내지 못했습니다." : "메시지를 보내지 못했습니다.");
    update(); return;
  }
  softDing();
  update();
  const reps = (c.replies || [])[c.sent++];
  if (!reps || c.neverRead) return;
  replyFlow(c, Array.isArray(reps) ? reps : [reps]);
}

async function replyFlow(c, reps) {
  await sleep(1400 + Math.random() * 1200);
  if (st.off) return;
  c.messages.forEach(m => { if (m.me) m.read = true; });
  update();
  for (const r of reps) {
    const msg = typeof r === "string" ? { text: r } : r;
    const from = msg.from || defaultFrom(c);
    await sleep(400);
    c.typing = true; c.typingFrom = from; update();
    await sleep(Math.min(4000, 700 + String(msg.text).length * 70));
    c.typing = false;
    if (st.off) return;
    receive(c, { from, text: msg.text });
  }
}

function receive(c, { from, text }) {
  if (st.off) return;
  c.messages.push({ from, text, time: hhmm(now()), live: true, fresh: true });
  bump(c);
  const t = top();
  const viewing = !st.locked && t && t.id === "chat:" + c.id;
  if (!viewing) {
    c.unread++;
    notify({
      key: "chat:" + c.id, app: c.id === "alert" ? "alert" : c.app,
      title: c.group ? c.title : (from || c.title),
      text: c.group ? `${from}: ${text}` : text,
      count: c.unread, open: () => openChat(c)
    });
  } else softDing();
  update();
}

/* =========================================================
   긴급재난문자
   ========================================================= */
function showAlert(ev) {
  let c = chatById("alert");
  if (!c) {
    c = { id: "alert", app: "sms", title: "긴급재난문자", messages: [], unread: 0, sent: 0, rank: 0, sendFail: true, replies: [] };
    chats.push(c);
  }
  c.messages.push({ from: c.title, text: ev.text, time: hhmm(now()), live: true, fresh: true });
  bump(c);
  const t = top();
  if (st.locked || !t || t.id !== "chat:alert") c.unread++;
  const level = ev.title || "위급재난문자";
  overlayEl.innerHTML =
    `<div class="alertbox" role="alertdialog"><div class="hd">${svg("alert")}<div><b>${esc(level)}</b><small>${esc(ampm(now()))}</small></div></div>` +
    `<div class="bd">${esc(ev.text)}</div><div class="ft"><button>확인</button></div></div>`;
  overlayEl.hidden = false;
  arm();
  st.stopSiren && st.stopSiren();
  st.stopSiren = siren(ev.sound === false ? 0 : (ev.sec || 6));
  vibrate([500, 200, 500, 200, 500, 200, 800]);
  screenEl.classList.remove("shake"); void screenEl.offsetWidth; screenEl.classList.add("shake");
  $("button", overlayEl).onclick = () => { overlayEl.hidden = true; st.stopSiren && st.stopSiren(); st.stopSiren = null; };
  if (st.locked) addLockNoti({ key: "chat:alert", app: "alert", title: level, text: ev.text, count: c.unread, open: () => openChat(c) });
  update();
}

/* =========================================================
   전화
   ========================================================= */
const contactByName = n => (S.contacts || []).find(c => c.name === n);
const contactByNum = n => digits(n) && (S.contacts || []).find(c => digits(c.number) === digits(n));
function resolve(target) {
  const c = contactByName(target) || contactByNum(target);
  return c ? { name: c.name, number: c.number } : { name: null, number: formatNum(target) || String(target || "") };
}
const dirLabel = c =>
  c.dir === "missed" ? "↙ 부재중 전화" :
  c.dir === "rejected" ? "↙ 거절한 전화" :
  c.dir === "in" ? `↙ 수신 전화${c.length ? " · " + c.length : ""}` :
  `↗ 발신 전화${c.length ? " · " + c.length : ""}`;

const KEYS = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]];

function phoneApp(tab = "recent") {
  st.missedNew = 0;
  const el = makeView("",
    `<header class="appbar big">${BACK}<h1>전화</h1></header><div class="scroll pbody"></div>` +
    `<nav class="tabs"><button data-t="keypad">키패드</button><button data-t="recent">최근기록</button><button data-t="contacts">연락처</button></nav>`,
    { light: true });
  const entry = { el, light: true, id: "phone" };
  const body = $(".pbody", el);
  let cur = tab, dialed = "";

  const renderDial = () => {
    const m = contactByNum(dialed);
    $(".num", body).textContent = formatNum(dialed) || dialed || " ";
    $(".who", body).textContent = m ? m.name : "";
  };
  entry.refresh = () => {
    $$(".tabs button", el).forEach(b => b.classList.toggle("on", b.dataset.t === cur));
    if (cur === "keypad") {
      body.innerHTML = `<div class="dial"><div class="num"></div><div class="who"></div>` +
        `<div class="keys">${KEYS.map(([k, s]) => `<button data-k="${k}">${k}<small>${s || " "}</small></button>`).join("")}</div>` +
        `<div class="acts"><span></span><button class="callbtn" aria-label="전화 걸기">${svg("phone")}</button><button class="del" aria-label="지우기">${svg("del")}</button></div></div>`;
      $$(".keys button", body).forEach(b => { b.onclick = () => { if (dialed.length < 13) dialed += b.dataset.k; keyTone(); renderDial(); }; });
      $(".del", body).onclick = () => { dialed = dialed.slice(0, -1); renderDial(); };
      $(".callbtn", body).onclick = () => { if (dialed) call(dialed); };
      renderDial();
    } else if (cur === "recent") {
      body.innerHTML = `<div class="list">${st.calls.map((c, i) =>
        `<div class="row callrow" data-i="${i}">${avatar(c.name)}<span class="mid"><div class="nm ${c.dir === "missed" ? "miss" : ""}">${esc(c.name)}</div>` +
        `<div class="pv">${esc(dirLabel(c))}</div></span><span class="rt">${esc(fmtTime(c.time))}</span>` +
        `<button class="call-i" aria-label="전화 걸기">${svg("phone")}</button></div>`).join("")}</div>` +
        (st.calls.length ? "" : `<div class="empty">통화 기록이 없습니다.</div>`);
      $$(".callrow", body).forEach(r => { r.onclick = () => call(st.calls[+r.dataset.i].name); });
    } else {
      const list = [...(S.contacts || [])].sort((a, b) => a.name.localeCompare(b.name, "ko"));
      body.innerHTML = `<div class="list">${list.map(c =>
        `<button class="row" data-n="${esc(c.name)}">${avatar(c.name)}<span class="mid"><div class="nm">${esc(c.name)}</div><div class="pv">${esc(c.number)}</div></span></button>`).join("")}</div>`;
      $$(".row", body).forEach(r => { r.onclick = () => call(r.dataset.n); });
    }
  };
  $$(".tabs button", el).forEach(b => { b.onclick = () => { cur = b.dataset.t; entry.refresh(); }; });
  entry.refresh();
  push(entry);
  update();
  return entry;
}

function call(target) {
  if (st.inCall) return;
  const who = resolve(target);
  const key = who.name || digits(who.number);
  const scripts = S.callScripts || {};
  let sc = scripts[who.name] || scripts[who.number] || scripts[digits(who.number)];
  const n = st.callCount[key] = (st.callCount[key] || 0) + 1;
  if (sc && n > 1 && sc.again) sc = sc.again;
  callScreen({ who, script: sc || {}, incoming: false });
}

function callScreen({ who, script, incoming, ring, onMiss }) {
  st.inCall = true;
  const disp = who.name || who.number;
  const el = makeView("callscr",
    `<div class="st"></div><div class="nm">${esc(disp)}</div>` +
    `<div class="no">${esc(who.name ? (who.number || "") : "저장되지 않은 번호")}</div>` +
    `${who.name ? avatar(disp, "lg") : iconAv("user", "#5b6475", "lg")}<div class="sub"></div><div class="btns"></div>`);
  const tok = { dead: false };
  let stopRing = null, timerInt = null, connectedAt = null, finished = false;
  const entry = {
    el, call: true, noNav: true,
    onClose: () => { tok.dead = true; stopRing && stopRing(); clearInterval(timerInt); st.inCall = false; st.callEndedAt = Date.now(); }
  };
  const stEl = $(".st", el), sub = $(".sub", el), btns = $(".btns", el);
  const wait = async ms => { await sleep(ms); if (tok.dead) throw tok; };
  const line = (text, cls = "") => {
    const all = $$(".ln", sub);
    all.forEach((x, i) => { if (all.length - i > 1) x.classList.add("old"); });
    sub.insertAdjacentHTML("beforeend", `<div class="ln ${cls}">${esc(text)}</div>`);
    while (sub.children.length > 5) sub.firstElementChild.remove();
  };
  const endBtn = () => {
    btns.innerHTML = `<button class="callbtn end" aria-label="통화 종료">${svg("phone")}</button>`;
    $(".callbtn", btns).onclick = () => finish(incoming ? "in" : "out");
  };
  const connect = () => {
    connectedAt = Date.now();
    const show = () => { const s = Math.floor((Date.now() - connectedAt) / 1000); stEl.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };
    show(); timerInt = setInterval(show, 500);
  };
  function finish(dir, { quiet = false } = {}) {
    if (finished) return;
    finished = true; tok.dead = true;
    stopRing && stopRing(); stopRing = null; clearInterval(timerInt);
    st.calls.unshift({ name: disp, dir, time: hhmm(now()), length: connectedAt ? durText(Date.now() - connectedAt) : "" });
    if (quiet) { removeEntry(entry); return; }
    stEl.textContent = "통화 종료"; btns.innerHTML = "";
    hangupTone();
    setTimeout(() => removeEntry(entry), 1300);
  }
  async function speak(lines) {
    for (const l of lines || []) {
      if (typeof l === "string") { await wait(500); line(l); await wait(1300 + l.length * 75); }
      else if (l.me) { await wait(300); line(l.me, "me"); await wait(1100 + l.me.length * 70); }
      else if (l.sys) { line(l.sys, "sys"); await wait(1500); }
      else if (l.wait) await wait(l.wait);
    }
  }
  async function runOutgoing() {
    endBtn();
    stEl.textContent = "발신 중…";
    if (st.down) {
      await wait(1200); line(CFG.noService || "서비스 지역이 아닙니다.", "sys"); errTone();
      await wait(2600); return finish("out");
    }
    stopRing = ringback();
    await wait(script.ring ?? 4000);
    stopRing(); stopRing = null;
    if (script.fail || !(script.lines && script.lines.length)) {
      stEl.textContent = "연결 안 됨";
      line(script.fail || CFG.callFail || "연결할 수 없습니다.", "sys"); errTone();
      await wait(3500); return finish("out");
    }
    connect();
    await speak(script.lines);
    await wait(1500);
    finish("out");
  }
  async function runIncoming() {
    stEl.textContent = "수신 전화";
    el.classList.add("ringing");
    btns.innerHTML = `<button class="callbtn" data-a="yes" aria-label="받기">${svg("phone")}</button><button class="callbtn end" data-a="no" aria-label="거절">${svg("phone")}</button>`;
    stopRing = ringtone();
    const choice = await new Promise(res => {
      const t = setTimeout(() => res("timeout"), ring || 20000);
      btns.onclick = e => { const b = e.target.closest("[data-a]"); if (!b) return; clearTimeout(t); res(b.dataset.a); };
      tok.cancel = () => { clearTimeout(t); res("dead"); };
    });
    stopRing && stopRing(); stopRing = null; btns.onclick = null; el.classList.remove("ringing");
    if (tok.dead || choice === "dead") return;
    if (choice === "yes") {
      endBtn(); connect();
      await speak(script.lines);
      await wait(1000);
      line("상대방이 통화를 끊었습니다.", "sys");
      await wait(1200);
      return finish("in");
    }
    // 안 받거나 거절하면: 잠시 뒤 그 사람이 문자를 보냄 (ifMissed)
    if (onMiss && onMiss.text) {
      setTimeout(() => {
        const from = onMiss.from || disp;
        const c = chatById(onMiss.chat) || newChat({ chat: onMiss.chat || disp, from });
        receive(c, { from, text: onMiss.text });
      }, 4000);
    }
    if (choice === "no") return finish("rejected", { quiet: true });
    finish("missed", { quiet: true });
    st.missedNew++;
    notify({ key: "missed", app: "phone", title: "부재중 전화", text: disp, open: () => phoneApp("recent") });
    update();
  }
  push(entry);
  (incoming ? runIncoming() : runOutgoing()).catch(() => {});
  return entry;
}

/* =========================================================
   뉴스 포털
   ========================================================= */
const N = S.news || {};
const thumb = a => a.img ? `background:url('${esc(a.img)}') center / cover` : `background:linear-gradient(135deg, ${a.color || "#667"}, #1c1f26)`;
const agoOf = a => {
  if (!a.revealedAt) return a.ago || "";
  const m = Math.floor((Date.now() - a.revealedAt) / 60000);
  return m < 1 ? "방금 전" : `${m}분 전`;
};
const visibleArticles = () => {
  const v = st.articles.filter(a => !a.hidden);
  return [...v.filter(a => a.revealedAt).sort((a, b) => b.revealedAt - a.revealedAt), ...v.filter(a => !a.revealedAt)];
};
const artRow = a =>
  `<button class="art ${a.fresh ? "fresh" : ""}" data-id="${esc(a.id)}"><span class="th" style="${thumb(a)}"></span>` +
  `<span><div class="tt">${esc(a.title)}</div><div class="src">${esc(a.press || "")} · ${esc(agoOf(a))}` +
  `${a.comments && a.comments.length ? ` · 댓글 ${a.comments.length}` : ""}</div></span></button>`;
const offlineStrip = () => st.down ? `<div class="offline">오프라인 상태입니다. 최신 정보가 아닐 수 있습니다.</div>` : "";
const bindArts = el => $$(".art, .breaking", el).forEach(b => {
  b.onclick = () => { const a = st.articles.find(x => x.id === b.dataset.id); if (a) articleView(a); };
});

function newsHome() {
  st.newNews = 0;
  const el = makeView("portal",
    `<div class="ptop"><div class="urlrow">${BACK}<div class="urlbar">${svg("lock")}<span>${esc(N.url || "")}</span></div></div>` +
    `<div class="psearch"><span class="logo">${esc(N.portal || "뉴스")}</span><form><input placeholder="검색어를 입력하세요" enterkeyhint="search"><button>검색</button></form></div>` +
    `<div class="ptabs"><button class="on">뉴스</button><button>연예</button><button>스포츠</button><button>경제</button><button>날씨</button></div></div>` +
    `<div class="scroll nbody"></div>`, { light: true });
  const entry = { el, light: true, id: "news" };
  $$(".ptabs button", el).forEach((b, i) => { if (i) b.onclick = () => toast("페이지를 불러올 수 없습니다."); });
  $("form", el).onsubmit = e => { e.preventDefault(); const q = $("input", el).value.trim(); if (q) searchView(q); };
  entry.refresh = () => {
    const vis = visibleArticles();
    const brk = vis.find(a => a.breaking);
    const body = $(".nbody", el);
    body.innerHTML = offlineStrip() +
      (brk ? `<button class="breaking" data-id="${esc(brk.id)}"><em>속보</em><span>${esc(brk.title)}</span></button>` : "") +
      `<div class="card"><h2>실시간 급상승 검색어</h2><ol class="trend">${st.trending.slice(0, 10).map(k => `<li><button data-q="${esc(k)}">${esc(k)}</button></li>`).join("")}</ol></div>` +
      `<div class="card"><h2>많이 본 뉴스</h2>${vis.map(artRow).join("") || `<div class="empty">기사가 없습니다.</div>`}</div><div style="height:16px"></div>`;
    bindArts(body);
    $$(".trend button", body).forEach(b => { b.onclick = () => searchView(b.dataset.q); });
  };
  entry.refresh();
  push(entry);
  update();
  return entry;
}

function searchView(q) {
  const el = makeView("portal",
    `<header class="appbar"><button class="back" aria-label="뒤로">${svg("back")}</button><h1>'${esc(q)}' 검색 결과</h1></header><div class="scroll"></div>`, { light: true });
  const res = visibleArticles().filter(a => (a.title + " " + (a.body || []).join(" ")).includes(q));
  $(".scroll", el).innerHTML = st.down
    ? `<div class="empty">네트워크에 연결할 수 없습니다.<br>연결 상태를 확인해 주세요.</div>`
    : res.length ? `<div class="card">${res.map(artRow).join("")}</div>` : `<div class="empty">'${esc(q)}'에 대한 검색 결과가 없습니다.</div>`;
  bindArts(el);
  return push({ el, light: true, id: "search" });
}

function openArticle(a) {
  if (!stack.some(e => e.id === "news")) newsHome();
  articleView(a);
}

function articleView(a) {
  a.fresh = false;
  const cm = a.comments || [];
  const el = makeView("article",
    `<header class="appbar"><button class="back" aria-label="뒤로">${svg("back")}</button><h1>${esc(N.portal || "")} 뉴스</h1></header>` +
    `<div class="scroll"><div class="hd"><div class="press">${esc(a.press || "")}</div><h1>${esc(a.title)}</h1><div class="tm">${esc(agoOf(a))}</div></div>` +
    (a.noPhoto ? "" : `<div class="ph" style="${thumb(a)}">${a.img ? "" : esc(a.photo || "")}</div>`) +
    `<div class="txt">${(a.body || []).map(p => `<p>${esc(p)}</p>`).join("")}</div>` +
    `<div class="cmts"><h3>댓글 ${cm.length}</h3>${cm.map(c =>
      `<div class="cmt"><div class="u">${esc(c.name)}</div><div class="c">${esc(c.text)}</div><div class="l">공감 ${Number(c.likes || 0).toLocaleString("ko-KR")}</div></div>`).join("") ||
      `<div class="empty" style="padding:24px 0">첫 댓글을 남겨 보세요.</div>`}</div></div>`, { light: true });
  return push({ el, light: true, id: "article:" + a.id });
}

/* =========================================================
   학교 앱
   ========================================================= */
const SC = S.school || {};
function schoolHome() {
  st.newNotices = 0;
  const el = makeView("school",
    `<div class="shd">${BACK}<span class="emb">${esc((SC.name || "학").charAt(0))}</span><div><b>${esc(SC.name || "학교")}</b><small>모바일 학생 서비스</small></div></div>` +
    `<div class="scroll"><div class="sect">공지사항</div><div class="list"></div></div>`, { sbBg: "#1f3a68", navBg: "#fff" });
  const entry = { el, navDark: true, id: "school" };
  entry.refresh = () => {
    $(".list", el).innerHTML = (st.down ? offlineStrip() : "") + st.notices.map((n, i) =>
      `<button class="row nrow ${n.important ? "imp" : ""}" data-i="${i}"><span class="mid"><div class="nm">${n.fresh ? `<i class="newtag">N</i>` : ""}${esc(n.title)}</div>` +
      `<div class="pv">${esc(n.dept || "")} · ${esc(n.date || "")}</div></span></button>`).join("");
    $$(".nrow", el).forEach(b => { b.onclick = () => noticeView(st.notices[+b.dataset.i]); });
  };
  entry.refresh();
  push(entry);
  update();
  return entry;
}
function openNotice(n) {
  if (!stack.some(e => e.id === "school")) schoolHome();
  noticeView(n);
}
function noticeView(n) {
  n.fresh = false;
  const el = makeView("notice-v",
    `<header class="appbar"><button class="back" aria-label="뒤로">${svg("back")}</button><h1>공지사항</h1></header>` +
    `<div class="scroll notice"><h1>${esc(n.title)}</h1><div class="meta">${esc(n.dept || "")} · ${esc(n.date || "")}</div><div class="txt">${esc(n.body || "")}</div></div>`, { light: true });
  return push({ el, light: true, id: "notice" });
}

/* =========================================================
   지도 · 갤러리 · 메모
   ========================================================= */
function mapApp() {
  const M = S.map || {}, sh = M.shelters || [];
  const el = makeView("",
    `<header class="appbar">${BACK}<h1>${esc(M.title || "지도")}</h1></header>` +
    `<div class="mapbox">${sh.map(s => `<div class="pin" style="left:${s.x ?? 50}%;top:${s.y ?? 50}%"><i></i><span>${esc(s.name)}</span></div>`).join("")}` +
    `<div class="pin me" style="left:50%;top:56%"><i></i></div></div>` +
    `<div class="scroll"><div class="list">${sh.map((s, i) =>
      `<button class="row shel" data-i="${i}"><span class="ic2">대피</span><span class="mid"><div class="nm">${esc(s.name)}</div><div class="pv">${esc(s.dist || "")}${s.note ? " · " + esc(s.note) : ""}</div></span></button>`).join("")}</div></div>`,
    { light: true });
  $$(".shel", el).forEach(b => {
    b.onclick = () => { const s = sh[+b.dataset.i]; toast(st.down ? "네트워크 연결이 없어\n길찾기를 할 수 없습니다." : `${s.name}\n${s.dist || ""} ${s.note || ""}`); };
  });
  return push({ el, light: true, id: "map" });
}

const photoBg = p => p.img ? `background-image:url('${esc(p.img)}')` : `background:${p.color || "#555"}`;
function galleryHome() {
  const albums = S.gallery || [];
  const el = makeView("gal",
    `<header class="appbar big">${BACK}<h1>갤러리</h1></header><div class="scroll"><div class="albums">${albums.map((a, i) =>
      `<button class="album" data-i="${i}"><div class="cv" style="${a.photos && a.photos[0] ? photoBg(a.photos[0]) : "background:#ddd"}"></div><b>${esc(a.album)}</b><small>${(a.photos || []).length}</small></button>`).join("")}</div></div>`,
    { light: true });
  $$(".album", el).forEach(b => { b.onclick = () => albumView(albums[+b.dataset.i]); });
  return push({ el, light: true, id: "gallery" });
}
function albumView(a) {
  const ps = a.photos || [];
  const el = makeView("gal",
    `<header class="appbar"><button class="back" aria-label="뒤로">${svg("back")}</button><h1>${esc(a.album)}</h1></header>` +
    `<div class="scroll"><div class="photos">${ps.map((p, i) => `<button data-i="${i}" style="${photoBg(p)}" aria-label="${esc(p.caption || "사진")}"></button>`).join("")}</div></div>`,
    { light: true });
  $$(".photos button", el).forEach(b => { b.onclick = () => photoView(ps[+b.dataset.i]); });
  return push({ el, light: true, id: "album" });
}
function photoView(p) {
  const el = makeView("viewer",
    `<header class="appbar"><button class="back" aria-label="뒤로">${svg("back")}</button><h1></h1></header>` +
    `<div class="ph"><div style="${photoBg(p)}">${p.img ? "" : esc(p.caption || "")}</div></div><div class="cap">${esc(p.caption || "")}</div>`,
    { sbBg: "#000" });
  return push({ el, id: "photo" });
}

function memoList() {
  const ms = S.memos || [];
  const el = makeView("memo",
    `<header class="appbar big">${BACK}<h1>메모</h1></header><div class="scroll"><div class="list">${ms.map((m, i) =>
      `<button class="row" data-i="${i}"><span class="mid"><div class="nm">${esc(m.title)}</div><div class="pv">${esc(m.date || "")} · ${esc(String(m.text || "").split("\n")[0])}</div></span></button>`).join("")}</div></div>`,
    { light: true });
  $$(".row", el).forEach(b => { b.onclick = () => memoView(ms[+b.dataset.i]); });
  return push({ el, light: true, id: "memo" });
}
function memoView(m) {
  const el = makeView("memo",
    `<header class="appbar"><button class="back" aria-label="뒤로">${svg("back")}</button><h1>메모</h1></header>` +
    `<div class="scroll memotxt"><h1>${esc(m.title)}</h1><small>${esc(m.date || "")}</small><p>${esc(m.text || "")}</p></div>`,
    { light: true });
  return push({ el, light: true, id: "memo-v" });
}

/* =========================================================
   전원 꺼짐
   ========================================================= */
function shutdown() {
  if (st.off) return;
  st.off = true;
  hideBanner(); overlayEl.hidden = true; toastEl.hidden = true;
  st.stopSiren && st.stopSiren();
  const el = makeView("off", `<div>${br(CFG.shutdown || "전원이 꺼집니다.")}</div>`);
  setRoot({ el, noNav: true });
  sbEl.hidden = true;
  setTimeout(() => {
    el.innerHTML = `<button class="replay">↻ 처음부터 다시 보기</button>`;
    $(".replay", el).onclick = () => location.reload();
  }, 3500);
}

/* =========================================================
   시간 흐름 (timeline)
   ========================================================= */
let tlStart = 0;
// at: 90 (초) 또는 "1:30" (분:초)
const CALL_GAP_MS = 20000;
const toSec = v => typeof v === "string" && v.includes(":") ? v.split(":").reduce((a, x) => a * 60 + Number(x), 0) : Number(v) || 0;
const timeline = (S.timeline || []).map(e => ({ ...e, at: toSec(e.at) })).sort((a, b) => a.at - b.at);
const elapsed = () => (Date.now() - tlStart) / 1000 * SPEED;

function newChat(ev) {
  const c = { id: ev.chat, app: ev.app || "talk", title: ev.title || ev.from || ev.chat, group: !!ev.group,
    messages: [], unread: 0, sent: 0, rank: 0, replies: ev.replies || [], typing: false };
  chats.push(c);
  return c;
}

function runEvent(ev) {
  switch (ev.type) {
    case "message": {
      const c = chatById(ev.chat) || newChat(ev);
      receive(c, { from: ev.from || c.title, text: ev.text });
      break;
    }
    case "alert": showAlert(ev); break;
    case "call":
      callScreen({ who: resolve(ev.from || ev.number), script: { lines: ev.lines || [] }, incoming: true, ring: ev.ring, onMiss: ev.ifMissed });
      break;
    case "news": {
      const a = st.articles.find(x => x.id === ev.id); if (!a) break;
      a.hidden = false; a.revealedAt = Date.now(); a.fresh = true; st.newNews++;
      notify({ key: "news:" + a.id, app: "news", title: a.breaking ? `[속보] ${a.press || ""}` : (a.press || appName("news")), text: a.title, open: () => openArticle(a) });
      update(); break;
    }
    case "notice": {
      const d = now();
      const n = { title: ev.title, dept: ev.dept || "", date: `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`, body: ev.body || "", important: ev.important, fresh: true };
      st.notices.unshift(n); st.newNotices++;
      notify({ key: "school:" + ev.title, app: "school", title: SC.name || "학교", text: ev.title, open: () => openNotice(n) });
      update(); break;
    }
    case "network":
      if (ev.signal != null) st.signal = ev.signal;
      if (ev.label != null) st.net = ev.label;
      if (ev.down != null) st.down = !!ev.down;
      if (ev.down && !st.locked) toast("모바일 네트워크에 연결할 수 없습니다.");
      update(); break;
    case "trending": st.trending = [...(ev.list || [])]; update(); break;
    case "battery":
      st.battery = Math.max(0, Math.min(100, ev.value | 0)); update();
      if (!st.battery) shutdown();
      break;
    case "toast": toast(ev.text); break;
  }
}

function tickTimeline() {
  if (!st.started || st.off) return;
  const t = elapsed();
  for (const ev of timeline) {
    if (ev.done || ev.at > t) continue;
    // 통화 중이거나 방금 끊었으면(20초) 다음 전화는 잠시 미룸 — 전화가 연달아 몰리지 않게
    if (ev.type === "call" && (st.inCall || Date.now() - st.callEndedAt < CALL_GAP_MS)) continue;
    ev.done = true;
    try { runEvent(ev); } catch (e) { console.error("timeline 오류:", ev, e); }
  }
}

function tickBattery() {
  const every = CFG.batteryDrainSec || 0;
  if (!st.started || st.off || !every) return;
  if (elapsed() >= st.nextDrain) {
    st.nextDrain += every;
    st.battery = Math.max(0, st.battery - 1);
    if (st.battery === 15 || st.battery === 5) toast(`배터리가 부족합니다 (${st.battery}%)`);
    if (st.battery === 0) shutdown();
  }
}

/* =========================================================
   시작
   ========================================================= */
/* ---------- 뒤로가기 ----------
   화면 속 ← 버튼, 아래 버튼줄의 <, 키보드 Esc,
   그리고 실제 휴대폰의 뒤로가기(브라우저 뒤로)가 모두 같은 동작을 합니다. */
function goBack() {
  if (!overlayEl.hidden) { $("button", overlayEl).click(); return true; }   // 재난문자 닫기
  const t = top();
  if (!t || st.off || t.intro || t.lock) return false;
  if (t.call) return true;                                                // 통화 중에는 무시
  if (stack.length > 1) { pop(); return true; }
  return false;                                                           // 홈 화면
}
// 브라우저 기록에 "가짜 한 칸"을 두어, 휴대폰 뒤로가기를 누르면 사이트를 나가지 않고 이 함수가 받게 함
let guarded = false;
function arm() {
  if (guarded) return;
  try { history.pushState({ phone: true }, ""); guarded = true; } catch (e) {}
}
addEventListener("popstate", () => {
  guarded = false;
  goBack();
  const t = top();
  if (stack.length > 1 || !overlayEl.hidden || (t && t.call)) arm();
});
viewsEl.addEventListener("click", e => {
  if (e.target.closest(".back")) { e.preventDefault(); goBack(); }
});

navEl.onclick = e => {
  const b = e.target.closest("[data-nav]");
  if (!b) return;
  const k = b.dataset.nav;
  if (k === "back") { goBack(); return; }
  const t = top();
  if (st.off || !t || t.lock || t.call || t.intro || !overlayEl.hidden) return;
  if (k === "home") popTo(x => x.home);
  else toast("최근 실행한 앱이 없습니다.");
};
addEventListener("keydown", e => {
  if (e.key === "Escape" && !e.target.closest("input")) goBack();
});

function fit() {
  if (innerWidth <= 520) { device.style.removeProperty("--scale"); return; }
  const s = Math.min(1, (innerHeight - 32) / 868, (innerWidth - 32) / 414);
  device.style.setProperty("--scale", s.toFixed(3));
}
addEventListener("resize", fit);
fit();

sbEl.hidden = true;
setRoot(introView());

let lastSec = -1;
setInterval(() => {
  if (st.off) return;
  const s = Math.floor(Date.now() / 1000);
  if (s !== lastSec) { lastSec = s; renderStatus(); stack.forEach(e => e.tick && e.tick()); }
  tickTimeline();
  tickBattery();
}, 200);

})();
