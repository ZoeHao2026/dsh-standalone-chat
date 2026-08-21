import type { LocaleDictOf, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
export declare const CHAT_LOCALE_NS = "standaloneChat";
/** Framework-injected translate seat narrowed to this plugin's dictionary. */
export type ChatT = TranslateNS<typeof CHAT_LOCALE_NS>;
export declare const en: {
    readonly nav: "Chat";
    readonly title: "Chat";
    readonly newChat: "New chat";
    readonly close: "Back to sessions";
    readonly untitled: "New chat";
    readonly heroTitle: "Chat with a model";
    readonly heroHint: "A lightweight conversation without workspace files, tools, or agent instructions.";
    readonly inputPlaceholder: "Type a message…";
    readonly send: "Send";
    readonly stop: "Stop";
    readonly rename: "Rename";
    readonly delete: "Delete";
    readonly deleteConfirm: "Delete this conversation? This cannot be undone.";
    readonly renamePlaceholder: "Conversation title";
    readonly empty: "No conversations yet";
    readonly reasoning: "Thinking";
    readonly errorPrefix: "Something went wrong";
    readonly dismiss: "Dismiss";
    readonly defaultModel: "Default model";
};
export type ChatLocaleKey = keyof typeof en;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        standaloneChat: ChatLocaleKey;
    }
}
export declare const zh: LocaleDictOf<typeof CHAT_LOCALE_NS>;
export declare const dictionaries: {
    zh: LocaleDictOf<"standaloneChat">;
    en: {
        readonly nav: "Chat";
        readonly title: "Chat";
        readonly newChat: "New chat";
        readonly close: "Back to sessions";
        readonly untitled: "New chat";
        readonly heroTitle: "Chat with a model";
        readonly heroHint: "A lightweight conversation without workspace files, tools, or agent instructions.";
        readonly inputPlaceholder: "Type a message…";
        readonly send: "Send";
        readonly stop: "Stop";
        readonly rename: "Rename";
        readonly delete: "Delete";
        readonly deleteConfirm: "Delete this conversation? This cannot be undone.";
        readonly renamePlaceholder: "Conversation title";
        readonly empty: "No conversations yet";
        readonly reasoning: "Thinking";
        readonly errorPrefix: "Something went wrong";
        readonly dismiss: "Dismiss";
        readonly defaultModel: "Default model";
    };
};
//# sourceMappingURL=locales.d.ts.map