import { useEffect, useSyncExternalStore } from 'react'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'

import { ChatApi } from './api.js'
import { ChatNavAction } from './ChatNavAction.js'
import { ChatPage } from './ChatPage.js'
import { CHAT_LOCALE_NS, dictionaries } from './locales.js'
import type { ChatT } from './locales.js'
import { parseRoute, Router as ChatRouter } from './router.js'
import type { Router } from './router.js'
import { ChatStore as ChatStoreImpl } from './store.js'
import type { ChatStore } from './store.js'
import './styles.css'

export const inject = ['slots', 'locale', 'connection']

interface Injected {
  t: ChatT
  chat: ChatStore
  router: Router
}

/** shell.overlay entry: renders the chat page only while the route matches. */
function ChatOverlay({ t, chat, router }: Injected) {
  const pathname = useSyncExternalStore(router.subscribe, router.getSnapshot)
  const active = parseRoute(pathname).view === 'chat'

  useEffect(() => {
    if (!active) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') router.navigate('/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, router])

  if (!active) return null
  return (
    <div className="dshsc-overlay">
      <ChatPage t={t} chat={chat} router={router} />
    </div>
  )
}

export function apply(ctx: ClientContext): void {
  const router = new ChatRouter()
  // The client `connection` service is not type-augmented on Context by its
  // package; the host-facing merge is what `ctx.connection` resolves to here,
  // so narrow it to the client RPC caller explicitly.
  const rpc = (ctx.connection as unknown as { rpc: ClientConnectionRpc }).rpc
  const chat = new ChatStoreImpl(new ChatApi(rpc))

  ctx.effect(() => () => chat.dispose(), 'standalone-chat: store')
  ctx.effect(() => ctx.locale.register(CHAT_LOCALE_NS, dictionaries), 'standalone-chat: dictionaries')

  ctx.slots.inject('sidebar.footer.action', () =>
    ctx.slots.register(
      {
        name: 'sidebar.footer.action',
        id: 'standalone-chat',
        order: 10,
        label: () => ctx.locale.bind(CHAT_LOCALE_NS)('nav'),
        locale: CHAT_LOCALE_NS,
        inject: () => ({ router }),
      },
      ChatNavAction,
    ),
  )

  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      {
        name: 'shell.overlay',
        id: 'standalone-chat-page',
        order: 40,
        label: () => ctx.locale.bind(CHAT_LOCALE_NS)('title'),
        locale: CHAT_LOCALE_NS,
        inject: () => ({ chat, router }),
      },
      ChatOverlay,
    ),
  )
}
