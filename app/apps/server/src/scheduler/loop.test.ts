import { describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { startScheduler } from './loop.js';

const HOUR_MS = 3_600_000;

function quietLogger() {
  const lines: string[] = [];
  return {
    lines,
    logger: createLogger({ level: 'debug', secrets: [], write: (l) => lines.push(l) }),
  };
}

describe('FR-005-02 · T-060 · ciclo del planificador', () => {
  it('corre un tic al arrancar y no solapa dos tics', async () => {
    let calls = 0;
    let release: () => void = () => undefined;
    const { logger } = quietLogger();
    const scheduler = startScheduler({
      logger,
      intervalMs: HOUR_MS,
      tick: () => {
        calls += 1;
        return new Promise<void>((resolve) => {
          release = resolve;
        });
      },
    });
    const second = scheduler.runOnce();
    expect(calls).toBe(1);
    release();
    await second;
    const third = scheduler.runOnce();
    expect(calls).toBe(2);
    release();
    await third;
    scheduler.stop();
  });

  it('un error en un tic se registra y el siguiente tic corre igual', async () => {
    let calls = 0;
    const { logger, lines } = quietLogger();
    const scheduler = startScheduler({
      logger,
      intervalMs: HOUR_MS,
      tick: () => {
        calls += 1;
        return calls === 1 ? Promise.reject(new Error('mongo caído')) : Promise.resolve();
      },
    });
    await scheduler.runOnce();
    await scheduler.runOnce();
    expect(calls).toBe(2);
    expect(lines.some((l) => l.includes('scheduler_tick_failed'))).toBe(true);
    scheduler.stop();
  });
});
