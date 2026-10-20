import { operationalDate } from '@gymbro/domain';
import type { Logger } from '../logger.js';
import type { EventsRepository } from '../ports/repositories.js';
import type { EventName, StudyPhase } from './catalog.js';
import { validateEvent } from './schema.js';

/**
 * Emisor de eventos de medición (T-022, plan de medición). Añade las propiedades
 * comunes, valida el evento (RN-DAT-005, SC-009-3) y lo guarda. Un evento que no
 * cumple el esquema no se guarda: se registra `event_rejected` con su nombre y los
 * motivos, nunca con los valores. Medir nunca rompe la respuesta al usuario.
 */

export type EventProps = Record<string, unknown>;

/** A quién pertenece el evento: su id interno y su zona horaria (para `localDate`). */
export interface EventSubject {
  readonly userId: string;
  readonly timezone: string;
}

export interface EventEmitter {
  emit(name: EventName, subject: EventSubject | null, props?: EventProps): Promise<void>;
}

export interface EventEmitterOptions {
  repository: EventsRepository;
  logger: Logger;
  appVersion: string;
  phase: StudyPhase;
  clock: () => Date;
}

export function createEventEmitter(options: EventEmitterOptions): EventEmitter {
  const { repository, logger, appVersion, phase, clock } = options;
  return {
    async emit(name, subject, props = {}) {
      const at = clock();
      const result = validateEvent({
        userRef: subject?.userId ?? null,
        name,
        at,
        common: {
          localDate: subject ? operationalDate(at, subject.timezone) : null,
          appVersion,
          phase,
        },
        props,
      });
      if (!result.ok) {
        logger.error('event_rejected', { eventName: name, problems: result.problems });
        return;
      }
      try {
        await repository.insert(result.event);
      } catch (error) {
        logger.error('event_store_failed', { eventName: name, error });
      }
    },
  };
}
