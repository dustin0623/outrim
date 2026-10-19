import type { SlotKey } from "@/features/types/game/types";

export const ITEM_NAME_POOLS: Record<SlotKey, string[]> = {
  asicMiner: [
    "USB ASIC Miner",
    "Gridseed Blade",
    "Antminer S9",
    "Overclocked S19",
    "Quantum Miner",
  ],
  motherboard: [
    "Breadboard Mobo",
    "Mining Rig Mobo",
    "Dual CPU Server Board",
    "Liquid-Cooled Board",
    "Neural Net Board",
  ],
  powerSupply: [
    "80+ Bronze PSU",
    "80+ Gold PSU",
    "80+ Platinum PSU",
    "Redundant PSU",
    "Fusion Reactor",
  ],
  coolingSystem: [
    "Case Fan",
    "AIO Cooler",
    "Immersion Tank",
    "Liquid Nitrogen Rig",
    "Deep Space Radiator",
  ],
  networkModule: [
    "USB Wi-Fi Dongle",
    "Gigabit PCIe NIC",
    "10Gb SFP+ Module",
    "40Gb QSFP+ NIC",
    "Orbital Laser Uplink",
  ],
  firmwareChip: [
    "Bootleg BIOS",
    "Open Source Firmware",
    "Custom HiveOS",
    "Kernel Hack",
    "Singularity BIOS",
  ],
};

export function randomItemName(slot: SlotKey, seed: string): string {
  const pool = ITEM_NAME_POOLS[slot];
  const index =
    seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % pool.length;
  return pool[index] ?? pool[0]!;
}

/** Display aliases only. Minted names and deterministic generation stay unchanged. */
const EQUIPMENT_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  "Scrapyard ASIC": "Salvaged Extraction Head",
  "Refurbished ASIC": "Refitted Extraction Head",
  "CoreStrike ASIC": "Surveyor Extraction Head",
  "Phantom Core MK-I": "Vanguard Extraction Head",
  "Sovereign Hash Engine": "Horizon Extraction Head",
  "Bare PCB": "Salvaged Control Core",
  "Budget Baseboard": "Refitted Control Core",
  "CrossLink MX": "Surveyor Control Core",
  "Nexus Prime Board": "Vanguard Control Core",
  "OmniCore Ultraboard": "Horizon Control Core",
  "Wall Brick PSU": "Salvaged Reactor",
  "Bronze Rail PSU": "Refitted Reactor",
  "Titanium Grid PSU": "Surveyor Reactor",
  "Surge Sovereign PSU": "Vanguard Reactor",
  "Infinite Rail Core": "Horizon Reactor",
  "Box Fan Rig": "Salvaged Thermal Array",
  "Dual Heatsink": "Refitted Thermal Array",
  "Liquid Loop Cooler": "Surveyor Thermal Array",
  "CryoVault Module": "Vanguard Thermal Array",
  "Absolute Zero Array": "Horizon Thermal Array",
  "Coax Stub": "Salvaged Signal Array",
  "Mesh Adapter": "Refitted Signal Array",
  "Deep Packet NIC": "Surveyor Signal Array",
  "Ghost Protocol NIC": "Vanguard Signal Array",
  "Zero-Latency Darknet": "Horizon Signal Array",
  "Factory ROM": "Salvaged Logic Module",
  "Patched BIOS": "Refitted Logic Module",
  "Exploit Microcode": "Surveyor Logic Module",
  "Phantom Kernel v2": "Vanguard Logic Module",
  "Sovereign Override": "Horizon Logic Module",
  "USB ASIC Miner": "Salvaged Extraction Head",
  "Gridseed Blade": "Refitted Extraction Head",
  "Antminer S9": "Surveyor Extraction Head",
  "Overclocked S19": "Vanguard Extraction Head",
  "Quantum Miner": "Horizon Extraction Head",
  "Breadboard Mobo": "Salvaged Control Core",
  "Mining Rig Mobo": "Refitted Control Core",
  "Dual CPU Server Board": "Surveyor Control Core",
  "Liquid-Cooled Board": "Vanguard Control Core",
  "Neural Net Board": "Horizon Control Core",
  "80+ Bronze PSU": "Salvaged Reactor",
  "80+ Gold PSU": "Refitted Reactor",
  "80+ Platinum PSU": "Surveyor Reactor",
  "Redundant PSU": "Vanguard Reactor",
  "Fusion Reactor": "Horizon Reactor",
  "Case Fan": "Salvaged Thermal Array",
  "AIO Cooler": "Refitted Thermal Array",
  "Immersion Tank": "Surveyor Thermal Array",
  "Liquid Nitrogen Rig": "Vanguard Thermal Array",
  "Deep Space Radiator": "Horizon Thermal Array",
  "USB Wi-Fi Dongle": "Salvaged Signal Array",
  "Gigabit PCIe NIC": "Refitted Signal Array",
  "10Gb SFP+ Module": "Surveyor Signal Array",
  "40Gb QSFP+ NIC": "Vanguard Signal Array",
  "Orbital Laser Uplink": "Horizon Signal Array",
  "Bootleg BIOS": "Salvaged Logic Module",
  "Open Source Firmware": "Refitted Logic Module",
  "Custom HiveOS": "Surveyor Logic Module",
  "Kernel Hack": "Vanguard Logic Module",
  "Singularity BIOS": "Horizon Logic Module",
};

export function equipmentDisplayName(recordedName: string): string {
  return Object.hasOwn(EQUIPMENT_DISPLAY_NAMES, recordedName)
    ? EQUIPMENT_DISPLAY_NAMES[recordedName]!
    : recordedName;
}
