export type StatusLeitura = "LENDO" | "FADIGOU" | "TERMINOU" | "PLANEJADO" | "PAUSADO" | "DROPOU";
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
  obraId: number;
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
}

export interface AdicionarItemCatalogoRequest {
  obraId: number;
  visibilidade?: Visibilidade;
  statusLeitura?: StatusLeitura;
  urlLeitura?: string;
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
