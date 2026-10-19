import type { Metadata } from "next";

import { WikiPage } from "@/components/pages/WikiPage";

export const metadata: Metadata = {
  title: "Field Manual — Outrim Operator Guide",
  description:
    "Start playing Outrim: Hive registration, HASH and SPARKS, mining, upgrades, modules, HIVE trading, history and rankings.",
  openGraph: {
    title: "Field Manual — Outrim Operator Guide",
    description:
      "A practical operator guide to mining, modules, raids, payments and progress, with current rules and worked examples.",
    type: "article",
  },
  twitter: { card: "summary_large_image" },
};

export default function WikiRoutePage() {
  return <WikiPage />;
}
