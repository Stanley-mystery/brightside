import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  FORM_MESSAGES,
  isValidEmail,
  serveFor,
  subscriptionState,
} from "../js/logic.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("when the page is first visited, then the age prompt is not shown", () => {
  assert.doesNotMatch(html, /Are you 21 or over\?/);
  assert.doesNotMatch(html, /id="gate"/);
  assert.doesNotMatch(html, /setAttribute\("inert"/);
  assert.match(html, /<html lang="en" class="is-allowed">/);
});

test("when the email is a normal address, then it is accepted", () => {
  assert.equal(isValidEmail("hello@brightside.co"), true);
  assert.equal(isValidEmail("  Hello@Brightside.co  "), true);
});

test("when the email is blank, unfinished, or not a string, then it is rejected", () => {
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail("   "), false);
  assert.equal(isValidEmail("hello"), false);
  assert.equal(isValidEmail("hello@"), false);
  assert.equal(isValidEmail("hello@brightside"), false);
  assert.equal(isValidEmail("hello@brightside.c"), false);
  assert.equal(isValidEmail("hello@bright..side.co"), false);
  assert.equal(isValidEmail(null), false);
  assert.equal(isValidEmail(12), false);
});

test("when a known pour is chosen, then that serve copy is returned", () => {
  assert.equal(serveFor("ice").title, "Over ice");
  assert.equal(serveFor("table").kicker, "The carrier");
  assert.equal(serveFor("can").title, "From the can");
  assert.match(serveFor("can").text, /Cold, upright/);
});

test("when the pour is unknown, then the can serve is used", () => {
  assert.deepEqual(serveFor("mystery"), serveFor("can"));
  assert.deepEqual(serveFor(undefined), serveFor("can"));
});

test("when the list form is empty, then the empty reason is returned", () => {
  assert.deepEqual(subscriptionState("   "), { ok: false, reason: "empty" });
  assert.equal(FORM_MESSAGES.empty.length > 0, true);
});

test("when the list form has a broken email, then the invalid reason is returned", () => {
  const result = subscriptionState("not-an-email");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "invalid");
  assert.equal(typeof FORM_MESSAGES.invalid, "string");
});

test("when the list form has a real email, then it is trimmed and saved", () => {
  assert.deepEqual(subscriptionState("  you@brightside.co "), {
    ok: true,
    email: "you@brightside.co",
    reason: "saved",
  });
  assert.match(FORM_MESSAGES.saved, /Saved on this device/);
});
