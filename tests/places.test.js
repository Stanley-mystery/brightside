import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");

function placesMarkup() {
  const start = html.indexOf('<section class="places" id="places"');
  const end = html.indexOf("</section>", start);
  assert.ok(start >= 0 && end > start, "places section exists");
  return html.slice(start, end);
}

test("when the gallery ends, then the places banner is the next section", () => {
  const galleryAt = html.indexOf('id="gallery"');
  const placesStart = html.indexOf('<section class="places"');
  const reelAt = html.indexOf('<section class="reel"');
  assert.ok(galleryAt > 0 && placesStart > galleryAt, "places follows the gallery");
  assert.ok(reelAt > placesStart, "reel follows the places banner");

  const between = html.slice(html.indexOf("</section>", galleryAt) + "</section>".length, placesStart);
  assert.doesNotMatch(between, /<section/);
});

test("when the places banner renders, then the headline and try link sit on the night photo", () => {
  const section = placesMarkup();
  assert.match(section, /id="places-title"/);
  assert.match(section, /<span>Not everywhere\.<\/span>/);
  assert.match(section, /<span>Just the right<\/span>/);
  assert.match(section, /<span>places\.<\/span>/);
  assert.match(section, /class="places-cta" href="#buy">Try Brightside</);
  assert.match(section, /src="assets\/night-party\.jpg"/);
  assert.equal(existsSync(new URL("../assets/night-party.jpg", import.meta.url)), true);
  assert.match(section, /alt="Friends out at night, each holding a Brightside can\."/);
  assert.doesNotMatch(section, /Goldilocks/i);
});

test("when the places banner is styled, then it is a full-bleed photo with cream type and a cream button", () => {
  assert.match(css, /\.places\s*\{[^}]*min-height:\s*clamp\(/s);
  assert.match(css, /\.places-photo\s*\{[^}]*object-fit:\s*cover/s);
  assert.match(css, /\.places h2\s*\{[^}]*font-family:\s*var\(--sans\)/s);
  assert.match(css, /\.places h2\s*\{[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.places h2\s*\{[^}]*color:\s*var\(--places-cream\)/s);
  assert.match(css, /\.places h2 span\s*\{[^}]*display:\s*block/s);
  assert.match(css, /\.places-cta\s*\{[^}]*background:\s*var\(--places-cream\)/s);
  assert.match(css, /\.places-cta\s*\{[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.places::after\s*\{[^}]*linear-gradient/s);
});

test("when the places photo is not the banner, then the headline is not left on an empty section", () => {
  const section = placesMarkup();
  assert.equal((section.match(/class="places-photo"/g) || []).length, 1);
  assert.match(section, /aria-labelledby="places-title"/);
  const copyAt = section.indexOf('class="places-copy"');
  const photoAt = section.indexOf('class="places-photo"');
  assert.ok(photoAt >= 0 && copyAt > photoAt, "the photo is in the section before the copy");
});
