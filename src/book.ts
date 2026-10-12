// The Sticker Book: a Neko Atsume style collection of everyone and everything you have met.
// Unseen entries are plain pencil outlines with a gentle hint. Opens over any scene.
import Phaser from "phaser";
import { APRONS, COLORS as C, H, W } from "./config";
import { boil } from "./art/textures";
import { CorgiRig } from "./game/corgi";
import { ACHIEVEMENTS, BOOK, BOOK_CATS, BookCat, BookEntry, bookProgress, fitIcon } from "./meta";
import { save } from "./save";
import { audio } from "./audio";
import { button, scrap, txt } from "./ui";

type Tab = BookCat | "ach";
const DEPTH = 25000;
const INK = 0x2b2622;

/** Is the book open on this scene? (Scenes use this to ignore their own hotkeys meanwhile.) */
export const bookOpen = (scene: Phaser.Scene) => scene.data.get("bookOpen") === true;

export function openBook(scene: Phaser.Scene, onClose?: () => void) {
  if (bookOpen(scene)) return;
  scene.data.set("bookOpen", true);
  scene.events.once("shutdown", () => scene.data.set("bookOpen", false));
  audio.play("pop");
  const root = scene.add.container(0, 0).setDepth(DEPTH);
  const dim = scene.add.rectangle(W / 2, H / 2, W, H, INK, 0.45).setInteractive();
  root.add(dim);
  root.add(scrap(scene, W / 2, 376, 1100, 650, -0.5, true));
  root.add(boil(scene, 300, 92, "icon_book").setScale(1.1).setAngle(-8));
  root.add(txt(scene, W / 2, 90, "Sticker Book", 52, C.caramel, true, { stroke: C.ink, strokeThickness: 3 }));
  const p = bookProgress();
  root.add(txt(scene, W / 2, 134, `${p.seen} / ${p.total} stickers found   ·   ${p.ach} / ${p.achTotal} achievements`, 21, C.inkSoft, true));
  const tabBar = scene.add.container(0, 0);
  const page = scene.add.container(0, 0);
  root.add([tabBar, page]);

  const close = () => {
    scene.input.keyboard?.off("keydown-ESC", close);
    root.destroy();
    scene.data.set("bookOpen", false);
    scene.data.set("bookJustClosed", true); // the key that closed it must not reach the scene
    onClose?.();
  };
  root.add(button(scene, 1118, 90, 130, 46, "Close", "#fffaf0", close, 24));
  scene.input.keyboard?.on("keydown-ESC", close);

  const tabs: { id: Tab; name: string }[] = [...BOOK_CATS, { id: "ach", name: "Achievements" }];
  const show = (tab: Tab) => {
    tabBar.removeAll(true);
    page.removeAll(true);
    tabs.forEach((t, i) => {
      const x = W / 2 + (i - 2) * 186;
      const on = t.id === tab;
      const b = button(scene, x, 182, t.id === "ach" ? 178 : 160, 44, t.name, on ? C.orangeSoft : "#fffaf0", () => show(t.id), 22);
      if (on) b.setAngle(-1.5);
      tabBar.add(b);
    });
    if (tab === "ach") achievementsPage(scene, page);
    else entriesPage(scene, page, BOOK.filter((b) => b.cat === tab));
  };
  show("guests");
}

// ------------------------------------------------------------------ pages
function entriesPage(scene: Phaser.Scene, page: Phaser.GameObjects.Container, list: BookEntry[]) {
  const seen = new Set(save.data.seen);
  const cols = list.length > 8 ? 5 : 4;
  const cw = cols === 5 ? 205 : 245;
  list.forEach((e, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = W / 2 + (c - (cols - 1) / 2) * cw;
    const y = 318 + r * 202;
    page.add(stickerCell(scene, x, y, e, seen.has(e.key)));
  });
}

