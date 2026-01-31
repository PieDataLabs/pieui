import { ReactNode } from "react";


export interface PieRootProps {
    location: {
        pathname: string;
        search: string;
    },
    fallback?: ReactNode
    onError?: () => void
}
