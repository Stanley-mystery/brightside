const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
  if (typeof value !== "string") return false;
  const email = value.trim();
  if (email.length < 6 || email.length > 254) return false;
  if (email.includes("..")) return false;
  return EMAIL_PATTERN.test(email);
}

export const SERVES = {
  can: {
    kicker: "Straight up",
    title: "From the can",
    text: "Cold, upright, and already dressed. No glass, no fuss, no waiting on the bar.",
  },
  ice: {
    kicker: "A little ceremony",
    title: "Over ice",
    text: "A short glass, plenty of ice, and a lime wheel if the night is trying to impress someone.",
  },
  table: {
    kicker: "The carrier",
    title: "For the table",
    text: "Open the carrier. Four cans, one handle, and a round that doesn't need a volunteer.",
  },
};

export const FORM_MESSAGES = {
  empty: "Add your email to get on the list.",
  invalid: "That email doesn't look finished yet.",
  saved: "You're in. Saved on this device.",
};

export function serveFor(id) {
  return SERVES[id] ?? SERVES.can;
}

export function nextSceneOffset(current, step, max) {
  if (!Number.isFinite(current) || current < 0) return 0;
  if (!Number.isFinite(step) || step <= 0) return 0;
  if (!Number.isFinite(max) || max <= 0) return 0;
  if (current >= max) return 0;
  const next = current + step;
  return next > max ? 0 : next;
}

export function subscriptionState(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: false, reason: "empty" };
  }
  if (!isValidEmail(value)) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, email: value.trim(), reason: "saved" };
}
