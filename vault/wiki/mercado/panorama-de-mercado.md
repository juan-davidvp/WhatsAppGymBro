---
titulo: Panorama de mercado — apps de fitness, coaching digital y Colombia
tipo: mercado
hito: H0
estado: en-revision
creado: 2026-10-05
actualizado: 2026-10-18
fuentes: [F03, F04, F05, F06, F07, F08, F10, F13, F14, F15, F16, F17, F27, F29, F30, F32, F35, F36, F37, F38, F39, F43, F64, F65, F66, F67, F68, F70, F75, F76, F81]
relacionados: [propuesta-de-valor, benchmark-competitivo, usuario-cabeza-01]
---

# Panorama de mercado

> Actualizado el 2026-10-18: se añade la sección de **Colombia** (mercado inicial supuesto, ADR-016), el dimensionamiento del segmento y la lectura del **canal Telegram**. Las cifras globales se usan para dirección, no para precisión.

## 1. Tamaño global (apps de fitness)

| Firma | Valor 2026 (USD) | Proyección | CAGR | Fuente |
|---|---|---|---|---|
| Research and Markets | 22,36 mil millones | 56,9 mil millones (2030) | 26,3 % | `F03` |
| Grand View Research | 13,9 mil millones | 33,6 mil millones (2033) | 13,4 % | `F04` |
| Future Market Insights | 7,7 mil millones | 25,1 mil millones (2036) | 12,5 % | `F05` |

La dispersión es de casi 3 veces para el mismo año por diferencias de perímetro (Grand View estima incluso un mercado de "entrenador personal con IA" mayor que su propio mercado de apps, `F06`). **Conclusión robusta:** crecimiento de dos dígitos sostenido. No usar una cifra única como TAM.

## 2. Señales de demanda

| Señal | Dato | Fuente |
|---|---|---|
| Demanda de orientación de salud en IA | Más de 230 M de personas consultan semanalmente a ChatGPT sobre salud y bienestar | `F29` |
| Disposición a pagar por coaching digital | Google Health Coach: USD 9,99/mes o USD 99/año (mayo 2026) | `F27` |
| Registro por foto masivo | Cal AI: 15 M de descargas y > USD 30 M anuales; comprada por MyFitnessPal | `F30` |
| Escala del líder en nutrición | MyFitnessPal: ~900 mil descargas y ~USD 13 M al mes (estimación) | `F32` |
| Adopción declarada de IA en fitness | 49 % la usaría a diario según una encuesta de un proveedor (sesgo probable) | `F07` (C) |

## 3. Monetización y retención (Salud y Fitness)

| Indicador | Valor | Fuente |
|---|---|---|
| Conversión mediana descarga → pago (iOS) | 3,5 % | `F13` |
| Conversión de prueba a pago | 35,0 % (la más alta entre categorías) | `F14` |
| Peso de los planes anuales en los ingresos | 60,6 % | `F14` |
| Retención en primera renovación | 30,3 % (la más baja) | `F14` |
| Renovación anual mediana | 25 % | `F15` |
| Duración de prueba con mejor conversión | 5–9 días (46,8 %) | `F17` |
| Retención anual de apps con IA vs. sin IA | 21,1 % vs. 30,7 % | `F16` |
| Retención D30 de apps de Salud y Fitness | ≈ 3–5 % | `F43` (C) |
| Referente de escala (Duolingo, 3T 2025) | 50,5 M usuarios diarios | `F10` |

**Lectura:** la categoría **convierte bien y retiene mal**. Un producto que sostenga la constancia captura la mayor parte del valor.

## 4. Colombia

| Aspecto | Dato | Fuente |
|---|---|---|
| Población | 53,4 M (2026); hombres de 18 a 32 años ≈ 6,66 M | `F65` (cálculo por prorrateo de quinquenios; verificar en DANE) |
| Internet | 41,7 M de usuarios (77,8 % de la población) a fines de 2025 | `F81` |
| Smartphone | 94 % de quienes tienen celular tienen smartphone | `F75` |
| Sistema operativo móvil | Android 78,5 % · iOS 21,5 % (sep-2026) | `F64` |
| Usuarios de gimnasio | Más de 2 M (estimación de la industria, 2024) | `F66` |
| Cadena líder | Smart Fit: > 236 sedes en 63 ciudades y > 500 mil afiliados en Colombia (oct-2026); tercer mercado de la cadena | `F67`, `F68` |
| Mensajería | WhatsApp es la app más usada para mensajes y llamadas | `F75` |
| Telegram | **Sin dato confiable reciente.** La única encuesta pública hallada (2017) lo ubicaba como app principal de solo 1 % | `F76` (C) |

### 4.1 Dimensionamiento del segmento (orden de magnitud)

| Paso | Valor | Base |
|---|---|---|
| Hombres 18–32 | ≈ 6,66 M | `F65` |
| … que van al gym | ≈ 0,5–1,0 M | `[supuesto]` 25–35 % de los > 2 M usuarios de gym (`F66`) o 10–15 % de penetración en el grupo |
| … que entrenan solos y abandonaron antes (SAM) | ≈ 0,25–0,7 M | `[supuesto 50–70 %, validar en H1]` |
| … alcanzables por Telegram | **desconocido** | `[hipótesis H10]` |

**Implicación:** el segmento justifica validar; el canal puede ser el cuello de botella para escalar. Por eso el núcleo del producto es independiente del canal (ADR-015) y H10 se prueba desde el reclutamiento.

## 5. Implicaciones para el producto

1. **Competir por retención:** la categoría ya convierte; la renovación es el problema (`F14`, `F15`).
2. **Plan anual + prueba de 5–9 días** cuando se cobre (Fase 1), en Telegram Stars (`F70`).
3. **IA acotada:** las apps con IA retienen peor a 12 meses (`F16`); el valor no puede depender de la IA.
4. **Android primero** si se construye algo nativo (`F64`).
5. **Gimnasios independientes como canal** de adquisición (la cadena líder ya tiene su propia app con coach y nutrición, `F36`).
