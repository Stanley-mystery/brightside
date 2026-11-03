import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../js/main.js", import.meta.url), "utf8");

function canSection() {
  const start = html.indexOf('<section class="characters" id="can"');
  const end = html.indexOf("</section>", start);
  assert.ok(start >= 0 && end > start, "can section exists");
  return html.slice(start, end);
}

test("when the can section renders, then a flavour slideshow presents all four cocktails", () => {
  const heroEnd = html.indexOf("</section>");
  const canAt = html.indexOf('id="can"');
  assert.ok(canAt > heroEnd, "the can section follows the hero");

  const section = canSection();
  assert.match(section, /Meet the main<br>pour\./);
  assert.match(section, /data-flavours-carousel/);
  assert.match(section, /assets\/images\/flavours\/mango-margarita\.jpeg/);
  assert.match(section, /assets\/images\/flavours\/long-island\.jpeg/);
  assert.match(section, /assets\/images\/flavours\/bright-side-special\.jpeg/);
  assert.match(section, /assets\/images\/flavours\/pornstar-martini\.jpeg/);
  assert.equal(section.match(/data-flavours-slide/g).length, 4);
  assert.equal(section.match(/data-flavours-thumb/g).length, 4);
  assert.match(section, /Brightside · Sweet &amp; Strong/);
  assert.match(section, /Cocktail menu/);
  assert.match(section, /data-flavours-price/);
  assert.match(section, /data-flavours-qty-input/);
  assert.match(section, /data-unit-naira="8000"/);
  assert.match(section, /₦7,500\.00/);
  assert.match(section, /₦8,000\.00/);
  assert.match(section, /class="flavours-menu-table"/);
  assert.match(section, /data-flavours-add/);
  assert.match(html, /data-order-float/);
  assert.match(html, /data-order-sheet/);
  assert.match(section, /class="flavours-menu-row"[^>]*data-flavour-id="long-island"/);
  assert.match(section, /data-price="₦8,000\.00"/);
  assert.match(section, /data-price="₦7,500\.00"/);
  assert.match(section, /Drink me within 48hrs/);
  assert.match(section, /Produced by:<br>Brightside\.corp/);
  assert.match(section, /Tequila, Mango Juice, Fresh Lime Juice/);
  assert.match(section, /Rum, Gin, Vodka, Tequila, Simple Syrup &amp; Cola/);
  assert.match(section, /Vodka, Cranberry Extract &amp; Simple Syrup/);
  assert.match(section, /Vanilla Flavoured Vodka, Passion Fruit &amp; Simple Syrup/);
  assert.match(section, /sending that text but it doesn't matter cause, you're having a good time/);
  assert.doesNotMatch(section, /class="character character-sweet"/);
  assert.doesNotMatch(section, /assets\/brightside-can\.png/);
});

test("when the flavour carousel is styled, then each pour gets its own accent and layout", () => {
  assert.match(css, /\.flavours-show\s*\{[^}]*--flavour-accent:\s*#e36b24/s);
  assert.match(css, /\[data-active-flavour="long-island"\]/);
  assert.match(css, /\[data-active-flavour="brightside-special"\]/);
  assert.match(css, /\[data-active-flavour="pornstar-martini"\]/);
  assert.match(css, /\.flavours-shell\s*\{[^}]*display:\s*grid/s);
  assert.match(css, /@media \(min-width:\s*960px\)[\s\S]*\.flavours-shell\s*\{[^}]*grid-template-columns/s);
  assert.match(css, /\.flavours-slide\.is-active/);
  assert.match(css, /\.flavours-lightbox-image/);
  assert.match(css, /\.flavours-zoom[\s\S]*cursor:\s*zoom-in/s);
  assert.match(css, /@keyframes flavours-can-in/);
  assert.match(css, /\.characters-intro h2\s*\{[^}]*text-transform:\s*uppercase/s);
});

test("when the flavour slideshow loads, then autoplay and controls work like the gallery", () => {
  const section = canSection();
  assert.match(section, /data-flavours-previous aria-label="Previous flavour"/);
  assert.match(section, /data-flavours-next aria-label="Next flavour"/);
  assert.doesNotMatch(section, /data-flavours-play/);
  assert.match(section, /data-flavours-progress/);
  assert.match(section, /data-flavours-zoom/);
  assert.match(section, /data-flavours-lightbox/);
  assert.match(section, /data-flavours-lightbox-close/);
  assert.match(section, /aria-live="polite"/);
  assert.match(main, /function bindFlavours\(\)/);
  assert.match(main, /showFlavour\(activeIndex \+ 1\)/);
  assert.match(main, /setInterval\([\s\S]*?6500\)/);
  assert.match(main, /showFlavour\(activeIndex\);\s*start\(\);/);
  assert.doesNotMatch(main, /data-flavours-play/);
  assert.match(main, /carousel\.addEventListener\("keydown"/);
  assert.match(main, /touchstart/);
  assert.match(main, /bindFlavours\(\)/);
  assert.match(main, /reduceMotion\.matches/);
  assert.match(main, /openLightbox/);
  assert.match(main, /lightbox\.showModal/);
  assert.match(main, /unitPriceNaira/);
  assert.match(main, /data-flavours-menu-row/);
  assert.match(main, /showFlavourById/);
  assert.match(main, /Add \$\{quantity\} to order/);
  assert.match(main, /bindWhatsAppHandoff/);
  assert.match(main, /buildWhatsAppOrderUrl/);
  assert.match(main, /syncOrder/);
  assert.match(main, /setQuantity/);
  assert.match(main, /createFlavourCart/);
  assert.match(main, /addCurrentToCart/);
  assert.match(section, /data-flavours-in-cart/);
  assert.match(html, /data-order-checkout/);
  assert.match(main, /buildWhatsAppCartUrl/);
  assert.match(main, /BRIGHTSIDE_CART_KEY/);
});



