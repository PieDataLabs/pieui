export const submitGlobalForm = () => {
    const formElement = document.getElementById('piedata_global_form') as HTMLFormElement
    formElement && formElement.submit()
}

export const addInputToGlobalForm = (input: HTMLInputElement) => {
    const formElement = document.getElementById('piedata_global_form') as HTMLFormElement
    formElement.appendChild(input)
}
