import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import {
  reelAudioState,
  reelIntroPlan,
  reelPlaybackState,
  reelScrollCue,
  reelShouldAutoplay,
  reelTapDelayMs,
} from "../js/logic.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../js/main.js", import.meta.url), "utf8");

function reelMarkup() {
  const start = html.indexOf('<section class="reel" id="reel"');
  const end = html.indexOf("</section>", start);
  assert.ok(start >= 0 && end > start, "reel section exists");
  return html.slice(start, end);
}

test("when the places banner ends, then the reel is the next section", () => {
  const placesStart = html.indexOf('<section class="places"');
  const reelStart = html.indexOf('<section class="reel" id="reel"');
  const storyAt = html.indexOf('id="story"');
  assert.ok(placesStart > 0 && reelStart > placesStart, "reel follows the places banner");
  assert.ok(storyAt > reelStart, "sweet and strong stays after the reel");

  const between = html.slice(html.indexOf("</section>", placesStart) + "</section>".length, reelStart);
  assert.doesNotMatch(between, /<section/);
});

test("when the reel renders, then the try-it clip plays inside a phone", () => {
  const section = reelMarkup();
  assert.match(section, /aria-labelledby="reel-title"/);
  assert.match(section, /id="reel-title">Enjoy<br><em>The Brightside\.<\/em>/);
  assert.ok(section.indexOf('id="reel-title"') < section.indexOf('class="phone is-paused"'), "title sits above the phone");
  assert.ok(section.indexOf('class="phone is-paused"') < section.indexOf('class="btn reel-cta"'), "Try Brightside sits after the phone");
  assert.match(section, /class="btn reel-cta" href="#list"[^>]*>Try Brightside/);
  assert.match(section, /class="phone is-paused"/);
  assert.match(section, /class="phone-bezel"/);
  assert.match(section, /class="phone-island"/);
  const videoTag = section.slice(section.indexOf("<video"), section.indexOf("</video>"));
  assert.doesNotMatch(videoTag, /\bautoplay\b/);
  assert.doesNotMatch(videoTag, /\bmuted\b/);
  assert.match(section, /loop/);
  assert.match(section, /playsinline/);
  assert.match(section, /width="828"/);
  assert.match(section, /height="1540"/);
  assert.match(section, /poster="assets\/margarita-serve\.jpg"/);
  assert.match(section, /src="assets\/margarita-serve\.mp4"/);
  assert.match(section, /id="reel-caption">Friends try Brightside straight from the can\./);
  assert.match(section, /id="reel-control"[^>]*aria-controls="reel-video"/);
  assert.match(section, /aria-label="Play the reel"/);
  assert.match(section, /class="phone is-paused"/);
  assert.doesNotMatch(section, /Passed across/);

  const video = readFileSync(new URL("../assets/margarita-serve.mp4", import.meta.url));
  const poster = readFileSync(new URL("../assets/margarita-serve.jpg", import.meta.url));
  assert.equal(existsSync(new URL("../assets/margarita-serve.mp4", import.meta.url)), true);
  assert.equal(video.subarray(4, 8).toString(), "ftyp");
  assert.ok(video.length > 200_000, "the try-it clip is a real video");
  assert.equal(poster[0], 0xff);
  assert.equal(poster[1], 0xd8);
});

