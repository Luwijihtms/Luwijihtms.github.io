/* sections.js — character sheet, traceroute, certs, quests, switch, contact */
(() => {
  const { $, $$, unlock, toast, escapeHtml: esc, reduceMotion } = window.Site;

  /* ---------- character sheet ---------- */
  const sheet = $('.charsheet');
  if (sheet) {
    // BSIT progress: Aug 2023 → Jun 2026
    const start = new Date('2023-08-01').getTime();
    const end = new Date('2026-06-30').getTime();
    const pct = Math.max(0, Math.min(100, ((Date.now() - start) / (end - start)) * 100));
    // level = certifications earned
    $('#cs-level').textContent = $$('button.cert').length;

    sheet.addEventListener('reveal', () => {
      $$('.stats li', sheet).forEach((li, i) => {
        setTimeout(() => li.querySelector('b').style.setProperty('--v', li.dataset.value / 100), i * 120);
      });
      setTimeout(() => {
        $('#xp-fill').style.width = `${pct}%`;
        $('#xp-pct').textContent = pct >= 100 ? 'MAX · level up pending' : `${Math.floor(pct)}%`;
      }, 300);
    });
  }

  /* ---------- traceroute progress ---------- */
  const trace = $('#trace');
  const fill = $('#trace-fill');
  const packet = $('#trace-packet');
  const hops = $$('.hop');
  if (trace) {
    const rail = $('.trace-rail', trace);
    const update = () => {
      const r = rail.getBoundingClientRect();
      const target = innerHeight * 0.6;
      const p = Math.max(0, Math.min(1, (target - r.top) / r.height));
      fill.style.height = `${p * 100}%`;
      packet.style.top = `${p * 100}%`;
      const y = r.top + p * r.height;
      hops.forEach((h) => {
        const dot = $('.hop-dot', h).getBoundingClientRect();
        h.classList.toggle('lit', dot.top + 8 <= y);
      });
    };
    window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- cert flip ---------- */
  $$('button.cert').forEach((c) => {
    c.addEventListener('click', () => c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'));
  });

  /* ---------- quest filter ---------- */
  const filters = $$('.filter');
  filters.forEach((btn) => btn.addEventListener('click', () => {
    filters.forEach((b) => b.classList.toggle('is-on', b === btn));
    const f = btn.dataset.filter;
    $$('.quest').forEach((q) => q.classList.toggle('hide', f !== 'all' && q.dataset.kind !== f));
    $$('.side-quests li[data-kind]').forEach((li) => li.classList.toggle('hide', f !== 'all' && li.dataset.kind !== f));
  }));

  /* ---------- switch ---------- */
  const PORTS = [
    ['Network Configuration', 'net', 'IP addressing, VLANs, switch & router config (CCNA ITN, SRWE)'],
    ['Subnetting', 'net', 'IPv4 subnet math, usually without a calculator'],
    ['Routing & Switching', 'net', 'static & dynamic routing, STP, EtherChannel in Packet Tracer labs'],
    ['Wireless LANs', 'net', 'WLAN configuration and security in simulated enterprise networks'],
    ['Cisco IOS', 'net', 'enable · conf t · show run · muscle memory'],
    ['Security Monitoring', 'sec', 'Junior Cybersecurity Analyst path: alerts, logs, triage'],
    ['Incident Response', 'sec', 'fundamentals: detect → contain → recover → document'],
    ['Threat Assessment', 'sec', 'threat identification, attack vectors, data protection'],
    ['Troubleshooting', 'ops', 'reproduce → isolate → fix → explain in plain words'],
    ['AI-Assisted Workflows', 'ops', 'using AI tools to move faster, with the brain still switched on'],
    ['Git & GitHub', 'ops', '15 public repos and counting at github.com/Luwijihtms'],
    ['Python', 'code', 'fundamentals & scripting (Zuitt bootcamp)'],
    ['AWS', 'code', 'core cloud services for practical app development (Zuitt elective)'],
    ['Java', 'code', 'OOP, and the language Gamify was built in'],
    ['C', 'code', 'where pointers taught humility'],
    ['C# / .NET MAUI', 'code', 'LARGA (cross-platform) and Raphael (desktop)'],
    ['TypeScript', 'code', 'Mini Spotify app'],
    ['Firebase', 'code', 'backend + realtime data for the LARGA capstone'],
    ['Godot / GDScript', 'code', 'Echoes of the Past and other game builds'],
    ['HTML / CSS / JS', 'code', 'this site, no frameworks'],
    ['Problem Solving', 'soft', 'the actual job underneath every other skill'],
    ['Teamwork & Collaboration', 'soft', 'capstone team member; communicates early and often'],
    ['Analytical Thinking', 'soft', 'reads the logs before guessing'],
    ['Adaptability', 'soft', 'new stack? new tool? fine. give me a day.'],
  ];
  const portsEl = $('#ports');
  const consoleEl = $('#switch-console');
  if (portsEl) {
    let patched = 0;
    PORTS.forEach(([name, group, note], i) => {
      const n = i + 1;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'port';
      b.dataset.group = group;
      b.setAttribute('aria-label', `Port ${n}: ${name}. ${note}`);
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<span class="leds"><i></i><i></i></span><span class="jack"><span class="plug"></span></span><span class="num">${n}</span>`;
      const act = b.querySelector('.leds i:last-child');
      act.style.setProperty('--d', `${(0.3 + Math.random() * 1.6).toFixed(2)}s`);
      act.style.setProperty('--delay', `${(-Math.random() * 2).toFixed(2)}s`);
      const show = () => {
        $$('.port.sel', portsEl).forEach((p) => p.classList.remove('sel'));
        b.classList.add('sel');
        const state = b.classList.contains('patched') ? '<span class="up">connected</span>' : '<span class="up">up</span>';
        consoleEl.innerHTML =
          `SW-LUIGI-01# show interface Gi0/${n}\n` +
          `<span class="k">Gi0/${n}</span> is ${state}, line protocol is up\n` +
          `  description: <b>${esc(name)}</b>\n` +
          `  ${esc(note)}`;
      };
      b.addEventListener('mouseenter', show);
      b.addEventListener('focus', show);
      b.addEventListener('click', () => {
        const on = b.classList.toggle('patched');
        b.setAttribute('aria-pressed', String(on));
        patched += on ? 1 : -1;
        show();
        if (patched >= 5) unlock('port');
        if (patched === PORTS.length) toast('Fully patched', 'All 24 ports are live. You would make a great network tech.', '⌁', 'switch');
      });
      portsEl.appendChild(b);
    });

    const legend = $$('.switch-legend button');
    legend.forEach((btn) => btn.addEventListener('click', () => {
      const on = !btn.classList.contains('on');
      legend.forEach((l) => l.classList.remove('on'));
      portsEl.classList.toggle('filtering', on);
      $$('.port', portsEl).forEach((p) => p.classList.remove('match'));
      if (on) {
        btn.classList.add('on');
        const g = btn.dataset.group;
        $$('.port', portsEl).forEach((p) => p.classList.toggle('match', p.dataset.group === g));
        const names = PORTS.filter((p) => p[1] === g).map((p) => p[0]);
        consoleEl.innerHTML = `SW-LUIGI-01# show vlan name ${esc(g)}\n<span class="up">${names.length} ports</span>: ${esc(names.join(', '))}`;
      }
    }));
  }

  /* ---------- ping + contact ---------- */
  const pingBtn = $('#ping-btn');
  const pingOut = $('#ping-out');
  if (pingBtn) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    pingBtn.addEventListener('click', async () => {
      if (pingBtn.classList.contains('busy')) return;
      pingBtn.classList.add('busy');
      pingOut.innerHTML = `PING luigi (hatamosaluigi@gmail.com) 56(84) bytes of data.\n`;
      let total = 0;
      for (let i = 1; i <= 4; i++) {
        await sleep(reduceMotion ? 60 : 520);
        const ms = (10 + Math.random() * 25).toFixed(1);
        total += Number(ms);
        pingOut.innerHTML += `64 bytes from <span class="k">luigi</span>: icmp_seq=${i} ttl=64 time=${ms} ms\n`;
      }
      await sleep(300);
      pingOut.innerHTML +=
        `\n--- luigi ping statistics ---\n` +
        `<span class="ok">4 packets transmitted, 4 received, 0% packet loss</span>\n` +
        `rtt avg = ${(total / 4).toFixed(1)} ms\n\n` +
        `<span class="ok">✓ host is up and replying to emails.</span>`;
      pingBtn.classList.remove('busy');
      $$('.c-card').forEach((c) => { c.classList.remove('reachable'); void c.offsetWidth; c.classList.add('reachable'); });
      unlock('ping');
    });
  }

  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'copied ✓';
    } catch {
      btn.textContent = 'copy failed';
    }
    setTimeout(() => { btn.textContent = 'copy'; }, 1600);
  }));

  const compose = $('#compose');
  if (compose) {
    compose.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#c-name').value.trim();
      const msg = $('#c-msg').value.trim();
      const subject = `Hello from ${name}`;
      location.href = `mailto:hatamosaluigi@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${msg}\n\n— ${name}`)}`;
    });
  }
})();
