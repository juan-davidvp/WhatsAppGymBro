<!-- Fila para el catálogo de reglas de negocio (output/sdd/reglas-de-negocio.md). Una regla = una afirmación verificable. -->
| RN-XXX-### | El sistema … (comportamiento verificable; números como P-###, nunca literales). `[VALIDAR-PROFESIONAL]` si afecta la salud | P-### | FB-###-## · `F##` · ADR-### |

<!-- Fila para parámetros (output/sdd/parametros.md) si la regla necesita un valor nuevo: -->
| P-### | `modulo.nombreEnIngles` | valor | rango | RN-XXX-### | Sí/No | [V] (`F##`) |

<!-- Después: citar la regla en la spec que la usa, actualizar el conteo del catálogo, registrar `decision` en el log y escribir la prueba `describe('RN-XXX-### · …')`. -->
