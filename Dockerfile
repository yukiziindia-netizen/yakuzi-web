# yakuzi-web (pnpm monorepo, Next.js 14) -- production Dockerfile (v2)
# Uses `pnpm deploy --shamefully-hoist` to flatten node_modules so Next.js can resolve modules at runtime.
#
# Build buyer:   docker build --build-arg APP_NAME=buyer  --build-arg APP_PORT=3001 -t yakuzi-buyer:dev  .
# Build admin:   docker build --build-arg APP_NAME=admin  --build-arg APP_PORT=3002 -t yakuzi-admin:dev  .
# Build seller:  docker build --build-arg APP_NAME=seller --build-arg APP_PORT=3003 -t yakuzi-seller:dev .
# Build blog:    docker build --build-arg APP_NAME=blog   --build-arg APP_PORT=3004 -t yakuzi-blog:dev   .

ARG APP_NAME=buyer
ARG APP_PORT=3001

# ─── Stage 1: deps + build ───────────────────────────────────────────────────
FROM node:22-alpine AS builder
ARG APP_NAME
WORKDIR /repo
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY . .

RUN pnpm install --frozen-lockfile --shamefully-hoist

# Build target app + its workspace deps
RUN pnpm --filter "${APP_NAME}..." build

# pnpm deploy: produce a self-contained app directory in /out
RUN pnpm --filter "${APP_NAME}" deploy --prod --legacy --shamefully-hoist /out

# pnpm deploy doesn't include .next or public; copy them in
RUN cp -r apps/${APP_NAME}/.next /out/.next \
 && (cp -r apps/${APP_NAME}/public /out/public 2>/dev/null || true) \
 && cp apps/${APP_NAME}/next.config.js /out/next.config.js

# ─── Stage 2: runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
ARG APP_PORT
WORKDIR /app
RUN apk add --no-cache libc6-compat \
    && addgroup -S nextjs -g 1001 \
    && adduser -S nextjs -u 1001 -G nextjs

ENV NODE_ENV=production
ENV PORT=${APP_PORT}

COPY --from=builder --chown=nextjs:nextjs /out ./

USER nextjs
EXPOSE ${APP_PORT}

CMD ["sh", "-c", "node node_modules/next/dist/bin/next start --port ${PORT}"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/ || exit 1
