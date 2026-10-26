import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { nextSceneOffset } from "../js/logic.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../js/main.js", import.meta.url), "utf8");

const SCENE_PHOTOS = [
  "assets/hero-braids.jpg",
  "assets/hero-headband.jpg",
  "assets/hero-curls.jpg",
  "assets/hero-glasses.jpg",
  "assets/hero-bun.jpg",
];

function scenesMarkup() {
  const start = html.indexOf('<section class="scenes" id="scenes"');
  const end = html.indexOf("</section>", start);
  assert.ok(start >= 0 && end > start, "scenes section exists");
  return html.slice(start, end);
}

test("when the page moves past the characters, then the night section is the next one", () => {
  const canAt = html.indexOf('id="can"');
  const scenesAt = html.indexOf('id="scenes"');
  const storyAt = html.indexOf('id="story"');
  assert.ok(canAt > 0 && scenesAt > canAt, "scenes follows the characters");
  assert.ok(storyAt > scenesAt, "sweet and strong stays after the night");

  const section = scenesMarkup();
  assert.match(section, /id="scenes-title">From first sip to<br>final scene/);
  assert.match(section, /We're not saying we do it all\.<br>But do we\? You tell us\./);
  assert.match(section, /Work Happy Hour/);
  assert.match(section, /Pre-Game/);
  assert.match(section, /Party Time/);
  assert.match(section, /class="scenes-next"[^>]*aria-label="Next scenes"/);
  assert.match(section, /aria-controls="scenes-track"/);
});

test("when the night section renders, then each frame is someone taking the can", () => {
  const section = scenesMarkup();
  const sources = [...section.matchAll(/src="(assets\/hero-[^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(sources, SCENE_PHOTOS);
  for (const source of sources) {
    assert.equal(existsSync(new URL(`../${source}`, import.meta.url)), true, source);
  }
  assert.equal(section.match(/class="polaroid"/g).length, 5);
  assert.match(section, /holds a pink Brightside can up to take a sip/);
  assert.match(section, /holds a pink Brightside can near her mouth/);
  assert.match(section, /holds a pink Brightside can beside her face/);
  assert.match(section, /holds a pink Brightside can up in front of a staircase/);
  assert.match(section, /holds a pink Brightside can with both hands/);
  assert.doesNotMatch(section, /brightside-can\.png/);
});

test("when the night section is styled, then the frames read as polaroids on a dark field", () => {
  assert.match(css, /\.scenes\s*\{[^}]*background:\s*#242424/s);
  assert.match(css, /\.scenes h2\s*\{[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.polaroid\s*\{[^}]*background:\s*#f7f4ef/s);
  assert.match(css, /\.polaroid img\s*\{[^}]*height:\s*auto/s);
  assert.match(css, /\.polaroid img\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/s);
  assert.match(css, /\.polaroid figcaption\s*\{[^}]*font-family:\s*"Caveat"/s);
  assert.match(css, /\.scene-foot::after\s*\{[^}]*border-radius:\s*50%/s);
  assert.match(css, /\.scenes-next\s*\{[^}]*border-radius:\s*50%/s);
  assert.match(css, /@media \(min-width:\s*960px\)[\s\S]*\.scene\s*\{[^}]*flex-basis:\s*calc\(\(100% - 2\.9rem\) \/ 3\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.scenes-track\s*\{[^}]*scroll-behavior:\s*auto/);
});

test("when the night section scrolls into view, then the headline and frames rise in", () => {
  const section = scenesMarkup();
  assert.match(section, /<section class="scenes" id="scenes"[^>]*data-reveal/);
  assert.match(css, /@keyframes scene-photo-in/);
  assert.match(css, /@keyframes scene-rise/);
  assert.match(css, /\.js \.scenes\.is-in \.polaroid[\s\S]*animation-play-state:\s*running/);
  assert.match(css, /\.js \.scenes\[data-reveal\]\s*\{[^}]*opacity:\s*1/s);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.polaroid[\s\S]*animation:\s*none/);
  assert.match(main, /querySelectorAll\("\[data-reveal\]"\)/);
});

test("when the next arrow is used, then the strip advances one frame and wraps at the end", () => {
  assert.equal(nextSceneOffset(0, 280, 840), 280);
  assert.equal(nextSceneOffset(560, 280, 840), 840);
  assert.equal(nextSceneOffset(839, 280, 840), 0);
  assert.equal(nextSceneOffset(840, 280, 840), 0);
});

test("when the next arrow is given a broken distance, then the strip stays at the start", () => {
  assert.equal(nextSceneOffset(Number.NaN, 280, 840), 0);
  assert.equal(nextSceneOffset(-20, 280, 840), 0);
  assert.equal(nextSceneOffset(100, 0, 840), 0);
  assert.equal(nextSceneOffset(100, -40, 840), 0);
  assert.equal(nextSceneOffset(100, 280, 0), 0);
  assert.equal(nextSceneOffset(100, 280, Number.NaN), 0);
  assert.equal(nextSceneOffset("120", 280, 840), 0);
});

test("when the next control is wired, then it scrolls by the measured frame", () => {
  assert.match(main, /function bindScenes\(\)/);
  assert.match(main, /nextSceneOffset\(track\.scrollLeft, step, max\)/);
  assert.match(main, /bindScenes\(\)/);
  assert.match(main, /prefers-reduced-motion:\s*reduce/);
});
