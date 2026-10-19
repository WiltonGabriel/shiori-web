export type TipoObra = "MANGA" | "NOVEL" | "MANHWA" | "MANHUA" | "COMIC" | "LIVRO";
export type StatusCatalogo = "PRIVADO" | "COMUNITARIO" | "OFICIAL";
export type StatusPublicacao = "EM_LANCAMENTO" | "CONCLUIDO" | "EM_HIATO" | "CANCELADO" | "NAO_LANCADO";

export interface ObraResponse {
  id: number;
  tituloPrincipal: string;
  tituloOriginal?: string;
  capaUrl?: string;
  sinopse?: string;
  totalCapitulosLancados?: number;
  notaGeral?: number;
  tipoObra: TipoObra;
  statusCatalogo: StatusCatalogo;
  criadoPorUsuarioId?: number;
  generos: string[];
  tags: string[];
}

export interface ObraCadastroRequest {
  tituloPrincipal: string;
  tituloOriginal?: string;
  capaUrl?: string;
  sinopse?: string;
  totalCapitulosLancados?: number;
  tipoObra: TipoObra;
  generos?: string[];
  tags?: string[];
}
