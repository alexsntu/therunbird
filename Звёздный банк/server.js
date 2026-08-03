"use strict";

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");

// Всё, что меняется и хранит личные данные — в storage/, вне гита (см. .gitignore).
// В самом проекте (public/, server.js и т.д.) — только код.
const STORAGE_DIR = path.join(__dirname, "storage");
const DATA_FILE = path.join(STORAGE_DIR, "data.json");
const SECRET_FILE = path.join(STORAGE_DIR, ".session-secret");
const AVATARS_DIR = path.join(STORAGE_DIR, "avatars");
const AUTH_COOKIE = "zb_auth";
const AUTH_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 дней
const PORT = 4321;

const AVATAR_MIME_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }
});

/* ══════════════════════════════════════
   Persistence — single JSON file on disk
══════════════════════════════════════ */
function defaultData() {
  return {
    parent: null, // { salt, hash }
    kids: [], // { id, name, color, salt, hash, avatarExt, avatarUpdatedAt }
    tasks: [], // { id, name, stars, description }
    pending: [], // { id, kidId, type: 'task'|'redeem', ...fields, ts }
    ledger: [], // { id, kidId, type: 'earn'|'redeem'|'adjust', ..., ts }
    actionLog: [], // { id, ts, actor: {type, name}, action, details }
    // Фиксированные номиналы чека. Любая сумма звёзд, кратная 5, раскладывается
    // на эти номиналы жадно (сначала крупные) — чем крупнее чек, тем выгоднее курс.
    tiers: [
      { stars: 20, amount: 500 },
      { stars: 10, amount: 200 },
      { stars: 5, amount: 50 }
    ]
  };
}

function sortedTiers() {
  return data.tiers.slice().sort((a, b) => b.stars - a.stars);
}

// Раскладывает N звёзд (кратное 5) на номиналы жадно и возвращает сумму в рублях
// и список использованных чеков. Возвращает null, если разложить не удалось
// (например, N не кратно 5 или меньше минимального номинала).
function computeRedeemAmount(stars) {
  const tiers = sortedTiers();
  let remaining = stars;
  let amount = 0;
  const breakdown = [];
  for (const tier of tiers) {
    while (remaining >= tier.stars) {
      remaining -= tier.stars;
      amount += tier.amount;
      breakdown.push(tier.stars);
    }
  }
  if (remaining !== 0) return null;
  return { amount, breakdown };
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return Object.assign(defaultData(), JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
    }
  } catch (e) {
    console.error("Не удалось прочитать data.json, использую пустое состояние:", e.message);
  }
  return defaultData();
}

let data = loadData();
fs.mkdirSync(AVATARS_DIR, { recursive: true });

