import { API_SERVER } from '../config/constant'
// import axios from 'axios'
import '../types'
import { SetUiAjaxConfigurationType, UIEventType } from '../types'
import waitForSidAvailable from './waitForSidAvailable.ts'

export const getAjaxSubmit = (
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType,
    kwargs: Record<string, any> = {},
    depsNames: Array<string> = [],
    pathname?: string,
) => {
    console.log('Registering AJAX: ', pathname, kwargs, depsNames)
    if (!pathname || !setUiAjaxConfiguration) {
        console.warn('Registration FAILED: pathname or setUiAjaxConfiguration is missing!')
        return () => {}
    }

    return async (extraKwargs: Record<string, any> = {}) => {
        if (depsNames.includes('sid')) {
            await waitForSidAvailable()
        }

        const data = new FormData()
        for (const [key, value] of Object.entries({ ...kwargs, ...extraKwargs })) {
            data.append(key, value)
        }

        for (const depName of depsNames) {
            if (depName === 'sid') {
                if (!window.sid) throw new Error("SocketIO isn't initialized properly")
                data.append('sid', window.sid)
            } else {
                const inputs = document.getElementsByName(depName)
                if (!inputs.length) {
                    console.warn(`No input found with name ${depName}`)
                    continue
                }
                const input = inputs[0]
                if (input instanceof HTMLInputElement) {
                    if (input.type === 'file' && input.files) {
                        Array.from(input.files).forEach((file) => data.append(depName, file))
                    } else {
                        data.append(depName, input.value)
                    }
                } else if (input instanceof HTMLTextAreaElement) {
                    data.append(depName, input.value)
                }
            }
        }

        const apiEndpoint = API_SERVER + 'api/ajax_content' + pathname

        setUiAjaxConfiguration(null)
        console.log(data)
        return await fetch(apiEndpoint, {
            method: 'POST',
            body: data,
        })
            .then(async (response) => {
                const contentType = response.headers.get('content-type') || ''
                const isJson = contentType.includes('application/json')
                const isStream = !!response.body?.getReader && !isJson

                if (isStream) {
                    const reader = response.body!.getReader()
                    const decoder = new TextDecoder()
                    let buffer = ''

                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        buffer += decoder.decode(value, { stream: true })

                        const lines = buffer.split('\n')
                        buffer = lines.pop() ?? ''

                        for (const line of lines) {
                            const trimmed = line.trim()
                            if (!trimmed) continue
                            try {
                                const currentEvent = JSON.parse(trimmed) as UIEventType
                                ;(setUiAjaxConfiguration as (events: UIEventType[]) => void)([
                                    currentEvent,
                                ])
                            } catch (err) {
                                console.warn('Failed to parse streamed line:', trimmed)
                            }
                        }
                    }

                    if (buffer.trim()) {
                        try {
                            const currentEvent = JSON.parse(buffer) as UIEventType
                            ;(setUiAjaxConfiguration as (events: UIEventType[]) => void)([
                                currentEvent,
                            ])
                        } catch (err) {
                            console.warn('Failed to parse final streamed line:', buffer)
                        }
                    }
                    return {}
                } else {
                    const data = await response.json()
                    setUiAjaxConfiguration(data)
                    return data
                }
            })
            .catch((err) => {
                console.error('AJAX request failed:', err)
                setUiAjaxConfiguration(null)
                return err
            })
    }
}

/*
export const getAjaxSubmit = (
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType,
    kwargs: Object = {},
    depsNames: Array<string> = [],
    pathname?: string,
) => {
    console.log('Registering AJAX: ', pathname, kwargs, depsNames)
    if (!pathname || !setUiAjaxConfiguration) {
        console.log('Registering FAILED: pathname or setUiAjaxConfiguration is missing!')
        return () => {}
    }

    return () => {
        setUiAjaxConfiguration(null)

        // Collect deps values

        const data = new FormData()
        for (let [key, value] of Object.entries(kwargs)) {
            data.append(key, value)
        }

        for (let dep_name of depsNames) {
            if (dep_name === 'sid') {
                if (!window.sid) {
                    throw new Error("SocketIO isn't initialized properly")
                }
                data.append('sid', window.sid)
            } else {
                const inputs = document.getElementsByName(dep_name)
                if (inputs.length === 0) {
                    continue
                }
                if (inputs[0] instanceof HTMLInputElement) {
                    const input: HTMLInputElement = inputs[0]
                    if (input.type === 'file' && input.files) {
                        for (let i = 0; i < input.files.length; i++) {
                            data.append(dep_name, input.files[i])
                        }
                    } else {
                        data.append(dep_name, input.value)
                    }
                } else if (inputs[0] instanceof HTMLTextAreaElement) {
                    const input: HTMLTextAreaElement = inputs[0]
                    data.append(dep_name, input.value)
                }
            }
        }

        const apiEndpoint = API_SERVER + 'api/ajax_content' + pathname

        // Refresh ajax group content
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
            'Content-Type': 'multipart/form-data',
        }

        axios
            .post(apiEndpoint, data, {
                headers: headers,
            })
            .then(function (response) {
                setUiAjaxConfiguration(response.data)
            })
            .catch(function (error) {
                if (error.message === 'canceled') return
                console.error('Error while getting initial data:', error)
                setUiAjaxConfiguration(null)
            })
    }
}

*/
