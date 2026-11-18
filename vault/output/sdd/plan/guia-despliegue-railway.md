---
titulo: Guía de despliegue en Railway
tipo: sdd-plan
hito: H4
estado: borrador
version: 0.1.0
creado: 2026-11-18
actualizado: 2026-11-18
deriva_de: [plan-tecnico]
fuentes: [F103, F104, F105, F106, F107, F108]
relacionados: [plan-tecnico, tareas-fase-0, guia-protocolo-n-de-1]
---

# Guía de despliegue en Railway

> Pasos para poner el bot en producción (T-100): un servicio siempre encendido en Railway, con *long polling*, y la base en MongoDB Atlas. La imagen se construye con `app/Dockerfile`. Precios y límites consultados el 2026-11-18: confirmarlos antes de pagar.

## 1. Costo esperado

| Servicio | Plan sugerido | Precio | Límites que importan |
|---|---|---|---|
| Railway | Hobby | USD 5 al mes, con USD 5 de uso incluidos (`F103`) | Memoria a USD 10 por GB al mes y CPU a USD 20 por vCPU al mes (`F103`) |
| MongoDB Atlas | Free | USD 0 (`F108`) | 0,5 GB, 500 conexiones y 100 operaciones por segundo (`F107`) |

El consumo real del bot todavía no se ha medido. Revisar las métricas de Railway la primera semana. Si Atlas Free se queda corto, Flex cuesta entre USD 8 y USD 30 al mes (`F108`).

> [!warning] Copias de seguridad
> La documentación de Atlas se contradice sobre las copias en el plan Free (`F107`, `F108`). Mientras no se confirme en la consola, usar `/exportar` cada semana.

## 2. Antes de empezar

- [ ] Revocar el token actual en BotFather con `/revoke` y guardar el nuevo solo en el gestor de contraseñas y en Railway.
- [ ] Poner el token nuevo en `app/infra/.env` y borrar de ese archivo la línea `TELEGRAM_WEBHOOK_SECRET`, que ya no se usa.
- [ ] Fusionar la rama en `main`.
- [ ] Apagar el bot local: dos procesos con el mismo token se bloquean entre sí.

## 3. MongoDB Atlas

1. Crear un proyecto y un clúster Free en una región cercana a la del servicio de Railway.
2. En **Database Access**, crear el usuario `gymbro_app` con contraseña generada y el rol `readWrite` solo sobre la base `gymbro`.
3. En **Network Access**, permitir el acceso desde cualquier dirección (`0.0.0.0/0`).
4. Copiar la cadena de conexión `mongodb+srv://…`. Si la contraseña tiene caracteres especiales, codificarla para URL.

> [!warning] Por qué el acceso queda abierto
> Las IP de salida fijas de Railway son del plan Pro (`F106`). Con Hobby, la protección de la base es la contraseña larga y el usuario con permisos mínimos. Para cerrar la lista de acceso hay que pasar a Pro.

## 4. Railway

1. Crear un proyecto desde el repositorio de GitHub, rama `main`.
2. En **Settings** del servicio:
   - **Root Directory:** `/app`
   - **Watch Paths:** `/app/**`, para no redesplegar por cambios en la bóveda.
   - **Replicas:** 1
   - **Restart Policy:** Always
   - Sin dominio público: el bot no recibe tráfico de entrada.
3. En **Variables**:

| Variable | Valor |
|---|---|
| `TELEGRAM_BOT_TOKEN` | El token nuevo |
| `MONGODB_URI` | La cadena de conexión de Atlas |
| `MONGO_DATABASE` | `gymbro` |
| `DEFAULT_TZ` | `America/Bogota` |
| `LOG_LEVEL` | `info` |
| `STUDY_PHASE` | `n1_B` |
| `FOUNDER_TELEGRAM_ID` | Tu id numérico de Telegram |
| `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS` | `0` |
| `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` | `30` |

> [!note] Sin `railway.json`
> Railway dejó de admitir Config as Code en servicios nuevos y lo apaga el 2026-12-01 (`F104`). Por eso estos ajustes se hacen en el panel.

## 5. Verificar

1. En los registros deben aparecer `db_connected` y después `bot_started`.
2. En Telegram, enviar `/start` y completar el onboarding, o `/hoy` si ya existe tu usuario.
3. Enviar `/lab` y confirmar que responde con las métricas.

La documentación no garantiza que la versión anterior se detenga antes de arrancar la nueva (`F105`). Si en un despliegue aparece `server_start_failed` con un error 409, el proceso se reinicia solo. Basta con confirmar que el último evento sea `bot_started`.

## 6. Criterio de terminado de T-100

El bot funciona **72 horas sin intervención**. Durante ese tiempo, revisar una vez al día:

- [ ] El servicio sigue activo y sin reinicios repetidos.
- [ ] Llegan los mensajes proactivos esperados y la línea G06 de `/lab` sigue en 0.
- [ ] Los días se cierran a las 03:00.
- [ ] El gasto en Railway va dentro de lo esperado.

Al cumplirse, marcar T-100 con ✅ en [[tareas-fase-0]] y añadir la entrada en `wiki/log.md`.
