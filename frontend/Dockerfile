# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json, tsconfig(s), other config files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Copy source code
COPY public ./public
COPY src ./src

# Install deps and build
RUN npm ci
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
