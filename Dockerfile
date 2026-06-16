FROM node:22-alpine3.22 AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate

FROM base AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY scripts/install-mobile.mjs ./scripts/install-mobile.mjs
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --filter ./apps/api...

COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN pnpm build

FROM base AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY scripts/install-mobile.mjs ./scripts/install-mobile.mjs
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --prod --filter ./apps/api...

COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3000

WORKDIR /app/apps/api
CMD ["node", "dist/main"]
