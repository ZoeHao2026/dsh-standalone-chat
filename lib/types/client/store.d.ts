import { ChatApi } from './api.js';
import type { ChatConversation, ChatListItem, ChatProviderGroup } from './api.js';
export interface ChatState {
    readonly list: readonly ChatListItem[];
    readonly listLoaded: boolean;
    readonly current: ChatConversation | null;
    readonly draft: string;
    readonly reasoning: string;
    readonly running: boolean;
    readonly error: string | null;
    readonly models: readonly ChatProviderGroup[];
    readonly modelsLoaded: boolean;
    readonly defaultModel: {
        provider: string;
        model: string;
        reasoningEffort?: string;
    } | null;
    readonly pendingModel: {
        provider: string;
        model: string;
    } | null;
}
/** UI-facing store: conversation list, the open conversation, and its live SSE stream. */
export declare class ChatStore {
    private readonly api;
    constructor(api: ChatApi);
    private snapshot;
    private readonly listeners;
    private events;
    getSnapshot: () => ChatState;
    subscribe: (listener: () => void) => (() => void);
    private set;
    dispose(): void;
    clearError(): void;
    refreshList(): Promise<void>;
    refreshModels(): Promise<void>;
    setModel(conversationId: string, provider: string, model: string, reasoningEffort?: string): Promise<void>;
    open(conversationId: string): Promise<void>;
    closeCurrent(): void;
    create(provider?: string, model?: string, reasoningEffort?: string): Promise<string>;
    setPendingModel(provider: string, model: string): void;
    clearPendingModel(): void;
    rename(conversationId: string, title: string): Promise<void>;
    remove(conversationId: string): Promise<void>;
    send(conversationId: string, content: string): Promise<void>;
    cancel(): Promise<void>;
    private appendMessage;
    private closeEvents;
    private connect;
}
//# sourceMappingURL=store.d.ts.map