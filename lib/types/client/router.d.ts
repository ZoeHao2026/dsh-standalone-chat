/**
 * Minimal pathname router owned by the chat plugin. The prebuilt shell has no
 * router of its own and never reads `location`; the static host SPA-falls-back
 * every path to index.html, so `/chat` and `/chat/:conversationId` work as
 * real URLs — this store is the only dispatcher.
 */
export type ChatRoute = {
    view: 'chat';
    conversationId: string | undefined;
} | {
    view: 'other';
};
export declare function parseRoute(pathname: string): ChatRoute;
export declare class Router {
    private listeners;
    private snapshot;
    getSnapshot: () => string;
    subscribe: (listener: () => void) => (() => void);
    private sync;
    navigate(path: string): void;
}
//# sourceMappingURL=router.d.ts.map