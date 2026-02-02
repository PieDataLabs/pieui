import { getApiServer } from '../config/constant'
import Axios from 'axios'
import { setupCache } from 'axios-cache-interceptor'
export const axios = setupCache(Axios)

export function prefetchLinks(prefetch: Array<string> | null) {
    // const prefetch = uiConfiguration?.prefetch_urls
    if (prefetch && prefetch.length) {
        prefetch.forEach((url: string) => {
            const apiEndpoint = getApiServer() + 'api/content' + url
            axios.get(apiEndpoint)
        })
    }
}
