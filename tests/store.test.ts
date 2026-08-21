import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ChatApi } from '../src/client/api.js'
import { ChatStore } from '../src/client/store.js'

class FakeEventSource {
  static instances: FakeEventSource[] = []
  onmessage: ((event: MessageEvent<string>) => void) | null = null
  close = vi.fn()
  constructor(public readonly url: string) {
    FakeEventSource.instances.push(this)
  }
  emit(method: string, payload: Record<string, unknown>): void {
    this.onmessage?.({ data: JSON.stringify({ type: 'server-request', rpcId: 'r', method, payload }) } as MessageEvent<string>)
  }
}

function makeApi() {
  return {
    list: vi.fn(async () => ({ items: [] })),
    create: vi.fn(async () => ({ conversation: { id: 'c-1', title: '', pinnedTitle: false, createdAt: 1, updatedAt: 1, messages: [] } })),
    get: vi.fn(async () => ({
      conversation: { id: 'c-1', title: 'T', pinnedTitle: false, createdAt: 1, updatedAt: 1, messages: [] },
    })),
    rename: vi.fn(async () => ({ title: 'R' })),
    remove: vi.fn(async () => ({ deleted: true })),
    send: vi.fn(async () => ({
      accepted: true as const,
      message: { id: 'm1', role: 'user' as const, content: [{ type: 'text', text: 'hi' }], createdAt: 2 },
      title: 'T',
    })),
    cancel: vi.fn(async () => ({ accepted: true as const })),
    models: vi.fn(async () => ({
      providers: [{ id: 'p', name: 'P', models: [{ id: 'm', name: 'M' }] }],
      default: { provider: 'p', model: 'm' },
    })),
    setModel: vi.fn(async () => ({
      conversation: { id: 'c-1', title: 'T', pinnedTitle: false, createdAt: 1, updatedAt: 3, messages: [], provider: 'p', model: 'm' },
    })),
  }
}

describe('ChatStore', () => {
  beforeEach(() => {
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('refreshes the list and models exactly once', async () => {
    const api = makeApi()
    const store = new ChatStore(api as unknown as ChatApi)
    await store.refreshList()
    await store.refreshModels()
    await store.refreshModels()
    expect(api.list).toHaveBeenCalledTimes(1)
    expect(api.models).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot().modelsLoaded).toBe(true)
  })

  it('opens a conversation and connects its SSE stream', async () => {
    const api = makeApi()
    const store = new ChatStore(api as unknown as ChatApi)
    await store.open('c-1')
    expect(api.get).toHaveBeenCalledWith('c-1')
    expect(store.getSnapshot().current?.title).toBe('T')
    expect(FakeEventSource.instances).toHaveLength(1)
    expect(FakeEventSource.instances[0]!.url).toContain('/api/chat/events?conversationId=c-1')
  })

  it('folds SSE frames into state', async () => {
    const api = makeApi()
    const store = new ChatStore(api as unknown as ChatApi)
    await store.open('c-1')
    const source = FakeEventSource.instances[0]!

    source.emit('chat/delta', { conversationId: 'c-1', draft: 'hel', reasoning: '' })
    expect(store.getSnapshot().draft).toBe('hel')

    source.emit('chat/message', {
      conversationId: 'c-1',
      message: { id: 'a1', role: 'assistant', content: [{ type: 'text', text: 'hello' }], createdAt: 3 },
      updatedAt: 3,
      title: 'T',
    })
    expect(store.getSnapshot().current?.messages.map((m) => m.id)).toEqual(['a1'])

    source.emit('chat/error', { conversationId: 'c-1', message: 'kaboom' })
    expect(store.getSnapshot().error).toBe('kaboom')
    expect(store.getSnapshot().running).toBe(false)

    source.emit('chat/status', { conversationId: 'c-1', running: true })
    expect(store.getSnapshot().running).toBe(true)
  })

  it('dedupes messages by id', async () => {
    const api = makeApi()
    const store = new ChatStore(api as unknown as ChatApi)
    await store.open('c-1')
    const source = FakeEventSource.instances[0]!
    const message = { id: 'a1', role: 'assistant' as const, content: [{ type: 'text', text: 'x' }], createdAt: 3 }
    source.emit('chat/message', { conversationId: 'c-1', message, updatedAt: 3, title: 'T' })
    source.emit('chat/message', { conversationId: 'c-1', message, updatedAt: 3, title: 'T' })
    expect(store.getSnapshot().current?.messages).toHaveLength(1)
  })

  it('send appends the accepted user message and flips running', async () => {
    const api = makeApi()
    const store = new ChatStore(api as unknown as ChatApi)
    await store.open('c-1')
    const promise = store.send('c-1', 'hi')
    expect(store.getSnapshot().running).toBe(true)
    await promise
    expect(api.send).toHaveBeenCalledWith('c-1', 'hi')
    expect(store.getSnapshot().current?.messages.map((m) => m.id)).toContain('m1')
    expect(store.getSnapshot().running).toBe(true)
  })

  it('rename and remove update the list', async () => {
    const api = makeApi()
    const store = new ChatStore(api as unknown as ChatApi)
    await store.open('c-1')
    await store.rename('c-1', 'R')
    expect(store.getSnapshot().current?.title).toBe('R')
    await store.remove('c-1')
    expect(api.remove).toHaveBeenCalledWith('c-1')
    expect(store.getSnapshot().current).toBeNull()
  })

  it('closeCurrent detaches the stream', async () => {
    const api = makeApi()
    const store = new ChatStore(api as unknown as ChatApi)
    await store.open('c-1')
    const source = FakeEventSource.instances[0]!
    store.closeCurrent()
    expect(source.close).toHaveBeenCalled()
    expect(FakeEventSource.instances).toHaveLength(1)
  })

  it('exposes a stable directory store for the chat model seat', async () => {
    const api = makeApi()
    const store = new ChatStore(api as unknown as ChatApi)
    await store.refreshModels()
    await store.open('c-1')
    const first = store.getDirectoryStore()
    const second = store.getDirectoryStore()
    expect(first).toBe(second)
    const snapshot = first.getSnapshot()
    expect(snapshot.groups).toHaveLength(1)
    expect(snapshot.groups[0]!.id).toBe('p')
    expect(snapshot.available).toBe(true)
    expect(snapshot.locked).toBe(false)
    // The store mirrors chat state changes (subscribe fires on updates).
    const listener = vi.fn()
    const unsubscribe = first.subscribe(listener)
    store.closeCurrent()
    expect(listener).toHaveBeenCalled()
    unsubscribe()
  })

  it('selectModel persists on the open conversation and stages otherwise', async () => {
    const api = makeApi()
    const store = new ChatStore(api as unknown as ChatApi)
    expect(await store.selectModel({ provider: 'p', model: 'm' })).toBe(true)
    expect(store.getSnapshot().pendingModel).toEqual({ provider: 'p', model: 'm' })
    await store.open('c-1')
    expect(await store.selectModel({ provider: 'p', model: 'm2' })).toBe(true)
    expect(api.setModel).toHaveBeenCalledWith('c-1', 'p', 'm2', undefined)
    expect(await store.selectModel({ provider: '', model: '' })).toBe(false)
  })
})
