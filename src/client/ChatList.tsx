import { useState } from 'react'

import type { ChatListItem } from './api.js'
import type { ChatT } from './locales.js'
import type { ChatStore } from './store.js'

export interface ChatListProps {
  t: ChatT
  chat: ChatStore
  items: readonly ChatListItem[]
  loaded: boolean
  activeId: string | undefined
  onOpen: (conversationId: string) => void
}

/** Left column: New Chat plus the history list with inline rename and delete. */
export function ChatList({ t, chat, items, loaded, activeId, onOpen }: ChatListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const commitRename = async (conversationId: string): Promise<void> => {
    const title = draft.trim()
    setEditingId(null)
    if (title) await chat.rename(conversationId, title)
  }

  return (
    <div className="dshsc-listBody" role="list" aria-label={t('title')}>
      {loaded && items.length === 0 ? <div className="dshsc-listEmpty">{t('empty')}</div> : null}
      {items.map((item) => {
        const active = item.id === activeId
        const editing = editingId === item.id
        return (
          <div
            key={item.id}
            role="listitem"
            className={`dshsc-listItem${active ? ' dshsc-listItemActive' : ''}`}
          >
            {editing ? (
              <input
                className="dshsc-renameInput"
                value={draft}
                placeholder={t('renamePlaceholder')}
                autoFocus
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void commitRename(item.id)
                  if (event.key === 'Escape') setEditingId(null)
                }}
                onBlur={() => void commitRename(item.id)}
              />
            ) : (
              <>
                <button type="button" className="dshsc-listItemMain" onClick={() => onOpen(item.id)}>
                  <span className="dshsc-listItemTitle">{item.title || t('untitled')}</span>
                  {item.preview ? <span className="dshsc-listItemPreview">{item.preview}</span> : null}
                </button>
                <span className="dshsc-listItemActions">
                  <button
                    type="button"
                    className="dshsc-iconButton"
                    title={t('rename')}
                    aria-label={t('rename')}
                    onClick={() => {
                      setEditingId(item.id)
                      setDraft(item.title)
                    }}
                  >
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                      <path
                        d="M9.7 3.3l3 3L5.8 13.2l-3.4.4.4-3.4 6.9-6.9Zm1.4-1.4l1.6-1.6c.3-.3.8-.3 1.1 0l1.9 1.9c.3.3.3.8 0 1.1l-1.6 1.6-3-3Z"
                        fill="currentColor"
                        transform="scale(0.9) translate(0.8 0.8)"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="dshsc-iconButton"
                    title={t('delete')}
                    aria-label={t('delete')}
                    onClick={() => {
                      if (window.confirm(t('deleteConfirm'))) void chat.remove(item.id)
                    }}
                  >
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                      <path
                        d="M4 4l8 8M12 4l-8 8"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
