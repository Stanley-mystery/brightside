import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");

function canSection() {
  const start = html.indexOf('<section class="characters" id="can"');
  const end = html.indexOf("</section>", start);
  assert.ok(start >= 0 && end > start, "can section exists");
  return html.slice(start, end);
}

test("when the can section renders, then three bands introduce the pour", () => {
  const heroEnd = html.indexOf("</section>");
  const canAt = html.indexOf('id="can"');
  assert.ok(canAt > heroEnd, "the can section follows the hero");

  const section = canSection();
  assert.match(section, /Meet the main<br>pour\./);
  assert.match(section, /class="character character-sweet"/);
  assert.match(section, /class="character character-pour"/);
  assert.match(section, /class="character character-strong"/);
  assert.match(section, /Sweet<\/h3>\s*<p>Ripe mango leads\./);
  assert.match(section, /Mango<br>Margarita/);
  assert.match(section, /Sweet and strong\./);
  assert.match(section, /Strong<\/h3>\s*<p>Lime keeps it sharp\./);
  assert.equal(section.match(/src="assets\/brightside-can\.png"/g).length, 3);
  assert.match(section, /alt="Brightside Mango Margarita can(?:,|")/);
  assert.equal(section.match(/class="character-link" href="#buy">Try it/g).length, 3);
  assert.match(section, /character-ornament character-lime/);
  assert.match(section, /character-ornament character-orange/);
  assert.match(section, /character-ornament character-mango/);
  assert.match(section, /character-spark character-spark-sweet/);
  assert.match(section, /character-spark character-spark-strong/);
  assert.doesNotMatch(section, /class="tin|pink carrier/);
});

test("when a can is hovered, then that can grows and its ornaments appear", () => {
  const section = canSection();
  assert.equal(section.match(/class="character-stage"/g).length, 3);
  assert.equal(section.match(/class="can-float can-float-1"/g).length, 3);
  assert.match(css, /@keyframes character-rise/);
  assert.match(css, /@keyframes character-can-in/);
  assert.match(css, /\.js \.character\.is-in \.character-can[\s\S]*animation-play-state:\s*running/);
  assert.match(css, /\.character-stage:hover \.character-can,\s*\.character:focus-within \.character-can\s*\{[^}]*transform:\s*translateX\(-50%\) scale\(1\.12\)/s);
  assert.match(css, /\.character-stage:hover \.can-float,\s*\.character:focus-within \.can-float\s*\{[^}]*opacity:\s*1/s);
  assert.match(section, /href="#leaf"/);
  assert.match(section, /href="#lime"/);
  assert.match(section, /href="#spark"/);
  const fruits = ["mango", "orange", "lemon", "cherry", "strawberry", "pineapple", "grapefruit"];
  for (const fruit of fruits) {
    assert.match(html, new RegExp(`id="${fruit}"`));
  }
  const cards = [...section.matchAll(/<article class="character character-(?:sweet|pour|strong)">[\s\S]*?<\/article>/g)].map((match) => match[0]);
  assert.equal(cards.length, 3);
  const hoverFruits = cards.map((card) => [...card.matchAll(/class="can-float[\s\S]*?href="#([a-z]+)"/g)].map((match) => match[1]));
  for (const set of hoverFruits) {
    const unique = new Set(set.filter((name) => fruits.includes(name) || name === "lime"));
    assert.equal(unique.size >= 6, true, `hover shows a variety of fruit, got ${[...unique].join(", ")}`);
    assert.ok(set.filter((name) => name === "leaf").length <= 1);
  }
  assert.notEqual(hoverFruits[0].join(","), hoverFruits[1].join(","));
  assert.notEqual(hoverFruits[1].join(","), hoverFruits[2].join(","));
  assert.notEqual(hoverFruits[0].join(","), hoverFruits[2].join(","));
  assert.doesNotMatch(css, /\.character:hover,\s*\.character:focus-within\s*\{[^}]*transform:\s*scale\(/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.character-stage:hover \.character-can[\s\S]*transform:\s*translateX\(-50%\)/);
});

test("when the lineup is styled, then each band has its own color and the cans match until hover", () => {
  assert.match(css, /\.character\s*\{[^}]*--band:\s*#e36b24/s);
  assert.match(css, /\.character-pour\s*\{[^}]*--band:\s*#e7a8c4/s);
  assert.match(css, /\.character-strong\s*\{[^}]*--band:\s*#d9a441/s);
  assert.match(css, /\.characters-intro h2\s*\{[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.character-link\s*\{[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.character-can\s*\{[^}]*height:\s*20rem/s);
  assert.match(css, /\.character-stage\s*\{[^}]*bottom:\s*13rem/s);
  assert.match(css, /@media \(max-width:\s*959px\)[\s\S]*\.character-stage\s*\{[^}]*bottom:\s*10\.75rem/s);
  assert.doesNotMatch(css, /\.character-pour \.character-can\s*\{[^}]*height:/s);
  assert.doesNotMatch(css, /\.character-sweet \.character-can\s*\{[^}]*height:/s);
  assert.doesNotMatch(css, /\.character-strong \.character-can\s*\{[^}]*height:/s);
  assert.match(css, /@media \(min-width:\s*960px\)[\s\S]*\.characters-row\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/);
});

test("when the lineup scrolls into view, then the center can drops and the side cans enter from their edges", () => {
  assert.match(css, /\.character-pour \.character-can\s*\{[^}]*animation-name:\s*character-can-drop/s);
  assert.match(css, /\.character-sweet \.character-can\s*\{[^}]*animation-name:\s*character-can-left/s);
  assert.match(css, /\.character-strong \.character-can\s*\{[^}]*animation-name:\s*character-can-right/s);
  assert.match(css, /@keyframes character-can-drop\s*\{[\s\S]*?translateY\(-160%\)/);
  assert.match(css, /@keyframes character-can-left\s*\{[\s\S]*?translateX\(calc\(-50% - 64vw\)\)/);
  assert.match(css, /@keyframes character-can-right\s*\{[\s\S]*?translateX\(calc\(-50% \+ 64vw\)\)/);
  assert.match(css, /@keyframes character-can-drop\s*\{[\s\S]*?100%\s*\{[^}]*transform:\s*translateX\(-50%\)/);
  assert.match(css, /@keyframes character-can-left\s*\{[\s\S]*?to\s*\{[^}]*transform:\s*translateX\(-50%\)/);
  assert.match(css, /@keyframes character-can-right\s*\{[\s\S]*?to\s*\{[^}]*transform:\s*translateX\(-50%\)/);
});
