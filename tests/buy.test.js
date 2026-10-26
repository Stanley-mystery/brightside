import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");

const ORDER_TEXT = "Hi Brightside, I'd like to buy a carrier.";
const ORDER_HREF = "https://wa.me/?text=Hi%20Brightside%2C%20I%27d%20like%20to%20buy%20a%20carrier.";

function buyMarkup() {
  const start = html.indexOf('<section class="section buy" id="buy"');
  const end = html.indexOf("</section>", start);
  assert.ok(start >= 0 && end > start, "how to buy section exists");
  return html.slice(start, end);
}

test("when the origin story ends, then how to buy is the next section", () => {
  const beganAt = html.indexOf('id="began"');
  const buyStart = html.indexOf('<section class="section buy" id="buy"');
  const storyAt = html.indexOf('id="story"');
  assert.ok(beganAt > 0 && buyStart > beganAt, "how to buy follows how it began");
  assert.ok(storyAt > buyStart, "sweet and strong stays after how to buy");

  const between = html.slice(html.indexOf("</section>", beganAt) + "</section>".length, buyStart);
  assert.doesNotMatch(between, /<section/);
});

test("when how to buy renders, then it sends the order note on WhatsApp", () => {
  const section = buyMarkup();
  assert.match(section, /aria-labelledby="buy-title"/);
  assert.match(section, /class="eyebrow">How to buy/);
  assert.match(section, /id="buy-title">Send a message on <em>WhatsApp\.<\/em>/);
  assert.match(section, /Carriers move by message/);
  assert.equal(section.match(/<li>/g).length, 3);
  assert.match(section, /Open the note/);
  assert.match(section, /Name the table/);
  assert.match(section, /We bring the cold/);
  assert.match(section, /class="buy-preview">Hi Brightside, I'd like to buy a carrier\./);
  assert.match(section, new RegExp(`class="btn buy-whatsapp" href="${ORDER_HREF.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(section, /target="_blank"/);
  assert.match(section, /rel="noopener noreferrer"/);
  assert.match(section, />\s*Send a message on WhatsApp\s*</);
  assert.match(section, /21\+ only/);
  assert.doesNotMatch(section, /<form|javascript:|data:text/i);
  assert.match(html, /href="#buy">How to buy/);
});

test("when the WhatsApp link is blank, unfinished, or not https, then it is not the order link", () => {
  const section = buyMarkup();
  const href = section.match(/class="btn buy-whatsapp" href="([^"]+)"/)?.[1];
  assert.equal(href.startsWith("https://wa.me/?text="), true);
  assert.equal(decodeURIComponent(href.slice("https://wa.me/?text=".length)), ORDER_TEXT);
  assert.notEqual(href, "https://wa.me/");
  assert.notEqual(href, "https://wa.me/?text=");
  assert.equal(href.includes("javascript:"), false);
});

test("when how to buy is styled, then the steps and WhatsApp button sit in a card", () => {
  assert.match(css, /\.buy-layout\s*\{[^}]*display:\s*grid/s);
  assert.match(css, /\.buy\s*\{[^}]*background:[\s\S]*#1a1014/s);
  assert.match(css, /\.buy-card\s*\{[^}]*background:[\s\S]*var\(--paper\)/s);
  assert.match(css, /\.buy-card\s*\{[^}]*border-radius:\s*28px/s);
  assert.match(css, /\.buy-preview\s*\{[^}]*background:\s*#d9fdd3/s);
  assert.match(css, /\.buy-whatsapp\s*\{[^}]*background:\s*#128c7e/s);
  assert.match(css, /\.buy-whatsapp\s*\{[^}]*width:\s*100%/s);
  assert.match(css, /@media \(min-width: 960px\)[\s\S]*\.buy-layout\s*\{[^}]*grid-template-columns:/);
  assert.match(css, /@media \(min-width: 960px\)[\s\S]*\.buy-whatsapp\s*\{[^}]*width:\s*auto/);
});

test("when how to buy scrolls into view, then the phone, note, and steps animate", () => {
  const section = buyMarkup();
  assert.match(section, /class="buy-phone"/);
  assert.match(section, /class="buy-bubble"/);
  assert.match(section, /class="buy-typing"/);
  assert.match(section, /class="buy-stage"[^>]*data-reveal/);
  assert.match(css, /@keyframes buy-tilt/);
  assert.match(css, /@keyframes buy-float/);
  assert.match(css, /@keyframes buy-send/);
  assert.match(css, /@keyframes buy-step/);
  assert.match(css, /\.js \.buy-stage\.is-in \.buy-phone\s*\{[^}]*animation:[\s\S]*buy-tilt/s);
  assert.match(css, /\.js \.buy-stage\.is-in \.buy-preview\s*\{[^}]*animation:\s*buy-send/s);
  assert.match(css, /\.js \.buy-copy\.is-in \.buy-steps li\s*\{[^}]*animation:\s*buy-step/s);
  assert.match(
    css,
    /prefers-reduced-motion:\s*reduce[\s\S]*\.buy-phone,\s*\.buy-preview,\s*\.buy-bubble,\s*\.buy-typing,\s*\.buy-orb,\s*\.buy-mark,\s*\.buy-status,\s*\.buy-steps li,\s*\.buy-steps::before,\s*\.buy-whatsapp::after\s*\{[^}]*animation:\s*none/,
  );
});
