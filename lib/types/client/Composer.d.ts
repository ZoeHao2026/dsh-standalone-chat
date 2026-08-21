import type { ChatT } from './locales.js';
export interface ComposerProps {
    t: ChatT;
    running: boolean;
    onSend: (content: string) => void;
    onStop: () => void;
}
/** Bottom composer: Enter sends, Shift+Enter inserts a newline. */
export declare function Composer({ t, running, onSend, onStop }: ComposerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Composer.d.ts.map