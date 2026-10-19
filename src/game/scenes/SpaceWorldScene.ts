import Phaser from "phaser";
import { GameBridge } from "@/game/bridge/GameBridge";
import { HOME, WORLD_SIZE, inBounds, type Hex } from "@/lib/game/world/hex";
import { ISO_Y, SECTOR_SIZE, pixelToSector, sectorToPixel, spaceObjectAt } from "@/lib/game/world/space";
import stationUrl from "@/assets/world/station.png";
import oceanUrl from "@/assets/world/ocean-planet.png";
import mineralUrl from "@/assets/world/mineral-planet.png";

export class SpaceWorldScene extends Phaser.Scene {
  private bridge: GameBridge;
  private tiles?: Phaser.GameObjects.Graphics;
  private objects = new Map<string, Phaser.GameObjects.Container>();
  private selected: Hex | null = HOME;
  private hover: Hex | null = null;
  private down: { x: number; y: number; moved: boolean } | null = null;
  private dirty = true;
  private palette = { sector: 0, alternate: 0, primary: 0, foreground: 0, rival: 0, muted: 0 };

  constructor(bridge: GameBridge) { super("SpaceWorld"); this.bridge = bridge; }

  preload() {
    this.load.image("station", stationUrl);
    this.load.image("ocean", oceanUrl);
    this.load.image("mineral", mineralUrl);
  }

