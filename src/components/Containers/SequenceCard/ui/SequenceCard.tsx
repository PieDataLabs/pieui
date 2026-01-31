import { PieEvent, SetUiAjaxConfigurationType, UIConfigType } from '../../../../types'
import { SequenceCardData } from '../types'
import PieCard from '../../../PieCard'
import UI from '../../../UI'
import Radium from 'radium'
import { sx2radium } from '../../../../util/sx2radium'


const SequenceCard = ({
    data,
    content,
    setUiAjaxConfiguration,
}: {
    data: SequenceCardData
    content: Array<UIConfigType>
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType
}) => {
    const { name, sx } = data
    return (
        <PieCard card={name} data={data}>
            <div style={sx2radium(sx)} id={name}>
                {content.map((obj: UIConfigType, i: number) => {
                    return (
                        <UI
                            key={`children-${i}`}
                            uiConfig={obj}
                            setUiAjaxConfiguration={setUiAjaxConfiguration}
                        />
                    )
                })}
            </div>
        </PieCard>
    )
}

export default Radium(SequenceCard)
