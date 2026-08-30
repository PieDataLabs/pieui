/**
 * Склейка базового URL API с путём.
 *
 * `apiServer` в разных хостах написан и со слэшем на конце, и без; половина
 * кода раньше клеила его встык (`apiServer + 'api/process'`) и ломалась на
 * варианте без слэша, а `buildContentUrl` слэш срезал. Правило теперь одно.
 */
export function joinApiPath(apiServer: string, path: string): string {
    return `${apiServer.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}
