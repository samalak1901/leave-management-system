FROM node:20-alpine

WORKDIR /app

# Copy only package files first
COPY package*.json ./

RUN npm ci

# Copy src files
COPY src ./src
COPY tsconfig.json ./

# Compile TS
RUN npx tsc

# Use the compiled JS
CMD ["node", "dist/app.js"]
