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
  assert.match(section, /alt="Brightside Mango Margarita can"/);
  assert.equal(section.match(/class="character-link" href="#list">Try it/g).length, 3);
  assert.doesNotMatch(section, /class="tin|pink carrier/);
});

test("when the lineup is styled, then each band has its own color and the center can is larger", () => {
  assert.match(css, /\.character\s*\{[^}]*--band:\s*#e36b24/s);
  assert.match(css, /\.character-pour\s*\{[^}]*--band:\s*#e7a8c4/s);
  assert.match(css, /\.character-strong\s*\{[^}]*--band:\s*#d9a441/s);
  assert.match(css, /\.characters-intro h2\s*\{[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.character-link\s*\{[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.character-pour \.character-can\s*\{[^}]*height:\s*22rem/s);
  assert.match(css, /@media \(min-width:\s*960px\)[\s\S]*\.characters-row\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/);
});
