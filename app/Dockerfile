# Imagen del bot para producción (T-100, plan técnico §10): un solo proceso siempre
# encendido con long polling y el planificador. No expone ningún puerto.
# Contexto de construcción: la carpeta app/ (Root Directory del servicio en Railway).

FROM node:22-bookworm-slim

# mongodb-memory-server solo se usa en pruebas: no se descarga su binario.
ENV MONGOMS_DISABLE_POSTINSTALL=1

WORKDIR /srv/gymbro
RUN corepack enable

# Primero las dependencias, para reutilizar la capa si solo cambia el código.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/domain/package.json packages/domain/
COPY packages/content/package.json packages/content/
COPY apps/server/package.json apps/server/
RUN pnpm install --frozen-lockfile --filter "@gymbro/server..."

COPY packages ./packages
COPY apps/server ./apps/server

USER node
WORKDIR /srv/gymbro/apps/server

# Sin pnpm de por medio: así el proceso recibe SIGTERM y cierra el ciclo en curso.
CMD ["node", "--import", "tsx", "src/main.ts"]
