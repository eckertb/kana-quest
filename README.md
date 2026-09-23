# Kana Quest 🗾

> Hiragana, Katakana & Kanji trainer — installable as a PWA or built into an Android APK with Capacitor.

**Kana Quest** is a fast, offline-friendly flashcard app that helps you learn to read Japanese
**Hiragana**, **Katakana**, and the most common **Kanji**. For kana you type the **romaji**; for
kanji you type the **reading** (romaji) and the **English meaning**. It works entirely in the
browser with zero runtime dependencies, saves your progress locally, and can be installed as a
Progressive Web App (PWA) or packaged as a native Android app.

---

## ✨ Features

- **Both scripts** — practice Hiragana, Katakana, or both at once.
- **Kanji mode** — drill the most common kanji, choosing anywhere from 10 up to the 1000 most common. Answer by typing both the reading (romaji) and the English meaning.
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

1. A symbol appears on the card — kana or kanji depending on your **Subject** setting.
2. **Kana**: type its romaji and press **Enter** (or tap the arrow / `Enter` key on mobile).
   **Kanji**: type the reading (romaji) and the English meaning, then press **Enter**.
3. Correct answers advance to the next card; wrong answers are shown with the right answer.
4. Use **Show answer** to reveal and skip a card (counts as a skip and resets your streak).

In kanji mode there are two text boxes: **Reading** and **Meaning**. On desktop, click into a
box to type in it. On mobile, tap a box to select it and the on-screen keyboard will type into
that box.

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
| **Subject** | Kana · Kanji | Which writing system to drill. |
| **Script** (kana) | Hiragana · Katakana · Both | Which kana script to drill. |
| **Character sets** (kana) | Basic (46) · Dakuten (25) · Combos (33) | Which character groups to include. At least one stays selected. |
| **Kanji count** (kanji) | Slider · 10–1000 | How many of the most common kanji to include, in frequency order. |
| **Difficulty** | Normal · Hard | *Hard* allows no retry — one attempt per card. |
| **Focus** (kana) | All kana · Troublesome kana | Drill everything or just the characters you keep missing. |
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

`copy-web.js` assembles `index.html`, `styles.css`, `app.js`, `kanji-data.js`, `manifest.json`, `sw.js`, and the
`icons/` folder into `./www` — no bundler required.

---

## 📁 Project structure

```
kana-quest/
├── index.html          # Markup & UI structure
├── styles.css          # All styling (incl. dark theme & animations)
├── app.js              # App logic: data, state, scoring, keyboard, settings
├── kanji-data.js       # The 1000 most common kanji (generated)
├── gen-kanji-data.js   # Generates kanji-data.js from kanji-jouyou.json
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

## 🈶 Kanji data

The kanji deck lives in `kanji-data.js` (generated by `gen-kanji-data.js`) and contains the
**1000 most common kanji** in frequency order, each with romaji readings (on'yomi and kun'yomi)
and English meanings. The kanji-count setting is simply a prefix of that list, so a smaller count
includes fewer but *more common* kanji. Run `node gen-kanji-data.js` to regenerate it from the
public `kanji-jouyou.json` dataset.

---

## 🧠 How progress is stored

All progress is saved to `localStorage` in your browser (no account, no server):

| Key | Contents |
| --- | --- |
| `kanaQuest.settings` | Subject, script, groups, kanji level, difficulty, and focus selections |
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
