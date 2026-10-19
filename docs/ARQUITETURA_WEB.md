# Arquitetura do Cliente Web (Shiori Web)

Este documento detalha as decisões técnicas, padrões de projeto e o fluxo de dados do cliente front-end oficial do **Shiori**.

---

## 1. Princípios Arquiteturais e Desacoplamento

O **Shiori Web** é uma Single Page Application (SPA) construída sob a premissa de **total desacoplamento do back-end**:

1. **Independência de Hospedagem:**
   - O front-end consiste em arquivos estáticos (HTML, JS, CSS) servidos por Nginx ou qualquer CDN/hospedagem estática (Vercel, Cloudflare Pages, GitHub Pages).
   - O código não requer recompilação para apontar para uma API diferente.
2. **Seletor de API em Tempo de Execução:**
   - A URL base do Hub Shiori (API) é resolvida dinamicamente a cada requisição HTTP através de uma hierarquia de prioridades controlada pelo usuário e pelo ambiente.
3. **Soberania do Leitor e Resiliência:**
   - Se o Hub estiver inacessível, o leitor não perde o acesso às interfaces da sua estante nem às ferramentas locais de importação/exportação.

---

## 2. Hierarquia de Resolução do Endpoint da API

No módulo [`src/services/api/httpClient.ts`](../src/services/api/httpClient.ts), a função `getApiBaseUrl()` adota a seguinte ordem de precedência estrita:

```
┌──────────────────────────────────────────────────────────┐
│ 1. Prioridade Máxima: Escolha do Usuário (localStorage)  │
│    Chave: "shiori_api_endpoint"                          │
└────────────────────────────┬─────────────────────────────┘
                             │ (Se ausente)
                             ▼
┌──────────────────────────────────────────────────────────┐
│ 2. Variável de Runtime Injetada no Container             │
│    window.__ENV__.VITE_API_BASE_URL (Portainer / Nginx)  │
└────────────────────────────┬─────────────────────────────┘
                             │ (Se ausente)
                             ▼
┌──────────────────────────────────────────────────────────┐
│ 3. Variável de Build Vite (.env local)                   │
│    import.meta.env.VITE_API_BASE_URL                     │
└────────────────────────────┬─────────────────────────────┘
                             │ (Se ausente)
                             ▼
┌──────────────────────────────────────────────────────────┐
│ 4. Fallback Padrão: http://localhost:8080                │
└──────────────────────────────────────────────────────────┘
```

### Interceptor Dinâmico do Axios
Todas as chamadas do `httpClient` interceptam requisições ativas e atribuem dinamicamente `config.baseURL = getApiBaseUrl()`, permitindo troca instantânea de Hub sem necessidade de recarregar a página.

---

## 3. Modal de Conexão e Boas-Vindas (`ApiEndpointSetupModal`)

Ao inicializar o Shiori Web:
1. Se nenhuma URL de API estiver explicitamente configurada (isto é, ausente no `localStorage` e nas variáveis de ambiente), o modal de boas-vindas é exibido automaticamente.
2. O modal permite:
   - Digitar o endereço de qualquer instância pública ou privada da Shiori API.
   - Executar um teste ativo de conexão via `GET /actuator/health` exibindo status e latência em milissegundos.
   - Salvar e conectar imediatamente ou continuar com o localhost padrão.
3. O usuário pode reabrir o seletor a qualquer instante clicando no ícone do Servidor na barra de navegação superior (`Navbar`).

---

## 4. Engenharia de Software: Clean Code & SOLID (Uncle Bob)

Todos os componentes e hooks do Shiori Web seguem rigorosamente o **Princípio da Responsabilidade Única (SRP)**:

- **Hooks Especializados:** Hooks de busca, paginação, filtros e mutações residem em diretórios dedicados (`hooks/`), separados da apresentação visual.
- **Componentes Atômicos:** Modais e listas são quebrados em submódulos coesos (ex: `ShelfTable`, `ShelfGrid`, `ShelfCard`, `ShelfEditModal`, `ShelfCloseCycleModal`).
- **Isolamento de Estado com Zustand:**
  - `authStore`: Gerencia autenticação, token JWT e sessão do usuário.
  - `apiEndpointStore`: Controla o endpoint ativo, testes de latência e visibilidade do modal seletor.
  - `themeStore`: Alternância dinâmica entre temas escuro e claro.
  - `toastStore`: Notificações fluidas e não bloqueantes.
