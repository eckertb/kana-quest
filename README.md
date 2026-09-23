# Kana Quest 🗾

> Hiragana & Katakana romaji trainer — installable as a PWA or built into an Android APK with Capacitor.

**Kana Quest** is a fast, offline-friendly flashcard app that helps you learn to read Japanese
**Hiragana** and **Katakana** by typing the **romaji** for each symbol. It works entirely in the
browser with zero runtime dependencies, saves your progress locally, and can be installed as a
Progressive Web App (PWA) or packaged as a native Android app.

---

## ✨ Features

- **Both scripts** — practice Hiragana, Katakana, or both at once.
- **Full kana coverage** — 46 basic, 25 dakuten/handakuten (が・ざ・だ・ば・ぱ…), and 33 combo (きゃ・しゃ…) characters per script.
- **Flexible romaji input** — accepts alternate spellings (e.g. `し` = `shi` or `si`, `ち` = `chi` or `ti`).
- **Two difficulty modes** — *Normal* lets you retry a wrong answer; *Hard* gives one attempt per card.
- **Troublesome kana focus** — missed characters are tracked automatically and can be practiced on their own; get one right **3× in a row** to clear it.
- **Live statistics** — current streak, best streak, correct count, and accuracy.
- **On-screen keyboard** — a built-in keyboard appears on touch devices so no system keyboard is needed.
- **Light/dark theme** — toggle in the top bar.
- **Confetti celebrations** 🎉 — rewards for correct answers and streak milestones.
- **Offline-first PWA** — installable, with a service worker for offline use.
- **Android packaging** — ready to build into an APK with [Capacitor](https://capacitorjs.com/).
- **No build step for the web** — plain HTML, CSS, and vanilla JavaScript.

---

## 🎮 How to play

1. A kana symbol appears on the card.
2. Type its romaji in the input and press **Enter** (or tap the arrow / `Enter` key on mobile).
3. Correct answers advance to the next card; wrong answers are shown with the right answer.
4. Use **Show answer** to reveal and skip a card (counts as a skip and resets your streak).

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| <kbd>Enter</kbd> | Check / submit your answer |
| <kbd>Esc</kbd> | Reveal the answer (or close the settings drawer) |

---

## ⚙️ Settings

Open the settings drawer (gear icon) to customize your practice:

| Setting | Options | Description |
| --- | --- | --- |
| **Script** | Hiragana · Katakana · Both | Which writing system to drill. |
| **Character sets** | Basic (46) · Dakuten (25) · Combos (33) | Which character groups to include. At least one stays selected. |
| **Difficulty** | Normal · Hard | *Hard* allows no retry — one attempt per card. |
| **Focus** | All kana · Troublesome kana | Drill everything or just the characters you keep missing. |
| **Reset progress** | — | Clears all statistics and the troublesome-kana list. |

---

## 🚀 Getting started

### Requirements

- [Node.js](https://nodejs.org/) (any modern LTS version) — only needed for the dev server and Android builds. The web app itself has no build step.

### Run locally

```bash
# start a zero-dependency dev server
node serve.js
```

Then open **http://localhost:8080** in your browser.

> You can also just open `index.html` directly in a browser — but the service worker
> (and offline support) requires serving over HTTP(S).

---

## 📱 Install as a PWA

Because `manifest.json` and `sw.js` are in place, you can install Kana Quest like a native app:

1. Serve the app (e.g. `node serve.js` or any static host).
2. Open it in Chrome/Edge (desktop or Android) or Safari (iOS).
3. Use the browser's **Install** / **Add to Home Screen** option.

---

## 🤖 Build an Android APK

The project is pre-configured for [Capacitor](https://capacitorjs.com/):

```bash
# install dependencies (once)
npm install

# add the Android platform (once)
npm run add:android

# build the web assets into ./www and sync to Android
npm run sync

# open the project in Android Studio to build/sign an APK
npm run open:android
```

`copy-web.js` assembles `index.html`, `styles.css`, `app.js`, `manifest.json`, `sw.js`, and the
`icons/` folder into `./www` — no bundler required.

---

## 📁 Project structure

```
kana-quest/
├── index.html          # Markup & UI structure
├── styles.css          # All styling (incl. dark theme & animations)
├── app.js              # App logic: kana data, state, scoring, keyboard, settings
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline caching, network-first)
├── serve.js            # Zero-dependency local dev server
├── copy-web.js         # Copies web assets into ./www for Capacitor
├── gen-icons.js        # Generates PNG icons (no external deps)
├── icons/              # App icons (SVG + generated PNGs)
├── capacitor.config.json # Capacitor configuration
└── package.json        # npm scripts & Capacitor dev dependencies
```

---

## 🔤 Kana data & romaji alternates

Data is defined once for Hiragana in `app.js` and Katakana is derived automatically
(Unicode shift `+0x60`). Acceptable romaji include common variants:

- `し` → `shi`, `si`
- `ち` → `chi`, `ti`
- `つ` → `tsu`, `tu`
- `ふ` → `fu`, `hu`
- `を` → `wo`, `o`
- `ん` → `n`, `nn`
- `じゃ` → `ja`, `jya`, `zya`

---

## 🧠 How progress is stored

All progress is saved to `localStorage` in your browser (no account, no server):

| Key | Contents |
| --- | --- |
| `kanaQuest.settings` | Script, groups, difficulty, and focus selections |
| `kanaQuest.stats` | Correct, wrong, skips, streak, and best streak |
| `kanaQuest.trouble` | Troublesome-kana list and per-kana correct streaks |
| `kanaQuest.theme` | Light or dark theme preference |

Use **Reset progress** in settings to wipe statistics and the troublesome-kana list.

---

## 🛠️ npm scripts

| Script | Description |
| --- | --- |
| `npm run build:web` | Copies web assets into `./www` |
| `npm run add:android` | Adds the Android platform (`cap add android`) |
| `npm run sync` | Builds web assets and syncs to Android (`cap sync android`) |
| `npm run open:android` | Opens the Android project in Android Studio |

---

## 📄 License

Private project — all rights reserved.
