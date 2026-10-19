import type { InternalAxiosRequestConfig } from "axios";

let activeToken: string | null = null;

export const setHttpBearerToken = (token: string | null): void => {
  activeToken = token;
};

export const getHttpBearerToken = (): string | null => activeToken;

export const authRequestInterceptor = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  if (activeToken) {
    config.headers.Authorization = `Bearer ${activeToken}`;
  }
  return config;
};
