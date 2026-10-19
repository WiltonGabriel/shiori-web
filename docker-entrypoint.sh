#!/bin/sh
set -e

# Injeta variáveis de ambiente em tempo de execução para a aplicação SPA
cat <<ENV_EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-}"
};
ENV_EOF

echo "[Shiori Web] Runtime env-config.js gerado com sucesso. VITE_API_BASE_URL=${VITE_API_BASE_URL:-<vazio>}"

exec "$@"
