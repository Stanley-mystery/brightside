import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const TIKTOK_HREF = "https://www.tiktok.com/@brightside.co";
const WHATSAPP_HREF = "https://wa.me/?text=Hi%20Brightside%2C%20I%27d%20like%20to%20buy%20a%20carrier.";
const INSTAGRAM_HREF = "https://www.instagram.com/brightside.co/";

function buyMarkup() {
  const start = html.indexOf('<section class="section buy" id="buy"');
  const end = html.indexOf("</section>", start);
  assert.ok(start >= 0 && end > start, "how to buy section exists");
  return html.slice(start, end);
}

test("when the origin story ends, then how to buy is the next section", () => {
  const beganAt = html.indexOf('id="began"');
  const buyStart = html.indexOf('<section class="section buy" id="buy"');
  const serveAt = html.indexOf('id="serve"');
  assert.ok(beganAt > 0 && buyStart > beganAt, "how to buy follows how it began");
  assert.ok(serveAt > buyStart, "the pour stays after how to buy");

  const between = html.slice(html.indexOf("</section>", beganAt) + "</section>".length, buyStart);
  assert.doesNotMatch(between, /<section/);
});

test("when how to buy renders, then the delivery photo sits left of the message icons", () => {
  const section = buyMarkup();
  assert.match(section, /aria-labelledby="buy-title"/);
  assert.match(section, /class="eyebrow">How to buy/);
  assert.match(section, /id="buy-title">The carrier comes <em>to you\.<\/em>/);
  assert.match(section, /class="buy-photo"/);
  assert.match(
    section,
    /src="assets\/Brightside Parcel Delivery at the Door\.png"/,
  );
  assert.equal(
    existsSync(new URL("../assets/Brightside Parcel Delivery at the Door.png", import.meta.url)),
    true,
  );
  assert.match(section, /alt="A Brightside carrier handed over at the door\."/);
  assert.ok(
    section.indexOf('class="buy-photo"') < section.indexOf('class="buy-copy"'),
    "the photo sits before the copy",
  );
  assert.match(section, /class="buy-message">Send us a message/);
  assert.match(section, /class="buy-social" aria-label="Send us a message"/);
  assert.match(section, new RegExp(`class="buy-social-link buy-social-tiktok" href="${TIKTOK_HREF.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(section, new RegExp(`class="buy-social-link buy-social-whatsapp" href="${WHATSAPP_HREF.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(section, new RegExp(`class="buy-social-link buy-social-instagram" href="${INSTAGRAM_HREF.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(section, /aria-label="TikTok"/);
  assert.match(section, /aria-label="WhatsApp"/);
  assert.match(section, /aria-label="Instagram"/);
  assert.match(section, /target="_blank"/);
  assert.match(section, /rel="noopener noreferrer"/);
  assert.match(section, /21\+ only/);
  assert.match(html, /href="#buy">How to buy/);
  assert.doesNotMatch(section, /<form|javascript:|data:text/i);
});

test("when a social link is blank, unfinished, or not https, then it is not used", () => {
  const section = buyMarkup();
  const hrefs = [...section.matchAll(/class="buy-social-link[^"]*" href="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(hrefs, [TIKTOK_HREF, WHATSAPP_HREF, INSTAGRAM_HREF]);
  hrefs.forEach((href) => {
    assert.equal(href.startsWith("https://"), true);
    assert.equal(href.includes("javascript:"), false);
  });
});

test("when how to buy is styled, then the photo sits on the left of the icons", () => {
  assert.match(css, /\.buy-layout\s*\{[^}]*display:\s*grid/s);
  assert.match(css, /\.buy-photo\s*\{[^}]*border-radius:\s*28px/s);
  assert.match(css, /\.buy-photo img\s*\{[^}]*object-fit:\s*cover/s);
  assert.match(css, /\.buy-social\s*\{[^}]*display:\s*flex/s);
  assert.match(css, /\.buy-social-link\s*\{[^}]*border-radius:\s*50%/s);
  assert.match(css, /\.buy-social-tiktok\s*\{[^}]*background:\s*#111014/s);
  assert.match(css, /\.buy-social-whatsapp\s*\{[^}]*background:\s*#25d366/s);
  assert.match(css, /@media \(min-width: 960px\)[\s\S]*\.buy-layout\s*\{[^}]*grid-template-columns:/);
});

test("when how to buy scrolls into view, then the photo and icons animate", () => {
  const section = buyMarkup();
  assert.match(section, /class="buy-photo"[^>]*data-reveal/);
  assert.match(section, /class="buy-copy"[^>]*data-reveal/);
  assert.match(css, /@keyframes buy-photo-in/);
  assert.match(css, /@keyframes buy-social-in/);
  assert.match(css, /@keyframes buy-social-float/);
  assert.match(css, /\.js \.buy-photo\.is-in img\s*\{[^}]*animation:\s*buy-photo-in/s);
  assert.match(css, /\.js \.buy-copy\.is-in \.buy-social-link\s*\{[^}]*animation:[\s\S]*buy-social-in[\s\S]*buy-social-float/s);
  assert.match(
    css,
    /prefers-reduced-motion:\s*reduce[\s\S]*\.buy-photo img,\s*\.buy-social-link\s*\{[^}]*animation:\s*none/,
  );
});
