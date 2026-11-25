// news-image-20261125 — "THE WORLD IN ONE DAY"
// Drawn entirely by code: own PNG encoder, own 5x7 bitmap font, no system
// fonts, no network, no randomness, no clock. Two runs are byte-identical.
// Node 22, standard library only. Writes ONE image to /output/entry.png
// (or $MAKEFUN_OUTPUT_DIR/entry.png outside the grader container).
//
// Stories verified in-session on 25 Nov 2026 (Reuters / AP / CNN / BBC):
//  LEAD  Huawei convicted in Brooklyn on 10 of 12 counts; acquitted of
//         racketeering conspiracy and conspiracy to obstruct justice.
//         Sentencing 14 September 2027.
//  GRID  Zelenskyy confirms Ukraine sank the Russian corvette Merkury
//         off Libya with seven naval drones; Houthi drone hits Riyadh's
//         PIF Tower a second time, 11 hurt; Sarkozy and Bruni ordered
//         to trial over alleged witness tampering; around 175 migrants
//         missing off Senegal; DR Congo rebels halt their march on
//         Bunia; five Turkish soldiers killed in a helicopter crash.
//  STRIP Real Madrid 5-1 PSV; England beat Australia by 8 wickets;
//         Senegal get the AFCON title back after a CAS ruling.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

type RGB = [number, number, number];
const PAPER: RGB = [246, 241, 227];
const INK: RGB = [26, 26, 26];
const NAVY: RGB = [16, 36, 62];
const NAVY2: RGB = [31, 62, 102];
const GOLD: RGB = [201, 151, 43];
const GOLDL: RGB = [217, 164, 65];
const RED: RGB = [166, 38, 38];
const WHITE: RGB = [255, 255, 255];
const GREY: RGB = [90, 90, 84];
const TEAL: RGB = [15, 118, 110];
const BLUE: RGB = [31, 78, 121];
const BURG: RGB = [122, 31, 43];
const GREEN: RGB = [46, 107, 52];
const ORANGE: RGB = [180, 83, 9];
const SLATE: RGB = [71, 85, 105];

// ---------------------------------------------------------------- 5x7 font
// Each glyph: 7 rows of 5 cells, "1" = ink. Uppercase, digits, punctuation.
// Authored in this session.
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00000", "01100"],
  ",": ["00000", "00000", "00000", "00000", "00000", "00100", "01000"],
  ":": ["00000", "00100", "00000", "00000", "00000", "00100", "00000"],
  ";": ["00000", "00100", "00000", "00000", "00100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  "=": ["00000", "00000", "01110", "00000", "01110", "00000", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "#": ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  "[": ["01110", "01000", "01000", "01000", "01000", "01000", "01110"],
  "]": ["01110", "00010", "00010", "00010", "00010", "00010", "01110"],
};
const BLANK = ["00000", "00000", "00000", "00000", "00000", "00000", "00000"];

// ------------------------------------------------------------------- canvas
const px = new Uint8Array(W * H * 3);
function fill(c: RGB): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0];
    px[i * 3 + 1] = c[1];
    px[i * 3 + 2] = c[2];
  }
}
function setPx(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) setPx(i, j, c);
}
function frame(x: number, y: number, w: number, h: number, t: number, c: RGB): void {
  rect(x, y, w, t, c);
  rect(x, y + h - t, w, t, c);
  rect(x, y, t, h, c);
  rect(x + w - t, y, t, h, c);
}
function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPx(x, y, c);
    }
}
function ring(cx: number, cy: number, r: number, t: number, c: RGB): void {
  for (let y = cy - r - t; y <= cy + r + t; y++)
    for (let x = cx - r - t; x <= cx + r + t; x++) {
      const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (d >= r - t / 2 && d <= r + t / 2) setPx(x, y, c);
    }
}
// Filled polygon (scanline, even-odd on edge crossings).
function poly(pts: number[][], c: RGB): void {
  let minY = H;
  let maxY = 0;
  for (const p of pts) {
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const x0 = Math.ceil(xs[k]);
      const x1 = Math.floor(xs[k + 1]);
      for (let x = x0; x <= x1; x++) setPx(x, y, c);
    }
  }
}
function thickLine(x0: number, y0: number, x1: number, y1: number, t: number, c: RGB): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const n = Math.max(Math.abs(dx), Math.abs(dy));
  const half = Math.floor(t / 2);
  for (let s = 0; s <= n; s++) {
    const x = Math.round(x0 + (dx * s) / n);
    const y = Math.round(y0 + (dy * s) / n);
    for (let j = -half; j <= half; j++)
      for (let i = -half; i <= half; i++) setPx(x + i, y + j, c);
  }
}

