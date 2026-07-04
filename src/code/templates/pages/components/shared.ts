import type { CardScaffoldOptions } from '../../../types'

export const dataDestructureFor = (
    options: CardScaffoldOptions = {}
): string => {
    // Ajax endpoints are read from `data` by `useAjaxSubmits(data, …)` (which
    // supports multiple endpoints per card), so no ajax triple is destructured.
    if (!options.io) {
        return 'const { name } = data'
    }

    const fields = [
        'name',
        'useSocketioSupport',
        'useCentrifugeSupport',
        'useMittSupport',
        'centrifugeChannel',
    ]

    return `const {
    ${fields.join(',\n    ')},
} = data`
}

export const pieCardOpeningTagFor = (
    componentName: string,
    options: CardScaffoldOptions = {}
): string => {
    const storedAttr = options.input ? ' stored={stored}' : ''
    if (!options.io) {
        return `<PieCard card='${componentName}' data={data}${storedAttr}>`
    }

    const storedLine = options.input ? '\n            stored={stored}' : ''
    return `<PieCard
            card='${componentName}'
            data={data}
            useSocketioSupport={useSocketioSupport}
            useCentrifugeSupport={useCentrifugeSupport}
            useMittSupport={useMittSupport}
            centrifugeChannel={centrifugeChannel}${storedLine}
            methods={{
            }}
        >`
}

export const ajaxSubmitDeclarationFor = (
    options: CardScaffoldOptions = {}
): string => {
    if (!options.ajax) {
        return ''
    }

    // `ajaxSubmits` is keyed by endpoint: `ajaxSubmits.default` for the primary
    // `pathname`, `ajaxSubmits.<name>` for a `<name>Pathname` field.
    return `
    const ajaxSubmits = useAjaxSubmits(data, setUiAjaxConfiguration)`
}
