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
  const containerId = useId().replace(/:/g, '')
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
      <button
        type="button"
        aria-label="Search (Ctrl/Cmd+K)"
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => setOpen(true)}
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
            className="pagefind-modal x:mx-auto x:mt-12 x:w-full x:rounded-2xl x:border x:border-black/10 x:bg-white x:p-4 x:shadow-2xl x:dark:border-white/10 x:dark:bg-neutral-950"
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
          max-height: min(80vh, 56rem);
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
          overflow: hidden;
          gap: 1rem;
        }

        .pagefind-host .pagefind-ui__results-area {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          padding-right: 0.25rem;
          overscroll-behavior: contain;
        }

        .pagefind-host .pagefind-ui__results {
          margin-bottom: 0;
          padding-bottom: 0.75rem;
        }

        .pagefind-host .pagefind-ui__button {
          position: static;
          margin-bottom: 0.25rem;
        }
      `}</style>
    </>
  )
}
