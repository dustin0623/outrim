import { expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { TEMPLATES } from "@/features/types/game/templates";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { WikiPage } from "./WikiPage";
vi.mock("@/app/providers", () => ({ Providers: "div" }));
vi.mock("@vercel/analytics/next", () => ({ Analytics: "div" }));
vi.mock("@vercel/speed-insights/next", () => ({ SpeedInsights: "div" }));
import { metadata } from "@/app/layout";
import { metadata as wikiMetadata } from "@/app/wiki/page";
import { BrandLogo } from "@/components/brand/BrandLogo";

const render = () => {
  const html = renderToStaticMarkup(WikiPage());
  return {
    html,
    text: html
      .replace(/<[^>]+>/g, "")
      .replaceAll("&#x27;", "'")
      .replaceAll("&amp;", "&"),
  };
};
it("ships every catalog illustration without changing catalog identities", () => {
  expect(TEMPLATES.size).toBe(105);
  for (const template of TEMPLATES.values())
    expect(
      existsSync(path.resolve("public", "." + template.image)),
      template.image,
    ).toBe(true);
});
it("publishes Outrim metadata, wordmark and the matching image/icon exports", () => {
  expect(metadata.title).toBe("Outrim — Mine. Salvage. Outlast.");
  expect(wikiMetadata.title).toBe("Field Manual — Outrim Operator Guide");
  expect(render().text).toContain("Outrim Field Manual");
  const logo = renderToStaticMarkup(BrandLogo({}));
  expect(logo).toContain('src="/brand/outrim-logo.png"');
  expect(logo).toContain('alt="Outrim"');
  expect(metadata.openGraph).toMatchObject({
    siteName: "Outrim",
    images: [{ url: "/brand/outrim-og.png", width: 1200, height: 630 }],
  });
  for (const [file, width, height, alpha] of [
    ["brand/outrim-logo.png", 1200, 360, true],
    ["brand/outrim-og.png", 1200, 630, false],
    ["brand/hash-token.png", 512, 512, true],
    ["favicon-16x16.png", 16, 16, true],
    ["favicon-32x32.png", 32, 32, true],
    ["apple-touch-icon.png", 180, 180, true],
    ["android-chrome-192x192.png", 192, 192, true],
    ["android-chrome-512x512.png", 512, 512, true],
  ] as const) {
    const png = readFileSync(path.join(process.cwd(), "public", file));
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([
      width,
      height,
    ]);
    expect(png[25] === 6).toBe(alpha);
  }
  const ico = readFileSync(path.join(process.cwd(), "public/favicon.ico"));
  expect([
    ico.readUInt16LE(0),
    ico.readUInt16LE(2),
    ico.readUInt16LE(4),
  ]).toEqual([0, 1, 4]);
  expect([0, 1, 2, 3].map((index) => ico[6 + index * 16] || 256)).toEqual([
    16, 32, 48, 256,
  ]);
});
it("renders a public guide with nine reachable sections, mobile selector, desktop contents and accessible references", () => {
  const { html } = render();
  expect(html.match(/<section /g) ?? []).toHaveLength(9);
  expect(html).toContain('aria-label="Game guide sections"');
  expect(html).toContain('for="wiki-section"');
  expect(html).toContain('<select id="wiki-section"');
  for (const match of html.matchAll(/href="#([^"]+)"/g))
    expect(html).toContain(`id="${match[1]}"`);
  expect(html).toContain('href="/dashboard"');
  expect(html).toContain("<summary class=");
  expect(html).toContain(
    '<caption class="sr-only">Supply Depot payment choices</caption>',
  );
  expect(html).toContain('scope="col"');
});
it("documents current registration, mining, stat/modules costs and HIVE trading without retired instructions", () => {
  const { text } = render();
  expect(text).toContain("One-time registration: 75 HIVE");
  expect(text).toContain("Extraction level 1 → 2 costs 1 HASH");
  expect(text).toContain("2 HASH/day before capacity limits");
  expect(text).toContain("fills in about 12 hours");
  expect(text).toContain(
    "Upgrade cost = dismantle value × 0.0498 × current item level",
  );
  expect(text).toContain("Outpost Exchange uses HIVE");
  expect(text).toContain("configured market account");
  expect(text).toContain("retains 0.005 HIVE and pays 0.095 HIVE");
  expect(text).toContain(
    "there is no manual transaction-signature submission step",
  );
  expect(text).toContain("staking awards no XP");
  expect(text).toContain(
    "Operator Fortune comes from permanent exposed hold stake and equipped modules.",
  );
  expect(text).toContain(
    "Disruption and Repair add a separate 25% base success chance",
  );
  expect(text).not.toContain("Fortune starts at 25%");
  expect(text).not.toContain("Pick a username");
  expect(text).not.toContain("straight to the seller");
  expect(text).not.toContain("level1.8");
});
it("separates submission, payout, recorded secured hauls and current mining, and explains actual limitations", () => {
  const { text } = render();
  expect(text).toContain("Withdrawal queued does not mean withdrawal paid");
  expect(text).toContain(
    "Latest 100 logs per selection, starting with Secured hauls",
  );
  expect(text).toContain("Mining history is not stored or graphed");
  expect(text).toContain("The default activity tab:");
  expect(text).toContain(
    "The Activity button badge counts your ongoing submissions.",
  );
  expect(text).toContain(
    "Each contribution compares your value with that category's highest registered operator",
  );
  expect(text).toContain(
    "Currently, secured hauls, permanent stat upgrades, exposed hold stakes, registration and HIVE depot grants reset this clock",
  );
  expect(text).toContain(
    "Cosmetic permission currently checks a separately stored operator level",
  );
  expect(text).toContain(
    "Private execution seeds are not published in Operations Ledger",
  );
  expect(text).toContain("1, 1, 3");
  expect(text).toContain("Today is partial");
});
