/**
 * Minimal pathname router owned by the chat plugin. The prebuilt shell has no
 * router of its own and never reads `location`; the static host SPA-falls-back
 * every path to index.html, so `/chat` and `/chat/:conversationId` work as
 * real URLs — this store is the only dispatcher.
 */
export type ChatRoute =
  | { view: 'chat'; conversationId: string | undefined }
  | { view: 'other' }

export function parseRoute(pathname: string): ChatRoute {
  if (pathname === '/chat' || pathname === '/chat/') return { view: 'chat', conversationId: undefined }
  const match = /^\/chat\/([^/]+)\/?$/.exec(pathname)
  if (match?.[1]) return { view: 'chat', conversationId: decodeURIComponent(match[1]) }
  return { view: 'other' }
}

export class Router {
  private listeners = new Set<() => void>()
  private snapshot = window.location.pathname

  getSnapshot = (): string => this.snapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    const onPop = (): void => this.sync()
    window.addEventListener('popstate', onPop)
    return () => {
      this.listeners.delete(listener)
      window.removeEventListener('popstate', onPop)
    }
  }

  private sync(): void {
    const next = window.location.pathname
    if (next === this.snapshot) return
    this.snapshot = next
    for (const listener of [...this.listeners]) listener()
  }

  navigate(path: string): void {
    if (path === this.snapshot) return
    window.history.pushState(null, '', path)
    this.sync()
  }
}
