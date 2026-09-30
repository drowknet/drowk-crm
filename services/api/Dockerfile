FROM node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c AS build
ARG BUILD_SHA
RUN node -e 'const s=process.env.BUILD_SHA || ""; if (s.length !== 40 || !/^[a-f0-9]{40}$/.test(s)) process.exit(1)'
WORKDIR /build
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate && test "$(pnpm --version)" = "10.17.1"
COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter @drowk/api... build
RUN node tooling/runtime/pack.mjs services/api /runtime

FROM node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c AS runtime
ARG BUILD_SHA
RUN node -e 'const s=process.env.BUILD_SHA || ""; if (s.length !== 40 || !/^[a-f0-9]{40}$/.test(s)) process.exit(1)'
LABEL org.opencontainers.image.revision=$BUILD_SHA
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=1000:1000 /runtime/ ./
USER 1000:1000
EXPOSE 8000
CMD ["node", "dist/main.js"]
