#!/usr/bin/env python3
"""Genera vault/output/mapa-de-trazabilidad.canvas (JSON Canvas 1.0) a partir de las carpetas de la bóveda.

Uso:  python3 herramientas/generar_mapa_trazabilidad.py
Se vuelve a ejecutar cuando se crean, renombran o archivan páginas (lo recuerda el lint).
"""
from __future__ import annotations

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BOVEDA = RAIZ / "vault"
SALIDA = BOVEDA / "output" / "mapa-de-trazabilidad.canvas"

ANCHO, ALTO, SEP = 320, 60, 16          # tamaño de cada nota y separación vertical
PAD_ARRIBA, PAD_ABAJO, PAD_LADO = 46, 24, 20
COLUMNA = 460                            # distancia horizontal entre capas
SEP_GRUPOS = 40

# Colores predefinidos de Obsidian: 1 rojo, 2 naranja, 3 amarillo, 4 verde, 5 cian, 6 morado
COLUMNAS = [
    ("Raw · fuentes inmutables", "2", [("Observaciones del PO", ["raw/feedback/*.md"])]),
    ("Wiki · el porqué", "5", [
        ("Producto", ["wiki/producto/*.md"]),
        ("Usuarios", ["wiki/usuarios/*.md"]),
        ("Experiencia", ["wiki/experiencia/*.md"]),
        ("Conceptos", ["wiki/conceptos/*.md"]),
        ("Mercado y competencia", ["wiki/mercado/*.md", "wiki/competencia/*.md"]),
        ("Decisiones y fuentes", ["wiki/decisiones/*.md", "wiki/fuentes/*.md"]),
    ]),
    ("Output · núcleo SDD", "4", [("Reglas y principios", [
        "output/sdd/constitucion.md", "output/sdd/reglas-de-negocio.md",
        "output/sdd/parametros.md", "output/sdd/glosario.md"])]),
    ("Output · specs", "6", [("Specs de la Fase 0", ["output/sdd/specs/*.md"])]),
    ("Output · plan, contenido y tareas", "4", [
        ("Plan", ["output/sdd/plan/*.md"]),
        ("Contenido", ["output/sdd/contenido/*.md"]),
        ("Tareas", ["output/sdd/tareas/*.md"]),
    ]),
]

CODIGO = [
    ("cod-dominio", "**`app/packages/domain`**\nUna prueba por `RN` · valores solo en `parameters.ts`"),
    ("cod-contenido", "**`app/packages/content`**\nPlantillas, logros, ejercicios y alimentos validados con zod"),
    ("cod-servidor", "**`app/apps/server`**\nBot (grammY), planificador, casos de uso, adaptadores"),
    ("cod-eventos", "**Eventos → métricas**\nM00–M08 · G01–G06 validan las hipótesis H01–H14"),
]

# (desde, hacia, etiqueta). Los nombres son nombres de archivo sin extensión o ids de grupo/nodo.
ARISTAS = [
    ("FB-001_2026-10-18_observaciones-po", "propuesta-de-valor", "FB-001-01…22"),
    ("registro-de-fuentes", "grupo-Producto", "F##"),
    ("propuesta-de-valor", "registro-de-decisiones", "ADR"),
    ("grupo-Experiencia", "reglas-de-negocio", "porqué → reglas"),
    ("registro-de-decisiones", "constitucion", "principios"),
    ("registro-de-decisiones", "reglas-de-negocio", "ADR → RN"),
    ("reglas-de-negocio", "parametros", "P-###"),
    ("reglas-de-negocio", "grupo-Specs de la Fase 0", "RN citadas"),
    ("grupo-Specs de la Fase 0", "tareas-fase-0", "HU → T"),
    ("grupo-Plan", "tareas-fase-0", ""),
    ("tareas-fase-0", "cod-servidor", "T → commits"),
    ("reglas-de-negocio", "cod-dominio", "prueba por RN"),
    ("parametros", "cod-dominio", "parameters.ts"),
    ("grupo-Contenido", "cod-contenido", ""),
    ("plan-de-medicion", "cod-eventos", "eventos"),
    ("cod-eventos", "propuesta-de-valor", "valida H##"),
]


