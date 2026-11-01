import type { TipoObra } from "./work.types";
import type { ItemCatalogoResponse } from "./catalog.types";

export interface UsuarioPerfilResponse {
  id: number;
  email: string;
  apelido: string;
  fotoUrl?: string;
  descricao?: string;
  fusoHorario?: string;
  role: string;
  pontosConfianca: number;
  onboardingConcluido: boolean;
  ativo: boolean;
  formatosPreferidos?: TipoObra[];
  dataCriacao: string;
  ultimaAtualizacao: string;
}

export interface UsuarioPerfilPublicoResponse {
  id: number;
  apelido: string;
  fotoUrl?: string;
  descricao?: string;
  fusoHorario?: string;
  pontosConfianca: number;
  dataCriacao?: string;
  saoConexoes?: boolean;
  estante?: {
    content?: ItemCatalogoResponse[];
    totalElements?: number;
  } | ItemCatalogoResponse[];
}

export interface ConcluirOnboardingRequest {
  apelido: string;
  fusoHorario?: string;
  fotoUrl?: string;
  descricao?: string;
  formatosPreferidos: TipoObra[];
}

export interface AtualizarPerfilRequest {
  apelido?: string;
  fotoUrl?: string;
  descricao?: string;
  fusoHorario?: string;
}

export interface AtualizarPreferenciasFormatosRequest {
  formatosPreferidos: TipoObra[];
}

export interface AlterarEmailRequest {
  novoEmail: string;
  senhaAtual: string;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}
