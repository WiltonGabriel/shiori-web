import type { AxiosError } from "axios";
import { ShioriApiError, type ProblemDetail } from "../../types/error.types";
import { AuthService } from "../auth.service";

export const errorResponseInterceptor = (error: AxiosError): Promise<never> => {
  if (error.response?.status === 401) {
    AuthService.clearSession();
  }

  if (error.response?.data) {
    const data = error.response.data as ProblemDetail;
    if (data.title || data.status || data.detail) {
      return Promise.reject(new ShioriApiError(data));
    }
  }

  // Fallback para problemas de conexão de rede ou erros não RFC 9457
  const isTimeout = error.code === "ECONNABORTED" || Boolean(error.message?.toLowerCase().includes("timeout"));
  const isNetwork = !isTimeout && (error.code === "ERR_NETWORK" || !error.response);

  const fallbackProblem: ProblemDetail = {
    title: isTimeout
      ? "Tempo Limite Excedido"
      : isNetwork
      ? "Falha na Conexão"
      : error.response?.status === 500
      ? "Instabilidade no Servidor"
      : error.message || "Erro na Requisição",
    status: error.response?.status,
    detail: isTimeout
      ? "O servidor demorou muito para responder. Tente novamente em instantes."
      : isNetwork
      ? "Não foi possível conectar ao servidor Shiori. Verifique sua conexão ou se a API está online."
      : error.response?.status === 500
      ? "O servidor Shiori encontrou um erro interno temporário ao processar sua requisição."
      : error.message || "Ocorreu uma falha inesperada na requisição.",
  };

  return Promise.reject(new ShioriApiError(fallbackProblem));
};
