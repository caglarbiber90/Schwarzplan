import { useState, useRef, useEffect } from 'react'
import { searchAddress, GeoResult } from '../services/geocoding'
import { SEARCH_DEBOUNCE_MS } from '../services/constants'

interface Props {
  onSelect: (result: GeoResult) => void
  loading: boolean
}

export default function AddressSearch({ onSelect, loading }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (value.trim().length < 3) {
      setResults([]); setShowDropdown(false); return
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchAddress(value)
        setResults(res)
        setShowDropdown(res.length > 0)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, SEARCH_DEBOUNCE_MS)
  }

  function handleSelect(result: GeoResult) {
    setQuery(result.displayName.split(',').slice(0, 3).join(','))
    setShowDropdown(false)
    onSelect(result)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      handleSelect(results[0])
    }
    if (e.key === 'Escape') setShowDropdown(false)
  }

  return (
    <div className="address-search" ref={containerRef}>
      <label>Adresse</label>
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Adresse oder Ortsname eingeben..."
          disabled={loading}
        />
        {searching && <span className="spinner" />}
      </div>
      {showDropdown && (
        <ul className="search-results">
          {results.map((r, i) => (
            <li key={i} onClick={() => handleSelect(r)}>{r.displayName}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
