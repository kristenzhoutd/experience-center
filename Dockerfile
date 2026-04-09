FROM node:22

WORKDIR /app

# Install system dependencies that Claude Code subprocess may need
RUN apt-get update && apt-get install -y git ripgrep && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies
RUN npm install

# Copy source
COPY . .

# Build frontend
ARG VITE_SANDBOX_API_KEY
ENV VITE_SANDBOX_API_KEY=$VITE_SANDBOX_API_KEY
ARG VITE_GA_MEASUREMENT_ID
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
ARG VITE_TD_WRITE_KEY
ENV VITE_TD_WRITE_KEY=$VITE_TD_WRITE_KEY
ARG VITE_TD_DATABASE
ENV VITE_TD_DATABASE=$VITE_TD_DATABASE
ARG VITE_TD_HOST
ENV VITE_TD_HOST=$VITE_TD_HOST
RUN npm run build:client

# Runtime
ENV PORT=3001
ENV NODE_OPTIONS="--max-old-space-size=512"
EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]
