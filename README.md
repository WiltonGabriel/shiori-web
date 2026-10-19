# Shiori Web 栞 (Front-end Oficial)

[![CI/CD Docker Multi-Arch](https://github.com/wiltongabriel/shiori-web/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/wiltongabriel/shiori-web/actions/workflows/docker-publish.yml)
[![Version](https://img.shields.io/badge/version-0.0.10--alpha-blue.svg)](package.json)

Front-end oficial do **Catálogo de Leituras Shiori**, uma Single Page Application (SPA) moderna, responsiva e de alta performance voltada ao acompanhamento e organização de leituras de mangás, web novels, light novels, manhwas e quadrinhos.

Exposto publicamente em: **[shiori.wnzk.dev.br](https://shiori.wnzk.dev.br)**

---

## 🏛️ Arquitetura e Engenharia de Software

O projeto segue práticas rigorosas de **Clean Architecture**, **Clean Code** e **Single Responsibility Principle (SRP)**:

- **Single Page Application (SPA):** Construído sobre React 19, TypeScript e Vite com roteamento dinâmico e fallback Nginx para `index.html`.
- **Injeção Dinâmica em Tempo de Execução:** Suporte nativo a Docker/Portainer sem recompilação estática (`env-config.js` via `docker-entrypoint.sh`). A URL base da API é configurada via variável `VITE_API_BASE_URL`.
- **Cliente HTTP Resiliente (`src/services/api/`):** Interceptores desacoplados para injeção automática de Bearer Tokens JWT e normalização de erros de acordo com o padrão **RFC 9457 (`ProblemDetail`)**.
- **Serviços de Domínio Isolados (`src/services/`):** Comunicação tipada com a Shiori API (`AuthService`, `WorkService`, `CatalogService`, `SocialService`, `UserService`, `BroadcastService`, `AdminService`).
- **Design System Obsidian Glassmorphism (`src/styles/`):** Variáveis CSS com paleta HSL, tipografia editorial (Google Fonts Outfit e Plus Jakarta Sans), dark mode e light mode harmoniosos, dynamic viewport units (`dvh`/`dvw`) e suporte completo a dispositivos móveis.
- **Componentização Atômica Modular:** Componentes reutilizáveis com CSS Modules garantindo zero vazamento de escopo estilístico.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js:** Versão 20 ou superior (recomendado 22 LTS)
- **Shiori API:** Em execução local (`http://localhost:8080`) ou acessível via rede/nuvem

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/wiltongabriel/shiori-web.git
   cd shiori-web
   ```

2. **Configurar as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   Edite o `.env` apontando para o endpoint da Shiori API:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   PORT=3000
   ```

3. **Instalar dependências e iniciar o servidor de desenvolvimento:**
   ```bash
   npm install
   npm run dev
   ```
   Acesse a aplicação no navegador em `http://localhost:3000`.

4. **Verificação de qualidade:**
   ```bash
   # Validação de tipos e ESLint
   npm run lint

   # Compilação de teste para produção
   npm run build
   ```

---

## 🐳 Execução via Docker e Docker Compose

Você pode subir o Shiori Web localmente utilizando a imagem pré-compilada ou construindo a imagem multi-stage:

```bash
# Iniciar o container com Docker Compose
docker compose up -d

# Visualizar logs da aplicação
docker compose logs -f shiori-web

# Encerrar o container
docker compose down
```

---

## 🚢 Deploy em Produção (Portainer & GitOps)

Para instruções detalhadas de deploy contínuo via Portainer CE, mapeamento de portas, injeção de variáveis de ambiente e apontamento do subdomínio via Cloudflare Tunnel / Proxy, consulte a documentação oficial:

📖 **[Guia Completo de Deploy no Portainer e Cloudflare](docs/DEPLOY_PORTAINER.md)**

---

## 📄 Licença

Distribuído sob a licença Open Source do ecossistema Shiori. Consulte os repositórios oficiais para detalhes de governança e contribuição.
