FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production Nginx or Node static server
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx conf for SPA routing
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api {\n\
        proxy_pass http://server:5000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_cache_bypass $http_upgrade;\n\
    }\n\
    location /fhir {\n\
        proxy_pass http://server:5000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
