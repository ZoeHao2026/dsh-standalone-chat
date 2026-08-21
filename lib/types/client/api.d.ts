import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client';
export interface ChatContentBlock {
    type: string;
    text?: string;
    [key: string]: unknown;
}
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: ChatContentBlock[];
    createdAt: number;
    provider?: string;
    model?: string;
}
export interface ChatConversation {
    id: string;
    title: string;
    pinnedTitle: boolean;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
    provider?: string;
    model?: string;
    reasoningEffort?: string;
}
export interface ChatListItem {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messageCount: number;
    preview: string;
}
export interface ChatModelItem {
    id: string;
    name: string;
}
export interface ChatProviderGroup {
    id: string;
    name: string;
    models: ChatModelItem[];
}
export interface ChatModelCatalog {
    providers: ChatProviderGroup[];
    default: {
        provider: string;
        model: string;
        reasoningEffort?: string;
    };
}
/** Typed unary wrapper over the plugin's dedicated `/chatrpc` channel. */
export declare class ChatApi {
    private readonly rpc;
    constructor(rpc: ClientConnectionRpc);
    private call;
    list(): Promise<{
        items: ChatListItem[];
    }>;
    create(provider?: string, model?: string, reasoningEffort?: string): Promise<{
        conversation: ChatConversation;
    }>;
    get(conversationId: string): Promise<{
        conversation: ChatConversation;
    }>;
    rename(conversationId: string, title: string): Promise<{
        title: string;
    }>;
    remove(conversationId: string): Promise<{
        deleted: boolean;
    }>;
    send(conversationId: string, content: string): Promise<{
        accepted: true;
        message: ChatMessage;
        title: string;
    }>;
    cancel(conversationId: string): Promise<{
        accepted: true;
    }>;
    models(): Promise<ChatModelCatalog>;
    setModel(conversationId: string, provider: string, model: string, reasoningEffort?: string): Promise<{
        conversation: ChatConversation;
    }>;
}
//# sourceMappingURL=api.d.ts.map