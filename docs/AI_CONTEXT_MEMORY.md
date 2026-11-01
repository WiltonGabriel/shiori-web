# Memória de Contexto do Projeto Shiori (Exclusivo para IAs e Continuidade)

> **Propósito deste documento:** Fornecer a qualquer Agente de IA ou desenvolvedor que assuma o projeto o contexto exato, verdadeiro e atualizado do **Shiori** (`shiori-api` + `shiori-web`), evitando suposições erradas, retrabalho, mockups falsos ou textos de marketing desconectados do código real.

---

## 1. O Verdadeiro Objetivo do Projeto

O **Shiori** é um **rastreador pessoal de leitura soberano (Minha Estante)** combinado com um **catálogo colaborativo e sincronização comunitária**:

1. **Foco Central na Estante Pessoal Soberana (`Minha Estante`):**
   - O usuário cadastra e acompanha tudo o que está lendo (`Mangá`, `Manhwa`, `Manhua`, `Light Novel`, `Web Novel`, `Livro`, `Comic / HQ`).
   - Funciona **100% localmente no navegador** (`LocalShelfRepository` alimentado nativamente por **IndexedDB** — banco `shiori_db`, store `shelf_items` com fallback e auto-migração transparente a partir do `localStorage` `shiori_local_shelf_v1`).
   - **Fluxo Format-First (Formato Primeiro):**
     - O primeiro passo na adição de qualquer obra é a seleção do formato literário.
     - **Filtro Estrito de Preferências:** Somente os formatos ativos de acordo com as preferências de leitura do leitor (`FormatPreferencesRepository.getAllowedFormatsForCreation()`) são exibidos.
     - **Gêneros e Terminologia Contextuais:** Os gêneros disponíveis adaptam-se estritamente ao formato escolhido (`GenreService.getGenresForFormat()`). Em `LIVRO`, termos e gêneros de mangá/anime (ex.: `Shounen`, `Isekai`, `Mecha`) são estritamente suprimidos e gêneros como `Não-Ficção`, `Filosofia`, `Poesia` e `Autoajuda` aparecem; em `MANGA`, gêneros acadêmicos/não-ficção somem; em `MANHWA`, gêneros coreanos (`Dungeon / Portais`, `Regressão`, `Otome Isekai (Vilã)`) aparecem.
     - **Terminologia Adaptativa:** Em livros, campos exibem "Capítulo / Página Atual" e "Total de Capítulos / Páginas".
     - Botão `Trocar Formato ⇄` no topo permite alternar o formato e atualizar os gêneros contextuais em tempo real.
   - **Rastreamento Minucioso:**
     - **Título Principal** (obrigatório), **Título Original** (opcional) e **Sinopse** (opcional).
     - **Imagens otimizadas em WebP:** Pop-up interativo de recorte (`ImageWebpCropModal.tsx`) que aceita upload, colagem (`Ctrl+V`) ou URL, recortando **Capa (2:3)** e **Banner (16:9)** e convertendo tudo automaticamente para `.webp`.
     - **Onde Parou Exatamente:** Além de `Capítulo Atual` e `Volume Atual`, possui o campo livre `marcadorOndeParou` (ex.: `"Pág. 142"`, `"Meio do cap. 15"`, `"38%"`, `"Antes da luta no castelo"`).
     - **Datas de Leitura:** `dataInicioLeitura`, `ultimaDataLida` e `dataConclusaoLeitura` (preenchidas automaticamente conforme o usuário lê/conclui, mas editáveis).
     - **Link Privado Inteligente e Auto-Tracking:** Suporta placeholder `{cap}` ou incremento automático do número do capítulo na URL; quando o usuário abre o link externo e volta para a aba do Shiori, um banner oferece confirmação de leitura com 1 clique. Ao atingir o total de capítulos, a obra muda automaticamente para `TERMINOU`. Também permite **Iniciar Releitura** zerando o ponteiro atual sem apagar os ciclos anteriores.
     - **Portabilidade Soberana JSON:** Exportação e importação em lote (estante inteira ou seleção com checkboxes) ou de 1 obra individual (`ShelfPortabilityModal.tsx` e botão direto em `PersonalWorkDetailsPage.tsx`).

