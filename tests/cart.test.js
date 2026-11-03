import assert from "node:assert/strict";
import test from "node:test";
import {
  addCartLine,
  buildWhatsAppCartUrl,
  cartGrandTotal,
  cartItemCount,
  cartQuantityFor,
  parseStoredCart,
  setCartLineQuantity,
} from "../js/logic.js";

test("when lines are added, then quantities merge per flavour and persist as JSON", () => {
  let cart = [];
  cart = addCartLine(cart, {
    flavourId: "mango-margarita",
    productName: "Mango Margarita",
    unitPriceNaira: 8000,
    quantity: 5,
  });
  cart = addCartLine(cart, {
    flavourId: "long-island",
    productName: "Long Island",
    unitPriceNaira: 7500,
    quantity: 2,
  });
  cart = addCartLine(cart, {
    flavourId: "mango-margarita",
    productName: "Mango Margarita",
    unitPriceNaira: 8000,
    quantity: 1,
  });

  assert.equal(cartItemCount(cart), 8);
  assert.equal(cartQuantityFor(cart, "mango-margarita"), 6);
  assert.equal(cartGrandTotal(cart), 8000 * 6 + 7500 * 2);

  const stored = JSON.stringify(cart);
  const restored = parseStoredCart(stored);
  assert.equal(restored.length, 2);
  assert.equal(cartQuantityFor(restored, "long-island"), 2);
});

test("when cart lines change, then WhatsApp lists every item and the order total", () => {
  const cart = [
    { flavourId: "mango-margarita", productName: "Mango Margarita", unitPriceNaira: 8000, quantity: 5 },
    { flavourId: "long-island", productName: "Long Island", unitPriceNaira: 7500, quantity: 2 },
  ];
  const url = buildWhatsAppCartUrl(cart);
  const text = decodeURIComponent(url.split("?text=")[1]);
  assert.match(text, /1\. Mango Margarita/);
  assert.match(text, /5 × ₦8,000\.00 = ₦40,000\.00/);
  assert.match(text, /2\. Long Island/);
  assert.match(text, /Order total: ₦55,000\.00/);
});

test("when quantity is cleared, then the line is removed from the cart", () => {
  let cart = addCartLine([], {
    flavourId: "pornstar-martini",
    productName: "Pornstar Martini",
    unitPriceNaira: 8000,
    quantity: 1,
  });
  cart = setCartLineQuantity(cart, "pornstar-martini", 0);
  assert.equal(cart.length, 0);
});
