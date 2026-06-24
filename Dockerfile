# ---------- Multi‑stage Dockerfile for the Next.js app ----------
# Stage 1 – Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY nextjs_site/package*.json ./
RUN npm install

# Copy source and build
COPY nextjs_site/. .
RUN npm run build

# Stage 2 – Runtime
FROM node:20-alpine
WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --production

EXPOSE 3000
CMD ["npm", "start"]
