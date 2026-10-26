import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");

function founderMarkup() {
  const start = html.indexOf('<section class="founder" id="founder"');
  const end = html.indexOf("</section>", start);
  assert.ok(start >= 0 && end > start, "founder section exists");
  return html.slice(start, end);
}

test("when the origin story ends, then how to buy is the next section", () => {
  const beganAt = html.indexOf('id="began"');
  const buyStart = html.indexOf('<section class="section buy" id="buy"');
  const founderStart = html.indexOf('<section class="founder" id="founder"');
  const storyAt = html.indexOf('id="story"');
  assert.ok(beganAt > 0 && buyStart > beganAt, "how to buy follows how it began");
  assert.ok(storyAt > buyStart, "sweet and strong stays after how to buy");
  if (founderStart >= 0) {
    assert.ok(founderStart > buyStart, "the founder follows how to buy");
  }

  const between = html.slice(html.indexOf("</section>", beganAt) + "</section>".length, buyStart);
  assert.doesNotMatch(between, /<section/);
});

test("when the founder section renders, then it introduces Lila and her Instagram", () => {
  const section = founderMarkup();
  assert.match(section, /aria-labelledby="founder-title"/);
  assert.match(section, /id="founder-title">Lila keeps the <em>bright side\.<\/em>/);
  assert.match(section, /class="eyebrow">The founder/);
  assert.match(section, /The margarita was the easy part/);
  assert.match(section, /She still tastes every batch/);
  assert.match(section, /src="assets\/hero-bun\.jpg"/);
  assert.equal(existsSync(new URL("../assets/hero-bun.jpg", import.meta.url)), true);
  assert.match(section, /alt="Lila, founder of Brightside, smiling and holding a pink can with both hands\."/);
  assert.match(section, /<figcaption>Lila<\/figcaption>/);
  assert.match(section, /<section class="founder" id="founder"[^>]*data-reveal/);
  assert.match(section, /class="founder-social" href="https:\/\/www\.instagram\.com\/brightside\.co\/"/);
  assert.match(section, /target="_blank"/);
  assert.match(section, /rel="noopener noreferrer"/);
  assert.match(section, /Founder's Instagram/);
  assert.match(section, /<strong>@brightside\.co<\/strong>/);
  assert.match(html, /href="#founder">The founder/);
  assert.doesNotMatch(section, /Goldilocks/i);
});

test("when the founder section is styled, then the portrait and social account sit together", () => {
  assert.match(css, /\.founder-layout\s*\{[^}]*display:\s*grid/s);
  assert.match(css, /\.founder-photo img\s*\{[^}]*object-fit:\s*cover/s);
  assert.match(css, /\.founder-photo\s*\{[^}]*width:\s*min\(18\.5rem, 100%\)/s);
  assert.match(css, /\.founder-social\s*\{[^}]*background:\s*#24161c/s);
  assert.match(css, /\.founder-social\s*\{[^}]*border-radius:\s*999px/s);
  assert.match(css, /@media \(min-width: 960px\)[\s\S]*\.founder-layout\s*\{[^}]*grid-template-columns:/);
  assert.match(css, /@media \(min-width: 960px\)[\s\S]*\.js \.founder-photo\s*\{[^}]*animation-name:\s*founder-photo-in/);
  assert.match(css, /@keyframes founder-photo-in/);
  assert.match(css, /@keyframes began-rise/);
  assert.match(css, /\.js \.founder\.is-in \.founder-photo/);
  assert.match(css, /\.js \.began-pin\[data-reveal\],\s*\.js \.founder\[data-reveal\]\s*\{[^}]*opacity:\s*1/s);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.founder-photo,\s*\.founder-copy,\s*\.founder-social,\s*\.began-copy,\s*\.began-rail,\s*\.began-stage\s*\{[^}]*animation:\s*none/);
});

test("when the founder photo is beside the copy, then the account link is still in the section", () => {
  const section = founderMarkup();
  const photoAt = section.indexOf('class="founder-photo"');
  const copyAt = section.indexOf('class="founder-copy"');
  const socialAt = section.indexOf('class="founder-social"');
  assert.ok(photoAt >= 0 && copyAt > photoAt, "the portrait comes before the copy");
  assert.ok(socialAt > copyAt, "the social account sits with the founder copy");
});