// --------------------------------------------------------------------- text
function charW(scale: number): number {
  return 6 * scale;
}
function textW(s: string, scale: number): number {
  return s.length * charW(scale) - scale;
}
function drawChar(ch: string, x: number, y: number, scale: number, c: RGB): void {
  const g = FONT[ch] ?? BLANK;
  for (let r = 0; r < 7; r++)
    for (let col = 0; col < 5; col++)
      if (g[r][col] === "1") rect(x + col * scale, y + r * scale, scale, scale, c);
}
function drawText(s: string, x: number, y: number, scale: number, c: RGB): void {
  const up = s.toUpperCase();
  for (let i = 0; i < up.length; i++) drawChar(up[i], x + i * charW(scale), y, scale, c);
}
function drawCentered(s: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(s, cx - Math.floor(textW(s.toUpperCase(), scale) / 2), y, scale, c);
}
function wrap(text: string, maxChars: number): string[] {
  const words = text.toUpperCase().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur === "") {
      cur = w;
    } else if (cur.length + 1 + w.length <= maxChars) {
      cur += " " + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}
function drawWrapped(text: string, x: number, y: number, scale: number, maxChars: number, pitch: number, c: RGB): number {
  const lines = wrap(text, maxChars);
  for (let i = 0; i < lines.length; i++) drawText(lines[i], x, y + i * pitch, scale, c);
  return lines.length;
}

// ------------------------------------------------------------- pictograms
// All geometric: rectangles, discs, polygons, lines. No images.
function picShip(x: number, y: number, c: RGB, hull: RGB): void {
  void c;
  void hull;
  rect(x + 8, y + 6, 4, 26, WHITE);
  poly([[x + 12, y + 6], [x + 34, y + 18], [x + 12, y + 18]], WHITE);
  poly([[x + 4, y + 32], [x + 60, y + 32], [x + 52, y + 48], [x + 12, y + 48]], WHITE);
  rect(x + 22, y + 26, 20, 6, GOLDL);
  thickLine(x + 2, y + 56, x + 18, y + 56, 3, WHITE);
  thickLine(x + 24, y + 56, x + 40, y + 56, 3, WHITE);
  thickLine(x + 46, y + 56, x + 62, y + 56, 3, WHITE);
}
function picTower(x: number, y: number, c: RGB): void {
  void c;
  rect(x + 22, y + 2, 20, 58, WHITE);
  rect(x + 16, y + 14, 32, 46, WHITE);
  rect(x + 10, y + 28, 44, 32, WHITE);
  for (let r = 0; r < 4; r++)
    for (let col = 0; col < 3; col++) rect(x + 18 + col * 10, y + 32 + r * 7, 5, 4, GOLDL);
  poly([[x + 26, y + 8], [x + 32, y + 14], [x + 38, y + 8], [x + 32, y + 2]], RED);
  rect(x + 6, y + 60, 52, 3, WHITE);
}
function picScales(x: number, y: number, c: RGB): void {
  void c;
  rect(x + 30, y + 6, 4, 44, WHITE);
  rect(x + 8, y + 6, 48, 4, WHITE);
  rect(x + 22, y + 54, 20, 4, WHITE);
  rect(x + 16, y + 58, 32, 4, WHITE);
  thickLine(x + 10, y + 10, x + 16, y + 26, 2, WHITE);
  thickLine(x + 10, y + 10, x + 4, y + 26, 2, WHITE);
  poly([[x + 2, y + 26], [x + 18, y + 26], [x + 10, y + 36]], WHITE);
  thickLine(x + 54, y + 10, x + 60, y + 26, 2, WHITE);
  thickLine(x + 54, y + 10, x + 48, y + 26, 2, WHITE);
  poly([[x + 46, y + 26], [x + 62, y + 26], [x + 54, y + 36]], WHITE);
  disc(x + 32, y + 4, 4, GOLD);
}
function picBoat(x: number, y: number, c: RGB): void {
  void c;
  rect(x + 30, y + 4, 3, 30, WHITE);
  poly([[x + 33, y + 6], [x + 52, y + 30], [x + 33, y + 30]], WHITE);
  poly([[x + 30, y + 10], [x + 16, y + 30], [x + 30, y + 30]], GOLDL);
  poly([[x + 6, y + 32], [x + 58, y + 32], [x + 50, y + 46], [x + 14, y + 46]], WHITE);
  thickLine(x + 2, y + 54, x + 18, y + 54, 3, WHITE);
  thickLine(x + 24, y + 54, x + 40, y + 54, 3, WHITE);
  thickLine(x + 46, y + 54, x + 62, y + 54, 3, WHITE);
}
function picRetreat(x: number, y: number, c: RGB): void {
  void c;
  poly([[x + 8, y + 18], [x + 26, y + 6], [x + 26, y + 12], [x + 56, y + 12], [x + 56, y + 24], [x + 26, y + 24], [x + 26, y + 30]], WHITE);
  poly([[x + 8, y + 48], [x + 26, y + 36], [x + 26, y + 42], [x + 56, y + 42], [x + 56, y + 54], [x + 26, y + 54], [x + 26, y + 60]], GOLD);
  disc(x + 52, y + 12, 3, RED);
}
function picHeli(x: number, y: number, c: RGB): void {
  void c;
  thickLine(x + 6, y + 8, x + 58, y + 8, 4, WHITE);
  rect(x + 30, y + 8, 4, 8, WHITE);
  disc(x + 24, y + 26, 14, WHITE);
  rect(x + 36, y + 20, 22, 8, WHITE);
  poly([[x + 58, y + 20], [x + 58, y + 28], [x + 52, y + 26]], WHITE);
  rect(x + 54, y + 12, 3, 14, RED);
  disc(x + 30, y + 24, 5, GOLDL);
  rect(x + 12, y + 42, 26, 3, WHITE);
  rect(x + 14, y + 36, 3, 6, WHITE);
  rect(x + 34, y + 36, 3, 6, WHITE);
}
function picCourt(x: number, y: number, w: number, c: RGB, accent: RGB): void {
  // Courthouse: pediment, four columns, steps.
  poly([[x, y + 46], [x + w / 2, y], [x + w, y + 46]], c);
  disc(x + w / 2, y + 26, 12, accent);
  rect(x + 4, y + 52, w - 8, 6, c);
  const colW = 16;
  const gap = (w - 4 * colW) / 5;
  for (let i = 0; i < 4; i++) {
    const cx = gap + i * (colW + gap);
    rect(x + cx, y + 62, colW, 92, c);
  }
  rect(x, y + 158, w, 8, c);
  rect(x - 8, y + 170, w + 16, 8, c);
  rect(x - 16, y + 182, w + 32, 8, c);
  rect(x + w / 2 - 14, y + 118, 28, 36, accent);
}

