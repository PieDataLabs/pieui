'use client'

import clientSources from '../platform/clientSources'
import { flushStoredResolversToForm } from './ajaxCommonUtils'

/**
 * Submits the hidden global PieUI form (`#piedata_global_form`) that is
 * rendered by every PieRoot variant. Delegates to the active platform's
 * `ClientSources` implementation, which no-ops when the form is not mounted
 * (and on the server). On React Native there is no HTML form; the native
 * implementation supplies its own submission strategy.
 *
 * Before delegating, function-valued `stored` resolvers are flushed into the
 * form's DOM as hidden inputs ({@link flushStoredResolversToForm}) so the
 * native `form.submit()` serializes their current values — the resolvers run
 * exactly once, here at submit time.
 */
export const submitGlobalForm = () => {
    flushStoredResolversToForm()
    clientSources.submitGlobalForm()
}
