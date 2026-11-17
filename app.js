/* Wheel logic. The food lists live in foods.js — edit them there. */
(function () {
  'use strict';

  var STORAGE_KEY = 'foodWheels.v1';
  var MAX_ITEMS = 24;
  var TAU = Math.PI * 2;
  var DAY_MS = 24 * 60 * 60 * 1000;
  var skipDays = typeof SKIP_DAYS === 'number' && SKIP_DAYS > 0 ? SKIP_DAYS : 0;
  var ids = Object.keys(FOODS);

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('wheel');
  var ctx = canvas.getContext('2d');
  var wrap = $('wheelWrap');
  var pointer = $('pointer');

  var state = load();
  var rot = 0;            // current wheel rotation in radians
  var spinning = false;
  var size = 0;           // canvas size in CSS pixels
  var lastResult = null;  // { name, color }

  /* ---------- Saved data ---------- */

  function load() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { /* ignore */ }
    var wheels = {};
    ids.forEach(function (id) {
      var base = FOODS[id].items.map(function (s) { return String(s).trim(); }).filter(Boolean);
      var s = saved.wheels && saved.wheels[id];
      // Saved edits are kept only while the list in foods.js is unchanged.
      var usable = s && Array.isArray(s.items) && JSON.stringify(s.base) === JSON.stringify(base);
      wheels[id] = usable
        ? { base: base, items: s.items.map(String), skipped: Object.assign({}, s.skipped) }
        : { base: base, items: base.slice(), skipped: {} };
    });
    return { wheels: wheels, tab: ids.indexOf(saved.tab) >= 0 ? saved.tab : ids[0] };
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function wheel() { return state.wheels[state.tab]; }

  function isSkipped(w, name) { return w.skipped[name] > Date.now(); }

  function activeItems() {
    var w = wheel();
    return w.items.filter(function (name) { return !isSkipped(w, name); });
  }

  /* ---------- Drawing ---------- */

  function sliceColor(i, n) {
    var hue = Math.round((i * 360) / n + 8) % 360;
    var light = i % 2 ? 78 : 68;
    return 'hsl(' + hue + ', 82%, ' + light + '%)';
  }

  function fitLabel(text, maxWidth, fontSize, minSize) {
    var setFont = function (px) {
      ctx.font = '600 ' + px + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    };
    setFont(fontSize);
    while (fontSize > minSize && ctx.measureText(text).width > maxWidth) {
      fontSize -= 1;
      setFont(fontSize);
    }
    if (ctx.measureText(text).width > maxWidth) {
      while (text.length > 1 && ctx.measureText(text + '…').width > maxWidth) {
        text = text.slice(0, -1).trimEnd();
      }
      text += '…';
    }
    return text;
  }

  function draw() {
    if (!size) return; // not laid out yet
    var items = activeItems();
    var n = items.length;
    var dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    var c = size / 2;
    var r = c - 3;

    if (!n) {
      ctx.beginPath();
      ctx.arc(c, c, r, 0, TAU);
      ctx.fillStyle = 'rgba(128, 128, 128, 0.15)';
      ctx.fill();
      return;
    }

    var a = TAU / n;
    var textOuter = r * 0.93;
    var textInner = r * 0.18;
    // Font size follows the slice width so 2 big slices and 20 thin ones both read well.
    var sliceWidth = n <= 2 ? r * 0.5 : 2 * Math.sin(a / 2) * r * 0.55;
    var fontSize = Math.max(10, Math.min(sliceWidth * 0.5, r * 0.13));

    for (var i = 0; i < n; i++) {
      var start = rot + i * a;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, r, start, start + a);
      ctx.closePath();
      ctx.fillStyle = sliceColor(i, n);
      ctx.fill();
      if (n > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(start + a / 2);
      ctx.fillStyle = '#2b2118';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(fitLabel(items[i], textOuter - textInner, fontSize, 9), textOuter, 0);
      ctx.restore();
    }

    // Rim and hub
    ctx.beginPath();
    ctx.arc(c, c, r, 0, TAU);
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c, c, r * 0.14, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function resize() {
    var w = Math.round(wrap.clientWidth);
    if (!w) return;
    var dpr = window.devicePixelRatio || 1;
    size = w;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * dpr);
    draw();
  }

  /* ---------- Spinning ---------- */

  // Index of the slice currently under the pointer (top of the wheel).
  function indexAtPointer(n) {
    var angle = (((-Math.PI / 2 - rot) % TAU) + TAU) % TAU;
    return Math.floor(angle / (TAU / n)) % n;
  }

  function spin() {
    var items = activeItems();
    var n = items.length;
    if (spinning || !n) return;
    spinning = true;
    updateControls();

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var startRot = rot;
    // A random number of full turns plus a random landing angle = a random slice.
    var delta = TAU * (reduced ? 1 : 5 + Math.floor(Math.random() * 3)) + Math.random() * TAU;
    var duration = reduced ? 1200 : 5200 + Math.random() * 1200;
    var t0 = performance.now();
    var lastIndex = indexAtPointer(n);
    var kick = 0;

    function frame(now) {
      var t = Math.min(1, (now - t0) / duration);
      rot = startRot + delta * (1 - Math.pow(1 - t, 3)); // ease-out: fast start, gentle stop
      draw();

      // Pointer flicks each time a slice edge passes it.
      var idx = indexAtPointer(n);
      if (idx !== lastIndex) { kick = 1; lastIndex = idx; }
      kick *= 0.82;
      pointer.style.transform = 'rotate(' + (-kick * 16).toFixed(2) + 'deg)';

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        rot = rot % TAU;
        pointer.style.transform = '';
        spinning = false;
        updateControls();
        showResult(items[idx], sliceColor(idx, n));
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Result popup ---------- */

  function showResult(name, color) {
    lastResult = { name: name };
    $('resultPrefix').textContent = (new Date().getHours() >= 16 || new Date().getHours() < 4) ? 'Tonight:' : 'Today:';
    $('resultName').textContent = name + '!';
    $('resultName').style.background = color;
    $('resultPrice').textContent = FOODS[state.tab].label + ' · ' + FOODS[state.tab].price + ' per person';
    var skipBtn = $('skip');
    skipBtn.hidden = !skipDays;
    skipBtn.textContent = 'We just had this — skip it for ' + skipDays + (skipDays === 1 ? ' day' : ' days');
    $('overlay').hidden = false;
    if (navigator.vibrate) navigator.vibrate(60);
    $('done').focus();
  }

  function closeResult() { $('overlay').hidden = true; }

  /* ---------- Tabs and editor ---------- */

  function renderTabs() {
    var tabs = $('tabs');
    tabs.textContent = '';
    ids.forEach(function (id) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(id === state.tab));
      var name = document.createElement('b');
      name.textContent = FOODS[id].label;
      var price = document.createElement('small');
      price.textContent = FOODS[id].price;
      b.append(name, price);
      b.addEventListener('click', function () {
        if (spinning || id === state.tab) return;
        state.tab = id;
        rot = 0;
        setMsg('');
        save();
        render();
      });
      tabs.appendChild(b);
    });
  }

  function renderList() {
    var w = wheel();
    var list = $('list');
    list.textContent = '';
    w.items.forEach(function (name) {
      var li = document.createElement('li');
      var label = document.createElement('span');
      label.className = 'name';
      label.textContent = name;
      li.appendChild(label);

      if (isSkipped(w, name)) {
        label.classList.add('skipped');
        var note = document.createElement('small');
        var until = new Date(w.skipped[name]);
        note.textContent = 'Skipped until ' + until.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
        label.appendChild(note);
        var back = document.createElement('button');
        back.type = 'button';
        back.className = 'chip';
        back.textContent = 'Bring back';
        back.addEventListener('click', function () {
          delete w.skipped[name];
          save();
          render();
        });
        li.appendChild(back);
      }

      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'remove';
      rm.textContent = '✕';
      rm.setAttribute('aria-label', 'Remove ' + name);
      rm.addEventListener('click', function () {
        if (spinning) return;
        w.items = w.items.filter(function (x) { return x !== name; });
        delete w.skipped[name];
        save();
        render();
      });
      li.appendChild(rm);
      list.appendChild(li);
    });
    $('count').textContent = '(' + w.items.length + ')';
  }

  function updateControls() {
    var total = wheel().items.length;
    var active = activeItems().length;
    $('spin').disabled = spinning || !active;
    $('spin').textContent = spinning ? 'Spinning…' : 'Spin';
    var empty = $('empty');
    empty.hidden = active > 0;
    empty.textContent = total
      ? 'Everything here is skipped. Bring something back in the list below.'
      : 'This wheel is empty. Add some foods below.';
  }

  function setMsg(text) { $('msg').textContent = text; }

  function render() {
    // Forget skips that have run out.
    ids.forEach(function (id) {
      var w = state.wheels[id];
      Object.keys(w.skipped).forEach(function (name) {
        if (!isSkipped(w, name)) delete w.skipped[name];
      });
    });
    renderTabs();
    renderList();
    updateControls();
    draw();
  }

  /* ---------- Events ---------- */

  $('spin').addEventListener('click', spin);

  $('addForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (spinning) return;
    var input = $('addInput');
    var name = input.value.trim().replace(/\s+/g, ' ');
    var w = wheel();
    if (!name) return;
    if (w.items.some(function (x) { return x.toLowerCase() === name.toLowerCase(); })) {
      setMsg('"' + name + '" is already on this wheel.');
      return;
    }
    if (w.items.length >= MAX_ITEMS) {
      setMsg('This wheel is full (' + MAX_ITEMS + ' items). Remove one first.');
      return;
    }
    w.items.push(name);
    input.value = '';
    setMsg('');
    save();
    render();
  });

  $('reset').addEventListener('click', function () {
    if (spinning) return;
    if (!window.confirm('Reset the ' + FOODS[state.tab].label + ' wheel to its original list?')) return;
    var w = wheel();
    w.items = w.base.slice();
    w.skipped = {};
    setMsg('');
    save();
    render();
  });

  $('done').addEventListener('click', closeResult);

  $('respin').addEventListener('click', function () {
    closeResult();
    spin();
  });

  $('skip').addEventListener('click', function () {
    if (lastResult) {
      wheel().skipped[lastResult.name] = Date.now() + skipDays * DAY_MS;
      save();
    }
    closeResult();
    render();
  });

  $('overlay').addEventListener('click', function (e) {
    if (e.target === this) closeResult();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeResult();
  });

  if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap);
  window.addEventListener('resize', resize);

  render();
  resize();
})();
