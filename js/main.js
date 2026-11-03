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
  addCartLine,
  BRIGHTSIDE_CART_KEY,
  buildWhatsAppCartUrl,
  buildWhatsAppOrderUrl,
  WHATSAPP_CONFIRM_COPY,
  cartGrandTotal,
  cartItemCount,
  cartQuantityFor,
  clampFlavourQuantity,
  flavourLineTotal,
  formatNaira,
  FLAVOUR_QTY_MAX,
  FLAVOUR_QTY_MIN,
  parseStoredCart,
  setCartLineQuantity,
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

function createFlavourCart(allowedFlavourIds) {
  let cart = parseStoredCart(readStore(localStorage, BRIGHTSIDE_CART_KEY)).filter((line) =>
    allowedFlavourIds.has(line.flavourId)
  );
  if (cart.length) writeStore(localStorage, BRIGHTSIDE_CART_KEY, JSON.stringify(cart));

  const listeners = new Set();
  const emit = () => {
    writeStore(localStorage, BRIGHTSIDE_CART_KEY, JSON.stringify(cart));
    listeners.forEach((listener) => listener(cart));
  };

  return {
    snapshot() {
      return cart.map((line) => ({ ...line }));
    },
    add(line) {
      cart = addCartLine(cart, line);
      emit();
    },
    setQuantity(flavourId, quantity) {
      cart = setCartLineQuantity(cart, flavourId, quantity);
      emit();
    },
    clear() {
      cart = [];
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(cart);
      return () => listeners.delete(listener);
    },
  };
}

function bindOrderCart(cartStore) {
  const float = document.querySelector("[data-order-float]");
  const floatOpen = document.querySelector("[data-order-float-open]");
  const floatCount = document.querySelector("[data-order-float-count]");
  const floatMeta = document.querySelector("[data-order-float-meta]");
  const floatTotal = document.querySelector("[data-order-float-total]");
  const sheet = document.querySelector("[data-order-sheet]");
  const sheetClose = document.querySelector("[data-order-sheet-close]");
  const linesRoot = document.querySelector("[data-order-lines]");
  const empty = document.querySelector("[data-order-empty]");
  const grandTotal = document.querySelector("[data-order-grand-total]");
  const checkout = document.querySelector("[data-order-checkout]");
  const clearButton = document.querySelector("[data-order-clear]");
  if (
    !float ||
    !floatOpen ||
    !floatCount ||
    !floatMeta ||
    !floatTotal ||
    !sheet ||
    !sheetClose ||
    !linesRoot ||
    !empty ||
    !grandTotal ||
    !checkout ||
    !clearButton
  ) {
    return null;
  }

  const openSheet = () => {
    if (typeof sheet.showModal === "function") sheet.showModal();
    floatOpen.setAttribute("aria-expanded", "true");
  };

  const closeSheet = () => {
    if (sheet.open) sheet.close();
    floatOpen.setAttribute("aria-expanded", "false");
  };

  const paint = (cart) => {
    const count = cartItemCount(cart);
    const total = cartGrandTotal(cart);
    const hasItems = count > 0;

    float.hidden = !hasItems;
    float.classList.toggle("is-visible", hasItems);
    floatCount.textContent = String(count);
    floatMeta.textContent = count === 1 ? "1 can" : `${count} cans`;
    floatTotal.textContent = formatNaira(total);

    empty.hidden = hasItems;
    linesRoot.hidden = !hasItems;
    linesRoot.replaceChildren();

    cart.forEach((line) => {
      const item = document.createElement("li");
      item.className = "order-sheet-line";
      item.dataset.flavourId = line.flavourId;

      const head = document.createElement("div");
      head.className = "order-sheet-line-head";
      const name = document.createElement("strong");
      name.textContent = line.productName;
      const sub = document.createElement("span");
      sub.textContent = formatNaira(flavourLineTotal(line.unitPriceNaira, line.quantity));
      head.append(name, sub);

      const controls = document.createElement("div");
      controls.className = "order-sheet-line-qty";
      const decrease = document.createElement("button");
      decrease.type = "button";
      decrease.className = "order-sheet-qty-btn";
      decrease.setAttribute("aria-label", `Decrease ${line.productName}`);
      decrease.textContent = "−";
      const qty = document.createElement("span");
      qty.textContent = String(line.quantity);
      const increase = document.createElement("button");
      increase.type = "button";
      increase.className = "order-sheet-qty-btn";
      increase.setAttribute("aria-label", `Increase ${line.productName}`);
      increase.textContent = "+";
      controls.append(decrease, qty, increase);

      decrease.addEventListener("click", () => {
        cartStore.setQuantity(line.flavourId, line.quantity - 1);
      });
      increase.addEventListener("click", () => {
        cartStore.setQuantity(line.flavourId, line.quantity + 1);
      });

      item.append(head, controls);
      linesRoot.append(item);
    });

    grandTotal.textContent = formatNaira(total);
    checkout.href = buildWhatsAppCartUrl(cart);
    checkout.toggleAttribute("aria-disabled", !hasItems);
    checkout.classList.toggle("is-disabled", !hasItems);
  };

  cartStore.subscribe(paint);

  floatOpen.addEventListener("click", openSheet);
  sheetClose.addEventListener("click", closeSheet);
  sheet.addEventListener("click", (event) => {
    if (event.target === sheet) closeSheet();
  });
  sheet.addEventListener("close", () => floatOpen.setAttribute("aria-expanded", "false"));
  clearButton.addEventListener("click", () => cartStore.clear());

  return { openSheet, closeSheet };
}

