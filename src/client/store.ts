import { ChatApi } from './api.js'
import type {
  ChatConversation,
  ChatListItem,
  ChatMessage,
  ChatModelCatalog,
  ChatProviderGroup,
} from './api.js'

export interface ChatState {
  readonly list: readonly ChatListItem[]
  readonly listLoaded: boolean
  readonly current: ChatConversation | null
  readonly draft: string
  readonly reasoning: string
  readonly running: boolean
  readonly error: string | null
  readonly models: readonly ChatProviderGroup[]
  readonly modelsLoaded: boolean
  readonly defaultModel: { provider: string; model: string; reasoningEffort?: string } | null
  readonly pendingModel: { provider: string; model: string } | null
}

const INITIAL: ChatState = {
  list: [],
  listLoaded: false,
  current: null,
  draft: '',
  reasoning: '',
  running: false,
  error: null,
  models: [],
  modelsLoaded: false,
  defaultModel: null,
  pendingModel: null,
}

interface StreamFrame {
  type: string
  rpcId: string
  method: string
  payload: Record<string, unknown>
}

/** UI-facing store: conversation list, the open conversation, and its live SSE stream. */
export class ChatStore {
  constructor(private readonly api: ChatApi) {}

  private snapshot: ChatState = INITIAL
  private readonly listeners = new Set<() => void>()
  private events: EventSource | null = null

  getSnapshot = (): ChatState => this.snapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private set(patch: Partial<ChatState>): void {
    this.snapshot = { ...this.snapshot, ...patch }
    for (const listener of [...this.listeners]) listener()
  }

  dispose(): void {
    this.closeEvents()
    this.listeners.clear()
  }

  clearError(): void {
    if (this.snapshot.error !== null) this.set({ error: null })
  }

  /* ------------------------------------------------------------ list ----- */

  async refreshList(): Promise<void> {
    try {
      const { items } = await this.api.list()
      this.set({ list: items, listLoaded: true })
    } catch {
      this.set({ listLoaded: true })
    }
  }

  /* ----------------------------------------------------------- models ---- */

  async refreshModels(): Promise<void> {
    if (this.snapshot.modelsLoaded) return
    try {
      const catalog: ChatModelCatalog = await this.api.models()
      this.set({ models: catalog.providers, defaultModel: catalog.default, modelsLoaded: true })
    } catch {
      this.set({ modelsLoaded: true })
    }
  }

  async setModel(conversationId: string, provider: string, model: string, reasoningEffort?: string): Promise<void> {
    const { conversation } = await this.api.setModel(conversationId, provider, model, reasoningEffort)
    if (this.snapshot.current?.id === conversationId) this.set({ current: conversation })
  }

  /* --------------------------------------------------------- current ----- */

  async open(conversationId: string): Promise<void> {
    if (this.snapshot.current?.id === conversationId && this.events) return
    this.closeEvents()
    this.set({ current: null, draft: '', reasoning: '', running: false, error: null })
    this.connect(conversationId)
    try {
      const { conversation } = await this.api.get(conversationId)
      this.set({ current: conversation })
    } catch (error) {
      this.set({ error: error instanceof Error ? error.message : String(error) })
    }
  }

  closeCurrent(): void {
    this.closeEvents()
    if (this.snapshot.current !== null || this.snapshot.draft || this.snapshot.running) {
      this.set({ current: null, draft: '', reasoning: '', running: false, error: null })
    }
  }

  async create(provider?: string, model?: string, reasoningEffort?: string): Promise<string> {
    const { conversation } = await this.api.create(provider, model, reasoningEffort)
    await this.refreshList()
    return conversation.id
  }

  setPendingModel(provider: string, model: string): void {
    this.set({ pendingModel: { provider, model } })
  }

  clearPendingModel(): void {
    if (this.snapshot.pendingModel !== null) this.set({ pendingModel: null })
  }

  async rename(conversationId: string, title: string): Promise<void> {
    const { title: accepted } = await this.api.rename(conversationId, title)
    const current = this.snapshot.current
    if (current?.id === conversationId) this.set({ current: { ...current, title: accepted, pinnedTitle: true } })
    await this.refreshList()
  }

