import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots';
import type { ChatT } from './locales.js';
import type { Router } from './router.js';
import type { ChatStore } from './store.js';
export interface ChatPageProps {
    t: ChatT;
    chat: ChatStore;
    router: Router;
    /** Render share of the `chat.input.model` seat declared by this entry. */
    renderSlot: PropsRenderSlots<'chat.input.model'>['renderSlot'];
}
/** The full chat page: history column, transcript, composer. */
export declare function ChatPage({ t, chat, router, renderSlot }: ChatPageProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ChatPage.d.ts.map