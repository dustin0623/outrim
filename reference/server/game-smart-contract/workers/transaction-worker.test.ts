import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const drain = vi.hoisted(() => vi.fn());
vi.mock(
  "@/server/game-smart-contract/features/events/payment-processing/drain",
  () => ({
    drainPaymentJobs: drain,
  }),
);
vi.mock("@/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
import { TransactionWorker } from "./transaction-worker";
beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
});
afterEach(() => vi.useRealTimers());
describe("payment worker scheduling", () => {
  it("prevents overlapping drains and waits for shutdown", async () => {
    let finish!: () => void;
    drain.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const checkLease = vi.fn(async () => {});
    const worker = new TransactionWorker(100, 3, checkLease);
    const first = worker.drain();
    const second = worker.drain();
    expect(drain).toHaveBeenCalledTimes(1);
    expect(drain.mock.calls[0][0]).toEqual({ checkLease, maxRetries: 3 });
    let stopped = false;
    const stop = worker.stop().then(() => {
      stopped = true;
    });
    await Promise.resolve();
    expect(stopped).toBe(false);
    expect(drain.mock.calls[0][1]()).toBe(true);
    finish();
    await Promise.all([first, second, stop]);
    await worker.drain();
    expect(drain).toHaveBeenCalledTimes(1);
  });
  it("cleans up its timer after stopping", async () => {
    drain.mockResolvedValue(undefined);
    const worker = new TransactionWorker(100);
    worker.start();
    await vi.advanceTimersByTimeAsync(250);
    expect(drain).toHaveBeenCalledTimes(3);
    await worker.stop();
    await vi.advanceTimersByTimeAsync(500);
    expect(drain).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });
});
