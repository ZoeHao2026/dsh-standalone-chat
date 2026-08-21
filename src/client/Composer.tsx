import { useRef, useState } from 'react'

import type { ChatT } from './locales.js'

export interface ComposerProps {
  t: ChatT
  running: boolean
  onSend: (content: string) => void
  onStop: () => void
}

/** Bottom composer: Enter sends, Shift+Enter inserts a newline. */
export function Composer({ t, running, onSend, onStop }: ComposerProps) {
  const [value, setValue] = useState('')
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const submit = (): void => {
    const content = value.trim()
    if (!content || running) return
    setValue('')
    const area = areaRef.current
    if (area) area.style.height = 'auto'
    onSend(content)
  }

  const autogrow = (): void => {
    const area = areaRef.current
    if (!area) return
    area.style.height = 'auto'
    area.style.height = `${Math.min(area.scrollHeight, 200)}px`
  }

  return (
    <div className="dshsc-composerBox">
      <textarea
        ref={areaRef}
        className="dshsc-input"
        rows={1}
        value={value}
        placeholder={t('inputPlaceholder')}
        onChange={(event) => {
          setValue(event.target.value)
          autogrow()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            submit()
          }
        }}
      />
      {running ? (
        <button type="button" className="dshsc-stopButton" title={t('stop')} aria-label={t('stop')} onClick={onStop}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <rect x="3.5" y="3.5" width="9" height="9" rx="1.5" fill="currentColor" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          className="dshsc-sendButton"
          title={t('send')}
          aria-label={t('send')}
          disabled={!value.trim()}
          onClick={submit}
        >
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
              d="M8 12.5v-9M4.5 6.5 8 3l3.5 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
