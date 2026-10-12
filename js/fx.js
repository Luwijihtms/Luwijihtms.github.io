/* fx.js — network background, swinging ID badge, card tilt */
(() => {
  const { $, $$, unlock, cssVar, reduceMotion, finePointer } = window.Site;

  /* ---------- background: live network graph ---------- */
  const canvas = $('#net-bg');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let nodes = [];
  let packets = [];
  let colors = {};
  const mouse = { x: -9999, y: -9999 };
  const LINK = 140;

  function readColors() {
    colors = { acc: cssVar('--acc'), line: cssVar('--line-2'), info: cssVar('--info'), light: document.documentElement.dataset.theme === 'light' };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(95, Math.max(28, (W * H) / 15000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.4 + 0.7,
      hub: Math.random() < 0.08,
    }));
    packets = [];
    if (reduceMotion) draw();
  }

  function spawnPacket() {
    const a = nodes[(Math.random() * nodes.length) | 0];
    let best = null, bestD = LINK;
    for (const b of nodes) {
      if (b === a) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < bestD && Math.random() < 0.6) { best = b; bestD = d; }
    }
    if (best) packets.push({ a, b: best, t: 0, speed: 0.012 + Math.random() * 0.012 });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const lineAlpha = colors.light ? 0.28 : 0.2;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > LINK * LINK) continue;
        const d = Math.sqrt(d2);
        const mx = (a.x + b.x) / 2 - mouse.x, my = (a.y + b.y) / 2 - mouse.y;
        const near = mx * mx + my * my < 180 * 180;
        ctx.globalAlpha = (1 - d / LINK) * (near ? 0.75 : lineAlpha);
        ctx.strokeStyle = near ? colors.acc : colors.line;
        ctx.lineWidth = near ? 1.1 : 0.8;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    for (const n of nodes) {
      const dm = Math.hypot(n.x - mouse.x, n.y - mouse.y);
      ctx.globalAlpha = dm < 180 ? 0.95 : colors.light ? 0.45 : 0.5;
      ctx.fillStyle = dm < 180 || n.hub ? colors.acc : colors.line;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.hub ? n.r + 1.2 : n.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const p of packets) {
      const x = p.a.x + (p.b.x - p.a.x) * p.t;
      const y = p.a.y + (p.b.y - p.a.y) * p.t;
      ctx.fillStyle = colors.info;
      ctx.shadowColor = colors.info; ctx.shadowBlur = 8;
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      ctx.shadowBlur = 0;
    }
  }

  let lastSpawn = 0;
  let running = true;
  function loop(now) {
    if (!running) return;
    for (const n of nodes) {
      const dx = mouse.x - n.x, dy = mouse.y - n.y;
      const d = Math.hypot(dx, dy);
      if (d < 200 && d > 1) { n.x += (dx / d) * 0.15; n.y += (dy / d) * 0.15; }
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
    }
    if (now - lastSpawn > 260) { spawnPacket(); lastSpawn = now; }
    packets = packets.filter((p) => (p.t += p.speed) < 1);
    draw();
    requestAnimationFrame(loop);
  }

  readColors();
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('site:theme', () => { readColors(); if (reduceMotion) draw(); });
  window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  if (!reduceMotion) {
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(loop);
    });
    requestAnimationFrame(loop);
  }

  /* ---------- swinging ID badge ---------- */
  const stage = $('#badge-stage');
  const pend = $('#pendulum');
  const badge = $('#badge');
  if (stage && pend && badge) {
    let theta = reduceMotion ? 0 : 0.55; // start mid-swing so it settles in
    let omega = 0;
    let dragging = false;
    let grabOffset = 0;
    let lastDragT = 0;
    let lastTheta = 0;
    let swingCount = 0;
    let visible = true;
    let last = performance.now();

    const pivot = () => {
      const r = stage.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + 7 };
    };
    const length = () => pend.offsetHeight * 0.62; // effective pendulum length in px
    const pointerAngle = (e) => {
      const p = pivot();
      return Math.atan2(-(e.clientX - p.x), e.clientY - p.y);
    };
    const clamp = (v, a) => Math.max(-a, Math.min(a, v));

    function render() {
      pend.style.transform = `rotate(${theta}rad)`;
      badge.style.setProperty('--hx', `${50 + theta * 70}%`);
    }

    function step(now) {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      if (!dragging) {
        const g = 2400;
        const alpha = -(g / length()) * Math.sin(theta) - 0.7 * omega;
        omega += alpha * dt;
        theta += omega * dt;
      }
      render();
      if (visible) requestAnimationFrame(step);
    }

    const io = new IntersectionObserver(([en]) => {
      const was = visible;
      visible = en.isIntersecting;
      if (visible && !was) { last = performance.now(); requestAnimationFrame(step); }
    });
    io.observe(stage);
    requestAnimationFrame(step);

    badge.addEventListener('pointerdown', (e) => {
      dragging = true;
      badge.setPointerCapture(e.pointerId);
      grabOffset = pointerAngle(e) - theta;
      lastTheta = theta;
      lastDragT = performance.now();
      omega = 0;
    });
    badge.addEventListener('pointermove', (e) => {
      const r = badge.getBoundingClientRect();
      badge.style.setProperty('--hy', `${((e.clientY - r.top) / r.height) * 100}%`);
      if (!dragging) return;
      const now = performance.now();
      theta = clamp(pointerAngle(e) - grabOffset, 1.7);
      const dt = Math.max(0.008, (now - lastDragT) / 1000);
      omega = omega * 0.5 + ((theta - lastTheta) / dt) * 0.5;
      lastTheta = theta;
      lastDragT = now;
    });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      omega = clamp(omega, 14);
      if (Math.abs(omega) > 2 || Math.abs(theta) > 0.45) {
        swingCount++;
        unlock('badge');
        if (swingCount === 8) window.Site.toast('Okay, okay', 'The badge is getting dizzy. It has a job interview later.', '@', 'badge says');
      }
    };
    badge.addEventListener('pointerup', release);
    badge.addEventListener('pointercancel', release);
    badge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); omega -= 3; unlock('badge'); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); omega += 3; unlock('badge'); }
    });

    // scroll gives the badge a little nudge
    document.addEventListener('site:scroll', (e) => {
      if (!dragging && visible) omega += clamp(e.detail.dy * 0.004, 0.6);
    });
  }

  /* ---------- tilt cards ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.classList.add('tilting');
        card.style.setProperty('--ry', `${(px - 0.5) * 8}deg`);
        card.style.setProperty('--rx', `${(0.5 - py) * 8}deg`);
        card.style.setProperty('--sx', `${px * 100}%`);
        card.style.setProperty('--sy', `${py * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }
})();
