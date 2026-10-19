import { playerRepository, toPlayer } from "@/lib/modules/players/server.repository";
import type { EmailCredentials } from "./types";
import { hashPassword, verifyPassword } from "./password";

/** Dev-only demo account; never created in production builds. */
const DEMO = { email: "email@example.com", password: "password123", username: "operator" };

async function ensureDemoAccount(email: string) {
  if (!import.meta.env.DEV || email.toLowerCase() !== DEMO.email) return;
  if (await playerRepository.findByEmail(DEMO.email)) return;
  await playerRepository.create({
    username: DEMO.username,
    displayName: "Operator",
    email: DEMO.email,
    walletAddress: null,
    passwordHash: await hashPassword(DEMO.password),
  });
}

export async function loginWithEmail({ email, password }: EmailCredentials) {
  await ensureDemoAccount(email);
  const record = await playerRepository.findByEmail(email);
  if (!record?.passwordHash || !(await verifyPassword(password, record.passwordHash))) {
    throw new Error("Invalid email or password");
  }
  return toPlayer(await playerRepository.touchLogin(record.id));
}
