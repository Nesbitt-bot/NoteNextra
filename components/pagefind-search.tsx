'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

declare global {
  interface Window {
    pagefind?: {
      options?: (opts: Record<string, unknown>) => void
      search: (term: string, opts?: Record<string, unknown>) => Promise<{
        results: Array<{
          id: string
          data: () => Promise<{
            url: string
            excerpt?: string
            meta?: { title?: string }
            sub_results?: Array<{ title?: string; url?: string }>
          }>
        }>
      }>
    }
  }
}

function normalizeUrl(url: string) {
  if (!url) return '#'
  return url.startsWith('/') ? `${url}` : `/${url}`
}

export default function PagefindSearch() {
  const { theme, systemTheme } = useTheme()
  const darkMode = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Array<{ title: string; url: string; excerpt: string }>>([])
  const [ready, setReady] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchToken = useRef(0)
  const basePath = useMemo(() => process.env.NEXT_PUBLIC_BASE_PATH || '/NoteNextra', [])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = `${basePath}/_pagefind/pagefind.js`
    script.async = true
    script.onload = () => {
      window.pagefind?.options?.({ baseUrl: basePath })
      setReady(true)
    }
    document.body.appendChild(script)
    return () => {
      script.remove()
    }
  }, [basePath])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 0)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    if (!trimmed || !window.pagefind?.search) {
      setResults([])
      setLoading(false)
      return
    }

    const current = ++searchToken.current
    setLoading(true)

    const run = async () => {
      const response = await window.pagefind!.search(trimmed)
      const expanded = await Promise.all(
        response.results.slice(0, 8).map(async item => {
          const data = await item.data()
          return {
            title: data.meta?.title || data.sub_results?.[0]?.title || 'Untitled',
            url: normalizeUrl(data.url),
            excerpt: data.excerpt || ''
          }
        })
      )
      if (searchToken.current === current) {
        setResults(expanded)
        setLoading(false)
      }
    }

    run().catch(() => {
      if (searchToken.current === current) {
        setResults([])
        setLoading(false)
      }
    })
  }, [open, query])

  return (
    <>
      <button
        type="button"
        aria-label="Search (Ctrl/Cmd+K)"
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => {
          setOpen(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className="x:flex x:items-center x:gap-2 x:rounded-xl x:border x:border-black/10 x:px-3 x:py-2 x:text-sm x:text-gray-600 hover:x:text-black x:dark:border-white/15 x:dark:text-gray-300 x:dark:hover:text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span>Search</span>
        <span className="x:text-xs x:opacity-60">⌘K</span>
      </button>

      {open && (
        <div className="x:fixed x:inset-0 x:z-50 x:bg-black/45 x:p-4" onClick={() => setOpen(false)}>
          <div
            className={`x:mx-auto x:mt-16 x:max-w-2xl x:rounded-2xl x:border x:shadow-2xl ${darkMode ? 'x:border-white/10 x:bg-neutral-950 x:text-white' : 'x:border-black/10 x:bg-white x:text-black'}`}
            onClick={event => event.stopPropagation()}
          >
            <div className="x:border-b x:border-black/10 x:p-4 x:dark:border-white/10">
              <input
                ref={inputRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={ready ? 'Search local notes...' : 'Loading local search index...'}
                className="x:w-full x:bg-transparent x:text-base x:outline-none"
              />
            </div>
            <div className="x:max-h-[60vh] x:overflow-y-auto x:p-2">
              {!ready && <div className="x:px-3 x:py-6 x:text-sm x:opacity-70">Loading Pagefind…</div>}
              {ready && !query.trim() && <div className="x:px-3 x:py-6 x:text-sm x:opacity-70">Type to search this local build.</div>}
              {loading && <div className="x:px-3 x:py-6 x:text-sm x:opacity-70">Searching…</div>}
              {!loading && query.trim() && results.length === 0 && <div className="x:px-3 x:py-6 x:text-sm x:opacity-70">No local results found.</div>}
              {!loading && results.map(result => (
                <a
                  key={result.url}
                  href={result.url}
                  className="x:block x:rounded-xl x:px-3 x:py-3 hover:x:bg-black/5 x:dark:hover:bg-white/5"
                >
                  <div className="x:font-medium">{result.title}</div>
                  <div className="x:mt-1 x:text-xs x:opacity-60">{result.url}</div>
                  {result.excerpt && (
                    <div className="x:mt-2 x:text-sm x:opacity-80" dangerouslySetInnerHTML={{ __html: result.excerpt }} />
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
