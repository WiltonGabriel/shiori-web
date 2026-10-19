export type StatusLeitura = "LENDO" | "ENGAVETADO" | "TERMINOU" | "PLANEJADO" | "PAUSADO" | "DROPOU" | "ABDICOU";
export type Visibilidade = "PRIVADO" | "RESTRITO" | "PUBLICO";

export interface HistoricoLeituraResponse {
  id: number;
  capituloLido: number;
  volumeLido?: number;
  notaMomento?: number;
  anotacao?: string;
  dataLeitura: string;
}

export interface ItemCatalogoResponse {
  id: number;
  obraId?: number | null;
  obraTitulo: string;
  obraCapaUrl?: string;
  obraTotalCapitulos?: number;
  obraTotalVolumes?: number;
  progressoAtual: number;
  volumeAtual?: number;
  statusLeitura: StatusLeitura;
  avaliacaoPessoal?: number;
  visibilidade: Visibilidade;
  urlLeitura?: string;
  mediaAvaliacaoCiclos?: number;
  dataAdicao: string;
  ultimaAtualizacao: string;
  historicosLeitura: HistoricoLeituraResponse[];
  tipoObra?: string;
  titulo?: string;
  capaUrl?: string;
  totalCapitulos?: number;
  totalVolumes?: number;
  sincronizarMetadados?: boolean;
  temNovosCapitulos?: boolean;
  totalCapitulosGlobal?: number;
  desvinculado?: boolean;
}

export interface AdicionarItemCatalogoRequest {
  obraId?: number;
  titulo?: string;
  tituloPersonalizado?: string;
  capaUrl?: string;
  capaPersonalizada?: string;
  tipoObra?: string;
  capituloAtual?: number;
  capituloInicial?: number;
  volumeAtual?: number;
  volumeInicial?: number;
  totalCapitulos?: number;
  totalCapitulosEsperados?: number;
  totalVolumes?: number;
  totalVolumesEsperados?: number;
  visibilidade?: Visibilidade;
  statusLeitura?: StatusLeitura;
  urlLeitura?: string;
  sincronizarMetadados?: boolean;
}

export interface RegistrarProgressoRequest {
  capituloAtual: number;
  volumeAtual?: number;
  nota?: number;
  anotacao?: string;
  statusLeitura?: StatusLeitura;
}

export interface AtualizarVisibilidadeRequest {
  visibilidade: Visibilidade;
}

export interface VincularObraRequest {
  obraId: number;
  sincronizarMetadados?: boolean;
}

export interface EstanteItemExportDTO {
  titulo: string;
  capaUrl?: string;
  tipoObra?: string;
  progressoAtual?: number;
  volumeAtual?: number;
  totalCapitulos?: number;
  totalVolumes?: number;
  statusLeitura: StatusLeitura;
  visibilidade: Visibilidade;
  nota?: number;
  urlLeitura?: string;
  sincronizarMetadados?: boolean;
  obraGlobalId?: number;
  historicos?: {
    capituloInicial: number;
    capituloFinal: number;
    avaliacaoCiclo?: number;
    anotacoes?: string;
    dataLeitura: string;
  }[];
}

export interface EstanteExportDTO {
  versao: string;
  exportadoEm: string;
  usuarioApelido: string;
  totalItens: number;
  itens: EstanteItemExportDTO[];
}

export interface EstanteImportRequest {
  itens: EstanteItemExportDTO[];
  substituirExistentes?: boolean;
  sobrescrever?: boolean;
}

export type StatusPareamento = "PENDENTE" | "AUTORIZADO" | "SUSPENSO" | "BANIDO";

export interface SolicitacaoPareamentoRequest {
  instanceUuid: string;
  apelidoPublico: string;
}

export interface PareamentoResponse {
  id: number;
  instanceUuid: string;
  apelidoPublico: string;
  status: StatusPareamento;
  statusDescricao: string;
  tokenAcesso?: string;
  dataSolicitacao: string;
  dataDecisao?: string;
  motivoDecisao?: string;
  submissoesValidas?: number;
  tentativasSpam?: number;
  suspensoAte?: string;
}

export interface SubmissaoObraAnonimaRequest {
  instanceUuid: string;
  apelidoPublico: string;
  tituloPrincipal: string;
  tituloOriginal?: string;
  capaUrl?: string;
  sinopse?: string;
  totalCapitulosLancados?: number;
  totalVolumes?: number;
  tipoObra: string;
}
