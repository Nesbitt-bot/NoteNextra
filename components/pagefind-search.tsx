'use client'

import { useEffect, useId, useMemo, useState } from 'react'

declare global {
  interface Window {
    PagefindUI?: new (options: {
      element: string | Element
      bundlePath?: string
      baseUrl?: string
      resetStyles?: boolean
      showSubResults?: boolean
      showImages?: boolean
      translations?: Record<string, string>
    }) => unknown
  }
}

export default function PagefindSearch() {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState('')
  const containerId = useId().replace(/:/g, '')
  const triggerInputId = `${containerId}-trigger`
  const basePath = useMemo(() => process.env.NEXT_PUBLIC_BASE_PATH || '/NoteNextra', [])

  useEffect(() => {
    const cssId = 'pagefind-ui-css'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.href = `${basePath}/_pagefind/pagefind-ui.css`
      document.head.appendChild(link)
    }

    const mount = () => {
      if (!open || !window.PagefindUI) return
      const element = document.getElementById(containerId)
      if (!element || element.dataset.pagefindMounted === 'true') return
      new window.PagefindUI({
        element,
        bundlePath: `${basePath}/_pagefind/`,
        baseUrl: `${basePath}/`,
        showImages: false,
        showSubResults: true,
        resetStyles: false,
        translations: {
          placeholder: 'Search local notes...'
        }
      })
      element.dataset.pagefindMounted = 'true'
      setReady(true)
      window.setTimeout(() => {
        const modalInput = element.querySelector<HTMLInputElement>('.pagefind-ui__search-input')
        if (modalInput) {
          modalInput.focus()
          if (query.trim()) {
            modalInput.value = query
            modalInput.dispatchEvent(new Event('input', { bubbles: true }))
          }
        }
      }, 0)
    }

    const scriptId = 'pagefind-ui-script'
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    if (existing) {
      if (window.PagefindUI) mount()
      else existing.addEventListener('load', mount, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `${basePath}/_pagefind/pagefind-ui.js`
    script.type = 'module'
    script.async = true
    script.onload = mount
    document.body.appendChild(script)
  }, [basePath, containerId, open])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <div className="pagefind-trigger x:flex x:w-full x:max-w-sm x:items-center x:gap-2 x:rounded-xl x:border x:border-black/10 x:bg-white x:px-3 x:py-2 x:text-sm x:text-gray-600 x:shadow-sm x:dark:border-white/15 x:dark:bg-neutral-950 x:dark:text-gray-300">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" className="x:shrink-0">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id={triggerInputId}
          type="text"
          value={query}
          readOnly
          placeholder="Search local notes..."
          aria-label="Search (Ctrl/Cmd+K)"
          aria-keyshortcuts="Meta+K Control+K"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          className="x:min-w-0 x:flex-1 x:bg-transparent x:outline-none x:placeholder:text-gray-500 x:dark:placeholder:text-gray-500"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="x:shrink-0 x:text-xs x:opacity-60"
          aria-hidden="true"
          tabIndex={-1}
        >
          ⌘K
        </button>
      </div>

      {open && (
        <div className="x:fixed x:inset-0 x:z-50 x:bg-black/45 x:p-4" onClick={() => {
          setOpen(false)
          setQuery('')
        }}>
          <div
            className="pagefind-modal x:mx-auto x:mt-4 x:w-full x:rounded-2xl x:border x:border-black/10 x:bg-white x:p-4 x:shadow-2xl x:md:mt-12 x:dark:border-white/10 x:dark:bg-neutral-950"
            onClick={event => event.stopPropagation()}
          >
            {!ready && <div className="x:px-3 x:py-6 x:text-sm x:opacity-70">Loading local search…</div>}
            <div id={containerId} className="pagefind-host" />
          </div>
        </div>
      )}
      <style jsx global>{`
        .pagefind-modal {
          max-width: min(var(--nextra-content-width), calc(100vw - 2rem));
          height: min(80dvh, 56rem);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .pagefind-host {
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .pagefind-host .pagefind-ui {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .pagefind-host .pagefind-ui__form {
          flex: 0 0 auto;
        }

        .pagefind-host .pagefind-ui__drawer {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          min-height: 0;
          min-width: 0;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          gap: 1rem;
          padding-right: 0.25rem;
        }

        .pagefind-host .pagefind-ui__results-area {
          flex: 0 0 auto;
          min-height: auto;
          min-width: 0 !important;
          width: 100%;
          overflow: visible;
          margin-top: 0;
        }

        .pagefind-host .pagefind-ui__results {
          margin-bottom: 0;
          padding-bottom: 0.75rem;
        }

        .pagefind-host .pagefind-ui__result,
        .pagefind-host .pagefind-ui__result-inner,
        .pagefind-host .pagefind-ui__result-excerpt {
          min-width: 0 !important;
          width: 100%;
        }

        .pagefind-host .pagefind-ui__message {
          flex: 0 0 auto;
        }

        .pagefind-host .pagefind-ui__button {
          position: static;
          margin-bottom: 0.25rem;
          flex: 0 0 auto;
        }
      `}</style>
    </>
  )
}
