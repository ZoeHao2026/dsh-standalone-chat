import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'

export interface ChatContentBlock {
  type: string
  text?: string
  [key: string]: unknown
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: ChatContentBlock[]
  createdAt: number
  provider?: string
  model?: string
}

export interface ChatConversation {
  id: string
  title: string
  pinnedTitle: boolean
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
  provider?: string
  model?: string
  reasoningEffort?: string
}

export interface ChatListItem {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  preview: string
}

export interface ChatModelItem {
  id: string
  name: string
}

export interface ChatProviderGroup {
  id: string
  name: string
  models: ChatModelItem[]
}

export interface ChatModelCatalog {
  providers: ChatProviderGroup[]
  default: { provider: string; model: string; reasoningEffort?: string }
}

/** Typed unary wrapper over the plugin's dedicated `/chatrpc` channel. */
export class ChatApi {
  constructor(private readonly rpc: ClientConnectionRpc) {}

  private async call<T>(endpoint: string, args: Record<string, unknown>): Promise<T> {
    const result = await this.rpc.call('/chatrpc', endpoint, args)
    if (!result.ok) throw new Error(result.error.message)
    return result.value as T
  }

  list(): Promise<{ items: ChatListItem[] }> {
    return this.call('chat/list', {})
  }

  create(provider?: string, model?: string, reasoningEffort?: string): Promise<{ conversation: ChatConversation }> {
    return this.call('chat/create', { provider, model, reasoningEffort })
  }

  get(conversationId: string): Promise<{ conversation: ChatConversation }> {
    return this.call('chat/get', { conversationId })
  }

  rename(conversationId: string, title: string): Promise<{ title: string }> {
    return this.call('chat/rename', { conversationId, title })
  }

  remove(conversationId: string): Promise<{ deleted: boolean }> {
    return this.call('chat/delete', { conversationId })
  }

  send(conversationId: string, content: string): Promise<{ accepted: true; message: ChatMessage; title: string }> {
    return this.call('chat/send', { conversationId, content })
  }

  cancel(conversationId: string): Promise<{ accepted: true }> {
    return this.call('chat/cancel', { conversationId })
  }

  models(): Promise<ChatModelCatalog> {
    return this.call('chat/models', {})
  }

  setModel(
    conversationId: string,
    provider: string,
    model: string,
    reasoningEffort?: string,
  ): Promise<{ conversation: ChatConversation }> {
    return this.call('chat/setModel', { conversationId, provider, model, reasoningEffort })
  }
}
