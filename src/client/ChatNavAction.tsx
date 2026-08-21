import { useSyncExternalStore } from 'react'

import type { ChatT } from './locales.js'
import type { Router } from './router.js'
import { parseRoute } from './router.js'

export interface ChatNavActionProps {
  wide: boolean
  t: ChatT
  router: Router
}

/** Sidebar foot action opening the standalone chat page. */
export function ChatNavAction({ wide, t, router }: ChatNavActionProps) {
  const pathname = useSyncExternalStore(router.subscribe, router.getSnapshot)
  const active = parseRoute(pathname).view === 'chat'
  return (
    <button
      type="button"
      className={`dshsc-navAction${active ? ' dshsc-navActionActive' : ''}`}
      title={t('nav')}
      aria-label={t('nav')}
      aria-current={active ? 'page' : undefined}
      onClick={() => router.navigate('/chat')}
    >
      <svg className="dshsc-navIcon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path
          d="M2.5 2.75c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v6.5c0 .69-.56 1.25-1.25 1.25H6.16l-2.9 2.61c-.42.38-1.06.06-1.06-.5V2.75Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M5 5.25h6M5 7.75h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {wide ? <span className="dshsc-navLabel">{t('nav')}</span> : null}
    </button>
  )
}
