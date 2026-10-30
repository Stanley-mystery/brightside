import {
  BEGAN_HERO_TOP,
  FORM_MESSAGES,
  beganCardPose,
  beganFrame,
  beganMobilePlacement,
  beganPoseForViewport,
  beganStride,
  isValidEmail,
  reelAudioState,
  reelIntroPlan,
  reelPlaybackState,
  reelScrollCue,
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
  document.body.classList.remove("nav-lock");
}

function openMenu() {
  nav.classList.add("is-open");
  menuButton.setAttribute("aria-expanded", "true");
  menuButton.setAttribute("aria-label", "Close menu");
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

function bindScrollNav() {
  const hero = document.getElementById("top");
  if (!hero) return;

  const updatePosition = () => {
    const fixed = window.innerWidth < 960 && hero.getBoundingClientRect().bottom <= 0;
    nav.classList.toggle("is-scrolled", fixed);
    document.body.classList.toggle("nav-fixed", fixed);
  };

  updatePosition();
  window.addEventListener("scroll", updatePosition, { passive: true });
  window.addEventListener("resize", updatePosition);
}

function bindHeroSlideshow() {
  const slides = [...document.querySelectorAll("[data-hero-slide]")];
  if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
  if (activeIndex < 0) activeIndex = 0;

  window.setInterval(() => {
    if (document.hidden) return;
    slides[activeIndex].classList.remove("is-active");
    slides[activeIndex].setAttribute("aria-hidden", "true");
    activeIndex = (activeIndex + 1) % slides.length;
    slides[activeIndex].classList.add("is-active");
    slides[activeIndex].removeAttribute("aria-hidden");
  }, 6000);
}

function bindBackToTop() {
  const backToTop = document.getElementById("back-to-top");
  if (!backToTop) return;

  const updateVisibility = () => {
    const visible = window.scrollY > 500;
    backToTop.classList.toggle("is-visible", visible);
    backToTop.setAttribute("aria-hidden", String(!visible));
    backToTop.tabIndex = visible ? 0 : -1;
  };

  updateVisibility();
  window.addEventListener("scroll", updateVisibility, { passive: true });
}

function bindServes() {
  if (!servePanel || serveButtons.length === 0) return;

  serveButtons.forEach((button) => {
    button.addEventListener("click", () => renderServe(button.dataset.serve));
  });
  renderServe("can");
}

function bindForm() {
  if (!form || !emailInput || !formError || !formSuccess || !resetEmail) return;

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

function bindGallery() {
  const carousel = document.querySelector("[data-gallery-carousel]");
  const thumbnails = [...(carousel?.querySelectorAll("[data-gallery-thumb]") ?? [])];
  const slide = carousel?.querySelector("[data-gallery-slide]");
  const image = carousel?.querySelector("[data-gallery-image]");
  const caption = carousel?.querySelector("[data-gallery-caption]");
  const counter = carousel?.querySelector("[data-gallery-counter]");
  const current = carousel?.querySelector("[data-gallery-current]");
  const progress = carousel?.querySelector("[data-gallery-progress]");
  const playButton = carousel?.querySelector("[data-gallery-play]");
  const previous = carousel?.querySelector("[data-gallery-previous]");
  const next = carousel?.querySelector("[data-gallery-next]");
  if (!carousel || !slide || !image || !caption || !counter || !current || !progress || !playButton || !previous || !next || !thumbnails.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = Math.max(0, thumbnails.findIndex((thumbnail) => thumbnail.classList.contains("is-active")));
  let intervalId = 0;

  const showPhoto = (index) => {
    activeIndex = (index + thumbnails.length) % thumbnails.length;
    const thumbnail = thumbnails[activeIndex];
    const source = thumbnail.querySelector("img");
    if (!source) return;
    image.classList.remove("is-changing");
    void image.offsetWidth;
    image.src = source.currentSrc || source.src;
    image.alt = thumbnail.dataset.galleryAlt;
    slide.setAttribute("aria-label", `${activeIndex + 1} of ${thumbnails.length}`);
    caption.textContent = thumbnail.dataset.galleryCaption;
    current.textContent = String(activeIndex + 1).padStart(2, "0");
    progress.setAttribute("aria-valuenow", String(activeIndex + 1));
    progress.style.setProperty("--gallery-progress", `${((activeIndex + 1) / thumbnails.length) * 100}%`);
    thumbnails.forEach((item, itemIndex) => {
      const selected = itemIndex === activeIndex;
      item.classList.toggle("is-active", selected);
      if (selected) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    });
    image.classList.add("is-changing");
  };

  const stop = () => {
    window.clearInterval(intervalId);
    intervalId = 0;
    playButton.setAttribute("aria-pressed", "false");
    playButton.setAttribute("aria-label", "Play slideshow");
    playButton.textContent = "Play";
  };

  const start = () => {
    if (reduceMotion.matches || intervalId) return;
    playButton.setAttribute("aria-pressed", "true");
    playButton.setAttribute("aria-label", "Pause slideshow");
    playButton.textContent = "Pause";
    intervalId = window.setInterval(() => {
      if (!document.hidden) showPhoto(activeIndex + 1);
    }, 5000);
  };

  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", () => showPhoto(index));
  });
  previous.addEventListener("click", () => showPhoto(activeIndex - 1));
  next.addEventListener("click", () => showPhoto(activeIndex + 1));
  playButton.disabled = reduceMotion.matches;
  if (reduceMotion.matches) {
    playButton.setAttribute("aria-label", "Slideshow disabled by reduced-motion preference");
    playButton.title = "Slideshow disabled by reduced-motion preference";
  }
  playButton.addEventListener("click", () => {
    if (intervalId) stop();
    else start();
  });
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      stop();
      playButton.disabled = true;
      playButton.setAttribute("aria-label", "Slideshow disabled by reduced-motion preference");
      playButton.title = "Slideshow disabled by reduced-motion preference";
    } else {
      playButton.disabled = false;
      playButton.setAttribute("aria-label", "Play slideshow");
      playButton.removeAttribute("title");
    }
  });
  carousel.addEventListener("keydown", (event) => {
    if (event.target.closest("[data-gallery-thumb]")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPhoto(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showPhoto(activeIndex + 1);
    }
  });

  let touchStartX = null;
  carousel.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0]?.clientX ?? null;
  }, { passive: true });
  carousel.addEventListener("touchend", (event) => {
    const touchEndX = event.changedTouches[0]?.clientX;
    if (touchStartX === null || touchEndX === undefined) return;
    const delta = touchEndX - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) < 48) return;
    showPhoto(activeIndex + (delta < 0 ? 1 : -1));
  }, { passive: true });

  showPhoto(activeIndex);
  start();
}

