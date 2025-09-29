import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, Plus, Check } from "lucide-react"
import { useSearchPartsTools } from '@/lib/api/hooks/usePartsTools'

interface PartsToolsNameDropdownProps {
  value: string
  onChange: (value: string) => void
  error?: string
  index: number
}

const PartsToolsNameDropdown: React.FC<PartsToolsNameDropdownProps> = ({
  value,
  onChange,
  error,
  index
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value || '')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Use parts/tools search hook with debounced search term
  const { data: searchResults, isLoading } = useSearchPartsTools(searchTerm)

  // Get filtered parts/tools based on search results
  const filteredPartsTools = searchResults || []

  // Check if current search term exists in parts/tools list
  const isExistingPartsTool = filteredPartsTools.some(pt =>
    pt.code.toLowerCase() === searchTerm.toLowerCase()
  )

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle selection
  const handleSelect = (partsToolsCode: string) => {
    setSearchTerm(partsToolsCode)
    onChange(partsToolsCode)
    setIsOpen(false)
  }

  // Handle manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    onChange(newValue)
    setIsOpen(true)
  }

  // Handle create new parts/tools
  const handleCreateNew = () => {
    onChange(searchTerm)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Input
          id={`partsTools.${index}.partsToolsName`}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search or enter parts/tools name..."
          className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${error ? 'border-red-500 bg-red-50' : ''
            }`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Loading parts/tools...
            </div>
          )}

          {!isLoading && filteredPartsTools.length === 0 && searchTerm && (
            <div className="px-3 py-2">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full flex items-center gap-2 text-left px-2 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                <Plus className="h-4 w-4" />
                <span>Add new parts/tools: &ldquo;<strong>{searchTerm}</strong>&rdquo;</span>
              </button>
            </div>
          )}

          {!isLoading && filteredPartsTools.length > 0 && (
            <>
              {filteredPartsTools.map((partsTool) => (
                <button
                  key={partsTool.id}
                  type="button"
                  onClick={() => handleSelect(partsTool.code)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {partsTool.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {partsTool.id}
                    </div>
                  </div>
                  {partsTool.code.toLowerCase() === searchTerm.toLowerCase() && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </button>
              ))}

              {/* Add new option if search term doesn't match exactly */}
              {searchTerm && !isExistingPartsTool && (
                <div className="border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add new parts/tools: &ldquo;<strong>{searchTerm}</strong>&rdquo;</span>
                  </button>
                </div>
              )}
            </>
          )}

          {!isLoading && filteredPartsTools.length === 0 && !searchTerm && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Start typing to search parts/tools...
            </div>
          )}
        </div>
      )}

      {/* Status indicator */}
      {searchTerm && (
        <div className="mt-1 text-xs">
          {isExistingPartsTool ? (
            <span className="text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Existing parts/tools
            </span>
          ) : (
            <span className="text-blue-600 flex items-center gap-1">
              <Plus className="h-3 w-3" />
              New parts/tools (will be created)
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default PartsToolsNameDropdown