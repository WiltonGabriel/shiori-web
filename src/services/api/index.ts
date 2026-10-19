import { httpClient } from "./httpClient";
import { authRequestInterceptor } from "./authInterceptor";
import { errorResponseInterceptor } from "./errorInterceptor";

httpClient.interceptors.request.use(authRequestInterceptor);
httpClient.interceptors.response.use((res) => res, errorResponseInterceptor);

export { httpClient as api };
export { setHttpBearerToken, getHttpBearerToken } from "./authInterceptor";
