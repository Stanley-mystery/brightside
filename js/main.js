import {
  FORM_MESSAGES,
  ageDecision,
  isValidEmail,
  serveFor,
  subscriptionState,
} from "./logic.js";

const AGE_KEY = "brightside-age";
const EMAIL_KEY = "brightside-list-email";

const page = document.getElementById("page");
const gate = document.getElementById("gate");
const nav = document.getElementById("nav");
const links = document.getElementById("links");
const menuButton = document.getElementById("menu-button");
const form = document.getElementById("list-form");
const emailInput = document.getElementById("email");
const formError = document.getElementById("form-error");
const formSuccess = document.getElementById("form-success");
const resetEmail = document.getElementById("reset-email");
const servePanel = document.getElementById("serve-panel");
const serveButtons = document.querySelectorAll("[data-serve]");

function readStore(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStore(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // Storage can be blocked. The screen still updates.
  }
}

function openSite() {
  writeStore(sessionStorage, AGE_KEY, "ok");
  document.documentElement.classList.remove("is-refused");
  document.documentElement.classList.add("is-allowed");
  page.removeAttribute("inert");
  document.getElementById("main").focus();
}

function refuseSite() {
  writeStore(sessionStorage, AGE_KEY, "no");
  document.documentElement.classList.add("is-refused");
  document.getElementById("gate-back").focus();
}

function closeMenu() {
  nav.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
  menuButton.textContent = "Menu";
  document.body.classList.remove("nav-lock");
}

function openMenu() {
  nav.classList.add("is-open");
  menuButton.setAttribute("aria-expanded", "true");
  menuButton.setAttribute("aria-label", "Close menu");
  menuButton.textContent = "Close";
  document.body.classList.add("nav-lock");
}

function renderServe(id) {
  const known = serveButtons.length && [...serveButtons].some((button) => button.dataset.serve === id)
    ? id
    : "can";
  const serve = serveFor(known);
  servePanel.querySelector("[data-serve-kicker]").textContent = serve.kicker;
  servePanel.querySelector("[data-serve-title]").textContent = serve.title;
  servePanel.querySelector("[data-serve-text]").textContent = serve.text;
  serveButtons.forEach((button) => {
    const isActive = button.dataset.serve === known;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function showFormError(reason) {
  formError.hidden = false;
  formError.textContent = FORM_MESSAGES[reason] ?? FORM_MESSAGES.invalid;
  formSuccess.hidden = true;
  form.hidden = false;
  emailInput.setAttribute("aria-invalid", "true");
}

function showFormSuccess(savedOnDevice) {
  formError.hidden = true;
  form.hidden = true;
  formSuccess.hidden = false;
  formSuccess.querySelector("[data-success-copy]").textContent = savedOnDevice
    ? FORM_MESSAGES.saved
    : "You're in for this visit. This browser wouldn't store the email.";
  emailInput.setAttribute("aria-invalid", "false");
}

function bindAgeGate() {
  document.getElementById("gate-yes").addEventListener("click", () => {
    if (ageDecision(true) === "enter") openSite();
  });
  document.getElementById("gate-no").addEventListener("click", () => {
    if (ageDecision(false) === "refuse") refuseSite();
  });
  document.getElementById("gate-back").addEventListener("click", () => {
    if (ageDecision(true) === "enter") openSite();
  });

  if (document.documentElement.classList.contains("is-allowed")) {
    page.removeAttribute("inert");
    return;
  }
  const focusTarget = document.documentElement.classList.contains("is-refused")
    ? document.getElementById("gate-back")
    : document.getElementById("gate-yes");
  focusTarget.focus({ preventScroll: true });
}

function bindMenu() {
  menuButton.addEventListener("click", () => {
    if (nav.classList.contains("is-open")) closeMenu();
    else openMenu();
  });

  links.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 960) closeMenu();
  });
}

function bindServes() {
  serveButtons.forEach((button) => {
    button.addEventListener("click", () => renderServe(button.dataset.serve));
  });
  renderServe("can");
}

function bindForm() {
  const stored = readStore(localStorage, EMAIL_KEY);
  if (isValidEmail(stored)) showFormSuccess(true);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = subscriptionState(emailInput.value);
    if (!result.ok) {
      showFormError(result.reason);
      emailInput.focus();
      return;
    }
    const saved = writeStore(localStorage, EMAIL_KEY, result.email);
    showFormSuccess(saved);
  });

  resetEmail.addEventListener("click", () => {
    removeStore(localStorage, EMAIL_KEY);
    emailInput.value = "";
    form.hidden = false;
    formSuccess.hidden = true;
    formError.hidden = true;
    emailInput.focus();
  });
}

function bindReveal() {
  const nodes = document.querySelectorAll("[data-reveal]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );
  nodes.forEach((node) => observer.observe(node));
}

if (gate && page) {
  bindAgeGate();
  bindMenu();
  bindServes();
  bindForm();
  bindReveal();
}
