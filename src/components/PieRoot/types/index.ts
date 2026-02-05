import { ReactNode } from "react";
import {PieConfig} from "../../../types";


export interface PieRootProps {
    location: {
        pathname: string;
        search: string;
    },
    fallback?: ReactNode
    onError?: () => void
    onNavigate?: (url: string) => void
    config: PieConfig
    initializePie: () => void
}
