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

  it('disposes the store through the effect chain', () => {
    const { ctx, disposers } = makeCtx()
    apply(ctx as never)
    expect(disposers.length).toBeGreaterThan(0)
    expect(() => disposers.forEach((dispose) => dispose())).not.toThrow()
  })
})
