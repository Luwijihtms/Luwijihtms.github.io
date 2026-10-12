/* game.js — "Be the firewall" */
(() => {
  const { $, store, unlock, cssVar } = window.Site;
  const wrap = $('#game');
  const canvas = $('#game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const overlay = $('#game-overlay');
  const goTitle = $('#go-title');
  const goText = $('#go-text');
  const goBtn = $('#go-btn');
  const hud = { score: $('#g-score'), wave: $('#g-wave'), hp: $('#g-hp'), best: $('#g-best') };

  const BAD = ['SQLi', 'XSS', 'DDoS', 'phish.exe', 'rootkit', 'brute-force', 'MITM', 'ransom.zip', '0-day', 'botnet', 'keylogger', 'spoofed ARP'];
  const GOOD = ['HTTPS', 'DNS', 'SSH', 'DHCP', 'NTP', 'SMTP', 'ICMP echo', 'ARP', 'HTTP/2', 'VoIP', 'git push', 'Teams call'];
  const RANKS = [
    [0, 'clicked the phishing link'],
    [50, 'help desk trainee'],
    [150, 'junior SOC analyst'],
    [300, 'network administrator'],
    [500, 'CCNA-certified wall'],
    [800, 'human firewall'],
  ];

  let W = 0, H = 0, dpr = 1;
  let colors = {};
  let state = 'idle'; // idle | running | over
  let packets = [], particles = [], floaters = [];
  let score = 0, hp = 3, wave = 1, elapsed = 0, spawnIn = 0, combo = 0;
  let best = store.get('lh-fw-best', 0);
  let flash = 0;
  let visible = false;
  let last = 0;
  hud.best.textContent = best;

  function readColors() {
    colors = {
      bad: cssVar('--danger'), good: cssVar('--acc'), text: cssVar('--text'), dim: cssVar('--dim'),
      line: cssVar('--line-2'), panel: cssVar('--panel-2'), bg: cssVar('--bg-2'), amber: cssVar('--amber'), info: cssVar('--info'),
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state !== 'running') render();
  }

  const serverX = () => W - 62;
  const wallX = () => W - 104;

  function spawn() {
    const bad = Math.random() < 0.58;
    const label = (bad ? BAD : GOOD)[(Math.random() * (bad ? BAD : GOOD).length) | 0];
    ctx.font = '600 12px "JetBrains Mono", monospace';
    const w = ctx.measureText(label).width + 26;
    const lanes = Math.max(4, Math.floor((H - 50) / 36));
    const y = 28 + ((Math.random() * lanes) | 0) * ((H - 56) / (lanes - 1 || 1));
    const cross = 7.2 / (1 + (wave - 1) * 0.2); // seconds to cross the field
    const speed = ((wallX() + 60) / cross) * (0.85 + Math.random() * 0.3);
    packets.push({ x: -w, y, w, h: 26, label, bad, speed, disguised: wave >= 4 && Math.random() < 0.4, wob: Math.random() * 6 });
  }

  function burst(x, y, color, n = 16) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 180;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6 + Math.random() * 0.4, color });
    }
  }
  const float = (x, y, text, color) => floaters.push({ x, y, text, color, life: 1 });

  function updateHud() {
    hud.score.textContent = score;
    hud.wave.textContent = wave;
    hud.hp.textContent = '▮'.repeat(Math.max(0, hp)) + '▯'.repeat(Math.max(0, 3 - hp));
    hud.hp.classList.toggle('low', hp <= 1);
  }

  function start() {
    readColors();
    resize();
    packets = []; particles = []; floaters = [];
    score = 0; hp = 3; wave = 1; elapsed = 0; spawnIn = 0.4; combo = 0;
    state = 'running';
    overlay.classList.add('hidden');
    updateHud();
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    state = 'over';
    const newBest = score > best;
    if (newBest) { best = score; store.set('lh-fw-best', best); hud.best.textContent = best; }
    const rank = [...RANKS].reverse().find(([min]) => score >= min)[1];
    goTitle.textContent = 'Breach detected';
    goText.innerHTML = `You held the line until wave ${wave} with <b>${score}</b> points${newBest ? ' — new personal best' : ''}.<span class="rank">rank: ${rank}</span>`;
    goBtn.textContent = 'restart shift ▸';
    overlay.classList.remove('hidden');
    goBtn.focus({ preventScroll: true });
    if (score >= 150) unlock('firewall');
  }

  function loop(now) {
    if (state !== 'running') return;
    if (!visible || document.hidden) { last = now; requestAnimationFrame(loop); return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;
    const newWave = 1 + Math.floor(elapsed / 14);
    if (newWave !== wave) {
      wave = newWave;
      float(W / 2, H / 2, `WAVE ${wave}${wave === 4 ? ' · encrypted traffic' : ''}`, colors.amber);
      updateHud();
    }
    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawn();
      spawnIn = Math.max(0.32, 1.15 - wave * 0.09) * (0.7 + Math.random() * 0.6);
    }

    for (const p of packets) {
      p.x += p.speed * dt;
      p.wob += dt * 3;
      if (p.x + p.w >= wallX() && !p.done) {
        p.done = true;
        if (p.bad) {
          hp--; combo = 0; flash = 1;
          burst(wallX(), p.y, colors.bad, 22);
          float(wallX() - 40, p.y - 14, `BREACH: ${p.label}`, colors.bad);
          wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake');
        } else {
          score += 2;
          float(wallX() - 10, p.y - 14, '+2', colors.good);
        }
        updateHud();
      }
    }
    packets = packets.filter((p) => !p.done && !p.dead);
    for (const q of particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.94; q.vy *= 0.94; q.life -= dt; }
    particles = particles.filter((q) => q.life > 0);
    for (const f of floaters) { f.y -= 30 * dt; f.life -= dt * 0.9; }
    floaters = floaters.filter((f) => f.life > 0);
    flash = Math.max(0, flash - dt * 2.5);

    render();
    if (hp <= 0) { gameOver(); return; }
    requestAnimationFrame(loop);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function render() {
    if (!colors.text) readColors();
    ctx.clearRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = colors.line; ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }
    ctx.globalAlpha = 1;

    // firewall line
    const wx = wallX();
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = flash > 0 ? colors.bad : colors.good;
    ctx.globalAlpha = 0.5 + flash * 0.5;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(wx, 10); ctx.lineTo(wx, H - 10); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = colors.dim; ctx.font = '10px "JetBrains Mono", monospace';
    ctx.save(); ctx.translate(wx + 12, H / 2); ctx.rotate(Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('FIREWALL', 0, 0); ctx.restore();

    // server rack
    const sx = serverX(), sh = 150, sy = H / 2 - sh / 2;
    ctx.fillStyle = colors.panel; ctx.strokeStyle = flash > 0 ? colors.bad : colors.line; ctx.lineWidth = 1.5;
    roundRect(sx, sy, 46, sh, 6); ctx.fill(); ctx.stroke();
    const t = performance.now() / 1000;
    for (let i = 0; i < 6; i++) {
      const uy = sy + 10 + i * 23;
      ctx.fillStyle = colors.bg; ctx.fillRect(sx + 6, uy, 34, 16);
      const on = Math.sin(t * (3 + i) + i) > 0;
      ctx.fillStyle = hp <= 1 ? colors.bad : on ? colors.good : colors.line;
      ctx.fillRect(sx + 10, uy + 6, 4, 4);
      ctx.fillStyle = colors.info; ctx.globalAlpha = on ? 0.9 : 0.3; ctx.fillRect(sx + 18, uy + 6, 4, 4); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = colors.dim; ctx.textAlign = 'center'; ctx.fillText('LUIGI-SRV', sx + 23, sy + sh + 16); ctx.textAlign = 'left';

    // packets (a static demo scene while idle, so the board isn't empty behind the overlay)
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    const list = state === 'idle'
      ? [['DNS', false, 0.1, 0.3], ['SQLi', true, 0.3, 0.55], ['HTTPS', false, 0.48, 0.22], ['phish.exe', true, 0.58, 0.75]].map(([label, bad, fx, fy]) => (
        { x: W * fx, y: H * fy, w: ctx.measureText(label).width + 26, h: 26, label, bad, wob: 0 }))
      : packets;
    for (const p of list) {
      const y = p.y + Math.sin(p.wob) * 2;
      const c = p.disguised ? colors.dim : p.bad ? colors.bad : colors.good;
      ctx.fillStyle = colors.bg;
      ctx.strokeStyle = c; ctx.lineWidth = 1.5;
      ctx.shadowColor = p.disguised ? 'transparent' : c; ctx.shadowBlur = 10;
      roundRect(p.x, y - p.h / 2, p.w, p.h, 6); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = c; ctx.fillRect(p.x + 8, y - 3, 6, 6);
      ctx.fillStyle = p.disguised ? colors.text : c;
      ctx.fillText(p.label, p.x + 18, y + 1);
    }
    ctx.textBaseline = 'alphabetic';

    for (const q of particles) { ctx.globalAlpha = Math.max(0, q.life); ctx.fillStyle = q.color; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }
    ctx.globalAlpha = 1;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (const f of floaters) { ctx.globalAlpha = Math.max(0, Math.min(1, f.life)); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y); }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';

    if (combo >= 3 && state === 'running') {
      ctx.fillStyle = colors.amber; ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText(`combo x${combo}`, 14, 22);
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (state !== 'running') return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const pad = e.pointerType === 'touch' ? 12 : 4;
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      if (x >= p.x - pad && x <= p.x + p.w + pad && y >= p.y - p.h / 2 - pad && y <= p.y + p.h / 2 + pad) {
        p.dead = true;
        if (p.bad) {
          combo++;
          const pts = 10 + Math.min(10, (combo - 1) * 2);
          score += pts;
          burst(p.x + p.w / 2, p.y, colors.bad);
          float(p.x + p.w / 2, p.y - 18, `+${pts} blocked`, colors.good);
        } else {
          combo = 0;
          score = Math.max(0, score - 15);
          burst(p.x + p.w / 2, p.y, colors.good, 8);
          float(p.x + p.w / 2, p.y - 18, '-15 false positive', colors.amber);
        }
        updateHud();
        return;
      }
    }
  });

  goBtn.addEventListener('click', start);
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || state === 'running' || !visible) return;
    if (e.target.matches?.('input, textarea, button, a')) return;
    e.preventDefault();
    start();
  });

  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.3 }).observe(canvas);
  window.addEventListener('resize', resize);
  document.addEventListener('site:theme', () => { readColors(); if (state !== 'running') render(); });

  readColors();
  resize();
  document.fonts?.ready.then(() => { if (state !== 'running') render(); });
})();
