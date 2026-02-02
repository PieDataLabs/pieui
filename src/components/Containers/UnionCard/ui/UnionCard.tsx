import { UIConfigType } from '../../../../types'
import {UnionCardProps} from '../types'
import PieCard from '../../../PieCard'
import UI from '../../../UI'
import { registerPieComponent } from '../../../../util/registry'


const UnionCard = ({
    data,
    content,
    setUiAjaxConfiguration,
}: UnionCardProps) => {
    const { name } = data
    return (
        <PieCard card={name} data={data}>
            {content.map((obj: UIConfigType, i: number) => {
                return (
                    <UI
                        key={`children-${i}`}
                        uiConfig={obj}
                        setUiAjaxConfiguration={setUiAjaxConfiguration}
                    />
                )
            })}
        </PieCard>
    )
}

export default UnionCard