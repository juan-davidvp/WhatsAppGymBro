import { MongoServerError, type Db } from 'mongodb';
import { COLLECTIONS, type IndexSpec } from './schema.js';

/** Códigos de MongoDB: ya existe un índice con esas claves (o ese nombre) y otras opciones. */
const INDEX_OPTIONS_CONFLICT = new Set([85, 86]);

/**
 * Crea (o confirma) las colecciones e índices del modelo de datos. Idempotente.
 * Si un índice cambió de opciones en el modelo (p. ej. `quests` pasó a único en
 * T-063), se borra y se vuelve a crear: solo cambia el índice, no los datos.
 */
export async function ensureIndexes(db: Db): Promise<void> {
  for (const [name, specs] of Object.entries(COLLECTIONS) as [string, readonly IndexSpec[]][]) {
    const collection = db.collection(name);
    for (const spec of specs) {
      const keys = Object.fromEntries(spec.keys.map((key) => [key, 1]));
      const options = {
        ...(spec.unique ? { unique: true } : {}),
        ...(spec.expireAfterSeconds !== undefined
          ? { expireAfterSeconds: spec.expireAfterSeconds }
          : {}),
      };
      try {
        await collection.createIndex(keys, options);
      } catch (error) {
        if (
          !(error instanceof MongoServerError) ||
          !INDEX_OPTIONS_CONFLICT.has(Number(error.code))
        ) {
          throw error;
        }
        await collection.dropIndex(spec.keys.map((key) => `${key}_1`).join('_'));
        await collection.createIndex(keys, options);
      }
    }
  }
}