function bindFlavours() {
  const carousel = document.querySelector("[data-flavours-carousel]");
  const slides = [...(carousel?.querySelectorAll("[data-flavours-slide]") ?? [])];
  const thumbnails = [...(carousel?.querySelectorAll("[data-flavours-thumb]") ?? [])];
  const detail = carousel?.querySelector("[data-flavours-detail]");
  const title = carousel?.querySelector("[data-flavours-title]");
  const price = carousel?.querySelector("[data-flavours-price]");
  const contains = carousel?.querySelector("[data-flavours-contains]");
  const fact = carousel?.querySelector("[data-flavours-fact]");
  const menuRows = [...(carousel?.querySelectorAll("[data-flavours-menu-row]") ?? [])];
  const addButtons = [...(carousel?.querySelectorAll("[data-flavours-add]") ?? [])];
  const inCartNote = carousel?.querySelector("[data-flavours-in-cart]");
  const priceBreakdown = carousel?.querySelector("[data-flavours-price-breakdown]");
  const qtyInput = carousel?.querySelector("[data-flavours-qty-input]");
  const qtyDecrease = carousel?.querySelector("[data-flavours-qty-decrease]");
  const qtyIncrease = carousel?.querySelector("[data-flavours-qty-increase]");
  const current = carousel?.querySelector("[data-flavours-current]");
  const progress = carousel?.querySelector("[data-flavours-progress]");
  const previous = carousel?.querySelector("[data-flavours-previous]");
  const next = carousel?.querySelector("[data-flavours-next]");
  const lightbox = carousel?.querySelector("[data-flavours-lightbox]");
  const lightboxImage = carousel?.querySelector("[data-flavours-lightbox-image]");
  const lightboxCaption = carousel?.querySelector("[data-flavours-lightbox-caption]");
  const lightboxClose = carousel?.querySelector("[data-flavours-lightbox-close]");
  const zoomButtons = [...(carousel?.querySelectorAll("[data-flavours-zoom]") ?? [])];
  if (
    !carousel ||
    !slides.length ||
    !thumbnails.length ||
    !detail ||
    !title ||
    !price ||
    !contains ||
    !fact ||
    !menuRows.length ||
    !addButtons.length ||
    !inCartNote ||
    !priceBreakdown ||
    !qtyInput ||
    !qtyDecrease ||
    !qtyIncrease ||
    !current ||
    !progress ||
    !previous ||
    !next ||
    !lightbox ||
    !lightboxImage ||
    !lightboxCaption ||
    !lightboxClose ||
    !zoomButtons.length
  ) {
    return;
  }

  const allowedFlavourIds = new Set(slides.map((slide) => slide.dataset.flavourId || "").filter(Boolean));
  const cartStore = createFlavourCart(allowedFlavourIds);
  const orderUi = bindOrderCart(cartStore);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
  let intervalId = 0;
  let lightboxOpen = false;
  let quantity = FLAVOUR_QTY_MIN;

  const paintCartHints = () => {
    const cart = cartStore.snapshot();
    const slide = slides[activeIndex];
    const flavourId = slide.dataset.flavourId || "";
    const inCart = cartQuantityFor(cart, flavourId);
    if (inCart > 0) {
      inCartNote.hidden = false;
      inCartNote.textContent = `${inCart} already in your order`;
    } else {
      inCartNote.hidden = true;
      inCartNote.textContent = "";
    }

    menuRows.forEach((row) => {
      const count = cartQuantityFor(cart, row.dataset.flavourId || "");
      const heading = row.querySelector("th");
      row.classList.toggle("has-cart-qty", count > 0);
      if (count > 0) heading?.setAttribute("data-cart-qty", String(count));
      else heading?.removeAttribute("data-cart-qty");
    });
  };

  const syncOrder = () => {
    const slide = slides[activeIndex];
    const unitNaira = Number(slide.dataset.unitNaira);
    const flavourName = slide.dataset.title || "Brightside";
    quantity = clampFlavourQuantity(quantity);
    qtyInput.value = String(quantity);
    qtyDecrease.disabled = quantity <= FLAVOUR_QTY_MIN;
    qtyIncrease.disabled = quantity >= FLAVOUR_QTY_MAX;

    const totalNaira = flavourLineTotal(unitNaira, quantity);
    price.textContent = formatNaira(totalNaira);
    priceBreakdown.textContent = `${quantity} × ${formatNaira(unitNaira)} each`;

    const addLabel = quantity === 1 ? `Add ${flavourName}` : `Add ${quantity} ${flavourName}`;
    addButtons.forEach((button) => {
      button.textContent = quantity === 1 ? "Add to order" : `Add ${quantity} to order`;
      button.setAttribute("aria-label", `${addLabel} to your order`);
    });
    paintCartHints();
  };

  const addCurrentToCart = () => {
    const slide = slides[activeIndex];
    cartStore.add({
      flavourId: slide.dataset.flavourId || "",
      productName: slide.dataset.title || "Brightside",
      unitPriceNaira: Number(slide.dataset.unitNaira),
      quantity,
    });
    quantity = FLAVOUR_QTY_MIN;
    syncOrder();
    orderUi?.openSheet();
  };

  cartStore.subscribe(() => syncOrder());

  const setQuantity = (next) => {
    quantity = clampFlavourQuantity(next);
    syncOrder();
    detail.classList.remove("is-changing");
    void detail.offsetWidth;
    detail.classList.add("is-changing");
  };

  const showFlavour = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    const slide = slides[activeIndex];
    quantity = FLAVOUR_QTY_MIN;

    slides.forEach((item, itemIndex) => {
      const selected = itemIndex === activeIndex;
      item.classList.toggle("is-active", selected);
      item.classList.toggle("is-entering", selected);
      if (selected) item.removeAttribute("aria-hidden");
      else item.setAttribute("aria-hidden", "true");
    });

    window.setTimeout(() => {
      slide.classList.remove("is-entering");
    }, 700);

    carousel.dataset.activeFlavour = slide.dataset.flavourId || "";
    title.textContent = slide.dataset.title || "";
    contains.textContent = slide.dataset.contains || "";
    fact.textContent = slide.dataset.fact || "";
    const flavourId = slide.dataset.flavourId || "";
    menuRows.forEach((row) => {
      const selected = row.dataset.flavourId === flavourId;
      row.classList.toggle("is-active", selected);
      if (selected) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
    });
    syncOrder();
    current.textContent = String(activeIndex + 1).padStart(2, "0");
    progress.setAttribute("aria-valuenow", String(activeIndex + 1));
    carousel.style.setProperty("--flavours-progress", `${((activeIndex + 1) / slides.length) * 100}%`);

    thumbnails.forEach((thumb, thumbIndex) => {
      const selected = thumbIndex === activeIndex;
      thumb.classList.toggle("is-active", selected);
      thumb.setAttribute("aria-selected", String(selected));
    });

    detail.classList.remove("is-changing");
    void detail.offsetWidth;
    detail.classList.add("is-changing");
  };

  const stop = () => {
    window.clearInterval(intervalId);
    intervalId = 0;
  };

  const start = () => {
    if (reduceMotion.matches || intervalId) return;
    intervalId = window.setInterval(() => {
      if (!document.hidden) showFlavour(activeIndex + 1);
    }, 6500);
  };

  const showFlavourById = (flavourId) => {
    const index = slides.findIndex((item) => item.dataset.flavourId === flavourId);
    if (index >= 0) showFlavour(index);
  };

  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", () => showFlavour(index));
  });
  qtyDecrease.addEventListener("click", () => setQuantity(quantity - 1));
  qtyIncrease.addEventListener("click", () => setQuantity(quantity + 1));
  qtyInput.addEventListener("change", () => setQuantity(Number(qtyInput.value)));
  qtyInput.addEventListener("blur", () => setQuantity(Number(qtyInput.value)));
  addButtons.forEach((button) => button.addEventListener("click", addCurrentToCart));

  menuRows.forEach((row) => {
    const selectRow = () => showFlavourById(row.dataset.flavourId || "");
    row.addEventListener("click", selectRow);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectRow();
      }
    });
  });
  previous.addEventListener("click", () => showFlavour(activeIndex - 1));
  next.addEventListener("click", () => showFlavour(activeIndex + 1));

  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) stop();
    else start();
  });

  carousel.addEventListener("keydown", (event) => {
    if (event.target.closest("[data-flavours-thumb]")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showFlavour(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showFlavour(activeIndex + 1);
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
    showFlavour(activeIndex + (delta < 0 ? 1 : -1));
  }, { passive: true });

  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("mouseleave", () => {
    if (!reduceMotion.matches) start();
  });
  carousel.addEventListener("focusout", (event) => {
    if (carousel.contains(event.relatedTarget)) return;
    if (!lightboxOpen && !reduceMotion.matches) start();
  });

  const openLightbox = (slide) => {
    const image = slide.querySelector("img");
    if (!image) return;
    const label = slide.dataset.title || "Brightside cocktail";
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = `Brightside ${label} canned cocktail label.`;
    lightboxCaption.textContent = label;
    lightboxOpen = true;
    stop();
    if (typeof lightbox.showModal === "function") lightbox.showModal();
  };

  const resumeAfterLightbox = () => {
    if (!reduceMotion.matches && !carousel.matches(":hover") && !carousel.contains(document.activeElement)) {
      start();
    }
  };

  const closeLightbox = () => {
    if (!lightbox.open) return;
    lightbox.close();
  };

  zoomButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const slide = button.closest("[data-flavours-slide]");
      if (!slide?.classList.contains("is-active")) return;
      openLightbox(slide);
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox.addEventListener("close", () => {
    lightboxOpen = false;
    lightboxImage.removeAttribute("src");
    resumeAfterLightbox();
  });
  lightbox.addEventListener("cancel", () => {
    lightboxOpen = false;
  });

  showFlavour(activeIndex);
  start();
}

function bindBuyWhatsApp() {
  const link = document.querySelector("[data-buy-whatsapp]");
  if (!link) return;
  link.href = buildWhatsAppOrderUrl();
  link.target = "_blank";
  link.rel = "noopener noreferrer";
}

function bindWhatsAppHandoff() {
  const dialog = document.querySelector("[data-whatsapp-confirm]");
  const title = document.querySelector("#whatsapp-confirm-title");
  const lead = document.querySelector("[data-whatsapp-confirm-lead]");
  const goButtons = [...document.querySelectorAll("[data-whatsapp-confirm-go]")];
  const cancelButtons = [...document.querySelectorAll("[data-whatsapp-confirm-cancel]")];
  if (!dialog || !title || !lead || !goButtons.length || !cancelButtons.length) return;

  title.textContent = WHATSAPP_CONFIRM_COPY.title;
  lead.textContent = WHATSAPP_CONFIRM_COPY.lead;
  goButtons.forEach((button) => {
    button.textContent = WHATSAPP_CONFIRM_COPY.continueLabel;
  });
  cancelButtons.forEach((button) => {
    if (button.classList.contains("whatsapp-confirm-stay")) {
      button.textContent = WHATSAPP_CONFIRM_COPY.cancelLabel;
    }
  });

  let pendingUrl = "";

  const closeConfirm = () => {
    if (dialog.open) dialog.close();
    pendingUrl = "";
  };

  const openConfirm = (url) => {
    if (!url) return;
    pendingUrl = url;
    if (typeof dialog.showModal === "function") dialog.showModal();
  };

  goButtons[0].addEventListener("click", () => {
    const url = pendingUrl;
    closeConfirm();
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });

  cancelButtons.forEach((button) => {
    button.addEventListener("click", closeConfirm);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeConfirm();
  });
  dialog.addEventListener("close", () => {
    pendingUrl = "";
  });

  const guardWhatsAppNavigation = (element, getUrl) => {
    element.addEventListener("click", (event) => {
      const url = getUrl(element);
      if (!url) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      openConfirm(url);
    });
  };

  const checkout = document.querySelector("[data-order-checkout]");
  if (checkout) {
    guardWhatsAppNavigation(checkout, (element) => {
      if (element.classList.contains("is-disabled") || element.getAttribute("aria-disabled") === "true") {
        return "";
      }
      return element.href;
    });
  }
}

function bindGallery() {
  const carousel = document.querySelector("[data-gallery-carousel]");
  const items = [...(carousel?.querySelectorAll("[data-gallery-item]") ?? [])];
  const slide = carousel?.querySelector("[data-gallery-slide]");
  const image = carousel?.querySelector("[data-gallery-image]");
  const caption = carousel?.querySelector("[data-gallery-caption]");
  const counter = carousel?.querySelector("[data-gallery-counter]");
  const current = carousel?.querySelector("[data-gallery-current]");
  const progress = carousel?.querySelector("[data-gallery-progress]");
  const playButton = carousel?.querySelector("[data-gallery-play]");
  const previous = carousel?.querySelector("[data-gallery-previous]");
  const next = carousel?.querySelector("[data-gallery-next]");
  if (!carousel || !slide || !image || !caption || !counter || !current || !progress || !playButton || !previous || !next || !items.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = Math.max(0, items.findIndex((item) => item.classList.contains("is-active")));
  let intervalId = 0;

  const showPhoto = (index) => {
    activeIndex = (index + items.length) % items.length;
    const item = items[activeIndex];
    const source = item.dataset.src;
    if (!source) return;
    image.classList.remove("is-changing");
    void image.offsetWidth;
    image.src = source;
    image.alt = item.dataset.alt ?? "";
    slide.setAttribute("aria-label", `${activeIndex + 1} of ${items.length}`);
    caption.textContent = item.dataset.caption ?? "";
    current.textContent = String(activeIndex + 1).padStart(2, "0");
    progress.setAttribute("aria-valuenow", String(activeIndex + 1));
    progress.style.setProperty("--gallery-progress", `${((activeIndex + 1) / items.length) * 100}%`);
    items.forEach((dot, itemIndex) => {
      const selected = itemIndex === activeIndex;
      dot.classList.toggle("is-active", selected);
      if (selected) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
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

  items.forEach((item, index) => {
    item.addEventListener("click", () => showPhoto(index));
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
}

if (page) {
  bindMenu();
  bindScrollNav();
  bindHeroSlideshow();
  bindBackToTop();
  bindServes();
  bindForm();
  bindFlavours();
  bindBuyWhatsApp();
  bindWhatsAppHandoff();
  bindGallery();
  bindReel();
  bindBegan();
  bindReveal();
}
