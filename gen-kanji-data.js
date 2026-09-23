/* ============================================================
   gen-kanji-data.js
   Generates kanji-data.js (the 1000 most common kanji with
   romaji readings and English meanings) from the public
   kanji-jouyou.json dataset (davidluzgouveia/kanji-data).

   Usage:
     node gen-kanji-data.js [path/to/kanji-jouyou.json]

   If no path is given it tries ./kanji-jouyou.json, and if that
   is missing it downloads it from GitHub.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const URL = 'https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji-jouyou.json';
const OUT = path.join(__dirname, 'kanji-data.js');
const LEVELS = [100, 300, 600, 1000];

/* ---------------- kana -> romaji ---------------- */
const K2R = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'o', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
  'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'ゎ': 'wa',
};

// add katakana counterparts (hiragana + 0x60)
const KATA_EXTRA = {
  'ヴ': 'vu', 'ヷ': 'va', 'ヸ': 'vi', 'ヹ': 've', 'ヺ': 'vo',
  'ヵ': 'ka', 'ヶ': 'ka', 'ヮ': 'wa',
};
Object.keys(K2R).forEach(h => {
  K2R[String.fromCharCode(h.charCodeAt(0) + 0x60)] = K2R[h];
});
Object.assign(K2R, KATA_EXTRA);

const COMBO = {
  'き': 'k', 'し': 'sh', 'ち': 'ch', 'に': 'n', 'ひ': 'h', 'み': 'm', 'り': 'r',
  'ぎ': 'g', 'じ': 'j', 'び': 'b', 'ぴ': 'p',
  'キ': 'k', 'シ': 'sh', 'チ': 'ch', 'ニ': 'n', 'ヒ': 'h', 'ミ': 'm', 'リ': 'r',
  'ギ': 'g', 'ジ': 'j', 'ビ': 'b', 'ピ': 'p',
};
const SMALL = { 'ゃ': 'a', 'ゅ': 'u', 'ょ': 'o', 'ャ': 'a', 'ュ': 'u', 'ョ': 'o' };

function kanaToRomaji(s) {
  // remove okurigana markers and other punctuation
  const clean = Array.from(s).filter(c => !/[ー・・\-\.!^「」\s]/.test(c));
  const tokens = [];
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === 'っ' || c === 'ッ') { tokens.push('__TSU__'); continue; }
    if (COMBO[c] && i + 1 < clean.length && SMALL[clean[i + 1]]) {
      tokens.push(COMBO[c] + SMALL[clean[i + 1]]);
      i++;
      continue;
    }
    tokens.push(K2R[c] !== undefined ? K2R[c] : c);
  }
  let out = '';
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '__TSU__') {
      const next = tokens[i + 1];
      if (!next) { out += 'tsu'; continue; }
      if (next.startsWith('ch') || next.startsWith('ts')) out += 't';
      else out += next[0];
      continue;
    }
    out += t;
  }
  return out;
}

/* ---------------- helpers ---------------- */
function cleanMeaning(m) {
  let s = String(m)
    .replace(/^[!^]+/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return s;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

/* ---------------- main ---------------- */
function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function main() {
  let src = process.argv[2] || path.join(__dirname, 'kanji-jouyou.json');
  let json;
  if (fs.existsSync(src)) {
    json = fs.readFileSync(src, 'utf8');
  } else {
    console.log('Downloading ' + URL + ' ...');
    json = await download(URL);
    fs.writeFileSync(src, json);
  }

  const data = JSON.parse(json);
  const keys = Object.keys(data);

  // sort by frequency (ascending); missing freq goes last
  keys.sort((a, b) => (data[a].freq || 99999) - (data[b].freq || 99999));

  const top = keys.slice(0, 1000);
  const rows = [];

  top.forEach((ch, idx) => {
    const e = data[ch];

    // readings: on + kun, converted to romaji, deduped
    const readings = [];
    [].concat(e.readings_on || [], e.readings_kun || []).forEach(r => {
      const rom = kanaToRomaji(r);
      if (rom && /^[a-z]+$/.test(rom)) readings.push(rom);
    });
    if (e.wk_readings_on || e.wk_readings_kun) {
      [].concat(e.wk_readings_on || [], e.wk_readings_kun || []).forEach(r => {
        const rom = kanaToRomaji(r);
        if (rom && /^[a-z]+$/.test(rom)) readings.push(rom);
      });
    }

    // meanings: prefer wanikani's clean meanings, then the standard list
    const meanings = [];
    if (e.wk_meanings && e.wk_meanings.length) {
      e.wk_meanings.forEach(m => {
        const c = cleanMeaning(m);
        if (c) meanings.push(c);
      });
    } else if (e.meanings && e.meanings.length) {
      e.meanings.forEach(m => {
        const c = cleanMeaning(m);
        // skip noisy entries like "One Radical (no.1)"
        if (c && !c.includes('(') && !c.includes('radical')) meanings.push(c);
      });
    }
    // always include the standard meanings as extra accepted answers
    (e.meanings || []).forEach(m => {
      const c = cleanMeaning(m);
      if (c && !c.includes('(') && !c.includes('radical')) meanings.push(c);
    });

    const r = uniq(readings);
    const m = uniq(meanings);
    if (!r.length || !m.length) {
      console.warn('SKIP (no reading/meaning):', ch, JSON.stringify(e).slice(0, 200));
      return;
    }
    rows.push({ k: ch, r, m });
  });

  console.log('Generated', rows.length, 'kanji entries.');

  // sanity: first few
  rows.slice(0, 8).forEach(x => console.log(x.k, x.r.slice(0, 4).join('/'), '|', x.m.slice(0, 3).join('/')));

  const lines = [];
  lines.push('/* ============================================================');
  lines.push('   kanji-data.js — generated by gen-kanji-data.js');
  lines.push('   The ' + rows.length + ' most common kanji (frequency order), with');
  lines.push('   romaji readings and English meanings. Do not edit by hand.');
  lines.push('   ============================================================ */');
  lines.push("'use strict';");
  lines.push('');
  lines.push('const KANJI_LEVELS = ' + JSON.stringify(LEVELS) + ';');
  lines.push('const KANJI = ' + JSON.stringify(rows) + ';');

  fs.writeFileSync(OUT, lines.join('\n') + '\n');
  console.log('Wrote', OUT, '(' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB)');
}

main().catch(err => { console.error(err); process.exit(1); });
