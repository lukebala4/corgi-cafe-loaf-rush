import Phaser from "phaser";
import { COLORS as C, DAYS, ITEM_INFO, ItemId, RECIPE_HINTS } from "./config";
import { boil, stickerTex } from "./art/textures";
import { scrap, txt } from "./ui";
import { CorgiRig } from "./game/corgi";
import { LONDON_MENU } from "./data/londonMenu";
import { save } from "./save";

/** The public play link that every share points at (the game itself, not the Manus preview). */
export const PLAY_URL = "https://lukebala4.github.io/corgi-cafe-loaf-rush/";
const CARD_W = 1200;
const CARD_H = 630;

export interface ScoreCard {
  /** Big line on the stats scrap, e.g. "Wednesday done!" */
  headline: string;
  stats: [string, string][];
  stars: number;
  maxStars: number;
  caption: string;
  /** File name for downloads. */
  file: string;
  /** Short text that accompanies the link in native share sheets. */
  shareText: string;
}

// ---------------------------------------------------------------------------
// Scorecard image: drawn with the game's own doodle art into a DynamicTexture
// ---------------------------------------------------------------------------

/** Render the scorecard with the game's own art and return it as a PNG blob. */
export function renderScorecard(scene: Phaser.Scene, card: ScoreCard): Promise<Blob | null> {
  const key = "share_card_rt";
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const dt = scene.textures.addDynamicTexture(key, CARD_W, CARD_H);
  if (!dt) return Promise.resolve(null);
  const box = scene.add.container(0, 0);
  const add = <T extends Phaser.GameObjects.GameObject>(o: T) => (box.add(o), o);

  add(scene.add.image(0, -30, "bg_paper").setOrigin(0).setScale(CARD_W / 1280));
  // brand cue: an orange shopfront strip with the real address
  add(scene.add.rectangle(0, 548, CARD_W, 82, 0xf0702a).setOrigin(0));
  add(scene.add.rectangle(0, 548, CARD_W, 5, 0x2b2622).setOrigin(0));
  add(txt(scene, 36, 589, "Corgi Cafe  ·  74 Great Eastern Street, Shoreditch", 30, "#fffaf0", true).setOrigin(0, 0.5));
  add(txt(scene, CARD_W - 36, 589, PLAY_URL.replace("https://", "").replace(/\/$/, ""), 24, "#fffaf0", false).setOrigin(1, 0.5));

  // wordmark
  add(txt(scene, 300, 92, "Corgi Café", 92, C.caramel, false, { stroke: C.ink, strokeThickness: 4 }));
  const sub = scene.add.container(300, 176).setAngle(-3);
  sub.add(boil(scene, 0, 0, stickerTex(scene, 250, 50, C.orange)));
  sub.add(txt(scene, 0, -2, "LOAF RUSH", 38, "#fffaf0", true, { stroke: C.ink, strokeThickness: 4 }));
  add(sub);

  // the staff: two real-shaped corgis with the week's signature order
  const red = new CorgiRig(scene, 165, 512, 1.45, save.data.apron, "red");
  red.setMood("h");
  const tri = new CorgiRig(scene, 470, 516, 1.3, "staff", "tri");
  tri.setMood("h");
  tri.flip.scaleX = -1;
  // a little orange pass between them with the order up
  add(scene.add.ellipse(318, 520, 130, 16, 0x2b2622, 0.12));
  add(scene.add.rectangle(318, 478, 104, 80, 0xf0702a).setStrokeStyle(4, 0x2b2622));
  add(scene.add.rectangle(318, 434, 120, 14, 0xf5efe4).setStrokeStyle(4, 0x2b2622));
  add(boil(scene, 294, 404, "item_latte").setScale(1.15));
  add(boil(scene, 346, 412, "item_croissant").setScale(1.05));
  add(red);
  add(tri);

  // stats scrap
  add(scrap(scene, 860, 290, 520, 440, 1.2, true));
  add(txt(scene, 860, 128, card.headline, 46, C.caramelDark, true, { stroke: C.ink, strokeThickness: 2 }));
  card.stats.forEach(([a, b], i) => {
    const y = 200 + i * 46;
    add(txt(scene, 640, y, a, 30, C.ink).setOrigin(0, 0.5));
    add(txt(scene, 1080, y, b, 32, C.ink, true).setOrigin(1, 0.5));
  });
  const sy = 200 + card.stats.length * 46 + 26;
  const n = card.maxStars;
  const step = n > 3 ? 46 : 80;
  for (let i = 0; i < n; i++) {
    add(boil(scene, 860 + (i - (n - 1) / 2) * step, sy, i < card.stars ? "star" : "star_empty").setScale(n > 3 ? 1.1 : 1.8));
  }
  add(txt(scene, 860, sy + 64, card.caption, 26, C.inkSoft, false, { wordWrap: { width: 470 }, align: "center" }));

  dt.draw(box);
  box.destroy();
  return new Promise((resolve) => {
    dt.snapshot((img) => {
      const el = img as HTMLImageElement;
      if (!(el instanceof HTMLImageElement)) return resolve(null);
      const go = () => {
        const cv = document.createElement("canvas");
        cv.width = CARD_W;
        cv.height = CARD_H;
        cv.getContext("2d")!.drawImage(el, 0, 0);
        cv.toBlob((b) => resolve(b), "image/png");
      };
      if (el.complete) go();
      else el.onload = go;
    });
  });
}

