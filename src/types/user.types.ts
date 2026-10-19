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
  dataCriacao: string;
  ultimaAtualizacao: string;
}

export interface UsuarioPerfilPublicoResponse {
  id: number;
  apelido: string;
  fotoUrl?: string;
  descricao?: string;
  pontosConfianca: number;
  dataCriacao: string;
}
