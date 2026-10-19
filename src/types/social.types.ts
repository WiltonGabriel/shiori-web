export type TipoAtividadeFeed =
  | "INICIOU_LEITURA"
  | "ATUALIZOU_PROGRESSO"
  | "CONCLUIU_LEITURA"
  | "ENGAVETOU_LEITURA"
  | "AVALIOU_OBRA"
  | "ADICIONOU_ESTANTE";

export interface AtividadeFeedResponse {
  id: number;
  usuarioId: number;
  usuarioApelido: string;
  usuarioFotoUrl?: string;
  tipoAtividade: TipoAtividadeFeed;
  obraId?: number;
  obraTitulo?: string;
  obraCapaUrl?: string;
  descricao?: string;
  dataCriacao: string;
}

export interface ConexaoResponse {
  id: number;
  solicitanteId: number;
  solicitanteApelido: string;
  solicitanteFotoUrl?: string;
  receptorId: number;
  receptorApelido: string;
  receptorFotoUrl?: string;
  status: "PENDENTE" | "ACEITA" | "BLOQUEADA";
  dataSolicitacao: string;
}
