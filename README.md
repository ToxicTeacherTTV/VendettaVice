# Vendetta Vice

> *"A mix between Final Fight and Grand Theft Auto, but with more guys in tracksuits throwin' hands over cannoli."*
> — Nicky "Noodle Arms" A.I. Dente, *Camping Them Softly* podcast

---

## What Is This?

Vendetta Vice is a browser-based beat-'em-up with RPG mechanics set in a hyper-violent, neon-drenched version of Little Italy. Originally a legendary (and entirely fictional) unreleased 1990s arcade cabinet, this is the fan recreation.

You play as **Tony "The Fork" Bellucci** — street enforcer, family man, and the last line of defense against a rival gang peddling *synthetic pasta* in his neighborhood.

---

## Gameplay Features

- **Parry System** — Ahead of its time. Block at the right moment to turn the tide.
- **Environmental Kills** — Bash heads into pizza ovens, slam guys through deli windows.
- **Respect Meter** — Fight too dirty and the old-school mobsters stop backing you. Keep your honor.
- **Omertà Ending** — A secret ending locked behind a code that only real ones know.

---

## Tech Stack

- [Phaser 3](https://phaser.io/) — HTML5 game framework
- Vanilla JS (ES6 modules)
- Vite — dev server & bundler

---

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
src/
  main.js              # Game config & boot
  scenes/
    BootScene.js       # Asset preload
    TitleScene.js      # Title screen + omertà input
    GameScene.js       # Main gameplay
    UIScene.js         # HUD overlay (respect meter, health)
  entities/
    Player.js          # Tony "The Fork" Bellucci
    Enemy.js           # Tracksuit goons & synthetic pasta dealers
  systems/
    RespectMeter.js    # Honor/dirty fighting tracker
    ParrySystem.js     # Parry timing logic
    OmertaCode.js      # Secret ending gate
  config/
    constants.js       # Game-wide constants
assets/
  images/
  audio/
  fonts/
```

---

*As heard on the Camping Them Softly podcast. The cabinet is real and it's in Simpsonville, South Carolina. Ask for it by name.*
