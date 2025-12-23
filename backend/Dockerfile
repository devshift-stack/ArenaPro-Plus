# ═══════════════════════════════════════════════════════════════════════════════
# AI Arena Backend - Dockerfile
# ═══════════════════════════════════════════════════════════════════════════════

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy prisma schema first (for generation)
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# ═══════════════════════════════════════════════════════════════════════════════
# Production Stage
# ═══════════════════════════════════════════════════════════════════════════════

FROM node:20-alpine AS production

WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Copy package files and install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Set ownership
RUN chown -R backend:nodejs /app

# Switch to non-root user
USER backend

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
