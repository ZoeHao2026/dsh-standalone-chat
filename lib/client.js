window.__ModuleLoader__.load({ id: "@local/dsh-standalone-chat", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react8 = require("react");

// src/client/api.ts
var ChatApi = class {
  constructor(rpc) {
    this.rpc = rpc;
  }
  async call(endpoint, args) {
    const result = await this.rpc.call("/chatrpc", endpoint, args);
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  }
  list() {
    return this.call("chat/list", {});
  }
  create(provider, model, reasoningEffort) {
    return this.call("chat/create", { provider, model, reasoningEffort });
  }
  get(conversationId) {
    return this.call("chat/get", { conversationId });
  }
  rename(conversationId, title) {
    return this.call("chat/rename", { conversationId, title });
  }
  remove(conversationId) {
    return this.call("chat/delete", { conversationId });
  }
  send(conversationId, content) {
    return this.call("chat/send", { conversationId, content });
  }
  cancel(conversationId) {
    return this.call("chat/cancel", { conversationId });
  }
  models() {
    return this.call("chat/models", {});
  }
  setModel(conversationId, provider, model, reasoningEffort) {
    return this.call("chat/setModel", { conversationId, provider, model, reasoningEffort });
  }
};

// src/client/ChatNavAction.tsx
var import_react = require("react");

// src/client/router.ts
function parseRoute(pathname) {
  if (pathname === "/chat" || pathname === "/chat/") return { view: "chat", conversationId: void 0 };
  const match = /^\/chat\/([^/]+)\/?$/.exec(pathname);
  if (match?.[1]) return { view: "chat", conversationId: decodeURIComponent(match[1]) };
  return { view: "other" };
}
var Router = class {
  listeners = /* @__PURE__ */ new Set();
  snapshot = window.location.pathname;
  getSnapshot = () => this.snapshot;
  subscribe = (listener) => {
    this.listeners.add(listener);
    const onPop = () => this.sync();
    window.addEventListener("popstate", onPop);
    return () => {
      this.listeners.delete(listener);
      window.removeEventListener("popstate", onPop);
    };
  };
  sync() {
    const next = window.location.pathname;
    if (next === this.snapshot) return;
    this.snapshot = next;
    for (const listener of [...this.listeners]) listener();
  }
  navigate(path) {
    if (path === this.snapshot) return;
    window.history.pushState(null, "", path);
    this.sync();
  }
};

// src/client/ChatNavAction.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function ChatNavAction({ wide, t, router }) {
  const pathname = (0, import_react.useSyncExternalStore)(router.subscribe, router.getSnapshot);
  const active = parseRoute(pathname).view === "chat";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "button",
    {
      type: "button",
      className: `dshsc-navAction${active ? " dshsc-navActionActive" : ""}`,
      title: t("nav"),
      "aria-label": t("nav"),
      "aria-current": active ? "page" : void 0,
      onClick: () => router.navigate("/chat"),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { className: "dshsc-navIcon", viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "path",
            {
              d: "M2.5 2.75c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v6.5c0 .69-.56 1.25-1.25 1.25H6.16l-2.9 2.61c-.42.38-1.06.06-1.06-.5V2.75Z",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "1.2",
              strokeLinejoin: "round"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5 5.25h6M5 7.75h4", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" })
        ] }),
        wide ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsc-navLabel", children: t("nav") }) : null
      ]
    }
  );
}

// src/client/ChatPage.tsx
var import_react6 = require("react");
var import_react7 = require("react");

