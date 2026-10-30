import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../js/main.js", import.meta.url), "utf8");

function heroMarkup() {
  const start = html.indexOf('<section class="hero"');
  const end = html.indexOf("</section>", start);
  assert.ok(start >= 0 && end > start, "hero section exists");
  return html.slice(start, end);
}

test("when the hero renders, then the right-hand image is a slideshow of Brightside can photos", () => {
  const hero = heroMarkup();
  const panelAt = hero.indexOf('class="hero-panel"');
  const photoAt = hero.indexOf('class="hero-photo"');

  assert.ok(panelAt >= 0, "copy panel is present");
  assert.ok(photoAt > panelAt, "photo follows the copy panel");
  const sources = [...hero.matchAll(/src="(assets\/images\/brand-can\/[^"]+)"/g)].map((match) => match[1]);
  assert.equal(sources.length, 4);
  assert.ok(sources.every((source) => existsSync(new URL(`../${source}`, import.meta.url))));
  assert.match(hero, /class="hero-slide is-active"[^>]+data-hero-slide/);
  assert.match(hero, /aria-hidden="true" data-hero-slide/);
  assert.doesNotMatch(hero, /mango-margarita\.jpg|hero-stage|class="facts"|class="sticker"/);
});

test("when the hero renders, then the banner copy and try button are in the left panel", () => {
  const hero = heroMarkup();
  assert.match(hero, /Skip the shaker\.<br>Keep the Brightside\./);
  assert.match(hero, /class="hero-line">Pour it cold</);
  assert.match(hero, /class="hero-line">Pass the can</);
  assert.match(hero, /class="hero-line">Cheers\./);
  assert.doesNotMatch(hero, /For the ones<br>who want it all\./);
  assert.doesNotMatch(hero, /A margarita/);
  assert.match(hero, /class="hero-cta" href="#list">Try Brightside/);
  assert.match(hero, /class="hero-cheers"/);
  assert.match(hero, /class="hero-ornament hero-lime"/);
  assert.match(hero, /class="hero-ornament hero-mango"/);
  assert.match(hero, /class="hero-ornament hero-star"/);
  assert.match(hero, /class="hero-glass hero-glass-left"/);
  assert.match(hero, /class="hero-glass hero-glass-right"/);
  assert.match(hero, /class="hero-clink"/);
});

test("when the age check passes, then the hero lines rise in one after another", () => {
  assert.match(css, /@keyframes hero-text-in/);
  assert.match(css, /\.hero-kicker,\s*\.hero-line,\s*\.hero-cta\s*\{[^}]*animation:\s*hero-text-in/s);
  assert.match(css, /\.hero-line:nth-child\(1\)\s*\{[^}]*animation-delay:\s*0\.18s/s);
  assert.match(css, /\.hero-line:nth-child\(2\)\s*\{[^}]*animation-delay:\s*0\.32s/s);
  assert.match(css, /\.hero-line:nth-child\(3\)\s*\{[^}]*animation-delay:\s*0\.46s/s);
  assert.match(css, /html\.is-allowed \.hero-kicker[\s\S]*animation-play-state:\s*running/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.hero-kicker[\s\S]*animation:\s*none/);
});

test("when the age check passes, then the hero photo settles in and fades between images", () => {
  assert.match(css, /@keyframes hero-photo-in/);
  assert.match(css, /\.hero-photo\s*\{[^}]*animation:\s*hero-photo-in/s);
  assert.match(css, /\.hero-photo img\s*\{[^}]*transition:\s*opacity 1\.2s ease/s);
  assert.match(css, /\.hero-photo img\.is-active\s*\{[^}]*opacity:\s*1/s);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.hero-photo[\s\S]*animation:\s*none/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.hero-photo img\s*\{[^}]*transition:\s*none/s);
  assert.match(main, /function bindHeroSlideshow\(\)/);
  assert.match(main, /setInterval\([\s\S]*?6000\)/);
  assert.match(main, /prefers-reduced-motion/);
});

test("when the page opens, then the cheers clink and the hero marks draw in", () => {
  assert.match(css, /@keyframes clink-left/);
  assert.match(css, /@keyframes clink-right/);
  assert.match(css, /@keyframes clink-spark/);
  assert.match(css, /@keyframes ornament-in/);
  assert.match(css, /html\.is-allowed \.hero-glass-left[\s\S]*animation-play-state:\s*running/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.hero-glass-left[\s\S]*animation:\s*none/);
});

test("when the hero column gets narrower, then the left headline scales and can wrap", () => {
  assert.match(css, /\.hero-panel\s*\{[^}]*container:\s*hero\s*\/\s*inline-size/s);
  assert.match(css, /\.hero h1\s*\{[^}]*font-size:\s*clamp\(\s*1\.65rem,\s*14\.6cqi,\s*7\.75rem\s*\)/s);
  assert.match(css, /\.hero-line\s*\{[^}]*display:\s*block/s);
  assert.match(css, /\.hero-line\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(css, /@container\s+hero\s*\(max-width:\s*20rem\)/);
  assert.match(css, /@container\s+hero\s*\(max-width:\s*15rem\)/);
  assert.match(css, /\.hero-line\s*\{[^}]*white-space:\s*normal/s);
  assert.match(css, /\.hero-kicker\s*\{[^}]*max-width:\s*min\(/s);
});

test("when the viewport is tall, then the hero fills the screen under the nav", () => {
  assert.match(css, /--nav-height:\s*76px/);
  assert.match(css, /\.nav\s*\{[^}]*min-height:\s*var\(--nav-height\)/s);
  assert.match(css, /\.hero-split\s*\{[^}]*min-height:\s*max\(34rem,\s*calc\(100svh - var\(--nav-height\)\)\)/s);
  assert.doesNotMatch(css, /70svh|74svh/);
});

test("when the hero is styled, then it is a full-bleed blue split with a covered photo", () => {
  assert.match(css, /--hero-blue:\s*#[0-9a-f]{6}/i);
  assert.match(css, /\.hero-split\s*\{[^}]*display:\s*grid/s);
  assert.match(css, /grid-template-columns:\s*minmax\(300px,\s*0\.78fr\)\s*1\.22fr/);
  assert.match(css, /\.hero-photo img\s*\{[^}]*object-fit:\s*cover/s);
  assert.match(css, /\.hero-cta\s*\{[^}]*text-transform:\s*uppercase/s);
});

test("when the page scrolls, then the nav stays in normal flow", () => {
  const navRule = css.match(/\.nav\s*\{([^}]+)\}/);
  assert.ok(navRule, "nav rule exists");
  assert.match(navRule[1], /position:\s*relative/);
  assert.doesNotMatch(navRule[1], /position:\s*fixed/);
  assert.doesNotMatch(css, /\.nav\.is-scrolled/);
  assert.doesNotMatch(main, /is-scrolled/);
});
