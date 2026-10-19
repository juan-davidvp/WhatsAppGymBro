---
titulo: Flujos de usuario y arquitectura de información del bot de Telegram
tipo: diseno
hito: H2
estado: borrador
creado: 2026-10-18
actualizado: 2026-10-18
fuentes: [F69]
relacionados: [registro-sin-friccion, proactividad-sin-spam, constancia-en-cualquier-lugar, cada-dia-cuenta, objetivos-y-progreso, seguridad-y-cumplimiento, spec-000-vision-fase-0]
---

# Flujos de usuario (bot de Telegram)

> Base para el diseño conversacional estructurado de la Fase 0. El bot **no conversa**: guía con botones y comandos (ADR-006). Los textos definitivos están en [[plantillas-de-mensajes]].

## 1. Arquitectura de información

| Elemento de Telegram | Uso en Gym Bro | Fase |
|---|---|---|
| `/start` (con enlace profundo opcional) | Onboarding | 0 |
| **Teclado persistente** | `🏋️ Hoy` · `🍽️ Comida` · `📈 Progreso` | 0 |
| **Comandos** (menú `/`) | `/hoy` `/plan` `/comida` `/progreso` `/logros` `/ajustes` `/pausa` `/exportar` `/privacidad` `/borrar_datos` `/ayuda` | 0 |
| **Botones en línea** | Todas las decisiones y registros | 0 |
| **Edición de mensajes** | Tarjeta de sesión y registro de comida en un solo mensaje | 0 |
| **Imágenes enviadas por el bot** | Muro de constancia, resumen semanal, logros | 0 |
| **Botón de menú → Mini App** | Progreso interactivo y bitácora (`F69`) | 0 Should / 1 |

## 2. Manejo de lo que el usuario escribe

| Entrada | Ruta |
|---|---|
| Foto | Flujo de comida por foto (Should); si está apagado, sugerir porciones |
| Texto con palabras de riesgo (lista de [[seguridad-y-cumplimiento]]) | **Respuesta de cuidado predefinida** + derivación (RN-SEG-007) — tiene prioridad sobre todo |
| "No puedo", "hoy no", "no alcanzo" | Opciones de "Hoy no puedo" |
| Texto que describe comida | Propuesta de porciones (Could) o teclado de porciones |
| Peso ("68,5") tras `/progreso` → "Registrar peso" | Registro de peso |
| Cualquier otra cosa | Respuesta corta con los botones principales: "Funciono con botones: ¿qué quieres hacer?" |

## 3. Flujos principales

### F1 · Onboarding (≤ 3 min, ≈ 20 toques)

```mermaid
flowchart TD
    A[/start/] --> B[Bienvenida + qué hace y qué no hace]
    B --> C[Privacidad: Telegram guarda el chat · datos opcionales<br/>Acepto / Ver política]
    C --> D{¿Tienes 18 años o más?}
    D -->|No| X[Cierre amable: no disponible]
    D -->|Sí| E[Objetivo: 6 botones]
    E --> F[Nivel: nunca / menos de 6 meses / más]
    F --> G[Días disponibles + hora habitual + lugar]
    G --> H[Minutos por sesión + equipamiento en casa]
    H --> I[Tamizaje previo a la actividad]
    I --> J[Relación con la comida: tamizaje breve]
    J --> K[Peso actual opcional]
    K --> L[Meta propuesta dentro de límites<br/>Aceptar / Más conservadora / Más ambiciosa]
    L --> M[Intensidad de mensajes + horas de silencio]
    M --> N[Resumen + primera sesión: ¿hoy?]
```

### F2 · Día de entreno

```mermaid
sequenceDiagram
    participant M as Motor de mensajes
    participant B as Bot
    participant U as Usuario
    M->>B: plan_listo (60 min antes)
    B->>U: Torso A · 45 min [Gym] [Casa] [Exprés] [Hoy no puedo]
    U->>B: [Gym]
    B->>U: Tarjeta de sesión (serie 1 precargada)
    loop Cada serie
        U->>B: ✅ (o ajusta y confirma)
        B->>U: Edita la tarjeta: siguiente serie
    end
    U->>B: 🏁 Terminar
    B->>U: Sumaste 14 series · 1 récord · Día que cuenta n.º 47 · 🔥 9 · Semana L✅ M✅ X⭐ J⬜
```

### F3 · Registro de comida

```mermaid
flowchart TD
    A[🍽️ Comida] --> B{Método}
    B -->|Lo de siempre| C[Lista de frecuentes → 1 toque]
    B -->|Porciones| D[Teclado de porciones → Guardar]
    B -->|Foto| E[Propuesta de porciones → Confirmar / Ajustar]
    C --> F[Proteína del día ▓▓▓▓▓▓░░ + estado del día]
    D --> F
    E --> F
```

### F4 · Día de descanso
Mensaje de la mañana solo si el presupuesto lo permite y el usuario lo tiene activado: *"Hoy es descanso: tu misión es la proteína o 20 minutos de caminata."* El día cuenta cuando se cumple cualquiera de las dos (RN-DQC-003).

### F5 · Día fallado → regreso

```mermaid
flowchart TD
    A[Día de entreno sin sesión] --> B{¿Tiene comodín?}
    B -->|Sí| C[Comodín aplicado automáticamente<br/>la racha sigue]
    B -->|No| D[Racha a 0 · total acumulado intacto]
    D --> E[Misión de regreso disponible 48 h<br/>exprés + proteína]
    E -->|Cumplida| F[Racha reparada + bonificación de regreso]
    C --> G[Siguiente día con plan_listo normal]
```

### F6 · Objetivo cumplido → mantenimiento
Celebración + logro en la bitácora + capítulo cerrado → botones [Mantener] [Nueva meta]. Sin respuesta en 7 días → mantenimiento (RN-MAN-001).

### F7 · Resumen semanal (domingo 19:00)
Imagen del muro + semana vs. semana anterior + misiones nuevas + plan de la próxima semana con [Ver plan] [Ajustar días].

### F8 · Señal de riesgo
Texto con palabras de alerta → respuesta de cuidado predefinida (sin IA) → recursos y sugerencia de hablar con un profesional → registro del evento solo con su categoría (RN-SEG-007, RN-DAT-005).

## 4. Inventario de mensajes clave

| ID | Mensaje | Spec |
|---|---|---|
| MS-01 | Bienvenida | [[spec-001-onboarding-y-objetivo]] |
| MS-02 | Privacidad y consentimiento | [[spec-009-seguridad-y-privacidad]] |
| MS-03 | Meta propuesta | [[spec-001-onboarding-y-objetivo]] |
| MS-04 | Plan semanal | [[spec-002-plan-y-sesion-del-dia]] |
| MS-05 | Plan listo | [[spec-007-proactividad-y-mensajes]] |
| MS-06 | Tarjeta de sesión | [[spec-003-registro-de-entrenamiento]] |
| MS-07 | Cierre de sesión | [[spec-005-dia-que-cuenta-y-gamificacion]] |
| MS-08 | Registro de comida | [[spec-004-registro-de-nutricion]] |
| MS-09 | Resumen semanal | [[spec-006-progreso-logros-y-mantenimiento]] |
| MS-10 | Bitácora | [[spec-006-progreso-logros-y-mantenimiento]] |
| MS-11 | Respuesta de cuidado | [[spec-009-seguridad-y-privacidad]] |