// src/client/ChatList.tsx
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function ChatList({ t, chat, items, loaded, activeId, onOpen }) {
  const [editingId, setEditingId] = (0, import_react2.useState)(null);
  const [draft, setDraft] = (0, import_react2.useState)("");
  const commitRename = async (conversationId) => {
    const title = draft.trim();
    setEditingId(null);
    if (title) await chat.rename(conversationId, title);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsc-listBody", role: "list", "aria-label": t("title"), children: [
    loaded && items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsc-listEmpty", children: t("empty") }) : null,
    items.map((item) => {
      const active = item.id === activeId;
      const editing = editingId === item.id;
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "div",
        {
          role: "listitem",
          className: `dshsc-listItem${active ? " dshsc-listItemActive" : ""}`,
          children: editing ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              className: "dshsc-renameInput",
              value: draft,
              placeholder: t("renamePlaceholder"),
              autoFocus: true,
              onChange: (event) => setDraft(event.target.value),
              onKeyDown: (event) => {
                if (event.key === "Enter") void commitRename(item.id);
                if (event.key === "Escape") setEditingId(null);
              },
              onBlur: () => void commitRename(item.id)
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "dshsc-listItemMain", onClick: () => onOpen(item.id), children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsc-listItemTitle", children: item.title || t("untitled") }),
              item.preview ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsc-listItemPreview", children: item.preview }) : null
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dshsc-listItemActions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  type: "button",
                  className: "dshsc-iconButton",
                  title: t("rename"),
                  "aria-label": t("rename"),
                  onClick: () => {
                    setEditingId(item.id);
                    setDraft(item.title);
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "path",
                    {
                      d: "M9.7 3.3l3 3L5.8 13.2l-3.4.4.4-3.4 6.9-6.9Zm1.4-1.4l1.6-1.6c.3-.3.8-.3 1.1 0l1.9 1.9c.3.3.3.8 0 1.1l-1.6 1.6-3-3Z",
                      fill: "currentColor",
                      transform: "scale(0.9) translate(0.8 0.8)"
                    }
                  ) })
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  type: "button",
                  className: "dshsc-iconButton",
                  title: t("delete"),
                  "aria-label": t("delete"),
                  onClick: () => {
                    if (window.confirm(t("deleteConfirm"))) void chat.remove(item.id);
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "path",
                    {
                      d: "M4 4l8 8M12 4l-8 8",
                      stroke: "currentColor",
                      strokeWidth: "1.4",
                      strokeLinecap: "round"
                    }
                  ) })
                }
              )
            ] })
          ] })
        },
        item.id
      );
    })
  ] });
}

// src/client/Composer.tsx
var import_react3 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
function Composer({ t, running, onSend, onStop }) {
  const [value, setValue] = (0, import_react3.useState)("");
  const areaRef = (0, import_react3.useRef)(null);
  const submit = () => {
    const content = value.trim();
    if (!content || running) return;
    setValue("");
    const area = areaRef.current;
    if (area) area.style.height = "auto";
    onSend(content);
  };
  const autogrow = () => {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${Math.min(area.scrollHeight, 200)}px`;
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsc-composerBox", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "textarea",
      {
        ref: areaRef,
        className: "dshsc-input",
        rows: 1,
        value,
        placeholder: t("inputPlaceholder"),
        onChange: (event) => {
          setValue(event.target.value);
          autogrow();
        },
        onKeyDown: (event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }
      }
    ),
    running ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "dshsc-stopButton", title: t("stop"), "aria-label": t("stop"), onClick: onStop, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "3.5", y: "3.5", width: "9", height: "9", rx: "1.5", fill: "currentColor" }) }) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "button",
      {
        type: "button",
        className: "dshsc-sendButton",
        title: t("send"),
        "aria-label": t("send"),
        disabled: !value.trim(),
        onClick: submit,
        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "path",
          {
            d: "M8 12.5v-9M4.5 6.5 8 3l3.5 3.5",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.6",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ) })
      }
    )
  ] });
}

// src/client/ModelSelect.tsx
var import_react4 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
function ModelSelect({ t, providers, provider, model, disabled, onSelect }) {
  const [open, setOpen] = (0, import_react4.useState)(false);
  const currentLabel = (0, import_react4.useMemo)(() => {
    const group = providers.find((entry) => entry.id === provider);
    const found = group?.models.find((entry) => entry.id === model);
    return found ? found.name : model ? `${provider}/${model}` : t("defaultModel");
  }, [providers, provider, model, t]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `dshsc-modelSelect${open ? " dshsc-modelSelectOpen" : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "button",
      {
        type: "button",
        className: "dshsc-modelSelectTrigger",
        title: currentLabel,
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        disabled: disabled === true || providers.length === 0,
        onClick: () => setOpen((value) => !value),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshsc-modelSelectLabel", children: currentLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { className: "dshsc-modelSelectChevron", viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M4 6l4 4 4-4", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) })
        ]
      }
    ),
    open ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshsc-modelSelectMenu", role: "listbox", children: providers.map((group) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshsc-modelSelectGroup", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshsc-modelSelectGroupName", children: group.name }),
      group.models.map((entry) => {
        const selected = entry.id === model && group.id === provider;
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            type: "button",
            className: `dshsc-modelSelectItem${selected ? " dshsc-modelSelectItemSelected" : ""}`,
            role: "option",
            "aria-selected": selected === true,
            onClick: () => {
              onSelect(group.id, entry.id);
              setOpen(false);
            },
            children: entry.name
          },
          `${group.id}/${entry.id}`
        );
      })
    ] }, group.id)) }) : null
  ] });
}

