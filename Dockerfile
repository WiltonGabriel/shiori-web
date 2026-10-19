# Estágio 1: Build da aplicação React + Vite
FROM node:22-alpine AS builder

WORKDIR /app

# Copia manifests para cache de camadas
COPY package*.json ./
RUN npm ci

# Copia código-fonte e compila
COPY . .
RUN npm run build

# Estágio 2: Imagem final com Nginx
FROM nginx:alpine

# Remove configuração padrão
RUN rm -rf /etc/nginx/conf.d/*

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o bundle gerado no build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
