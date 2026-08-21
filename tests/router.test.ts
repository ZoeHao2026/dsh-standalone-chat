import { describe, expect, it } from 'vitest'

import { parseRoute } from '../src/client/router.js'

describe('parseRoute', () => {
  it('recognizes the bare /chat page', () => {
    expect(parseRoute('/chat')).toEqual({ view: 'chat', conversationId: undefined })
    expect(parseRoute('/chat/')).toEqual({ view: 'chat', conversationId: undefined })
  })

  it('recognizes /chat/:conversationId', () => {
    expect(parseRoute('/chat/abc-123')).toEqual({ view: 'chat', conversationId: 'abc-123' })
    expect(parseRoute('/chat/abc-123/')).toEqual({ view: 'chat', conversationId: 'abc-123' })
  })

  it('decodes percent-encoded conversation ids', () => {
    expect(parseRoute('/chat/a%20b%2Fc')).toEqual({ view: 'chat', conversationId: 'a b/c' })
  })

  it('treats every other path as other', () => {
    expect(parseRoute('/')).toEqual({ view: 'other' })
    expect(parseRoute('/session/x')).toEqual({ view: 'other' })
    expect(parseRoute('/chatx')).toEqual({ view: 'other' })
  })

  it('rejects nested paths under /chat', () => {
    expect(parseRoute('/chat/a/b')).toEqual({ view: 'other' })
    expect(parseRoute('/chat//')).toEqual({ view: 'other' })
  })
})
