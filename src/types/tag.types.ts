export type StatusSugestaoTag = "PENDENTE" | "APROVADA" | "REJEITADA";
export type TipoVoto = "UPVOTE" | "DOWNVOTE";

export interface TagObraResponse {
  tagId: number;
  nome: string;
  slug: string;
  score: number;
  meuVoto?: TipoVoto | null;
}

export interface SugestaoTagResponse {
  id: number;
  obraId: number;
  tagId?: number | null;
  nomeTag: string;
  slugTag: string;
  status: StatusSugestaoTag;
  usuarioSugeridorApelido?: string;
  justificativa?: string;
  dataSugestao: string;
}

export interface SugerirTagRequest {
  nomeTag?: string;
  tagId?: number;
  justificativa?: string;
}

export interface VotoTagRequest {
  tipoVoto: TipoVoto;
}

export interface VotoTagResponse {
  tagId: number;
  obraId: number;
  scoreAtual: number;
  meuVoto: TipoVoto;
}

export interface SugestaoTagAdminResponse {
  id: number;
  obraId: number;
  obraTitulo: string;
  tagId?: number | null;
  nomeTag: string;
  slugTag: string;
  status: StatusSugestaoTag;
  usuarioSugeridorApelido: string;
  justificativa?: string;
  dataSugestao: string;
  adminAvaliadorApelido?: string;
  dataAvaliacao?: string;
  motivoRejeicao?: string;
}

export interface AvaliarSugestaoTagRequest {
  motivo: string;
}

export interface TagResponse {
  id: number;
  nome: string;
  slug: string;
}
