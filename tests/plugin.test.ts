import { describe, expect, it, vi } from 'vitest'

import { apply } from '../src/client/index.js'

type SlotOptions = Record<string, unknown>
type AnyFn = (...args: never[]) => unknown

function makeCtx() {
  const registrations: { options: SlotOptions; component: AnyFn }[] = []
  const localeNamespaces: string[] = []
  const disposers: Array<() => unknown> = []
  const dictionaries = new Map<string, Record<string, Record<string, string>>>()
  const ctx = {
    connection: { rpc: {} },
    locale: {
      register: (namespace: string, dicts: Record<string, Record<string, string>>) => {
        localeNamespaces.push(namespace)
        dictionaries.set(namespace, dicts)
        return () => dictionaries.delete(namespace)
      },
      bind: (namespace: string) => {
        return (key: string) => dictionaries.get(namespace)?.['en']?.[key] ?? key
      },
    },
    slots: {
      inject: (_name: string, mount: () => unknown) => {
        const result = mount()
        if (typeof result === 'function') disposers.push(result as () => unknown)
      },
      register: (options: SlotOptions, component: AnyFn) => {
        registrations.push({ options, component })
        return () => undefined
      },
    },
    effect: (mount: () => unknown) => {
      const result = mount()
      if (typeof result === 'function') disposers.push(result as () => unknown)
    },
  }
  return { ctx, registrations, localeNamespaces, disposers }
}

describe('client plugin apply', () => {
  it('registers the locale namespace', () => {
    const { ctx, localeNamespaces } = makeCtx()
    apply(ctx as never)
    expect(localeNamespaces).toEqual(['standaloneChat'])
  })

  it('registers the sidebar footer action', () => {
    const { ctx, registrations } = makeCtx()
    apply(ctx as never)
    const nav = registrations.find((entry) => entry.options.name === 'sidebar.footer.action')
    expect(nav).toBeDefined()
    expect(nav!.options.id).toBe('standalone-chat')
    expect(nav!.options.order).toBe(10)
    expect(typeof nav!.options.label).toBe('function')
    expect(typeof nav!.component).toBe('function')
    expect((nav!.options.label as () => string)()).toBe('Chat')
  })

  it('registers the shell overlay page', () => {
    const { ctx, registrations } = makeCtx()
    apply(ctx as never)
    const page = registrations.find((entry) => entry.options.name === 'shell.overlay')
    expect(page).toBeDefined()
    expect(page!.options.id).toBe('standalone-chat-page')
    expect(page!.options.order).toBe(40)
    expect(typeof page!.component).toBe('function')
  })

  it('declares the chat model seat with a working inject face', () => {
    const { ctx, registrations } = makeCtx()
    apply(ctx as never)
    const page = registrations.find((entry) => entry.options.name === 'shell.overlay')!
    const children = page.options.children as Record<string, { kind?: string; scope?: string; inject?: unknown }>
    expect(Object.keys(children)).toEqual(['chat.input.model'])
    expect(children['chat.input.model']!.kind).toBe('single')
    expect(children['chat.input.model']!.scope).toBe('root')
    const face = children['chat.input.model']!.inject as {
      getDirectory: () => unknown
      load: () => void
      select: () => Promise<boolean>
    }
    expect(typeof face.getDirectory).toBe('function')
    expect(typeof face.load).toBe('function')
    expect(typeof face.select).toBe('function')
    const directory = face.getDirectory() as { subscribe: () => () => void; getSnapshot: () => unknown }
    expect(typeof directory.subscribe).toBe('function')
    expect(typeof directory.getSnapshot).toBe('function')
    const snapshot = directory.getSnapshot() as { groups: unknown[]; current: unknown; available: boolean; locked: boolean }
    expect(Array.isArray(snapshot.groups)).toBe(true)
    expect(typeof snapshot.available).toBe('boolean')
    expect(typeof snapshot.locked).toBe('boolean')
  })

  it('disposes the store through the effect chain', () => {
    const { ctx, disposers } = makeCtx()
    apply(ctx as never)
    expect(disposers.length).toBeGreaterThan(0)
    expect(() => disposers.forEach((dispose) => dispose())).not.toThrow()
  })
})
