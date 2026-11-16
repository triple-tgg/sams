/**
 * IT Support contact channels shown on /it-support.
 *
 * Values come from public env vars so each environment (staging / production) can point
 * at its own help desk without a code change. A channel whose variable is empty is hidden.
 * Set them in `.env` (see `.env-example`).
 */
export interface ItSupportContact {
    email: string
    phone: string
    /** LINE ID or LINE Official Account, e.g. "@sams-it" */
    line: string
    /** Free text, e.g. "Mon–Fri 08:30–17:30 (ICT)" */
    hours: string
}

const clean = (value: string | undefined) => (value ?? '').trim()

// NEXT_PUBLIC_* must be referenced literally so Next.js can inline them at build time.
export const IT_SUPPORT: ItSupportContact = {
    email: clean(process.env.NEXT_PUBLIC_IT_SUPPORT_EMAIL),
    phone: clean(process.env.NEXT_PUBLIC_IT_SUPPORT_PHONE),
    line: clean(process.env.NEXT_PUBLIC_IT_SUPPORT_LINE),
    hours: clean(process.env.NEXT_PUBLIC_IT_SUPPORT_HOURS),
}

export const hasAnyItSupportChannel = (c: ItSupportContact = IT_SUPPORT) =>
    !!(c.email || c.phone || c.line)

/** Route of the IT Support page (no locale prefix). */
export const IT_SUPPORT_ROUTE = '/it-support'
