import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../js/main.js", import.meta.url), "utf8");

const GALLERY_PHOTOS = Array.from({ length: 7 }, (_, index) => {
  const suffix = index === 6 ? "" : ` (${index + 1})`;
  return `assets/images/people-holding-brand/WhatsApp%20Image%202026-10-30%20at%2009.37.37${suffix.replaceAll(" ", "%20")}.jpeg`;
});

function galleryMarkup() {
  const start = html.indexOf('<section class="gallery" id="gallery"');
  const end = html.indexOf("</section>", start);
  assert.ok(start >= 0 && end > start, "gallery section exists");
  return html.slice(start, end);
}

test("when the page moves past the characters, then the gallery is next", () => {
  const canAt = html.indexOf('id="can"');
  const galleryAt = html.indexOf('id="gallery"');
  const placesAt = html.indexOf('id="places"');
  assert.ok(canAt > 0 && galleryAt > canAt, "gallery follows the characters");
  assert.ok(placesAt > galleryAt, "places follows the gallery");
  assert.match(html, /<a href="#gallery">Gallery<\/a>/);
  assert.doesNotMatch(html, /id="scenes"|scenes-track|scenes-next/);
});

test("when the gallery renders, then all people-holding-brand photos are present", () => {
  const section = galleryMarkup();
  const sources = [...section.matchAll(/data-gallery-thumb[^>]*>[\s\S]*?<img src="(assets\/images\/people-holding-brand\/[^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(sources, GALLERY_PHOTOS);
  for (const source of sources) {
    const diskPath = decodeURIComponent(source.replace(/^assets\//, "../assets/"));
    assert.equal(existsSync(new URL(diskPath, import.meta.url)), true, source);
  }
  assert.equal(section.match(/class="gallery-thumbnail[^"]*"[^>]*data-gallery-thumb/g).length, 7);
  assert.match(section, /<h2 id="gallery-title">/);
  assert.match(section, /class="gallery-slider"/);
  assert.match(section, /class="gallery-slide-image" data-gallery-image/);
  assert.doesNotMatch(section, /assets\/hero-/);
});

test("when the gallery is styled, then one photo fills a responsive slider", () => {
  const section = galleryMarkup();
  assert.match(section, /role="region" aria-roledescription="carousel"/);
  assert.match(css, /\.gallery-slider\s*\{[^}]*height:\s*clamp\(/s);
  assert.match(css, /\.gallery-slide-image\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /@media \(max-width:\s*600px\)[\s\S]*\.gallery-slider/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("when the gallery loads, then the slider starts automatically and its controls work", () => {
  const section = galleryMarkup();
  assert.match(section, /data-gallery-previous aria-label="Previous photo"/);
  assert.match(section, /data-gallery-next aria-label="Next photo"/);
  assert.match(section, /data-gallery-play aria-pressed="false"/);
  assert.match(section, /data-gallery-progress/);
  assert.match(section, /data-gallery-thumb/);
  assert.match(html, /aria-live="polite"/);
  assert.match(main, /function bindGallery\(\)/);
  assert.match(main, /showPhoto\(activeIndex \+ 1\)/);
  assert.match(main, /setInterval\([\s\S]*?5000\)/);
  assert.match(main, /showPhoto\(activeIndex\);\s*start\(\);/);
  assert.match(main, /carousel\.addEventListener\("keydown"/);
  assert.match(main, /touchstart/);
  assert.match(main, /bindGallery\(\)/);
});

test("when the slider advances, then it respects reduced-motion preferences", () => {
  assert.match(css, /@keyframes gallery-image-fade/);
  assert.match(css, /\.gallery-thumbnail\.is-active/);
  assert.match(main, /reduceMotion\.matches/);
  assert.match(main, /showPhoto\(activeIndex \+ \(delta < 0 \? 1 : -1\)\)/);
});
