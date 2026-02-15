import parse from 'html-react-parser'
import { SetUiAjaxConfigurationType } from '../../../../types'

export const StringCell = ({
    data,
}: {
    data: string
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType
}) => {
    return parse(data)
}
