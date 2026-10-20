# Divergências de estados de leitura (`StatusLeitura`)

> Registro de **divergência conhecida**. Nenhum enum ou contrato foi alterado. A decisão de produto ainda está pendente.

## O que existe hoje

| Origem | Valores |
| --- | --- |
| Especificação de produto | `LENDO`, `PLANEJADO`, `ENGAVETADO`, `TERMINOU`, `ABDICOU` |
| API: `StatusLeitura.java` | `LENDO`, `ENGAVETADO`, `TERMINOU`, `PLANEJADO`, `PAUSADO`, `DROPOU`, `ABDICOU` |
| Web: `StatusLeitura` em `catalog.types.ts` | os mesmos 7 valores da API |

`PAUSADO` e `DROPOU` existem na API e no tipo do web, mas não fazem parte da especificação.

## Onde ocorrem conversões e tratamentos

| Local | Comportamento |
| --- | --- |
| API `StatusLeitura.fromString` | Na **entrada** JSON, `DROPOU` é convertido para `ABDICOU`. Os demais valores passam como estão. |
| API (saída) | Registros já gravados com `DROPOU` ou `PAUSADO` continuam sendo devolvidos como estão. Não foi encontrada migração de dados. |
| Web `shelf/domain/shelfFilters.ts` | A aba **Abdicou** agrupa `ABDICOU` e `DROPOU` (filtro e contagem). |
| Web `ShelfBadges.tsx` | Trata `DROPOU` e `ABDICOU` com o mesmo visual. |
| Web `PersonalWorkDetailsPage.tsx` | O seletor oferece `ABDICOU` e `PAUSADO`. Não oferece `DROPOU`. |
| Web `IncorporationModal.tsx` e `ShelfEditModal.tsx` | O seletor oferece apenas os 5 estados da especificação. |

## Inconsistências observadas

1. `PAUSADO` pode ser gravado pela página de detalhes pessoais, mas **não aparece em nenhuma aba** da estante. Só é contado em "Todos". Coberto por teste em `shelfFilters.test.ts`.
2. `PAUSADO` e `ENGAVETADO` têm semântica próxima, e só `ENGAVETADO` está na especificação.
3. `ShelfEditModal` não tem opção para `PAUSADO` nem `DROPOU`. O comportamento ao abrir um item com esses valores não foi verificado.
4. A conversão `DROPOU` para `ABDICOU` acontece só na entrada. Dados antigos dependem de tratamento no cliente.

## Regras para evitar novas incompatibilidades

- Não adicionar nem remover valores do enum no web sem alterar a API no mesmo ciclo.
- Não enviar `PAUSADO` nem `DROPOU` em novos formulários.
- Qualquer tratamento de `DROPOU` deve passar por `shelfFilters.ts`.

## Decisão pendente (produto)

Escolher uma das opções:

- **A.** Restringir aos 5 estados da especificação: migrar `PAUSADO` para `ENGAVETADO` e `DROPOU` para `ABDICOU` na API, e remover os dois valores do web.
- **B.** Manter os 7 valores: criar a aba para `PAUSADO` e documentá-lo na especificação.
