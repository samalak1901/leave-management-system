FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY public ./public
COPY src ./src
RUN npm ci && npm run build


FROM nginx:stable-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]