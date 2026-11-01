# Shiori Web

Front-end web em **React 19 + TypeScript + Vite** do projeto **Shiori** (estágio **Alpha em desenvolvimento**).

---

## 1. Objetivo do Projeto

O **Shiori Web** é uma aplicação voltada ao **tracking pessoal de leitura** (mangás, manhwas, manhuas, light novels, web novels, livros e HQs) com foco na **Minha Estante** e na autonomia do leitor:

1. **Funciona sem depender de servidor:** Toda a estante pessoal é salva localmente no navegador (`localStorage`), permitindo cadastrar obras manualmente, recortar e converter capas/banners automaticamente para **WebP**, marcar exatamente onde parou, registrar datas de leitura e fazer backups `.json` (individuais ou em série).
2. **Conexão opcional com a Shiori API:** Quando o usuário quiser sincronizar sua estante na nuvem ou acessar o **Catálogo Global**, basta informar a URL do servidor e entrar com **Apelido + Senha** (conta única simplificada, sem exigir e-mail).

---

## 2. Mini Checklist do Objetivo (Estado Atual — Alpha)

### Concluído e Funcional
- [x] **Armazenamento Soberano Local-First com IndexedDB:** Motor nativo de persistência assíncrona (`shiori_db`, store `shelf_items`) sem limitação de 5MB, com cache em memória e migração automática e transparente a partir do `localStorage` legado (`shiori_local_shelf_v1`).
- [x] **Fluxo Format-First (Formato Primeiro):** Adição de obra em 2 etapas:
  - **Passo 1:** Seleção do formato da obra (`Mangá`, `Manhwa`, `Manhua`, `Light Novel`, `Web Novel`, `Livro`, `Comic / HQ`).
  - **Filtro de Preferências:** Exibe apenas os formatos ativos e permitidos pelas preferências de leitura do usuário.
  - **Passo 2:** Formulário detalhado com **gêneros adaptados contextualmente ao formato** (ex.: `LIVRO` nunca exibe `Shounen`/`Isekai`/`Mecha`, `MANGA` omite `Não-Ficção`/`Autoajuda`, `MANHWA` inclui `Dungeon / Portais`/`Regressão`).
  - **Terminologia Adaptativa:** Rótulos como "Capítulo / Página Atual" para livros. Botão `Trocar Formato ⇄` para alternar rapidamente.
- [x] **Estúdio de Recorte + Conversão Automática para WebP:** Pop-up interativo (upload, colar com `Ctrl+V` ou URL) que recorta **Capa (2:3)** e **Banner (16:9)** e converte automaticamente para formato `.webp` leve.
- [x] **Tracking Detalhado de Onde Parou:** Capítulo atual, volume atual, **marcador exato de onde parou** (ex.: página, trecho, porcentagem), data de início e data da última leitura.
- [x] **Gêneros Oficiais + Tags Personalizadas:** 41 gêneros oficiais universais integrados (disponíveis mesmo offline) + criação livre de tags temáticas com autocompletar das tags já usadas na estante.
- [x] **Barra Completa de Filtros na Estante:** Busca por título/título original/tag/onde parou, filtro por categoria, filtro por gênero/tag, filtro por período de data lida (`Hoje`, `Últimos 7 dias`, `Este mês`, `Este ano` ou data específica) e ordenação.
- [x] **Backup JSON em Série ou Individual:** Pop-up unificado para exportar todas as obras, exportar obras selecionadas ou exportar 1 obra individual (também disponível direto na página da obra), além de importar 1 ou múltiplos arquivos `.json` com pré-visualização.
- [x] **URL Inteligente de Leitura & Auto-Tracking:** Suporte a placeholder `{cap}` ou avanço automático do número do capítulo na URL privada, com prompt de confirmação de progresso ao retornar da aba de leitura e botão de **Iniciar Releitura** preservando ciclos anteriores.
- [x] **Conta Única (`Apelido + Senha`) & Perfil Público (`/leitor/:username`):** Sincronização direta da estante local com o servidor e página pública de perfil exibindo estante compartilhada e histórico.

