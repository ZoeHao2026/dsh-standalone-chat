import type { ChatConversation } from './api.js';
import type { ChatT } from './locales.js';
export interface MessageListProps {
    t: ChatT;
    current: ChatConversation | null;
    draft: string;
    reasoning: string;
    running: boolean;
}
/** The transcript: stored messages plus the in-flight streaming draft. */
export declare function MessageList({ t, current, draft, reasoning, running }: MessageListProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=MessageList.d.ts.map