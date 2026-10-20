# Shiori Web 栞 (Front-end Oficial)

[![CI/CD Docker Multi-Arch](https://github.com/wiltongabriel/shiori-web/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/wiltongabriel/shiori-web/actions/workflows/docker-publish.yml)
[![Version](https://img.shields.io/badge/version-0.0.12--alpha-blue.svg)](package.json)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Front-end oficial do **Catálogo de Leituras Shiori**, uma Single Page Application (SPA) moderna, responsiva e de alta performance voltada ao acompanhamento privado, descentralizado e curadoria de obras literárias (mangás, web novels, light novels, manhwas, manhuas e quadrinhos).

Exposto publicamente em: **[shiori.wnzk.dev.br](https://shiori.wnzk.dev.br)**

---

## 📖 Visão Geral e Filosofia

O **Shiori Web** foi construído como um cliente **totalmente desacoplado** da API, projetado para operar em modelo estático com máxima flexibilidade de implantação (*Deployment Flexibility*):

1. **Cliente Web Desacoplado & Portável:** Pode ser hospedado em qualquer servidor estático, Nginx, Docker ou CDNs (Cloudflare Pages, Vercel, Netlify).
2. **Seletor de API em Tempo de Execução:** Permite ao usuário ou operador configurar a URL da Shiori API (Hub) diretamente pelo navegador (`localStorage`) ou injetá-la via Docker (`window.__ENV__`), sem necessidade de recompilar os assets estáticos.
3. **Modal de Boas-Vindas e Teste de Conexão Ativo:** Ao abrir a aplicação pela primeira vez sem endpoint predefinido, um assistente leve permite informar a URL do Hub e testar latência e conectividade em tempo real.
4. **Soberania do Leitor:** Exportação e importação completa da estante pessoal em formato JSON padronizado, garantindo que o leitor nunca perca seu histórico.
5. **Design System Obsidian Glassmorphism:** Interface fluida, tema escuro e claro dinâmicos, paleta HSL e micro-animações com CSS Modules sem vazamento de escopo.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
|:---|:---|:---|
| **Core** | React 19 + TypeScript | Interface declarativa com tipagem estrita de ponta a ponta |
| **Bundler & Dev** | Vite 6 | HMR ultrarrápido e compilação otimizada para produção |
| **Estado Global** | Zustand | Gerenciamento de estado leve, atômico e desacoplado |
| **Comunicação HTTP**| Axios | Cliente tipado com interceptores para injeção de JWT e baseURL dinâmica |
| **Estilização** | CSS Modules + Vanilla CSS | Design system sem Tailwind, com variáveis CSS HSL e tokens semânticos |
| **Ícones** | Lucide React | Conjunto moderno e coeso de ícones vetoriais |
| **Servidor Produção**| Nginx Alpine | Servidor estático multi-stage ultra-leve (< 25MB) com SPA fallback |

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js:** Versão 20 LTS ou superior (recomendado Node 22).
- **npm:** Versão 10 ou superior.
- **Shiori API:** Instância em execução local (`http://localhost:8080`) ou em nuvem.

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
   *(Ajuste `VITE_API_BASE_URL` para o endereço da sua API local).*

3. **Instalar dependências:**
   ```bash
   npm install
   ```

4. **Verificar qualidade do código (Linter & TypeScript):**
   ```bash
   npm run lint
   npm run build
   ```

5. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação no navegador em `http://localhost:3000`.

---

## ⚙️ Variáveis de Ambiente (`.env.example`)

```env
# Porta do servidor local de desenvolvimento
PORT=3000

# Endpoint da Shiori API padrão para build local
VITE_API_BASE_URL=http://localhost:8080
```

> **Dica:** Em produção via Docker, o script `docker-entrypoint.sh` injeta a variável `VITE_API_BASE_URL` diretamente no `window.__ENV__` em tempo de execução, permitindo alterar a URL do Hub sem rebuild da imagem Docker.

---

## 📚 Documentação Técnica

- 🏛️ **[Arquitetura do Cliente Web](docs/ARQUITETURA_WEB.md):** Padrões de projeto, SRP (Uncle Bob), hierarquia de resolução do endpoint de API e gerenciamento de estado.
- 🚢 **[Deploy no Portainer & GitOps](docs/DEPLOY_PORTAINER.md):** Manual completo de deploy contínuo em containers Docker, Nginx SPA fallback e Cloudflare.

---

## 🛡️ Infraestrutura e Acesso Operacional

- **Esteira GitOps:** Toda atualização em produção é realizada automaticamente através de **GitOps** com o **Portainer** a partir da branch `main`.
- **Acesso SSH Restrito:** O acesso SSH direto ao servidor operacional via rede privada Tailscale (`ubuntu@100.127.79.49`) é reservado unicamente para auditoria e manutenção de containers em `/srv/services/shiori`. Nenhuma modificação manual de código é executada diretamente em produção.

---

## 📄 Licença

Este projeto é software livre licenciado sob os termos da licença [MIT](LICENSE).
