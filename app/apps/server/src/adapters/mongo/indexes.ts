import type { Db } from 'mongodb';
import { COLLECTIONS, type IndexSpec } from './schema.js';

/** Crea (o confirma) las colecciones e índices del modelo de datos. Idempotente. */
export async function ensureIndexes(db: Db): Promise<void> {
  for (const [name, specs] of Object.entries(COLLECTIONS) as [string, readonly IndexSpec[]][]) {
    const collection = db.collection(name);
    for (const spec of specs) {
      await collection.createIndex(Object.fromEntries(spec.keys.map((key) => [key, 1])), {
        ...(spec.unique ? { unique: true } : {}),
        ...(spec.expireAfterSeconds !== undefined
          ? { expireAfterSeconds: spec.expireAfterSeconds }
          : {}),
      });
    }
  }
}
