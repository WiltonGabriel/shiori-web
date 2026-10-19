export type NivelBroadcast = "INFO" | "AVISO" | "URGENTE";

export interface BroadcastResponse {
  id: number;
  titulo: string;
  mensagem: string;
  nivel: NivelBroadcast;
  ativo: boolean;
  dataCriacao: string;
  dataExpiracao?: string;
  adminCriadorApelido: string;
}

export interface AdminDashboardResponse {
  totalUsuarios: number;
  totalUsuariosAtivos: number;
  totalObras: number;
  totalItensEstante: number;
  totalSugestoesPendentes: number;
  totalDenunciasComentariosPendentes: number;
  totalDenunciasObrasPendentes: number;
}

export interface ProvedorIntegracaoResponse {
  id: number;
  codigo: string;
  nomeExibicao: string;
  urlBase: string;
  ativo: boolean;
  requisicoesHoje: number;
  limiteDiario: number;
  dataUltimoReset?: string;
  dataUltimaRequisicao?: string;
}

export interface FeatureFlagResponse {
  id: number;
  chave: string;
  nome: string;
  descricao: string;
  ativado: boolean;
  dataAtualizacao: string;
}

export interface RegistroAuditoriaResponse {
  id: number;
  adminId?: number;
  adminApelido?: string;
  acao: string;
  entidadeAfetada: string;
  entidadeId: string;
  detalhes: string;
  ipOrigem?: string;
  dataHora: string;
}

export interface SugestaoEdicaoResponse {
  id: number;
  obraId: number;
  obraTitulo: string;
  usuarioSugeridorId?: number;
  usuarioSugeridorApelido?: string;
  tituloPrincipalSugerido?: string;
  tituloOriginalSugerido?: string;
  capaUrlSugerida?: string;
  sinopseSugerida?: string;
  totalCapitulosSugerido?: number;
  tipoObraSugerido?: string;
  justificativa?: string;
  status: "PENDENTE" | "APROVADA" | "REJEITADA";
  dataCriacao: string;
  dataAvaliacao?: string;
  parecerAdmin?: string;
}

export interface DenunciaComentarioResponse {
  id: number;
  comentarioId: number;
  comentarioTexto?: string;
  comentarioAutorId?: number;
  comentarioAutorApelido?: string;
  denuncianteId?: number;
  denuncianteApelido?: string;
  motivo: string;
  detalhes?: string;
  status: "ABERTA" | "ACEITA" | "REJEITADA";
  dataCriacao: string;
  dataResolucao?: string;
  parecerModeracao?: string;
}

export interface MesclarObrasRequest {
  obraDuplicadaId: number;
  obraPrincipalId: number;
}

export interface MesclarObrasResponse {
  obraPrincipalId: number;
  obraDuplicadaId: number;
  totalItensEstanteTransferidos: number;
  totalHistoricosTransferidos: number;
  mensagem: string;
}
