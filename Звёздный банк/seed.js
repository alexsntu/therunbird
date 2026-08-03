"use strict";

// Шаблон первоначальной настройки storage/data.json.
// ПЕРЕД ЗАПУСКОМ поменяй логин/пароль родителя и имена/пароли детей ниже —
// сейчас тут только примеры, не настоящие данные.
// Если storage/data.json уже существует и настроен — этот скрипт не нужен,
// новых детей/задания проще добавлять прямо в панели родителя.
// Запуск: node seed.js  (ПЕРЕЗАПИШЕТ storage/data.json, если он уже есть)

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const STORAGE_DIR = path.join(__dirname, "storage");
const DATA_FILE = path.join(STORAGE_DIR, "data.json");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}
function uid() {
  return crypto.randomBytes(9).toString("hex");
}

const KID_COLORS = ["#F4B942", "#5FB3A3", "#E85A4B", "#7B8FE8", "#E8A0BF", "#7BC67E"];

// ── Поменяй на реальные имена и пароли перед запуском ──
const KIDS = [
  { name: "Ребёнок 1", password: "0000" },
  { name: "Ребёнок 2", password: "0000" }
];
const PARENT_LOGIN = "Родитель";
const PARENT_PASSWORD = "change-me-1234";

const kids = KIDS.map((k, i) => {
  const { salt, hash } = hashPassword(k.password);
  return { id: uid(), name: k.name, color: KID_COLORS[i % KID_COLORS.length], salt, hash };
});

const data = {
  parent: Object.assign({ login: PARENT_LOGIN }, hashPassword(PARENT_PASSWORD)),
  kids,
  tasks: [],
  pending: [],
  ledger: [],
  actionLog: [],
  tiers: [
    { stars: 20, amount: 500 },
    { stars: 10, amount: 200 },
    { stars: 5, amount: 50 }
  ]
};

fs.mkdirSync(STORAGE_DIR, { recursive: true });
fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
console.log("storage/data.json создан.");
console.log("Родитель: логин \"" + PARENT_LOGIN + "\"");
console.log("Дети:", kids.map((k) => k.name).join(", "));