  create() {
    // Resolve semantic CSS tokens through the browser's color parser, including oklch.
    const probe = document.createElement("canvas").getContext("2d");
    const style = getComputedStyle(document.documentElement);
    const color = (token: string) => {
      if (!probe) return 0;
      probe.fillStyle = style.getPropertyValue(token).trim();
      probe.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
      return (r << 16) | (g << 8) | b;
    };
    this.palette = { sector: color("--space-sector"), alternate: color("--space-sector-alt"), primary: color("--primary"), foreground: color("--foreground"), rival: color("--base-rival"), muted: color("--muted-foreground") };
    this.tiles = this.add.graphics().setDepth(-1);
    this.center();
    const unsubscribe = this.bridge.onCommand((command) => {
      if (command.type === "center") this.center();
      if (command.type === "zoom") this.zoomBy(command.factor);
      if (command.type === "select") this.selected = command.hex;
      if (command.type === "pan") {
        this.cameras.main.scrollX += command.x / this.cameras.main.zoom;
        this.cameras.main.scrollY += command.y / this.cameras.main.zoom;
      }
      this.dirty = true;
    });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => { this.down = { x: p.x, y: p.y, moved: false }; });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      const camera = this.cameras.main;
      if (this.down && p.isDown) {
        if (Math.hypot(p.x - this.down.x, p.y - this.down.y) > 5) this.down.moved = true;
        if (this.down.moved) {
          camera.scrollX -= (p.x - p.prevPosition.x) / camera.zoom;
          camera.scrollY -= (p.y - p.prevPosition.y) / camera.zoom;
        }
      } else {
        const point = camera.getWorldPoint(p.x, p.y);
        const h = pixelToSector(point.x, point.y);
        this.hover = inBounds(h) ? h : null;
      }
      this.dirty = true;
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (this.down && !this.down.moved) {
        const point = this.cameras.main.getWorldPoint(p.x, p.y);
        const hex = pixelToSector(point.x, point.y);
        if (inBounds(hex)) { this.selected = hex; this.bridge.emit({ type: "selected", hex }); }
      }
      this.down = null; this.dirty = true;
    });
    this.input.on("gameout", () => { this.down = null; this.hover = null; this.dirty = true; });
    this.input.on("wheel", (p: Phaser.Input.Pointer, _objects: unknown[], _dx: number, dy: number) => { this.zoomBy(Math.exp(-dy * 0.001), p.x, p.y); });
    const resize = () => { this.dirty = true; };
    this.scale.on("resize", resize);
    this.events.once("shutdown", () => { unsubscribe(); this.scale.off("resize", resize); this.objects.clear(); });
    this.bridge.emit({ type: "ready" });
    this.bridge.emit({ type: "camera", zoom: this.cameras.main.zoom });
  }

  private center() {
    const home = sectorToPixel(HOME);
    this.cameras.main.centerOn(home.x, home.y);
    this.dirty = true;
  }

  private zoomBy(factor: number, x = this.scale.width / 2, y = this.scale.height / 2) {
    const camera = this.cameras.main;
    const before = camera.getWorldPoint(x, y);
    camera.setZoom(Phaser.Math.Clamp(camera.zoom * factor, 0.45, 1.8));
    camera.preRender();
    const after = camera.getWorldPoint(x, y);
    camera.scrollX += before.x - after.x;
    camera.scrollY += before.y - after.y;
    this.dirty = true;
    this.bridge.emit({ type: "camera", zoom: camera.zoom });
  }

  private hexFill(h: Hex, color: number, alpha: number) {
    const p = sectorToPixel(h);
    const points = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 30);
      return new Phaser.Geom.Point(p.x + SECTOR_SIZE * Math.cos(a), p.y + SECTOR_SIZE * Math.sin(a) * ISO_Y);
    });
    // Full-size fills meet edge-to-edge: no stroke, gap, or tile border.
    this.tiles?.fillStyle(color, alpha).fillPoints(points, true);
  }

  override update() {
    if (!this.dirty || !this.tiles) return;
    this.dirty = false;
    const camera = this.cameras.main;
    camera.preRender();
    const bounds = camera.worldView;
    const corners = [pixelToSector(bounds.left, bounds.top), pixelToSector(bounds.right, bounds.top), pixelToSector(bounds.left, bounds.bottom), pixelToSector(bounds.right, bounds.bottom)];
    const qMin = Math.max(0, Math.min(...corners.map((h) => h.q)) - 2);
    const qMax = Math.min(WORLD_SIZE - 1, Math.max(...corners.map((h) => h.q)) + 2);
    const rMin = Math.max(0, Math.min(...corners.map((h) => h.r)) - 2);
    const rMax = Math.min(WORLD_SIZE - 1, Math.max(...corners.map((h) => h.r)) + 2);
    const visible = new Set<string>();
    this.tiles.clear();
    for (let r = rMin; r <= rMax; r++) for (let q = qMin; q <= qMax; q++) {
      const h = { q, r }, p = sectorToPixel(h);
      if (p.x < bounds.left - SECTOR_SIZE || p.x > bounds.right + SECTOR_SIZE || p.y < bounds.top - SECTOR_SIZE || p.y > bounds.bottom + SECTOR_SIZE) continue;
      this.hexFill(h, (q + r) % 3 === 0 ? this.palette.alternate : this.palette.sector, (q + r) % 3 === 0 ? 0.19 : 0.09);
      const object = spaceObjectAt(h);
      if (!object) continue;
      const key = `${q},${r}`;
      visible.add(key);
      if (this.objects.has(key)) continue;
      const isStation = object.kind === "station";
      const size = isStation ? 165 : 114;
      const sprite = this.add.image(0, isStation ? -26 : -12, isStation ? "station" : object.variant).setDisplaySize(size, size);
      const color = Phaser.Display.Color.IntegerToColor(object.variant === "own" ? this.palette.primary : object.variant === "rival" ? this.palette.rival : this.palette.foreground).rgba;
      const label = this.add.text(0, isStation ? 66 : 60, object.name, { fontFamily: "Arial, sans-serif", fontSize: "12px", color, align: "center" }).setOrigin(0.5);
      const subtitle = this.add.text(0, isStation ? 83 : 76, isStation ? (object.variant === "own" ? "HOME SECTOR" : "RIVAL STATION") : "ALLOY WORLD", { fontFamily: "Arial, sans-serif", fontSize: "9px", color: Phaser.Display.Color.IntegerToColor(this.palette.muted).rgba }).setOrigin(0.5);
      const container = this.add.container(p.x, p.y, [sprite, label, subtitle]).setDepth(p.y);
      this.objects.set(key, container);
    }
    for (const [key, object] of this.objects) if (!visible.has(key)) { object.destroy(); this.objects.delete(key); }
    if (this.hover) this.hexFill(this.hover, this.palette.foreground, 0.06);
    if (this.selected) this.hexFill(this.selected, this.palette.primary, 0.2);
  }
}