function bindReel() {
  const video = document.getElementById("reel-video");
  const control = document.getElementById("reel-control");
  const stage = document.getElementById("reel");
  if (!video || !control || !stage) return;

  const label = control.querySelector(".reel-control-label");
  const device = video.closest(".phone");
  const hand = stage.querySelector(".reel-hand");
  const watched = stage.querySelector(".reel-stage") ?? stage;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intro = reelIntroPlan(reduce);
  let tapTimer = 0;
  let hasEntered = false;

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

  const enableSound = () => {
    const sound = reelAudioState();
    video.muted = sound.muted;
    video.volume = sound.volume;
  };

  const play = () => {
    enableSound();
    const next = video.play();
    if (next && typeof next.then === "function") {
      next.then(() => paint(true)).catch(() => paint(false));
    } else {
      paint(true);
    }
  };

  const pause = () => {
    video.pause();
    paint(false);
  };

  const hold = () => {
    video.removeAttribute("autoplay");
    video.removeAttribute("muted");
    enableSound();
    pause();
  };

  const showHand = (cue) => {
    if (!hand || !cue.hand) return;
    hand.classList.remove("is-hand-play", "is-hand-pause");
    control.classList.remove("is-tapped");
    void hand.offsetWidth;
    hand.classList.add(cue.hand === "pause" ? "is-hand-pause" : "is-hand-play");
    control.classList.add("is-tapped");
  };

  control.addEventListener("click", () => {
    window.clearTimeout(tapTimer);
    if (video.paused) play();
    else pause();
  });

  hold();
  if (!intro.animate || intro.tapDelayMs === null) return;

  const cueHand = (inView) => {
    const cue = reelScrollCue(inView, reduce);
    window.clearTimeout(tapTimer);
    if (!cue.hand) return;
    if (inView) stage.classList.add("is-in");
    showHand(cue);
    tapTimer = window.setTimeout(() => {
      if (cue.play) play();
      else if (cue.pause) pause();
    }, cue.tapDelayMs);
  };

  const onVisibility = (inView) => {
    if (inView) hasEntered = true;
    else if (!hasEntered) return;
    cueHand(inView);
  };

  if (!("IntersectionObserver" in window)) {
    onVisibility(true);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    onVisibility(entries.some((entry) => entry.isIntersecting));
  }, { threshold: 0.35 });
  observer.observe(watched);
}

function bindBegan() {
  const section = document.getElementById("began");
  const line = section?.querySelector(".began-line");
  const dot = section?.querySelector(".began-dot");
  const track = document.getElementById("began-track");
  const stage = section?.querySelector(".began-stage");
  if (!section || !line || !dot || !track || !stage) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const cards = [...track.children];
  const narrowQuery = window.matchMedia("(max-width: 959px)");
  section.style.setProperty("--began-steps", String(Math.max(cards.length, 1)));

  let frameId = 0;
  const paint = () => {
    frameId = 0;
    const narrow = narrowQuery.matches;
    const rect = section.getBoundingClientRect();
    const frame = beganFrame({
      rectTop: rect.top,
      sectionHeight: rect.height,
      viewportHeight: window.innerHeight,
      lineLength: line.clientHeight,
      dotSize: dot.offsetHeight,
    });
    const stageHeight = stage.clientHeight;
    const placement = narrow
      ? beganMobilePlacement(stageHeight, cards[0]?.offsetHeight || 0)
      : null;
    const stride = placement ? placement.stride : beganStride(stageHeight, false);
    const heroTop = placement ? placement.top : BEGAN_HERO_TOP;
    dot.style.top = `${frame.dot}px`;
    cards.forEach((card, index) => {
      const pose = beganPoseForViewport(
        beganCardPose(frame.progress, index, cards.length, stride),
        narrow
      );
      card.style.top = `${heroTop * 100}%`;
      card.style.zIndex = String(pose.z);
      card.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.rotate}deg)`;
    });
  };

  const request = () => {
    if (frameId !== 0) return;
    frameId = window.requestAnimationFrame(paint);
  };

  cards.forEach((card) => {
    card.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", request, { once: true });
    });
  });
  paint();
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  narrowQuery.addEventListener("change", request);
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
  bindScrollNav();
  bindHeroSlideshow();
  bindBackToTop();
  bindServes();
  bindForm();
  bindGallery();
  bindReel();
  bindBegan();
  bindReveal();
}
