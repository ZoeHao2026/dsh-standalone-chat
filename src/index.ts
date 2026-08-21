/**
 * @local/dsh-standalone-chat — host half.
 *
 * Standalone lightweight chat: a conversation KV store, unary RPC endpoints on
 * the shared `/api` channel, and an SSE streaming route. Generation calls
 * `ctx.llm.stream()` directly with hand-built messages — no system prompt, no
 * tools, no DSH Session/Agent/Workspace involvement of any kind, so chats are
 * provably free of project/agent context.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent-default-model'
import type {} from '@deepseek-ai/dsh-client-connection'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import { BlockAssembler, createAssistantMessage, createUserMessage } from '@deepseek-ai/dsh-llm'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import { fallbackSessionTitle, normalizeSessionTitle } from '@deepseek-ai/dsh-session-title'
import type { DomainSpec, KvTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'

export const name = 'standalone-chat'
export const inject = ['storageDomain', 'llm', 'agentDefaultModel', 'webServer', 'connection']

/* ------------------------------------------------------------------------- */
/* Wire vocabulary                                                            */
/* ------------------------------------------------------------------------- */

/** Wire-compatible subset of the api-proxy RpcResult shape (structurally identical). */
type RpcError = { code: 'internal'; message: string; details: Record<string, never> }
type RpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: RpcError }

function ok<T>(value: T): RpcResult<T> {
  return { ok: true, value }
}

function failure(message: string): RpcResult<never> {
  return { ok: false, error: { code: 'internal', message, details: {} } }
}

/* ------------------------------------------------------------------------- */
/* Stored record schemas (zod; validated at the durable boundary)             */
/* ------------------------------------------------------------------------- */

const contentBlockSchema = z.object({ type: z.string() }).catchall(z.unknown())

const storedMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.array(contentBlockSchema),
  createdAt: z.number(),
  provider: z.string().optional(),
  model: z.string().optional(),
})

const conversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  pinnedTitle: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
  messages: z.array(storedMessageSchema),
  provider: z.string().optional(),
  model: z.string().optional(),
  reasoningEffort: z.string().optional(),
})

type StoredMessage = z.infer<typeof storedMessageSchema>
type StoredConversation = z.infer<typeof conversationSchema>

const chatDomainSpec: DomainSpec = {
  name: 'chat',
  version: 0,
  tables: { conversations: { valueSchema: conversationSchema } },
}

/** Structural subset of node:http request used by the SSE handler. */
interface HttpRequest {
  headers: Record<string, string | string[] | undefined>
  url?: string
  on(event: 'close', listener: () => void): unknown
}

/** Structural subset of node:http response used by the SSE handler. */
interface HttpResponse {
  writeHead(status: number, headers?: Record<string, string | number | string[]>): unknown
  write(chunk: string): unknown
  end(chunk?: string): unknown
}

function newId(): string {
  return crypto.randomUUID()
}

/* ------------------------------------------------------------------------- */
/* SSE frame vocabulary (server-request envelopes, same as the api mux)       */
/* ------------------------------------------------------------------------- */

interface StreamFrame {
  method: string
  payload: Record<string, unknown>
}

interface Generation {
  readonly abort: AbortController
  draft: string
  reasoning: string
  running: boolean
}

const TITLE_MAX_WORDS = 8
const TITLE_MAX_BYTES = 96

function textOf(blocks: readonly { type: string }[]): string {
  return blocks
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text' && typeof (block as { text?: unknown }).text === 'string')
    .map((block) => block.text)
    .join('')
}

function listItem(conv: StoredConversation): Record<string, unknown> {
  const last = conv.messages[conv.messages.length - 1]
  return {
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    messageCount: conv.messages.length,
    preview: last ? textOf(last.content).slice(0, 120) : '',
  }
}

