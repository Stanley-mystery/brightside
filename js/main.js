import {
  FORM_MESSAGES,
  isValidEmail,
  nextSceneOffset,
  reelIntroPlan,
  reelPlaybackState,
  serveFor,
  subscriptionState,
} from "./logic.js";

const EMAIL_KEY = "brightside-list-email";

const page = document.getElementById("page");
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

function bindScenes() {
  const track = document.getElementById("scenes-track");
  const next = document.querySelector(".scenes-next");
  if (!track || !next) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  next.addEventListener("click", () => {
    const frame = track.querySelector(".scene");
    if (!frame) return;
    const styles = getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const step = frame.getBoundingClientRect().width + gap;
    const max = track.scrollWidth - track.clientWidth;
    const left = nextSceneOffset(track.scrollLeft, step, max);
    track.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  });
}

function bindReel() {
  const video = document.getElementById("reel-video");
  const control = document.getElementById("reel-control");
  const stage = document.getElementById("reel");
  if (!video || !control || !stage) return;

  const label = control.querySelector(".reel-control-label");
  const device = video.closest(".phone");
  const watched = stage.querySelector(".reel-stage") ?? stage;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intro = reelIntroPlan(reduce);
  let visitorTookOver = false;

  const syncDuration = () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    device?.style.setProperty("--reel-duration", `${video.duration}s`);
  };
  video.addEventListener("loadedmetadata", syncDuration);
  syncDuration();

  const paint = (playing) => {
    const state = reelPlaybackState(playing);
    control.setAttribute("aria-pressed", String(state.pressed));
    control.setAttribute("aria-label", state.label);
    if (label) label.textContent = state.visible;
    device?.classList.toggle("is-paused", !playing);
  };

  const play = () => {
    const next = video.play();
    if (next && typeof next.then === "function") {
      next.then(() => paint(true)).catch(() => paint(false));
    } else {
      paint(true);
    }
  };

  const hold = () => {
    video.removeAttribute("autoplay");
    video.pause();
    paint(false);
  };

  control.addEventListener("click", () => {
    visitorTookOver = true;
    if (video.paused) {
      play();
      return;
    }
    video.pause();
    paint(false);
  });

  hold();
  if (!intro.animate || intro.tapDelayMs === null) return;

  const begin = () => {
    stage.classList.add("is-in");
    window.setTimeout(() => {
      if (visitorTookOver || !video.paused) return;
      play();
    }, intro.tapDelayMs);
  };

  if (!("IntersectionObserver" in window)) {
    begin();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    begin();
    observer.disconnect();
  }, { threshold: 0.2 });
  observer.observe(watched);
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

  const cards = document.querySelectorAll(".characters .character");
  if (!cards.length) return;

  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        cardObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.32 }
  );
  cards.forEach((card) => cardObserver.observe(card));
}

if (page) {
  bindMenu();
  bindServes();
  bindForm();
  bindScenes();
  bindReel();
  bindReveal();
}
