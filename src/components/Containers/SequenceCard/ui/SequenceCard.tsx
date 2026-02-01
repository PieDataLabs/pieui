import { UIConfigType } from '../../../../types'
import {SequenceCardProps} from '../types'
import PieCard from '../../../PieCard'
import UI from '../../../UI'
import Radium from 'radium'
import { sx2radium } from '../../../../util/sx2radium'
import { registerPieComponent } from '../../../../util/registry'


const SequenceCard = ({
    data,
    content,
    setUiAjaxConfiguration,
}: SequenceCardProps) => {
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


// Register component
registerPieComponent({
    name: 'SequenceCard',
    component: Radium(SequenceCard),
    metadata: {
        author: "PieData",
        description: "Simple div with styles joining few components"
    }
})

export default Radium(SequenceCard)
