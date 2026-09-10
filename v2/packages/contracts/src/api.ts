/** URI-versioned API surface: `/api/v1/...`. A breaking change ships as `v2` beside `v1`. */
export const API_PREFIX = 'api';
export const API_VERSION = '1';
export const API_BASE_PATH = `/${API_PREFIX}/v${API_VERSION}`;
export const HEALTH_PATH = `${API_BASE_PATH}/health`;