function removeAvatarFile(kid) {
  if (!kid || !kid.avatarExt) return;
  try {
    fs.unlinkSync(path.join(AVATARS_DIR, kid.id + "." + kid.avatarExt));
  } catch (e) {}
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function uid() {
  return crypto.randomBytes(9).toString("hex");
}

/* ══════════════════════════════════════
   Журнал действий — кто что сделал, доступен только родителю
══════════════════════════════════════ */
function actorFromSession(req) {
  if (req.auth.role === "parent") return { type: "parent", name: "Родитель" };
  if (req.auth.role === "kid") {
    const kid = kidById(req.auth.kidId);
    return { type: "kid", name: kid ? kid.name : "?" };
  }
  return { type: "guest", name: "Гость" };
}
function logAction(req, action, details) {
  data.actionLog.push({
    id: uid(),
    ts: Date.now(),
    actor: actorFromSession(req),
    action,
    details: details || ""
  });
}

/* ══════════════════════════════════════
   Passwords
══════════════════════════════════════ */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}
function verifyPassword(password, salt, hash) {
  if (!salt || !hash || typeof password !== "string" || !password) return false;
  const check = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(check, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getOrCreateSessionSecret() {
  try {
    if (fs.existsSync(SECRET_FILE)) return fs.readFileSync(SECRET_FILE, "utf8").trim();
  } catch (e) {}
  const secret = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(SECRET_FILE, secret, "utf8");
  return secret;
}
const SESSION_SECRET = getOrCreateSessionSecret();

/* ══════════════════════════════════════
   Вход без серверных сессий — вся информация о том, кто вошёл,
   лежит в подписанной куке. Так вход переживает перезапуск сервера
   (перезагрузка Mac, падение процесса, обновление кода) — раньше
   express-session хранил сессии только в памяти процесса, и любой
   перезапуск сразу разлогинивал всех.
══════════════════════════════════════ */
function signAuthToken(payload) {
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(json).digest("base64url");
  return json + "." + sig;
}
function verifyAuthToken(token) {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const json = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(json).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(json, "base64url").toString("utf8"));
  } catch (e) {
    return null;
  }
}
function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    cookies[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return cookies;
}
function setAuth(res, payload) {
  const token = signAuthToken(payload);
  res.setHeader("Set-Cookie", AUTH_COOKIE + "=" + encodeURIComponent(token) + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + AUTH_MAX_AGE_SEC);
}
function clearAuth(res) {
  res.setHeader("Set-Cookie", AUTH_COOKIE + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
}

/* ══════════════════════════════════════
   Derived state helpers
══════════════════════════════════════ */
function kidById(id) {
  return data.kids.find((k) => k.id === id) || null;
}
function balanceFor(kidId) {
  let total = 0;
  for (const e of data.ledger) {
    if (e.kidId !== kidId) continue;
    if (e.type === "earn") total += e.stars;
    else if (e.type === "redeem") total -= e.stars;
    else if (e.type === "adjust") total += e.stars;
  }
  return total;
}
// Звёзды, "замороженные" в ещё не подтверждённом чеке — не входят в доступный баланс,
// пока родитель не подтвердит (тогда спишутся насовсем) или не отклонит (тогда просто
// перестанут резервироваться и снова станут доступны — отдельного возврата не нужно,
// это просто пересчёт: резерв берётся из data.pending "на лету", а не хранится отдельно).
function reservedFor(kidId) {
  return data.pending
    .filter((p) => p.kidId === kidId && p.type === "redeem")
    .reduce((sum, p) => sum + p.stars, 0);
}
function availableBalanceFor(kidId) {
  return balanceFor(kidId) - reservedFor(kidId);
}
function completedCountFor(kidId) {
  return data.ledger.filter((e) => e.kidId === kidId && e.type === "earn").length;
}
function publicKid(k) {
  return {
    id: k.id,
    name: k.name,
    color: k.color,
    avatarUrl: k.avatarExt ? "/avatars/" + k.id + "." + k.avatarExt + "?t=" + (k.avatarUpdatedAt || 0) : null
  };
}
function kidLedgerPaged(kidId, offset, limit, type) {
  let all = data.ledger.filter((e) => e.kidId === kidId);
  if (type) all = all.filter((e) => e.type === type);
  all = all.slice().sort((a, b) => b.ts - a.ts);
  return {
    total: all.length,
    items: all.slice(offset, offset + limit)
  };
}

/* ══════════════════════════════════════
   App
══════════════════════════════════════ */
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const cookies = parseCookies(req);
  req.auth = verifyAuthToken(cookies[AUTH_COOKIE]) || { role: null };
  next();
});
app.use(express.static(path.join(__dirname, "public")));
app.use("/avatars", express.static(AVATARS_DIR));

function requireParent(req, res, next) {
  if (req.auth.role !== "parent") return res.status(401).json({ error: "not_parent" });
  next();
}
function requireKid(req, res, next) {
  if (req.auth.role !== "kid" || !kidById(req.auth.kidId)) {
    return res.status(401).json({ error: "not_kid" });
  }
  next();
}

/* ── Public state: who's set up, who's logged in, overview table ── */
app.get("/api/state", (req, res) => {
  const overview = data.kids.map((k) => ({
    ...publicKid(k),
    balance: availableBalanceFor(k.id),
    reserved: reservedFor(k.id),
    completed: completedCountFor(k.id),
    pendingTasks: data.pending
      .filter((p) => p.kidId === k.id && p.type === "task")
      .map((p) => ({ taskId: p.taskId, taskName: p.taskName, stars: p.stars, ts: p.ts }))
  }));
  res.json({
    setupDone: !!data.parent,
    kids: data.kids.map(publicKid),
    overview,
    tasks: data.tasks,
    tiers: sortedTiers(),
    session:
      req.auth.role === "parent"
        ? { role: "parent" }
        : req.auth.role === "kid" && kidById(req.auth.kidId)
        ? { role: "kid", kid: publicKid(kidById(req.auth.kidId)) }
        : { role: null }
  });
});

