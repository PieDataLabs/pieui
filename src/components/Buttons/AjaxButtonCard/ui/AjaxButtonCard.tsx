import {AjaxButtonCardProps} from '../types'
import PieCard from '../../../PieCard'
import { getAjaxSubmit } from '../../../../util/ajaxCommonUtils'
import { usePieConfig } from '../../../../util/pieConfig'
import { useMemo } from 'react'
import parse from 'html-react-parser'
import Radium from "radium";
import {sx2radium} from "../../../../util/sx2radium.ts";


const AjaxButtonCard = ({
    data,
    setUiAjaxConfiguration,
}: AjaxButtonCardProps) => {
    const { apiServer, enableRenderingLog } = usePieConfig()
    const { name, title, iconUrl, iconPosition, sx, pathname, kwargs, depsNames } = data
    const ajaxSubmit = useMemo(
        () => getAjaxSubmit(setUiAjaxConfiguration, kwargs, depsNames, pathname, {
            apiServer,
            renderingLogEnabled: enableRenderingLog,
        }),
        [setUiAjaxConfiguration, kwargs, depsNames, pathname, apiServer, enableRenderingLog],
    )

    return (
        <PieCard card={'AjaxButtonCard'} data={data}>
            <button
                id={name}
                className='box-border flex min-h-12 w-full min-w-min cursor-pointer items-center justify-center rounded-[16px] border border-[#080318] bg-white text-center font-[TTForsTrial] text-[#080318] hover:bg-neutral-300'
                value={name}
                onClick={() => ajaxSubmit()}
                style={sx2radium(sx)}
                type='button'
            >
                {iconUrl && iconPosition === 'start' && <img src={iconUrl} alt='' />}
                {parse(title)}
                {iconUrl && iconPosition === 'end' && <img src={iconUrl} alt='' />}
            </button>
        </PieCard>
    )
}

export default Radium(AjaxButtonCard)
