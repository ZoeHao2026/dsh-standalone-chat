import { useMemo, useState } from 'react'

import type { ChatProviderGroup } from './api.js'
import type { ChatT } from './locales.js'

export interface ModelSelectProps {
  t: ChatT
  providers: readonly ChatProviderGroup[]
  provider: string | undefined
  model: string | undefined
  disabled?: boolean
  onSelect: (provider: string, model: string) => void
}

/** Compact provider/model picker styled like the DSH composer controls. */
export function ModelSelect({ t, providers, provider, model, disabled, onSelect }: ModelSelectProps) {
  const [open, setOpen] = useState(false)
  const currentLabel = useMemo(() => {
    const group = providers.find((entry) => entry.id === provider)
    const found = group?.models.find((entry) => entry.id === model)
    return found ? found.name : model ? `${provider}/${model}` : t('defaultModel')
  }, [providers, provider, model, t])

  return (
    <div className={`dshsc-modelSelect${open ? ' dshsc-modelSelectOpen' : ''}`}>
      <button
        type="button"
        className="dshsc-modelSelectTrigger"
        title={currentLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled === true || providers.length === 0}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="dshsc-modelSelectLabel">{currentLabel}</span>
        <svg className="dshsc-modelSelectChevron" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div className="dshsc-modelSelectMenu" role="listbox">
          {providers.map((group) => (
            <div key={group.id} className="dshsc-modelSelectGroup">
              <div className="dshsc-modelSelectGroupName">{group.name}</div>
              {group.models.map((entry) => {
                const selected = entry.id === model && group.id === provider
                return (
                  <button
                    key={`${group.id}/${entry.id}`}
                    type="button"
                    className={`dshsc-modelSelectItem${selected ? ' dshsc-modelSelectItemSelected' : ''}`}
                    role="option"
                    aria-selected={selected === true}
                    onClick={() => {
                      onSelect(group.id, entry.id)
                      setOpen(false)
                    }}
                  >
                    {entry.name}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
