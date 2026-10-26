import type { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { errorResponseInterceptor } from "./errorInterceptor";
import { ShioriApiError } from "../../types/error.types";

function createMockAxiosError(partial: Partial<AxiosError>): AxiosError {
  return {
    name: "AxiosError",
    message: "Request failed",
    isAxiosError: true,
    toJSON: () => ({}),
    ...partial,
  } as AxiosError;
}

describe("errorResponseInterceptor (Regressão de Erros de Rede e RFC 9457)", () => {
  it("não atribui status 500 a erros de rede puros (ERR_NETWORK / offline)", async () => {
    const networkError = createMockAxiosError({
      code: "ERR_NETWORK",
      message: "Network Error",
      response: undefined,
    });

    await expect(errorResponseInterceptor(networkError)).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ShioriApiError);
      const apiErr = err as ShioriApiError;
      // Regressão Crítica: Não pode ser 500! Erro de rede não possui status HTTP.
      expect(apiErr.status).toBeUndefined();
      expect(apiErr.problem.status).toBeUndefined();
      expect(apiErr.problem.title).toBe("Falha na Conexão");
      expect(apiErr.problem.detail).toContain("Não foi possível conectar ao servidor Shiori");
      return true;
    });
  });

  it("trata timeout (ECONNABORTED) com título específico e sem status HTTP arbitrário", async () => {
    const timeoutError = createMockAxiosError({
      code: "ECONNABORTED",
      message: "timeout of 15000ms exceeded",
      response: undefined,
    });

    await expect(errorResponseInterceptor(timeoutError)).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ShioriApiError);
      const apiErr = err as ShioriApiError;
      expect(apiErr.status).toBeUndefined();
      expect(apiErr.problem.title).toBe("Tempo Limite Excedido");
      expect(apiErr.problem.detail).toContain("demorou muito para responder");
      return true;
    });
  });

  it("preserva resposta RFC 9457 ProblemDetail vinda do servidor Spring Boot", async () => {
    const rfcError = createMockAxiosError({
      response: {
        status: 422,
        statusText: "Unprocessable Entity",
        headers: {},
        config: {} as any,
        data: {
          title: "Erro de Validação",
          status: 422,
          detail: "Os dados enviados são inválidos.",
          errosValidacao: {
            titulo: "Título é obrigatório",
          },
        },
      },
    });

    await expect(errorResponseInterceptor(rfcError)).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ShioriApiError);
      const apiErr = err as ShioriApiError;
      expect(apiErr.status).toBe(422);
      expect(apiErr.problem.title).toBe("Erro de Validação");
      expect(apiErr.problem.errosValidacao).toEqual({ titulo: "Título é obrigatório" });
      return true;
    });
  });

  it("preserva status 500 quando a resposta realmente provém do servidor", async () => {
    const serverError = createMockAxiosError({
      response: {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        config: {} as any,
        data: null,
      },
    });

    await expect(errorResponseInterceptor(serverError)).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ShioriApiError);
      const apiErr = err as ShioriApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.problem.title).toBe("Instabilidade no Servidor");
      expect(apiErr.problem.detail).toContain("erro interno temporário");
      return true;
    });
  });
});
