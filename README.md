# luwijihtms.github.io

Personal portfolio of **Luigi Adrian T. Hatamosa**: IT support, networking, cybersecurity, and a habit of building things and then breaking them on purpose.

Live at **https://luwijihtms.github.io**

## What's inside

- **Boot screen**: a fake BIOS POST, shown once per session (press any key to skip)
- **Swinging ID badge**: grab it and throw it; it runs on pendulum physics
- **Interactive shell**: `help`, `neofetch`, `nmap luigi`, `sudo hire luigi`, tab completion, history, and a few unlisted commands
- **traceroute timeline**: a packet travels down the education route as you scroll
- **Certifications**: flip cards with rarity tiers
- **Quest log**: filterable project cards with animated CSS art and 3D tilt
- **Skills switch**: a 24-port switch, one skill per port. Hover to inspect, click to patch in
- **Be the firewall**: a canvas mini-game where you block malicious packets
- **ping luigi**: the contact section, plus a compose form that opens a mail draft
- **Achievements**: 11 to find (trophy in the nav), stored in `localStorage`
- Light and dark themes, `prefers-reduced-motion` support, keyboard shortcuts (`/` opens the shell)

No frameworks and no build step: plain HTML, CSS and vanilla JS.

```
index.html
style.css
404.html
js/
  core.js       helpers, achievements, boot, theme, nav, reveal, text effects, konami
  fx.js         network background, badge physics, card tilt
  terminal.js   the shell
  sections.js   character sheet, traceroute, certs, projects, switch, contact
  game.js       firewall mini-game
assets/
  luigi.jpg
  favicon.svg
  Hatamosa_Resume.pdf   ← add the resume here
```

## Run locally

Open `index.html` directly, or serve the folder:

```
npx serve .
```
