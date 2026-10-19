import { z } from "zod";
// template/lib/auth/login.server.ts
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getJwtSecret } from "./secret.server";
import {
  isValidHiveUsername,
  normalizeHiveUsername,
} from "@/lib/utils/hive/validation";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const APP_NAME = "Chainframe";

interface ParsedChallenge {
  body: string;
  sig: string;
  wallet: string;
  jti: string;
  expiresAt: number;
}

function signChallengeBody(body: string): string {
  return createHmac("sha256", getJwtSecret()).update(body).digest("base64url");
}

/** Creates the pure readable challenge. The feature event persists its nonce hash. */
export function buildLoginChallenge(username: string): {
  message: string;
  nonceHash: string;
  expiresAt: number;
  wallet: string;
} {
  const normalized = normalizeHiveUsername(username);

  const jti = randomBytes(32).toString("hex");
  const expiresAt = Math.floor((Date.now() + CHALLENGE_TTL_MS) / 1000) * 1000;
  const body = [
    `Sign in to ${APP_NAME}`,
    `Account: @${normalized}`,
    `Code: ${jti}`,
    `Expires: ${Math.floor(expiresAt / 1000)}`,
  ].join("\n");
  return {
    message: `${body}\nSig: ${signChallengeBody(body)}`,
    nonceHash: hashLoginNonce(jti),
    expiresAt,
    wallet: normalized,
  };
}

function parseChallenge(message: string): ParsedChallenge | null {
  const lines = message.split("\n");
  const sigLine = lines.pop();
  if (!sigLine?.startsWith("Sig: ")) return null;
  const sig = sigLine.slice("Sig: ".length);
  const body = lines.join("\n");

  const accountLine = lines.find((line) => line.startsWith("Account: @"));
  const codeLine = lines.find((line) => line.startsWith("Code: "));
  const expiresLine = lines.find((line) => line.startsWith("Expires: "));
  if (!accountLine || !codeLine || !expiresLine) return null;

  const expiresAtSeconds = Number(expiresLine.slice("Expires: ".length).trim());
  if (!Number.isFinite(expiresAtSeconds) || expiresAtSeconds <= 0) return null;

  return {
    body,
    sig,
    wallet: accountLine.slice("Account: @".length).trim().toLowerCase(),
    jti: codeLine.slice("Code: ".length).trim(),
    expiresAt: expiresAtSeconds * 1000,
  };
}

/** Checks challenge authenticity and response structure; Hive ownership is verified separately. */
export function validateLoginResponse(
  username: string,
  signature: string,
):
  | {
      ok: true;
      wallet: string;
      jti: string;
      expiresAt: number;
      message: string;
      signature: string;
    }
  | { ok: false; error: string } {
  const normalized = username.trim().toLowerCase();
  if (!isValidHiveUsername(normalized))
    return { ok: false, error: "Invalid Hive username" };

  const schema = z.object({
    success: z.literal(true),
    username: z.string(),
    message: z.string().min(1),
    signature: z.string().min(1),
    authority: z.literal("posting").optional(),
  });
  let response: z.infer<typeof schema>;
  try {
    const parsed = schema.safeParse(JSON.parse(signature));
    if (!parsed.success)
      return { ok: false, error: "Invalid Keychain response" };
    response = parsed.data;
  } catch {
    return { ok: false, error: "Invalid Keychain response" };
  }
  if (
    response.success !== true ||
    typeof response.signature !== "string" ||
    !response.signature
  ) {
    return { ok: false, error: "Keychain authentication rejected" };
  }
  if (
    (response.authority !== undefined && response.authority !== "posting") ||
    response.username?.trim().toLowerCase() !== normalized ||
    !response.message
  ) {
    return {
      ok: false,
      error: "Keychain sign-in did not match the expected challenge",
    };
  }

  const challenge = parseChallenge(response.message);
  if (!challenge) {
    return { ok: false, error: "Invalid or expired nonce" };
  }

  const expectedSig = signChallengeBody(challenge.body);
  const sigMatches =
    expectedSig.length === challenge.sig.length &&
    timingSafeEqual(Buffer.from(expectedSig), Buffer.from(challenge.sig));
  if (!sigMatches) {
    return { ok: false, error: "Invalid or expired nonce" };
  }
  if (challenge.expiresAt <= Date.now()) {
    return { ok: false, error: "Invalid or expired nonce" };
  }
  if (challenge.wallet !== normalized) {
    return {
      ok: false,
      error: "Keychain sign-in did not match the expected challenge",
    };
  }

  return {
    ok: true,
    wallet: normalized,
    jti: challenge.jti,
    expiresAt: challenge.expiresAt,
    message: response.message,
    signature: response.signature,
  };
}

export function hashLoginNonce(nonce: string): string {
  return createHash("sha256").update(nonce).digest("hex");
}
