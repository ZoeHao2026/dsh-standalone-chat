import type { ChatProviderGroup } from './api.js';
import type { ChatT } from './locales.js';
export interface ModelSelectProps {
    t: ChatT;
    providers: readonly ChatProviderGroup[];
    provider: string | undefined;
    model: string | undefined;
    disabled?: boolean;
    onSelect: (provider: string, model: string) => void;
}
/** Compact provider/model picker styled like the DSH composer controls. */
export declare function ModelSelect({ t, providers, provider, model, disabled, onSelect }: ModelSelectProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ModelSelect.d.ts.map