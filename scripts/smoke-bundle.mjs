import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import vm from 'node:vm'

import { JSDOM } from 'jsdom'
import React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'

const packageName = '@local/dsh-standalone-chat'
const root = path.resolve(import.meta.dirname, '..')
const clientPath = path.join(root, 'lib', 'client.js')
const mapPath = `${clientPath}.map`
const client = await readFile(clientPath, 'utf8')
const sourceMap = JSON.parse(await readFile(mapPath, 'utf8'))

assert.equal(sourceMap.version, 3)
assert.ok(client.includes('//# sourceMappingURL=client.js.map'))
assert.ok(Array.isArray(sourceMap.sources) && sourceMap.sources.length > 0)
assert.ok(Array.isArray(sourceMap.sourcesContent) && sourceMap.sourcesContent.length > 0)

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://127.0.0.1:3080/' })
const handoffs = []
dom.window.__ModuleLoader__ = {
  load(handoff) {
    handoffs.push(handoff)
  },
}

const context = vm.createContext({
  window: dom.window,
  document: dom.window.document,
  Node: dom.window.Node,
  Element: dom.window.Element,
  HTMLElement: dom.window.HTMLElement,
  location: dom.window.location,
  history: dom.window.history,
  queueMicrotask,
  setTimeout,
  clearTimeout,
})

vm.runInContext(client, context, { filename: clientPath })
assert.equal(handoffs.length, 1)
assert.equal(handoffs[0].id, packageName)
assert.equal(dom.window.document.querySelectorAll('style[data-plugin]').length, 0)

const required = []
const primitives = {
  MarkdownText: () => null,
}
const modules = {
  react: React,
  'react/jsx-runtime': jsxRuntime,
  '@deepseek-ai/dsh-client-ui-primitives': primitives,
}
const exports = handoffs[0].factory((specifier) => {
  required.push(specifier)
  assert.ok(specifier in modules, `unexpected runtime require: ${specifier}`)
  return modules[specifier]
})

assert.equal(typeof exports.apply, 'function')
assert.deepEqual(Array.from(exports.inject), ['slots', 'locale', 'connection'])
assert.equal(dom.window.document.querySelectorAll('style[data-plugin]').length, 1)
const pluginStyle = dom.window.document.querySelector('style[data-plugin]')
const pluginCss = pluginStyle?.textContent ?? ''
for (const fragment of ['.dshsc-overlay', '.dshsc-navAction', '.dshsc-modelSelect', '.dshsc-composerBox']) {
  assert.ok(pluginCss.includes(fragment), `plugin css missing ${fragment}`)
}
assert.deepEqual([...new Set(required)].sort(), Object.keys(modules).sort())

const registrations = []
const registeredLocales = []
const effectDisposers = []
const localeDictionaries = new Map()
const register = (options, component) => {
  registrations.push({ options, component })
  return () => undefined
}
const injectSlot = (_name, mount) => mount()
const ctx = {
  connection: { rpc: {} },
  locale: {
    register(namespace, dicts) {
      registeredLocales.push(namespace)
      localeDictionaries.set(namespace, dicts)
      return () => localeDictionaries.delete(namespace)
    },
    bind(namespace) {
      return (key) => localeDictionaries.get(namespace)?.en?.[key] ?? key
    },
  },
  slots: { inject: injectSlot, register },
  effect(mount) {
    const disposer = mount()
    if (typeof disposer === 'function') effectDisposers.push(disposer)
  },
}

exports.apply(ctx)
assert.deepEqual(registeredLocales, ['standaloneChat'])
assert.deepEqual(
  registrations.map((entry) => entry.options.name),
  ['sidebar.footer.action', 'shell.overlay'],
)
const [nav, page] = registrations
assert.equal(nav.options.id, 'standalone-chat')
assert.equal(nav.options.order, 10)
assert.equal(nav.options.label(), 'Chat')
assert.equal(typeof nav.component, 'function')
assert.equal(page.options.id, 'standalone-chat-page')
assert.equal(page.options.order, 40)
assert.equal(typeof page.component, 'function')
effectDisposers.reverse().forEach((dispose) => dispose())
assert.equal(localeDictionaries.size, 0)

const host = await import(`${pathToFileURL(path.join(root, 'lib', 'index.js')).href}?smoke=1`)
assert.equal(typeof host.apply, 'function')
assert.deepEqual(Array.from(host.inject), ['storageDomain', 'llm', 'agentDefaultModel', 'webServer', 'connection'])

console.log('bundle smoke passed')
