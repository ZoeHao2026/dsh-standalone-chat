# DSH Standalone Chat

为 DeepSeek Harness（DSH）Web 界面新增一个独立、轻量的聊天功能：多轮对话、流式输出、对话历史、自动标题、重命名与删除，与 DSH 的 Agent 会话/工作区完全解耦。

Adds a standalone lightweight Chat to the DeepSeek Harness (DSH) Web GUI: multi-turn conversations with streaming output, history, automatic titles, rename and delete — fully decoupled from DSH agent sessions and workspaces.

## 功能

- 主导航新增独立 Chat 入口（侧栏底部行动区），页面路由为 `/chat` 与 `/chat/:conversationId`，可直接刷新/直达。
- 多轮对话 + 逐 token 流式输出（SSE），reasoning 思考过程折叠展示。
- 对话历史列表：新建、自动标题（取自首条消息）、重命名（固定标题）、删除。
- 每个对话可独立选择模型（按供应商分组的模型下拉），未选择时使用 DSH 默认模型。
- Markdown / 代码块渲染复用 DSH 官方 `MarkdownText` 组件，界面沿用 DSH 设计令牌。
- 普通聊天 `project_id = null`（DSH 中即"不绑定任何 Session/Workspace"）：请求**不含**系统提示词、工具、技能、AGENTS.md 或工作区/cwd 上下文。
- 对话持久化于 `~/.dsh/storages/chat.json`，不进入 DSH 会话/工作区列表。
- 提供中/英双语界面，跟随 DSH 当前语言设置。

## 模型选择

在聊天输入框上方的模型下拉中，按供应商分组列出当前可用的模型（通过 `ctx.llm.listProviders()` / `listModels()` 获取）：

- 尚未开始对话时选择模型：将作为该对话的初始模型。
- 对话中切换模型：立即持久化，后续消息使用新模型。
- 不做任何选择时，回退到 DSH 的默认模型（`agentDefaultModel`）。

## 兼容性

当前经过完整验证的基线是 DSH `0.1.0-rc.7`、Web 平台和 Node.js 22 或更高版本。DSH 仍处于开发预览阶段；升级 DSH 后，请先重新运行类型、测试、bundle 和浏览器冒烟验证。

## 从 GitHub 安装

在 PowerShell 中运行：

```powershell
$dshBin = Join-Path $env:USERPROFILE '.dsh\profiles\node_modules\@deepseek-ai\dsh\lib\bin.js'
node $dshBin plugin --profile web add 'https://github.com/ZoeHao2026/dsh-standalone-chat.git'
```

安装完成后重启 DSH，并在浏览器中执行一次硬刷新。插件包名保持为 `@local/dsh-standalone-chat`，与本地配置约定一致。

## 卸载

```powershell
$dshBin = Join-Path $env:USERPROFILE '.dsh\profiles\node_modules\@deepseek-ai\dsh\lib\bin.js'
node $dshBin plugin --profile web remove '@local/dsh-standalone-chat'
```

卸载后重启 DSH。已保存的对话数据保留在 `~/.dsh/storages/chat.json`，不会被删除。

## 本地开发

```powershell
git clone https://github.com/ZoeHao2026/dsh-standalone-chat.git
Set-Location dsh-standalone-chat
pnpm install --frozen-lockfile
pnpm run verify

$dshBin = Join-Path $env:USERPROFILE '.dsh\profiles\node_modules\@deepseek-ai\dsh\lib\bin.js'
$sourceRoot = (Get-Location).Path
node $dshBin plugin --profile web add "link:$sourceRoot"
```

`pnpm run verify` 会依次执行 TypeScript 类型检查、Vitest/jsdom 测试、bundle 构建和真实 lazy-CJS/apply 冒烟测试。仓库提交 `lib/` 构建产物，保证克隆即可安装运行。

## 设计边界

- 宿主端通过独立 RPC 通道 `/chatrpc` 提供服务（`/api` 通道的 interceptor 槽位由官方 Typert 网关独占），流式输出走专属 SSE 路由 `/api/chat/events`。
- 生成请求由 `ctx.llm.stream()` 直接调用，消息数组手工构造，**不传** `system`/`tools`，不创建 DSH Session、不绑定工作区，因此不存在 Agent 上下文注入的可能。
- 客户端通过 `sidebar.footer.action` 与 `shell.overlay` 两个可追加槽位挂载，不遮蔽、不替换任何官方席位；不新增命令、不修改官方包、不注册官方 locale 命名空间。
- 不修改 DSH 官方插件、模型选择 RPC 或会话持久化格式。

## 项目状态

这是独立的社区插件，并非 DeepSeek 官方项目。仓库通过 GitHub 的 `dsh-plugin` topic 加入 DSH 官方推荐的社区插件发现机制。

## 许可证

插件代码采用 MIT License。基于 DeepSeek Harness 生态构建（调用 `@deepseek-ai/dsh-*` 运行时服务并复用其设计令牌与 `MarkdownText` 组件）；完整归属与第三方许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和 [LICENSES](LICENSES)。
