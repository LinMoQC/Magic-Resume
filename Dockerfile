### STAGE 1: DEPENDENCIES ###
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

### STAGE 2: BUILDER ###
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Declare build arguments
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

RUN npm run build

### STAGE 3: RUNNER ###
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy files from builder stage
COPY --from=builder /app/public ./public
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"] 