import {ReactNode} from "react";
import { UIConfigType } from "../../../types";


export interface PieStaticRootProps {
    uiConfig: UIConfigType
    fallback?: ReactNode
}
