FROM node:20-slim

WORKDIR /app

# Copy package files and install all dependencies (server needs @anthropic-ai/sdk, express, etc.)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy server code and shared lib (agents, orchestrator, types)
COPY server/ ./server/
COPY src/lib/ ./src/lib/
COPY tsconfig.json ./

ENV PORT=8080
EXPOSE 8080

CMD ["npx", "tsx", "server/index.ts"]
