import { API_SERVER } from '../config/constant'
import { AxiosError } from 'axios'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'

import SocketIOInitProvider from '../providers/SocketIOInitProvider.tsx'
import CentrifugeIOInitProvider from '../providers/CentrifugeIOInitProvider.tsx'

import UI from '../components/UI'
import { createAxiosDateTransformer } from 'axios-date-transformer'
import SocketIOContext, { socket } from '../util/socket'
import CentrifugeIOContext, { centrifuge } from '../util/centrifuge'
import MittContext, { emitter } from '../util/mitt'
import { StyleRoot } from 'radium'
import {UIConfigType} from "../types";

const axiosInstance = createAxiosDateTransformer({
    baseURL: API_SERVER,
})

const queryClient = new QueryClient()

const MainViewContent = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const {
        data: uiConfiguration,
        isLoading,
        error,
    } = useQuery<UIConfigType, AxiosError>({
        queryKey: ['uiConfig', location.pathname + location.search],
        queryFn: async () => {
            const apiEndpoint = '/api/content' + location.pathname + location.search
            const response = await axiosInstance.get(apiEndpoint, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
                    'Content-type': 'application/json',
                },
                withCredentials: true,
            })
            return response.data
        },
        staleTime: Infinity, // данные всегда «свежие»
        // cacheTime: Infinity, // держать кэш бесконечно
        refetchOnWindowFocus: false, // не дергать при фокусе
        refetchOnMount: false, // не дергать при маунте
        refetchOnReconnect: false, // не дергать при восстановлении сети
        retry: true, // 🔥 бесконечные ретраи (пока не успешно)
        retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
    })

    if (error) {
        navigate('/404', { replace: true, state: { error: error.message } })
        return null
    }

    if (isLoading || !uiConfiguration) return <LoadingView />

    return (
        <form
            id='piedata_global_form'
            action={API_SERVER + 'api/process' + location.pathname}
            method='post'
            encType='multipart/form-data'
        >
                    <MittContext.Provider value={emitter}>
                        <SocketIOContext.Provider value={socket}>
                            <CentrifugeIOContext.Provider value={centrifuge}>
                                <SocketIOInitProvider>
                                    <CentrifugeIOInitProvider>
                                        <Notifications />
                                        <StyleRoot>
                                            <UI uiConfig={uiConfiguration} />
                                        </StyleRoot>
                                        <IOEventsProvider />
                                    </CentrifugeIOInitProvider>
                                </SocketIOInitProvider>
                            </CentrifugeIOContext.Provider>
                        </SocketIOContext.Provider>
                    </MittContext.Provider>
        </form>
    )
}

const MainView = () => (
    <QueryClientProvider client={queryClient}>
        <MainViewContent />
    </QueryClientProvider>
)

export default MainView
