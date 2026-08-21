import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Composer } from '../src/client/Composer.js'

const t = (key: string): string => key

describe('Composer', () => {
  it('sends on Enter', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<Composer t={t} running={false} onSend={onSend} onStop={vi.fn()} />)
    await user.type(screen.getByPlaceholderText('inputPlaceholder'), 'hello{Enter}')
    expect(onSend).toHaveBeenCalledWith('hello')
  })

  it('does not send empty text', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<Composer t={t} running={false} onSend={onSend} onStop={vi.fn()} />)
    await user.keyboard('{Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })

  it('inserts a newline on Shift+Enter instead of sending', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<Composer t={t} running={false} onSend={onSend} onStop={vi.fn()} />)
    await user.type(screen.getByPlaceholderText('inputPlaceholder'), 'a{Shift>}{Enter}{/Shift}b')
    expect(onSend).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('inputPlaceholder')).toHaveValue('a\nb')
  })

  it('shows the stop button while running and calls onStop', async () => {
    const onStop = vi.fn()
    const user = userEvent.setup()
    render(<Composer t={t} running={true} onSend={vi.fn()} onStop={onStop} />)
    await user.click(screen.getByLabelText('stop'))
    expect(onStop).toHaveBeenCalled()
  })
})
