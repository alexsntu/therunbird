/* ══════════════════════════════════════════════════════
   RunBird configurator wizard — shared theme toggle
   Loaded by every configurator-*.wizard.html via a single <script src>,
   placed at the very top of the pasted block (before #rb-config) so the
   data-rb-theme attribute is set before the themed markup is parsed —
   avoids a flash of the wrong theme on load.

   Persists the visitor's choice in localStorage under "rb-cfg-theme"
   ("light" | "dark"), shared across every product page on this domain —
   pick a theme on one configurator, it's already applied on the next
   page you land on. No stored choice yet -> defaults to dark (today's
   look stays the default; light is opt-in).

   Each .wizard.html just needs an empty <div id="rb-cfg-theme-toggle">
   somewhere in its header — this script renders the actual switch into
   it. Palette itself lives in rb-cfg-theme.css, not here.
════════════════════════════════════════════════════════ */
(function(){

  var STORAGE_KEY = 'rb-cfg-theme';
  var root = document.documentElement;
  var current = 'dark';

  function getStored(){
    try { return localStorage.getItem(STORAGE_KEY); } catch(e){ return null; }
  }
  function setStored(v){
    try { localStorage.setItem(STORAGE_KEY, v); } catch(e){}
  }
  function apply(theme){
    current = theme === 'light' ? 'light' : 'dark';
    root.setAttribute('data-rb-theme', current);
  }

  // Applied immediately (script is synchronous, placed before the themed
  // markup) so there's no flash of the wrong theme.
  apply(getStored());

  function updateBtn(btn){
    btn.textContent = current === 'light' ? '☀️' : '🌙';
    var label = current === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }

  function updateAllButtons(){
    var btns = document.querySelectorAll('#rb-cfg-theme-toggle .rb-theme-toggle');
    Array.prototype.forEach.call(btns, updateBtn);
  }

  function wireSlots(){
    var slots = document.querySelectorAll('#rb-cfg-theme-toggle');
    Array.prototype.forEach.call(slots, function(slot){
      if (slot.dataset.rbWired) return;
      slot.dataset.rbWired = '1';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rb-theme-toggle';
      btn.addEventListener('click', function(){
        apply(current === 'light' ? 'dark' : 'light');
        setStored(current);
        updateAllButtons();
      });
      slot.appendChild(btn);
      updateBtn(btn);
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', wireSlots);
  } else {
    wireSlots();
  }

  // Multiple product pages can be open in different tabs — keep them in
  // sync if the visitor flips the switch in one of them.
  window.addEventListener('storage', function(e){
    if (e.key !== STORAGE_KEY) return;
    apply(e.newValue);
    updateAllButtons();
  });

})();
