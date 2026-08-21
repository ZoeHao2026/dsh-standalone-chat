# @local/dsh-standalone-chat

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Standalone lightweight **Chat** for the DSH Web GUI — multi-turn LLM conversations
with streaming, history, automatic titles, rename and delete, at real URLs
`/chat` and `/chat/:conversationId`.

Source: <https://github.com/ZoeHao2026/dsh-standalone-chat>

Chats are **not** DSH agent sessions: the host half calls `ctx.llm.stream()`
directly with hand-built `messages[]` — no system prompt, no tools, no skills,
no AGENTS.md, no workspace/cwd binding, and conversations never appear in the
session/workspace lists.

## Layout

- `src/index.ts` — host plugin: `chat` storage domain (`~/.dsh/storages/chat.json`),
  dedicated `/chat-api` RPC endpoints (`chat/list|create|get|rename|delete|send|cancel`), and the
  SSE route `/api/chat/events` (exact web route).
- `src/client/` — browser plugin: pathname mini-router, sidebar foot action,
  full-viewport page in `shell.overlay`, list/transcript/composer components.
- `scripts/build.mjs` — esbuild client bundle (`window.__ModuleLoader__` CJS
  wrapper, `react` + primitives external) + ESM host entry, with bundle checks.

## Install

```sh
pnpm install
pnpm run build
# then, in the web profile (~/.dsh/profiles/web/package.json):
#   dependencies: "@local/dsh-standalone-chat": "link:<this dir>"
#   dsh.profile.bundles: add "@local/dsh-standalone-chat"
pnpm --dir ~/.dsh/profiles/web install
# restart dsh web
```
