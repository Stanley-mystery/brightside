import assert from "node:assert/strict";
import test from "node:test";
import {
  BRIGHTSIDE_WHATSAPP_NUMBER,
  buildWhatsAppOrderUrl,
  clampFlavourQuantity,
  flavourLineTotal,
  formatNaira,
  WHATSAPP_CONFIRM_COPY,
} from "../js/logic.js";

test("when amounts are formatted, then naira uses grouped decimals", () => {
  assert.equal(formatNaira(8000), "₦8,000.00");
  assert.equal(formatNaira(7500), "₦7,500.00");
  assert.equal(formatNaira(16000), "₦16,000.00");
});

test("when quantity changes, then the line total multiplies unit price", () => {
  assert.equal(flavourLineTotal(8000, 1), 8000);
  assert.equal(flavourLineTotal(7500, 3), 22500);
  assert.equal(clampFlavourQuantity(0), 1);
  assert.equal(clampFlavourQuantity(120), 99);
});

test("when a cocktail is selected, then the WhatsApp link includes product and price", () => {
  const url = buildWhatsAppOrderUrl({
    productName: "Mango Margarita",
    unitPriceNaira: 8000,
    quantity: 2,
  });
  assert.match(url, new RegExp(`^https://wa\\.me/${BRIGHTSIDE_WHATSAPP_NUMBER}\\?text=`));
  const text = decodeURIComponent(url.split("?text=")[1]);
  assert.match(text, /Product: Mango Margarita/);
  assert.match(text, /Unit price: ₦8,000\.00/);
  assert.match(text, /Quantity: 2/);
  assert.match(text, /Subtotal: ₦16,000\.00/);
  assert.match(text, /Brightside Sweet & Strong/);
  assert.match(text, /Please confirm availability/);
});

test("when no product is chosen, then the WhatsApp link asks for general availability", () => {
  const url = buildWhatsAppOrderUrl();
  const text = decodeURIComponent(url.split("?text=")[1]);
  assert.match(text, /interested in Brightside canned cocktails/);
  assert.doesNotMatch(text, /Product:/);
});

test("when WhatsApp handoff copy is defined, then it explains the cart redirect before leaving the site", () => {
  assert.match(WHATSAPP_CONFIRM_COPY.title, /WhatsApp/i);
  assert.match(WHATSAPP_CONFIRM_COPY.lead, /cart summary/i);
  assert.match(WHATSAPP_CONFIRM_COPY.lead, /confirm availability/i);
  assert.match(WHATSAPP_CONFIRM_COPY.continueLabel, /WhatsApp/i);
  assert.equal(WHATSAPP_CONFIRM_COPY.cancelLabel, "Keep editing order");
});