export async function apply(ctx: Context): Promise<void> {
  const domain = await ctx.storageDomain.open(chatDomainSpec)
  const conversations = domain.table('conversations') as unknown as KvTable<string, StoredConversation>
  ctx.effect(
    () => async () => {
      await domain.close()
    },
    'standalone-chat: chat domain',
  )

  const generations = new Map<string, Generation>()
  const subscribers = new Map<string, Set<(frame: StreamFrame) => void>>()

  function publish(conversationId: string, frame: StreamFrame): void {
    const set = subscribers.get(conversationId)
    if (!set) return
    for (const send of set) {
      try {
        send(frame)
      } catch {
        // a broken subscriber is dropped by its own close handler
      }
    }
  }

  function abortGeneration(conversationId: string): void {
    const generation = generations.get(conversationId)
    if (generation?.running) generation.abort.abort()
  }

  /* ------------------------------------------------- generation ---------- */

  async function runGeneration(conversationId: string): Promise<void> {
    const generation: Generation = { abort: new AbortController(), draft: '', reasoning: '', running: true }
    generations.set(conversationId, generation)
    publish(conversationId, { method: 'chat/status', payload: { conversationId, running: true } })
    try {
      const defaultSelection = ctx.agentDefaultModel.currentSelection()
      const record = conversations.get(conversationId)
      if (!record) return
      // A conversation may pin a model; otherwise fall back to the agent default.
      const selection = {
        provider: record.provider ?? defaultSelection.provider,
        model: record.model ?? defaultSelection.model,
        ...(record.reasoningEffort !== undefined
          ? { reasoningEffort: record.reasoningEffort }
          : defaultSelection.reasoningEffort !== undefined
            ? { reasoningEffort: defaultSelection.reasoningEffort }
            : {}),
      }
      // Hand-built history: messages only. No system prompt, no tools, no
      // session id — the request carries zero agent/workspace context.
      const messages = record.messages.map((message) =>
        message.role === 'user'
          ? createUserMessage({ content: message.content as unknown as ContentBlock[], source: { kind: 'user' } })
          : createAssistantMessage({
              content: message.content as unknown as ContentBlock[],
              source: { provider: message.provider ?? selection.provider, model: message.model ?? selection.model },
            }),
      )
      const assembler = new BlockAssembler()
      const stream = ctx.llm.stream({
        provider: selection.provider,
        model: selection.model,
        ...(selection.reasoningEffort !== undefined
          ? { reasoningEffort: selection.reasoningEffort as never }
          : {}),
        messages,
        signal: generation.abort.signal,
      })
      for await (const chunk of stream) {
        assembler.push(chunk)
        if (chunk.type === 'text-delta') {
          generation.draft += chunk.text
        } else if (chunk.type === 'reasoning-delta') {
          generation.reasoning += chunk.text
        }
        if (chunk.type === 'text-delta' || chunk.type === 'reasoning-delta') {
          publish(conversationId, {
            method: 'chat/delta',
            payload: { conversationId, draft: generation.draft, reasoning: generation.reasoning },
          })
        }
      }
      const finish = assembler.finish
      if (finish.kind === 'aborted') return
      if (finish.kind === 'error') {
        publish(conversationId, {
          method: 'chat/error',
          payload: { conversationId, message: finish.failure.message },
        })
        return
      }
      const blocks = assembler.blocks()
      if (blocks.length === 0) return
      const assistant = createAssistantMessage({
        content: blocks,
        source: { provider: selection.provider, model: selection.model },
      })
      const stored: StoredMessage = {
        id: assistant.id,
        role: 'assistant',
        content: blocks as unknown as StoredMessage['content'],
        createdAt: Date.now(),
        provider: selection.provider,
        model: selection.model,
      }
      const next = await conversations.update(conversationId, (current) => ({
        ...current,
        messages: [...current.messages, stored],
        updatedAt: stored.createdAt,
      }))
      publish(conversationId, {
        method: 'chat/message',
        payload: { conversationId, message: stored, updatedAt: next.updatedAt, title: next.title },
      })
    } catch (error) {
      if (!generation.abort.signal.aborted) {
        publish(conversationId, {
          method: 'chat/error',
          payload: { conversationId, message: error instanceof Error ? error.message : String(error) },
        })
      }
    } finally {
      generation.running = false
      generations.delete(conversationId)
      publish(conversationId, { method: 'chat/status', payload: { conversationId, running: false } })
    }
  }

  /* ----------------------------------------------------- RPC ------------- */

  async function handle(endpoint: string, payload: unknown): Promise<RpcResult<unknown>> {
    const args = (payload ?? {}) as Record<string, unknown>
    try {
      switch (endpoint) {
        case 'chat/list': {
          const items = [...conversations.entries()]
            .map(([, conv]) => listItem(conv))
            .sort((a, b) => (b.updatedAt as number) - (a.updatedAt as number))
          return ok({ items })
        }
        case 'chat/create': {
          const now = Date.now()
          const provider = typeof args.provider === 'string' && args.provider ? args.provider : undefined
          const model = typeof args.model === 'string' && args.model ? args.model : undefined
          const reasoningEffort =
            typeof args.reasoningEffort === 'string' && args.reasoningEffort ? args.reasoningEffort : undefined
          const conversation: StoredConversation = {
            id: newId(),
            title: '',
            pinnedTitle: false,
            createdAt: now,
            updatedAt: now,
            messages: [],
            ...(provider !== undefined && model !== undefined
              ? { provider, model, ...(reasoningEffort !== undefined ? { reasoningEffort } : {}) }
              : {}),
          }
          await conversations.put(conversation.id, conversation)
          return ok({ conversation })
        }
        case 'chat/get': {
          const conversation = conversations.get(String(args.conversationId ?? ''))
          if (!conversation) return failure('conversation not found')
          return ok({ conversation })
        }
        case 'chat/rename': {
          const conversationId = String(args.conversationId ?? '')
          const title = normalizeSessionTitle(String(args.title ?? ''), TITLE_MAX_BYTES)
          if (!title) return failure('title must not be empty')
          if (!conversations.get(conversationId)) return failure('conversation not found')
          const next = await conversations.update(conversationId, (current) => ({
            ...current,
            title,
            pinnedTitle: true,
            updatedAt: Date.now(),
          }))
          return ok({ title: next.title })
        }
        case 'chat/delete': {
          const conversationId = String(args.conversationId ?? '')
          abortGeneration(conversationId)
          const deleted = await conversations.delete(conversationId)
          publish(conversationId, { method: 'chat/deleted', payload: { conversationId } })
          return ok({ deleted })
        }
        case 'chat/send': {
          const conversationId = String(args.conversationId ?? '')
          const record = conversations.get(conversationId)
          if (!record) return failure('conversation not found')
          if (generations.get(conversationId)?.running) return failure('generation already running')
          const text = String(args.content ?? '').trim()
          if (!text) return failure('message must not be empty')
          const user = createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } })
          const stored: StoredMessage = {
            id: user.id,
            role: 'user',
            content: [{ type: 'text', text }],
            createdAt: Date.now(),
          }
          let next = await conversations.update(conversationId, (current) => ({
            ...current,
            messages: [...current.messages, stored],
            updatedAt: stored.createdAt,
          }))
          // Automatic title from the first human prompt (deterministic
          // fallback helper); an explicit rename pins the title and wins.
          if (!next.pinnedTitle && next.messages.filter((message) => message.role === 'user').length === 1) {
            const title = fallbackSessionTitle(text, TITLE_MAX_WORDS, TITLE_MAX_BYTES)
            if (title) {
              next = await conversations.update(conversationId, (current) =>
                current.pinnedTitle ? current : { ...current, title },
              )
            }
          }
          publish(conversationId, {
            method: 'chat/message',
            payload: { conversationId, message: stored, updatedAt: next.updatedAt, title: next.title },
          })
          void runGeneration(conversationId)
          return ok({ accepted: true, message: stored, title: next.title })
        }
        case 'chat/cancel': {
          const conversationId = String(args.conversationId ?? '')
          abortGeneration(conversationId)
          return ok({ accepted: true })
        }
        case 'chat/models': {
          const providers = ctx.llm.listProviders().map((info) => ({ id: info.id, name: info.name }))
          const groups: { id: string; name: string; models: { id: string; name: string }[] }[] = []
          for (const info of providers) {
            try {
              const models = (await ctx.llm.listModels(info.id)).map((model) => ({
                id: model.id,
                name: model.name || model.id,
              }))
              groups.push({ id: info.id, name: info.name, models })
            } catch {
              groups.push({ id: info.id, name: info.name, models: [] })
            }
          }
          const fallback = ctx.agentDefaultModel.currentSelection()
          return ok({ providers: groups, default: fallback })
        }
        case 'chat/setModel': {
          const conversationId = String(args.conversationId ?? '')
          if (!conversations.get(conversationId)) return failure('conversation not found')
          const provider = String(args.provider ?? '')
          const model = String(args.model ?? '')
          if (!provider || !model) return failure('provider and model are required')
          const reasoningEffort =
            typeof args.reasoningEffort === 'string' && args.reasoningEffort ? args.reasoningEffort : undefined
          const next = await conversations.update(conversationId, (current) => ({
            ...current,
            provider,
            model,
            ...(reasoningEffort !== undefined ? { reasoningEffort } : {}),
            updatedAt: Date.now(),
          }))
          publish(conversationId, { method: 'chat/model', payload: { conversationId, provider, model, reasoningEffort } })
          return ok({ conversation: next })
        }
        default:
          return failure(`unknown chat endpoint: ${endpoint}`)
      }
    } catch (error) {
      return failure(error instanceof Error ? error.message : String(error))
    }
  }

  // The shared `/api` channel's interceptor slot is owned by the official
  // typert gateway (single-slot design), so this plugin claims its own
  // channel `/chatrpc` via the documented `rpc.handle` extension point. The
  // route's trust fence (loopback) is applied by the connection plugin itself.
  const disposeRpc = ctx.connection.rpc.handle(
    '/chatrpc',
    (endpoint, payload) => handle(endpoint, payload),
    { authority: 'loopback' },
  )
  ctx.effect(
    () => async () => {
      await disposeRpc()
    },
    'standalone-chat: chat rpc',
  )

  /* ----------------------------------------------------- SSE ------------- */

  function events(req: HttpRequest, res: HttpResponse): void {
    // Minimal cross-site defense for this fence-free route: browsers never
    // send Origin on same-origin GETs, so a present but foreign Origin fails.
    const origin = req.headers.origin
    if (origin !== undefined) {
      let originHost: string | undefined
      if (typeof origin !== 'string') {
        originHost = undefined
      } else {
        try {
          originHost = new URL(origin).host
        } catch {
          originHost = undefined
        }
      }
      if (originHost !== req.headers.host) {
        res.writeHead(403)
        res.end('forbidden')
        return
      }
    }
    const url = new URL(req.url ?? '/', 'http://standalone-chat.local')
    const conversationId = url.searchParams.get('conversationId') ?? ''
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    })
    const send = (frame: StreamFrame): void => {
      res.write(
        `data: ${JSON.stringify({ type: 'server-request', rpcId: newId(), method: frame.method, payload: frame.payload })}\n\n`,
      )
    }
    // Sync frame: full record plus any in-flight draft, so late-joining and
    // reconnecting (EventSource auto-retry) clients converge immediately.
    const generation = generations.get(conversationId)
    send({
      method: 'chat/sync',
      payload: {
        conversationId,
        conversation: conversations.get(conversationId) ?? null,
        running: generation?.running ?? false,
        draft: generation?.draft ?? '',
        reasoning: generation?.reasoning ?? '',
      },
    })
    let set = subscribers.get(conversationId)
    if (!set) {
      set = new Set()
      subscribers.set(conversationId, set)
    }
    set.add(send)
    const heartbeat = setInterval(() => {
      res.write(': ping\n\n')
    }, 15000)
    req.on('close', () => {
      clearInterval(heartbeat)
      set.delete(send)
      if (set.size === 0) subscribers.delete(conversationId)
      res.end()
    })
  }

  const disposeRoute = ctx.webServer.register({
    kind: 'exact',
    path: '/api/chat/events',
    handler: events as unknown as WebRoute['handler'],
  })
  ctx.effect(
    () => () => {
      disposeRoute()
      for (const generation of generations.values()) generation.abort.abort()
      generations.clear()
    },
    'standalone-chat: chat events route',
  )
}
