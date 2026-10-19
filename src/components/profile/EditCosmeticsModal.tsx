import { Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlayerStore } from "@/features/stores/player.store";
import { levelFromXp } from "@/lib/game/profile/level";
import { cosmeticTemplatesOfKind, type CosmeticKind } from "@/lib/game/profile/templates";
import { cn } from "@/lib/utils";

const TABS: { kind: CosmeticKind; label: string }[] = [
  { kind: "avatar", label: "Avatars" },
  { kind: "banner", label: "Banners" },
  { kind: "background", label: "Backgrounds" },
];

export function EditCosmeticsModal() {
  const { xp, avatar, banner, background, equipCosmetic } = usePlayerStore();
  const playerLevel = levelFromXp(xp);
  const equipped: Record<CosmeticKind, number> = { avatar, banner, background };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full text-xs">Edit cosmetics</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto border-border bg-card">
        <DialogHeader>
          <DialogTitle className="uppercase">Operator cosmetics</DialogTitle>
          <DialogDescription>New looks unlock every 4 levels · you are level {playerLevel}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="avatar">
          <TabsList className="w-full">
            {TABS.map((t) => (
              <TabsTrigger key={t.kind} value={t.kind} className="flex-1 cursor-pointer">{t.label}</TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((t) => (
            <TabsContent key={t.kind} value={t.kind}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {cosmeticTemplatesOfKind(t.kind).map((template) => {
                  const unlocked = template.soulbound || playerLevel >= template.requiredLevel;
                  const isEquipped = equipped[t.kind] === template.templateId;
                  return (
                    <button
                      key={template.templateId}
                      disabled={!unlocked || isEquipped}
                      className={cn(
                        "relative border border-border bg-background/60 p-2 text-left transition-opacity",
                        isEquipped && "border-primary",
                        !unlocked && "opacity-50",
                        unlocked && !isEquipped && "cursor-pointer hover:border-primary",
                      )}
                      onClick={() => {
                        if (equipCosmetic(t.kind, template.templateId, playerLevel)) toast.success(`${template.name} equipped`);
                      }}
                    >
                      <img src={template.image} alt={template.name} width={200} height={120} className="aspect-video w-full object-cover" loading="lazy" />
                      <p className="mt-1 truncate text-xs font-semibold text-foreground">{template.name}</p>
                      {isEquipped ? (
                        <span className="flex items-center gap-1 text-[10px] text-primary"><Check className="size-3" /> Equipped</span>
                      ) : unlocked ? (
                        <span className="text-[10px] text-muted-foreground">Click to equip</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Lock className="size-3" /> Unlocks at level {template.requiredLevel}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
