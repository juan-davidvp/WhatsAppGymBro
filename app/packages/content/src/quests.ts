/**
 * Rótulos de las misiones semanales (RN-GAM-008) para MI-02, los mismos de MI-01.
 * Transcritos de la nota de MI-02 en `plantillas-de-mensajes.md` §2. Las claves
 * son los `QuestKind` del dominio.
 */
export const QUEST_LABELS = {
  TRAINING: 'Sesiones',
  NUTRITION: 'Días con la mitad de comida',
  CONSISTENCY: 'Días que cuentan',
} as const;

export type QuestLabelKind = keyof typeof QUEST_LABELS;
