import { EXPORT_ZIP_PREFIX, renderTemplate, templateById } from '@gymbro/content';
import { operationalDate } from '@gymbro/domain';
import type { CallbackAction } from '../bot/callback-data.js';
import type { EventEmitter } from '../events/emitter.js';
import type { Logger } from '../logger.js';
import { button, type Reply } from '../onboarding/replies.js';
import type { UserDataExporter, UserRecord } from '../ports/repositories.js';
import { exportFiles } from './export-files.js';
import { createZip } from './zip.js';

/**
 * `/exportar` (T-090, HU-008-1, RN-INT-002, FR-008-01): con una confirmación, el
 * usuario recibe por Telegram un ZIP generado en el momento. El archivo no se
 * guarda en el servidor.
 */

export interface ExportDeps {
  exporter: UserDataExporter;
  events: EventEmitter;
  clock: () => Date;
  logger: Logger;
}

const ex = (value: string): CallbackAction => ({ action: 'ex', value });
const BYTES_PER_KB = 1024;

/** EX-01: pide confirmar antes de generar el archivo. */
export async function exportCommand(user: UserRecord, deps: ExportDeps): Promise<Reply[]> {
  await deps.events.emit('export_requested', { userId: user.id, timezone: user.timezone }, {});
  const [generate = '', cancel = ''] = templateById('EX-01').buttons;
  return [
    {
      text: renderTemplate('EX-01'),
      buttons: [button(generate, ex('go')), button(cancel, ex('no'))],
      rowSize: 2,
    },
  ];
}

/** Botones de EX-01. `deliver` envía el archivo: solo si llega se registra como entregado. */
export async function answerExport(
  user: UserRecord,
  value: string,
  deps: ExportDeps,
  deliver: (reply: Reply) => Promise<void>,
): Promise<Reply[]> {
  if (value !== 'go') return [{ text: renderTemplate('EX-03'), buttons: [], edit: true }];
  const startedAt = deps.clock();
  try {
    const files = exportFiles(await deps.exporter.collect(user.id), startedAt);
    const bytes = createZip(files, startedAt);
    const date = operationalDate(startedAt, user.timezone);
    await deliver({
      text: renderTemplate('EX-02'),
      buttons: [],
      document: { name: `${EXPORT_ZIP_PREFIX}-${date}.zip`, bytes },
    });
    await deps.events.emit(
      'export_delivered',
      { userId: user.id, timezone: user.timezone },
      {
        files: files.length,
        sizeKb: Math.ceil(bytes.length / BYTES_PER_KB),
        durationMs: Math.max(0, deps.clock().getTime() - startedAt.getTime()),
      },
    );
    return [];
  } catch (error) {
    deps.logger.error('export_failed', { userId: user.id, error });
    return [{ text: renderTemplate('EX-04'), buttons: [], edit: true }];
  }
}
