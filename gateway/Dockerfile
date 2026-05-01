FROM node:20-alpine

# Install dipendenze di sistema
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copia package.json
COPY package*.json ./

# Install dipendenze
RUN npm ci --only=production

# Copia codice
COPY gateway/ ./gateway/
COPY tsconfig.json ./

# Compila TypeScript
RUN npx tsc gateway/server.ts --outDir dist --esModuleInterop --skipLibCheck --resolveJsonModule --module commonjs --target es2020

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/gateway/server.js"]
