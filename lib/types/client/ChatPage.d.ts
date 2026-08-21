import type { ChatT } from './locales.js';
import type { Router } from './router.js';
import type { ChatStore } from './store.js';
export interface ChatPageProps {
    t: ChatT;
    chat: ChatStore;
    router: Router;
}
/** The full chat page: history column, transcript, composer. */
export declare function ChatPage({ t, chat, router }: ChatPageProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ChatPage.d.ts.map