function stickerCell(scene: Phaser.Scene, x: number, y: number, e: BookEntry, found: boolean) {
  const cell = scene.add.container(x, y);
  const g = scene.add.graphics();
  if (found) {
    g.fillStyle(INK, 0.14).fillCircle(4, 5, 62);
    g.fillStyle(e.tint ? 0xffe9a6 : 0xfffaf0, 1).fillCircle(0, 0, 62);
    g.lineStyle(3, INK, 1).strokeCircle(0, 0, 62);
  } else dashedCircle(g, 62);
  cell.add(g);
  const art = entryArt(scene, e);
  if (!found) silhouette(art);
  cell.add(art);
  cell.setAngle(found ? Phaser.Math.FloatBetween(-4, 4) : 0);
  cell.add(txt(scene, 0, 84, found ? e.name : "???", found ? 21 : 22, found ? C.ink : C.inkSoft, true));
  cell.add(txt(scene, 0, 106, e.hint, 16, C.inkSoft));
  return cell;
}

/** The picture for an entry: a doodle texture or a live corgi rig. */
function entryArt(scene: Phaser.Scene, e: BookEntry): Phaser.GameObjects.GameObject {
  if (e.corgi) {
    const wear = e.key === "staff:you" ? save.data.apron : (e.corgi.apron as never);
    const rig = new CorgiRig(scene, 0, 34, 0.7, wear, e.corgi.coat);
    if (e.corgi.hat === "cap") rig.addHeadwear("cap", 0, -2);
    if (e.corgi.hat === "mask") rig.addHeadwear("mask", 4, 8);
    rig.animate(0.016, 0, 0, 1);
    return rig;
  }
  const img = boil(scene, 0, 0, e.icon ?? "star");
  fitIcon(img, e.icon?.startsWith("h_") ? 118 : 96);
  return img;
}

/** Flatten a picture into a soft pencil-grey silhouette. */
function silhouette(o: Phaser.GameObjects.GameObject) {
  const walk = (n: Phaser.GameObjects.GameObject) => {
    if (n instanceof Phaser.GameObjects.Container) n.list.forEach(walk);
    else if ("setTintFill" in n) (n as Phaser.GameObjects.Sprite).setTintFill(INK);
  };
  walk(o);
  (o as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(0.16);
}

function dashedCircle(g: Phaser.GameObjects.Graphics, r: number) {
  g.lineStyle(2.5, INK, 0.35);
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = a0 + (Math.PI * 2) / n / 2;
    g.beginPath();
    g.arc(0, 0, r, a0, a1);
    g.strokePath();
  }
}

function achievementsPage(scene: Phaser.Scene, page: Phaser.GameObjects.Container) {
  const got = new Set(save.data.ach);
  ACHIEVEMENTS.forEach((a, i) => {
    const c = i % 5;
    const r = Math.floor(i / 5);
    const x = W / 2 + (c - 2) * 205;
    const y = 278 + r * 138;
    const on = got.has(a.id);
    const cell = scene.add.container(x, y);
    const g = scene.add.graphics();
    if (on) {
      g.fillStyle(INK, 0.14).fillCircle(3, 4, 38);
      g.fillStyle(0xf6c453, 1).fillCircle(0, 0, 38);
      g.lineStyle(3, INK, 1).strokeCircle(0, 0, 38);
    } else dashedCircle(g, 38);
    cell.add(g);
    const icon = boil(scene, 0, 0, a.icon);
    fitIcon(icon, 50);
    if (!on) silhouette(icon);
    cell.add(icon);
    const apron = APRONS.find((x) => x.earn === a.id);
    if (apron) cell.add(txt(scene, 44, -30, "+ apron", 15, on ? C.mintDark : C.inkSoft, true).setAngle(12));
    cell.add(txt(scene, 0, 50, a.name, 20, on ? C.ink : C.inkSoft, true));
    cell.add(txt(scene, 0, 64, a.desc, 15, C.inkSoft, false, { wordWrap: { width: 186 }, align: "center" }).setOrigin(0.5, 0));
    if (on) cell.setAngle(Phaser.Math.FloatBetween(-3, 3));
    page.add(cell);
  });
}
