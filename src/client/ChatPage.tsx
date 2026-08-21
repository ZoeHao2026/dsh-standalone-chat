import { useEffect } from 'react'
import { useSyncExternalStore } from 'react'

import { ChatList } from './ChatList.js'
import { Composer } from './Composer.js'
import type { ChatT } from './locales.js'
import { ModelSelect } from './ModelSelect.js'
import { MessageList } from './MessageList.js'
import type { Router } from './router.js'
import { parseRoute } from './router.js'
import type { ChatStore } from './store.js'

export interface ChatPageProps {
  t: ChatT
  chat: ChatStore
  router: Router
}

/** The full chat page: history column, transcript, composer. */
export function ChatPage({ t, chat, router }: ChatPageProps) {
  const pathname = useSyncExternalStore(router.subscribe, router.getSnapshot)
  const route = parseRoute(pathname)
  const conversationId = route.view === 'chat' ? route.conversationId : undefined
  const state = useSyncExternalStore(chat.subscribe, chat.getSnapshot)

  useEffect(() => {
    void chat.refreshList()
    void chat.refreshModels()
  }, [chat])

  useEffect(() => {
    if (conversationId === undefined) {
      chat.closeCurrent()
      return
    }
    void chat.open(conversationId)
  }, [chat, conversationId])

  const openConversation = (id: string): void => router.navigate(`/chat/${encodeURIComponent(id)}`)

  const newChat = async (): Promise<void> => {
    const id = await chat.create()
    router.navigate(`/chat/${encodeURIComponent(id)}`)
  }

  const send = async (content: string): Promise<void> => {
    let id = conversationId
    if (id === undefined) {
      const pending = state.pendingModel
      id = await chat.create(pending?.provider, pending?.model)
      router.navigate(`/chat/${encodeURIComponent(id)}`)
      await chat.open(id)
    }
    try {
      await chat.send(id, content)
    } catch {
      // surfaced through the store error banner
    }
  }

  const showHero = state.current === null && conversationId === undefined && !state.running

  const activeModel = state.current
    ? { provider: state.current.provider, model: state.current.model }
    : state.pendingModel ?? state.defaultModel
  const selectModel = (provider: string, model: string): void => {
    const current = state.current
    if (current) void chat.setModel(current.id, provider, model).catch(() => undefined)
    else chat.setPendingModel(provider, model)
  }

  return (
    <div className="dshsc-page">
      <aside className="dshsc-listCol">
        <div className="dshsc-listHeader">
          <span className="dshsc-listTitle">{t('title')}</span>
          <button type="button" className="dshsc-newButton" onClick={() => void newChat()}>
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {t('newChat')}
          </button>
        </div>
        <ChatList t={t} chat={chat} items={state.list} loaded={state.listLoaded} activeId={conversationId} onOpen={openConversation} />
      </aside>
      <section className="dshsc-main">
        <header className="dshsc-mainHeader">
          <span className="dshsc-mainTitle">{state.current?.title || t('untitled')}</span>
          <button
            type="button"
            className="dshsc-iconButton"
            title={t('close')}
            aria-label={t('close')}
            onClick={() => router.navigate('/')}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        {state.error !== null ? (
          <div className="dshsc-error" role="alert">
            <span>
              {t('errorPrefix')}: {state.error}
            </span>
            <button type="button" className="dshsc-iconButton" title={t('dismiss')} aria-label={t('dismiss')} onClick={() => chat.clearError()}>
              <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : null}
        {showHero ? (
          <div className="dshsc-hero">
            <h1 className="dshsc-heroTitle">{t('heroTitle')}</h1>
            <p className="dshsc-heroHint">{t('heroHint')}</p>
          </div>
        ) : (
          <MessageList t={t} current={state.current} draft={state.draft} reasoning={state.reasoning} running={state.running} />
        )}
        <div className="dshsc-composerArea">
          <ModelSelect
            t={t}
            providers={state.models}
            provider={activeModel?.provider}
            model={activeModel?.model}
            onSelect={selectModel}
          />
          <Composer t={t} running={state.running} onSend={(content) => void send(content)} onStop={() => void chat.cancel()} />
        </div>
      </section>
    </div>
  )
}
