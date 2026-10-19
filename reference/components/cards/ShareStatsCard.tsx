"use client";
import { GAME_RESOURCE_LABEL } from "@/lib/config/constants/game";
/**
 * ShareStatsCard
 *
 * A self-contained card rendered off-screen that html-to-image captures.
 * No gear section — kept intentionally simple so the image is compact and
 * shareable on social media.
 *
 * Includes a banner gradient at the top (matching the profile page header),
 * and stat values are rendered in red (#60A5FA).
 */

import { forwardRef } from "react";
import { formatMiningRate, formatHash, formatPercent } from "@/lib/format";

interface ShareStatsCardProps {
  origin: string;
  username: string;
  level: number;
  address: string;
  vault: number;
  capacity: number;
  fillPercent: number;
  perSecond: number;
  hashRate: number;
  hackPower: number;
  security: number;
  notoriety: number;
  avatarImage?: string;
  bannerImage?: string;
}

export const ShareStatsCard = forwardRef<HTMLDivElement, ShareStatsCardProps>(
  function ShareStatsCard(
    {
      origin,
      username,
      level,
      address,
      vault,
      capacity,
      fillPercent,
      perSecond,
      hashRate,
      hackPower,
      security,
      notoriety,
      avatarImage,
      bannerImage,
    },
    ref,
  ) {
    const initials = username.slice(0, 2).toUpperCase();
    // Shorten address for display, e.g. "8DjMYv...RAFLjf"
    const shortAddr = address
      ? `${address.slice(0, 6)}...${address.slice(-6)}`
      : null;

    const stats = [
      {
        label: "EXPOSED HOLD",
        value: `${formatHash(vault, 4, false)} ${GAME_RESOURCE_LABEL}`,
        sub: `${formatPercent(fillPercent, 4)} full`,
      },
      {
        label: "EXTRACTION",
        value: formatHash(hashRate, 4, false),
        sub: `${formatMiningRate(perSecond)} ${GAME_RESOURCE_LABEL}/s`,
      },
      {
        label: "BREACH",
        value: formatHash(hackPower, 4, false),
        sub: `Raids targets <${formatHash(hackPower, 4, false)} Armor`,
      },
      {
        label: "ARMOR",
        value: formatHash(security, 4, false),
        sub: `Blocks Breach up to ${formatHash(security, 4, false)}`,
      },
      {
        label: "RENOWN",
        value: formatHash(notoriety, 4, false),
        sub: "Unlocks Precision",
      },
      {
        label: "HOLD CAPACITY",
        value: `${formatHash(capacity, 4, false)} ${GAME_RESOURCE_LABEL}`,
        sub: "Capacity",
      },
    ];

    return (
      <div
        ref={ref}
        style={{
          width: 600,
          background: "#080D18",
          borderRadius: 20,
          overflow: "hidden",
          fontFamily: "'Inter', 'Geist', system-ui, sans-serif",
          color: "#EAF0F6",
          border: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
        }}
      >
        {/* Banner strip */}
        <div
          style={{
            position: "relative",
            height: 110,
            background: bannerImage
              ? undefined
              : "linear-gradient(135deg, rgba(96,165,250,0.25) 0%, rgba(168,85,247,0.20) 50%, rgba(22,163,74,0.20) 100%)",
            overflow: "hidden",
          }}
        >
          {bannerImage && (
            <img
              src={bannerImage}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          )}
          {/* Subtle bottom fade so banner blends into card body */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 48,
              background:
                "linear-gradient(to bottom, transparent, rgba(15,15,16,0.85))",
            }}
          />
        </div>

        {/* Content area — pulled up to overlap banner via negative margin */}
        <div
          style={{
            position: "relative",
            padding: "0 32px 28px",
            marginTop: -36,
          }}
        >
          {/* Avatar + name row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* Avatar ring */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #60A5FA 0%, #a855f7 50%, #16a34a 100%)",
                padding: 3,
                flexShrink: 0,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 0 3px #080D18",
              }}
            >
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt={username}
                  crossOrigin="anonymous"
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: "50%",
                    background: "#1a1a1c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#EAF0F6",
                  }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Name + level badge + address */}
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}
                >
                  {username}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "transparent",
                    color: "#eab308",
                    borderRadius: 99,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ★ {level}
                </span>
              </div>
              {shortAddr && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    fontFamily: "monospace",
                  }}
                >
                  {shortAddr}
                </div>
              )}
            </div>

            {/* Brand logo — inline with username row, far right */}
            <img
              src={`${origin}/brand/outrim-logo.png`}
              alt="Outrim"
              crossOrigin="anonymous"
              style={{
                height: 64,
                width: "auto",
                objectFit: "contain",
                flexShrink: 0,
                alignSelf: "center",
                marginBottom: 4,
              }}
            />
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.07)",
              marginBottom: 20,
            }}
          />

          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            {stats.map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: "rgba(26,26,28,0.80)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{ fontSize: 22, fontWeight: 800, color: "#60A5FA" }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 20,
              fontSize: 11,
              color: "#374151",
              textAlign: "center",
              letterSpacing: 0.5,
            }}
          >
            {origin ? new URL(origin).host : ""}
          </div>
        </div>
      </div>
    );
  },
);
