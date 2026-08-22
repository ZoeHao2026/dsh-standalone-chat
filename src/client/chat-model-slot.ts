import type {} from '@deepseek-ai/dsh-client-ui-slots'

/**
 * Contract of the `chat.input.model` seat declared by the standalone chat
 * page. Other plugins (e.g. dsh-ui-model-selection-collapsible) register an
 * occupant into this root-scoped single slot and receive the inject face
 * below; when no occupant exists the chat page renders its built-in fallback.
 *
 * The slot is declared purely by string key: every registering package
 * declares the same SlotMap entry on its own type surface, so no package
 * imports another.
 */

/** Provider/model selection (structural subset of the official ModelSelection). */
export interface ChatModelSelection {
  provider: string
  model: string
  reasoningEffort?: string
}

/** One provider group in the chat model directory. */
export interface ChatModelGroup {
  id: string
  name: string
  models: readonly { id: string; name: string; description?: string }[]
}

/** Snapshot read by slot occupants (SnapshotStore-shaped). */
export interface ChatModelDirectorySnapshot {
  groups: readonly ChatModelGroup[]
  current: ChatModelSelection | null
  /** The chat catalog does not expose a separate route-health probe. */
  routable: boolean | null
  /** Provider-local failures are not exposed by the chat catalog RPC. */
  failures: readonly { id: string; name: string; message: string }[]
  status: 'idle' | 'loading' | 'ready' | 'selecting' | 'error'
  error: string | null
  available: boolean
  locked: boolean
}

/** The directory store handed to slot occupants. */
export interface ChatModelDirectoryStore {
  subscribe(listener: () => void): () => void
  getSnapshot(): ChatModelDirectorySnapshot
}

/** Inject face the chat page provides to occupants of its model seat. */
export interface ChatModelDirectoryFace {
  /** The shared directory store (stable instance; subscribe mirrors chat state). */
  getDirectory(): ChatModelDirectoryStore
  /** Refresh the advisory model catalog (fire-and-forget). */
  load(): void
  /** Select a complete provider/model/reasoning selection; resolves to acceptance. */
  select(selection: ChatModelSelection): Promise<boolean>
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'chat.input.model': {
      kind: 'single'
      scope: 'root'
      owner: Record<never, never>
      inject: ChatModelDirectoryFace
    }
  }
}
