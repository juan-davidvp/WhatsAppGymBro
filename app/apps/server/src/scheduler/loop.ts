import { PARAMETERS } from '@gymbro/domain';
import type { Logger } from '../logger.js';

/**
 * Ciclo del planificador (plan técnico §6): un tic al arrancar y luego cada
 * P-096 segundos, en el mismo proceso. Un tic nunca se solapa con el anterior
 * (si aún corre, se salta) y un error se registra sin detener el ciclo.
 */

export interface SchedulerOptions {
  readonly tick: () => Promise<void>;
  readonly logger: Logger;
  /** Solo en pruebas: por defecto P-096. */
  readonly intervalMs?: number;
}

export interface Scheduler {
  /** Corre un tic ahora (si no hay otro en curso). */
  runOnce(): Promise<void>;
  stop(): void;
}

const MS_PER_SECOND = 1000;

export function startScheduler(options: SchedulerOptions): Scheduler {
  const intervalMs = options.intervalMs ?? PARAMETERS.scheduler.intervalSeconds * MS_PER_SECOND;
  let running: Promise<void> | null = null;

  const runOnce = (): Promise<void> => {
    if (running) return running;
    running = options
      .tick()
      .catch((error: unknown) => options.logger.error('scheduler_tick_failed', { error }))
      .finally(() => {
        running = null;
      });
    return running;
  };

  void runOnce();
  const timer = setInterval(() => void runOnce(), intervalMs);
  timer.unref();
  return {
    runOnce,
    stop: () => clearInterval(timer),
  };
}
