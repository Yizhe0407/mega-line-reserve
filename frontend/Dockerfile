# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205

FROM ${NODE_IMAGE} AS base

RUN corepack enable

# 安裝 package.json 指定的套件管理器版本
FROM base AS package-manager
WORKDIR /app
COPY package.json ./
RUN corepack install \
  && EXPECTED_PNPM_VERSION="$(node -p "require('./package.json').packageManager.match(/^pnpm@([^+]+)/)[1]")" \
  && ACTUAL_PNPM_VERSION="$(pnpm --version)" \
  && test "$ACTUAL_PNPM_VERSION" = "$EXPECTED_PNPM_VERSION"

# 僅安裝建置所需依賴
FROM package-manager AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 建置前端程式碼
FROM package-manager AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Next.js 建置階段環境變數
ARG INTERNAL_API_URL=http://backend:3001
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_LIFF_ID
ARG NEXT_PUBLIC_LIFF_BYPASS=false
ENV INTERNAL_API_URL=${INTERNAL_API_URL}
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_LIFF_ID=$NEXT_PUBLIC_LIFF_ID
ENV NEXT_PUBLIC_LIFF_BYPASS=$NEXT_PUBLIC_LIFF_BYPASS

RUN pnpm run build

# 正式執行映像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public

# 預先建立 Next.js runtime cache 目錄；目前靜態路由在唯讀 rootfs 下不需寫入。
# 未來若加入 ISR、圖片最佳化或 runtime cache，應重新實測並只掛載必要路徑。
RUN mkdir -p .next/cache \
  && chown -R nextjs:nodejs .next

# 使用 standalone 輸出縮小正式映像
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
