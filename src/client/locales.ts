import type { LocaleDictOf, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'

export const CHAT_LOCALE_NS = 'standaloneChat'

/** Framework-injected translate seat narrowed to this plugin's dictionary. */
export type ChatT = TranslateNS<typeof CHAT_LOCALE_NS>

export const en = {
  nav: 'Chat',
  title: 'Chat',
  newChat: 'New chat',
  close: 'Back to sessions',
  untitled: 'New chat',
  heroTitle: 'Chat with a model',
  heroHint: 'A lightweight conversation without workspace files, tools, or agent instructions.',
  inputPlaceholder: 'Type a message…',
  send: 'Send',
  stop: 'Stop',
  rename: 'Rename',
  delete: 'Delete',
  deleteConfirm: 'Delete this conversation? This cannot be undone.',
  renamePlaceholder: 'Conversation title',
  empty: 'No conversations yet',
  reasoning: 'Thinking',
  errorPrefix: 'Something went wrong',
  dismiss: 'Dismiss',
  defaultModel: 'Default model',
} as const

export type ChatLocaleKey = keyof typeof en

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    standaloneChat: ChatLocaleKey
  }
}

export const zh: LocaleDictOf<typeof CHAT_LOCALE_NS> = {
  nav: '聊天',
  title: '聊天',
  newChat: '新对话',
  close: '返回会话',
  untitled: '新对话',
  heroTitle: '与模型对话',
  heroHint: '轻量级对话，不加载工作区文件、工具或 Agent 指令。',
  inputPlaceholder: '输入消息…',
  send: '发送',
  stop: '停止',
  rename: '重命名',
  delete: '删除',
  deleteConfirm: '确定删除该对话吗？此操作无法撤销。',
  renamePlaceholder: '对话标题',
  empty: '暂无对话',
  reasoning: '思考过程',
  errorPrefix: '出错了',
  dismiss: '关闭',
  defaultModel: '默认模型',
}

export const dictionaries = { zh, en } satisfies Record<'zh' | 'en', LocaleDictOf<typeof CHAT_LOCALE_NS>>
