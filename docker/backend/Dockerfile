# =================================================================
# SolarSDGs IoT - Backend Dockerfile
# Node.js + Express + TypeScript
# =================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript build)
RUN npm install && \
    npm cache clean --force

# Copy TypeScript source
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm install -g typescript && \
    npm run build && \
    npm uninstall -g typescript

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create logs directory
RUN mkdir -p /app/logs

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start server
CMD ["node", "dist/server.js"]
