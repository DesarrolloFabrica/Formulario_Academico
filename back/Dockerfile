FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY back/package.json ./back/package.json
RUN npm install --workspace back --include-workspace-root

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY back ./back
RUN npm run build -w back

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/back/dist ./back/dist
COPY back/package.json ./back/package.json
COPY back/migrations ./back/migrations
CMD ["node", "back/dist/server.js"]
