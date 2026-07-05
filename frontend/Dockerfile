# ----------------------------
# Build Stage
# ----------------------------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ----------------------------
# Runtime Stage
# ----------------------------
FROM nginx:1.27-alpine

RUN apk add --no-cache gettext

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

COPY docker/env.template.js /opt/config/env.template.js

COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]