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

export function reelPlaybackState(playing) {
  if (playing === true) {
    return { pressed: true, label: "Pause the reel", visible: "Pause" };
  }
  return { pressed: false, label: "Play the reel", visible: "Play" };
}

export function reelShouldAutoplay(reduceMotion) {
  return reduceMotion !== true;
}

export const REEL_HAND_DELAY_MS = 900;
export const REEL_HAND_DURATION_MS = 1350;
export const REEL_HAND_PRESS_AT = 0.58;

export function reelTapDelayMs(reduceMotion) {
  if (reduceMotion === true) return null;
  const delay = REEL_HAND_DELAY_MS + REEL_HAND_PRESS_AT * REEL_HAND_DURATION_MS;
  if (!Number.isFinite(delay) || delay < 0) return null;
  return Math.round(delay);
}

export function reelIntroPlan(reduceMotion) {
  const tapDelayMs = reelTapDelayMs(reduceMotion);
  if (tapDelayMs === null) {
    return { animate: false, play: false, tapDelayMs: null };
  }
  return { animate: true, play: true, tapDelayMs };
}

export function reelAudioState() {
  return { muted: false, volume: 1 };
}

export function reelScrollCue(inView, reduceMotion) {
  if (reduceMotion === true) {
    return { hand: null, play: false, pause: false, tapDelayMs: null };
  }
  const tapDelayMs = reelTapDelayMs(false);
  if (tapDelayMs === null) {
    return { hand: null, play: false, pause: false, tapDelayMs: null };
  }
  if (inView === true) {
    return { hand: "play", play: true, pause: false, tapDelayMs };
  }
  return { hand: "pause", play: false, pause: true, tapDelayMs };
}

export const BEGAN_DOT_START = 0.22;
export const BEGAN_HERO_TOP = 0.16;
export const BEGAN_CARD_STRIDE = 0.68;
export const BEGAN_CARD_TILT = 8;
export const BEGAN_CARD_NUDGE = 42;
export const BEGAN_STACK = [
  { rotate: 0, x: 0, y: 0 },
  { rotate: 3.5, x: 14, y: 6 },
  { rotate: -3, x: -12, y: 3 },
  { rotate: 2, x: 8, y: 8 },
];

function unitInterval(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function positiveLength(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value;
}

export function beganTravel(sectionHeight, viewportHeight) {
  const section = positiveLength(sectionHeight);
  const viewport = positiveLength(viewportHeight);
  if (section === 0 || viewport === 0) return 0;
  return Math.max(0, section - viewport);
}

export function beganProgress(scrolled, travel) {
  const distance = positiveLength(travel);
  if (distance === 0 || !Number.isFinite(scrolled)) return 0;
  return unitInterval(scrolled / distance);
}

export function beganDotShift(progress, lineLength, dotSize, startRatio = BEGAN_DOT_START) {
  const length = positiveLength(lineLength);
  if (length === 0) return 0;
  const size = positiveLength(dotSize);
  const start = length * unitInterval(startRatio);
  const end = Math.max(start, length - size);
  return start + (end - start) * unitInterval(progress);
}

export const BEGAN_MOBILE_STRIDE = 0.875;
export const BEGAN_MOBILE_NUDGE = 0.25;
export const BEGAN_MOBILE_TILT = 0.5;
const BEGAN_MOBILE_STACK_NUDGE = 0.5;
const BEGAN_WAITING_Y = 24;

export function beganStride(stageHeight, narrow) {
  const ratio = narrow === true ? BEGAN_MOBILE_STRIDE : BEGAN_CARD_STRIDE;
  return positiveLength(stageHeight) * ratio;
}

export function beganPoseForViewport(pose, narrow) {
  if (!pose || typeof pose !== "object") {
    return { y: 0, rotate: 0, x: 0, z: 0 };
  }
  const y = Number.isFinite(pose.y) ? pose.y : 0;
  const rotate = Number.isFinite(pose.rotate) ? pose.rotate : 0;
  const x = Number.isFinite(pose.x) ? pose.x : 0;
  const z = Number.isFinite(pose.z) ? pose.z : 0;
  if (narrow !== true) return { y, rotate, x, z };
  const waiting = y > BEGAN_WAITING_Y;
  return {
    y,
    rotate: waiting ? rotate * BEGAN_MOBILE_TILT : rotate,
    x: x * (waiting ? BEGAN_MOBILE_NUDGE : BEGAN_MOBILE_STACK_NUDGE),
    z,
  };
}

function stackRest(index) {
  const slot = index % BEGAN_STACK.length;
  return BEGAN_STACK[slot];
}

export function beganCardPose(progress, index, count, stride) {
  const cards = Number.isFinite(count) ? Math.floor(count) : 0;
  const step = positiveLength(stride);
  const place = Number.isFinite(index) ? Math.floor(index) : -1;
  if (cards < 1 || place < 0 || place >= cards) {
    return { y: 0, rotate: 0, x: 0, z: 0 };
  }
  const steps = cards > 1 ? cards - 1 : 0;
  const delta = place - unitInterval(progress) * steps;
  const rest = stackRest(place);
  if (delta <= 0) {
    return { y: rest.y, rotate: rest.rotate, x: rest.x, z: place };
  }
  if (delta >= 1) {
    return { y: delta * step, rotate: BEGAN_CARD_TILT, x: BEGAN_CARD_NUDGE, z: place };
  }
  return {
    y: rest.y + (step - rest.y) * delta,
    rotate: rest.rotate + (BEGAN_CARD_TILT - rest.rotate) * delta,
    x: rest.x + (BEGAN_CARD_NUDGE - rest.x) * delta,
    z: place,
  };
}

export function beganFrame(input) {
  const source = input && typeof input === "object" ? input : {};
  const rectTop = Number.isFinite(source.rectTop) ? source.rectTop : 0;
  const travel = beganTravel(source.sectionHeight, source.viewportHeight);
  const progress = beganProgress(-rectTop, travel);
  return {
    progress,
    dot: beganDotShift(progress, source.lineLength, source.dotSize),
  };
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
