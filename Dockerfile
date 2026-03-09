FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source
COPY . .

# Build frontend
RUN npm run build:client

# Expose port
ENV PORT=3001
EXPOSE 3001

# Start server with tsx (runs TypeScript directly)
CMD ["npx", "tsx", "server/index.ts"]
