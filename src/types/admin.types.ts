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