// ------------------------------------------------------------------ layout
function masthead(): void {
  rect(0, 0, W, 118, NAVY);
  drawCentered("THE WORLD IN ONE DAY", W / 2, 20, 6, GOLDL);
  rect(24, 70, W - 48, 3, GOLD);
  drawCentered("WEDNESDAY, 25 NOVEMBER 2026", W / 2, 82, 3, WHITE);
}

function lead(): void {
  const x = 24;
  const y = 132;
  const w = 976;
  const h = 316;
  rect(x, y, w, h, WHITE);
  frame(x, y, w, h, 3, NAVY);
  drawText("LEAD STORY - UNITED STATES", x + 24, y + 16, 2, RED);
  drawText("HUAWEI GUILTY", x + 24, y + 40, 5, NAVY);
  drawText("IN US TRIAL", x + 24, y + 82, 5, NAVY);
  rect(x + 24, y + 130, 300, 34, GOLD);
  drawText("GUILTY: 10 OF 12 COUNTS", x + 38, y + 140, 2, NAVY);
  drawWrapped(
    "A BROOKLYN JURY CONVICTED HUAWEI AND THREE UNITS ON 10 OF 12 COUNTS: BANK AND WIRE FRAUD, SANCTIONS VIOLATIONS AND STEALING TRADE SECRETS.",
    x + 24, y + 182, 2, 51, 19, INK,
  );
  drawWrapped(
    "JURORS ACQUITTED THE FIRM OF RACKETEERING AND OBSTRUCTING JUSTICE, THE TWO MOST SERIOUS CHARGES. SENTENCING IS SET FOR 14 SEPTEMBER 2027.",
    x + 24, y + 244, 2, 51, 19, INK,
  );
  // Pictogram panel, right side.
  const px0 = x + 668;
  rect(px0, y + 16, 284, 284, NAVY2);
  picCourt(px0 + 34, y + 30, 216, WHITE, GOLD);
  drawCentered("BROOKLYN, NEW YORK", px0 + 142, y + 248, 2, GOLDL);
}

