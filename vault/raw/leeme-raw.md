---
titulo: Léeme de la capa raw — fuentes crudas
tipo: raw-indice
hito: H0
estado: vigente
creado: 2026-10-05
actualizado: 2026-10-18
fuentes: []
relacionados: [index, registro-de-fuentes]
---

# raw/ — Fuentes crudas (capa inmutable)

Esta carpeta guarda los **originales**: observaciones del PO, PDF, capturas, transcripciones de entrevistas, notas de campo y exportaciones de datos. El agente **lee** estos archivos pero **nunca los modifica, renombra ni borra** (`vault/CLAUDE.md` §2). Este léeme es la única nota estructural de la carpeta (antes `README.md`; se renombró el 2026-10-18 porque los nombres deben ser únicos en la bóveda).

## Carpetas y nombres

```
feedback/FB-###_AAAA-MM-DD_tema.md       # observaciones del PO, literales + desglose FB-###-## (creado una sola vez)
investigacion/F##_titulo-corto.ext       # fuentes externas registradas en wiki/fuentes/registro-de-fuentes.md
entrevistas/ENT-##_AAAA-MM-DD_alias.md   # transcripciones de entrevistas (H1), anonimizadas
investigacion/N1-semana-##.csv           # datos del protocolo N-de-1 (H4)
adjuntos/                                # imágenes y archivos que Obsidian adjunta a las notas
```

## Contenido actual

| Archivo | Qué es |
|---|---|
| [[FB-001_2026-10-18_observaciones-po]] | Observaciones del PO sobre la propuesta v0.1 (FB-001-01 a FB-001-22) y la corrección de canal: el producto es un bot de Telegram |

## Fuentes públicas recomendadas para conservar

Documentos de acceso abierto que sostienen decisiones (descargar y guardar con su ID en `investigacion/`):

| ID | Documento |
|---|---|
| F10 / F11 | Cartas a accionistas de Duolingo |
| F21 | Singh et al., *npj Digital Medicine* 2023 |
| F25 | Mazeas et al., JMIR 2022 |
| F37 | Strain et al., *Lancet Global Health* 2024 |
| F40 | Texto de la Ley 1581 de 2012 |
| F45 | Lally et al. 2010, formación de hábitos |
| F19 | Artículo de *Nutrients* 2025 (pendiente de verificar) |

## Privacidad

- Las transcripciones de entrevistas se guardan **anonimizadas** (alias, sin datos de contacto).
- No guardar aquí datos de salud de terceros sin su autorización explícita.
- Los datos del N-de-1 son datos de salud del fundador: si el repositorio se publica o se comparte, excluir `raw/entrevistas/` y los archivos `N1-*` del control de versiones remoto (ver `.gitignore` en la raíz).
