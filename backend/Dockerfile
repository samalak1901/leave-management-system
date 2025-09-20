FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY src ./src
RUN npm ci && npm run build


FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --only=production
EXPOSE 4000
CMD ["node", "dist/server.js"]