# ---------- BUILD STAGE ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

RUN npm ci --quiet \
  && npm run build \
  && npm cache clean --force

# ---------- RUNTIME STAGE ----------
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg
RUN npm install -g pm2

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --quiet \
  && npm cache clean --force \
  && rm -rf /tmp/*

COPY --from=builder /app/dist ./dist
COPY ecosystem.config.js .
COPY src/templates ./src/templates

EXPOSE 3000

CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
