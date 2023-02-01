# Install dependencies only when needed
FROM node:19-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install


# Build stage.
FROM node:19-alpine as builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


# Run stage.
FROM node:19-alpine as runner
WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

CMD [ "npm", "run", "start" ]