/**
 * @local/dsh-standalone-chat — host half.
 *
 * Standalone lightweight chat: a conversation KV store, unary RPC endpoints on
 * the shared `/api` channel, and an SSE streaming route. Generation calls
 * `ctx.llm.stream()` directly with hand-built messages — no system prompt, no
 * tools, no DSH Session/Agent/Workspace involvement of any kind, so chats are
 * provably free of project/agent context.
 */
import type { Context } from '@deepseek-ai/cordis';
export declare const name = "standalone-chat";
export declare const inject: string[];
export declare function apply(ctx: Context): Promise<void>;
//# sourceMappingURL=index.d.ts.map