type Cell = { tag: string; head: string; body: string; accent: RGB; pic: (x: number, y: number) => void };
const CELLS: Cell[] = [
  {
    tag: "UKRAINE - LIBYA",
    head: "ZELENSKYY CONFIRMS UKRAINE SANK RUSSIAN SHIP",
    body: "KYIV SAYS SEVEN NAVAL DRONES SANK THE CORVETTE MERKURY OFF LIBYA. A KA-27 HELICOPTER WAS DESTROYED TOO.",
    accent: BLUE,
    pic: (x, y) => picShip(x, y, BLUE, NAVY),
  },
  {
    tag: "SAUDI ARABIA",
    head: "HOUTHIS HIT RIYADH TOWER AGAIN, 11 HURT",
    body: "A DRONE STRUCK THE PIF TOWER, THE CAPITAL'S TALLEST, FOR THE SECOND TIME IN LESS THAN A WEEK.",
    accent: BURG,
    pic: (x, y) => picTower(x, y, BURG),
  },
  {
    tag: "FRANCE",
    head: "SARKOZY AND BRUNI ORDERED TO TRIAL",
    body: "JUDGES ORDERED THE CASE TO TRIAL OVER ALLEGED WITNESS TAMPERING IN THE LIBYA CAMPAIGN FUNDS CASE.",
    accent: SLATE,
    pic: (x, y) => picScales(x, y, SLATE),
  },
  {
    tag: "SENEGAL",
    head: "AROUND 175 MIGRANTS MISSING OFF SENEGAL",
    body: "CONTACT LOST WITH A EUROPE-BOUND BOAT THAT LEFT DAKAR AROUND 9-10 NOVEMBER, OFFICIALS SAY.",
    accent: TEAL,
    pic: (x, y) => picBoat(x, y, TEAL),
  },
  {
    tag: "DR CONGO",
    head: "CONGO REBELS HALT MARCH ON BUNIA",
    body: "LUBANGA'S CRP PULLED BACK AFTER DAYS OF FIGHTING, CITING TALKS MEDIATED BY UGANDA.",
    accent: GREEN,
    pic: (x, y) => picRetreat(x, y, GREEN),
  },
  {
    tag: "TURKIYE",
    head: "FIVE SOLDIERS KILLED IN HELICOPTER CRASH",
    body: "AN AS-532 ON A TRAINING FLIGHT CRASHED NEAR ESKISEHIR, THE DEFENCE MINISTRY SAID.",
    accent: ORANGE,
    pic: (x, y) => picHeli(x, y, ORANGE),
  },
];

function grid(): void {
  const cw = 478;
  const ch = 124;
  const gx = 24;
  const gy = 462;
  for (let i = 0; i < CELLS.length; i++) {
    const c = CELLS[i];
    const cx = gx + (i % 2) * (cw + 20);
    const cy = gy + Math.floor(i / 2) * (ch + 10);
    rect(cx, cy, cw, ch, WHITE);
    frame(cx, cy, cw, ch, 2, NAVY);
    rect(cx + 12, cy + 12, 96, 100, c.accent);
    c.pic(cx + 28, cy + 30);
    const tx = cx + 122;
    drawText(c.tag, tx, cy + 12, 1, c.accent);
    drawWrapped(c.head, tx, cy + 26, 2, 28, 17, NAVY);
    drawWrapped(c.body, tx, cy + 64, 1, 57, 10, INK);
    // thin gold rule under the tag
    rect(tx, cy + 22, 40, 2, GOLD);
  }
}

function alsoToday(): void {
  const y = 866;
  rect(24, y, 976, 96, NAVY);
  drawText("ALSO TODAY", 40, y + 10, 2, GOLDL);
  drawText("FOOTBALL - REAL MADRID 5-1 PSV: BELLINGHAM STUNNER, MBAPPE BRACE", 40, y + 32, 2, WHITE);
  drawText("CRICKET - ENGLAND BEAT AUSTRALIA BY 8 WICKETS; DONALD 85, SERIES 1-1", 40, y + 54, 2, WHITE);
  drawText("FOOTBALL - SENEGAL GET AFCON TITLE BACK AS CAS OVERTURNS RULING", 40, y + 76, 2, WHITE);
}

function footer(): void {
  rect(24, 970, 976, 2, GOLD);
  drawCentered("SOURCES: AP - BBC - REUTERS", W / 2, 980, 2, GREY);
}

// --------------------------------------------------------------------- PNG
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  const crcIn = new Uint8Array(4 + data.length);
  crcIn.set(out.subarray(4, 8), 0);
  crcIn.set(data, 4);
  dv.setUint32(8 + data.length, crc32(crcIn));
  return out;
}
function encodePNG(): Uint8Array {
  const raw = new Uint8Array(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, W);
  dv.setUint32(4, H);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk("IHDR", ihdr), chunk("IDAT", new Uint8Array(idat)), chunk("IEND", new Uint8Array(0))];
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

// -------------------------------------------------------------------- main
fill(PAPER);
masthead();
lead();
grid();
alsoToday();
footer();
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), encodePNG());