/* ── Overview: paginated completed-tasks list for a given kid (public — shown on home screen) ── */
app.get("/api/overview/history/:kidId", (req, res) => {
  const kid = kidById(req.params.kidId);
  if (!kid) return res.status(404).json({ error: "not_found" });
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const all = data.ledger
    .filter((e) => e.kidId === kid.id && e.type === "earn")
    .slice()
    .sort((a, b) => b.ts - a.ts);
  res.json({ total: all.length, items: all.slice(offset, offset + limit) });
});

/* ══════════════════════════════════════
   Setup (first run) & auth
══════════════════════════════════════ */
app.post("/api/setup/parent", (req, res) => {
  if (data.parent) return res.status(409).json({ error: "already_set_up" });
  const login = String(req.body.login || "").trim();
  const password = String(req.body.password || "");
  if (!login || password.length < 4) return res.status(400).json({ error: "invalid" });
  data.parent = Object.assign({ login }, hashPassword(password));
  req.auth = { role: "parent" };
  setAuth(res, req.auth);
  logAction(req, "setup", "Настроен вход родителя");
  save();
  res.json({ ok: true });
});

app.post("/api/login/parent", (req, res) => {
  if (!data.parent) return res.status(409).json({ error: "not_set_up" });
  const login = String(req.body.login || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (login !== String(data.parent.login || "").trim().toLowerCase()) {
    return res.status(401).json({ error: "wrong_password" });
  }
  if (!verifyPassword(password, data.parent.salt, data.parent.hash)) {
    return res.status(401).json({ error: "wrong_password" });
  }
  req.auth = { role: "parent" };
  setAuth(res, req.auth);
  logAction(req, "login", "Вход родителя");
  save();
  res.json({ ok: true });
});

app.post("/api/login/kid", (req, res) => {
  const kid = kidById(String(req.body.kidId || ""));
  if (!kid) return res.status(404).json({ error: "not_found" });
  const password = String(req.body.password || "");
  if (!verifyPassword(password, kid.salt, kid.hash)) {
    return res.status(401).json({ error: "wrong_password" });
  }
  req.auth = { role: "kid", kidId: kid.id };
  setAuth(res, req.auth);
  logAction(req, "login", "Вход ребёнка");
  save();
  res.json({ ok: true, kid: publicKid(kid) });
});

app.post("/api/logout", (req, res) => {
  logAction(req, "logout", "Выход");
  save();
  clearAuth(res);
  res.json({ ok: true });
});

/* ══════════════════════════════════════
   Kid-facing API
══════════════════════════════════════ */
app.get("/api/kid/tasks", requireKid, (req, res) => {
  const kidId = req.auth.kidId;
  const pendingTaskIds = new Set(
    data.pending.filter((p) => p.kidId === kidId && p.type === "task").map((p) => p.taskId)
  );
  res.json({
    tasks: data.tasks
      .filter((t) => (t.assignedKidIds || []).includes(kidId))
      .map((t) => ({ ...t, pending: pendingTaskIds.has(t.id) })),
    balance: availableBalanceFor(kidId),
    reserved: reservedFor(kidId),
    tiers: sortedTiers(),
    pendingRedeem: data.pending.find((p) => p.kidId === kidId && p.type === "redeem") || null
  });
});

app.post("/api/kid/complete", requireKid, (req, res) => {
  const kidId = req.auth.kidId;
  const task = data.tasks.find((t) => t.id === req.body.taskId);
  if (!task || !(task.assignedKidIds || []).includes(kidId)) return res.status(404).json({ error: "not_found" });
  const already = data.pending.some((p) => p.kidId === kidId && p.type === "task" && p.taskId === task.id);
  if (already) return res.status(409).json({ error: "already_pending" });
  data.pending.push({
    id: uid(),
    kidId,
    type: "task",
    taskId: task.id,
    taskName: task.name,
    stars: task.stars,
    ts: Date.now()
  });
  logAction(req, "task_marked_done", task.name + " (★" + task.stars + ")");
  save();
  res.json({ ok: true });
});

app.post("/api/kid/redeem-request", requireKid, (req, res) => {
  const kidId = req.auth.kidId;
  const balance = availableBalanceFor(kidId);
  const stars = Math.floor(Number(req.body.stars));
  const minTier = Math.min(...data.tiers.map((t) => t.stars));
  if (!stars || stars % 5 !== 0 || stars < minTier || stars > balance) {
    return res.status(400).json({ error: "invalid_amount" });
  }
  const computed = computeRedeemAmount(stars);
  if (!computed) return res.status(400).json({ error: "cannot_break_down" });
  if (data.pending.some((p) => p.kidId === kidId && p.type === "redeem")) {
    return res.status(409).json({ error: "already_pending" });
  }
  data.pending.push({
    id: uid(),
    kidId,
    type: "redeem",
    stars,
    amount: computed.amount,
    breakdown: computed.breakdown,
    ts: Date.now()
  });
  logAction(req, "redeem_requested", "Чек на ★" + stars + " (" + computed.amount + " ₽)");
  save();
  res.json({ ok: true, amount: computed.amount });
});

app.get("/api/kid/history", requireKid, (req, res) => {
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  res.json(kidLedgerPaged(req.auth.kidId, offset, limit, req.query.type || null));
});

/* Аватарка — загружает сам ребёнок под своим входом */
app.post("/api/kid/avatar", requireKid, (req, res) => {
  avatarUpload.single("avatar")(req, res, (err) => {
    if (err) return res.status(400).json({ error: "upload_failed", message: err.message });
    if (!req.file) return res.status(400).json({ error: "no_file" });
    const ext = AVATAR_MIME_EXT[req.file.mimetype];
    if (!ext) return res.status(400).json({ error: "bad_type" });

    const kid = kidById(req.auth.kidId);
    if (!kid) return res.status(404).json({ error: "not_found" });

    removeAvatarFile(kid);
    fs.writeFileSync(path.join(AVATARS_DIR, kid.id + "." + ext), req.file.buffer);
    kid.avatarExt = ext;
    kid.avatarUpdatedAt = Date.now();
    logAction(req, "avatar_updated", kid.name);
    save();
    res.json({ ok: true, kid: publicKid(kid) });
  });
});

app.delete("/api/kid/avatar", requireKid, (req, res) => {
  const kid = kidById(req.auth.kidId);
  if (!kid) return res.status(404).json({ error: "not_found" });
  removeAvatarFile(kid);
  kid.avatarExt = null;
  kid.avatarUpdatedAt = Date.now();
  logAction(req, "avatar_removed", kid.name);
  save();
  res.json({ ok: true, kid: publicKid(kid) });
});

/* ══════════════════════════════════════
   Parent-facing API
══════════════════════════════════════ */
app.get("/api/parent/overview", requireParent, (req, res) => {
  res.json({
    kids: data.kids.map((k) => ({
      ...publicKid(k),
      balance: availableBalanceFor(k.id),
      reserved: reservedFor(k.id),
      completed: completedCountFor(k.id)
    })),
    tiers: sortedTiers()
  });
});

app.get("/api/parent/pending", requireParent, (req, res) => {
  const withNames = data.pending
    .slice()
    .sort((a, b) => a.ts - b.ts)
    .map((p) => ({ ...p, kidName: (kidById(p.kidId) || {}).name || "?" }));
  res.json({ pending: withNames });
});

app.post("/api/parent/pending/:id/confirm", requireParent, (req, res) => {
  const idx = data.pending.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not_found" });
  const p = data.pending[idx];
  data.pending.splice(idx, 1);
  const kidName = (kidById(p.kidId) || {}).name || "?";
  if (p.type === "task") {
    data.ledger.push({ id: uid(), kidId: p.kidId, type: "earn", taskName: p.taskName, stars: p.stars, ts: Date.now() });
    // Одноразовое задание: после подтверждения снимаем с ребёнка назначение,
    // чтобы оно ушло из "Что нужно сделать" — не всплывало снова само по себе.
    // Родитель может выдать его заново обычной галочкой в "Задания".
    const task = data.tasks.find((t) => t.id === p.taskId);
    if (task) task.assignedKidIds = (task.assignedKidIds || []).filter((id) => id !== p.kidId);
    logAction(req, "task_confirmed", kidName + " — " + p.taskName + " (★" + p.stars + ")");
  } else if (p.type === "redeem") {
    data.ledger.push({ id: uid(), kidId: p.kidId, type: "redeem", stars: p.stars, amount: p.amount, breakdown: p.breakdown || [], ts: Date.now() });
    logAction(req, "redeem_confirmed", kidName + " — ★" + p.stars + " → " + p.amount + " ₽");
  }
  save();
  res.json({ ok: true });
});

app.post("/api/parent/pending/:id/reject", requireParent, (req, res) => {
  const rejected = data.pending.find((p) => p.id === req.params.id);
  const before = data.pending.length;
  data.pending = data.pending.filter((p) => p.id !== req.params.id);
  if (data.pending.length === before) return res.status(404).json({ error: "not_found" });
  const kidName = rejected ? (kidById(rejected.kidId) || {}).name || "?" : "?";
  logAction(req, "pending_rejected", kidName + " — " + (rejected.type === "task" ? rejected.taskName : "чек ★" + rejected.stars));
  save();
  res.json({ ok: true });
});

/* Kids management */
app.post("/api/parent/kids", requireParent, (req, res) => {
  const name = String(req.body.name || "").trim();
  const password = String(req.body.password || "");
  const color = String(req.body.color || "#F4B942");
  if (!name || password.length < 4) return res.status(400).json({ error: "invalid" });
  const { salt, hash } = hashPassword(password);
  const kid = { id: uid(), name, color, salt, hash };
  data.kids.push(kid);
  logAction(req, "kid_added", name);
  save();
  res.json({ ok: true, kid: publicKid(kid) });
});

app.put("/api/parent/kids/:id", requireParent, (req, res) => {
  const kid = kidById(req.params.id);
  if (!kid) return res.status(404).json({ error: "not_found" });
  const changes = [];
  if (typeof req.body.name === "string" && req.body.name.trim() && req.body.name.trim() !== kid.name) {
    changes.push("имя: " + kid.name + " → " + req.body.name.trim());
    kid.name = req.body.name.trim();
  }
  if (typeof req.body.color === "string") kid.color = req.body.color;
  if (typeof req.body.password === "string" && req.body.password.length >= 4) {
    const { salt, hash } = hashPassword(req.body.password);
    kid.salt = salt;
    kid.hash = hash;
    changes.push("пароль изменён");
  }
  if (changes.length) logAction(req, "kid_updated", kid.name + " (" + changes.join(", ") + ")");
  save();
  res.json({ ok: true, kid: publicKid(kid) });
});

app.delete("/api/parent/kids/:id", requireParent, (req, res) => {
  const kid = kidById(req.params.id);
  removeAvatarFile(kid);
  data.kids = data.kids.filter((k) => k.id !== req.params.id);
  data.pending = data.pending.filter((p) => p.kidId !== req.params.id);
  if (kid) logAction(req, "kid_removed", kid.name);
  save();
  res.json({ ok: true });
});

/* Tasks management */
app.get("/api/parent/tasks", requireParent, (req, res) => {
  res.json({ tasks: data.tasks });
});
function sanitizeKidIds(list) {
  if (!Array.isArray(list)) return [];
  const validIds = new Set(data.kids.map((k) => k.id));
  return list.filter((id) => validIds.has(id));
}

app.post("/api/parent/tasks", requireParent, (req, res) => {
  const name = String(req.body.name || "").trim();
  const stars = Math.floor(Number(req.body.stars));
  const description = String(req.body.description || "").trim();
  // Если родитель не выбрал никого явно — по умолчанию задание видят все дети.
  const assignedKidIds = req.body.assignedKidIds === undefined ? data.kids.map((k) => k.id) : sanitizeKidIds(req.body.assignedKidIds);
  if (!name || !stars || stars < 1) return res.status(400).json({ error: "invalid" });
  const task = { id: uid(), name, stars, description, assignedKidIds };
  data.tasks.push(task);
  const names = assignedKidIds.map((id) => (kidById(id) || {}).name || "?").join(", ") || "никто";
  logAction(req, "task_added", name + " (★" + stars + ") — " + names);
  save();
  res.json({ ok: true, task });
});
app.put("/api/parent/tasks/:id", requireParent, (req, res) => {
  const task = data.tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "not_found" });
  if (typeof req.body.name === "string" && req.body.name.trim()) task.name = req.body.name.trim();
  if (typeof req.body.description === "string") task.description = req.body.description.trim();
  if (req.body.stars !== undefined) {
    const stars = Math.floor(Number(req.body.stars));
    if (stars >= 1) task.stars = stars;
  }
  if (req.body.assignedKidIds !== undefined) {
    task.assignedKidIds = sanitizeKidIds(req.body.assignedKidIds);
  }
  logAction(req, "task_updated", task.name);
  save();
  res.json({ ok: true, task });
});
app.delete("/api/parent/tasks/:id", requireParent, (req, res) => {
  const task = data.tasks.find((t) => t.id === req.params.id);
  data.tasks = data.tasks.filter((t) => t.id !== req.params.id);
  if (task) logAction(req, "task_removed", task.name);
  save();
  res.json({ ok: true });
});