def archivos(patrones: list[str]) -> list[Path]:
    vistos: list[Path] = []
    for patron in patrones:
        for ruta in sorted(BOVEDA.glob(patron)):
            if ruta not in vistos:
                vistos.append(ruta)
    return vistos


def generar() -> dict:
    nodos: list[dict] = []
    ids: dict[str, str] = {}

    nodos.append({
        "id": "inicio", "type": "text", "x": 0, "y": -200, "width": 640, "height": 120, "color": "3",
        "text": "## Mapa de trazabilidad · Gym Bro\nFB / F## → wiki → ADR → RN + P → SPEC → T → prueba con el ID de la RN → evento M##.\nEmpieza en [[inicio]] · Regenerar: `python3 herramientas/generar_mapa_trazabilidad.py`",
    })

    x = 0
    for titulo_col, color, grupos in COLUMNAS:
        y = 0
        for titulo_grupo, patrones in grupos:
            rutas = archivos(patrones)
            if not rutas:
                continue
            alto_grupo = PAD_ARRIBA + len(rutas) * ALTO + (len(rutas) - 1) * SEP + PAD_ABAJO
            gid = f"grupo-{titulo_grupo}"
            ids[gid] = gid
            nodos.append({"id": gid, "type": "group", "x": x, "y": y, "width": ANCHO + 2 * PAD_LADO,
                          "height": alto_grupo, "color": color, "label": f"{titulo_col} — {titulo_grupo}"})
            yy = y + PAD_ARRIBA
            for ruta in rutas:
                rel = ruta.relative_to(BOVEDA).as_posix()
                nid = f"n-{ruta.stem}"
                ids[ruta.stem] = nid
                nodos.append({"id": nid, "type": "file", "file": rel, "x": x + PAD_LADO, "y": yy,
                              "width": ANCHO, "height": ALTO})
                yy += ALTO + SEP
            y += alto_grupo + SEP_GRUPOS
        x += COLUMNA

    alto_cod = PAD_ARRIBA + len(CODIGO) * 100 + (len(CODIGO) - 1) * SEP + PAD_ABAJO
    nodos.append({"id": "grupo-codigo", "type": "group", "x": x, "y": 0, "width": ANCHO + 2 * PAD_LADO,
                  "height": alto_cod, "color": "3", "label": "Código · ../app (Claude Code)"})
    yy = PAD_ARRIBA
    for nid, texto in CODIGO:
        ids[nid] = nid
        nodos.append({"id": nid, "type": "text", "text": texto, "x": x + PAD_LADO, "y": yy,
                      "width": ANCHO, "height": 100})
        yy += 100 + SEP

    aristas = []
    for i, (desde, hacia, etiqueta) in enumerate(ARISTAS, start=1):
        if desde not in ids or hacia not in ids:
            raise SystemExit(f"Arista con nodo inexistente: {desde} → {hacia}")
        hacia_atras = desde == "cod-eventos"
        arista = {"id": f"e{i:02d}", "fromNode": ids[desde], "toNode": ids[hacia],
                  "fromSide": "bottom" if hacia_atras else "right",
                  "toSide": "bottom" if hacia_atras else "left", "toEnd": "arrow"}
        if etiqueta:
            arista["label"] = etiqueta
        aristas.append(arista)
    return {"nodes": nodos, "edges": aristas}


if __name__ == "__main__":
    lienzo = generar()
    SALIDA.write_text(json.dumps(lienzo, ensure_ascii=False, indent="\t") + "\n", encoding="utf-8")
    print(f"{SALIDA.relative_to(RAIZ)}: {len(lienzo['nodes'])} nodos, {len(lienzo['edges'])} aristas")
