FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY front/package.json ./front/package.json
RUN npm install --workspace front --include-workspace-root

FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_BACKEND_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY front ./front
RUN npm run build -w front

FROM nginx:1.27-alpine AS runner
COPY front/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/front/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
