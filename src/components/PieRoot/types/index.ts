import { ReactNode } from "react";


export interface PieRootProps {
    location: URL,
    fallback?: ReactNode
    onError?: () => void
}
