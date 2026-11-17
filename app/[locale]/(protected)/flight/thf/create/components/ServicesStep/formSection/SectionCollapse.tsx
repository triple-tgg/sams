import React, { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { CollapsibleTrigger } from "@/components/ui/collapsible"

/**
 * Collapse state for a card/sub-section that is only collapsible under a condition.
 * - Not collapsible → always open (and resets to open, so it re-appears expanded later).
 * - Validation errors → forced open so errors are never hidden.
 */
export const useSectionCollapse = (isCollapsible: boolean, hasErrors = false) => {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!isCollapsible) setOpen(true)
  }, [isCollapsible])

  const isOpen = !isCollapsible || open || hasErrors
  return { isOpen, setOpen, isCollapsible, hasErrors }
}

/** Chevron button that toggles the nearest <Collapsible>. */
export const SectionCollapseToggle: React.FC<{
  isOpen: boolean
  disabled?: boolean
  label: string
}> = ({ isOpen, disabled, label }) => (
  <CollapsibleTrigger asChild>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      disabled={disabled}
      aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`}
      title={isOpen ? 'Collapse' : 'Expand'}
    >
      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </Button>
  </CollapsibleTrigger>
)
