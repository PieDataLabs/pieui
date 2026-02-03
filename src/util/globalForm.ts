export const submitGlobalForm = () => {
    if (typeof document === 'undefined') return // безопасно для SSR

    const formElement = document.getElementById('piedata_global_form') as HTMLFormElement
    formElement && formElement.submit()
}

export const addInputToGlobalForm = (input: HTMLInputElement) => {
    if (typeof document === 'undefined') return // безопасно для SSR

    const formElement = document.getElementById('piedata_global_form') as HTMLFormElement
    formElement.appendChild(input)
}