test("when the reel is styled, then the clip sits in a centered phone that floats unless motion is reduced", () => {
  assert.match(css, /\.reel-head\s*\{[^}]*text-align:\s*center/s);
  assert.match(css, /\.reel h2\s*\{[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.reel-stage\s*\{[^}]*justify-items:\s*center/s);
  assert.match(css, /\.phone-screen\s*\{[^}]*aspect-ratio:\s*828 \/ 1540/s);
  assert.match(css, /\.phone-bezel\s*\{[^}]*border-radius:\s*2\.35rem/s);
  assert.match(css, /\.reel-video\s*\{[^}]*object-fit:\s*cover/s);
  assert.match(css, /@keyframes phone-float/);
  assert.match(css, /@keyframes phone-watch/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\) \{[^}]*animation:\s*phone-float/s);
  assert.match(css, /\.phone:not\(\.is-paused\) \.reel-icon-play/);
  assert.doesNotMatch(css, /\.reel-layout/);
  assert.doesNotMatch(css, /\.phone-screen\s*\{[^}]*aspect-ratio:\s*16 \/ 9/s);
});

test("when the reel scrolls into view, then the phone, hand, and side ornaments animate", () => {
  const section = reelMarkup();
  assert.match(section, /class="reel-ornament reel-ornament-left reel-ornament-lime"/);
  assert.match(section, /class="reel-ornament reel-ornament-right reel-ornament-mango"/);
  assert.match(section, /class="reel-hand"[^>]*aria-hidden="true"/);
  assert.match(css, /@keyframes reel-phone-in/);
  assert.match(css, /@keyframes reel-hand-in/);
  assert.match(css, /@keyframes reel-ornament-in/);
  assert.match(css, /@keyframes reel-ornament-float/);
  assert.match(css, /\.js \.reel\.is-in \.phone/);
  assert.match(css, /\.js \.reel-hand\.is-hand-play/);
  assert.match(css, /\.js \.reel-hand\.is-hand-pause/);
  assert.match(css, /\.reel-control\s*\{[^}]*bottom:\s*0\.85rem/s);
  assert.match(css, /\.reel-cta\s*\{[^}]*margin:\s*1\.75rem auto 0/s);
  assert.match(css, /\.js \.reel\.is-in \.reel-ornament/);
  assert.match(css, /--reel-hand-delay:\s*0\.9s/);
  assert.match(css, /--reel-hand-duration:\s*1\.35s/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.reel-hand\s*\{[^}]*opacity:\s*0/);
  assert.match(main, /reelIntroPlan/);
  assert.match(main, /classList\.add\("is-in"\)/);
  assert.match(main, /tapDelayMs/);
  assert.match(main, /reelScrollCue/);
  assert.match(main, /is-hand-play/);
  assert.match(main, /is-hand-pause/);
  assert.match(main, /clearTimeout\(tapTimer\)/);
});

test("when the reel is playing, then the control offers pause", () => {
  assert.deepEqual(reelPlaybackState(true), {
    pressed: true,
    label: "Pause the reel",
    visible: "Pause",
  });
});

test("when the reel is paused or motion is reduced, then it waits to play", () => {
  assert.deepEqual(reelPlaybackState(false), {
    pressed: false,
    label: "Play the reel",
    visible: "Play",
  });
  assert.deepEqual(reelPlaybackState("yes"), {
    pressed: false,
    label: "Play the reel",
    visible: "Play",
  });
  assert.equal(reelShouldAutoplay(true), false);
  assert.equal(reelShouldAutoplay(false), true);
  assert.equal(reelTapDelayMs(true), null);
  assert.deepEqual(reelIntroPlan(true), { animate: false, play: false, tapDelayMs: null });
});

test("when motion is allowed, then playback waits for the hand to press play", () => {
  assert.equal(reelTapDelayMs(false), 1683);
  assert.equal(reelTapDelayMs(undefined), 1683);
  assert.equal(reelTapDelayMs("reduce"), 1683);
  assert.deepEqual(reelIntroPlan(false), { animate: true, play: true, tapDelayMs: 1683 });
  assert.deepEqual(reelIntroPlan("reduce"), { animate: true, play: true, tapDelayMs: 1683 });
});

test("when the hand meets the reel, then the clip plays with sound and pauses off screen", () => {
  assert.deepEqual(reelAudioState(), { muted: false, volume: 1 });
  assert.deepEqual(reelScrollCue(true, false), {
    hand: "play",
    play: true,
    pause: false,
    tapDelayMs: 1683,
  });
  assert.deepEqual(reelScrollCue(false, false), {
    hand: "pause",
    play: false,
    pause: true,
    tapDelayMs: 1683,
  });
  assert.deepEqual(reelScrollCue(true, true), {
    hand: null,
    play: false,
    pause: false,
    tapDelayMs: null,
  });
  assert.deepEqual(reelScrollCue("nearby", false).hand, "pause");
  assert.match(main, /reelAudioState/);
  assert.match(main, /video\.muted = sound\.muted/);
  assert.match(main, /video\.volume = sound\.volume/);
});

test("when the page loads, then the reel control is wired to the playback state", () => {
  assert.match(main, /reelPlaybackState/);
  assert.match(main, /reelIntroPlan/);
  assert.match(main, /reelScrollCue/);
  assert.match(main, /function bindReel\(/);
  assert.match(main, /bindReel\(\)/);
  assert.match(main, /control\.addEventListener\("click"/);
  assert.match(main, /--reel-duration/);
});
