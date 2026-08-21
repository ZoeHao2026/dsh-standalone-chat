import type { ChatT } from './locales.js';
import type { Router } from './router.js';
export interface ChatNavActionProps {
    wide: boolean;
    t: ChatT;
    router: Router;
}
/** Sidebar foot action opening the standalone chat page. */
export declare function ChatNavAction({ wide, t, router }: ChatNavActionProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ChatNavAction.d.ts.map