// src/client/MessageList.tsx
var import_react5 = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime5 = require("react/jsx-runtime");
function visibleText(message) {
  return message.content.filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text).join("");
}
function reasoningText(message) {
  return message.content.filter((block) => block.type === "reasoning" && typeof block.text === "string").map((block) => block.text).join("");
}
function UserRow({ message }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dshsc-row dshsc-rowUser", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dshsc-userBubble", children: visibleText(message) }) });
}
function AssistantRow({ text, reasoning, streaming, t }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshsc-row dshsc-rowAssistant", children: [
    reasoning ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { className: "dshsc-reasoning", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("summary", { children: t("reasoning") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dshsc-reasoningBody", children: reasoning })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshsc-assistantBody", children: [
      text ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives.MarkdownText, { text, streaming: streaming === true }) : null,
      streaming === true && !text ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dshsc-caret", children: "\u258D" }) : null
    ] })
  ] });
}
function MessageList({ t, current, draft, reasoning, running }) {
  const scrollRef = (0, import_react5.useRef)(null);
  const messageCount = current?.messages.length ?? 0;
  (0, import_react5.useEffect)(() => {
    const node = scrollRef.current;
    if (!node) return;
    if (node.scrollHeight - node.scrollTop - node.clientHeight < 240) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messageCount, draft]);
  const showDraft = running || draft.length > 0;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dshsc-scroll", ref: scrollRef, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshsc-thread", children: [
    current?.messages.map(
      (message) => message.role === "user" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(UserRow, { message }, message.id) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        AssistantRow,
        {
          text: visibleText(message),
          reasoning: reasoningText(message),
          t
        },
        message.id
      )
    ),
    showDraft ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(AssistantRow, { text: draft, reasoning, streaming: true, t }) : null
  ] }) });
}

// src/client/ChatPage.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function ChatPage({ t, chat, router, renderSlot }) {
  const pathname = (0, import_react7.useSyncExternalStore)(router.subscribe, router.getSnapshot);
  const route = parseRoute(pathname);
  const conversationId = route.view === "chat" ? route.conversationId : void 0;
  const state = (0, import_react7.useSyncExternalStore)(chat.subscribe, chat.getSnapshot);
  (0, import_react6.useEffect)(() => {
    void chat.refreshList();
    void chat.refreshModels();
  }, [chat]);
  (0, import_react6.useEffect)(() => {
    if (conversationId === void 0) {
      chat.closeCurrent();
      return;
    }
    void chat.open(conversationId);
  }, [chat, conversationId]);
  const openConversation = (id) => router.navigate(`/chat/${encodeURIComponent(id)}`);
  const newChat = async () => {
    const id = await chat.create();
    router.navigate(`/chat/${encodeURIComponent(id)}`);
  };
  const send = async (content) => {
    let id = conversationId;
    if (id === void 0) {
      const pending = state.pendingModel;
      id = await chat.create(pending?.provider, pending?.model);
      router.navigate(`/chat/${encodeURIComponent(id)}`);
      await chat.open(id);
    }
    try {
      await chat.send(id, content);
    } catch {
    }
  };
  const showHero = state.current === null && conversationId === void 0 && !state.running;
  const activeModel = state.current ? { provider: state.current.provider, model: state.current.model } : state.pendingModel ?? state.defaultModel;
  const selectModel = (provider, model) => {
    const current = state.current;
    if (current) void chat.setModel(current.id, provider, model).catch(() => void 0);
    else chat.setPendingModel(provider, model);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshsc-page", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("aside", { className: "dshsc-listCol", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshsc-listHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "dshsc-listTitle", children: t("title") }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", className: "dshsc-newButton", onClick: () => void newChat(), children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("svg", { viewBox: "0 0 16 16", width: "13", height: "13", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M8 3v10M3 8h10", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }),
          t("newChat")
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ChatList, { t, chat, items: state.list, loaded: state.listLoaded, activeId: conversationId, onOpen: openConversation })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "dshsc-main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("header", { className: "dshsc-mainHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "dshsc-mainTitle", children: state.current?.title || t("untitled") }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "button",
          {
            type: "button",
            className: "dshsc-iconButton",
            title: t("close"),
            "aria-label": t("close"),
            onClick: () => router.navigate("/"),
            children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" }) })
          }
        )
      ] }),
      state.error !== null ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshsc-error", role: "alert", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
          t("errorPrefix"),
          ": ",
          state.error
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "dshsc-iconButton", title: t("dismiss"), "aria-label": t("dismiss"), onClick: () => chat.clearError(), children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("svg", { viewBox: "0 0 16 16", width: "13", height: "13", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" }) }) })
      ] }) : null,
      showHero ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshsc-hero", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h1", { className: "dshsc-heroTitle", children: t("heroTitle") }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "dshsc-heroHint", children: t("heroHint") })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(MessageList, { t, current: state.current, draft: state.draft, reasoning: state.reasoning, running: state.running }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshsc-composerArea", children: [
        renderSlot("chat.input.model", {}, {
          // Built-in fallback while no plugin occupies the chat model seat.
          fallback: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            ModelSelect,
            {
              t,
              providers: state.models,
              provider: activeModel?.provider,
              model: activeModel?.model,
              onSelect: selectModel
            }
          )
        }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Composer, { t, running: state.running, onSend: (content) => void send(content), onStop: () => void chat.cancel() })
      ] })
    ] })
  ] });
}