// ---------------------------------------------------------------------------
// DOM overlays (share sheet + London menu page)
// ---------------------------------------------------------------------------

const CSS = `
.cc-ov{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(43,38,34,.55);
  font-family:"Patrick Hand","Comic Sans MS",cursive;color:#2b2622;touch-action:pan-x pan-y;-webkit-user-select:text;user-select:text}
.cc-box{position:relative;background:#fbf3df;border:3px solid #2b2622;border-radius:14px;box-shadow:6px 8px 0 rgba(43,38,34,.25);
  width:min(94vw,760px);max-height:92vh;max-height:calc(100dvh - 16px);overflow-y:auto;overscroll-behavior:contain;
  display:flex;flex-direction:column;transform:rotate(-.5deg)}
.cc-box h2{margin:14px 18px 4px;font-size:30px;font-weight:normal;color:#c9561a}
.cc-box p{margin:2px 18px 8px;font-size:18px;color:#5a514a}
.cc-img{display:block;width:auto;max-width:calc(100% - 36px);max-height:56vh;max-height:56dvh;margin:6px auto;align-self:center;
  object-fit:contain;flex:none;border:2px solid #2b2622;border-radius:6px;background:#fff}
.cc-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;padding:10px 14px 16px}
.cc-btn{font:inherit;font-size:22px;padding:8px 18px;border:3px solid #2b2622;border-radius:999px;cursor:pointer;background:#fffaf0;color:#2b2622;
  box-shadow:2px 3px 0 rgba(43,38,34,.25);touch-action:manipulation}
.cc-btn:focus-visible{outline:3px dashed #f0702a;outline-offset:3px}
.cc-btn.orange{background:#f0702a;color:#fffaf0}
.cc-btn.mint{background:#7fcfb0}
.cc-x{position:absolute;top:8px;right:10px;font:inherit;font-size:24px;border:none;background:none;cursor:pointer;color:#2b2622}
.cc-status{min-height:22px;text-align:center;font-size:18px;color:#4fae8c;margin:0 0 6px}
.cc-list{overflow:auto;padding:0 18px 12px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.cc-cat{margin:12px 0 4px;font-size:22px;color:#c9561a;border-bottom:2px solid #a9c8e8}
.cc-item{display:flex;justify-content:space-between;gap:12px;font-size:19px;padding:3px 0;border-bottom:1px dashed #dccfbc}
.cc-item small{color:#5a514a;font-size:15px}
.cc-tag{display:inline-block;margin-left:6px;padding:0 8px;border-radius:8px;background:#7fcfb0;font-size:14px}
.cc-order{display:flex;align-items:center;gap:12px;padding:6px 4px;border-bottom:1px dashed #dccfbc}
.cc-order.off{opacity:.45}
.cc-ico{width:46px;height:46px;flex:none}
.cc-mid{flex:1;min-width:0}
.cc-name{font-size:21px;line-height:1.1}
.cc-how{font-size:16px;color:#5a514a}
.cc-when{font-size:15px;color:#c9561a}
.cc-price{text-align:right;font-size:20px;flex:none}
.cc-price small{display:block;font-size:14px;color:#5a514a}
.cc-full{margin:14px 0 4px;font-size:18px}
.cc-full summary{cursor:pointer;color:#c9561a;font-size:19px}
.cc-cat.small{font-size:18px;margin-top:8px}
.cc-src{margin:10px 0 0!important;font-size:15px!important}
.cc-url{width:100%;font:inherit;font-size:16px;padding:4px 6px;border:2px solid #2b2622;border-radius:6px;background:#fff}
/* phones held sideways: tighter header, smaller card, so the buttons stay on screen */
@media (max-height:520px){
  .cc-box h2{margin:8px 44px 0 16px;font-size:23px}
  .cc-box p{margin:0 16px 4px;font-size:15px}
  .cc-img{max-height:50vh;max-height:50dvh;margin:4px auto}
  .cc-row{padding:4px 12px 8px;gap:8px}
  .cc-btn{font-size:19px;padding:5px 14px}
  .cc-status{min-height:18px;font-size:16px;margin:0 0 2px}
  .cc-x{top:4px}
}
`;

