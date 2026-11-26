/* =========================================================
   휴대폰 동작 코드 — 내용은 data.js 에서 고치고, 이 파일은 보통 건드리지 않아도 됩니다.
   테스트 팁: 주소 뒤에 ?speed=10 을 붙이면 timeline 이 10배 빨리 진행됩니다.
   ========================================================= */
(() => {
"use strict";

const S = window.STORY || {};
const CFG = S.settings || {};
const QS = new URLSearchParams(location.search);
const SPEED = Math.max(0.1, Number(QS.get("speed")) || 1);
/* 휴대폰 디자인: "galaxy" 또는 "iphone". 주소 뒤 ?style=iphone 이 data.js 의 settings.phoneStyle 보다 우선 */
const STYLE = /^(iphone|ios)$/i.test(QS.get("style") || CFG.phoneStyle || "") ? "iphone" : "galaxy";
const IOS = STYLE === "iphone";
document.documentElement.classList.add(IOS ? "ios" : "galaxy");

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
  const m = /^(어제\s*)?(\d{1,2}):(\d{2})$/.exec(String(t || "").trim());   // "02:31", "어제 20:31"
  if (!m) return t || "";
  const H = +m[2];
  return `${m[1] ? "어제 " : ""}${H < 12 ? "오전" : "오후"} ${H % 12 || 12}:${m[3]}`;
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
  logoN: '<path d="M7.5 18V6l9 12V6" stroke-width="3"/>',
  school: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3.5 2.5 8.5 2.5 12 0v-5"/><path d="M22 9v6"/>',
  map: '<path d="M12 21s-7-6.2-7-11.5a 7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
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
  flash: '<path d="M8 3h8v4l-2 3v11h-4V10L8 7z"/><path d="M12 13v2"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16"/>',
  keypad: '<circle cx="6" cy="6" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="18" cy="6" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/><circle cx="6" cy="18" r="1"/><circle cx="12" cy="18" r="1"/><circle cx="18" cy="18" r="1"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  video: '<rect x="3" y="7" width="12" height="10" rx="2"/><path d="M15 11l6-3v8l-6-3"/>',
  group: '<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5M15.5 14.5c3 0 5.5 1.6 5.5 4.5"/>'
};
const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[name] || ""}</svg>`;
const BACK = `<button class="back" aria-label="뒤로">${svg("back")}</button>`;

/* ---------- 앱 목록 ---------- */
const APPS = {
  phone:    { name: "전화",   icon: "phone",    bg: "linear-gradient(160deg,#4cd964,#1f9d47)", open: () => phoneApp("recent") },
  talk:     { name: "톡",     icon: "talk",     bg: "linear-gradient(160deg,#8b6dff,#5a3be0)", open: () => chatList("talk") },
  sms:      { name: "메시지", icon: "sms",      bg: "linear-gradient(160deg,#5b9bff,#2d63e0)", open: () => chatList("sms") },
  news:     { name: (S.news && S.news.portal) || "뉴스", icon: "logoN", bg: "linear-gradient(160deg,#1ed760,#03b14f)", open: () => newsHome() },
  school:   { name: "학교",   icon: "school",   bg: "linear-gradient(160deg,#c0283a,#6e0f1c)", open: () => schoolHome() },
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
const chats = [...(S.chats || []), ...(S.sms || [])].map(c => ({
  app: "talk", replies: [], ...c,
  // 메시지에 read 가 적혀 있으면 그걸 우선 (예: 태호 방 전날까지 읽음)
  messages: (c.messages || []).map(m => ({ ...m, read: m.read ?? !c.neverRead })),
  unread: c.unread || 0, sent: 0, rank: 0, typing: false, ruleIdx: {}, known: {}
}));
/* 방 목록은 최근 메시지 순. 날짜 구분선("11월 3일", "2026년 10월 20일")과 time 으로 시각을 계산 */
const DEFAULT_YEAR = +String(CFG.date || "2027").slice(0, 4);
function lastStamp(msgs) {
  let y = DEFAULT_YEAR, mo = 0, d = 0, last = null;
  for (const m of msgs) {
    if (m.day) {
      const r = /(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/.exec(m.day);
      if (r) { y = r[1] ? +r[1] : DEFAULT_YEAR; mo = +r[2]; d = +r[3]; }
    } else last = { y, mo, d, time: m.time };
  }
  if (!last) return 0;
  const tm = /^(\d{1,2}):(\d{2})$/.exec(last.time || "") || [0, 0, 0];
  const base = last.mo ? new Date(last.y, last.mo - 1, last.d) : new Date(T0_PHONE);
  base.setHours(+tm[1], +tm[2], 0, 0);
  return base.getTime();
}
[...chats].sort((a, b) => lastStamp(b.messages) - lastStamp(a.messages)).forEach((c, i) => { c.rank = i; });
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
  nextDrain: 0, stopSiren: null,
  dead: false, dropCall: null,         // dead: 통신망 폭격으로 먹통이 된 뒤
  ending: false                         // 마지막 엔딩 화면이 시작됨
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
/* 맑은 종소리 · 마림바 소리 (여러 배음을 겹쳐 빠르게 사라지게) */
function tone(freq, { at = 0, vol = 0.08, parts = [[1, 1, 0.9]] } = {}) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + at;
  parts.forEach(([mul, amp, dur]) => {
    const o = a.createOscillator(), g = a.createGain();
    o.type = "sine"; o.frequency.value = freq * mul;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * amp, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.05);
  });
}
const bell = (f, at = 0, vol = 0.08) => tone(f, { at, vol, parts: [[1, 1, 0.9], [2.76, 0.22, 0.45], [5.4, 0.07, 0.2]] });
const marimba = (f, at = 0, vol = 0.12) => tone(f, { at, vol, parts: [[1, 1, 0.55], [4, 0.3, 0.14], [9.9, 0.06, 0.05]] });
function noiseSweep(dur, { vol = 0.05, from = 700, to = 3200 } = {}) {   // "슝" 소리
  const a = ac(); if (!a) return;
  const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime;
  f.type = "bandpass"; f.Q.value = 1.2;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.value = vol; src.buffer = buf;
  src.connect(f).connect(g).connect(a.destination); src.start(t);
}
const DTMF = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477],
  7: [852, 1209], 8: [852, 1336], 9: [852, 1477], "*": [941, 1209], 0: [941, 1336], "#": [941, 1477] };

// 알림음: 아이폰은 세 음이 올라가는 맑은 종소리
const ding = () => IOS
  ? [1318.5, 1661.2, 1975.5].forEach((f, i) => bell(f, i * 0.12, 0.07))
  : (beep(1046, 0.12, { vol: 0.08 }), beep(1568, 0.2, { vol: 0.06, at: 0.12 }));
const softDing = () => beep(1318, 0.08, { vol: 0.04 });
const sendSound = () => IOS ? noiseSweep(0.28) : softDing();                       // 보낼 때 "슝"
const recvSound = () => IOS ? (tone(880, { vol: 0.05, parts: [[1, 1, 0.12]] }), bell(1568, 0.05, 0.04)) : softDing();   // 대화 중 받을 때 "뽁"
const lockClick = () => { if (IOS) { noiseSweep(0.03, { vol: 0.08, from: 2500, to: 1800 }); tone(180, { vol: 0.05, parts: [[1, 1, 0.06]] }); } };
// 키패드: 아이폰은 실제 전화 다이얼 소리(두 음)
const keyTone = k => IOS && DTMF[k]
  ? DTMF[k].forEach(f => beep(f, 0.12, { vol: 0.035 }))
  : beep(700 + Math.random() * 600, 0.08, { vol: 0.04 });
const errTone = () => [950, 1400, 1800].forEach((f, i) => beep(f, 0.28, { type: "square", vol: 0.03, at: i * 0.33 }));
const hangupTone = () => IOS
  ? [[620, 0], [470, 0.17]].forEach(([f, at]) => beep(f, 0.13, { vol: 0.05, at }))
  : [0, 0.25, 0.5].forEach(at => beep(480, 0.15, { vol: 0.05, at }));
function loopSound(fn, period) { fn(); const id = setInterval(fn, period); return () => clearInterval(id); }
const ringback = () => loopSound(() => { beep(440, 1, { vol: 0.05 }); beep(480, 1, { vol: 0.035 }); }, 3000);
// 벨소리: 아이폰은 마림바 느낌의 짧은 멜로디(직접 지은 음)
const RING_NOTES = [[659.3, 0], [987.8, 0.15], [1318.5, 0.3], [987.8, 0.45], [830.6, 0.6], [987.8, 0.75], [1318.5, 0.9], [1480, 1.05], [1318.5, 1.35]];
const ringtone = () => loopSound(() => {
  if (IOS) RING_NOTES.forEach(([f, at]) => marimba(f, at, 0.11));
  else [0, 0.18, 0.36, 0.54, 0.9, 1.08, 1.26, 1.44].forEach((at, i) => beep(i % 2 ? 1175 : 1568, 0.15, { type: "triangle", vol: 0.07, at }));
  vibrate([400, 200, 400]);
}, IOS ? 2400 : 2600);
// 재난문자: 아이폰은 긴급 경보 표준음(853Hz + 960Hz 두 음을 겹친 소리)을 끊어서
function easAlarm(sec) {
  const a = ac(); if (!a || !sec) return () => {};
  const t = a.currentTime, g = a.createGain(), o1 = a.createOscillator(), o2 = a.createOscillator();
  o1.frequency.value = 853; o2.frequency.value = 960;
  g.gain.setValueAtTime(0, t);
  for (let x = 0; x < sec; x += 0.6) { g.gain.setValueAtTime(0.06, t + x); g.gain.setValueAtTime(0, t + x + 0.45); }
  o1.connect(g); o2.connect(g); g.connect(a.destination);
  o1.start(t); o2.start(t); o1.stop(t + sec); o2.stop(t + sec);
  return () => { try { g.gain.cancelScheduledValues(a.currentTime); g.gain.setValueAtTime(0, a.currentTime); o1.stop(); o2.stop(); } catch (e) {} };
}
function siren(sec) {
  if (IOS) return easAlarm(sec);
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
function staticBurst(sec) {                 // 통신 끊길 때 "지직" 잡음
  const a = ac(); if (!a) return;
  const len = Math.floor(a.sampleRate * sec), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) * (Math.random() < 0.08 ? 1 : 0.35);
  const src = a.createBufferSource(), g = a.createGain();
  g.gain.value = 0.07; src.buffer = buf; src.connect(g).connect(a.destination); src.start();
}
const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

/* =========================================================
   화면 쌓기 (뷰 스택)
   ========================================================= */
const viewsEl = $("#views"), sbEl = $("#statusbar"), navEl = $("#navbar"), bannerEl = $("#banner"),
      overlayEl = $("#overlay"), toastEl = $("#toast"), screenEl = $("#screen"), device = $("#device"),
      callbarEl = $("#callbar"), freezeEl = $("#freeze");
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
    (IOS
      ? `<span class="bat ios ${st.battery <= 15 ? "low" : ""}"><span class="cell"><i style="width:${st.battery}%"></i><em>${st.battery}</em></span></span></div>`
      : `<span class="bat ${st.battery <= 15 ? "low" : ""}">${st.battery}%<span class="cell"><i style="width:${st.battery}%"></i></span></span></div>`);
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
let bannerT, bannerSeq = 0, bannerHoldUntil = 0;
function showBanner(n) {
  if (!n.important && Date.now() < bannerHoldUntil) return;   // 속보 알림이 떠 있는 동안은 덮지 않음
  const seq = ++bannerSeq;
  const ms = n.important ? 6000 : 4000;           // 속보 알림은 6초
  if (n.important) bannerHoldUntil = Date.now() + ms;
  bannerEl.classList.toggle("important", !!n.important);
  bannerEl.innerHTML = ncardHTML(n);
  bannerEl.classList.remove("out"); bannerEl.hidden = false;
  layoutBanner();
  bannerEl.style.animation = "none"; void bannerEl.offsetWidth; bannerEl.style.animation = "";
  $(".ncard", bannerEl).onclick = () => { hideBanner(true); n.open && n.open(); };
  clearTimeout(bannerT);
  bannerT = setTimeout(() => {
    bannerEl.classList.add("out");
    setTimeout(() => { if (seq === bannerSeq) { bannerEl.hidden = true; bannerEl.classList.remove("out"); } }, 250);
  }, ms);
}
function hideBanner() { clearTimeout(bannerT); bannerSeq++; bannerHoldUntil = 0; bannerEl.hidden = true; }

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
  if (t && t.call) return;                    // 전체 화면 발신 통화 중에는 배너를 띄우지 않음
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
    `<h1>${esc(I.title || "")}</h1>${I.lead ? `<p class="lead">${br(I.lead)}</p>` : ""}<p>${br(I.text || "")}</p>${I.sound ? `<p class="snd">${esc(I.sound)}</p>` : ""}` +
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
      text: l ? (c.group && l.from ? `${l.from}: ${previewOf(l)}` : previewOf(l)) : "",
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
    `<div class="lockbtns"><button data-lb="flash" aria-label="손전등">${svg("flash")}</button><button data-lb="camera" aria-label="카메라">${svg("camera")}</button></div>` +
    `<button class="hint">${svg("up")}<span>${IOS ? "위로 쓸어올려 열기" : "위로 밀어서 잠금 해제"}</span></button>`);
  $$(".lockbtns button", el).forEach(b => {
    b.onclick = () => b.dataset.lb === "flash" ? b.classList.toggle("on") : toast((S.appMessages && S.appMessages.camera) || "카메라를 시작할 수 없습니다.");
  });
  wallpaper(el);
  const entry = { el, lock: true };
  entry.tick = () => { $(".clock", el).textContent = clock12(now()); $(".date", el).textContent = dateLabel(now()); };
  entry.refresh = () => {
    const list = st.lockNotis, box = $(".notis", el);
    const render = max => {
      box.innerHTML = list.slice(0, max).map(ncardHTML).join("") +
        (list.length > max ? `<div class="more">알림 ${list.length - max}개 더</div>` : "");
      $$(".ncard", box).forEach((b, i) => { b.onclick = () => unlock(list[i].open); });
    };
    // 화면 높이에 들어가는 만큼만 카드로 보여주고, 나머지는 "알림 N개 더"
    let max = 4;
    render(max);
    box.style.justifyContent = "flex-start";          // 잴 때만 위에서부터 쌓기 (아이폰은 아래에서부터 쌓아서 위로 넘친 건 안 잡힘)
    while (box.isConnected && max > 1 && box.scrollHeight > box.clientHeight + 1) render(--max);
    box.style.justifyContent = "";
  };
  requestAnimationFrame(() => entry.refresh());
  // 위로 밀어서 잠금 해제
  let y0 = null, dy = 0;
  el.addEventListener("pointerdown", e => { if (e.target.closest(".ncard, .hint, .lockbtns")) return; y0 = e.clientY; dy = 0; });
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
  lockClick();
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
    `<div class="ios-search">${svg("search")}<span>검색</span></div>` +
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
const isPhoto = m => !!(m && (m.photo || m.img));
const previewOf = m => (m ? (isPhoto(m) ? "사진" : (m.text || "")) : "");

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
        `<div class="pv">${esc(previewOf(l))}</div></span><span class="rt"><span>${esc(chatTimeLabel(c))}</span>` +
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

/* 말풍선 아래 이모지 반응: reactions: { "❤️": 3, "👍": 2 } */
const reactsHTML = m => {
  const r = m.reactions; if (!r) return "";
  const list = Array.isArray(r) ? r.map(x => (Array.isArray(x) ? x : [x, 1])) : Object.entries(r);
  return `<div class="reacts">${list.map(([e, n]) => `<span>${esc(e)}${n > 1 ? `<b>${n}</b>` : ""}</span>`).join("")}</div>`;
};
/* 말풍선 한 개: 사진 / 알림톡(button) / 글자 */
function bubbleHTML(m, i) {
  if (isPhoto(m)) {
    const bg = m.img ? `background-image:url('${esc(m.img)}')` : `background-color:${esc(m.color || "#8a8f99")}`;
    return `<button class="bub photo" data-photo="${i}" style="${bg}" aria-label="${esc(m.photo || "사진")}">${m.img ? "" : `<span>${esc(m.photo)}</span>`}</button>`;
  }
  if (m.button || m.alimtalk) {
    return `<div class="bub alim"><div class="alimhd">알림톡</div><div class="alimbd">${esc(m.text)}</div>` +
      `${m.button ? `<button class="alimbtn">${esc(m.button)}</button>` : ""}</div>`;
  }
  return `<div class="bub">${esc(m.text)}</div>`;
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
    const cls = `${m.fresh ? "new" : ""} ${m.button || m.alimtalk ? "alim" : ""}`;
    if (m.me) {
      const mark = m.failed ? `<span class="fail">! 전송 실패</span>` : (!m.read ? `<span class="rd">1</span>` : "");
      out += `<div class="m me ${cls}"><div class="stack">${bubbleHTML(m, i)}${reactsHTML(m)}</div><div class="meta">${mark}${time}</div></div>`;
    } else if (c.app === "sms") {
      out += `<div class="m ${cls}"><div class="stack">${bubbleHTML(m, i)}${reactsHTML(m)}</div><div class="meta">${time}</div></div>`;
    } else {
      out += `<div class="m ${cont ? "cont" : ""} ${cls}"><div class="avs">${avatar(sender, "sm")}</div>` +
        `<div class="stack"><div class="who">${esc(sender)}</div>${bubbleHTML(m, i)}${reactsHTML(m)}</div><div class="meta">${time}</div></div>`;
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
    (c.noInput
      ? `<div class="noinput">이 채널에서는 메시지를 보낼 수 없습니다</div>`
      : `<form class="composer"><input placeholder="${sms ? "문자 메시지" : "메시지 입력"}" enterkeyhint="send" autocomplete="off">` +
        `<button disabled aria-label="보내기">${svg("send")}</button></form>`), { light: true });
  const entry = { el, light: true, id: "chat:" + c.id };
  const sc = $(".scroll", el), box = $(".msgs", el);
  entry.refresh = () => {
    c.unread = 0;
    box.innerHTML = renderMsgs(c);
    sc.scrollTop = sc.scrollHeight;
  };
  // 사진 누르면 크게, 알림톡 버튼은 연결 불가
  box.onclick = e => {
    const p = e.target.closest("[data-photo]");
    if (p) { const m = c.messages[+p.dataset.photo]; photoView({ img: m.img, color: m.color, caption: m.photo }); return; }
    if (e.target.closest(".alimbtn")) toast("연결할 수 없습니다");
  };
  const form = $(".composer", el);
  if (form) {
    const input = $("input", form), btn = $("button", form);
    input.oninput = () => { btn.disabled = !input.value.trim(); };
    form.onsubmit = e => {
      e.preventDefault();
      const text = input.value.trim(); if (!text) return;
      input.value = ""; btn.disabled = true;
      sendMsg(c, text);
    };
  }
  push(entry);
  update();
  return entry;
}

/* ---------- 답장 고르기 ----------
   1) 방의 replyRules 중 단어를 직접 지정한 규칙
   2) 전역 STORY.replyRules 를 순서대로 (= 보낸 말의 "뜻") — 그 방에 같은 이름의 규칙(match: "이름")이 있으면 그 방 말투로
   3) 방의 replies[순서] — 단, 이미 말한 것(누구랑 / 어디)을 다시 묻는 답은 건너뜀
   4) fallback(방 → 전역) 중 랜덤
   규칙으로 답했을 때는 이야기 진행(c.sent)을 올리지 않음 */
const RULES = S.replyRules || [];
const squash = s => String(s || "").replace(/\s+/g, "");
function ruleHit(rule, text, depth = 0) {
  const t = squash(text);
  if (rule.exact && [].concat(rule.exact).some(x => squash(x) === t)) return true;
  const m = rule.match;
  if (typeof m === "string") {                       // "swear" 처럼 전역 규칙 이름
    const g = depth < 3 && RULES.find(r => r.name === m);
    return !!g && ruleHit(g, text, depth + 1);
  }
  if (rule.re && new RegExp(rule.re).test(String(text))) return true;
  return Array.isArray(m) && m.some(x => squash(x) && t.includes(squash(x)));
}
/* 내가 이미 말한 것 기억: 누구랑 있는지 / 어디 있는지 */
const SAID_WHO = /(?<!사)랑(\s|$|\s*(같이|있))|같이\s*있|함께|둘이|셋이|혼자|하고\s*있/;
const SAID_WHERE = /집|자취|방이|방에|학교|긱사|기숙사|지하|대피소|주차장|역에|역이/;
const ASK_WHO = /누구랑|혼자야|혼자 있|혼자면|혼자니/;
const ASK_WHERE = /어디|자취방이지|집이지/;
function rememberFacts(c, text) {
  c.known = c.known || {};
  if (SAID_WHO.test(text)) c.known.who = true;
  if (SAID_WHERE.test(text)) c.known.where = true;
}
/* "응 / ㅇㅇ / 아니" 같은 짧은 대답은 상대가 바로 전에 물은 말에 맞춰 뜻을 정함
   (예: 민지 "자취방이야?" → 나 "ㅇㅇ" = 자취방에 있음 → imHome) */
const YES_RE = /^(응|ㅇㅇ|ㅇ|어|웅|엉|ㅇㅋ|오키|맞아|그래|넹|네|넵|응응|ㅇㅇㅇ|어어|웅웅|맞음)[.!~ㅠㅜ]*$/;
const NO_RE = /^(아니|ㄴㄴ|아니야|아닌데|노|놉|ㄴ|아냐|아님|아니요)[.!~ㅠㅜ]*$/;
const CONTEXT = [                                      // 상대 질문에 이 말이 있으면 → [응일 때, 아니일 때]
  { q: /말 ?못 ?하는|말을 ?못/, yes: "cantTalk", no: "canTalk" },   // 전화에서 아무 말도 안 했을 때
  { q: /자취방|집이|집에|방이|방에/, yes: "imHome", no: "askBackWhere" },
  { q: /혼자/, yes: "alone", no: "withSomeone" },
  { q: /괜찮|다친|무사/, yes: "fine", no: "hurt" },
  { q: /지하|내려갔|대피했|대피소/, yes: "imSafe", no: "imHome" },
  { q: /만날까|올래|올 수|오는|올수|와\?/, yes: "going", no: "cant" },
  { q: /피난|도망/, yes: "evacYes", no: "evacNo" },
  { q: /봤어|알아|들었어/, yes: "whatsHappening", no: "whatsHappening" }
];
const isQuestion = t => /\?\s*$|(지|니|냐|까|래\?)\s*$/.test(String(t).trim());   // ? 로 끝나거나 ~지/~니/~냐/~까
function contextIntent(c, text) {
  const t = squash(text);
  const yes = YES_RE.test(t), no = NO_RE.test(t);
  if (!yes && !no) return null;
  // 내가 마지막으로 말한 뒤에 상대가 보낸 말들 중, 가장 최근의 질문 (예: "야 니 집이냐?" 뒤에 "아 ㅅㅂ제발" 이 와도 질문 쪽으로)
  const block = [];
  for (const m of c.messages.slice(0, -1).reverse()) {      // 맨 끝(방금 보낸 내 말)은 빼고
    if (m.day) continue;
    if (m.me) break;
    if (m.text) block.push(m);
  }
  const last = block.find(m => isQuestion(m.text) && CONTEXT.some(x => x.q.test(m.text)));
  if (!last) return null;
  const hit = CONTEXT.find(x => x.q.test(last.text));
  // "혼자 있는 거 아니지?" 에 "ㅇㅇ" = 혼자 아님 (반대로 읽기). "~가야 하는 거 아니야??" 는 권유라서 그대로
  const negQ = /아니지|아니죠|않지|않았지/.test(last.text);
  return (yes !== negQ) ? hit.yes : hit.no;
}
// 이미 내가 답했거나, 상대가 이미 한 번 물어본 질문이면 이야기 진행용 답에서 다시 묻지 않음
const askedBefore = (c, re) => c.messages.some(m => !m.me && !m.day && re.test(m.text || ""));
const asksKnown = (c, variant) => [].concat(variant).some(m => {
  const t = typeof m === "string" ? m : (m && m.text) || "";
  return (ASK_WHO.test(t) && (c.known.who || askedBefore(c, ASK_WHO))) ||
         (ASK_WHERE.test(t) && (c.known.where || askedBefore(c, ASK_WHERE)));
});
function pickReply(c, text) {
  if (st.down || c.sendFail || c.neverRead || c.noReply || c.noInput) return null;
  const variantsOf = r => (c.group && r.groupReplies) || r.replies || [];
  const take = (key, list) => {                      // 같은 규칙이 또 걸리면 다음 변형, 끝나면 처음으로
    if (!list.length) return null;
    const i = c.ruleIdx[key] || 0;
    c.ruleIdx[key] = i + 1;
    return list[i % list.length];
  };
  const R = (S.stranger || {}).reveal;
  if (!c.stranger && c.strangerTalk && R && ruleHit(R, text)) {   // 문자로 "이 폰 주웠어요" 라고 밝힘
    c.stranger = true;
    const v = c.strangerTalk.reveal || R.replies;
    return v && v.length ? v[0] : null;
  }
  if (c.stranger) {                                   // 통화로 목소리를 들어서 폰 주인이 아닌 걸 아는 사람
    const X = c.strangerTalk || {}, G = S.stranger || {};
    for (const r of G.rules || []) {
      const hit = (r.like || []).some(n => { const g = RULES.find(x => x.name === n); return g && ruleHit(g, text); }) ||
                  ((r.match || r.exact || r.re) && ruleHit(r, text));
      if (!hit) continue;
      const mine = (X.rules || []).find(x => x.match === r.name);
      const v = take("s:" + r.name, variantsOf(mine || r));
      if (v) return v;
    }
    const story = X.replies || [];
    c.sSent = c.sSent || 0;
    if (c.sSent < story.length) return story[c.sSent++];
    const fb = X.fallback || G.fallback || [];
    return fb.length ? fb[Math.floor(Math.random() * fb.length)] : null;
  }
  const own = c.replyRules || [];
  // 0) 짧은 대답이면 앞 질문에 맞춘 뜻으로
  const ctx = contextIntent(c, text);
  if (ctx) {
    if (ctx === "imHome" || ctx === "imSafe") c.known.where = true;
    if (ctx === "alone" || ctx === "withSomeone") c.known.who = true;
    const r = own.find(x => x.match === ctx) || RULES.find(x => x.name === ctx);
    const v = r && take("g:" + ctx, variantsOf(r));
    if (v) return v;
  }
  for (let i = 0; i < own.length; i++) {
    if (typeof own[i].match !== "string" && ruleHit(own[i], text)) { const v = take("room" + i, variantsOf(own[i])); if (v) return v; }
  }
  for (let i = 0; i < RULES.length; i++) {
    const r = RULES[i];
    if (!ruleHit(r, text)) continue;
    const mine = r.name && own.find(x => x.match === r.name);       // 이 방 사람 말투
    const v = take("g:" + ((mine && mine.share) || r.name || i), variantsOf(mine || r));   // share: 다른 규칙과 답 순서 같이 씀
    if (v) return v;
  }
  const story = c.replies || [];
  while (c.sent < story.length) {
    const v = story[c.sent++];
    if (!asksKnown(c, v)) return v;                                  // 이미 답한 걸 또 묻지 않기
  }
  const fb = (c.fallback && c.fallback.length ? c.fallback : S.fallback) || [];
  return fb.length ? fb[Math.floor(Math.random() * fb.length)] : null;
}
/* 답하는 사람: 1:1 은 그 사람, 단체방은 그 방에서 말한 적 있는 사람 중 랜덤 */
function replyFromFor(c) {
  if (c.replyFrom) return c.replyFrom;
  const ppl = [...new Set(c.messages.filter(m => !m.day && !m.me && m.from).map(m => m.from))];
  if (!c.group) return ppl[ppl.length - 1] || c.title;
  return ppl.length ? ppl[Math.floor(Math.random() * ppl.length)] : c.title;
}

function sendMsg(c, text) {
  const m = { me: true, text, time: hhmm(now()), live: true, fresh: true, read: false };
  c.messages.push(m); bump(c);
  if (st.down || c.sendFail) {
    m.failed = true;
    toast(st.down ? "네트워크에 연결되어 있지 않아\n메시지를 보내지 못했습니다." : "메시지를 보내지 못했습니다.");
    update(); return;
  }
  sendSound();
  rememberFacts(c, text);
  update();
  const reps = pickReply(c, text);
  if (!reps) return;
  replyFlow(c, Array.isArray(reps) ? reps : [reps]);
}

/* 한 방의 답장·이야기 문자는 차례로: 답하는 도중에 온 문자는 답이 끝난 뒤에 이어서 */
function queueInChat(c, job) {
  c.q = (c.q || 0) + 1;
  c.flow = (c.flow || Promise.resolve()).then(job).catch(() => {}).then(() => { c.q--; });
}
function replyFlow(c, reps) { queueInChat(c, () => runReply(c, reps)); }
/* 통화가 끝난 뒤: 말했으면 그 사람(들)은 폰 주인이 아닌 걸 알게 되고, 결과에 맞는 문자(after)가 옴 */
function callOutcome(ev, outcome) {
  const cs = [].concat(ev.chats || ev.chat || []).map(chatById).filter(Boolean);
  if (outcome === "spoke") cs.forEach(c => { c.stranger = true; });
  const msgs = (ev.after || {})[outcome] || [];
  const c = cs[0];
  if (!c || !msgs.length) return;
  queueInChat(c, async () => {
    await sleep(2500);
    for (const m of msgs) {
      if (st.dead || st.off) return;
      const msg = typeof m === "string" ? { text: m } : m;
      receive(c, { from: msg.from || ev.from || c.title, text: msg.text });
      await sleep(1400 + String(msg.text).length * 45);
    }
  });
}
async function runReply(c, reps) {
  await sleep(600 + Math.random() * 700);
  if (st.off || st.down) return;
  c.messages.forEach(m => { if (m.me && !m.failed) m.read = true; });
  update();
  const who = replyFromFor(c);
  for (const r of reps) {
    const msg = typeof r === "string" ? { text: r } : r;
    const from = msg.from || who;
    await sleep(250);
    c.typing = true; c.typingFrom = from; update();
    await sleep(Math.min(1800, 350 + String(msg.text).length * 35));
    c.typing = false;
    if (st.off) return;
    receive(c, { from, text: msg.text });
  }
}

function receive(c, { from, text }) {
  if (st.off || st.dead) return;                       // 먹통 뒤에는 아무것도 들어오지 않음
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
  } else recvSound();
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
  pauseTimeline();
  arm();
  st.stopSiren && st.stopSiren();
  st.stopSiren = siren(ev.sound === false ? 0 : (ev.sec || 6));
  vibrate([500, 200, 500, 200, 500, 200, 800]);
  screenEl.classList.remove("shake"); void screenEl.offsetWidth; screenEl.classList.add("shake");
  $("button", overlayEl).onclick = () => { overlayEl.hidden = true; st.stopSiren && st.stopSiren(); st.stopSiren = null; resumeTimeline(); };
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
      $$(".keys button", body).forEach(b => { b.onclick = () => { if (dialed.length < 13) dialed += b.dataset.k; keyTone(b.dataset.k); renderDial(); }; });
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
  if (st.inCall) { toast("통화 중입니다."); return; }
  const who = resolve(target);
  const key = who.name || digits(who.number);
  const scripts = S.callScripts || {};
  let sc = scripts[who.name] || scripts[who.number] || scripts[digits(who.number)];
  const n = st.callCount[key] = (st.callCount[key] || 0) + 1;
  if (sc && n > 1 && sc.again) sc = sc.again;
  const script = sc ? { ...sc, onEnd: o => callOutcome({ ...sc, from: who.name }, o) } : {};
  callScreen({ who, script });
}

/* 대사 재생 — 발신 화면과 수신 배너가 함께 씀 */
async function speakLines(lines, line, wait) {
  for (const l of lines || []) {
    if (typeof l === "string") { await wait(300); line(l); await wait(900 + l.length * 55); }
    else if (l.me) { await wait(300); line(l.me, "me"); await wait(800 + l.me.length * 50); }
    else if (l.sys) { line(l.sys, "sys"); await wait(1500); }
    else if (l.wait) await wait(l.wait);
  }
}
const callTimer = since => { const s = Math.floor((Date.now() - since) / 1000); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };

/* ---------- 통화 화면(전체 화면): 내가 거는 전화, 그리고 걸려 온 전화를 받았을 때 ---------- */
function callScreen({ who, script, incoming = false }) {
  st.inCall = true;
  const disp = who.name || who.number;
  // 주운 폰 컨셉: silent/spoke 대사가 있는 전화는 say(내가 하는 말)가 있으면 말하고, 없으면 침묵
  const interactive = !!(script.silent || script.spoke);
  const el = makeView("callscr",
    `<div class="st"></div><div class="nm">${esc(disp)}</div>` +
    `<div class="no">${esc(who.name ? (who.number || "") : "저장되지 않은 번호")}</div>` +
    `${who.name ? avatar(disp, "lg") : iconAv("user", "#5b6475", "lg")}<div class="sub"></div>` +
    `<div class="cgrid">${[["mic", "소리 끔"], ["keypad", "키패드"], ["speaker", "스피커"], ["plus", "통화 추가"], ["video", "영상 통화"], ["user", "연락처"]]
      .map(([i, l]) => `<button><i>${svg(i)}</i><span>${l}</span></button>`).join("")}</div>` +
    `<div class="btns"></div>`);
  $$(".cgrid button", el).forEach(b => { b.onclick = () => b.classList.toggle("on"); });
  const tok = { dead: false };
  let stopRing = null, timerInt = null, connectedAt = null, finished = false, said = null;
  const entry = {
    el, call: true, noNav: true,
    onClose: () => { tok.dead = true; stopRing && stopRing(); clearInterval(timerInt); st.inCall = false; st.callEndedAt = Date.now(); st.dropCall = null; }
  };
  const stEl = $(".st", el), sub = $(".sub", el), btns = $(".btns", el);
  const wait = async ms => { await sleep(ms); if (tok.dead) throw tok; };
  const line = (text, cls = "") => {
    const all = $$(".ln", sub);
    all.forEach((x, i) => { if (all.length - i > 1) x.classList.add("old"); });
    sub.insertAdjacentHTML("beforeend", `<div class="ln ${cls}">${esc(text)}</div>`);
    while (sub.children.length > 5) sub.firstElementChild.remove();
  };
  // outcome: "spoke"(말함) · "silent"(끝까지 말 안 함) · "hungup"(말 안 하고 내가 끊음)
  function finish(outcome) {
    if (finished) return;
    finished = true; tok.dead = true;
    const o = outcome || (said ? "spoke" : "hungup");
    if (connectedAt && script.onEnd) setTimeout(() => script.onEnd(o), 0);
    stopRing && stopRing(); stopRing = null; clearInterval(timerInt);
    st.calls.unshift({ name: disp, dir: incoming ? "in" : "out", time: hhmm(now()), length: connectedAt ? durText(Date.now() - connectedAt) : "" });
    stEl.textContent = "통화 종료"; btns.innerHTML = "";
    hangupTone();
    setTimeout(() => removeEntry(entry), 1300);
  }
  // 통신망이 끊기면 통화도 끊김
  st.dropCall = () => {
    if (finished) return;
    tok.dead = true; stopRing && stopRing(); stopRing = null; clearInterval(timerInt);
    line(CFG.callDropped || "통화가 끊겼습니다.", "sys"); errTone();
    setTimeout(() => finish(said ? "spoke" : "silent"), 1500);
  };
  btns.innerHTML = `<button class="callbtn end" aria-label="통화 종료">${svg("phone")}</button>`;
  $(".callbtn", btns).onclick = () => finish();
  async function talk() {                              // 연결된 뒤: 상대가 말함 → 내가 말하거나(say) 침묵 → 반응
    await speakLines(script.lines, line, wait);
    if (script.say) {                                  // 목소리를 들으면 "누구세요?"
      await wait(1200);
      said = script.say; line(said, "me");
      await wait(900 + said.length * 50);
      await speakLines(script.spoke, line, wait);
    } else {                                           // 아무 말도 안 하면 "왜 아무 말도 안 해…"
      await wait(2600);
      await speakLines(script.silent, line, wait);
      await wait(900);
    }
    await wait(800);
    line("상대방이 통화를 끊었습니다.", "sys");
    await wait(1000);
    finish(said ? "spoke" : "silent");
  }
  const startTimer = () => {
    connectedAt = Date.now();
    stEl.textContent = callTimer(connectedAt);
    timerInt = setInterval(() => { stEl.textContent = callTimer(connectedAt); }, 500);
  };
  async function run() {
    if (incoming) {                                   // 받은 전화: 바로 통화 시작
      startTimer();
      if (interactive) return talk();
      await speakLines(script.lines, line, wait);
      await wait(800);
      line("상대방이 통화를 끊었습니다.", "sys");
      await wait(1000);
      return finish();
    }
    stEl.textContent = "발신 중…";
    if (st.down) {
      await wait(1200); line(CFG.noService || "서비스 지역이 아닙니다.", "sys"); errTone();
      await wait(2600); return finish();
    }
    stopRing = ringback();
    await wait(script.ring ?? 4000);
    stopRing(); stopRing = null;
    if (script.fail || !(script.lines && script.lines.length)) {
      stEl.textContent = "연결 안 됨";
      line(script.fail || CFG.callFail || "연결할 수 없습니다.", "sys"); errTone();
      await wait(3500); return finish();
    }
    startTimer();
    if (interactive) return talk();
    await speakLines(script.lines, line, wait);
    await wait(1500);
    finish();
  }
  push(entry);
  run().catch(() => {});
  return entry;
}

/* ---------- 걸려 오는 전화: 울리는 동안은 화면 위 배너 ----------
   배너는 화면 스택과 따로 떠 있어서 울리는 동안에도 아래 화면을 계속 쓸 수 있음.
   받으면 전체 화면 통화(callScreen)로 바뀜 */
let activeCall = null, callbarSeq = 0;
function layoutBanner() {          // 메시지 알림 배너가 통화 배너와 겹치지 않게 그 아래로
  bannerEl.style.top = callbarEl.hidden ? "" : `${callbarEl.offsetTop + callbarEl.offsetHeight + 6}px`;
}
function hideCallbar(delay) {
  const seq = callbarSeq;
  setTimeout(() => {
    if (seq !== callbarSeq) return;
    callbarEl.classList.add("out");
    setTimeout(() => {
      if (seq !== callbarSeq) return;
      callbarEl.hidden = true; callbarEl.classList.remove("out"); layoutBanner();
    }, 250);
  }, delay);
}
function incomingCall({ who, script, ring, onMiss }) {
  st.inCall = true;
  callbarSeq++;
  const disp = who.name || who.number;
  const tok = { dead: false };
  let stopRing = null, finished = false;
  callbarEl.innerHTML =
    `<div class="cb-card ringing"><div class="cb-row">${who.name ? avatar(disp, "sm") : iconAv("user", "#5b6475", "sm")}` +
    `<div class="cb-info"><b>${esc(disp)}</b><span class="cb-st">수신 전화</span></div>` +
    `<div class="cb-btns"><button class="cb-btn no" data-a="no" aria-label="거절">${svg("phone")}</button>` +
    `<button class="cb-btn yes" data-a="yes" aria-label="받기">${svg("phone")}</button></div></div></div>`;
  callbarEl.classList.remove("out"); callbarEl.hidden = false;
  callbarEl.style.animation = "none"; void callbarEl.offsetWidth; callbarEl.style.animation = "";
  layoutBanner();
  const btns = $(".cb-btns", callbarEl);
  function end(dir) {                                  // 안 받음 · 거절
    if (finished) return;
    finished = true; tok.dead = true;
    stopRing && stopRing(); stopRing = null;
    st.calls.unshift({ name: disp, dir, time: hhmm(now()), length: "" });
    st.inCall = false; st.callEndedAt = Date.now(); activeCall = null;
    hideCallbar(0);
    update();
  }
  activeCall = {                                       // 전원 꺼짐 · 먹통 등으로 강제 종료
    cancel: () => {
      if (finished) return;
      finished = true; tok.dead = true; tok.cancel && tok.cancel();
      stopRing && stopRing();
      st.inCall = false; st.callEndedAt = Date.now(); activeCall = null; callbarSeq++; callbarEl.hidden = true; layoutBanner();
    }
  };
  async function run() {
    stopRing = ringtone();
    const choice = await new Promise(res => {
      const t = setTimeout(() => res("timeout"), ring || 12000);
      btns.onclick = e => { const b = e.target.closest("[data-a]"); if (!b) return; clearTimeout(t); res(b.dataset.a); };
      tok.cancel = () => { clearTimeout(t); res("dead"); };
    });
    stopRing && stopRing(); stopRing = null; btns.onclick = null;
    if (tok.dead || choice === "dead") return;
    if (choice === "yes") {                            // 받으면 배너를 닫고 전체 화면으로
      finished = true; activeCall = null;
      callbarSeq++; callbarEl.hidden = true; layoutBanner();
      callScreen({ who, script, incoming: true });
      return;
    }
    // 안 받거나 거절하면: 잠시 뒤 그 사람이 문자를 보냄 (ifMissed)
    if (onMiss && onMiss.text) {
      setTimeout(() => {
        if (st.dead) return;
        const from = onMiss.from || disp;
        const c = chatById(onMiss.chat) || newChat({ chat: onMiss.chat || disp, from });
        receive(c, { from, text: onMiss.text });
      }, 4000);
    }
    if (choice === "no") return end("rejected");
    end("missed");
    st.missedNew++;
    notify({ key: "missed", app: "phone", title: "부재중 전화", text: disp, open: () => phoneApp("recent") });
    update();
  }
  run().catch(() => {});
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
    `<div class="psearch"><span class="logo" aria-label="${esc(N.portal || "뉴스")}">N</span><form><input placeholder="검색어를 입력하세요" enterkeyhint="search"><button>검색</button></form></div>` +
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
    `<div class="scroll"><div class="sect">공지사항</div><div class="list"></div></div>`, { sbBg: "#a6192e", navBg: "#fff" });
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
  const el = makeView("mapapp",
    `<header class="appbar">${BACK}<h1>${esc(M.title || "지도")}</h1></header>` +
    `<div class="mapbox">${sh.map((s, i) => `<div class="pin" style="left:${s.x ?? 50}%;top:${s.y ?? 50}%"><i><b>${i + 1}</b></i></div>`).join("")}` +
    `<div class="pin me" style="left:50%;top:52%"><i></i><span>내 위치</span></div></div>` +
    (M.source ? `<div class="mapsrc">${esc(M.source)}</div>` : "") +
    `<div class="scroll"><div class="list">${sh.map((s, i) =>
      `<div class="row shel"><button class="shel-main" data-i="${i}"><span class="ic2">${i + 1}</span><span class="mid"><div class="nm">${esc(s.name)}</div>` +
      `<div class="pv">${esc([s.dist, s.addr, s.note].filter(Boolean).join(" · "))}</div></span></button></div>`).join("")}</div></div>`,
    { light: true });
  // 대피소를 누르면 이름 + 주소
  $$(".shel-main", el).forEach(b => {
    b.onclick = () => { const s = sh[+b.dataset.i]; toast(`${s.name}\n${s.addr || ""}`); };
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
  if (st.off || st.ending) return;
  st.off = true;
  hideBanner(); overlayEl.hidden = true; toastEl.hidden = true;
  activeCall && activeCall.cancel();
  st.dropCall && st.dropCall();
  st.stopSiren && st.stopSiren();
  const el = makeView("off", `<div>${br(CFG.shutdown || "전원이 꺼집니다.")}</div>`);
  setRoot({ el, noNav: true });
  sbEl.hidden = true;
  setTimeout(showEnding, 3000);                        // "전원이 꺼집니다" 다음 엔딩으로
}

/* =========================================================
   마무리 엔딩 (settings.ending)
   화면이 꺼지듯 까매지고 → 문장이 한 줄씩 → final(크게) → after_final → credit → 다시 보기
   화면을 누르면 다음 줄이 바로 나옴. 뒤로가기·Esc 로는 닫히지 않음
   ========================================================= */
function showEnding() {
  if (st.ending) return;
  st.ending = true;
  const E = CFG.ending || {};
  const GAP = 2800;
  // 하던 것 모두 멈춤: 지직거림, 사이렌, 벨소리, 알림
  clearTimeout(glitch.t); screenEl.classList.remove("glitch", "shake");
  hideBanner(); toastEl.hidden = true; overlayEl.hidden = true;
  st.stopSiren && st.stopSiren(); st.stopSiren = null;
  activeCall && activeCall.cancel();
  document.activeElement && document.activeElement.blur && document.activeElement.blur();
  arm();                                               // 휴대폰 뒤로가기를 눌러도 사이트를 나가지 않게
  const el = toEl(`<div class="ending" role="dialog" aria-label="엔딩"><div class="ending-inner"></div></div>`);
  const box = $(".ending-inner", el);
  screenEl.appendChild(el);
  void el.offsetWidth; el.classList.add("on");          // 약 2초에 걸쳐 까맣게
  const items = [
    ...(E.lines || []).map(t => ({ t, cls: "" })),
    E.final ? { t: E.final, cls: "final" } : null,
    E.after_final ? { t: E.after_final, cls: "after" } : null
  ].filter(Boolean);
  let i = 0, timer = null, started = false, done = false;
  const reveal = node => { box.appendChild(node); void node.offsetWidth; node.classList.add("show"); el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); };
  function next() {
    clearTimeout(timer);
    if (done) return;
    if (i < items.length) {
      $$(".eline:not(.final)", box).forEach(x => x.classList.add("dim"));   // 이전 줄은 흐리게 (final 은 그대로)
      const it = items[i++];
      reveal(toEl(`<p class="eline ${it.cls}">${br(it.t)}</p>`));
      timer = setTimeout(next, GAP);
      return;
    }
    done = true;
    if (E.credit) reveal(toEl(`<p class="ending-credit">${esc(E.credit)}</p>`));
    const btn = toEl(`<button class="ending-replay">${esc(E.replayText || "↻ 처음부터 다시 보기")}</button>`);
    btn.onclick = () => location.reload();
    setTimeout(() => reveal(btn), E.credit ? 900 : 0);
  }
  el.addEventListener("pointerdown", e => {             // 탭하면 다음 줄
    if (e.target.closest(".ending-replay") || !started) return;
    next();
  });
  setTimeout(() => { started = true; next(); }, 1600);  // 화면이 거의 다 꺼지면 첫 줄
}

/* =========================================================
   통신망 폭격 → 먹통 (이야기의 마지막)
   화면이 지직거리고, 무엇을 눌러도 로딩만 돌다 "응답 없음". 앱이 열리지 않음
   ========================================================= */
function glitch(ms) {
  screenEl.classList.remove("glitch"); void screenEl.offsetWidth;
  screenEl.classList.add("glitch");
  clearTimeout(glitch.t); glitch.t = setTimeout(() => screenEl.classList.remove("glitch"), ms);
}
function blackout() {
  if (st.dead || st.off) return;
  st.dead = true; st.down = true; st.signal = 0;
  hideBanner(); toastEl.hidden = true;
  overlayEl.hidden = true; st.stopSiren && st.stopSiren(); st.stopSiren = null;
  activeCall && activeCall.cancel();                   // 울리던 전화는 사라짐
  st.dropCall && st.dropCall();                        // 통화 중이면 끊김
  chats.forEach(c => { c.typing = false; });
  document.activeElement && document.activeElement.blur && document.activeElement.blur();
  glitch(1700); staticBurst(1.1); vibrate([300, 80, 300, 80, 900]);
  screenEl.classList.add("dead");
  freezeEl.hidden = false;                             // 이제부터 화면을 눌러도 아무것도 열리지 않음
  update();
  const again = () => {                                // 가끔씩 화면이 다시 지직거림 (엔딩이 시작되면 멈춤)
    if (st.off || st.ending) return;
    glitch(160 + Math.random() * 380);
    if (Math.random() < 0.4) staticBurst(0.25);
    setTimeout(again, 5000 + Math.random() * 7000);
  };
  setTimeout(again, 4500);
  const E = CFG.ending || {};
  setTimeout(showEnding, (E.after ?? 15) * 1000);       // 먹통으로 after초 → 엔딩 (실제 시간 기준)
}
// 먹통일 때 화면을 누르면: 그 자리에서 로딩만 돌다가 "응답 없음"
let freezeToastAt = 0;
freezeEl.addEventListener("pointerdown", e => {
  e.preventDefault();
  const r = freezeEl.getBoundingClientRect(), k = r.width / (freezeEl.offsetWidth || r.width) || 1;
  const sp = document.createElement("i");
  sp.className = "tapspin";
  sp.style.left = `${(e.clientX - r.left) / k}px`; sp.style.top = `${(e.clientY - r.top) / k}px`;
  freezeEl.appendChild(sp);
  setTimeout(() => sp.remove(), 1500);
  if (Date.now() - freezeToastAt > 1800) {
    freezeToastAt = Date.now();
    setTimeout(() => toast((CFG.blackout && CFG.blackout.tapText) || "응답 없음"), 1100);
  }
});
freezeEl.addEventListener("wheel", e => e.preventDefault(), { passive: false });

/* =========================================================
   시간 흐름 (timeline)
   ========================================================= */
let tlStart = 0;
// at: 90 (초) 또는 "1:30" (분:초)
const CALL_GAP_MS = 8000;
const toSec = v => typeof v === "string" && v.includes(":") ? v.split(":").reduce((a, x) => a * 60 + Number(x), 0) : Number(v) || 0;
const timeline = (S.timeline || []).map(e => ({ ...e, at: toSec(e.at) })).sort((a, b) => a.at - b.at);
// 재난문자 창이 떠 있는 동안은 이야기 시간이 멈춤 (창 뒤에 가려진 채로 속보·문자가 지나가지 않게)
const elapsed = () => ((st.pausedAt || Date.now()) - tlStart) / 1000 * SPEED;
function pauseTimeline() { if (st.started && !st.pausedAt) st.pausedAt = Date.now(); }
function resumeTimeline() { if (st.pausedAt) { tlStart += Date.now() - st.pausedAt; st.pausedAt = 0; } }

function newChat(ev) {
  const c = { id: ev.chat, app: ev.app || "talk", title: ev.title || ev.from || ev.chat, group: !!ev.group,
    messages: [], unread: 0, sent: 0, rank: 0, replies: ev.replies || [], typing: false, ruleIdx: {}, known: {} };
  chats.push(c);
  return c;
}

function runEvent(ev) {
  switch (ev.type) {
    case "message": {
      const c = chatById(ev.chat) || newChat(ev);
      const text = c.stranger && "strangerText" in ev ? ev.strangerText : ev.text;   // 통화로 목소리를 들은 사람은 다르게
      if (!text) break;
      const msg = { from: ev.from || c.title, text };
      if (c.q) queueInChat(c, () => sleep(900).then(() => receive(c, msg)));   // 그 방에서 답하는 중이면 끝난 뒤에
      else receive(c, msg);
      break;
    }
    case "alert": showAlert(ev); break;
    case "call": {
      // 이미 폰 주인이 아닌 걸 아는 사람이면 known 대사(없으면 stranger.call 공통 대사)
      const known = [].concat(ev.chats || ev.chat || []).some(id => { const c = chatById(id); return c && c.stranger; });
      const K = known ? (ev.known || (S.stranger || {}).call) : null;
      const src = K || ev;
      const onMiss = K ? (ev.ifMissed && K.missedText ? { ...ev.ifMissed, text: K.missedText } : null) : ev.ifMissed;
      incomingCall({ who: resolve(ev.from || ev.number), ring: ev.ring, onMiss,
        script: { lines: src.lines || [], say: src.say, silent: src.silent, spoke: src.spoke, onEnd: o => callOutcome(K ? { ...ev, after: K.after || {} } : ev, o) } });
      break;
    }
    case "news": {
      const a = st.articles.find(x => x.id === ev.id); if (!a) break;
      if (a.hidden) { a.hidden = false; a.revealedAt = Date.now(); a.fresh = true; }   // 숨겨 둔 기사면 공개
      st.newNews++;
      notify({ key: "news:" + a.id, app: "news", important: !!a.breaking,
        title: a.breaking ? `[속보] ${a.press || ""}` : (a.press || appName("news")), text: a.title, open: () => openArticle(a) });
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
    case "blackout": blackout(); break;
  }
}

function tickTimeline() {
  if (!st.started || st.off) return;
  const t = elapsed();
  for (const ev of timeline) {
    if (ev.done || ev.at > t) continue;
    // 통화 중이거나 방금 끊었으면(8초) 다음 전화는 잠시 미룸 — 전화가 연달아 몰리지 않게
    if (ev.type === "call" && st.down) { ev.done = true; continue; }   // 망이 끊긴 뒤엔 전화가 오지 않음
    if (ev.type === "call" && (st.inCall || Date.now() - st.callEndedAt < CALL_GAP_MS)) continue;
    ev.done = true;
    try { runEvent(ev); } catch (e) { console.error("timeline 오류:", ev, e); }
  }
}

function tickBattery() {
  const every = CFG.batteryDrainSec || 0;
  if (!st.started || st.off || st.dead || !every) return;   // 먹통 뒤에는 배터리가 더 줄지 않음
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
  if (st.ending) return true;                                             // 엔딩 중에는 아무것도 하지 않음
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
  if (st.ending || stack.length > 1 || !overlayEl.hidden || (t && t.call)) arm();
});
viewsEl.addEventListener("click", e => {
  if (e.target.closest(".back")) { e.preventDefault(); goBack(); }
});

function goHome() {
  const t = top();
  if (IOS && t && t.lock && overlayEl.hidden && !st.dead) { unlock(); return; }   // 아이폰: 잠금화면에서 홈 바를 쓸면 열림
  if (st.off || !t || t.lock || t.call || t.intro || !overlayEl.hidden) return;
  popTo(x => x.home);
}
let homebarSwiped = false;
navEl.onclick = e => {
  const b = e.target.closest("[data-nav]");
  if (!b) return;
  if (homebarSwiped) { homebarSwiped = false; return; }
  const k = b.dataset.nav;
  if (k === "back") { goBack(); return; }
  if (k === "home") goHome();
  else if (!st.off) toast("최근 실행한 앱이 없습니다.");
};
if (IOS) {
  // 홈 바를 위로 쓸어올리면 홈으로
  let hy = null;
  navEl.addEventListener("pointerdown", e => { hy = e.clientY; });
  addEventListener("pointerup", e => {
    if (hy === null) return;
    const up = hy - e.clientY; hy = null;
    if (up > 18) { homebarSwiped = true; setTimeout(() => { homebarSwiped = false; }, 400); goHome(); }
  });
  // 화면 왼쪽 끝에서 오른쪽으로 쓸면 뒤로
  let sx = null, k = 1, moved = 0, tv = null;
  viewsEl.addEventListener("pointerdown", e => {
    const r = screenEl.getBoundingClientRect();
    k = r.width / (screenEl.offsetWidth || r.width) || 1;
    if ((e.clientX - r.left) / k > 24) return;
    const t = top();
    if (!t || t.lock || t.home || t.call || t.intro || stack.length < 2) return;
    sx = e.clientX; moved = 0; tv = t.el;
  });
  addEventListener("pointermove", e => {
    if (sx === null) return;
    moved = Math.max(0, (e.clientX - sx) / k);
    tv.style.transform = `translateX(${moved}px)`;
  });
  addEventListener("pointerup", () => {
    if (sx === null) return;
    sx = null; tv.style.transform = "";
    if (moved > 70) goBack();
  });
}
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
