import axios from "axios";

/**
 * Instância HTTP base do Axios para o Shiori Web.
 * Configura baseUrl de acordo com a variável VITE_API_BASE_URL (padrão http://localhost:8080).
 */
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
