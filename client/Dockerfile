FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ARG API_URL=/api
RUN sed -i "s|apiUrl: '/api'|apiUrl: '${API_URL}'|g" src/environments/environment.prod.ts \
 && npm run build -- --configuration production
FROM nginx:alpine
COPY config/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/notely /usr/share/nginx/html
EXPOSE 80
