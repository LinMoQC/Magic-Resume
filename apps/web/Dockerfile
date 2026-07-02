### STAGE 1: DEPENDENCIES ###
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY patches ./patches
COPY apps/docs/package.json apps/docs/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/env/package.json packages/env/package.json
COPY packages/mcp/package.json packages/mcp/package.json
COPY packages/resume-schema/package.json packages/resume-schema/package.json
COPY packages/resume-templates/package.json packages/resume-templates/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
COPY packages/utils/package.json packages/utils/package.json

RUN pnpm install --frozen-lockfile

### STAGE 2: BUILDER ###
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages
COPY . .

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Declare build arguments
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

RUN pnpm --filter @magic-resume/web... build

### STAGE 3: RUNNER ###
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy files from builder stage
COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static

USER node

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/web/server.js"]
