import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import {
  BEGAN_CARD_NUDGE,
  BEGAN_CARD_STRIDE,
  BEGAN_CARD_TILT,
  BEGAN_DOT_START,
  BEGAN_HERO_TOP,
  BEGAN_STACK,
  BEGAN_MOBILE_NUDGE,
  BEGAN_MOBILE_STRIDE,
  BEGAN_MOBILE_TILT,
  beganCardPose,
  beganDotShift,
  beganFrame,
  beganPoseForViewport,
  beganProgress,
  beganStride,
  beganTravel,
} from "../js/logic.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../js/main.js", import.meta.url), "utf8");

function beganMarkup() {
  const start = html.indexOf('<section class="began" id="began"');
  const end = html.indexOf("</section>", start);
  assert.ok(start >= 0 && end > start, "began section exists");
  return html.slice(start, end);
}

test("when the reel ends, then how it began is the next section", () => {
  const reelStart = html.indexOf('<section class="reel" id="reel"');
  const beganStart = html.indexOf('<section class="began" id="began"');
  const storyAt = html.indexOf('id="story"');
  assert.ok(reelStart > 0 && beganStart > reelStart, "the origin story follows the reel");
  assert.ok(storyAt > beganStart, "sweet and strong stays after the origin story");

  const between = html.slice(html.indexOf("</section>", reelStart) + "</section>".length, beganStart);
  assert.doesNotMatch(between, /<section/);
});

