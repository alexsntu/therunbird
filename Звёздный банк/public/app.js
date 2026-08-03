(function () {
  "use strict";

  var root = document.getElementById("root");
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var STATE = null; // последний ответ /api/state
  var VIEW = { screen: "home", loginTarget: null, parentTab: "pending", tasksSubTab: "current", tasksFilterKid: "", checksFilterKid: "", kidTab: "tasks" };
  var LISTS = {}; // ключ -> { items: [], total: 0 }
  var KID_TASKS = null; // кэш /api/kid/tasks для текущего ребёнка
  var PARENT_CACHE = {}; // кэш точечных данных для вкладок родителя

  /* ══════════════════════════════════════
     API helper
  ══════════════════════════════════════ */
  var sessionExpiredHandled = false;

  function handleSessionExpired() {
    if (sessionExpiredHandled) return;
    sessionExpiredHandled = true;
    KID_TASKS = null; LISTS = {}; PARENT_CACHE = {};
    VIEW = { screen: "home", loginTarget: null, parentTab: "pending" };
    toast("Сессия истекла — войдите заново");
    refreshState().then(function () { sessionExpiredHandled = false; });
  }

  function api(method, url, body) {
    return fetch(url, {
      method: method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (res.status === 401 && (!data || data.error === "not_parent" || data.error === "not_kid")) {
          handleSessionExpired();
        }
        if (!res.ok) {
          var err = new Error((data && data.error) || "error");
          err.code = data && data.error;
          throw err;
        }
        return data;
      });
    });
  }

  function uploadAvatar(file) {
    var formData = new FormData();
    formData.append("avatar", file);
    return fetch("/api/kid/avatar", { method: "POST", body: formData }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (res.status === 401) handleSessionExpired();
        if (!res.ok) {
          var err = new Error((data && data.error) || "error");
          err.code = data && data.error;
          throw err;
        }
        return data;
      });
    });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }
  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  }
  function fmtDateTime(ts) {
    return new Date(ts).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }
  function money(n) {
    return Number(n).toLocaleString("ru-RU") + " ₽";
  }

  function toast(msg) {
    var layer = document.getElementById("toastLayer");
    var elDiv = document.createElement("div");
    elDiv.className = "toast";
    elDiv.textContent = msg;
    layer.appendChild(elDiv);
    requestAnimationFrame(function () { elDiv.classList.add("show"); });
    setTimeout(function () {
      elDiv.classList.remove("show");
      setTimeout(function () { elDiv.remove(); }, 250);
    }, 2400);
  }

  function burst(x, y) {
    if (prefersReducedMotion) return;
    var canvas = document.getElementById("burstCanvas");
    var dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var colors = ["#F4B942", "#E85A4B", "#7BC67E", "#7B8FE8"];
    var particles = [];
    var count = 22;
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      var speed = 3 + Math.random() * 4;
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
        size: 5 + Math.random() * 5, rot: Math.random() * Math.PI, vrot: (Math.random() - 0.5) * 0.3,
        color: colors[i % colors.length], life: 1
      });
    }
    function drawStar(cx, cy, r, rot) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.beginPath();
      for (var s = 0; s < 5; s++) {
        var oa = (Math.PI * 2 * s) / 5 - Math.PI / 2, ia = oa + Math.PI / 5;
        var ox = Math.cos(oa) * r, oy = Math.sin(oa) * r;
        var ix = Math.cos(ia) * r * 0.42, iy = Math.sin(ia) * r * 0.42;
        if (s === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    var start = null;
    function frame(ts) {
      if (!start) start = ts;
      var elapsed = ts - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var alive = false;
      particles.forEach(function (p) {
        if (p.life <= 0) return;
        p.vy += 0.16; p.x += p.vx; p.y += p.vy; p.rot += p.vrot; p.life -= 0.014;
        if (p.life > 0) {
          alive = true;
          ctx.globalAlpha = Math.max(p.life, 0); ctx.fillStyle = p.color;
          drawStar(p.x, p.y, p.size, p.rot);
        }
      });
      ctx.globalAlpha = 1;
      if (alive && elapsed < 2200) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(frame);
  }

  /* ══════════════════════════════════════
     Ledger entry -> readable text
  ══════════════════════════════════════ */
  function describeLedger(e, withWho) {
    var who = withWho ? '<span class="ledger-who">' + escapeHtml(e.kidName) + "</span> — " : "";
    if (e.type === "earn") return who + escapeHtml(e.taskName);
    if (e.type === "redeem") return who + "Обмен чека на " + money(e.amount);
    return who + (e.reason ? escapeHtml(e.reason) : "Корректировка");
  }
  function ledgerAmountHtml(e) {
    if (e.type === "earn") return '<span class="ledger-amt plus">+' + e.stars + " ★</span>";
    if (e.type === "redeem") return '<span class="ledger-amt minus">−' + e.stars + " ★</span>";
    var sign = e.stars >= 0 ? "+" : "−";
    return '<span class="ledger-amt ' + (e.stars >= 0 ? "plus" : "minus") + '">' + sign + Math.abs(e.stars) + " ★</span>";
  }

  /* ══════════════════════════════════════
     Top bar (shared shell)
  ══════════════════════════════════════ */
  function topbarHtml() {
    var who = "";
    if (STATE.session.role === "parent") {
      who = '<div class="who-badge"><span class="name">Родитель</span></div><button class="logout-btn" id="logoutBtn" type="button">Выйти</button>';
    } else if (STATE.session.role === "kid") {
      who = '<div class="who-badge">' + avatarHtml(STATE.session.kid, 26) + "Привет, <span class=\"name\">" + escapeHtml(STATE.session.kid.name) + '</span></div><button class="logout-btn" id="logoutBtn" type="button">Выйти</button>';
    }
    return (
      '<div class="masthead">' +
      '<div class="brand"><span class="brand-mark">★</span><div class="brand-text"><h1>Звёздный банк</h1><p class="brand-sub">Задания → звёзды → деньги</p></div></div>' +
      who +
      "</div>"
    );
  }

  function wireTopbar() {
    var btn = document.getElementById("logoutBtn");
    if (btn) btn.addEventListener("click", function () {
      api("POST", "/api/logout").then(function () {
        KID_TASKS = null; LISTS = {}; PARENT_CACHE = {};
        VIEW = { screen: "home", loginTarget: null, parentTab: "pending" };
        refreshState();
      });
    });
  }

  /* ══════════════════════════════════════
     HOME (public, без входа)
  ══════════════════════════════════════ */
  function renderKidTodoHtml(kid, tasks) {
    if (tasks.length === 0) return '<div class="empty-note">Все назначенные задания уже отправлены на подтверждение.</div>';
    var html = "<ul>";
    tasks.forEach(function (t) {
      var descOpen = !!LISTS["todo-task-" + t.id];
      html +=
        '<li class="ledger-row" style="flex-direction:column;align-items:stretch;">' +
        '<div style="display:flex;align-items:baseline;gap:10px;">' +
        '<span class="ledger-desc">' + escapeHtml(t.name) + "</span>" +
        '<span class="star-chip">★ ' + t.stars + "</span>" +
        (t.description ? '<button class="overview-toggle' + (descOpen ? " open" : "") + '" data-toggle-todo-task="' + t.id + '" type="button">+</button>' : "") +
        "</div>" +
        (descOpen && t.description ? '<div class="empty-note" style="padding:4px 0 0;">' + escapeHtml(t.description) + "</div>" : "") +
        "</li>";
    });
    html += "</ul>";
    return html;
  }

  function initialLetter(name) {
    return (name || "?").trim().charAt(0).toUpperCase();
  }
  function avatarHtml(kid, size) {
    size = size || 40;
    if (kid.avatarUrl) {
      return '<img class="avatar" src="' + kid.avatarUrl + '" alt="' + escapeHtml(kid.name) + '" style="width:' + size + "px;height:" + size + 'px;">';
    }
    return (
      '<div class="avatar-fallback" style="width:' + size + "px;height:" + size + "px;background:" + kid.color + ";font-size:" + Math.round(size * 0.42) + 'px;">' +
      escapeHtml(initialLetter(kid.name)) +
      "</div>"
    );
  }

  function renderKidPendingHtml(pendingTasks) {
    if (pendingTasks.length === 0) return '<div class="empty-note">Сейчас ничего не ждёт подтверждения.</div>';
    var html = "<ul>";
    pendingTasks.forEach(function (p) {
      html +=
        '<li class="ledger-row"><span class="ledger-desc">' + escapeHtml(p.taskName) + '</span><span class="ledger-date">' + fmtDate(p.ts) + "</span>" +
        '<span class="pending-tag">★' + p.stars + " · ждёт</span></li>";
    });
    html += "</ul>";
    return html;
  }

  function renderHome() {
    var html = '<div class="shell shell-wide">' + topbarHtml();

    if (!STATE.setupDone) {
      html +=
        '<div style="max-width:440px;margin:0 auto;">' +
        '<div class="card"><div class="section-heading">Первая настройка</div>' +
        '<div class="field"><label>Логин родителя</label><input type="text" id="setupLogin"></div>' +
        '<div class="field"><label>Пароль родителя</label><input type="password" id="setupPassword"></div>' +
        '<div class="form-error" id="setupError"></div>' +
        '<button class="btn btn-gold btn-block" id="setupBtn" type="button">Создать вход</button></div>' +
        "</div>";
      html += "</div>";
      root.innerHTML = html;
      wireTopbar();
      document.getElementById("setupBtn").addEventListener("click", function () {
        var login = document.getElementById("setupLogin").value.trim();
        var password = document.getElementById("setupPassword").value;
        api("POST", "/api/setup/parent", { login: login, password: password })
          .then(refreshState)
          .catch(function () { document.getElementById("setupError").textContent = "Заполните логин и пароль (от 4 символов)"; });
      });
      return;
    }

    /* семейная сводка: общая статистика + карточка на каждого ребёнка */
    if (STATE.overview.length === 0) {
      html += '<div class="card"><div class="empty-note">Пока нет ни одного ребёнка.</div></div>';
    } else {
      var totalStars = STATE.overview.reduce(function (s, k) { return s + k.balance; }, 0);
      var totalDone = STATE.overview.reduce(function (s, k) { return s + k.completed; }, 0);
      var totalWaiting = STATE.overview.reduce(function (s, k) { return s + (k.pendingTasks || []).length; }, 0);

      html +=
        '<div class="family-summary">' +
        '<div class="family-stat"><b>' + STATE.overview.length + '</b><span>' + (STATE.overview.length === 1 ? "ребёнок" : "детей") + "</span></div>" +
        '<div class="family-stat"><b>' + totalStars + " ★</b><span>всего звёзд</span></div>" +
        '<div class="family-stat"><b>' + totalDone + "</b><span>выполнено всего</span></div>" +
        '<div class="family-stat"><b>' + totalWaiting + "</b><span>ждут проверки</span></div>" +
        "</div>";

      html += '<div class="kid-grid">';
      STATE.overview.forEach(function (k) {
        var pendingTaskIds = (k.pendingTasks || []).map(function (p) { return p.taskId; });
        var myTasks = STATE.tasks.filter(function (t) {
          return (t.assignedKidIds || []).indexOf(k.id) !== -1 && pendingTaskIds.indexOf(t.id) === -1;
        });
        // Открыта только одна вкладка на всю семью разом — у одного ребёнка и одного вида
        var active = LISTS.activePanel;
        var panel = active && active.kidId === k.id ? active.panel : null;
        html +=
          '<div class="kid-card" data-kid="' + k.id + '">' +
          '<div class="kid-card-head">' + avatarHtml(k, 52) +
          '<div><div class="kid-card-name">' + escapeHtml(k.name) + '</div><div class="kid-card-balance">★ ' + k.balance + "</div></div>" +
          "</div>" +
          '<div class="kid-card-stats">' +
          '<button class="kid-card-stat-btn" aria-selected="' + (panel === "todo") + '" data-panel="todo" data-kid-id="' + k.id + '" type="button"><b>' + myTasks.length + "</b>к выполнению</button>" +
          '<button class="kid-card-stat-btn warn" aria-selected="' + (panel === "wait") + '" data-panel="wait" data-kid-id="' + k.id + '" type="button"><b>' + pendingTaskIds.length + "</b>на проверке</button>" +
          '<button class="kid-card-stat-btn" aria-selected="' + (panel === "done") + '" data-panel="done" data-kid-id="' + k.id + '" type="button"><b>' + k.completed + "</b>выполнено</button>" +
          "</div>" +
          '<div class="kid-card-panel overview-completed" id="todo-' + k.id + '" ' + (panel === "todo" ? "" : "hidden") + ">" + renderKidTodoHtml(k, myTasks) + "</div>" +
          '<div class="kid-card-panel overview-completed" id="wait-' + k.id + '" ' + (panel === "wait" ? "" : "hidden") + ">" + renderKidPendingHtml(k.pendingTasks || []) + "</div>" +
          '<div class="kid-card-panel overview-completed" id="completed-' + k.id + '" ' + (panel === "done" ? "" : "hidden") + "></div>" +
          "</div>";
      });
      html += "</div>";
    }

    /* вход */
    html += '<div style="max-width:440px;margin:24px auto 0;">';
    if (VIEW.screen === "login") {
      html += renderLoginCard();
    } else {
      html += '<div class="card"><div class="section-heading">Войти</div><div class="login-choices">';
      html += '<button class="login-choice" data-login="parent" type="button">👤 Родители</button>';
      STATE.kids.forEach(function (k) {
        html += '<button class="login-choice" data-login="' + k.id + '" type="button">' + avatarHtml(k, 26) + escapeHtml(k.name) + "</button>";
      });
      html += "</div></div>";
    }
    html += "</div>";

    html += "</div>";
    root.innerHTML = html;
    wireTopbar();
    wireHome();

    // Контейнер "Выполнено" всегда рисуется пустым в html выше (данные приходят
    // асинхронно) — если вкладка уже открыта и данные закэшированы с прошлого раза,
    // перерисовать их нужно прямо сейчас, иначе новый DOM так и останется пустым.
    if (LISTS.activePanel && LISTS.activePanel.panel === "done") {
      renderHomeCompletedList(LISTS.activePanel.kidId);
    }
  }

  function renderLoginCard() {
    var isParent = VIEW.loginTarget === "parent";
    var kid = isParent ? null : STATE.kids.filter(function (k) { return k.id === VIEW.loginTarget; })[0];
    var title = isParent ? "Вход — Родители" : "Вход — " + (kid ? kid.name : "");
    var html = '<div class="card"><div class="section-heading">' + escapeHtml(title) + "</div>";
    if (isParent) {
      html += '<div class="field"><label>Логин</label><input type="text" id="loginLogin"></div>';
    }
    html += '<div class="field"><label>Пароль</label><input type="password" id="loginPassword"></div>';
    html += '<div class="form-error" id="loginError"></div>';
    html += '<button class="back-link" id="loginBack" type="button">← Назад</button>';
    html += '<button class="btn btn-gold btn-block" id="loginSubmit" type="button">Войти</button>';
    html += "</div>";
    return html;
  }

  function wireHome() {
    document.querySelectorAll("[data-panel]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var kidId = btn.getAttribute("data-kid-id");
        var target = btn.getAttribute("data-panel");
        var active = LISTS.activePanel;
        if (active && active.kidId === kidId && active.panel === target) {
          LISTS.activePanel = null; // повторный клик по открытой вкладке — закрыть её
        } else {
          LISTS.activePanel = { kidId: kidId, panel: target }; // открыть эту — все остальные у всех детей закроются
          if (target === "done" && !LISTS["home-" + kidId]) {
            LISTS["home-" + kidId] = { items: [], total: 0 };
            loadHomeCompleted(kidId);
          }
        }
        renderHome();
      });
    });
    document.querySelectorAll("[data-toggle-todo-task]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = "todo-task-" + btn.getAttribute("data-toggle-todo-task");
        if (LISTS[key]) delete LISTS[key]; else LISTS[key] = true;
        renderHome();
      });
    });
    document.querySelectorAll("[data-login]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        VIEW.screen = "login";
        VIEW.loginTarget = btn.getAttribute("data-login");
        renderHome();
      });
    });
    var backBtn = document.getElementById("loginBack");
    if (backBtn) backBtn.addEventListener("click", function () {
      VIEW.screen = "home"; VIEW.loginTarget = null;
      renderHome();
    });
    var submitBtn = document.getElementById("loginSubmit");
    if (submitBtn) submitBtn.addEventListener("click", submitLogin);
    var pwField = document.getElementById("loginPassword");
    if (pwField) pwField.addEventListener("keydown", function (e) { if (e.key === "Enter") submitLogin(); });
  }

  function submitLogin() {
    var isParent = VIEW.loginTarget === "parent";
    var password = document.getElementById("loginPassword").value;
    var req = isParent
      ? api("POST", "/api/login/parent", { login: document.getElementById("loginLogin").value.trim(), password: password })
      : api("POST", "/api/login/kid", { kidId: VIEW.loginTarget, password: password });
    req
      .then(function () {
        VIEW = { screen: "home", loginTarget: null, parentTab: "pending" };
        refreshState();
      })
      .catch(function () {
        document.getElementById("loginError").textContent = "Неверный логин или пароль";
      });
  }

  function loadHomeCompleted(kidId) {
    var key = "home-" + kidId;
    var list = LISTS[key];
    if (!list) return;
    api("GET", "/api/overview/history/" + kidId + "?offset=" + list.items.length + "&limit=10").then(function (res) {
      list.items = list.items.concat(res.items);
      list.total = res.total;
      renderHomeCompletedList(kidId);
    });
  }

  function renderHomeCompletedList(kidId) {
    var list = LISTS["home-" + kidId];
    var container = document.getElementById("completed-" + kidId);
    if (!container || !list) return;
    if (list.items.length === 0) {
      container.innerHTML = '<div class="empty-note">Пока ничего не выполнено.</div>';
      return;
    }
    var html = "<ul>";
    list.items.forEach(function (e) {
      html += '<li class="ledger-row"><span class="ledger-desc">' + escapeHtml(e.taskName) + '</span><span class="ledger-date">' + fmtDate(e.ts) + "</span>" + ledgerAmountHtml(e) + "</li>";
    });
    html += "</ul>";
    if (list.items.length < list.total) {
      html += '<button class="load-more-btn" data-load-home="' + kidId + '" type="button">Показать ещё 10</button>';
    }
    container.innerHTML = html;
    var moreBtn = container.querySelector("[data-load-home]");
    if (moreBtn) moreBtn.addEventListener("click", function () { loadHomeCompleted(kidId); });
  }

  /* ══════════════════════════════════════
     KID DASHBOARD
  ══════════════════════════════════════ */
  function renderKid() {
    if (!KID_TASKS) {
      root.innerHTML = '<div class="shell">' + topbarHtml() + "</div>";
      wireTopbar();
      api("GET", "/api/kid/tasks").then(function (res) {
        KID_TASKS = res;
        renderKid();
      });
      return;
    }

    var balance = KID_TASKS.balance;
    var reserved = KID_TASKS.reserved || 0;
    var myKid = STATE.session.kid;
    var html = '<div class="shell">' + topbarHtml();

    html +=
      '<div class="card" style="text-align:center;">' +
      '<div class="avatar-upload">' + avatarHtml(myKid, 84) +
      '<input type="file" id="avatarFileInput" accept="image/png,image/jpeg,image/webp">' +
      '<div class="avatar-upload-btn">📷</div>' +
      "</div>" +
      (myKid.avatarUrl ? '<button class="avatar-remove-link" id="avatarRemoveBtn" type="button">Убрать фото</button>' : "") +
      "</div>";

    html +=
      '<div class="card balance-card">' +
      '<div class="balance-label">Доступно</div>' +
      '<div class="balance-figure"><span class="star-ico">★</span><span class="num">' + balance + "</span></div>";
    if (reserved > 0) {
      html += '<div class="pending-note">★' + reserved + " в резерве — ждёт подтверждения чека</div>";
    }
    if (KID_TASKS.pendingRedeem) {
      html += '<div class="pending-note">Чек на ★' + KID_TASKS.pendingRedeem.stars + " (" + money(KID_TASKS.pendingRedeem.amount) + ") ждёт подтверждения родителя</div>";
    } else {
      html += '<button class="redeem-btn" id="redeemOpenBtn" type="button"' + (balance < Math.min.apply(null, KID_TASKS.tiers.map(function (t) { return t.stars; })) ? " disabled" : "") + ">Обменять на деньги</button>";
    }
    html += "</div>";

    html += '<div class="parent-tabs" role="tablist" id="kidTabs" style="margin-bottom:14px;"></div><div id="kidTabBody"></div>';

    html += "</div>";
    root.innerHTML = html;
    wireTopbar();

    var tabsEl = document.getElementById("kidTabs");
    [{ id: "tasks", label: "Мои задания" }, { id: "checks", label: "Мои чеки" }].forEach(function (t) {
      var btn = document.createElement("button");
      btn.className = "parent-tab";
      btn.type = "button";
      btn.textContent = t.label;
      btn.setAttribute("aria-selected", VIEW.kidTab === t.id);
      btn.addEventListener("click", function () {
        VIEW.kidTab = t.id;
        renderKid();
      });
      tabsEl.appendChild(btn);
    });

    var avatarInput = document.getElementById("avatarFileInput");
    if (avatarInput) {
      avatarInput.addEventListener("change", function () {
        var file = avatarInput.files[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) { toast("Файл слишком большой — максимум 4 МБ"); avatarInput.value = ""; return; }
        uploadAvatar(file)
          .then(function (res) {
            STATE.session.kid = res.kid;
            toast("Фото обновлено");
            renderKid();
          })
          .catch(function () { toast("Не получилось загрузить фото"); avatarInput.value = ""; });
      });
    }
    var avatarRemoveBtn = document.getElementById("avatarRemoveBtn");
    if (avatarRemoveBtn) {
      avatarRemoveBtn.addEventListener("click", function () {
        api("DELETE", "/api/kid/avatar").then(function (res) {
          STATE.session.kid = res.kid;
          toast("Фото убрано");
          renderKid();
        });
      });
    }

    var redeemBtn = document.getElementById("redeemOpenBtn");
    if (redeemBtn) redeemBtn.addEventListener("click", openRedeemSheet);

    var kidTabBody = document.getElementById("kidTabBody");
    if (VIEW.kidTab === "checks") renderKidChecksTab(kidTabBody);
    else renderKidTasksTab(kidTabBody);
  }

  function renderKidTasksTab(body) {
    var todo = KID_TASKS.tasks.filter(function (t) { return !t.pending; });
    var waiting = KID_TASKS.tasks.filter(function (t) { return t.pending; });

    var html = '<div class="card"><div class="section-heading">К выполнению</div>';
    if (todo.length === 0) {
      html += '<div class="empty-note">Сейчас нечего делать — все задания либо на проверке, либо ещё не назначены.</div>';
    } else {
      todo.forEach(function (t) {
        html += '<div class="task-row"><span class="task-name">' + escapeHtml(t.name) + '</span><span class="star-chip">★ ' + t.stars + '</span><button class="task-done-btn" data-complete="' + t.id + '" type="button">Готово</button></div>';
      });
    }
    html += "</div>";

    if (waiting.length > 0) {
      html += '<div class="card"><div class="section-heading">На проверке у родителя</div>';
      waiting.forEach(function (t) {
        html += '<div class="task-row"><span class="task-name">' + escapeHtml(t.name) + '</span><span class="star-chip">★ ' + t.stars + '</span><span class="pending-tag">ждёт</span></div>';
      });
      html += "</div>";
    }

    html += '<div class="card"><div class="section-heading">Выполненные</div><div id="kidTaskHistory"></div></div>';
    body.innerHTML = html;

    document.querySelectorAll("[data-complete]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        if (btn.disabled) return; // защита от двойного клика/тапа
        btn.disabled = true;
        var taskId = btn.getAttribute("data-complete");
        var rect = e.currentTarget.getBoundingClientRect();
        api("POST", "/api/kid/complete", { taskId: taskId })
          .then(function () {
            burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
            toast("Отмечено! Ждём подтверждения родителя");
            KID_TASKS = null;
            renderKid();
          })
          .catch(function (err) {
            if (err.code === "already_pending") {
              toast("Уже отмечено — ждём подтверждения родителя");
              KID_TASKS = null;
              renderKid();
              return;
            }
            btn.disabled = false;
            toast("Не получилось — попробуйте ещё раз");
          });
      });
    });

    LISTS.kidTaskHistory = { items: [], total: 0 };
    loadKidTaskHistory();
  }
  function loadKidTaskHistory() {
    var st = LISTS.kidTaskHistory;
    if (!st) return;
    api("GET", "/api/kid/history?type=earn&offset=" + st.items.length + "&limit=10").then(function (res) {
      st.items = st.items.concat(res.items);
      st.total = res.total;
      var container = document.getElementById("kidTaskHistory");
      if (!container) return;
      if (st.items.length === 0) {
        container.innerHTML = '<div class="empty-note">Пока ничего не выполнено.</div>';
        return;
      }
      var html = "<ul>";
      st.items.forEach(function (e) {
        html += '<li class="ledger-row"><span class="ledger-desc">' + escapeHtml(e.taskName) + '</span><span class="ledger-date">' + fmtDate(e.ts) + "</span>" + ledgerAmountHtml(e) + "</li>";
      });
      html += "</ul>";
      if (st.items.length < st.total) html += '<button class="load-more-btn" id="kidTaskHistoryMore" type="button">Показать ещё 10</button>';
      container.innerHTML = html;
      var moreBtn = document.getElementById("kidTaskHistoryMore");
      if (moreBtn) moreBtn.addEventListener("click", loadKidTaskHistory);
    });
  }

  function renderKidChecksTab(body) {
    var html = "";
    if (KID_TASKS.pendingRedeem) {
      html +=
        '<div class="card" style="text-align:center;border:1px dashed var(--coral);">' +
        '<div class="section-eyebrow" style="color:var(--coral);">Ждёт родителя</div>' +
        '<div style="font-family:var(--font-display);font-weight:800;font-size:22px;">★' + KID_TASKS.pendingRedeem.stars + " → " + money(KID_TASKS.pendingRedeem.amount) + "</div>" +
        "</div>";
    }
    html += '<div class="card"><div class="section-heading">История чеков</div><div id="kidCheckHistory"></div></div>';
    body.innerHTML = html;

    LISTS.kidCheckHistory = { items: [], total: 0 };
    loadKidCheckHistory();
  }
  function loadKidCheckHistory() {
    var st = LISTS.kidCheckHistory;
    if (!st) return;
    api("GET", "/api/kid/history?type=redeem&offset=" + st.items.length + "&limit=10").then(function (res) {
      st.items = st.items.concat(res.items);
      st.total = res.total;
      var container = document.getElementById("kidCheckHistory");
      if (!container) return;
      if (st.items.length === 0) {
        container.innerHTML = '<div class="empty-note">Пока ни одного обналиченного чека.</div>';
        return;
      }
      var html = "<ul>";
      st.items.forEach(function (e) {
        var breakdown = (e.breakdown || []).map(function (s) { return "★" + s; }).join(" + ");
        html +=
          '<li class="ledger-row"><span class="ledger-desc">★' + e.stars + (breakdown ? " (" + breakdown + ")" : "") + " → " + money(e.amount) +
          '</span><span class="ledger-date">' + fmtDateTime(e.ts) + "</span></li>";
      });
      html += "</ul>";
      if (st.items.length < st.total) html += '<button class="load-more-btn" id="kidCheckHistoryMore" type="button">Показать ещё 10</button>';
      container.innerHTML = html;
      var moreBtn = document.getElementById("kidCheckHistoryMore");
      if (moreBtn) moreBtn.addEventListener("click", loadKidCheckHistory);
    });
  }

  /* ── Чек на обмен ── */
  function computeBreakdownClient(stars, tiers) {
    var sorted = tiers.slice().sort(function (a, b) { return b.stars - a.stars; });
    var remaining = stars, amount = 0, parts = [];
    sorted.forEach(function (t) {
      while (remaining >= t.stars) { remaining -= t.stars; amount += t.amount; parts.push(t.stars); }
    });
    return remaining === 0 ? { amount: amount, parts: parts } : null;
  }

  function openRedeemSheet() {
    var tiers = KID_TASKS.tiers;
    var minTier = Math.min.apply(null, tiers.map(function (t) { return t.stars; }));
    var balance = KID_TASKS.balance;
    var sheetHtml =
      '<div class="scrim open" id="redeemScrim"></div>' +
      '<div class="sheet open" id="redeemSheet">' +
      '<div class="sheet-handle"></div>' +
      '<div class="sheet-head"><h2>Новый чек</h2><button class="sheet-close" id="redeemCloseBtn" type="button">✕</button></div>' +
      '<div class="avail">Доступно: <strong style="color:var(--gold)">' + balance + " ★</strong></div>" +
      '<div class="stepper"><button type="button" id="redeemMinus">−5</button><div class="redeem-input-row"><input type="number" id="redeemStars" step="5" min="' + minTier + '" max="' + balance + '" value="' + minTier + '"></div><button type="button" id="redeemPlus">+5</button></div>' +
      '<div class="redeem-result" id="redeemResult"></div>' +
      '<div class="redeem-breakdown" id="redeemBreakdown"></div>' +
      '<div class="redeem-error" id="redeemErr"></div>' +
      '<div class="btn-row"><button class="btn btn-ghost" id="redeemCancelBtn" type="button">Отмена</button><button class="btn btn-gold" id="redeemConfirmBtn" type="button">Создать чек</button></div>' +
      "</div>";
    var wrap = document.createElement("div");
    wrap.innerHTML = sheetHtml;
    document.body.appendChild(wrap);

    var input = document.getElementById("redeemStars");
    function update() {
      var v = parseInt(input.value, 10) || 0;
      var resEl = document.getElementById("redeemResult");
      var bdEl = document.getElementById("redeemBreakdown");
      var errEl = document.getElementById("redeemErr");
      errEl.textContent = "";
      if (v % 5 !== 0 || v < minTier) {
        resEl.innerHTML = "";
        bdEl.textContent = "";
        errEl.textContent = "Число должно быть кратно 5 (мин. " + minTier + ")";
        return;
      }
      if (v > balance) {
        resEl.innerHTML = "";
        bdEl.textContent = "";
        errEl.textContent = "Недостаточно звёзд на балансе";
        return;
      }
      var computed = computeBreakdownClient(v, tiers);
      if (!computed) {
        resEl.innerHTML = "";
        bdEl.textContent = "";
        errEl.textContent = "Такую сумму нельзя разложить на чеки";
        return;
      }
      resEl.innerHTML = "Получите: <strong>" + money(computed.amount) + "</strong>";
      bdEl.textContent = computed.parts.map(function (p) { return "★" + p; }).join(" + ");
    }
    input.addEventListener("input", update);
    document.getElementById("redeemMinus").addEventListener("click", function () {
      input.value = Math.max(minTier, (parseInt(input.value, 10) || minTier) - 5);
      update();
    });
    document.getElementById("redeemPlus").addEventListener("click", function () {
      input.value = Math.min(balance, (parseInt(input.value, 10) || minTier) + 5);
      update();
    });
    update();

    function closeSheet() { wrap.remove(); }
    document.getElementById("redeemScrim").addEventListener("click", closeSheet);
    document.getElementById("redeemCloseBtn").addEventListener("click", closeSheet);
    document.getElementById("redeemCancelBtn").addEventListener("click", closeSheet);
    var confirmBtn = document.getElementById("redeemConfirmBtn");
    confirmBtn.addEventListener("click", function () {
      if (confirmBtn.disabled) return;
      confirmBtn.disabled = true;
      var v = parseInt(input.value, 10) || 0;
      api("POST", "/api/kid/redeem-request", { stars: v })
        .then(function () {
          closeSheet();
          toast("Чек создан — ждём подтверждения родителя");
          KID_TASKS = null;
          renderKid();
        })
        .catch(function (err) {
          confirmBtn.disabled = false;
          document.getElementById("redeemErr").textContent = err.code === "already_pending" ? "Чек уже создан — ждём подтверждения родителя" : "Не получилось создать чек";
        });
    });
  }

  /* ══════════════════════════════════════
     PARENT DASHBOARD
  ══════════════════════════════════════ */
  var PARENT_TABS = [
    { id: "pending", label: "Подтверждения" },
    { id: "overview", label: "Обзор" },
    { id: "tasks", label: "Задания" },
    { id: "kids", label: "Дети" },
    { id: "tiers", label: "Номиналы чека" },
    { id: "adjust", label: "Корректировка" },
    { id: "checks", label: "Чеки" },
    { id: "history", label: "История" },
    { id: "logs", label: "Журнал действий" },
    { id: "password", label: "Пароль" }
  ];

  function renderParent() {
    var html = '<div class="shell shell-wide">' + topbarHtml();
    html += '<div class="parent-tabs" role="tablist">';
    PARENT_TABS.forEach(function (t) {
      var badge = t.id === "pending" && PARENT_CACHE.pending && PARENT_CACHE.pending.length ? '<span class="tab-badge">' + PARENT_CACHE.pending.length + "</span>" : "";
      html += '<button class="parent-tab" data-tab="' + t.id + '" aria-selected="' + (VIEW.parentTab === t.id) + '" type="button">' + t.label + badge + "</button>";
    });
    html += "</div>";
    html += '<div id="parentTabBody"></div>';
    html += "</div>";
    root.innerHTML = html;
    wireTopbar();

    document.querySelectorAll("[data-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        VIEW.parentTab = btn.getAttribute("data-tab");
        renderParent();
      });
    });

    renderParentTab(VIEW.parentTab);
  }

  function renderParentTab(tab) {
    var body = document.getElementById("parentTabBody");
    if (tab === "pending") return renderTabPending(body);
    if (tab === "overview") return renderTabOverview(body);
    if (tab === "tasks") return renderTabTasks(body);
    if (tab === "kids") return renderTabKids(body);
    if (tab === "tiers") return renderTabTiers(body);
    if (tab === "adjust") return renderTabAdjust(body);
    if (tab === "checks") return renderTabChecks(body);
    if (tab === "history") return renderTabHistory(body);
    if (tab === "logs") return renderTabLogs(body);
    if (tab === "password") return renderTabPassword(body);
  }

  /* ── Подтверждения ── */
  function renderTabPending(body) {
    body.innerHTML = '<div class="card"><div class="section-heading">Ждут подтверждения</div><div id="pendingList">Загрузка…</div></div>';
    api("GET", "/api/parent/pending").then(function (res) {
      PARENT_CACHE.pending = res.pending;
      var listEl = document.getElementById("pendingList");
      if (!listEl) return;
      if (res.pending.length === 0) {
        listEl.innerHTML = '<div class="empty-note">Сейчас ничего не ждёт подтверждения.</div>';
        return;
      }
      var html = "";
      res.pending.forEach(function (p) {
        var what = p.type === "task"
          ? escapeHtml(p.taskName) + " (★" + p.stars + ")"
          : "Чек на ★" + p.stars + " → " + money(p.amount) + (p.breakdown ? " (" + p.breakdown.map(function (x) { return "★" + x; }).join("+") + ")" : "");
        html +=
          '<div class="pending-approve-row"><span class="what">' + what + '<span class="who">' + escapeHtml(p.kidName) + " · " + fmtDateTime(p.ts) + "</span></span>" +
          '<button class="mini-btn no" data-reject="' + p.id + '" type="button">Отклонить</button>' +
          '<button class="mini-btn ok" data-confirm="' + p.id + '" type="button">Подтвердить</button></div>';
      });
      listEl.innerHTML = html;
      listEl.querySelectorAll("[data-confirm]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          api("POST", "/api/parent/pending/" + btn.getAttribute("data-confirm") + "/confirm").then(function () {
            toast("Подтверждено");
            renderTabPending(body);
          });
        });
      });
      listEl.querySelectorAll("[data-reject]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          api("POST", "/api/parent/pending/" + btn.getAttribute("data-reject") + "/reject").then(function () {
            toast("Отклонено");
            renderTabPending(body);
          });
        });
      });
    });
  }

  /* ── Обзор ── */
  function renderTabOverview(body) {
    body.innerHTML = '<div class="card"><div class="section-heading">Обзор по детям</div><div id="overviewParentList">Загрузка…</div></div>';
    api("GET", "/api/parent/overview").then(function (res) {
      var listEl = document.getElementById("overviewParentList");
      if (!listEl) return;
      if (res.kids.length === 0) {
        listEl.innerHTML = '<div class="empty-note">Пока нет ни одного ребёнка.</div>';
        return;
      }
      var html = "";
      res.kids.forEach(function (k) {
        html +=
          '<div class="row-line"><span class="kid-dot" style="background:' + k.color + '"></span>' +
          '<span class="task-name">' + escapeHtml(k.name) + "</span>" +
          '<span class="star-chip">★ ' + k.balance + "</span>" +
          '<span style="font-size:12px;color:var(--text-muted);flex-shrink:0;">' + k.completed + " заданий</span></div>";
      });
      listEl.innerHTML = html;
    });
  }

  /* ── Задания ── */
  function kidCheckboxesHtml(kids, checkedIds, name) {
    return kids.map(function (k) {
      var checked = checkedIds.indexOf(k.id) !== -1;
      return (
        '<label style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border:1px solid var(--border);border-radius:999px;font-size:12.5px;margin:0 6px 6px 0;background:' +
        (checked ? "color-mix(in srgb, " + k.color + " 20%, transparent)" : "var(--surface-2)") +
        '"><input type="checkbox" class="' + name + '" value="' + k.id + '"' + (checked ? " checked" : "") + ' style="accent-color:' + k.color + ';"><span class="kid-dot" style="background:' + k.color + '"></span>' + escapeHtml(k.name) + "</label>"
      );
    }).join("");
  }

  var TASKS_SUB_TABS = [
    { id: "current", label: "Текущие задания" },
    { id: "done", label: "Выполненные" },
    { id: "new", label: "Новое задание" }
  ];

  function tasksKidFilterHtml(kids) {
    var html = '<div class="history-filter" id="tasksKidFilter">';
    html += '<button data-filter="" aria-selected="' + (VIEW.tasksFilterKid === "") + '" type="button">Все</button>';
    kids.forEach(function (k) {
      html += '<button data-filter="' + k.id + '" aria-selected="' + (VIEW.tasksFilterKid === k.id) + '" type="button">' + escapeHtml(k.name) + "</button>";
    });
    html += "</div>";
    return html;
  }

  function renderTabTasks(body) {
    body.innerHTML =
      '<div class="parent-tabs" role="tablist" id="tasksSubTabs" style="margin-bottom:14px;"></div>' +
      '<div id="tasksSubBody"></div>';
    var subTabsEl = document.getElementById("tasksSubTabs");
    TASKS_SUB_TABS.forEach(function (t) {
      var btn = document.createElement("button");
      btn.className = "parent-tab";
      btn.type = "button";
      btn.textContent = t.label;
      btn.setAttribute("aria-selected", VIEW.tasksSubTab === t.id);
      btn.addEventListener("click", function () {
        VIEW.tasksSubTab = t.id;
        renderTabTasks(body);
      });
      subTabsEl.appendChild(btn);
    });

    api("GET", "/api/parent/overview").then(function (overviewRes) {
      var kids = overviewRes.kids;
      var subBody = document.getElementById("tasksSubBody");
      if (!subBody) return;

      if (kids.length === 0) {
        subBody.innerHTML = '<div class="card"><div class="empty-note">Сначала добавьте ребёнка на вкладке «Дети» — иначе назначать задания некому.</div></div>';
        return;
      }

      if (VIEW.tasksSubTab === "current") return renderTasksCurrent(subBody, kids);
      if (VIEW.tasksSubTab === "done") return renderTasksDone(subBody, kids);
      if (VIEW.tasksSubTab === "new") return renderTasksNew(subBody, kids, body);
    });
  }

  function kidNamesLine(kids, ids) {
    if (ids.length === 0) return '<span style="color:var(--coral);font-size:12px;">Пока никому не назначено</span>';
    return ids
      .map(function (id) { return kids.filter(function (k) { return k.id === id; })[0]; })
      .filter(Boolean)
      .map(function (k) { return '<span class="kid-dot" style="display:inline-block;background:' + k.color + ';margin-right:3px;"></span>' + escapeHtml(k.name); })
      .join('<span style="color:var(--text-muted);"> · </span>');
  }

  function renderTasksCurrent(subBody, kids) {
    subBody.innerHTML = '<div class="card"><div class="section-eyebrow">В работе сейчас</div><div class="section-heading">Текущие задания</div>' + tasksKidFilterHtml(kids) + '<div id="tasksCurrentList">Загрузка…</div></div>';
    wireTasksKidFilter(function () { renderTasksCurrent(subBody, kids); });
    api("GET", "/api/parent/tasks").then(function (res) {
      var listEl = document.getElementById("tasksCurrentList");
      if (!listEl) return;
      // "Текущие" — только те, у кого прямо сейчас есть хотя бы один назначенный ребёнок.
      // Подтверждённые задания снимаются с ребёнка (см. confirm на сервере) и потому сюда не попадают.
      var assigned = res.tasks.filter(function (t) { return (t.assignedKidIds || []).length > 0; });
      var tasks = VIEW.tasksFilterKid
        ? assigned.filter(function (t) { return (t.assignedKidIds || []).indexOf(VIEW.tasksFilterKid) !== -1; })
        : assigned;
      if (tasks.length === 0) {
        listEl.innerHTML = '<div class="empty-note">' + (VIEW.tasksFilterKid ? "У этого ребёнка сейчас нет активных заданий." : "Сейчас никому ничего не назначено.") + "</div>";
        return;
      }
      var html = "";
      tasks.forEach(function (t) {
        html +=
          '<div class="task-manage-block" data-task-block="' + t.id + '" style="border-bottom:1px solid var(--border);padding:10px 0;">' +
          '<div style="padding-bottom:6px;">' + kidNamesLine(kids, t.assignedKidIds || []) + "</div>" +
          '<div class="manage-row" style="border:none;padding:0 0 6px;">' +
          '<div class="grow"><input type="text" class="t-name" value="' + escapeHtml(t.name) + '"></div>' +
          '<input type="number" class="t-stars" min="1" value="' + t.stars + '" style="width:56px">' +
          '<button class="icon-btn danger" data-del-task="' + t.id + '" type="button" title="Удалить">✕</button>' +
          "</div>" +
          '<div class="manage-row" style="border:none;padding:0 0 6px;">' +
          '<div class="grow"><input type="text" class="t-desc" placeholder="Описание (необязательно)" value="' + escapeHtml(t.description || "") + '"></div>' +
          '<button class="icon-btn" data-save-task="' + t.id + '" type="button" title="Сохранить">✓</button>' +
          "</div>" +
          '<div style="padding:2px 0 0;">' + kidCheckboxesHtml(kids, t.assignedKidIds || [], "t-kid") + "</div>" +
          "</div>";
      });
      listEl.innerHTML = html;

      listEl.querySelectorAll("[data-del-task]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          api("DELETE", "/api/parent/tasks/" + btn.getAttribute("data-del-task")).then(function () { renderTasksCurrent(subBody, kids); });
        });
      });
      listEl.querySelectorAll("[data-save-task]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-save-task");
          var block = listEl.querySelector('[data-task-block="' + id + '"]');
          var assignedKidIds = Array.prototype.map.call(block.querySelectorAll(".t-kid:checked"), function (cb) { return cb.value; });
          api("PUT", "/api/parent/tasks/" + id, {
            name: block.querySelector(".t-name").value.trim(),
            stars: block.querySelector(".t-stars").value,
            description: block.querySelector(".t-desc").value.trim(),
            assignedKidIds: assignedKidIds
          }).then(function () { toast("Сохранено"); renderTasksCurrent(subBody, kids); });
        });
      });
    });
  }

  function wireTasksKidFilter(rerender) {
    var filterEl = document.getElementById("tasksKidFilter");
    if (!filterEl) return;
    filterEl.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        VIEW.tasksFilterKid = btn.getAttribute("data-filter");
        rerender();
      });
    });
  }

  function renderTasksDone(subBody, kids) {
    subBody.innerHTML = '<div class="card"><div class="section-eyebrow">Уже сделано</div><div class="section-heading">Выполненные задания</div>' + tasksKidFilterHtml(kids) + '<div id="tasksDoneList"></div></div>';
    wireTasksKidFilter(function () { renderTasksDone(subBody, kids); });
    LISTS.tasksDone = { items: [], total: 0 };
    loadTasksDone();
  }
  function loadTasksDone() {
    var st = LISTS.tasksDone;
    if (!st) return;
    var url = "/api/parent/history?type=earn&offset=" + st.items.length + "&limit=10" + (VIEW.tasksFilterKid ? "&kidId=" + VIEW.tasksFilterKid : "");
    api("GET", url).then(function (res) {
      st.items = st.items.concat(res.items);
      st.total = res.total;
      renderTasksDoneList();
    });
  }
  function renderTasksDoneList() {
    var container = document.getElementById("tasksDoneList");
    var st = LISTS.tasksDone;
    if (!container || !st) return;
    if (st.items.length === 0) {
      container.innerHTML = '<div class="empty-note">Пока ничего не выполнено.</div>';
      return;
    }
    var html = "<ul>";
    st.items.forEach(function (e) {
      html += '<li class="ledger-row"><span class="ledger-desc"><span class="ledger-who">' + escapeHtml(e.kidName) + "</span> — " + escapeHtml(e.taskName) + '</span><span class="ledger-date">' + fmtDateTime(e.ts) + "</span>" + ledgerAmountHtml(e) + "</li>";
    });
    html += "</ul>";
    if (st.items.length < st.total) html += '<button class="load-more-btn" id="tasksDoneMore" type="button">Показать ещё 10</button>';
    container.innerHTML = html;
    var moreBtn = document.getElementById("tasksDoneMore");
    if (moreBtn) moreBtn.addEventListener("click", loadTasksDone);
  }

  function renderTasksNew(subBody, kids, tabBody) {
    subBody.innerHTML = '<div class="card" style="border:1px dashed var(--border);"><div class="section-eyebrow">Новое</div><div class="section-heading">Добавить задание</div><div id="tasksAdd"></div></div>';
    var addEl = document.getElementById("tasksAdd");
    addEl.innerHTML =
      '<div class="add-row"><input type="text" id="newTaskName" placeholder="Название задания"><input type="number" id="newTaskStars" placeholder="★" min="1" value="5" style="max-width:60px"></div>' +
      '<div class="add-row"><input type="text" id="newTaskDesc" placeholder="Описание (необязательно)"></div>' +
      '<div style="padding:8px 0 12px;">' + kidCheckboxesHtml(kids, kids.map(function (k) { return k.id; }), "new-t-kid") + "</div>" +
      '<button class="btn btn-gold btn-block" id="addTaskBtn" type="button">Добавить задание</button>';
    document.getElementById("addTaskBtn").addEventListener("click", function () {
      var name = document.getElementById("newTaskName").value.trim();
      var stars = document.getElementById("newTaskStars").value;
      var description = document.getElementById("newTaskDesc").value.trim();
      var assignedKidIds = Array.prototype.map.call(addEl.querySelectorAll(".new-t-kid:checked"), function (cb) { return cb.value; });
      if (!name) return;
      api("POST", "/api/parent/tasks", { name: name, stars: stars, description: description, assignedKidIds: assignedKidIds }).then(function () {
        toast("Задание добавлено");
        VIEW.tasksSubTab = "current";
        renderTabTasks(tabBody);
      });
    });
  }

  /* ── Дети ── */
  function renderTabKids(body) {
    var KID_COLORS = ["#F4B942", "#5FB3A3", "#E85A4B", "#7B8FE8", "#E8A0BF", "#7BC67E"];
    body.innerHTML = '<div class="card"><div class="section-heading">Дети</div><div id="kidsList">Загрузка…</div></div>';
    api("GET", "/api/parent/overview").then(function (res) {
      var listEl = document.getElementById("kidsList");
      if (!listEl) return;
      var html = "";
      res.kids.forEach(function (k) {
        html += '<div class="kid-manage-block" data-kid-block="' + k.id + '" style="border-bottom:1px solid var(--border);padding:9px 0;">';
        html += '<div class="manage-row" style="border:none;padding:0 0 6px;"><div class="swatch-row">';
        KID_COLORS.forEach(function (c) {
          html += '<button class="swatch" type="button" style="background:' + c + '" data-swatch="' + c + '" aria-pressed="' + (c === k.color) + '"></button>';
        });
        html +=
          '</div><div class="grow"><input type="text" class="k-name" value="' + escapeHtml(k.name) + '"></div>' +
          '<button class="icon-btn danger" data-del-kid="' + k.id + '" type="button">✕</button></div>' +
          '<div class="manage-row" style="border:none;padding:0;"><div class="grow"><input type="password" class="k-pass" placeholder="Новый пароль (необязательно)"></div>' +
          '<button class="icon-btn" data-save-kid="' + k.id + '" type="button">✓</button></div></div>';
      });
      html += '<div class="add-row"><input type="text" id="newKidName" placeholder="Имя ребёнка"><input type="password" id="newKidPass" placeholder="Пароль"><button class="add-btn" id="addKidBtn" type="button">+</button></div>';
      listEl.innerHTML = html;

      listEl.querySelectorAll("[data-kid-block]").forEach(function (block) {
        var id = block.getAttribute("data-kid-block");
        block.querySelectorAll("[data-swatch]").forEach(function (sw) {
          sw.addEventListener("click", function () {
            api("PUT", "/api/parent/kids/" + id, { color: sw.getAttribute("data-swatch") }).then(function () { renderTabKids(body); });
          });
        });
      });
      listEl.querySelectorAll("[data-del-kid]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          api("DELETE", "/api/parent/kids/" + btn.getAttribute("data-del-kid")).then(function () { renderTabKids(body); });
        });
      });
      listEl.querySelectorAll("[data-save-kid]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-save-kid");
          var block = listEl.querySelector('[data-kid-block="' + id + '"]');
          var name = block.querySelector(".k-name").value.trim();
          var pass = block.querySelector(".k-pass").value;
          var payload = { name: name };
          if (pass) payload.password = pass;
          api("PUT", "/api/parent/kids/" + id, payload).then(function () {
            toast("Сохранено");
            renderTabKids(body);
          });
        });
      });
      document.getElementById("addKidBtn").addEventListener("click", function () {
        var name = document.getElementById("newKidName").value.trim();
        var password = document.getElementById("newKidPass").value;
        if (!name || password.length < 4) { toast("Имя и пароль от 4 символов"); return; }
        api("POST", "/api/parent/kids", { name: name, password: password, color: KID_COLORS[res.kids.length % KID_COLORS.length] }).then(function () {
          renderTabKids(body);
        });
      });
    });
  }

  /* ── Номиналы чека ── */
  function renderTabTiers(body) {
    body.innerHTML = '<div class="card"><div class="section-heading">Номиналы чека</div><div class="empty-note">Ребёнок может обменять только число звёзд, кратное 5. Сумма считается сложением этих номиналов (сначала крупные).</div><div id="tiersList">Загрузка…</div></div>';
    api("GET", "/api/parent/overview").then(function (res) {
      var listEl = document.getElementById("tiersList");
      if (!listEl) return;
      var html = "";
      res.tiers.forEach(function (t) {
        html +=
          '<div class="tier-row"><span class="tier-stars">★' + t.stars + "</span>" +
          '<input type="number" class="tier-amount" value="' + t.amount + '" min="0" data-tier="' + t.stars + '">' +
          "<span>₽</span>" +
          '<button class="save-btn" data-save-tier="' + t.stars + '" type="button">Сохранить</button></div>';
      });
      listEl.innerHTML = html;
      listEl.querySelectorAll("[data-save-tier]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var stars = btn.getAttribute("data-save-tier");
          var input = listEl.querySelector('[data-tier="' + stars + '"]');
          api("PUT", "/api/parent/tiers/" + stars, { amount: input.value }).then(function () { toast("Сохранено"); });
        });
      });
    });
  }

  /* ── Ручная корректировка ── */
  function renderTabAdjust(body) {
    body.innerHTML = '<div class="card"><div class="section-heading">Ручная корректировка звёзд</div><div id="adjustBody">Загрузка…</div></div>';
    api("GET", "/api/parent/overview").then(function (res) {
      var wrap = document.getElementById("adjustBody");
      if (!wrap) return;
      if (res.kids.length === 0) {
        wrap.innerHTML = '<div class="empty-note">Сначала добавьте ребёнка.</div>';
        return;
      }
      var options = res.kids.map(function (k) { return '<option value="' + k.id + '">' + escapeHtml(k.name) + "</option>"; }).join("");
      wrap.innerHTML =
        '<div class="field"><label>Ребёнок</label><select id="adjustKid" style="width:100%;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:9px 10px;color:var(--text);font-size:14px;">' + options + "</select></div>" +
        '<div class="btn-row" style="margin-bottom:12px;">' +
        '<button class="btn btn-gold" id="adjustModeAdd" type="button" aria-pressed="true">+ Начислить</button>' +
        '<button class="btn btn-ghost" id="adjustModeSub" type="button" aria-pressed="false">− Списать</button>' +
        "</div>" +
        '<div class="add-row"><input type="text" id="adjustReason" placeholder="Причина (необязательно)"><input type="number" id="adjustStars" placeholder="★" min="1" value="1" style="max-width:70px"><button class="add-btn" id="adjustBtn" type="button">OK</button></div>';

      var mode = "add";
      var addBtn = document.getElementById("adjustModeAdd");
      var subBtn = document.getElementById("adjustModeSub");
      function setMode(m) {
        mode = m;
        addBtn.className = m === "add" ? "btn btn-gold" : "btn btn-ghost";
        subBtn.className = m === "sub" ? "btn btn-gold" : "btn btn-ghost";
        addBtn.setAttribute("aria-pressed", m === "add");
        subBtn.setAttribute("aria-pressed", m === "sub");
      }
      addBtn.addEventListener("click", function () { setMode("add"); });
      subBtn.addEventListener("click", function () { setMode("sub"); });

      document.getElementById("adjustBtn").addEventListener("click", function () {
        var magnitude = parseInt(document.getElementById("adjustStars").value, 10);
        if (!magnitude || magnitude < 1) return;
        var starsVal = mode === "sub" ? -magnitude : magnitude;
        api("POST", "/api/parent/adjust", {
          kidId: document.getElementById("adjustKid").value,
          stars: starsVal,
          reason: document.getElementById("adjustReason").value.trim()
        }).then(function () {
          toast("Готово: " + (starsVal >= 0 ? "+" : "") + starsVal + " ★");
          document.getElementById("adjustStars").value = "1";
          document.getElementById("adjustReason").value = "";
        });
      });
    });
  }

  /* ── Чеки: только обналиченные звёзды — когда и кому ── */
  function renderTabChecks(body) {
    body.innerHTML = '<div class="card"><div class="section-eyebrow">Обналичено</div><div class="section-heading">История чеков</div><div class="history-filter" id="checksFilter"></div><div id="checksList">Загрузка…</div></div>';
    api("GET", "/api/parent/overview").then(function (res) {
      var filterEl = document.getElementById("checksFilter");
      var html = '<button data-filter="" aria-selected="' + (VIEW.checksFilterKid === "") + '" type="button">Все</button>';
      res.kids.forEach(function (k) { html += '<button data-filter="' + k.id + '" aria-selected="' + (VIEW.checksFilterKid === k.id) + '" type="button">' + escapeHtml(k.name) + "</button>"; });
      filterEl.innerHTML = html;
      filterEl.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          VIEW.checksFilterKid = btn.getAttribute("data-filter");
          renderTabChecks(body);
        });
      });
      LISTS.parentChecks = { items: [], total: 0 };
      loadParentChecks();
    });
  }
  function loadParentChecks() {
    var st = LISTS.parentChecks;
    var url = "/api/parent/history?type=redeem&offset=" + st.items.length + "&limit=10" + (VIEW.checksFilterKid ? "&kidId=" + VIEW.checksFilterKid : "");
    api("GET", url).then(function (res) {
      st.items = st.items.concat(res.items);
      st.total = res.total;
      renderParentChecksList();
    });
  }
  function renderParentChecksList() {
    var container = document.getElementById("checksList");
    if (!container) return;
    var st = LISTS.parentChecks;
    if (st.items.length === 0) {
      container.innerHTML = '<div class="empty-note">Пока ни одного обналиченного чека.</div>';
      return;
    }
    var html = "<ul>";
    st.items.forEach(function (e) {
      var breakdown = (e.breakdown || []).map(function (s) { return "★" + s; }).join(" + ");
      html +=
        '<li class="ledger-row"><span class="ledger-desc"><span class="ledger-who">' + escapeHtml(e.kidName) + "</span> — ★" + e.stars +
        (breakdown ? " (" + breakdown + ")" : "") + " → " + money(e.amount) +
        '</span><span class="ledger-date">' + fmtDateTime(e.ts) + "</span></li>";
    });
    html += "</ul>";
    if (st.items.length < st.total) html += '<button class="load-more-btn" id="checksMore" type="button">Показать ещё 10</button>';
    container.innerHTML = html;
    var moreBtn = document.getElementById("checksMore");
    if (moreBtn) moreBtn.addEventListener("click", loadParentChecks);
  }

  /* ── История (полная, с фильтром по ребёнку) ── */
  function renderTabHistory(body) {
    body.innerHTML = '<div class="card"><div class="section-heading">История (включая обмены)</div><div class="history-filter" id="historyFilter"></div><div id="historyList"></div></div>';
    api("GET", "/api/parent/overview").then(function (res) {
      var filterEl = document.getElementById("historyFilter");
      var html = '<button data-filter="" aria-selected="true" type="button">Все</button>';
      res.kids.forEach(function (k) { html += '<button data-filter="' + k.id + '" aria-selected="false" type="button">' + escapeHtml(k.name) + "</button>"; });
      filterEl.innerHTML = html;
      LISTS.parentHistory = { items: [], total: 0, kidId: "" };
      filterEl.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          filterEl.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-selected", "false"); });
          btn.setAttribute("aria-selected", "true");
          LISTS.parentHistory = { items: [], total: 0, kidId: btn.getAttribute("data-filter") };
          loadParentHistory();
        });
      });
      loadParentHistory();
    });
  }
  function loadParentHistory() {
    var st = LISTS.parentHistory;
    var url = "/api/parent/history?offset=" + st.items.length + "&limit=10" + (st.kidId ? "&kidId=" + st.kidId : "");
    api("GET", url).then(function (res) {
      st.items = st.items.concat(res.items);
      st.total = res.total;
      renderParentHistoryList();
    });
  }
  function renderParentHistoryList() {
    var container = document.getElementById("historyList");
    if (!container) return;
    var st = LISTS.parentHistory;
    if (st.items.length === 0) {
      container.innerHTML = '<div class="empty-note">Пока пусто.</div>';
      return;
    }
    var html = "<ul>";
    st.items.forEach(function (e) {
      html += '<li class="ledger-row"><span class="ledger-desc">' + describeLedger(e, true) + '</span><span class="ledger-date">' + fmtDateTime(e.ts) + "</span>" + ledgerAmountHtml(e) + "</li>";
    });
    html += "</ul>";
    if (st.items.length < st.total) html += '<button class="load-more-btn" id="historyMore" type="button">Показать ещё 10</button>';
    container.innerHTML = html;
    var moreBtn = document.getElementById("historyMore");
    if (moreBtn) moreBtn.addEventListener("click", loadParentHistory);
  }

  /* ── Журнал действий ── */
  function renderTabLogs(body) {
    body.innerHTML = '<div class="card"><div class="section-heading">Журнал действий</div><div class="empty-note">Кто что делал в приложении, только для родителя.</div><div id="logsList"></div></div>';
    LISTS.logs = { items: [], total: 0 };
    loadLogs();
  }
  function loadLogs() {
    var st = LISTS.logs;
    api("GET", "/api/parent/logs?offset=" + st.items.length + "&limit=10").then(function (res) {
      st.items = st.items.concat(res.items);
      st.total = res.total;
      renderLogsList();
    });
  }
  function renderLogsList() {
    var container = document.getElementById("logsList");
    if (!container) return;
    var st = LISTS.logs;
    if (st.items.length === 0) {
      container.innerHTML = '<div class="empty-note">Записей пока нет.</div>';
      return;
    }
    var html = "<ul>";
    st.items.forEach(function (e) {
      html +=
        '<li class="ledger-row"><span class="ledger-desc"><span class="ledger-who">' + escapeHtml(e.actor.name) + "</span> — " + escapeHtml(e.details || e.action) + '</span><span class="ledger-date">' + fmtDateTime(e.ts) + "</span></li>";
    });
    html += "</ul>";
    if (st.items.length < st.total) html += '<button class="load-more-btn" id="logsMore" type="button">Показать ещё 10</button>';
    container.innerHTML = html;
    var moreBtn = document.getElementById("logsMore");
    if (moreBtn) moreBtn.addEventListener("click", loadLogs);
  }

  /* ── Пароль родителя ── */
  function renderTabPassword(body) {
    body.innerHTML =
      '<div class="card"><div class="section-heading">Сменить пароль</div>' +
      '<div class="field"><label>Новый пароль</label><input type="password" id="newParentPass"></div>' +
      '<div class="form-error" id="passErr"></div>' +
      '<button class="btn btn-gold" id="savePassBtn" type="button">Сохранить</button></div>';
    document.getElementById("savePassBtn").addEventListener("click", function () {
      var pass = document.getElementById("newParentPass").value;
      api("POST", "/api/parent/password", { password: pass })
        .then(function () { toast("Пароль изменён"); document.getElementById("newParentPass").value = ""; })
        .catch(function () { document.getElementById("passErr").textContent = "Минимум 4 символа"; });
    });
  }

  /* ══════════════════════════════════════
     Init
  ══════════════════════════════════════ */
  function render() {
    if (!STATE) return;
    if (STATE.session.role === "parent") return renderParent();
    if (STATE.session.role === "kid") return renderKid();
    return renderHome();
  }

  function refreshState() {
    return api("GET", "/api/state").then(function (res) {
      STATE = res;
      render();
    });
  }

  refreshState();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/service-worker.js").catch(function () {});
    });
  }
})();