let cssDone = false;
function ensureCss() {
  if (cssDone) return;
  cssDone = true;
  const st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

/** Open a modal; keyboard input to the game is suspended until it closes. */
function modal(scene: Phaser.Scene, build: (box: HTMLDivElement, close: () => void) => void, onClose?: () => void) {
  ensureCss();
  const ov = el("div", "cc-ov");
  const box = el("div", "cc-box");
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  ov.appendChild(box);
  const kb = scene.input.keyboard;
  const mgr = scene.game.input.keyboard;
  const kbWas = kb?.enabled ?? true;
  const mgrWas = mgr?.enabled ?? true;
  if (kb) kb.enabled = false;
  if (mgr) mgr.enabled = false;
  let open = true;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    e.stopPropagation();
  };
  const close = () => {
    if (!open) return;
    open = false;
    window.removeEventListener("keydown", onKey, true);
    ov.remove();
    if (kb) kb.enabled = kbWas;
    if (mgr) mgr.enabled = mgrWas;
    onClose?.();
  };
  window.addEventListener("keydown", onKey, true);
  ov.addEventListener("pointerdown", (e) => {
    if (e.target === ov) close();
  });
  // keep the page from scrolling behind, but let the list itself scroll
  ov.addEventListener("touchmove", (e) => e.stopPropagation(), { passive: true });
  ov.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
  const x = el("button", "cc-x", "✕");
  x.setAttribute("aria-label", "Close");
  x.onclick = close;
  box.appendChild(x);
  build(box, close);
  document.body.appendChild(ov);
  (box.querySelector(".cc-btn") as HTMLButtonElement | null)?.focus();
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, close);
  return close;
}

