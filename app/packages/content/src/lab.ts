/** Textos variables de `/lab` (T-102), transcritos de `plantillas-de-mensajes.md` §2.10. */
export const LAB_NO_DATA = 'sin datos';

export const LAB_MEAL_METHOD_NAMES: Readonly<Record<string, string>> = {
  portions: 'Porciones',
  favorite: 'Favorita',
  repeat: 'Repetir',
  photo: 'Foto',
  text: 'Texto',
};

export const labDecimal = (value: number): string => String(value).replace('.', ',');
export const labPercent = (value: number): string => `${value} %`;
export const labMealEntry = (method: string, seconds: number): string =>
  `${LAB_MEAL_METHOD_NAMES[method] ?? method} ${seconds} s`;
