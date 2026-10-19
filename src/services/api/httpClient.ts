import axios from "axios";

/**
 * Instância HTTP base do Axios para o Shiori Web.
 * Configura baseUrl de acordo com ambiente (relativo para proxy no Vite ou variável .env).
 */
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
