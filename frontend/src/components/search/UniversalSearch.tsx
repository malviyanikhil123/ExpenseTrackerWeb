import React, { useEffect, useState } from "react"
import { SearchInput } from "../inputs/CustomInput"

export interface UniversalSearchProps {
  onSearch: (value: string) => void
  placeholder?: string
  initialValue?: string
  debounceMs?: number
}

export const UniversalSearch: React.FC<UniversalSearchProps> = ({
  onSearch,
  placeholder = "Search...",
  initialValue = "",
  debounceMs = 300,
}) => {
  const [value, setValue] = useState(initialValue)

  // Debounce logic (Section 27)
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(value)
    }, debounceMs)

    return () => {
      clearTimeout(handler)
    }
  }, [value, debounceMs, onSearch])

  const handleClear = () => {
    setValue("")
  }

  return (
    <div className="w-full sm:max-w-xs md:max-w-sm">
      <SearchInput
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClear={handleClear}
      />
    </div>
  )
}
