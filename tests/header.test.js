import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");

function headerMarkup() {
  const start = html.indexOf('<header class="nav"');
  const end = html.indexOf("</header>", start);
  assert.ok(start >= 0 && end > start, "header exists");
  return html.slice(start, end);
}

test("when the header renders, then the Brightside lockup is the logo", () => {
  const header = headerMarkup();
  assert.match(header, /class="logo" href="#top"/);
  assert.match(
    header,
    /<img class="logo-image" src="assets\/brightside-logo\.png" width="855" height="346" alt="Brightside">/,
  );
  assert.doesNotMatch(header, /logo-mark|Brightside\s*<\/a>/);
  assert.equal(existsSync(new URL("../assets/brightside-logo.png", import.meta.url)), true);
});

test("when the header is wide, then its sides line up with the hero copy", () => {
  assert.match(css, /--hero-inset:\s*clamp\(1\.35rem,\s*4vw,\s*3\.4rem\)/);
  assert.match(css, /\.nav\s*\{[^}]*width:\s*100%/s);
  assert.match(css, /\.nav\s*\{[^}]*padding-inline:\s*var\(--hero-inset\)/s);
  assert.doesNotMatch(css, /\.nav\s*\{[^}]*width:\s*var\(--wrap\)/s);
  assert.match(css, /\.hero-panel\s*\{[^}]*var\(--hero-inset\)/s);
});

test("when the header logo is styled, then it stays a short lockup on small screens", () => {
  assert.match(css, /\.logo-image\s*\{[^}]*height:\s*64px/s);
  assert.match(css, /\.logo-image\s*\{[^}]*width:\s*auto/s);
  assert.match(css, /max-width:\s*959px[\s\S]*\.logo-image\s*\{\s*height:\s*52px/);
});
