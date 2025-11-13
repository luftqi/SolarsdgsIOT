# =================================================================
# SolarSDGs IoT - Frontend Dockerfile
# Vue 3 + Vite + TypeScript PWA
# Multi-stage build: Vite build → Caddy serve
# =================================================================

# Stage 1: Build Vue 3 application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install && \
    npm cache clean --force

# Copy source files
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY public/ ./public/
COPY src/ ./src/

# Build arguments for environment variables
ARG VITE_API_BASE_URL=https://api.solarsdgs.online
ARG VITE_WS_URL=wss://api.solarsdgs.online

# Set build-time environment variables
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build for production
RUN npm run build

# Stage 2: Serve with Caddy
FROM caddy:2-alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/caddy

# Create Caddyfile for SPA routing
RUN echo -e "{\n\
    auto_https off\n\
}\n\
\n\
:80 {\n\
    root * /usr/share/caddy\n\
    encode gzip\n\
    \n\
    # PWA service worker - no cache\n\
    @sw {\n\
        path /service-worker.js\n\
        path /sw.js\n\
        path /manifest.json\n\
        path /manifest.webmanifest\n\
    }\n\
    header @sw Cache-Control \"no-cache, no-store, must-revalidate\"\n\
    \n\
    # Static assets - long cache\n\
    @static {\n\
        path *.css *.js *.png *.jpg *.woff *.woff2\n\
        not path /service-worker.js\n\
        not path /sw.js\n\
    }\n\
    header @static Cache-Control \"public, max-age=31536000, immutable\"\n\
    \n\
    # SPA fallback\n\
    try_files {path} /index.html\n\
    file_server\n\
}" > /etc/caddy/Caddyfile

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Caddy will start automatically