// src/client/locales.ts
var CHAT_LOCALE_NS = "standaloneChat";
var en = {
  nav: "Chat",
  title: "Chat",
  newChat: "New chat",
  close: "Back to sessions",
  untitled: "New chat",
  heroTitle: "Chat with a model",
  heroHint: "A lightweight conversation without workspace files, tools, or agent instructions.",
  inputPlaceholder: "Type a message\u2026",
  send: "Send",
  stop: "Stop",
  rename: "Rename",
  delete: "Delete",
  deleteConfirm: "Delete this conversation? This cannot be undone.",
  renamePlaceholder: "Conversation title",
  empty: "No conversations yet",
  reasoning: "Thinking",
  errorPrefix: "Something went wrong",
  dismiss: "Dismiss",
  defaultModel: "Default model"
};
var zh = {
  nav: "\u804A\u5929",
  title: "\u804A\u5929",
  newChat: "\u65B0\u5BF9\u8BDD",
  close: "\u8FD4\u56DE\u4F1A\u8BDD",
  untitled: "\u65B0\u5BF9\u8BDD",
  heroTitle: "\u4E0E\u6A21\u578B\u5BF9\u8BDD",
  heroHint: "\u8F7B\u91CF\u7EA7\u5BF9\u8BDD\uFF0C\u4E0D\u52A0\u8F7D\u5DE5\u4F5C\u533A\u6587\u4EF6\u3001\u5DE5\u5177\u6216 Agent \u6307\u4EE4\u3002",
  inputPlaceholder: "\u8F93\u5165\u6D88\u606F\u2026",
  send: "\u53D1\u9001",
  stop: "\u505C\u6B62",
  rename: "\u91CD\u547D\u540D",
  delete: "\u5220\u9664",
  deleteConfirm: "\u786E\u5B9A\u5220\u9664\u8BE5\u5BF9\u8BDD\u5417\uFF1F\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002",
  renamePlaceholder: "\u5BF9\u8BDD\u6807\u9898",
  empty: "\u6682\u65E0\u5BF9\u8BDD",
  reasoning: "\u601D\u8003\u8FC7\u7A0B",
  errorPrefix: "\u51FA\u9519\u4E86",
  dismiss: "\u5173\u95ED",
  defaultModel: "\u9ED8\u8BA4\u6A21\u578B"
};
var dictionaries = { zh, en };

