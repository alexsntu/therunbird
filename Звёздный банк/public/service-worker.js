"use strict";

// Кэшируется только оболочка приложения (статика), чтобы иконка на экране
// открывалась быстро и не показывала "белый экран", если сеть на секунду моргнёт.
// Всё, что относится к данным (/api/..., /avatars/...), НИКОГДА не кэшируется —
// баланс, задания и чеки должны всегда приходить свежими с сервера.

var CACHE_NAME = "zvezdny-bank-shell-v1";
var SHELL_FILES = [
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var url = new URL(event.request.url);

  // Данные — всегда только с сервера, мимо кэша
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/avatars/")) {
    return;
  }
  if (event.request.method !== "GET") return;

  // Оболочка приложения — сначала сеть (чтобы всегда видеть свежий код при обновлениях),
  // а если сети нет — то, что успели закэшировать при установке.
  event.respondWith(
    fetch(event.request)
      .then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        return res;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match("/index.html");
        });
      })
  );
});
