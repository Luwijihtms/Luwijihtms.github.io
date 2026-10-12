/* terminal.js — the interactive shell */
(() => {
  const { $, $$, unlock, escapeHtml: esc, store } = window.Site;

  const term = $('#term');
  const body = $('#term-body');
  const out = $('#term-out');
  const form = $('#term-form');
  const input = $('#term-input');
  if (!term) return;

  const EMAIL = 'hatamosaluigi@gmail.com';
  const GITHUB = 'https://github.com/Luwijihtms';
  const RESUME = 'assets/Hatamosa_Resume.pdf';

  const history = store.get('lh-hist', []);
  let hIdx = history.length;
  let busy = false;

  /* ---------- output helpers ---------- */
  function print(htmlStr, cls = '') {
    const div = document.createElement('div');
    if (cls) div.className = cls;
    div.innerHTML = htmlStr;
    out.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }
  const line = (text, cls) => print(esc(text), cls);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const link = (href, text, ext = true) => `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(text)}</a>`;
  const kv = (k, v) => `<span class="k">${esc(k)}</span>${v}`;

  function goto(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- filesystem (tiny, fake, read-only) ---------- */
  const FILES = {
    'about.txt': () => COMMANDS.about.run([]),
    'certs.log': () => COMMANDS.certs.run([]),
    'contact.vcf': () => COMMANDS.contact.run([]),
    'projects/': null,
    'resume.pdf': () => line('binary file. try: resume', 'mut'),
    'secret.txt': () => {
      line('-----BEGIN NOT-SO-SECRET MESSAGE-----', 'mut');
      line('1. there is an old cheat code that still works on this page. ↑↑↓↓…');
      line('2. try: nmap luigi');
      line('3. achievements live behind the trophy in the nav.');
      line('-----END NOT-SO-SECRET MESSAGE-----', 'mut');
    },
    '.bash_history': () => {
      ['ping 8.8.8.8', 'show ip interface brief', 'git commit -m "fix: it works now"', 'git commit -m "fix: it actually works now"', 'godot --editor', 'sudo make coffee'].forEach((c) => line(c, 'mut'));
    },
  };

  /* ---------- commands ---------- */
  const COMMANDS = {
    help: {
      desc: 'list commands',
      run() {
        line('available commands:', 'ok');
        Object.entries(COMMANDS)
          .filter(([, c]) => !c.hidden)
          .forEach(([name, c]) => print(kv(name, esc(c.desc))));
        line('…and a few that are not listed. curiosity is encouraged.', 'mut');
      },
    },
    whoami: {
      desc: 'short version',
      run() {
        line('luigi adrian t. hatamosa · BSIT @ University of San Carlos · aspiring IT support / QA · Cebu, PH');
        line('(you are "guest". but thanks for asking.)', 'mut');
      },
    },
    about: {
      desc: 'longer version',
      run() {
        line('Information Technology student at the University of San Carlos with hands-on exposure to networking,');
        line('cybersecurity fundamentals and software development, through coursework, certifications and personal projects.');
        line('Builds things, then tries to break them on purpose. Likes rain and late-night playlists.', 'mut');
      },
    },
    neofetch: {
      desc: 'system info, but it is me',
      run() {
        const logo = [
          '██╗      ██╗  ██╗',
          '██║      ██║  ██║',
          '██║      ███████║',
          '██║      ██╔══██║',
          '███████╗ ██║  ██║',
          '╚══════╝ ╚═╝  ╚═╝',
        ].join('\n');
        const info = [
          `<span class="ok">guest</span>@<span class="ok">luigi</span>`,
          '-----------------',
          kv('OS', 'LuigiOS 2026 (Cebu edition)'),
          kv('Host', 'University of San Carlos'),
          kv('Kernel', 'BSIT 2023 → 2026'),
          kv('Shell', 'bash, PowerShell, Cisco IOS'),
          kv('Packages', '5 certs, 5 projects, 15 repos'),
          kv('Languages', 'C, Java, Python, C#, TS, GDScript'),
          kv('Engine', 'Godot'),
          kv('Cloud', 'AWS (Zuitt elective)'),
          kv('Status', '<span class="ok">open to IT support roles</span>'),
          '<span class="swatches"><i style="background:var(--danger)"></i><i style="background:var(--amber)"></i><i style="background:var(--acc)"></i><i style="background:var(--info)"></i><i style="background:var(--violet)"></i><i style="background:var(--text)"></i></span>',
        ].join('\n');
        print(`<div class="neo"><div class="art">${esc(logo)}</div><div>${info}</div></div>`);
      },
    },
    education: {
      desc: 'traceroute through school',
      run() {
        print(kv('2010–2021', 'Saint Louis College — Cebu'));
        print(kv('2021–2023', 'University of San Carlos — STEM strand'));
        print(kv('2023–2026', 'University of San Carlos — BS Information Technology'));
        line("tip: 'goto route' for the animated version", 'mut');
      },
    },
    certs: {
      desc: 'certifications',
      run() {
        print(kv('2024', 'CCNA: Introduction to Networks · Cisco'));
        print(kv('2024', 'CCNA: Introduction to Cybersecurity · Cisco'));
        print(kv('2025', 'Python and AWS Elective Course · Zuitt'));
        print(kv('2025', 'CCNA: Switching, Routing & Wireless Essentials · Cisco'));
        print(kv('2025', 'Junior Cybersecurity Analyst Career Path · Cisco'));
      },
    },
    projects: {
      desc: 'things I built',
      run() {
        print(kv('LARGA', `BLM Taxi digital system · .NET MAUI + Firebase · <span class="warn">in progress (capstone)</span> · ${link('https://github.com/AlexaAko548/LARGA', 'repo')}`));
        print(kv('Raphael', `voice desktop assistant · C# + Gemini · ${link(`${GITHUB}/Raphael`, 'repo')}`));
        print(kv('Echoes', `mini RPG · Godot / GDScript · ${link('https://github.com/klarkkyyy/ETP', 'repo')}`));
        print(kv('MiniSpotify', `music player app · TypeScript · ${link(`${GITHUB}/adv-mob-dev`, 'repo')}`));
        print(kv('Gamify', `learn Java by playing · Java · ${link('https://github.com/klarkkyyy/OOP_Final-Proj', 'repo')}`));
        line("tip: 'goto quests' to see them with pictures", 'mut');
      },
    },
    skills: {
      desc: 'what I bring',
      run() {
        print(kv('network', 'configuration, subnetting, routing & switching, WLAN, Cisco IOS'));
        print(kv('security', 'monitoring, incident response basics, threat assessment'));
        print(kv('code', 'C, Java, Python, C#/.NET MAUI, TypeScript, GDScript, Firebase, AWS'));
        print(kv('human', 'problem solving, teamwork, collaboration, analytical thinking, adaptability'));
        print(kv('workflow', 'AI-assisted, git, documentation that people actually read'));
      },
    },
    contact: {
      desc: 'how to reach me',
      run() {
        print(kv('email', link(`mailto:${EMAIL}`, EMAIL, false)));
        print(kv('github', link(GITHUB, 'github.com/Luwijihtms')));
        line("or run 'ping luigi'", 'mut');
      },
    },
    email: { desc: 'open your mail app', run() { line(`opening mailto:${EMAIL} …`, 'ok'); location.href = `mailto:${EMAIL}`; } },
    github: { desc: 'open my GitHub', run() { line('opening github.com/Luwijihtms …', 'ok'); window.open(GITHUB, '_blank', 'noopener'); } },
    resume: { desc: 'open my resume', run() { line(`opening ${RESUME} …`, 'ok'); window.open(RESUME, '_blank', 'noopener'); } },
    ls: {
      desc: 'list files',
      run(args) {
        const all = args.includes('-a') || args.includes('-la') || args.includes('-al');
        const names = Object.keys(FILES).filter((f) => all || !f.startsWith('.'));
        print(names.map((n) => (n.endsWith('/') ? `<span class="info">${esc(n)}</span>` : esc(n))).join('   '));
      },
    },
    cat: {
      desc: 'read a file',
      run(args) {
        const f = args[0];
        if (!f) return line('usage: cat <file>', 'err');
        if (!(f in FILES)) return line(`cat: ${f}: No such file or directory`, 'err');
        if (FILES[f] === null) return line(`cat: ${f}: Is a directory`, 'err');
        FILES[f]();
      },
    },
    cd: {
      desc: 'change directory',
      run(args) {
        if (args[0] === 'projects' || args[0] === 'projects/') { line('teleporting to /projects …', 'ok'); goto('quests'); }
        else line("cd: this shell is read-only. try 'goto <section>'", 'mut');
      },
    },
    goto: {
      desc: 'scroll to a section',
      run(args) {
        const map = { home: 'home', top: 'home', shell: 'shell', whoami: 'whoami', about: 'whoami', route: 'route', education: 'route', certs: 'certs', quests: 'quests', projects: 'quests', stack: 'stack', skills: 'stack', play: 'firewall', game: 'firewall', firewall: 'firewall', contact: 'ping', ping: 'ping' };
        const id = map[(args[0] || '').toLowerCase()];
        if (!id) return line(`usage: goto <${['whoami', 'route', 'certs', 'projects', 'stack', 'play', 'contact'].join('|')}>`, 'err');
        line(`→ #${id}`, 'ok');
        goto(id);
      },
    },
    ping: {
      desc: 'ping a host (try: ping luigi)',
      async run(args) {
        const host = args[0] || 'luigi';
        const ip = host === 'luigi' ? '10.20.26.1' : `192.0.2.${(host.length * 37) % 254}`;
        line(`PING ${host} (${ip}) 56(84) bytes of data.`);
        let sum = 0;
        for (let i = 1; i <= 4; i++) {
          await sleep(420);
          const ms = (8 + Math.random() * 20).toFixed(1);
          sum += Number(ms);
          line(`64 bytes from ${host} (${ip}): icmp_seq=${i} ttl=64 time=${ms} ms`);
        }
        line(`--- ${host} ping statistics ---`);
        line(`4 packets transmitted, 4 received, 0% packet loss, avg ${(sum / 4).toFixed(1)} ms`, 'ok');
        if (host === 'luigi') { line('verdict: reachable. email him.', 'mut'); unlock('ping'); }
      },
    },
    nmap: {
      desc: 'scan a host',
      hidden: true,
      async run(args) {
        if (!args[0]) return line('usage: nmap <host>', 'err');
        line(`Starting Nmap 7.95 against ${args[0]} …`);
        await sleep(700);
        if (args[0] !== 'luigi') { line(`Note: Host seems down. Only scan hosts you're authorized to. (you are authorized to scan 'luigi')`, 'warn'); return; }
        line('PORT      STATE     SERVICE');
        const ports = [
          ['22/tcp', 'open', 'ssh            → patient troubleshooting'],
          ['25/tcp', 'open', `smtp           → ${EMAIL}`],
          ['80/tcp', 'open', 'http           → this portfolio'],
          ['443/tcp', 'open', 'https          → learning, securely'],
          ['1337/tcp', 'open', 'game-dev       → godot builds'],
          ['3389/tcp', 'filtered', 'rdp            → nice try'],
          ['8080/tcp', 'open', 'opportunities  → accepting connections'],
        ];
        for (const [p, s, svc] of ports) {
          await sleep(160);
          print(`${esc(p.padEnd(10))}<span class="${s === 'open' ? 'ok' : 'warn'}">${esc(s.padEnd(10))}</span>${esc(svc)}`);
        }
        line('Nmap done: 1 IP address (1 host up) scanned. 0 vulnerabilities found. probably.', 'mut');
        unlock('nmap');
      },
    },
    date: { desc: 'local time in Cebu', run() { line(new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'full', timeStyle: 'short' }) + ' (PHT)'); } },
    echo: { desc: 'say something', run(args) { line(args.join(' ')); } },
    theme: { desc: 'toggle light/dark', run() { $('#theme-btn').click(); line(`theme → ${document.documentElement.dataset.theme}`, 'ok'); } },
    play: { desc: 'play the firewall game', run() { line('spinning up firewall …', 'ok'); goto('firewall'); setTimeout(() => $('#go-btn')?.focus({ preventScroll: true }), 800); } },
    achievements: { desc: 'show achievements', run() { $('#ach-btn').click(); } },
    history: { desc: 'command history', run() { history.forEach((h, i) => line(`${String(i + 1).padStart(4)}  ${h}`, 'mut')); } },
    clear: { desc: 'clear the screen', run() { out.innerHTML = ''; } },

    /* hidden */
    sudo: {
      hidden: true,
      run(args) {
        const rest = args.join(' ').toLowerCase();
        if (rest.startsWith('hire')) { line('[sudo] password for guest: ********', 'mut'); return COMMANDS.hire.run(args.slice(1)); }
        line('[sudo] password for guest: ********', 'mut');
        line('guest is not in the sudoers file. This incident will be reported.', 'err');
        line("(to luigi. who will find it funny. try 'sudo hire luigi')", 'mut');
        unlock('sudo');
      },
    },
    hire: {
      hidden: true,
      async run() {
        unlock('sudo');
        line('initiating hiring protocol …', 'ok');
        const steps = ['checking certifications ......... 5/5', 'checking projects ............... shipped', 'checking attitude ............... builds, breaks, fixes', 'checking coffee tolerance ....... high'];
        for (const s of steps) { await sleep(350); line(s); }
        await sleep(300);
        line('✓ excellent decision. opening a draft email for you …', 'ok');
        await sleep(700);
        location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Let's talk: IT role")}&body=${encodeURIComponent('Hi Luigi,\n\nI saw your portfolio (and ran sudo hire luigi). ')}`;
      },
    },
    rm: { hidden: true, run(args) { if (args.join(' ').includes('-rf')) line('rm: refusing to delete a portfolio that took this long to build. also, read-only. also, rude.', 'err'); else line('rm: permission denied', 'err'); } },
    exit: { hidden: true, run() { line("there's no escape. (scroll down instead)", 'mut'); } },
    vim: { hidden: true, run() { line('you are now trapped in vim. type :q to escape.', 'warn'); } },
    ':q': { hidden: true, run() { line('you escaped vim. most people never do. respect.', 'ok'); } },
    coffee: { hidden: true, run() { line('  ( (\n   ) )\n ........\n |      |]\n \\      /\n  `----\'', 'ok'); line('brewing … fuel for the next ticket.', 'mut'); } },
    hello: { hidden: true, run() { line('hey! 👋 type help to see what I can do.'); } },
    hi: { hidden: true, run() { COMMANDS.hello.run(); } },
    konami: { hidden: true, run() { line('nice try. use the keyboard. ↑↑↓↓←→←→BA', 'mut'); } },
    matrix: { hidden: true, run() { line('wake up, guest… follow the green packets.', 'ok'); window.Site.godMode(); } },
  };

  /* ---------- run ---------- */
  async function run(raw) {
    const cmdline = raw.trim();
    print(`<span class="p">guest@luigi:~$</span> ${esc(cmdline)}`, 'cmd');
    if (!cmdline) return;
    history.push(cmdline);
    if (history.length > 50) history.shift();
    store.set('lh-hist', history);
    hIdx = history.length;

    const [nameRaw, ...args] = cmdline.split(/\s+/);
    const name = nameRaw.toLowerCase();
    const cmd = COMMANDS[name];
    if (!cmd) {
      const close = Object.keys(COMMANDS).filter((c) => !COMMANDS[c].hidden).find((c) => lev(c, name) <= 2);
      line(`${name}: command not found${close ? `. did you mean '${close}'?` : ''}`, 'err');
      return;
    }
    unlock('shell');
    busy = true;
    try { await cmd.run(args); } finally { busy = false; body.scrollTop = body.scrollHeight; }
  }

  function lev(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (busy) return;
    const v = input.value;
    input.value = '';
    run(v);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hIdx > 0) input.value = history[--hIdx];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIdx < history.length - 1) input.value = history[++hIdx];
      else { hIdx = history.length; input.value = ''; }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = '';
    }
  });

  function complete() {
    const v = input.value;
    const parts = v.split(/\s+/);
    let pool;
    if (parts.length <= 1) pool = Object.keys(COMMANDS).filter((c) => !COMMANDS[c].hidden);
    else if (parts[0] === 'cat') pool = Object.keys(FILES);
    else if (parts[0] === 'goto') pool = ['whoami', 'route', 'certs', 'projects', 'stack', 'play', 'contact'];
    else if (parts[0] === 'ping' || parts[0] === 'nmap') pool = ['luigi'];
    else return;
    const cur = parts[parts.length - 1];
    const hits = pool.filter((p) => p.startsWith(cur));
    if (hits.length === 1) { parts[parts.length - 1] = hits[0]; input.value = parts.join(' ') + (parts.length === 1 ? ' ' : ''); }
    else if (hits.length > 1) line(hits.join('   '), 'mut');
  }

  body.addEventListener('click', () => { if (!window.getSelection().toString()) input.focus({ preventScroll: true }); });
  input.addEventListener('focus', () => term.classList.add('focused'));
  input.addEventListener('blur', () => term.classList.remove('focused'));

  $$('.term-chips button').forEach((b) => b.addEventListener('click', () => {
    if (busy) return;
    run(b.dataset.cmd);
    input.focus({ preventScroll: true });
  }));

  function focusTerminal() {
    $('#shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => input.focus({ preventScroll: true }), 500);
  }
  $$('[data-focus-terminal]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); focusTerminal(); }));
  window.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t.matches?.('input, textarea, [contenteditable]')) return;
    e.preventDefault();
    focusTerminal();
  });

  /* ---------- greeting ---------- */
  print(`<span class="ok">LuigiOS 2026</span> <span class="mut">· tty1 · last login: ${esc(new Date().toDateString())} from your-browser</span>`);
  line("Welcome, guest. Type 'help' to see what's here, or click a suggestion below.");
})();