  async remove(conversationId: string): Promise<void> {
    await this.api.remove(conversationId)
    if (this.snapshot.current?.id === conversationId) this.closeCurrent()
    this.set({ list: this.snapshot.list.filter((entry) => entry.id !== conversationId) })
  }

  /* ------------------------------------------------------------ send ----- */

  async send(conversationId: string, content: string): Promise<void> {
    if (this.snapshot.running) return
    this.set({ error: null, running: true, draft: '', reasoning: '' })
    try {
      const { message, title } = await this.api.send(conversationId, content)
      this.appendMessage(message)
      const current = this.snapshot.current
      if (current && current.title !== title) this.set({ current: { ...current, title } })
    } catch (error) {
      this.set({ error: error instanceof Error ? error.message : String(error), running: false })
      throw error
    }
  }

  async cancel(): Promise<void> {
    const current = this.snapshot.current
    if (!current) return
    try {
      await this.api.cancel(current.id)
    } catch {
      // the aborted generation settles through the stream either way
    }
  }

  private appendMessage(message: ChatMessage): void {
    const current = this.snapshot.current
    if (!current) return
    if (current.messages.some((entry) => entry.id === message.id)) return
    this.set({
      current: { ...current, messages: [...current.messages, message], updatedAt: message.createdAt },
    })
  }

  /* ------------------------------------------------------------ stream --- */

  private closeEvents(): void {
    this.events?.close()
    this.events = null
  }

  private connect(conversationId: string): void {
    const events = new EventSource(`/api/chat/events?conversationId=${encodeURIComponent(conversationId)}`)
    this.events = events
    events.onmessage = (event: MessageEvent<string>) => {
      let frame: StreamFrame
      try {
        frame = JSON.parse(event.data) as StreamFrame
      } catch {
        return
      }
      const payload = frame.payload
      switch (frame.method) {
        case 'chat/sync': {
          const conversation = (payload.conversation ?? null) as ChatConversation | null
          this.set({
            ...(conversation ? { current: conversation } : {}),
            running: payload.running === true,
            draft: typeof payload.draft === 'string' ? payload.draft : '',
            reasoning: typeof payload.reasoning === 'string' ? payload.reasoning : '',
          })
          break
        }
        case 'chat/delta': {
          this.set({
            draft: typeof payload.draft === 'string' ? payload.draft : this.snapshot.draft,
            reasoning: typeof payload.reasoning === 'string' ? payload.reasoning : this.snapshot.reasoning,
          })
          break
        }
        case 'chat/message': {
          const message = payload.message as ChatMessage | undefined
          if (message) this.appendMessage(message)
          const title = typeof payload.title === 'string' ? payload.title : undefined
          const current = this.snapshot.current
          if (current && title !== undefined && current.title !== title) {
            this.set({ current: { ...current, title } })
          }
          if (message?.role === 'assistant') this.set({ draft: '', reasoning: '' })
          if (current) void this.refreshList()
          break
        }
        case 'chat/error': {
          this.set({
            error: typeof payload.message === 'string' ? payload.message : 'generation failed',
            running: false,
            draft: '',
            reasoning: '',
          })
          break
        }
        case 'chat/status': {
          this.set({ running: payload.running === true })
          if (payload.running !== true) this.set({ draft: '', reasoning: '' })
          break
        }
        case 'chat/deleted': {
          this.closeCurrent()
          this.set({ list: this.snapshot.list.filter((entry) => entry.id !== conversationId) })
          break
        }
        case 'chat/model': {
          const current = this.snapshot.current
          if (current?.id === conversationId) {
            const next: ChatConversation = { ...current }
            if (typeof payload.provider === 'string') next.provider = payload.provider
            if (typeof payload.model === 'string') next.model = payload.model
            if (typeof payload.reasoningEffort === 'string') next.reasoningEffort = payload.reasoningEffort
            this.set({ current: next })
          }
          break
        }
        default:
          break
      }
    }
  }
}
