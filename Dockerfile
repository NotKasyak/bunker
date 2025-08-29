FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json files for both client and server
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install dependencies
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

# Copy all files
COPY . .

# Build the client
RUN cd client && npm run build

# Production image, copy all the files and run the server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package.json ./
COPY --from=builder /app/server/ ./server/
COPY --from=builder /app/client/build/ ./client/build/

# Expose the port the app will run on
EXPOSE 8080

# Start the server
CMD ["node", "server/index.js"]
