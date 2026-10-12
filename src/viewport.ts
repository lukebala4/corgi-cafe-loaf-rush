// Keeps the café the right size on phones.
// - No accidental page zoom: iPhone Safari ignores "user-scalable=no", so pinches and double-taps
//   are blocked here, and if the page still ends up zoomed it is snapped back to 1x.
// - Re-fits the canvas straight after a rotation, browser-bar change or full screen switch
//   (phones report the final size late, so it re-checks a few times).
// - Full screen where the browser allows it (Android, desktop); iPhone uses Add to Home Screen.
import Phaser from "phaser";

const STRICT = "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isTouch = () => matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
export const isStandalone = () =>
  matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;
export const canFullscreen = () => !!document.fullscreenEnabled && !!document.documentElement.requestFullscreen;
export const isFullscreen = () => !!document.fullscreenElement;

const inOverlay = (t: EventTarget | null) => t instanceof Element && !!t.closest(".cc-ov");
const isField = (t: EventTarget | null) => t instanceof Element && !!t.closest("input, textarea, select, [contenteditable]");

let game: Phaser.Game | undefined;
let timers: number[] = [];

/** Re-measure now and again shortly after (rotation sizes settle late on phones). */
export function refit() {
  if (!game) return;
  timers.forEach((t) => clearTimeout(t));
  timers = [];
  const go = () => {
    if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
    const s = game!.scale;
    if (s.getParentBounds()) s.refresh();
  };
  go();
  for (const ms of [60, 180, 400, 800, 1400]) timers.push(window.setTimeout(go, ms));
}

/** If the page got zoomed anyway, put it back to 1x (re-applying the viewport tag resets iOS zoom). */
function unzoom() {
  const vv = window.visualViewport;
  const meta = document.querySelector('meta[name="viewport"]');
  if (!vv || !meta || Math.abs(vv.scale - 1) < 0.02) return;
  meta.setAttribute("content", STRICT.replace("maximum-scale=1", "maximum-scale=1.0001"));
  requestAnimationFrame(() => {
    meta.setAttribute("content", STRICT);
    refit();
  });
}

/** Page-level guards against accidental zoom. Safe to call before the game exists. */
export function installZoomGuards() {
  document.querySelector('meta[name="viewport"]')?.setAttribute("content", STRICT);
  const opts = { passive: false, capture: true } as AddEventListenerOptions;

  // iPhone pinch-zoom gestures (the game never listens to these)
  for (const ev of ["gesturestart", "gesturechange", "gestureend"]) document.addEventListener(ev, (e) => e.preventDefault(), opts);
  document.addEventListener("dblclick", (e) => e.preventDefault(), opts);
  let vvT = 0;
  window.visualViewport?.addEventListener("resize", () => {
    refit();
    clearTimeout(vvT);
    vvT = window.setTimeout(unzoom, 300);
  });
}

/**
 * Touch guards. Phaser ignores touch events that were already default-prevented, so these are
 * registered on window in the bubble phase only once the game is ready: Phaser's own canvas and
 * window listeners have handled each touch first, then the browser's zoom is cancelled.
 */
function installTouchGuards() {
  const opts = { passive: false } as AddEventListenerOptions;
  // two or more fingers (joystick + PAW) never pinch-zoom the page
  window.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length > 1 && e.cancelable) e.preventDefault();
    },
    opts,
  );
  // a quick second tap (PAW mashing, or a tap on the side bars) never double-tap zooms;
  // the menu and share pop-ups handle this with CSS so their buttons stay instant
  let lastEnd = 0;
  window.addEventListener(
    "touchend",
    (e) => {
      const quick = e.timeStamp - lastEnd < 380;
      lastEnd = e.timeStamp;
      if (quick && e.cancelable && !inOverlay(e.target) && !isField(e.target)) e.preventDefault();
      if (e.touches.length === 0) window.setTimeout(unzoom, 250);
    },
    opts,
  );
}

/** Keep the canvas fitted to the screen after rotations, browser-bar changes and full screen. */
export function attachGame(g: Phaser.Game) {
  game = g;
  g.events.once(Phaser.Core.Events.READY, installTouchGuards);
  window.addEventListener("resize", refit);
  window.addEventListener("orientationchange", refit);
  window.addEventListener("pageshow", refit);
  document.addEventListener("fullscreenchange", refit);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refit();
  });
  refit();
}

/** Full screen on (Android/desktop). Also tries to hold landscape while in full screen. */
export async function enterFullscreen() {
  if (!canFullscreen() || isFullscreen()) return;
  try {
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    await o?.lock?.("landscape").catch(() => undefined);
  } catch {
    /* the browser said no; the windowed game still fits */
  }
}

export async function toggleFullscreen() {
  if (isFullscreen()) await document.exitFullscreen().catch(() => undefined);
  else await enterFullscreen();
}

let autoTried = false;
/** On phones, the first Play tap goes full screen once (if the browser supports it). */
export function autoFullscreen() {
  if (autoTried || !isTouch() || !canFullscreen() || isStandalone()) return;
  autoTried = true;
  void enterFullscreen();
}