/* Номиналы чека — фиксированные ступени 5/10/20 звёзд, суммы редактируемы */
app.put("/api/parent/tiers/:stars", requireParent, (req, res) => {
  const stars = parseInt(req.params.stars, 10);
  const tier = data.tiers.find((t) => t.stars === stars);
  if (!tier) return res.status(404).json({ error: "not_found" });
  const amount = Number(req.body.amount);
  if (isNaN(amount) || amount < 0) return res.status(400).json({ error: "invalid" });
  tier.amount = amount;
  logAction(req, "tier_updated", "★" + stars + " → " + amount + " ₽");
  save();
  res.json({ ok: true, tiers: sortedTiers() });
});

/* Manual adjustment */
app.post("/api/parent/adjust", requireParent, (req, res) => {
  const kid = kidById(req.body.kidId);
  const stars = Math.floor(Number(req.body.stars));
  if (!kid || !stars) return res.status(400).json({ error: "invalid" });
  data.ledger.push({
    id: uid(),
    kidId: kid.id,
    type: "adjust",
    stars,
    reason: String(req.body.reason || "").trim(),
    ts: Date.now()
  });
  logAction(req, "manual_adjust", kid.name + " " + (stars >= 0 ? "+" : "") + stars + " ★" + (req.body.reason ? " (" + String(req.body.reason).trim() + ")" : ""));
  save();
  res.json({ ok: true });
});