// src/client/store.ts
var INITIAL = {
  list: [],
  listLoaded: false,
  current: null,
  draft: "",
  reasoning: "",
  running: false,
  error: null,
  models: [],
  modelsLoaded: false,
  defaultModel: null,
  pendingModel: null
};
var ChatStore = class {
  constructor(api) {
    this.api = api;
  }
  snapshot = INITIAL;
  listeners = /* @__PURE__ */ new Set();
  events = null;
  getSnapshot = () => this.snapshot;
  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  set(patch) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of [...this.listeners]) listener();
  }
  dispose() {
    this.closeEvents();
    this.listeners.clear();
  }
  clearError() {
    if (this.snapshot.error !== null) this.set({ error: null });
  }
  /* ------------------------------------------------------------ list ----- */
  async refreshList() {
    try {
      const { items } = await this.api.list();
      this.set({ list: items, listLoaded: true });
    } catch {
      this.set({ listLoaded: true });
    }
  }
  /* ----------------------------------------------------------- models ---- */
  async refreshModels() {
    if (this.snapshot.modelsLoaded) return;
    try {
      const catalog = await this.api.models();
      this.set({ models: catalog.providers, defaultModel: catalog.default, modelsLoaded: true });
    } catch {
      this.set({ modelsLoaded: true });
    }
  }
  async setModel(conversationId, provider, model, reasoningEffort) {
    const { conversation } = await this.api.setModel(conversationId, provider, model, reasoningEffort);
    if (this.snapshot.current?.id === conversationId) this.set({ current: conversation });
  }
  /* -------------------------------------------- chat.input.model seat ----- */
  directoryStore = null;
  /** Stable directory store for the `chat.input.model` slot occupants. */
  getDirectoryStore() {
    if (this.directoryStore === null) {
      this.directoryStore = {
        subscribe: (listener) => this.subscribe(listener),
        getSnapshot: () => this.directorySnapshot()
      };
    }
    return this.directoryStore;
  }
  directorySnapshot() {
    const state = this.snapshot;
    const picked = state.current && state.current.provider && state.current.model ? { provider: state.current.provider, model: state.current.model, ...state.current.reasoningEffort !== void 0 ? { reasoningEffort: state.current.reasoningEffort } : {} } : state.pendingModel ?? state.defaultModel;
    return {
      groups: state.models,
      current: picked && picked.provider && picked.model ? picked : null,
      available: state.modelsLoaded,
      locked: state.running
    };
  }
  /** Slot-facing selection: persists onto the open conversation or stages it. */
  async selectModel(selection) {
    if (!selection.provider || !selection.model) return false;
    const current = this.snapshot.current;
    if (current) {
      try {
        await this.setModel(current.id, selection.provider, selection.model, selection.reasoningEffort);
        return true;
      } catch {
        return false;
      }
    }
    this.setPendingModel(selection.provider, selection.model);
    return true;
  }
  /* --------------------------------------------------------- current ----- */
  async open(conversationId) {
    if (this.snapshot.current?.id === conversationId && this.events) return;
    this.closeEvents();
    this.set({ current: null, draft: "", reasoning: "", running: false, error: null });
    this.connect(conversationId);
    try {
      const { conversation } = await this.api.get(conversationId);
      this.set({ current: conversation });
    } catch (error) {
      this.set({ error: error instanceof Error ? error.message : String(error) });
    }
  }
  closeCurrent() {
    this.closeEvents();
    if (this.snapshot.current !== null || this.snapshot.draft || this.snapshot.running) {
      this.set({ current: null, draft: "", reasoning: "", running: false, error: null });
    }
  }
  async create(provider, model, reasoningEffort) {
    const { conversation } = await this.api.create(provider, model, reasoningEffort);
    await this.refreshList();
    return conversation.id;
  }
  setPendingModel(provider, model) {
    this.set({ pendingModel: { provider, model } });
  }
  clearPendingModel() {
    if (this.snapshot.pendingModel !== null) this.set({ pendingModel: null });
  }
  async rename(conversationId, title) {
    const { title: accepted } = await this.api.rename(conversationId, title);
    const current = this.snapshot.current;
    if (current?.id === conversationId) this.set({ current: { ...current, title: accepted, pinnedTitle: true } });
    await this.refreshList();
  }
  async remove(conversationId) {
    await this.api.remove(conversationId);
    if (this.snapshot.current?.id === conversationId) this.closeCurrent();
    this.set({ list: this.snapshot.list.filter((entry) => entry.id !== conversationId) });
  }
  /* ------------------------------------------------------------ send ----- */
  async send(conversationId, content) {
    if (this.snapshot.running) return;
    this.set({ error: null, running: true, draft: "", reasoning: "" });
    try {
      const { message, title } = await this.api.send(conversationId, content);
      this.appendMessage(message);
      const current = this.snapshot.current;
      if (current && current.title !== title) this.set({ current: { ...current, title } });
    } catch (error) {
      this.set({ error: error instanceof Error ? error.message : String(error), running: false });
      throw error;
    }
  }
  async cancel() {
    const current = this.snapshot.current;
    if (!current) return;
    try {
      await this.api.cancel(current.id);
    } catch {
    }
  }
  appendMessage(message) {
    const current = this.snapshot.current;
    if (!current) return;
    if (current.messages.some((entry) => entry.id === message.id)) return;
    this.set({
      current: { ...current, messages: [...current.messages, message], updatedAt: message.createdAt }
    });
  }
  /* ------------------------------------------------------------ stream --- */
  closeEvents() {
    this.events?.close();
    this.events = null;
  }
  connect(conversationId) {
    const events = new EventSource(`/api/chat/events?conversationId=${encodeURIComponent(conversationId)}`);
    this.events = events;
    events.onmessage = (event) => {
      let frame;
      try {
        frame = JSON.parse(event.data);
      } catch {
        return;
      }
      const payload = frame.payload;
      switch (frame.method) {
        case "chat/sync": {
          const conversation = payload.conversation ?? null;
          this.set({
            ...conversation ? { current: conversation } : {},
            running: payload.running === true,
            draft: typeof payload.draft === "string" ? payload.draft : "",
            reasoning: typeof payload.reasoning === "string" ? payload.reasoning : ""
          });
          break;
        }
        case "chat/delta": {
          this.set({
            draft: typeof payload.draft === "string" ? payload.draft : this.snapshot.draft,
            reasoning: typeof payload.reasoning === "string" ? payload.reasoning : this.snapshot.reasoning
          });
          break;
        }
        case "chat/message": {
          const message = payload.message;
          if (message) this.appendMessage(message);
          const title = typeof payload.title === "string" ? payload.title : void 0;
          const current = this.snapshot.current;
          if (current && title !== void 0 && current.title !== title) {
            this.set({ current: { ...current, title } });
          }
          if (message?.role === "assistant") this.set({ draft: "", reasoning: "" });
          if (current) void this.refreshList();
          break;
        }
        case "chat/error": {
          this.set({
            error: typeof payload.message === "string" ? payload.message : "generation failed",
            running: false,
            draft: "",
            reasoning: ""
          });
          break;
        }
        case "chat/status": {
          this.set({ running: payload.running === true });
          if (payload.running !== true) this.set({ draft: "", reasoning: "" });
          break;
        }
        case "chat/deleted": {
          this.closeCurrent();
          this.set({ list: this.snapshot.list.filter((entry) => entry.id !== conversationId) });
          break;
        }
        case "chat/model": {
          const current = this.snapshot.current;
          if (current?.id === conversationId) {
            const next = { ...current };
            if (typeof payload.provider === "string") next.provider = payload.provider;
            if (typeof payload.model === "string") next.model = payload.model;
            if (typeof payload.reasoningEffort === "string") next.reasoningEffort = payload.reasoningEffort;
            this.set({ current: next });
          }
          break;
        }
        default:
          break;
      }
    };
  }
};

