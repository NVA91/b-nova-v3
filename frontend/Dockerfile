# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Installiere System-Dependencies (falls nötig)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install mit --ignore-scripts (verhindert spawn sh Fehler)
RUN npm ci --ignore-scripts

# Copy Source
COPY . .

# Build
RUN npm run build

# Verify build
RUN test -d dist || (echo "Build failed: dist/ not found" && exit 1)

# Stage 2: Runtime (Nginx)
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: Custom Nginx Config
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