2. **Papel do Servidor (`shiori-api`):**
   - **Hub de Sincronização e Backup Permanente:**
     - Flyway migration `V3__adicionar_campos_tracking_item_catalogo.sql` com suporte nativo a `titulo_original`, `sinopse`, `banner_url`, `marcador_onde_parou`, `data_inicio_leitura`, `ultima_data_lida`, `data_conclusao_leitura`, `tags` e ampliação de `capa_url`.
     - Endpoints completos na API: `PATCH /api/catalogo/{id}` e `PUT /api/catalogo/{id}` para atualização granular da estante sincronizada.
   - **Conta Única Simplificada (`Apelido + Senha`):** Conecta ou cria conta em 1 passo sem burocracia de e-mail obrigatório.
   - **Perfil Público de Leitor (`/leitor/:username`):** Exibe a estante pública/compartilhada e histórico de leituras.
   - **Catálogo Global e Curadoria:** Obras comunitárias/oficiais com propostas estilo Pull Request, curadoria de metadados, votação de tags e moderação.
   - **Painel Administrativo Embutido (`/admin/`):** SPA servida direto pela API em `http://localhost:8080/admin/`.

---

## 2. Regras de Ouro e Decisões Inegociáveis do Usuário

1. **PROIBIDO Criar Mockups ou Telas Falsas:**
   - Toda funcionalidade visível na interface DEVE estar conectada a lógica real (IndexedDB/LocalShelfRepository e/ou endpoints reais na API).
2. **Formato Primeiro e Contextualização:**
   - Ao adicionar uma obra, o formato é escolhido primeiro e respeita as preferências de leitura do usuário. Gêneros nunca devem ser anacrônicos ao formato selecionado.
3. **Privacidade e Isolamento Estrito de Dados Pessoais:**
   - Propostas comunitárias enviadas para o Catálogo Global NUNCA transmitem dados pessoais da estante (URL privada de leitura, progresso atual, notas, marcador onde parou ou status de leitura).
4. **Local-First com Zero Perda de Dados:**
   - O leitor pode usar o Shiori 100% offline via IndexedDB. Ao conectar a uma conta remota, os dados locais são mesclados e sincronizados silenciosamente.
5. **Conectores Externos Agnósticos (Sem Nomes de Terceiros Chumbados):**
   - O sistema de integração externa (`GenericoIntegracaoClient.java`) não deve ter nomes fixos de provedores comerciais chumbados no código.
6. **Comunicação Sóbria:**
   - Comunicação técnica, direta e transparente quanto ao estágio Alpha do projeto.

---

## 3. Mapa Rápido da Arquitetura Atual

### Back-end (`shiori-api`)
- **Autenticação:** `AuthController.java`, `AuthService.java`
- **Estante e Sincronização:** `ItemCatalogo.java`, `ItemCatalogoController.java`, `ItemCatalogoService.java` (Flyway V3)
- **Catálogo Global & Curadoria:** `ObraController.java`, `ObraService.java`, `SugestaoEdicaoService.java`
- **Painel Admin Embutido:** `admin-ui/` compilado em `src/main/resources/static/admin/`

### Front-end (`shiori-web`)
- **Armazenamento Soberano Local-First:**
  - `src/services/storage/indexedDbShelf.ts` (Motor assíncrono nativo para `shiori_db`, store `shelf_items`)
  - `src/services/storage/localShelfRepository.ts` (Repositório soberano com cache em memória e migração automática de `localStorage`)
  - `src/services/storage/formatPreferencesRepository.ts` (Repositório de preferências com `getAllowedFormatsForCreation`)
  - `src/services/genre.service.ts` (`DEFAULT_GENRES`, `FORMAT_GENRES_MAP` e `getGenresForFormat`)
- **Fluxo Format-First:**
  - `src/features/shelf/components/AddWorkToShelfModal.tsx` (Passo 1: Cards de Formato; Passo 2: Formulário contextualizado)
- **Ficha Pessoal & Scrubber:**
  - `src/features/shelf/PersonalWorkDetailsPage.tsx`
  - `src/features/shelf/components/ShelfPortabilityModal.tsx`

---

## 4. Comandos Obrigatórios de Verificação (Padrão `mandatory-clean-code-solid`)

### No `shiori-web`:
```bash
cd shiori-web
npm run lint
npm run build
npx vitest run
```

### No `shiori-api`:
```bash
cd shiori-api
./mvnw test-compile
./mvnw test
```
