import { renderTemplate } from '@gymbro/content';
import type { CallbackAction } from '../bot/callback-data.js';
import type { EventEmitter } from '../events/emitter.js';
import type { Logger } from '../logger.js';
import { templateReply, type Reply } from '../onboarding/onboarding.js';
import type { UserDataEraser, UserRecord } from '../ports/repositories.js';

/**
 * `/borrar_datos` (HU-009-6, RN-DAT-003): dos confirmaciones y borrado total en
 * el momento (muy por debajo del máximo P-065). Después, los eventos del usuario
 * quedan sin seudónimo y se indica cómo borrar el chat en Telegram.
 */

export interface DeletionDeps {
  eraser: UserDataEraser;
  events: EventEmitter;
  logger: Logger;
}

const del = (value: string): CallbackAction => ({ action: 'del', value });

/** Primera confirmación. */
export async function deleteDataCommand(user: UserRecord, deps: DeletionDeps): Promise<Reply[]> {
  await deps.events.emit('deletion_requested', { userId: user.id, timezone: user.timezone });
  return [templateReply('BD-01', del)];
}

export async function answerDeletion(
  user: UserRecord,
  value: string,
  deps: DeletionDeps,
): Promise<Reply[]> {
  switch (value) {
    case 'confirm':
      return [templateReply('BD-02', del)];
    case 'erase':
      try {
        await deps.eraser.eraseUser(user.id);
      } catch (error) {
        deps.logger.error('deletion_failed', { error });
        return [{ text: renderTemplate('BD-05'), buttons: [] }];
      }
      await deps.events.emit('deletion_completed', null);
      return [{ text: renderTemplate('BD-03'), buttons: [] }];
    default:
      return [{ text: renderTemplate('BD-04'), buttons: [] }];
  }
}
