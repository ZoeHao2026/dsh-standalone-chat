import { useEffect, useRef } from 'react'
import { MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'

import type { ChatConversation, ChatMessage } from './api.js'
import type { ChatT } from './locales.js'

function visibleText(message: ChatMessage): string {
  return message.content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text as string)
    .join('')
}

function reasoningText(message: ChatMessage): string {
  return message.content
    .filter((block) => block.type === 'reasoning' && typeof block.text === 'string')
    .map((block) => block.text as string)
    .join('')
}

function UserRow({ message }: { message: ChatMessage }) {
  return (
    <div className="dshsc-row dshsc-rowUser">
      <div className="dshsc-userBubble">{visibleText(message)}</div>
    </div>
  )
}

function AssistantRow({ text, reasoning, streaming, t }: { text: string; reasoning?: string; streaming?: boolean; t: ChatT }) {
  return (
    <div className="dshsc-row dshsc-rowAssistant">
      {reasoning ? (
        <details className="dshsc-reasoning">
          <summary>{t('reasoning')}</summary>
          <div className="dshsc-reasoningBody">{reasoning}</div>
        </details>
      ) : null}
      <div className="dshsc-assistantBody">
        {text ? <MarkdownText text={text} streaming={streaming === true} /> : null}
        {streaming === true && !text ? <span className="dshsc-caret">▍</span> : null}
      </div>
    </div>
  )
}

export interface MessageListProps {
  t: ChatT
  current: ChatConversation | null
  draft: string
  reasoning: string
  running: boolean
}

/** The transcript: stored messages plus the in-flight streaming draft. */
export function MessageList({ t, current, draft, reasoning, running }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageCount = current?.messages.length ?? 0

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    // Stick to the bottom while the user is already near it.
    if (node.scrollHeight - node.scrollTop - node.clientHeight < 240) {
      node.scrollTop = node.scrollHeight
    }
  }, [messageCount, draft])

  const showDraft = running || draft.length > 0

  return (
    <div className="dshsc-scroll" ref={scrollRef}>
      <div className="dshsc-thread">
        {current?.messages.map((message) =>
          message.role === 'user' ? (
            <UserRow key={message.id} message={message} />
          ) : (
            <AssistantRow
              key={message.id}
              text={visibleText(message)}
              reasoning={reasoningText(message)}
              t={t}
            />
          ),
        )}
        {showDraft ? <AssistantRow text={draft} reasoning={reasoning} streaming t={t} /> : null}
      </div>
    </div>
  )
}
