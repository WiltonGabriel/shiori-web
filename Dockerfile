# ===================================================================
# Estágio 1: Build da aplicação React + Vite (Node 22 Alpine)
# ===================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Otimização de cache para dependências
COPY package*.json ./
RUN npm ci

# Copia código-fonte e compila para produção
COPY . .
RUN npm run build

# ===================================================================
# Estágio 2: Runtime com Nginx Alpine de alta performance
# ===================================================================
FROM nginx:alpine

# Remove configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/*

# Copia configuração customizada com suporte a SPA e gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Script de inicialização para injeção dinâmica de variáveis de ambiente (.env em tempo de execução)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copia os artefatos estáticos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
