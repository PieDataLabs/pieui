import { SetUiAjaxConfigurationType, UIConfigType } from '../../../../types'
import { UnionCardData } from '../types'
import PieCard from '../../../PieCard'
import UI from '../../../UI'

const UnionCard = ({
    data,
    content,
    setUiAjaxConfiguration,
}: {
    data: UnionCardData
    content: Array<UIConfigType>
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType
}) => {
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
