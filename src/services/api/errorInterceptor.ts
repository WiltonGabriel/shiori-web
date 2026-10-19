import type { AxiosError } from "axios";
import { ShioriApiError, type ProblemDetail } from "../../types/error.types";

export const errorResponseInterceptor = (error: AxiosError): Promise<never> => {
  if (error.response?.data) {
    const data = error.response.data as ProblemDetail;
    if (data.title || data.status || data.detail) {
      return Promise.reject(new ShioriApiError(data));
    }
  }

  // Fallback para problemas de conexão de rede ou erros não RFC 9457
  const fallbackProblem: ProblemDetail = {
    title: error.message || "Erro de Conexão",
    status: error.response?.status || 500,
    detail:
      error.code === "ERR_NETWORK"
        ? "Não foi possível conectar ao servidor Shiori. Verifique sua conexão ou se a API está online."
        : error.message || "Ocorreu uma falha inesperada na requisição.",
  };

  return Promise.reject(new ShioriApiError(fallbackProblem));
};