test("when the origin story renders, then the line, dot, and four cards are in the scene", () => {
  const section = beganMarkup();
  assert.match(section, /aria-labelledby="began-title"/);
  assert.match(section, /id="began-title">How it all<br>began/);
  assert.match(section, /I didn't set out to build a cocktail company/);
  assert.match(section, /Brightside was born/);
  assert.match(section, /class="began-line"/);
  assert.match(section, /class="began-dot"/);
  assert.match(section, /class="began-mark"/);
  assert.match(section, /id="began-track"/);
  assert.equal(section.match(/class="began-card"/g).length, 4);
  assert.deepEqual(
    [...section.matchAll(/class="began-date">([^<]+)/g)].map((match) => match[1]),
    ["March 2024", "June 2024", "October 2024", "Right now"]
  );
  assert.match(section, /<h3>First pour<\/h3>/);
  assert.match(section, /<h3>Pink board<\/h3>/);
  assert.match(section, /<h3>Pass it<\/h3>/);
  assert.match(section, /<h3>Brightside<\/h3>/);
  assert.doesNotMatch(section, /Goldilocks/i);

  for (const file of ["hero-curls.jpg", "hero-glasses.jpg", "hero-braids.jpg", "hero-bun.jpg"]) {
    assert.match(section, new RegExp(`src="assets/${file}"`));
    assert.equal(existsSync(new URL(`../assets/${file}`, import.meta.url)), true);
  }
});

test("when the origin story is styled, then it pins until the dot can finish the line", () => {
  assert.match(css, /\.began-pin\s*\{[^}]*position:\s*sticky/s);
  assert.match(css, /\.began-pin\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.began-stage\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.began\s*\{[^}]*height:\s*calc\(100dvh \* var\(--began-steps\)\)/s);
  assert.match(css, /\.began h2\s*\{[^}]*font-family:\s*var\(--sans\)/s);
  assert.match(css, /\.began h2\s*\{[^}]*font-weight:\s*800/s);
  assert.match(css, /\.began h2\s*\{[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.began-card\s*\{[^}]*background:\s*#fff/s);
  assert.match(css, /\.began-card h3\s*\{[^}]*font-family:\s*"Caveat"/s);
  assert.match(css, /\.began-date\s*\{[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.began-dot\s*\{[^}]*background:\s*var\(--began-dot-color\)/s);
  assert.match(css, /--began-dot-color:\s*#e34832/);
  assert.equal(BEGAN_DOT_START, 0.22);
  assert.equal(BEGAN_HERO_TOP, 0.16);
  assert.equal(BEGAN_CARD_STRIDE, 0.68);
  assert.equal(BEGAN_CARD_TILT, 8);
  assert.equal(BEGAN_CARD_NUDGE, 42);
  assert.match(css, /\.began-dot\s*\{[^}]*top:\s*22%/s);
  assert.match(css, /\.began-card\s*\{[^}]*top:\s*16%/s);
  [2, 3, 4].forEach((step) => {
    const top = Math.round((BEGAN_HERO_TOP + (step - 1) * BEGAN_CARD_STRIDE) * 100);
    assert.match(css, new RegExp(String.raw`\.began-card:nth-child\(${step}\)\s*\{[^}]*top:\s*${top}%`, "s"));
  });
  assert.match(css, /\.began-card:nth-child\(2\)\s*\{[^}]*rotate\(8deg\)/s);
});

test("when motion is reduced or scripts are off, then every card is in the page and the section does not pin", () => {
  assert.match(css, /html:not\(\.js\) \.began\s*\{[^}]*height:\s*auto/s);
  assert.match(css, /html:not\(\.js\) \.began-card[\s\S]*position:\s*relative/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.began\s*\{[^}]*height:\s*auto/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.began-pin\s*\{[^}]*position:\s*relative/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.began-dot\s*\{[^}]*bottom:\s*0/);
  assert.match(main, /prefers-reduced-motion:\s*reduce/);
  assert.match(main, /if \(reduce\) return;/);
});

test("when the page loads, then scroll progress moves the dot and the cards", () => {
  assert.match(main, /function bindBegan\(/);
  assert.match(main, /bindBegan\(\)/);
  assert.match(main, /beganFrame/);
  assert.match(main, /beganCardPose/);
  assert.match(main, /beganStride/);
  assert.match(main, /beganPoseForViewport/);
  assert.match(main, /max-width: 959px/);
  assert.match(main, /zIndex/);
  assert.match(main, /addEventListener\("scroll", request, \{ passive: true \}\)/);
  assert.match(main, /translate3d/);
});

test("when the origin section is shorter than the screen, then there is no travel", () => {
  assert.equal(beganTravel(700, 800), 0);
  assert.equal(beganTravel(800, 800), 0);
  assert.equal(beganTravel(0, 800), 0);
  assert.equal(beganTravel(-100, 800), 0);
  assert.equal(beganTravel(Number.NaN, 800), 0);
  assert.equal(beganTravel(1600, 0), 0);
  assert.equal(beganTravel(1600, Number.NaN), 0);
});

test("when the origin section is taller than the screen, then travel is the extra height", () => {
  assert.equal(beganTravel(3200, 800), 2400);
});

test("when the origin story has not been scrolled, then progress stays at the start", () => {
  assert.equal(beganProgress(0, 2400), 0);
  assert.equal(beganProgress(-40, 2400), 0);
  assert.equal(beganProgress(Number.NaN, 2400), 0);
  assert.equal(beganProgress(100, 0), 0);
  assert.equal(beganProgress(100, -5), 0);
});

test("when the scroll is partway down the origin story, then progress matches that share", () => {
  assert.equal(beganProgress(1200, 2400), 0.5);
});

test("when the scroll passes the origin story, then progress stops at the end", () => {
  assert.equal(beganProgress(2400, 2400), 1);
  assert.equal(beganProgress(2600, 2400), 1);
});

test("when the line length is missing, then the dot does not move", () => {
  assert.equal(beganDotShift(0.5, 0, 12), 0);
  assert.equal(beganDotShift(0.5, -20, 12), 0);
  assert.equal(beganDotShift(0.5, Number.NaN, 12), 0);
});

test("when the dot is taller than the line, then it stays at the start of its travel", () => {
  assert.equal(beganDotShift(1, 10, 40, 0.2), 2);
});

test("when the dot travels a measured line, then it starts beside the first card and ends at the bottom", () => {
  assert.equal(beganDotShift(0, 500, 12, 0.2), 100);
  assert.equal(beganDotShift(0.5, 500, 12, 0.2), 294);
  assert.equal(beganDotShift(1, 500, 12, 0.2), 488);
  assert.equal(beganDotShift(Number.NaN, 500, 12, 0.2), 100);
});

test("when the stage has no height, then the card stride is zero", () => {
  assert.equal(beganStride(0), 0);
  assert.equal(beganStride(-100), 0);
  assert.equal(beganStride(Number.NaN), 0);
});

test("when the stage has height, then each new card waits most of a screen below", () => {
  assert.equal(beganStride(800), 544);
  assert.equal(beganStride(800, false), 544);
});

test("when the screen is narrow, then the story copy and card fit the phone", () => {
  assert.match(css, /@media \(max-width: 959px\)[\s\S]*\.began h2\s*\{[^}]*font-size:\s*clamp\(1\.85rem, 8\.4vw, 2\.3rem\)/);
  assert.match(css, /@media \(max-width: 959px\)[\s\S]*\.began-card\s*\{[^}]*width:\s*calc\(100% - 0\.65rem\)/);
  assert.match(css, /@media \(max-width: 959px\)[\s\S]*\.began-card img\s*\{[^}]*aspect-ratio:\s*16 \/ 10/);
  assert.match(css, /@media \(max-width: 959px\)[\s\S]*\.began-card img\s*\{[^}]*max-height:\s*34vh/);
  assert.match(css, /@media \(max-width: 959px\)[\s\S]*\.began-mark\s*\{[^}]*transform:\s*translateX\(-50%\)/);
  assert.equal(BEGAN_MOBILE_STRIDE, 0.875);
  assert.equal(beganStride(800, true), 700);
});

test("when the screen is narrow, then a waiting photo stays on the card and a stacked photo keeps its tilt", () => {
  const waiting = beganCardPose(0, 1, 4, 700);
  const fitted = beganPoseForViewport(waiting, true);
  assert.equal(fitted.y, 700);
  assert.equal(fitted.x, BEGAN_CARD_NUDGE * BEGAN_MOBILE_NUDGE);
  assert.equal(fitted.rotate, BEGAN_CARD_TILT * BEGAN_MOBILE_TILT);
  assert.equal(fitted.z, 1);

  const seated = beganPoseForViewport(beganCardPose(1, 1, 4, 700), true);
  assert.equal(seated.rotate, BEGAN_STACK[1].rotate);
  assert.equal(seated.x, BEGAN_STACK[1].x * 0.5);
  assert.equal(seated.y, BEGAN_STACK[1].y);
  assert.deepEqual(beganPoseForViewport(waiting, false), {
    y: waiting.y,
    rotate: waiting.rotate,
    x: waiting.x,
    z: waiting.z,
  });
  assert.deepEqual(beganPoseForViewport(null, true), { y: 0, rotate: 0, x: 0, z: 0 });
  assert.deepEqual(beganPoseForViewport({ y: "no", rotate: 8, x: 10, z: 2 }, true), {
    y: 0,
    rotate: 8,
    x: 5,
    z: 2,
  });
});

function stackedPose(index) {
  const rest = BEGAN_STACK[index];
  return { y: rest.y, rotate: rest.rotate, x: rest.x, z: index };
}

test("when the story is on the first card, then the next card waits tilted at the bottom", () => {
  assert.deepEqual(beganCardPose(0, 0, 4, 600), stackedPose(0));
  assert.deepEqual(beganCardPose(0, 1, 4, 600), { y: 600, rotate: BEGAN_CARD_TILT, x: BEGAN_CARD_NUDGE, z: 1 });
  assert.deepEqual(beganCardPose(0, 2, 4, 600), { y: 1200, rotate: BEGAN_CARD_TILT, x: BEGAN_CARD_NUDGE, z: 2 });
});

test("when the next photo is halfway in, then the photo already seen stays in the pile", () => {
  const rest = BEGAN_STACK[1];
  assert.deepEqual(beganCardPose(1 / 6, 0, 4, 600), stackedPose(0));
  assert.deepEqual(beganCardPose(1 / 6, 1, 4, 600), {
    y: rest.y + (600 - rest.y) * 0.5,
    rotate: rest.rotate + (BEGAN_CARD_TILT - rest.rotate) * 0.5,
    x: rest.x + (BEGAN_CARD_NUDGE - rest.x) * 0.5,
    z: 1,
  });
});

test("when a new photo lands, then it stacks on top of the photo already seen", () => {
  const covered = beganCardPose(1 / 3, 0, 4, 600);
  const top = beganCardPose(1 / 3, 1, 4, 600);
  assert.deepEqual(covered, stackedPose(0));
  assert.deepEqual(top, stackedPose(1));
  assert.ok(top.z > covered.z);
  assert.ok(covered.y >= 0);
  assert.ok(top.y >= 0);
});

test("when the line is finished, then every seen photo is still stacked with the newest on top", () => {
  const poses = [0, 1, 2, 3].map((index) => beganCardPose(1, index, 4, 600));
  poses.forEach((pose, index) => {
    assert.deepEqual(pose, stackedPose(index));
    assert.ok(pose.y >= 0);
  });
  assert.ok(poses[3].z > poses[2].z);
  assert.ok(poses[2].z > poses[0].z);
});

test("when a card pose is given bad input, then it stays seated", () => {
  assert.deepEqual(beganCardPose(0.4, -1, 4, 600), { y: 0, rotate: 0, x: 0, z: 0 });
  assert.deepEqual(beganCardPose(0.4, Number.NaN, 4, 600), { y: 0, rotate: 0, x: 0, z: 0 });
  assert.deepEqual(beganCardPose(0.4, 1, 0, 600), { y: 0, rotate: 0, x: 0, z: 0 });
  assert.deepEqual(beganCardPose(0.4, 1, Number.NaN, 600), { y: 0, rotate: 0, x: 0, z: 0 });
  assert.deepEqual(beganCardPose(0, 1, 4, 0), { y: 0, rotate: BEGAN_CARD_TILT, x: BEGAN_CARD_NUDGE, z: 1 });
  assert.deepEqual(beganCardPose(Number.NaN, 1, 1, 600), { y: 0, rotate: 0, x: 0, z: 0 });
});

test("when the origin section is still below the fold, then the first card and the dot wait", () => {
  assert.deepEqual(beganFrame({
    rectTop: 500,
    sectionHeight: 3200,
    viewportHeight: 800,
    lineLength: 500,
    dotSize: 12,
  }), { progress: 0, dot: 110 });
});

test("when the origin section is pinned halfway, then the dot is halfway down its travel", () => {
  assert.deepEqual(beganFrame({
    rectTop: -1200,
    sectionHeight: 3200,
    viewportHeight: 800,
    lineLength: 500,
    dotSize: 12,
  }), { progress: 0.5, dot: 299 });
});

test("when the origin line has reached the bottom, then progress is finished", () => {
  assert.deepEqual(beganFrame({
    rectTop: -2400,
    sectionHeight: 3200,
    viewportHeight: 800,
    lineLength: 500,
    dotSize: 12,
  }), { progress: 1, dot: 488 });
});

test("when origin measurements are missing, then the scene stays at the start", () => {
  assert.deepEqual(beganFrame(null), { progress: 0, dot: 0 });
  assert.deepEqual(beganFrame(undefined), { progress: 0, dot: 0 });
  assert.deepEqual(beganFrame({}), { progress: 0, dot: 0 });
  assert.deepEqual(beganFrame({
    rectTop: "nope",
    sectionHeight: 0,
    viewportHeight: -10,
    lineLength: Number.NaN,
    dotSize: 12,
  }), { progress: 0, dot: 0 });
});
