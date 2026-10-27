# Shiori Web 栞 (Front-end Oficial)

[![CI/CD Docker Multi-Arch](https://github.com/wiltongabriel/shiori-web/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/wiltongabriel/shiori-web/actions/workflows/docker-publish.yml)
[![Version](https://img.shields.io/badge/version-0.0.16--alpha-blue.svg)](package.json)
[![Status](https://img.shields.io/badge/status-active%20alpha-orange.svg)](docs/memory/roadmap_e_escalonamento.md)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Front-end oficial do **Shiori**, uma Single Page Application (SPA) moderna, fluida e responsiva voltada ao acompanhamento soberano, privado e comunitário de leituras (mangás, web novels, light novels, manhwas, manhuas e livros).

O **Shiori Web** foi concebido como um cliente **totalmente desacoplado** e autônomo. O leitor pode começar a usar o aplicativo imediatamente no modo local sem barreiras ou configurações obrigatórias, com a opção flexível de conectar-se a qualquer instância do **Shiori API** a qualquer momento para explorar o catálogo global e recursos de sincronização.

> [!NOTE]
> **Estágio do Projeto:** O Shiori Web encontra-se em fase **Alpha ativa**. A interface, os fluxos de estante pessoal, busca avançada e moderação comunitária já estão funcionais, mas novos refinamentos de UI/UX, acessibilidade e paridade mobile continuam em desenvolvimento ativo.

---

## 📖 Visão Geral e Princípios

1. **Soberania do Leitor (Offline-First):** Seus registros pessoais de leitura são seus. Toda a estante opera localmente com suporte a importação/exportação JSON e proteção de acesso por senha local.
2. **Conexão Desacoplada e Opcional:** O leitor pode usar o Shiori puramente local ou conectar-se dinamicamente a uma instância da Shiori API informando a URL no navegador ou no assistente inicial.
3. **Busca Avançada Multicritério (Series Finder):** Filtros combináveis com lógica tri-state (interessado, neutro, evitar), busca por capítulos, notas e tags comunitárias.
4. **Governança Comunitária de Tags:** Visualização, votação e sugestão de novas tags para obras, com painel administrativo de aprovação/rejeição.
5. **Design System Fluido:** Interface com temas dinâmicos Escuro e Claro, paleta de alto contraste, suporte a monitores verticais (*portrait*) e adaptação completa a dispositivos móveis.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
|:---|:---|:---|
| **Core** | React 19 + TypeScript | Interface reativa com tipagem estrita de ponta a ponta |
| **Bundler & Build** | Vite 6 | Fast Refresh ultrarrápido e compilação otimizada para produção |
| **Estado Global** | Zustand | Gerenciamento de estado leve, atômico e sem boilerplate |
| **Comunicação HTTP** | Axios | Cliente tipado com interceptores para injeção de JWT e tratamento RFC 9457 |
| **Estilização** | CSS Modules + Vanilla CSS | Design system sem Tailwind, com variáveis HSL e tokens semânticos |
| **Ícones** | Lucide React | Biblioteca moderna e coesa de ícones vetoriais |
| **Servidor de Produção** | Nginx Alpine | Servidor estático multi-stage ultra-leve (< 25MB) com SPA fallback |

---

## 🚀 Como Executar Localmente (Quickstart)

### Pré-requisitos
- **Node.js:** Versão 20 LTS ou superior (recomendado Node 22).
- **npm:** Versão 10 ou superior.

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
   *(Por padrão, aponta para `http://localhost:8080` se você tiver a Shiori API rodando localmente).*

3. **Instalar dependências:**
   ```bash
   npm install
   ```

4. **Verificar testes automatizados e compilação:**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

5. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação no seu navegador em: `http://localhost:3000`.

---

## ⚙️ Variáveis de Ambiente (`.env.example`)

```env
# Porta do servidor local de desenvolvimento
PORT=3000

# Endpoint padrão da Shiori API (opcional; pode ser alterado em tempo de execução na UI)
VITE_API_BASE_URL=http://localhost:8080
```

> **Dica para Containers:** Em produção via Docker, o script `docker-entrypoint.sh` injeta a variável `VITE_API_BASE_URL` em tempo de execução via `window.__ENV__`, permitindo apontar para um novo Hub de API sem precisar recompilar a imagem estática.

---

## 📚 Documentação Técnica

- 🏛️ **[Arquitetura do Cliente Web](docs/ARQUITETURA_WEB.md):** Padrões de projeto, segregação de responsabilidades (SRP), fluxo de autenticação e gerenciamento de estado.
- 🚢 **[Guia de Deploy no Portainer & GitOps](docs/DEPLOY_PORTAINER.md):** Manual completo de deploy contínuo em containers Docker com Nginx e SPA fallback.
- 🗺️ **[Roadmap Tecnológico e Diretrizes](docs/memory/roadmap_e_escalonamento.md):** Planejamento da arquitetura de auto-tracking (`shiori-detect.js`), app Flutter e abertura open source.

---

## 📄 Licença

Este projeto é software livre licenciado sob os termos da licença [MIT](LICENSE).
