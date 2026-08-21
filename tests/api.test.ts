import { describe, expect, it, vi } from 'vitest'
import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'

import { ChatApi } from '../src/client/api.js'

function makeApi(overrides?: Partial<Record<string, unknown>>) {
  const call = vi.fn(async (_channel: string, endpoint: string) => {
    const results: Record<string, unknown> = {
      'chat/list': { items: [] },
      'chat/create': { conversation: { id: 'c-1' } },
      'chat/get': { conversation: { id: 'c-1' } },
      'chat/rename': { title: 't' },
      'chat/delete': { deleted: true },
      'chat/send': { accepted: true },
      'chat/cancel': { accepted: true },
      'chat/models': { providers: [], default: { provider: 'p', model: 'm' } },
      'chat/setModel': { conversation: { id: 'c-1' } },
      ...overrides,
    }
    return { ok: true as const, value: results[endpoint] }
  })
  const rpc = { call } as unknown as ClientConnectionRpc
  return { api: new ChatApi(rpc), call }
}

describe('ChatApi', () => {
  it('calls the /chatrpc channel with namespaced endpoints', async () => {
    const { api, call } = makeApi()
    await api.list()
    await api.create()
    await api.get('c-1')
    await api.rename('c-1', 't')
    await api.remove('c-1')
    await api.send('c-1', 'hello')
    await api.cancel('c-1')
    await api.models()
    await api.setModel('c-1', 'p', 'm')
    const endpoints = call.mock.calls.map(([, endpoint]) => endpoint)
    expect(new Set(call.mock.calls.map(([channel]) => channel))).toEqual(new Set(['/chatrpc']))
    expect(endpoints).toEqual([
      'chat/list',
      'chat/create',
      'chat/get',
      'chat/rename',
      'chat/delete',
      'chat/send',
      'chat/cancel',
      'chat/models',
      'chat/setModel',
    ])
  })

  it('propagates payloads', async () => {
    const { api, call } = makeApi()
    await api.send('c-9', 'hi there')
    expect(call).toHaveBeenCalledWith('/chatrpc', 'chat/send', {
      conversationId: 'c-9',
      content: 'hi there',
    })
  })

  it('throws on error results', async () => {
    const call = vi.fn(async () => ({ ok: false as const, error: { code: 'internal', message: 'boom', details: {} } }))
    const api = new ChatApi({ call } as unknown as ClientConnectionRpc)
    await expect(api.list()).rejects.toThrow('boom')
  })
})
