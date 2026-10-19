import type { Hex } from "@/lib/game/world/hex";

export type WorldCommand = { type: "center" } | { type: "zoom"; factor: number } | { type: "select"; hex: Hex | null } | { type: "pan"; x: number; y: number };
export type WorldEvent = { type: "selected"; hex: Hex } | { type: "ready" } | { type: "camera"; zoom: number } | { type: "progress"; value: number; stage: string };

/** Per-mounted-world transport, with no React or Phaser runtime dependencies. */
export class GameBridge {
  private commands = new Set<(command: WorldCommand) => void>();
  private events = new Set<(event: WorldEvent) => void>();
  command(command: WorldCommand) { this.commands.forEach((listener) => listener(command)); }
  emit(event: WorldEvent) { this.events.forEach((listener) => listener(event)); }
  onCommand(listener: (command: WorldCommand) => void) {
    this.commands.add(listener);
    return () => { this.commands.delete(listener); };
  }
  onEvent(listener: (event: WorldEvent) => void) {
    this.events.add(listener);
    return () => { this.events.delete(listener); };
  }
}