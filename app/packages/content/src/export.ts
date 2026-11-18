/**
 * Archivos de `/exportar` (T-090, HU-008-1, RN-INT-002), transcritos de
 * `plantillas-de-mensajes.md` §2.9: un CSV por tema con sus columnas, en orden.
 */
export const EXPORT_CSV = {
  sessions: {
    file: 'sesiones.csv',
    columns: ['fecha', 'sesion', 'version', 'estado', 'inicio', 'fin'],
  },
  sets: {
    file: 'series.csv',
    columns: [
      'fecha_hora',
      'sesion_id',
      'ejercicio',
      'serie',
      'repeticiones',
      'carga_kg',
      'editada',
    ],
  },
  meals: {
    file: 'comidas.csv',
    columns: [
      'fecha',
      'hora',
      'metodo',
      'palmas',
      'manos_ahuecadas',
      'punos',
      'pulgares',
      'proteina_g',
    ],
  },
  days: {
    file: 'dias.csv',
    columns: ['fecha', 'tipo', 'cuenta', 'completo', 'mitad_entreno', 'mitad_comida'],
  },
  achievements: {
    file: 'logros.csv',
    columns: ['fecha_hora', 'codigo', 'valor', 'contexto'],
  },
  measurements: {
    file: 'mediciones.csv',
    columns: ['fecha', 'peso_kg', 'cintura_cm'],
  },
} as const;

export type ExportCsvKey = keyof typeof EXPORT_CSV;

/** Todo lo guardado del usuario, por colección. */
export const EXPORT_JSON_FILE = 'datos.json';

/** Nombre del ZIP: `gymbro-datos-AAAA-MM-DD.zip`. */
export const EXPORT_ZIP_PREFIX = 'gymbro-datos';
