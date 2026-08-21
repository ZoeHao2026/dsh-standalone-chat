import { BlockAssembler, createAssistantMessage, createUserMessage } from "@deepseek-ai/dsh-llm";
import { fallbackSessionTitle, normalizeSessionTitle } from "@deepseek-ai/dsh-session-title";
import { z } from "zod";
const name = "standalone-chat";
const inject = ["storageDomain", "llm", "agentDefaultModel", "webServer", "connection"];
function ok(value) {
  return { ok: true, value };
}
function failure(message) {
  return { ok: false, error: { code: "internal", message, details: {} } };
}
const contentBlockSchema = z.object({ type: z.string() }).catchall(z.unknown());
const storedMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.array(contentBlockSchema),
  createdAt: z.number(),
  provider: z.string().optional(),
  model: z.string().optional()
});
const conversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  pinnedTitle: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
  messages: z.array(storedMessageSchema),
  provider: z.string().optional(),
  model: z.string().optional(),
  reasoningEffort: z.string().optional()
});
const chatDomainSpec = {
  name: "chat",
  version: 0,
  tables: { conversations: { valueSchema: conversationSchema } }
};
function newId() {
  return crypto.randomUUID();
}
const TITLE_MAX_WORDS = 8;
const TITLE_MAX_BYTES = 96;
function textOf(blocks) {
  return blocks.filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text).join("");
}
function listItem(conv) {
  const last = conv.messages[conv.messages.length - 1];
  return {
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    messageCount: conv.messages.length,
    preview: last ? textOf(last.content).slice(0, 120) : ""
  };
}
async function apply(ctx) {
  const domain = await ctx.storageDomain.open(chatDomainSpec);
  const conversations = domain.table("conversations");
  ctx.effect(
    () => async () => {
      await domain.close();
    },
    "standalone-chat: chat domain"
  );
  const generations = /* @__PURE__ */ new Map();
  const subscribers = /* @__PURE__ */ new Map();
  function publish(conversationId, frame) {
    const set = subscribers.get(conversationId);
    if (!set) return;
    for (const send of set) {
      try {
        send(frame);
      } catch {
      }
    }
  }
  function abortGeneration(conversationId) {
    const generation = generations.get(conversationId);
    if (generation?.running) generation.abort.abort();
  }
  async function runGeneration(conversationId) {
    const generation = { abort: new AbortController(), draft: "", reasoning: "", running: true };
    generations.set(conversationId, generation);
    publish(conversationId, { method: "chat/status", payload: { conversationId, running: true } });
    try {
      const defaultSelection = ctx.agentDefaultModel.currentSelection();
      const record = conversations.get(conversationId);
      if (!record) return;
      const selection = {
        provider: record.provider ?? defaultSelection.provider,
        model: record.model ?? defaultSelection.model,
        ...record.reasoningEffort !== void 0 ? { reasoningEffort: record.reasoningEffort } : defaultSelection.reasoningEffort !== void 0 ? { reasoningEffort: defaultSelection.reasoningEffort } : {}
      };
      const messages = record.messages.map(
        (message) => message.role === "user" ? createUserMessage({ content: message.content, source: { kind: "user" } }) : createAssistantMessage({
          content: message.content,
          source: { provider: message.provider ?? selection.provider, model: message.model ?? selection.model }
        })
      );
      const assembler = new BlockAssembler();
      const stream = ctx.llm.stream({
        provider: selection.provider,
        model: selection.model,
        ...selection.reasoningEffort !== void 0 ? { reasoningEffort: selection.reasoningEffort } : {},
        messages,
        signal: generation.abort.signal
      });
      for await (const chunk of stream) {
        assembler.push(chunk);
        if (chunk.type === "text-delta") {
          generation.draft += chunk.text;
        } else if (chunk.type === "reasoning-delta") {
          generation.reasoning += chunk.text;
        }
        if (chunk.type === "text-delta" || chunk.type === "reasoning-delta") {
          publish(conversationId, {
            method: "chat/delta",
            payload: { conversationId, draft: generation.draft, reasoning: generation.reasoning }
          });
        }
      }
      const finish = assembler.finish;
      if (finish.kind === "aborted") return;
      if (finish.kind === "error") {
        publish(conversationId, {
          method: "chat/error",
          payload: { conversationId, message: finish.failure.message }
        });
        return;
      }
      const blocks = assembler.blocks();
      if (blocks.length === 0) return;
      const assistant = createAssistantMessage({
        content: blocks,
        source: { provider: selection.provider, model: selection.model }
      });
      const stored = {
        id: assistant.id,
        role: "assistant",
        content: blocks,
        createdAt: Date.now(),
        provider: selection.provider,
        model: selection.model
      };
      const next = await conversations.update(conversationId, (current) => ({
        ...current,
        messages: [...current.messages, stored],
        updatedAt: stored.createdAt
      }));
      publish(conversationId, {
        method: "chat/message",
        payload: { conversationId, message: stored, updatedAt: next.updatedAt, title: next.title }
      });
    } catch (error) {
      if (!generation.abort.signal.aborted) {
        publish(conversationId, {
          method: "chat/error",
          payload: { conversationId, message: error instanceof Error ? error.message : String(error) }
        });
      }
    } finally {
      generation.running = false;
      generations.delete(conversationId);
      publish(conversationId, { method: "chat/status", payload: { conversationId, running: false } });
    }
  }
  async function handle(endpoint, payload) {
    const args = payload ?? {};
    try {
      switch (endpoint) {
        case "chat/list": {
          const items = [...conversations.entries()].map(([, conv]) => listItem(conv)).sort((a, b) => b.updatedAt - a.updatedAt);
          return ok({ items });
        }
        case "chat/create": {
          const now = Date.now();
          const provider = typeof args.provider === "string" && args.provider ? args.provider : void 0;
          const model = typeof args.model === "string" && args.model ? args.model : void 0;
          const reasoningEffort = typeof args.reasoningEffort === "string" && args.reasoningEffort ? args.reasoningEffort : void 0;
          const conversation = {
            id: newId(),
            title: "",
            pinnedTitle: false,
            createdAt: now,
            updatedAt: now,
            messages: [],
            ...provider !== void 0 && model !== void 0 ? { provider, model, ...reasoningEffort !== void 0 ? { reasoningEffort } : {} } : {}
          };
          await conversations.put(conversation.id, conversation);
          return ok({ conversation });
        }
        case "chat/get": {
          const conversation = conversations.get(String(args.conversationId ?? ""));
          if (!conversation) return failure("conversation not found");
          return ok({ conversation });
        }
        case "chat/rename": {
          const conversationId = String(args.conversationId ?? "");
          const title = normalizeSessionTitle(String(args.title ?? ""), TITLE_MAX_BYTES);
          if (!title) return failure("title must not be empty");
          if (!conversations.get(conversationId)) return failure("conversation not found");
          const next = await conversations.update(conversationId, (current) => ({
            ...current,
            title,
            pinnedTitle: true,
            updatedAt: Date.now()
          }));
          return ok({ title: next.title });
        }
        case "chat/delete": {
          const conversationId = String(args.conversationId ?? "");
          abortGeneration(conversationId);
          const deleted = await conversations.delete(conversationId);
          publish(conversationId, { method: "chat/deleted", payload: { conversationId } });
          return ok({ deleted });
        }
        case "chat/send": {
          const conversationId = String(args.conversationId ?? "");
          const record = conversations.get(conversationId);
          if (!record) return failure("conversation not found");
          if (generations.get(conversationId)?.running) return failure("generation already running");
          const text = String(args.content ?? "").trim();
          if (!text) return failure("message must not be empty");
          const user = createUserMessage({ content: [{ type: "text", text }], source: { kind: "user" } });
          const stored = {
            id: user.id,
            role: "user",
            content: [{ type: "text", text }],
            createdAt: Date.now()
          };
          let next = await conversations.update(conversationId, (current) => ({
            ...current,
            messages: [...current.messages, stored],
            updatedAt: stored.createdAt
          }));
          if (!next.pinnedTitle && next.messages.filter((message) => message.role === "user").length === 1) {
            const title = fallbackSessionTitle(text, TITLE_MAX_WORDS, TITLE_MAX_BYTES);
            if (title) {
              next = await conversations.update(
                conversationId,
                (current) => current.pinnedTitle ? current : { ...current, title }
              );
            }
          }
          publish(conversationId, {
            method: "chat/message",
            payload: { conversationId, message: stored, updatedAt: next.updatedAt, title: next.title }
          });
          void runGeneration(conversationId);
          return ok({ accepted: true, message: stored, title: next.title });
        }
        case "chat/cancel": {
          const conversationId = String(args.conversationId ?? "");
          abortGeneration(conversationId);
          return ok({ accepted: true });
        }
        case "chat/models": {
          const providers = ctx.llm.listProviders().map((info) => ({ id: info.id, name: info.name }));
          const groups = [];
          for (const info of providers) {
            try {
              const models = (await ctx.llm.listModels(info.id)).map((model) => ({
                id: model.id,
                name: model.name || model.id
              }));
              groups.push({ id: info.id, name: info.name, models });
            } catch {
              groups.push({ id: info.id, name: info.name, models: [] });
            }
          }
          const fallback = ctx.agentDefaultModel.currentSelection();
          return ok({ providers: groups, default: fallback });
        }
        case "chat/setModel": {
          const conversationId = String(args.conversationId ?? "");
          if (!conversations.get(conversationId)) return failure("conversation not found");
          const provider = String(args.provider ?? "");
          const model = String(args.model ?? "");
          if (!provider || !model) return failure("provider and model are required");
          const reasoningEffort = typeof args.reasoningEffort === "string" && args.reasoningEffort ? args.reasoningEffort : void 0;
          const next = await conversations.update(conversationId, (current) => ({
            ...current,
            provider,
            model,
            ...reasoningEffort !== void 0 ? { reasoningEffort } : {},
            updatedAt: Date.now()
          }));
          publish(conversationId, { method: "chat/model", payload: { conversationId, provider, model, reasoningEffort } });
          return ok({ conversation: next });
        }
        default:
          return failure(`unknown chat endpoint: ${endpoint}`);
      }
    } catch (error) {
      return failure(error instanceof Error ? error.message : String(error));
    }
  }
  const disposeRpc = ctx.connection.rpc.handle(
    "/chatrpc",
    (endpoint, payload) => handle(endpoint, payload),
    { authority: "loopback" }
  );
  ctx.effect(
    () => async () => {
      await disposeRpc();
    },
    "standalone-chat: chat rpc"
  );
  function events(req, res) {
    const origin = req.headers.origin;
    if (origin !== void 0) {
      let originHost;
      if (typeof origin !== "string") {
        originHost = void 0;
      } else {
        try {
          originHost = new URL(origin).host;
        } catch {
          originHost = void 0;
        }
      }
      if (originHost !== req.headers.host) {
        res.writeHead(403);
        res.end("forbidden");
        return;
      }
    }
    const url = new URL(req.url ?? "/", "http://standalone-chat.local");
    const conversationId = url.searchParams.get("conversationId") ?? "";
    res.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive"
    });
    const send = (frame) => {
      res.write(
        `data: ${JSON.stringify({ type: "server-request", rpcId: newId(), method: frame.method, payload: frame.payload })}

`
      );
    };
    const generation = generations.get(conversationId);
    send({
      method: "chat/sync",
      payload: {
        conversationId,
        conversation: conversations.get(conversationId) ?? null,
        running: generation?.running ?? false,
        draft: generation?.draft ?? "",
        reasoning: generation?.reasoning ?? ""
      }
    });
    let set = subscribers.get(conversationId);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      subscribers.set(conversationId, set);
    }
    set.add(send);
    const heartbeat = setInterval(() => {
      res.write(": ping\n\n");
    }, 15e3);
    req.on("close", () => {
      clearInterval(heartbeat);
      set.delete(send);
      if (set.size === 0) subscribers.delete(conversationId);
      res.end();
    });
  }
  const disposeRoute = ctx.webServer.register({
    kind: "exact",
    path: "/api/chat/events",
    handler: events
  });
  ctx.effect(
    () => () => {
      disposeRoute();
      for (const generation of generations.values()) generation.abort.abort();
      generations.clear();
    },
    "standalone-chat: chat events route"
  );
}
export {
  apply,
  inject,
  name
};
