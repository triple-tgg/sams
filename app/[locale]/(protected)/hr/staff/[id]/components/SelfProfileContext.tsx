'use client'

import { createContext, useContext } from 'react'

/**
 * True when the staff profile is the signed-in user's own, opened from
 * /profile. Lets the owner edit a fixed set of sections without HR_STAFF
 * rights: profile image, Documents, AMEL Attachment, Contact (except Email)
 * and Logbook Records. Everything else still follows HR_STAFF permissions.
 */
const SelfProfileContext = createContext(false)

export const SelfProfileProvider = SelfProfileContext.Provider

export const useIsSelfProfile = () => useContext(SelfProfileContext)