/* Full history (all kids, or filtered by kid and/or type), paginated */
app.get("/api/parent/history", requireParent, (req, res) => {
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const kidId = req.query.kidId || null;
  const type = req.query.type || null;
  let all = data.ledger.slice();
  if (kidId) all = all.filter((e) => e.kidId === kidId);
  if (type) all = all.filter((e) => e.type === type);
  all.sort((a, b) => b.ts - a.ts);
  const items = all.slice(offset, offset + limit).map((e) => ({ ...e, kidName: (kidById(e.kidId) || {}).name || "?" }));
  res.json({ total: all.length, items });
});

/* Change own password */
app.post("/api/parent/password", requireParent, (req, res) => {
  const password = String(req.body.password || "");
  if (password.length < 4) return res.status(400).json({ error: "too_short" });
  data.parent = Object.assign({ login: data.parent.login }, hashPassword(password));
  logAction(req, "parent_password_changed", "");
  save();
  res.json({ ok: true });
});

/* Журнал действий — только для родителя, постранично по 10 */
app.get("/api/parent/logs", requireParent, (req, res) => {
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const all = data.actionLog.slice().sort((a, b) => b.ts - a.ts);
  res.json({ total: all.length, items: all.slice(offset, offset + limit) });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Звёздный банк запущен: http://localhost:" + PORT);
});
