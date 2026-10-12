/* core.js — shared helpers, achievements, boot, theme, nav, reveal, text fx */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
  };

  const cssVar = (name) => getComputedStyle(html).getPropertyValue(name).trim();

  /* ---------- toasts ---------- */
  const toastBox = $('#toasts');
  function toast(title, body = '', icon = '★', label = 'achievement unlocked') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="ic"></span><div><small></small><b></b><p></p></div>`;
    el.querySelector('.ic').textContent = icon;
    el.querySelector('small').textContent = label;
    el.querySelector('b').textContent = title;
    el.querySelector('p').textContent = body;
    toastBox.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, 4200);
  }

  /* ---------- achievements ---------- */
  const ACH = [
    { id: 'boot', icon: '⏻', name: 'Hello, world', hint: 'Load the site. You did it.' },
    { id: 'badge', icon: '◐', name: 'Pendulum physics', hint: 'Grab the ID badge and swing it.' },
    { id: 'shell', icon: '›_', name: 'Shell access', hint: 'Run a command in the terminal.' },
    { id: 'sudo', icon: '#', name: 'Not in the sudoers file', hint: 'Try to become root.' },
    { id: 'nmap', icon: '⌕', name: 'Recon complete', hint: 'Scan Luigi for open ports.' },
    { id: 'theme', icon: '☀', name: 'Lights on', hint: 'Switch the theme.' },
    { id: 'port', icon: '⌁', name: 'Patched in', hint: 'Patch 5 ports on the switch.' },
    { id: 'firewall', icon: '▣', name: 'Human firewall', hint: 'Score 150+ in the firewall game.' },
    { id: 'ping', icon: '◎', name: 'Pong', hint: 'Ping Luigi.' },
    { id: 'konami', icon: '↑↑', name: 'Old habits', hint: 'An old cheat code still works here.' },
    { id: 'trace', icon: '⚑', name: 'Full trace', hint: 'Reach the end of the page.' },
  ];
  let got = new Set(store.get('lh-ach', []).filter((id) => ACH.some((a) => a.id === id)));

  const achBtn = $('#ach-btn');
  const achDialog = $('#ach-dialog');

  function renderAch() {
    $('#ach-count').textContent = `${got.size}/${ACH.length}`;
    $('#ach-dialog-count').textContent = `${got.size}/${ACH.length}`;
    $('#ach-bar-fill').style.width = `${(got.size / ACH.length) * 100}%`;
    const list = $('#ach-list');
    list.innerHTML = '';
    ACH.forEach((a) => {
      const li = document.createElement('li');
      const has = got.has(a.id);
      if (has) li.className = 'got';
      li.innerHTML = `<span class="ic"></span><div><b></b><small></small></div>`;
      li.querySelector('.ic').textContent = has ? a.icon : '?';
      li.querySelector('b').textContent = has ? a.name : '???';
      li.querySelector('small').textContent = a.hint;
      list.appendChild(li);
    });
  }

  function unlock(id) {
    if (got.has(id)) return;
    const a = ACH.find((x) => x.id === id);
    if (!a) return;
    got.add(id);
    store.set('lh-ach', [...got]);
    renderAch();
    toast(a.name, a.hint, a.icon);
    achBtn.classList.remove('bump');
    void achBtn.offsetWidth;
    achBtn.classList.add('bump');
    if (got.size === ACH.length) {
      setTimeout(() => toast('100% completion', 'You found everything. At this point you should just email me.', '★', 'platinum'), 1200);
    }
  }

  achBtn.addEventListener('click', () => { renderAch(); achDialog.showModal(); });
  $('#ach-close').addEventListener('click', () => achDialog.close());
  achDialog.addEventListener('click', (e) => { if (e.target === achDialog) achDialog.close(); });
  $('#ach-reset').addEventListener('click', () => {
    got = new Set();
    store.set('lh-ach', []);
    renderAch();
  });
  renderAch();

  /* ---------- text scramble ---------- */
  const GLYPHS = '!#$%&*+-=?@^_01/\\[]{}~';
  function scramble(el, text = el.dataset.text || el.textContent, duration = 750) {
    if (reduceMotion) { el.textContent = text; return; }
    el.dataset.text = text;
    const frames = Math.max(12, Math.round(duration / 16));
    const queue = [...text].map((ch) => {
      const start = Math.floor(Math.random() * frames * 0.4);
      return { ch, start, end: start + Math.floor(frames * 0.3 + Math.random() * frames * 0.5) };
    });
    let frame = 0;
    cancelAnimationFrame(el._scr);
    const tick = () => {
      let out = '';
      let done = 0;
      for (const q of queue) {
        if (frame >= q.end || q.ch === ' ') { done++; out += q.ch === ' ' ? ' ' : escapeHtml(q.ch); }
        else if (frame >= q.start) out += `<span class="glyph">${escapeHtml(GLYPHS[(Math.random() * GLYPHS.length) | 0])}</span>`;
        else out += escapeHtml(q.ch);
      }
      el.innerHTML = out;
      frame++;
      if (done < queue.length) el._scr = requestAnimationFrame(tick);
    };
    tick();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  $$('.hero-name .scramble').forEach((el) => {
    el.addEventListener('mouseenter', () => scramble(el));
  });

  /* ---------- boot sequence ---------- */
  const BOOT = [
    ['LH-BIOS v26.10 · (c) Luigi Adrian T. Hatamosa', 'w'],
    ['CPU0: curiosity @ 4.20GHz ................ ', 'OK'],
    ['Memory check: 2010 → 2026 ................ ', 'OK'],
    ['eth0: link up, 1000Mbps, origin=cebu.ph ... ', 'OK'],
    ['loading cisco/itn.ko ..................... ', 'OK'],
    ['loading cisco/srwe.ko .................... ', 'OK'],
    ['loading cisco/cyber-analyst.ko ........... ', 'OK'],
    ['mounting /projects ....................... ', '5 found'],
    ['starting portfolio.service ............... ', '[ OK ]'],
    ['', ''],
    ['welcome, guest.', 'w'],
  ];

  function finishBoot() {
    const boot = $('#boot');
    if (!html.classList.contains('booting') || boot.classList.contains('done')) return;
    try { sessionStorage.setItem('lh-booted', '1'); } catch { /* ignore */ }
    boot.classList.add('done');
    setTimeout(() => {
      html.classList.remove('booting');
      document.dispatchEvent(new Event('site:ready'));
    }, 450);
    window.removeEventListener('keydown', finishBoot);
    window.removeEventListener('pointerdown', finishBoot);
  }

  function runBoot() {
    const log = $('#boot-log');
    let i = 0;
    const step = () => {
      if (!html.classList.contains('booting') || $('#boot').classList.contains('done')) return;
      if (i >= BOOT.length) { setTimeout(finishBoot, 380); return; }
      const [text, status] = BOOT[i++];
      const line = document.createElement('div');
      if (status === 'w') { line.className = 'w'; line.textContent = text; }
      else {
        line.textContent = text;
        if (status) { const s = document.createElement('span'); s.className = 'ok'; s.textContent = status; line.appendChild(s); }
      }
      log.appendChild(line);
      setTimeout(step, 90 + Math.random() * 90);
    };
    step();
    window.addEventListener('keydown', finishBoot);
    window.addEventListener('pointerdown', finishBoot);
  }

  function onReady(fn) {
    if (html.classList.contains('booting')) document.addEventListener('site:ready', fn, { once: true });
    else fn();
  }

  if (html.classList.contains('booting')) runBoot();
  else document.dispatchEvent(new Event('site:ready'));

  onReady(() => {
    $$('.hero-name .scramble').forEach((el, i) => setTimeout(() => scramble(el, el.dataset.text, 1000), i * 180));
    setTimeout(() => unlock('boot'), 900);
  });

  /* ---------- theme ---------- */
  $('#theme-btn').addEventListener('click', () => {
    const next = html.dataset.theme === 'light' ? 'dark' : 'light';
    html.dataset.theme = next;
    store.set('lh-theme', next);
    document.querySelector('meta[name="theme-color"]').content = next === 'light' ? '#f2eee4' : '#070a10';
    document.dispatchEvent(new Event('site:theme'));
    unlock('theme');
  });

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const menuBtn = $('#menu-btn');
  const links = $('#nav-links');
  menuBtn.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('open', open);
  });
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      links.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('click', (e) => {
    if (links.classList.contains('open') && !e.target.closest('#nav')) {
      links.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  const progress = $('#scroll-progress');
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 20);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (max > 0 && y >= max - 40) unlock('trace');
    document.dispatchEvent(new CustomEvent('site:scroll', { detail: { y, dy: y - lastY } }));
    lastY = y;
  }
  window.addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
  onScroll();

  // active section highlight
  const navMap = new Map($$('.nav-links a').map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navMap.forEach((a) => a.classList.remove('active'));
      const a = navMap.get(en.target.id);
      if (a) a.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => spy.observe(s));

  /* ---------- reveal on scroll ---------- */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');
      revealer.unobserve(el);
      setTimeout(() => { el.style.transitionDelay = ''; }, 1300);
      const h = el.querySelector('[data-scramble]');
      if (h) scramble(h, h.dataset.text || h.textContent, 900);
      el.dispatchEvent(new Event('reveal'));
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  // stagger siblings inside grids
  $$('.reveal').forEach((el) => {
    const sibs = $$(':scope > .reveal', el.parentElement);
    const idx = sibs.indexOf(el);
    if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 6) * 70}ms`;
    revealer.observe(el);
  });

  /* ---------- clock + uptime + year ---------- */
  const clock = $('#clock');
  const uptime = $('#uptime');
  const t0 = Date.now();
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila' });
  function tickClock() {
    clock.textContent = fmt.format(new Date());
    const s = Math.floor((Date.now() - t0) / 1000);
    uptime.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }
  tickClock();
  setInterval(tickClock, 1000);
  $('#year').textContent = new Date().getFullYear();

  /* ---------- role rotator ---------- */
  const ROLES = [
    'keep networks up',
    'subnet without a calculator',
    'build things, then break them',
    'triage tickets calmly',
    'make games in Godot',
    'fix the printer (probably)',
  ];
  const rot = $('#rotator');
  if (!reduceMotion) {
    let ri = 0;
    let ci = ROLES[0].length;
    let deleting = true;
    let wait = 2200;
    const typeStep = () => {
      const word = ROLES[ri];
      if (wait > 0) { const w = wait; wait = 0; return setTimeout(typeStep, w); }
      if (deleting) {
        ci--;
        rot.textContent = word.slice(0, ci);
        if (ci <= 0) { deleting = false; ri = (ri + 1) % ROLES.length; }
        return setTimeout(typeStep, 28);
      }
      const next = ROLES[ri];
      ci++;
      rot.textContent = next.slice(0, ci);
      if (ci >= next.length) { deleting = true; wait = 2200; }
      return setTimeout(typeStep, 55 + Math.random() * 50);
    };
    typeStep();
  }

  /* ---------- counters ---------- */
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      counterObs.unobserve(en.target);
      const el = en.target;
      const end = Number(el.dataset.count);
      if (reduceMotion) { el.textContent = end; return; }
      const start = performance.now();
      const dur = 1200;
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });
  $$('[data-count]').forEach((el) => counterObs.observe(el));

  /* ---------- konami ---------- */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kpos = 0;
  window.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kpos = key === KONAMI[kpos] ? kpos + 1 : key === KONAMI[0] ? 1 : 0;
    if (kpos === KONAMI.length) { kpos = 0; godMode(); }
  });

  function godMode() {
    unlock('konami');
    html.classList.add('godmode');
    const bits = ['0', '1', '{', '}', '<', '>', '#', '$', '★', 'ok'];
    const colors = ['--acc', '--amber', '--info', '--violet', '--danger'].map(cssVar);
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.textContent = bits[i % bits.length];
      s.style.left = `${Math.random() * 100}vw`;
      s.style.color = colors[i % colors.length];
      s.style.animationDuration = `${2 + Math.random() * 2.5}s`;
      s.style.animationDelay = `${Math.random() * 0.8}s`;
      document.body.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    }
    setTimeout(() => html.classList.remove('godmode'), 6000);
  }

  /* ---------- magnetic buttons + cursor ring ---------- */
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * 0.25}px`);
        btn.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
      });
      btn.addEventListener('pointerleave', () => { btn.style.setProperty('--mx', '0px'); btn.style.setProperty('--my', '0px'); });
    });

    const ring = $('#cursor-ring');
    let rx = -100, ry = -100, tx = -100, ty = -100;
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      ring.classList.add('on');
      ring.classList.toggle('hot', !!e.target.closest('a, button, input, textarea, .badge, canvas, [data-tilt]'));
    });
    document.addEventListener('pointerleave', () => ring.classList.remove('on'));
    const follow = () => {
      rx += (tx - rx) * 0.2;
      ry += (ty - ry) * 0.2;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  window.Site = { $, $$, store, toast, unlock, scramble, escapeHtml, cssVar, reduceMotion, finePointer, onReady, godMode };
})();
