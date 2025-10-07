"use client"

import React, { useState } from "react"
import { Controller } from "react-hook-form"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/components/ui/field-error"

interface Option {
  value: string
  label: string
}

interface SearchableSelectFieldProps {
  name: string
  control: any
  label: string
  placeholder: string
  options: Option[]
  isLoading?: boolean
  error?: string
  usingFallback?: boolean | "" | undefined
  errorMessage?: string
}

export const SearchableSelectField: React.FC<SearchableSelectFieldProps> = ({
  name,
  control,
  label,
  placeholder,
  options,
  isLoading = false,
  error,
  usingFallback,
  errorMessage,
}) => {
  const [searchTerm, setSearchTerm] = useState("")

  // filter options by search keyword
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            value={field.value?.value || ""}
            onValueChange={(value) => {
              const option = options.find((opt) => opt.value === value)
              field.onChange(option || null)
            }}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoading
                    ? `Loading ${label.toLowerCase()}...`
                    : placeholder
                }
              />
            </SelectTrigger>

            <SelectContent>
              {/* 🔍 Search box */}
              <div className="p-2 sticky top-0 bg-white border-b border-gray-100 z-10">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="h-8 text-sm"
                />
              </div>

              {/* 🗂 Options */}
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
              ) : (
                <div className="py-2 px-3 text-sm text-gray-500 select-none">
                  {isLoading
                    ? `Loading ${label.toLowerCase()}...`
                    : searchTerm
                      ? `No ${label.toLowerCase()} found`
                      : `No data available`}
                </div>
              )}
            </SelectContent>
          </Select>
        )}
      />

      {/* ⚠️ Field error */}
      <FieldError msg={errorMessage} />

      {/* ⚙️ Fallback notice */}
      {usingFallback && (
        <p className="text-sm text-amber-600">
          ⚠️ Using offline {label.toLowerCase()} data due to API connection issue
        </p>
      )}
    </div>
  )
}
