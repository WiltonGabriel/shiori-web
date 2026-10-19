/**
 * Representa a estrutura padrão RFC 9457 ProblemDetail emitida pelo Shiori API.
 */
export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  path?: string;
  timestamp?: string;
  errosValidacao?: Record<string, string>;
}

export class ShioriApiError extends Error {
  public readonly status: number;
  public readonly problem: ProblemDetail;

  constructor(problem: ProblemDetail) {
    super(problem.detail || problem.title || "Erro inesperado na API Shiori");
    this.name = "ShioriApiError";
    this.status = problem.status;
    this.problem = problem;
  }
}