async function copyText(s: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(s);
    return true;
  } catch {
    try {
      const ta = el("textarea");
      ta.value = s;
      ta.readOnly = true;
      ta.style.fontSize = "16px"; // smaller text makes iPhone Safari zoom in on focus
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Results / end-of-week share sheet: scorecard preview, native share, download, copy link. Opened only by a tap. */
export async function openShare(scene: Phaser.Scene, card: ScoreCard, onClose?: () => void) {
  const blob = await renderScorecard(scene, card);
  const url = blob ? URL.createObjectURL(blob) : "";
  modal(
    scene,
    (box) => {
      box.appendChild(el("h2", "", "Share your shift"));
      box.appendChild(el("p", "", "A scorecard drawn by the café's corgis. Nothing is posted unless you choose to."));
      if (url) {
        const img = el("img", "cc-img");
        img.src = url;
        img.alt = `Corgi Café: Loaf Rush scorecard. ${card.headline}. ${card.stats.map(([a, b]) => `${a} ${b}`).join(", ")}.`;
        box.appendChild(img);
      }
      const status = el("div", "cc-status");
      const row = el("div", "cc-row");
      const say = (s: string, col = "#4fae8c") => {
        status.style.color = col;
        status.textContent = s;
      };
      const file = blob ? new File([blob], card.file, { type: "image/png" }) : null;
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (typeof nav.share === "function") {
        const b = el("button", "cc-btn orange", "Share");
        b.onclick = async () => {
          const text = `${card.shareText} ${PLAY_URL}`;
          try {
            if (file && nav.canShare?.({ files: [file] })) await nav.share({ files: [file], title: "Corgi Café: Loaf Rush", text });
            else await nav.share({ title: "Corgi Café: Loaf Rush", text: card.shareText, url: PLAY_URL });
            say("Shared. Thanks for spreading the loaf!");
          } catch (e) {
            // the player closing the share sheet is not an error
            if ((e as DOMException)?.name !== "AbortError") say("Sharing isn't available here. Try Download or Copy link.", "#c9561a");
          }
        };
        row.appendChild(b);
      }
      if (blob) {
        const d = el("button", "cc-btn mint", "Download PNG");
        d.onclick = () => {
          const a = el("a");
          a.href = url;
          a.download = card.file;
          document.body.appendChild(a);
          a.click();
          a.remove();
          say("Scorecard saved.");
        };
        row.appendChild(d);
      }
      const c = el("button", "cc-btn", "Copy link");
      c.onclick = async () => {
        if (await copyText(PLAY_URL)) say("Link copied!");
        else {
          say("Copy this link:", "#5a514a");
          const inp = el("input", "cc-url");
          inp.value = PLAY_URL;
          inp.readOnly = true;
          status.appendChild(inp);
          inp.select();
        }
      };
      row.appendChild(c);
      box.appendChild(row);
      box.appendChild(status);
    },
    () => {
      if (url) setTimeout(() => URL.revokeObjectURL(url), 4000);
      onClose?.();
    },
  );
}

/** Small data-URL icon of an item doodle (frame 0), for the DOM menu. */
function itemIcon(scene: Phaser.Scene, k: ItemId): string {
  const key = `item_${k}`;
  if (!scene.textures.exists(key)) return "";
  const src = scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
  const cv = document.createElement("canvas");
  cv.width = 54;
  cv.height = 54;
  cv.getContext("2d")!.drawImage(src, 0, 0, 54, 54, 0, 0, 54, 54);
  return cv.toDataURL("image/png");
}

const MENU_GROUPS: { title: string; items: ItemId[] }[] = [
  { title: "Coffee", items: ["americano", "latte"] },
  { title: "Iced coffee", items: ["icedlatte", "daytona", "pally"] },
  { title: "Smoothies", items: ["juicebox"] },
  { title: "Food", items: ["croissant", "cake", "sourdough"] },
];

/**
 * "What customers can order": the nine London menu items that customers ask for in the game,
 * with real prices, the recipe and the day each one joins the menu. Today's items are highlighted
 * when opened from a shift. The full London menu sits below in a fold-out list.
 */
export function openMenuInfo(scene: Phaser.Scene, onClose?: () => void, today?: { items: ItemId[]; dayName: string }) {
  const firstDay = (k: ItemId) => DAYS.findIndex((d) => d.menu.includes(k));
  modal(
    scene,
    (box) => {
      box.appendChild(el("h2", "", today ? `${today.dayName}'s menu` : "On the menu"));
      box.appendChild(
        el(
          "p",
          "",
          today
            ? "Anything marked TODAY could be ordered this shift. The rest arrive later in the week."
            : "Pulled, poured and toasted by very short baristas. New treats arrive as the week goes on.",
        ),
      );
      const list = el("div", "cc-list");
      for (const grp of MENU_GROUPS) {
        list.appendChild(el("div", "cc-cat", grp.title));
        for (const k of grp.items) {
          const info = ITEM_INFO[k];
          const on = today ? today.items.includes(k) : true;
          const row = el("div", "cc-order" + (on ? "" : " off"));
          const ic = itemIcon(scene, k);
          if (ic) {
            const img = el("img", "cc-ico");
            img.src = ic;
            img.alt = "";
            row.appendChild(img);
          }
          const mid = el("div", "cc-mid");
          const name = el("div", "cc-name", info.menuName ?? info.name);
          if (today && on) name.appendChild(el("span", "cc-tag", "TODAY"));
          mid.appendChild(name);
          mid.appendChild(el("div", "cc-how", `How to make it: ${RECIPE_HINTS[k] ?? ""}`));
          const d = firstDay(k);
          if (!on && d >= 0) mid.appendChild(el("div", "cc-when", `Joins the menu on ${DAYS[d].name}`));
          else if (!today && d > 0) mid.appendChild(el("div", "cc-when", `From ${DAYS[d].name}`));
          row.appendChild(mid);
          const right = el("div", "cc-price");
          right.appendChild(el("div", "", `£${info.gbp}`));
          right.appendChild(el("small", "", `${info.price} coins`));
          row.appendChild(right);
          list.appendChild(row);
        }
      }
      // the full café menu, folded away
      const det = el("details", "cc-full");
      det.appendChild(el("summary", "", "The whole Corgi Cafe menu"));
      let cat = "";
      for (const r of LONDON_MENU) {
        if (r.cat !== cat) {
          cat = r.cat;
          det.appendChild(el("div", "cc-cat small", cat));
        }
        const row = el("div", "cc-item");
        row.appendChild(el("span", "", r.name));
        row.appendChild(el("span", "", `£${r.gbp}`));
        det.appendChild(row);
      }
      list.appendChild(det);
      box.appendChild(list);
      const row = el("div", "cc-row");
      const done = el("button", "cc-btn mint", "Back to the café");
      row.appendChild(done);
      box.appendChild(row);
      done.onclick = () => (box.parentElement?.querySelector(".cc-x") as HTMLButtonElement)?.click();
    },
    onClose,
  );
}
