# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205

FROM ${NODE_IMAGE} AS base

ARG PNPM_VERSION=10.34.5
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
ENV COREPACK_HOME=/corepack

WORKDIR /app

# Prisma 在建置與執行期需偵測 OpenSSL；明確安裝避免誤選不相容的 query engine。
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

# 使用固定版本的 pnpm，避免每次建置取得不同工具版本。
RUN corepack enable \
    && corepack prepare "pnpm@${PNPM_VERSION}" --activate \
    && pnpm --version

FROM base AS dependencies

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=backend-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM dependencies AS builder

COPY . .

# 先產生 Prisma Client，再編譯 API 與排程腳本。
RUN pnpm exec prisma generate \
    && pnpm run build

# 維護工具映像保留 Prisma CLI；不作為正式 API 或 cron 的執行映像。
FROM builder AS tools

ENV NODE_ENV=production
USER node

# 正式執行依賴從完整建置結果裁切，保留已產生的 Prisma Client。
FROM builder AS production-dependencies

RUN pnpm prune --prod

FROM ${NODE_IMAGE} AS runner

WORKDIR /app

# Runner 不繼承建置層，僅安裝 Prisma runtime 必要的系統函式庫。
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3001
ENV HOME=/home/node

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package.json ./package.json

USER node

EXPOSE 3001

CMD ["node", "dist/src/index.js"]
