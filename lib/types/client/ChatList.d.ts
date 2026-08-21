import type { ChatListItem } from './api.js';
import type { ChatT } from './locales.js';
import type { ChatStore } from './store.js';
export interface ChatListProps {
    t: ChatT;
    chat: ChatStore;
    items: readonly ChatListItem[];
    loaded: boolean;
    activeId: string | undefined;
    onOpen: (conversationId: string) => void;
}
/** Left column: New Chat plus the history list with inline rename and delete. */
export declare function ChatList({ t, chat, items, loaded, activeId, onOpen }: ChatListProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ChatList.d.ts.map