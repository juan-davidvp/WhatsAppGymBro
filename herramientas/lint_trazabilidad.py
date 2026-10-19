#!/usr/bin/env python3
"""Lint de trazabilidad de Gym Bro (bóveda de Obsidian + paquete SDD + código).

Uso (desde cualquier carpeta):
    python3 herramientas/lint_trazabilidad.py              # revisa la bóveda y las instrucciones de Claude Code
    python3 herramientas/lint_trazabilidad.py --codigo     # + reglas con prueba y parámetros en parameters.ts
    python3 herramientas/lint_trazabilidad.py --corregir   # completa la lista `fuentes` del frontmatter

Sale con código 1 si hay errores (sirve para integración continua). Solo usa la biblioteca estándar.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BOVEDA = RAIZ / "vault"
APP = RAIZ / "app"
SDD = BOVEDA / "output" / "sdd"

EXCLUIR_CARPETAS = {".obsidian", ".trash", "node_modules", ".git"}
NAVEGACION = {"index", "log", "inicio", "leeme-output", "leeme-raw"}
ESTADOS = {"borrador", "en-revision", "aprobado", "implementado", "obsoleto", "vigente"}
CLAVES_WIKI = ["titulo", "tipo", "hito", "estado", "creado", "actualizado", "fuentes", "relacionados"]
CLAVES_OUTPUT = CLAVES_WIKI + ["version", "deriva_de"]
DIAS_VIGENCIA = 180
RANGO_MAXIMO = 150

# Identificadores: grupo 1 = base, grupo 2 = número final
RE_ID = {
    "RN": re.compile(r"\b(RN-[A-Z]{3,4}-)(\d{3})\b"),
    "P": re.compile(r"\b(P-)(\d{3})\b"),
    "HU": re.compile(r"\b(HU-\d{3}-)(\d{1,2})\b"),
    "FR": re.compile(r"\b(FR-\d{3}-)(\d{2})\b"),
    "SC": re.compile(r"\b(SC-\d{3}-)(\d{1,2})\b"),
    "FB": re.compile(r"\b(FB-\d{3}-)(\d{2})\b"),
    "T": re.compile(r"\b(T-)(\d{3})\b"),
    "ADR": re.compile(r"\b(ADR-)(\d{3})\b"),
    "SPEC": re.compile(r"\b(SPEC-)(\d{3})\b"),
}
RE_FUENTE = re.compile(r"\bF(\d{2})\b")
RE_RANGO = re.compile(r"\s*(?:a|al|–|—|…|\.\.)\s*")
RE_ENLACE = re.compile(r"(!?)\[\[([^\]\|#]*)(#[^\]\|]*)?(?:\|[^\]]*)?\]\]")
RE_FENCE = re.compile(r"^(```|~~~).*?^\1[ \t]*$", re.S | re.M)
RE_CODIGO_LINEA = re.compile(r"`[^`\n]*`")


@dataclass
class Nota:
    ruta: Path
    texto: str
    fm: dict
    cuerpo: str

    @property
    def rel(self) -> str:
        return self.ruta.relative_to(RAIZ).as_posix()

    @property
    def nombre(self) -> str:
        return self.ruta.stem

    @property
    def capa(self) -> str:
        partes = self.ruta.relative_to(BOVEDA).parts
        return partes[0] if len(partes) > 1 else "raiz"

    @property
    def archivada(self) -> bool:
        return "_archivo" in self.ruta.parts

    @property
    def plantilla(self) -> bool:
        return "_plantillas" in self.ruta.parts


@dataclass
class Informe:
    errores: list[str] = field(default_factory=list)
    avisos: list[str] = field(default_factory=list)
    info: list[str] = field(default_factory=list)

    def error(self, tipo: str, msg: str) -> None:
        self.errores.append(f"[{tipo}] {msg}")

    def aviso(self, tipo: str, msg: str) -> None:
        self.avisos.append(f"[{tipo}] {msg}")


# ---------------------------------------------------------------- lectura

def leer_frontmatter(texto: str) -> tuple[dict, str]:
    """Frontmatter simple: `clave: valor` o `clave: [a, b]` (el formato que usa la bóveda)."""
    if not texto.startswith("---\n"):
        return {}, texto
    fin = texto.find("\n---", 4)
    if fin == -1:
        return {}, texto
    bloque, cuerpo = texto[4:fin], texto[fin + 4:]
    fm: dict = {}
    for linea in bloque.splitlines():
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", linea)
        if not m:
            continue
        clave, valor = m.group(1), m.group(2).strip()
        if valor.startswith("[") and valor.endswith("]"):
            fm[clave] = [v.strip().strip("'\"") for v in valor[1:-1].split(",") if v.strip()]
        else:
            fm[clave] = valor.strip("'\"")
    return fm, cuerpo


def cargar_notas() -> list[Nota]:
    notas = []
    for ruta in sorted(BOVEDA.rglob("*.md")):
        if EXCLUIR_CARPETAS & set(ruta.parts):
            continue
        texto = ruta.read_text(encoding="utf-8")
        fm, cuerpo = leer_frontmatter(texto)
        notas.append(Nota(ruta, texto, fm, cuerpo))
    return notas


def archivos_extra() -> list[Path]:
    """Instrucciones fuera de la bóveda cuyas referencias a IDs también se verifican."""
    extra = [RAIZ / "CLAUDE.md", RAIZ / "README.md"]
    if (RAIZ / ".claude").exists():
        extra += sorted((RAIZ / ".claude").rglob("*.md"))
    return [p for p in extra if p.exists()]


def sin_bloques(texto: str) -> str:
    """Quita los bloques de código conservando el número de líneas."""
    return RE_FENCE.sub(lambda m: "\n" * m.group(0).count("\n"), texto)


def sin_codigo(texto: str) -> str:
    return RE_CODIGO_LINEA.sub("", sin_bloques(texto))


# ---------------------------------------------------------------- identificadores

def ids_en(texto: str, tipo: str, expandir: bool = True) -> set[str]:
    """IDs citados. Siempre incluye listas con barra (RN-DAT-001/002, HU-009-2/3).
    Con `expandir`, también los rangos (RN-OBJ-001 a 013, P-001–P-003, FB-001-01…22)."""
    encontrados: set[str] = set()
    for m in RE_ID[tipo].finditer(texto):
        base, num = m.group(1), m.group(2)
        ancho = len(num)
        encontrados.add(base + num)
        resto = texto[m.end():m.end() + 40]
        pos = 0
        while (b := re.match(rf"/(\d{{{ancho}}})\b", resto[pos:])):
            encontrados.add(base + b.group(1))
            pos += b.end()
        if expandir and (r := RE_RANGO.match(resto)):
            m2 = re.match(rf"(?:{re.escape(base)})?(\d{{{ancho}}})\b", resto[r.end():])
            if m2 and 0 < int(m2.group(1)) - int(num) <= RANGO_MAXIMO:
                for k in range(int(num), int(m2.group(1)) + 1):
                    encontrados.add(f"{base}{k:0{ancho}d}")
    return encontrados


def definidos(nota: Nota | None, tipo: str, inf: Informe) -> set[str]:
    """IDs definidos como primera celda de una fila de tabla o como encabezado de sección."""
    if not nota:
        return set()
    patron = RE_ID[tipo].pattern.replace(r"\b(", "(", 1)
    en_tablas, en_titulos = [], []
    for linea in nota.cuerpo.splitlines():
        if (m := re.match(rf"^\|\s*\*{{0,2}}{patron}", linea)):
            en_tablas.append(m.group(1) + m.group(2))
        elif (m := re.match(rf"^#+\s+{patron}", linea)):
            en_titulos.append(m.group(1) + m.group(2))
    for lista in (en_tablas, en_titulos):
        for d in sorted({x for x in lista if lista.count(x) > 1}):
            inf.error("id-duplicado", f"{nota.rel}: {d} definido más de una vez")
    return set(en_tablas) | set(en_titulos)


# ---------------------------------------------------------------- verificaciones

def verificar_nombres(notas: list[Nota], inf: Informe) -> dict[str, Nota]:
    por_nombre: dict[str, list[Nota]] = defaultdict(list)
    for n in notas:
        por_nombre[n.nombre].append(n)
    for nombre, lista in por_nombre.items():
        if len(lista) > 1:
            inf.error("nombre-duplicado", f"'{nombre}' existe en: " + ", ".join(x.rel for x in lista))
        nota = lista[0]
        if re.search(r"[A-ZÁÉÍÓÚÑáéíóúñ ]", nombre) and nombre != "CLAUDE" and nota.capa != "raw" \
                and not nota.plantilla:
            inf.aviso("nombre", f"{nota.rel}: usar kebab-case sin tildes ni mayúsculas")
    return {k: v[0] for k, v in por_nombre.items()}


def paginas_pendientes(por_nombre: dict[str, Nota]) -> set[str]:
    indice = por_nombre.get("index")
    if not indice:
        return set()
    m = re.search(r"^## Páginas pendientes.*?(?=^## |\Z)", indice.cuerpo, re.S | re.M)
    return {e.group(2).strip() for e in RE_ENLACE.finditer(m.group(0))} if m else set()


def encabezados(nota: Nota) -> set[str]:
    return {re.sub(r"[*_`]", "", l.lstrip("#").strip()).lower()
            for l in sin_bloques(nota.cuerpo).splitlines() if re.match(r"^#+\s", l)}


def verificar_enlaces(notas: list[Nota], por_nombre: dict[str, Nota], inf: Informe) -> dict[str, int]:
    pendientes = paginas_pendientes(por_nombre)
    otros = {p.name for p in BOVEDA.rglob("*") if p.is_file() and p.suffix != ".md"
             and not EXCLUIR_CARPETAS & set(p.parts)}
    entrantes: dict[str, int] = defaultdict(int)
    for n in notas:
        if n.plantilla:
            continue
        for num, linea in enumerate(sin_codigo(n.texto).splitlines(), start=1):
            for m in RE_ENLACE.finditer(linea):
                destino = m.group(2).strip().split("/")[-1]
                ancla = (m.group(3) or "")[1:].strip()
                if not destino:
                    continue
                if destino.endswith(".md"):
                    destino = destino[:-3]
                if "." in destino and destino not in por_nombre:
                    if destino in otros:
                        entrantes[destino] += 1
                    else:
                        inf.error("enlace-roto", f"{n.rel}:{num} → [[{destino}]] (archivo inexistente)")
                    continue
                if destino in por_nombre:
                    if destino != n.nombre:
                        entrantes[destino] += 1
                    if ancla and not ancla.startswith("^") and \
                            re.sub(r"[*_`]", "", ancla).lower() not in encabezados(por_nombre[destino]):
                        inf.aviso("seccion", f"{n.rel}:{num} → [[{destino}#{ancla}]] (sección no encontrada)")
                elif destino in pendientes:
                    continue
                elif n.archivada or n.capa == "raw":
                    inf.aviso("enlace-roto", f"{n.rel}:{num} → [[{destino}]] (nota archivada o cruda; no se corrige)")
                else:
                    inf.error("enlace-roto", f"{n.rel}:{num} → [[{destino}]]")
    for lienzo in sorted(BOVEDA.rglob("*.canvas")):
        rel = lienzo.relative_to(RAIZ).as_posix()
        try:
            datos = json.loads(lienzo.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            inf.error("lienzo", f"{rel}: JSON inválido ({e})")
            continue
        ids = [nodo.get("id") for nodo in datos.get("nodes", [])]
        if len(ids) != len(set(ids)):
            inf.error("lienzo", f"{rel}: ids de nodos repetidos")
        for nodo in datos.get("nodes", []):
            if nodo.get("type") == "file" and not (BOVEDA / nodo.get("file", "")).exists():
                inf.error("lienzo", f"{rel}: el nodo apunta a {nodo.get('file')}, que no existe "
                                    "(regenerar con herramientas/generar_mapa_trazabilidad.py)")
        for arista in datos.get("edges", []):
            if arista.get("fromNode") not in ids or arista.get("toNode") not in ids:
                inf.error("lienzo", f"{rel}: la arista {arista.get('id')} usa un nodo inexistente")
        en_lienzo = {Path(nd["file"]).as_posix() for nd in datos.get("nodes", []) if nd.get("type") == "file"}
        for n in notas:
            relv = n.ruta.relative_to(BOVEDA).as_posix()
            if n.capa in {"wiki", "output"} and not n.archivada and n.nombre not in NAVEGACION \
                    and relv not in en_lienzo and lienzo.stem == "mapa-de-trazabilidad":
                inf.aviso("lienzo", f"{rel}: falta {relv} (regenerar el lienzo)")
    return entrantes


def verificar_frontmatter(notas: list[Nota], por_nombre: dict[str, Nota], inf: Informe, hoy: dt.date) -> None:
    pendientes = paginas_pendientes(por_nombre)
    existentes = set(por_nombre) | {p.name for p in BOVEDA.rglob("*.canvas")}
    for n in notas:
        if n.capa not in {"wiki", "output"} or n.archivada or n.plantilla:
            continue
        requeridas = CLAVES_OUTPUT if n.capa == "output" else CLAVES_WIKI
        faltan = [c for c in requeridas if c not in n.fm]
        if faltan:
            inf.error("frontmatter", f"{n.rel}: faltan {', '.join(faltan)}")
        estado = n.fm.get("estado")
        if estado and estado not in ESTADOS:
            inf.aviso("frontmatter", f"{n.rel}: estado '{estado}' no reconocido ({', '.join(sorted(ESTADOS))})")
        for clave in ("deriva_de", "relacionados"):
            valores = n.fm.get(clave) if isinstance(n.fm.get(clave), list) else []
            for destino in valores:
                if destino not in existentes and destino not in pendientes:
                    reportar = inf.error if clave == "deriva_de" else inf.aviso
                    reportar("frontmatter", f"{n.rel}: {clave} → '{destino}' no existe")
        fecha = n.fm.get("actualizado")
        try:
            if fecha and (hoy - dt.date.fromisoformat(fecha)).days > DIAS_VIGENCIA:
                inf.aviso("vigencia", f"{n.rel}: actualizado hace más de {DIAS_VIGENCIA} días ({fecha})")
        except ValueError:
            inf.aviso("frontmatter", f"{n.rel}: fecha 'actualizado' inválida ({fecha})")


def verificar_huerfanas(notas: list[Nota], entrantes: dict[str, int], inf: Informe) -> None:
    for n in notas:
        if n.capa in {"wiki", "output"} and not n.archivada and n.nombre not in NAVEGACION \
                and entrantes.get(n.nombre, 0) == 0:
            inf.aviso("huerfana", f"{n.rel}: ninguna nota la enlaza")


def verificar_fuentes(notas: list[Nota], por_nombre: dict[str, Nota], inf: Informe, corregir: bool) -> None:
    registro = por_nombre.get("registro-de-fuentes")
    if not registro:
        inf.error("fuentes", "no existe wiki/fuentes/registro-de-fuentes.md")
        return
    lista = [f"F{m.group(1)}" for m in re.finditer(r"^\|\s*F(\d{2})\s*\|", registro.cuerpo, re.M)]
    registradas = set(lista)
    for f in sorted({x for x in lista if lista.count(x) > 1}):
        inf.error("fuentes", f"{f} registrada más de una vez")
    citadas_total: set[str] = set()
    corregidas = 0
    orden = lambda x: int(x[1:]) if x[1:].isdigit() else 999  # noqa: E731
    for n in notas:
        if n.nombre == "registro-de-fuentes" or n.plantilla:
            continue
        citadas = {f"F{m.group(1)}" for m in RE_FUENTE.finditer(sin_bloques(n.cuerpo))}
        citadas_total |= citadas
        for f in sorted(citadas - registradas, key=orden):
            inf.error("fuente-sin-registrar", f"{n.rel}: {f}")
        if n.capa in {"wiki", "output"} and not n.archivada and n.nombre not in NAVEGACION \
                and isinstance(n.fm.get("fuentes"), list):
            faltan = sorted((citadas & registradas) - set(n.fm["fuentes"]), key=orden)
            if not faltan:
                continue
            if corregir:
                nuevas = sorted(set(n.fm["fuentes"]) | set(faltan), key=orden)
                texto = re.sub(r"^fuentes:.*$", f"fuentes: [{', '.join(nuevas)}]", n.texto, count=1, flags=re.M)
                n.ruta.write_text(texto, encoding="utf-8")
                corregidas += 1
            else:
                inf.aviso("fuentes-frontmatter",
                          f"{n.rel}: citadas en el texto y ausentes en `fuentes`: {', '.join(faltan)} (usar --corregir)")
    if corregidas:
        inf.info.append(f"--corregir: lista `fuentes` completada en {corregidas} notas")
    sin_uso = sorted(registradas - citadas_total, key=orden)
    inf.info.append(f"Fuentes: {len(registradas)} registradas · {len(citadas_total & registradas)} citadas"
                    + (f" · sin citar: {', '.join(sin_uso)}" if sin_uso else ""))


def verificar_ids(notas: list[Nota], por_nombre: dict[str, Nota], inf: Informe) -> dict[str, set[str]]:
    specs = [n for n in notas if n.ruta.parent == SDD / "specs"]
    tabla: dict[str, set[str]] = {
        "RN": definidos(por_nombre.get("reglas-de-negocio"), "RN", inf),
        "P": definidos(por_nombre.get("parametros"), "P", inf),
        "T": definidos(por_nombre.get("tareas-fase-0"), "T", inf),
        "ADR": definidos(por_nombre.get("registro-de-decisiones"), "ADR", inf),
        "HU": set(), "FR": set(), "SC": set(), "FB": set(), "SPEC": set(),
    }
    for s in specs:
        for tipo in ("HU", "FR", "SC"):
            tabla[tipo] |= definidos(s, tipo, inf)
        if s.fm.get("id"):
            tabla["SPEC"].add(s.fm["id"])
    for n in notas:
        if n.ruta.parent == BOVEDA / "raw" / "feedback":
            tabla["FB"] |= definidos(n, "FB", inf)

    # 1. Toda referencia explícita apunta a algo definido (bóveda + instrucciones de Claude Code)
    textos = [(n.rel, n.nombre, n.cuerpo + "\n" + " ".join(map(str, n.fm.values())))
              for n in notas if not n.plantilla and not n.archivada]
    textos += [(p.relative_to(RAIZ).as_posix(), p.stem, p.read_text(encoding="utf-8")) for p in archivos_extra()]
    citado_fuera: dict[str, set[str]] = defaultdict(set)
    for rel, nombre, texto in textos:
        limpio = sin_bloques(texto)
        for tipo, conjunto in tabla.items():
            if not conjunto:
                continue
            for i in sorted(ids_en(limpio, tipo, expandir=False) - conjunto):
                inf.error("id-inexistente", f"{rel}: {i}")
        if nombre != "parametros":
            citado_fuera["P"] |= ids_en(limpio, "P")

    # 2. Cobertura de la cadena
    en_specs: set[str] = set()
    for s in specs:
        en_specs |= ids_en(sin_bloques(s.cuerpo), "RN")
    for r in sorted(tabla["RN"] - en_specs):
        inf.error("regla-sin-spec", f"{r} no aparece en ninguna spec")
    if (tareas := por_nombre.get("tareas-fase-0")):
        en_tareas = ids_en(tareas.cuerpo, "HU")
        for h in sorted(tabla["HU"] - en_tareas, key=lambda x: (x[:7], int(x[7:]))):
            inf.aviso("historia-sin-tarea", f"{h} no está en tareas-fase-0")
    atendidas: set[str] = set()
    for n in notas:
        if n.capa in {"wiki", "output"} and not n.archivada:
            atendidas |= ids_en(n.cuerpo, "FB")
    for f in sorted(tabla["FB"] - atendidas):
        inf.error("observacion-sin-atender", f"{f} no se cita en ninguna página del wiki ni de output")
    for p in sorted(tabla["P"] - citado_fuera["P"]):
        inf.aviso("parametro", f"{p} no se cita fuera de parametros.md")
    return tabla


def verificar_conteos(por_nombre: dict[str, Nota], inf: Informe) -> None:
    if (nota := por_nombre.get("reglas-de-negocio")):
        filas = [l for l in nota.cuerpo.splitlines() if re.match(r"^\|\s*RN-[A-Z]{3,4}-\d{3}\s*\|", l)]
        validar = sum(1 for l in filas if "VALIDAR-PROFESIONAL" in l)
        m = re.search(r"\*\*Conteo:\*\*\s*(\d+)\s*reglas\s*·\s*(\d+)", nota.cuerpo)
        if m and (int(m.group(1)), int(m.group(2))) != (len(filas), validar):
            inf.error("conteo", f"reglas-de-negocio dice {m.group(1)} reglas · {m.group(2)} por validar; "
                                f"hay {len(filas)} · {validar}")
        inf.info.append(f"Reglas: {len(filas)} ({validar} con [VALIDAR-PROFESIONAL])")
    if (param := por_nombre.get("parametros")):
        filas_p = [l for l in param.cuerpo.splitlines() if re.match(r"^\|\s*P-\d{3}\s*\|", l)]
        nums = sorted(int(re.match(r"^\|\s*P-(\d{3})", l).group(1)) for l in filas_p)
        huecos = sorted(set(range(1, max(nums) + 1)) - set(nums)) if nums else []
        if huecos:
            inf.aviso("parametro", "números sin usar en la secuencia: " + ", ".join(f"P-{h:03d}" for h in huecos))
        validar_p = sum(1 for l in filas_p if "[V]" in l or "VALIDAR" in l)
        inf.info.append(f"Parámetros: {len(filas_p)} ({validar_p} con [V])")


def verificar_codigo(tabla: dict[str, set[str]], por_nombre: dict[str, Nota], notas: list[Nota],
                     inf: Informe) -> None:
    if not APP.exists():
        inf.info.append("--codigo: app/ todavía no existe (se crea en T-001); verificación omitida")
        return
    pruebas = [p for p in APP.rglob("*") if p.is_file() and "node_modules" not in p.parts
               and re.search(r"\.(test|spec)\.[cm]?[jt]sx?$", p.name)]
    con_prueba: set[str] = set()
    for p in pruebas:
        con_prueba |= ids_en(p.read_text(encoding="utf-8", errors="ignore"), "RN")
    # Exigibles: reglas citadas por tareas terminadas (✅) y por specs en estado `implementado`
    exigibles: set[str] = set()
    if (tareas := por_nombre.get("tareas-fase-0")):
        for linea in tareas.cuerpo.splitlines():
            if re.match(r"^\|\s*T-\d{3}[^|]*✅", linea):
                exigibles |= ids_en(linea, "RN")
    for n in notas:
        if n.ruta.parent == SDD / "specs" and n.fm.get("estado") == "implementado":
            exigibles |= ids_en(n.cuerpo, "RN")
    exigibles &= tabla["RN"]
    for r in sorted(exigibles - con_prueba):
        inf.error("regla-sin-prueba", f"{r}: exigible (tarea ✅ o spec implementada) y sin prueba con su ID")
    for r in sorted(con_prueba - tabla["RN"]):
        inf.error("prueba-huerfana", f"una prueba cita {r}, que no existe en reglas-de-negocio")
    inf.info.append(f"--codigo: {len(tabla['RN'] & con_prueba)}/{len(tabla['RN'])} reglas con prueba · "
                    f"{len(exigibles)} exigibles · {len(pruebas)} archivos de prueba")
    params_ts = APP / "packages" / "domain" / "src" / "config" / "parameters.ts"
    if params_ts.exists():
        en_ts = ids_en(params_ts.read_text(encoding="utf-8"), "P", expandir=False)
        for p in sorted(tabla["P"] - en_ts):
            inf.error("parametro-sin-codigo", f"{p} no aparece en parameters.ts")
        for p in sorted(en_ts - tabla["P"]):
            inf.error("parametro-huerfano", f"parameters.ts cita {p}, que no existe en parametros.md")
    else:
        inf.info.append("--codigo: parameters.ts todavía no existe (T-002)")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--codigo", action="store_true", help="verifica pruebas por regla y parameters.ts")
    ap.add_argument("--corregir", action="store_true", help="completa la lista `fuentes` del frontmatter")
    args = ap.parse_args()

    hoy = dt.date.today()
    inf = Informe()
    notas = cargar_notas()
    por_nombre = verificar_nombres(notas, inf)
    entrantes = verificar_enlaces(notas, por_nombre, inf)
    verificar_frontmatter(notas, por_nombre, inf, hoy)
    verificar_huerfanas(notas, entrantes, inf)
    verificar_fuentes(notas, por_nombre, inf, args.corregir)
    tabla = verificar_ids(notas, por_nombre, inf)
    verificar_conteos(por_nombre, inf)
    if args.codigo:
        verificar_codigo(tabla, por_nombre, notas, inf)

    print(f"Lint de trazabilidad · Gym Bro · {hoy.isoformat()}")
    print(f"Bóveda: {len(notas)} notas · IDs definidos: " + " · ".join(f"{k} {len(v)}" for k, v in tabla.items()))
    for linea in inf.info:
        print(f"  · {linea}")
    for titulo, lista in (("ERRORES", inf.errores), ("ADVERTENCIAS", inf.avisos)):
        if lista:
            print(f"\n{titulo} ({len(lista)})")
            for item in lista:
                print(f"  {item}")
    print(f"\nResultado: {'FALLA' if inf.errores else 'OK'} ({len(inf.errores)} errores, {len(inf.avisos)} advertencias)")
    return 1 if inf.errores else 0


if __name__ == "__main__":
    sys.exit(main())