// src/client/styles.css
var tagId = "@local/dsh-standalone-chat/styles.css";
if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="' + tagId + '"]') === null) {
  const tag = document.createElement("style");
  tag.dataset.plugin = "@local/dsh-standalone-chat";
  tag.dataset.pluginCss = tagId;
  tag.textContent = "/* @local/dsh-standalone-chat \u2014 styles over the shared --dsw-alias-* tokens. */\n\n.dshsc-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 40;\n  pointer-events: auto;\n  background: var(--dsw-alias-bg-base);\n  display: flex;\n}\n\n.dshsc-page {\n  display: flex;\n  flex: 1;\n  min-width: 0;\n  min-height: 0;\n}\n\n/* ------------------------------------------------------------- nav ------ */\n\n.dshsc-navAction {\n  height: 28px;\n  min-width: 28px;\n  padding: 0 8px;\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  border: 0;\n  border-radius: 8px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 13px;\n  font-weight: 500;\n  cursor: pointer;\n}\n\n.dshsc-navAction:hover,\n.dshsc-navAction:focus-visible {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n\n.dshsc-navActionActive {\n  color: var(--dsw-alias-brand-primary);\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n.dshsc-navIcon {\n  flex: none;\n}\n\n/* ------------------------------------------------------------ list ------ */\n\n.dshsc-listCol {\n  width: 260px;\n  flex: none;\n  display: flex;\n  flex-direction: column;\n  min-height: 0;\n  border-right: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-1);\n}\n\n.dshsc-listHeader {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  padding: 12px 12px 8px;\n}\n\n.dshsc-listTitle {\n  color: var(--dsw-alias-label-primary);\n  font-size: 14px;\n  font-weight: 600;\n}\n\n.dshsc-newButton {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  height: 26px;\n  padding: 0 10px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 8px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12.5px;\n  cursor: pointer;\n}\n\n.dshsc-newButton:hover,\n.dshsc-newButton:focus-visible {\n  background: var(--dsw-alias-interactive-bg-hover);\n  color: var(--dsw-alias-label-primary);\n}\n\n.dshsc-listBody {\n  flex: 1;\n  overflow-y: auto;\n  padding: 0 8px 12px;\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n\n.dshsc-listEmpty {\n  color: var(--dsw-alias-label-caption);\n  font-size: 13px;\n  padding: 16px 8px;\n  text-align: center;\n}\n\n.dshsc-listItem {\n  position: relative;\n  display: flex;\n  align-items: center;\n  border-radius: 8px;\n}\n\n.dshsc-listItem:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n\n.dshsc-listItemActive {\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n.dshsc-listItemMain {\n  flex: 1;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n  gap: 1px;\n  padding: 8px;\n  border: 0;\n  background: transparent;\n  text-align: left;\n  cursor: pointer;\n}\n\n.dshsc-listItemTitle {\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.dshsc-listItemPreview {\n  color: var(--dsw-alias-label-caption);\n  font-size: 12px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.dshsc-listItemActions {\n  display: none;\n  flex: none;\n  gap: 2px;\n  padding-right: 6px;\n}\n\n.dshsc-listItem:hover .dshsc-listItemActions,\n.dshsc-listItemActive .dshsc-listItemActions {\n  display: inline-flex;\n}\n\n.dshsc-renameInput {\n  flex: 1;\n  margin: 6px 8px;\n  padding: 4px 8px;\n  border: 1px solid var(--dsw-alias-border-l3, var(--dsw-alias-border-l2));\n  border-radius: 6px;\n  background: var(--dsw-alias-bg-base);\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  outline: none;\n}\n\n/* ------------------------------------------------------------ main ------ */\n\n.dshsc-main {\n  flex: 1;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n  min-height: 0;\n}\n\n.dshsc-mainHeader {\n  flex: none;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  padding: 12px 20px;\n  border-bottom: 1px solid var(--dsw-alias-border-l2);\n}\n\n.dshsc-mainTitle {\n  color: var(--dsw-alias-label-primary);\n  font-size: 14px;\n  font-weight: 600;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.dshsc-iconButton {\n  width: 26px;\n  height: 26px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-caption);\n  cursor: pointer;\n}\n\n.dshsc-iconButton:hover,\n.dshsc-iconButton:focus-visible {\n  background: var(--dsw-alias-interactive-bg-hover);\n  color: var(--dsw-alias-label-primary);\n}\n\n.dshsc-error {\n  flex: none;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  margin: 8px 20px 0;\n  padding: 8px 12px;\n  border: 1px solid var(--dsw-alias-state-error-primary);\n  border-radius: 8px;\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 13px;\n}\n\n/* ------------------------------------------------------------ hero ------ */\n\n.dshsc-hero {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  padding: 24px;\n  text-align: center;\n}\n\n.dshsc-heroTitle {\n  margin: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 22px;\n  font-weight: 600;\n}\n\n.dshsc-heroHint {\n  margin: 0;\n  color: var(--dsw-alias-label-caption);\n  font-size: 13.5px;\n}\n\n/* ------------------------------------------------------------ thread ---- */\n\n.dshsc-scroll {\n  flex: 1;\n  overflow-y: auto;\n  min-height: 0;\n}\n\n.dshsc-thread {\n  max-width: 780px;\n  margin: 0 auto;\n  padding: 20px 24px 12px;\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n}\n\n.dshsc-row {\n  display: flex;\n}\n\n.dshsc-rowUser {\n  justify-content: flex-end;\n}\n\n.dshsc-userBubble {\n  max-width: 78%;\n  padding: 9px 14px;\n  border-radius: 14px;\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-primary);\n  font-size: 14px;\n  line-height: 1.6;\n  white-space: pre-wrap;\n  word-break: break-word;\n}\n\n.dshsc-rowAssistant {\n  justify-content: flex-start;\n}\n\n.dshsc-assistantBody {\n  min-width: 0;\n  max-width: 100%;\n  color: var(--dsw-alias-label-primary);\n  font-size: 14px;\n  line-height: 1.7;\n}\n\n.dshsc-reasoning {\n  margin-bottom: 6px;\n  color: var(--dsw-alias-label-caption);\n  font-size: 12.5px;\n}\n\n.dshsc-reasoning > summary {\n  cursor: pointer;\n  user-select: none;\n}\n\n.dshsc-reasoningBody {\n  margin-top: 4px;\n  padding: 8px 10px;\n  border-left: 2px solid var(--dsw-alias-border-l2);\n  white-space: pre-wrap;\n  word-break: break-word;\n}\n\n.dshsc-caret {\n  color: var(--dsw-alias-label-caption);\n  animation: dshsc-blink 1s steps(2, start) infinite;\n}\n\n@keyframes dshsc-blink {\n  to {\n    visibility: hidden;\n  }\n}\n\n/* ------------------------------------------------------------ composer -- */\n\n.dshsc-composerArea {\n  flex: none;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  padding: 8px 24px 20px;\n}\n\n.dshsc-composerBox {\n  max-width: 780px;\n  width: 100%;\n  margin: 0 auto;\n  display: flex;\n  align-items: flex-end;\n  gap: 8px;\n  padding: 10px 10px 10px 16px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 16px;\n  background: var(--dsw-alias-bg-layer-1);\n}\n\n.dshsc-composerBox:focus-within {\n  border-color: var(--dsw-alias-border-l3, var(--dsw-alias-border-l1));\n}\n\n.dshsc-input {\n  flex: 1;\n  min-width: 0;\n  border: 0;\n  outline: none;\n  resize: none;\n  background: transparent;\n  color: var(--dsw-alias-label-primary);\n  font: inherit;\n  font-size: 14px;\n  line-height: 1.5;\n  max-height: 200px;\n  padding: 4px 0;\n}\n\n.dshsc-input::placeholder {\n  color: var(--dsw-alias-label-dimmed);\n}\n\n.dshsc-sendButton,\n.dshsc-stopButton {\n  flex: none;\n  width: 32px;\n  height: 32px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border: 0;\n  border-radius: 50%;\n  cursor: pointer;\n}\n\n.dshsc-sendButton {\n  background: var(--dsw-alias-brand-primary);\n  color: var(--dsw-alias-bg-base);\n}\n\n.dshsc-sendButton:disabled {\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-dimmed);\n  cursor: default;\n}\n\n.dshsc-stopButton {\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-secondary);\n}\n\n.dshsc-stopButton:hover {\n  color: var(--dsw-alias-label-primary);\n}\n\n/* -------------------------------------------------------- model select --- */\n\n.dshsc-modelSelect {\n  position: relative;\n  max-width: 780px;\n  width: 100%;\n  margin: 0 auto;\n}\n\n.dshsc-modelSelectTrigger {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  max-width: 280px;\n  height: 26px;\n  padding: 0 8px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 8px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12.5px;\n  cursor: pointer;\n}\n\n.dshsc-modelSelectTrigger:hover,\n.dshsc-modelSelectTrigger:focus-visible {\n  background: var(--dsw-alias-interactive-bg-hover);\n  color: var(--dsw-alias-label-primary);\n}\n\n.dshsc-modelSelectTrigger:disabled {\n  color: var(--dsw-alias-label-dimmed);\n  cursor: default;\n}\n\n.dshsc-modelSelectLabel {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.dshsc-modelSelectChevron {\n  flex: none;\n  color: var(--dsw-alias-label-caption);\n}\n\n.dshsc-modelSelectOpen .dshsc-modelSelectChevron {\n  transform: rotate(180deg);\n}\n\n.dshsc-modelSelectMenu {\n  position: absolute;\n  bottom: calc(100% + 4px);\n  left: 24px;\n  max-height: 320px;\n  overflow-y: auto;\n  min-width: 220px;\n  padding: 6px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 12px;\n  background: var(--dsw-alias-bg-layer-1);\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);\n  z-index: 5;\n}\n\n.dshsc-modelSelectGroup + .dshsc-modelSelectGroup {\n  margin-top: 4px;\n  border-top: 1px solid var(--dsw-alias-border-l1);\n  padding-top: 4px;\n}\n\n.dshsc-modelSelectGroupName {\n  padding: 4px 8px;\n  color: var(--dsw-alias-label-caption);\n  font-size: 11.5px;\n  font-weight: 600;\n}\n\n.dshsc-modelSelectItem {\n  display: block;\n  width: 100%;\n  text-align: left;\n  padding: 6px 8px;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  cursor: pointer;\n}\n\n.dshsc-modelSelectItem:hover,\n.dshsc-modelSelectItem:focus-visible {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n\n.dshsc-modelSelectItemSelected {\n  color: var(--dsw-alias-brand-primary);\n  font-weight: 600;\n}\n\n@media (max-width: 720px) {\n  .dshsc-listCol {\n    width: 200px;\n  }\n}\n";
  document.head.appendChild(tag);
}

