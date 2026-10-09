# Multi-stage production Dockerfile for GymBro AI Backend
FROM node:22-alpine AS base

# Install security updates & healthcheck tools
RUN apk update && apk upgrade && apk add --no-cache curl tzdata

WORKDIR /app

# Stage 1: Dependencies
FROM base AS dependencies
COPY package*.json ./
RUN npm ci

# Stage 2: Production Runner
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

# Copy dependencies and application source
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

# Security: Run as unprivileged node user
RUN chown -R node:node /app
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

CMD ["npm", "start"]
