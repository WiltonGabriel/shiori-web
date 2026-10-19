# Shiori Web 栞 (Front-end Oficial)

Front-end oficial do **Catálogo de Leituras Shiori**, voltado à organização e acompanhamento de leituras de mangás, novels, livros e quadrinhos.

---

## 🏛️ Arquitetura, SRP e Clean Code

O projeto foi construído sobre os pilares do **Clean Code** e do **Princípio da Responsabilidade Única (SRP)**:
- **Tipos de Domínio Isolados (`src/types/`):** Contratos segregados por ator e finalidade (`auth`, `work`, `catalog`, `social`, `admin`, `error` com RFC 9457).
- **Criptografia Client-Side (`src/services/crypto/`):** Chaves AES-GCM derivadas via Web Crypto API no navegador, cifrando tokens de sessão e links privados de leitura (`urlLeitura`) contra vazamentos no storage.
- **Cliente HTTP Tipado (`src/services/api/`):** Interceptores isolados para injeção de credenciais Bearer e normalização de falhas via `ProblemDetail`.
- **Serviços de Domínio Especializados (`src/services/`):** Cada serviço responde por um único recurso REST (`AuthService`, `WorkService`, `CatalogService`, `SocialService`, `BroadcastService`, `AdminService`).
- **Design System Obsidian Glassmorphism (`src/styles/`):** Tokens HSL fluidos via `clamp()`, dynamic viewports (`dvh`, `dvw`), safe areas móveis e suporte a container queries (`@container`).
- **Componentes UI Atômicos (`src/components/ui/`):** Cada componente (`Button`, `Input`, `Badge`, `Modal`, `Card`, `Avatar`, `Spinner`) tem responsabilidade única e seu respectivo CSS Module.

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js >= 20
- Back-end Shiori API em execução (padrão local ou em nuvem `http://100.127.79.49:8088`)

### Instalação e Execução
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (Vite)
npm run dev

# Checar tipagem e linter (0 erros)
npm run lint

# Gerar build de produção otimizado
npm run build
```
