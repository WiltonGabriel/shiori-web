# Arquitetura do Shiori Web

Documento técnico objetivo descrevendo os módulos, persistência local e fluxos do front-end **Shiori Web**.

> Para o contexto completo de produto e diretrizes para agentes de IA, consulte [`docs/AI_CONTEXT_MEMORY.md`](AI_CONTEXT_MEMORY.md).

---

## 1. Persistência Soberana (`LocalShelfRepository`)

O núcleo do **Shiori Web** é a estante pessoal gerenciada por [`src/services/storage/localShelfRepository.ts`](../src/services/storage/localShelfRepository.ts) na chave `shiori_local_shelf_v1` do `localStorage`:

- Armazena todos os metadados e registros de leitura da obra:
  - Identificação e formato: `tipoObra` (`MANGA`, `MANHWA`, `MANHUA`, `LIGHT_NOVEL`, `WEB_NOVEL`, `LIVRO`, `COMIC`), `titulo`, `tituloOriginal` (opcional) e `sinopse` (opcional).
  - Imagens otimizadas: `capaUrl` (2:3 em WebP) e `bannerUrl` (16:9 em WebP).
  - Progresso e datas: `progressoAtual`, `volumeAtual`, `marcadorOndeParou` (página, trecho, porcentagem), `dataInicioLeitura`, `ultimaDataLida` e `dataConclusaoLeitura`.
  - Classificação: `generos` (lista de gêneros oficiais) e `tags` (tags livres criadas pelo leitor).
  - Ciclos de leitura: `historicosLeitura` (mantém todos os ciclos de leitura e releitura sem duplicar registros idênticos).
- Quando o usuário se conecta a uma instância da **Shiori API** com seu `Apelido + Senha`, [`CatalogService.syncLocalShelfToRemote()`](../src/services/catalog.service.ts) sincroniza os itens locais com o servidor.

---

## 2. Principais Módulos da Estante (`src/features/shelf/`)

1. **Estúdio de Recorte e Conversão WebP (`src/components/ui/ImageWebpCropModal/ImageWebpCropModal.tsx`):**
   - Aceita upload de arquivo, colagem da área de transferência (`Ctrl+V`) ou URL.
   - Permite ajustar zoom e enquadramento em HTML5 Canvas para **Capa (2:3)** e **Banner (16:9)**, convertendo automaticamente para `.webp` (`canvas.toDataURL("image/webp", quality)`).
2. **Criação Manual (`AddWorkToShelfModal.tsx`):**
   - Seleção de categoria logo no topo, busca assistida opcional, recorte de Capa/Banner WebP, marcador exato de onde parou, datas de leitura, 30 gêneros oficiais em chips e tags temáticas com autocompletar.
3. **Detalhes Pessoais da Obra (`PersonalWorkDetailsPage.tsx`):**
   - Exibe o Banner 16:9 WebP no topo, Capa 2:3, título original, sinopse, gêneros e `#tags`.
   - Scrubber de capítulos com edição rápida de **Onde Parou**, botão de **Iniciar Releitura** e botão de **Exportar Obra (Backup)** individual.
   - **URL Inteligente & Auto-Tracking:** Resolve placeholders `{cap}` ou incrementa números de capítulo na URL privada; ao retornar da aba externa de leitura, exibe confirmação rápida para salvar o capítulo lido.
4. **Central de Portabilidade em Série ou Individual (`ShelfPortabilityModal.tsx`):**
   - Permite exportar toda a estante, selecionar obras específicas com checkboxes (em arquivo único `.json` ou arquivos `.json` separados por obra) ou exportar 1 obra específica.
   - Permite importar 1 ou múltiplos arquivos `.json` simultaneamente com pré-visualização das obras antes de confirmar.
5. **Filtros e Ordenação (`domain/shelfFilters.ts` e `components/ShelfHeader.tsx`):**
   - Filtra por aba de status, busca textual (título, título original, tag, onde parou), categoria, gênero/tag e data de leitura (`Hoje`, `Últimos 7 dias`, `Este mês`, `Este ano` ou data exata), com ordenação por última leitura, nota, progresso ou nome.

---

## 3. Resolução Dinâmica do Servidor (`httpClient.ts`)

A URL da Shiori API é resolvida dinamicamente em [`src/services/api/httpClient.ts`](../src/services/api/httpClient.ts) na seguinte ordem:
1. Escolha manual do usuário salva no navegador (`localStorage["shiori_api_endpoint"]`).
2. Variável de runtime do container Docker (`window.__ENV__.VITE_API_BASE_URL`).
3. Variável `.env` de build (`import.meta.env.VITE_API_BASE_URL`).
4. Fallback local: `http://localhost:8080`.