### Pendente (Próximas Etapas)
- [ ] Importação direta de arquivos de listas externas (XML/CSV de outros rastreadores).
- [ ] Extensão de navegador integrada para auto-tracking sem precisar clicar pelo painel.
- [ ] Gráficos avançados de ritmo de leitura e metas anuais.

---

## 3. Stack Técnica

- **React 19** + **TypeScript 5** + **Vite 6**
- **Gerenciamento de Estado:** Zustand (`authStore`, `apiEndpointStore`, `themeStore`, `toastStore`)
- **Persistência Local:** `LocalShelfRepository` (`localStorage` + exportação/importação `.json`)
- **HTTP Client:** Axios com resolução dinâmica da URL da API e suporte a erros RFC 9457
- **Qualidade e Testes:** `oxlint` (lint), `Vitest` + `@testing-library/react` (testes unitários e de componentes)

---

## 4. Tutorial: Como Iniciar e Testar Localmente

### Pré-requisitos
- **Node.js 20+** (recomendado Node 22) e **npm**

### Passo 1 — Instalar Dependências
```bash
cd shiori-web
npm install
```

### Passo 2 — Configurar Variáveis de Ambiente (Opcional)
Se quiser apontar por padrão para uma instância local da `shiori-api`:

```bash
cp .env.example .env
```
*(Mesmo sem a API rodando, o Shiori Web funciona normalmente no modo local).*

### Passo 3 — Rodar Lint, Build e Testes Automatizados
Para validar o código antes de subir ou commitar:

```bash
# 1. Análise estática (oxlint)
npm run lint

# 2. Compilação TypeScript + Bundle de produção Vite
npm run build

# 3. Suíte completa de testes automatizados (Vitest)
npx vitest run
```

### Passo 4 — Iniciar o Servidor de Desenvolvimento
```bash
npm run dev -- --host 0.0.0.0 --port 5173
```
Acesse no navegador: **`http://localhost:5173`** (ou `http://localhost:3000` se rodar `npm run dev` com a porta padrão do `.env`).

### Como testar os principais fluxos rapidamente
1. **Adicionar Obra e Recortar Capa/Banner WebP:** Vá em **Minha Estante** $\rightarrow$ clique em **Adicionar Obra** $\rightarrow$ escolha a categoria no topo, envie ou cole (`Ctrl+V`) uma imagem para abrir o pop-up de recorte WebP, preencha onde parou e adicione tags.
2. **Filtrar por Data ou Tag:** Na barra de filtros da **Minha Estante**, filtre por categoria, tag ou por data de leitura (`Lido Hoje`, `Últimos 7 Dias`, etc.).
3. **Exportar / Importar Backup (Individual ou em Série):** Clique em **Exportar (.json)** ou **Importar (.json)** no topo da estante (ou em **Exportar Obra (Backup)** dentro da página de uma obra).
4. **Conectar ao Servidor (`shiori-api`):** Clique no botão de status do servidor na barra superior $\rightarrow$ informe `http://localhost:8080` $\rightarrow$ entre com **Apelido + Senha** para sincronizar sua estante.

---

## 5. Documentação do Repositório

- [`docs/AI_CONTEXT_MEMORY.md`](docs/AI_CONTEXT_MEMORY.md) — **Documento exclusivo de memória e contexto do projeto para IAs e desenvolvedores.**
- [`docs/ARQUITETURA_WEB.md`](docs/ARQUITETURA_WEB.md) — Arquitetura interna do front-end, persistência local e resolução de API.
- [`docs/DEPLOY_PORTAINER.md`](docs/DEPLOY_PORTAINER.md) — Guia de build Docker/Nginx e deploy no Portainer.

---

## 6. Licença

Distribuído sob a licença [MIT](LICENSE.txt).
