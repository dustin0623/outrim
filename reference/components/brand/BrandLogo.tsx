import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/outrim-logo.png"
      alt="Outrim"
      width={1200}
      height={360}
      className={cn("h-6 w-auto object-contain", className)}
      draggable={false}
    />
  );
}