// src/client/index.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var inject = ["slots", "locale", "connection"];
function ChatOverlay({ t, chat, router, renderSlot }) {
  const pathname = (0, import_react8.useSyncExternalStore)(router.subscribe, router.getSnapshot);
  const active = parseRoute(pathname).view === "chat";
  (0, import_react8.useEffect)(() => {
    if (!active) return;
    const onKey = (event) => {
      if (event.key === "Escape") router.navigate("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, router]);
  if (!active) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshsc-overlay", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ChatPage, { t, chat, router, renderSlot }) });
}
function apply(ctx) {
  const router = new Router();
  const rpc = ctx.connection.rpc;
  const chat = new ChatStore(new ChatApi(rpc));
  ctx.effect(() => () => chat.dispose(), "standalone-chat: store");
  ctx.effect(() => ctx.locale.register(CHAT_LOCALE_NS, dictionaries), "standalone-chat: dictionaries");
  ctx.slots.inject(
    "sidebar.footer.action",
    () => ctx.slots.register(
      {
        name: "sidebar.footer.action",
        id: "standalone-chat",
        order: 10,
        label: () => ctx.locale.bind(CHAT_LOCALE_NS)("nav"),
        locale: CHAT_LOCALE_NS,
        inject: () => ({ router })
      },
      ChatNavAction
    )
  );
  ctx.slots.inject(
    "shell.overlay",
    () => ctx.slots.register(
      {
        name: "shell.overlay",
        id: "standalone-chat-page",
        order: 40,
        label: () => ctx.locale.bind(CHAT_LOCALE_NS)("title"),
        locale: CHAT_LOCALE_NS,
        inject: () => ({ chat, router }),
        // Declares the chat model seat: an optional slot-level inject face
        // (the directory adapter) is supplied to every occupant. Other
        // plugins (e.g. dsh-ui-model-selection-collapsible) register here.
        children: {
          "chat.input.model": {
            kind: "single",
            scope: "root",
            inject: {
              getDirectory: () => chat.getDirectoryStore(),
              load: () => {
                void chat.refreshModels();
              },
              select: (selection) => chat.selectModel(selection)
            }
          }
        }
      },
      ChatOverlay
    )
  );
}
return module.exports; } });
//# sourceMappingURL=client.js.map
