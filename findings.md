# Code Review Findings — Yumema v0.1.0

Full codebase review covering security, bugs, architecture, performance, and code quality.

---

## Security

### 🔴 [blocking] API Key 明文存储在 .env 文件
**文件:** `src/core/config.ts:146-196`
API Key 以明文写入 `.env` 文件并直接加载到 `process.env`。任何能读取进程环境的 Electron 应用/扩展都可获取。建议：使用 `safeStorage` API (`electron`) 加密存储敏感凭证。
**影响:** build 输出会将 .env 内容写入内存，xss 途径泄露 `process.env` 风险。

### 🔴 [blocking] preload.ts IPC 通道未做白名单校验
**文件:** `src/main/preload.ts:84-100`
`on()` 方法校验了 push event channel，但 `invoke` 调用（`sendMessage`, `saveProfile` 等）**没有做 ipc 通道白名单**。渲染进程可调用任意 `ipcRenderer.invoke("any:channel")` 来触发主进程 handler（只要存在）。当前虽有 `contextIsolation: true` 但缺少 invoke 通道白名单校验。
**建议:** 在 preload 中为 invoke 也做 `validChannels` 过滤。

### 🟡 [important] CSP hash 硬编码，preload 变更会静默失败
**文件:** `src/main/index.ts:129-139`
CSP `script-src` 包含硬编码的 SHA256 hash `'sha256-0vhENBDiXt7C/5mQpX0pintncSH8cMav2aVDGcEhUZk='`。若 preload 脚本内容变更，CSP 会拦截所有 inline script，导致白屏。需同步更新 hash。
**建议:** 构建时动态计算 hash 或使用 nonce 机制。

### 🟡 [important] memory:update-fact 和 memory:delete-fact 绕过了 domain 函数
**文件:** `src/main/ipc-handlers.ts:332-382`
这两个 handler 直接在 IPC 层操作 `loadLongTerm()` 和 `writeFileAtomic()`，复制了 `memory.ts` 中的逻辑。绕过了 `updateFact()` 中应有的验证和业务逻辑。
**建议:** 复用 `memory.ts` 中的 `updateFact`/`adjustFactImportance` 而不是重写。

### 🟢 [nit] WeChat/QQ token 通过 HTTP 传递
**文件:** `src/adapters/onebot.ts`, `src/adapters/wechat.ts`
Token 通过 HTTP header/body 发送到 localhost 服务，风险较低但值得注意。Gewechat 的 token 在 HTTP body 中明文传输。

---

## Bugs

### 🔴 [blocking] saveShortTerm: JSON 字节级拼接可能损坏文件
**文件:** `src/core/memory.ts:100-117`
```ts
const cutoff = lastBytes.length - (lastBytes.length - trimmed.length) - 1;
const prefix = lastBytes.slice(0, cutoff);
```
该逻辑试图用字符串操作找到文件末尾的 `]` 并截断后追加新条目。但这个算法只在 `trimmed` == `lastBytes`（文件无末尾空白字符）时正确。如果文件末尾有换行或空白，`cutoff` 计算会错误。
**场景:** 两次写入之间文件末尾空白字符不同 → cutoff 指错位置 → JSON 损坏。
**建议:** 用 `loadShortTerm(userId, 9999)` 全量加载并重写，或使用 JSONL 格式避免解析整个文件。

### 🟡 [important] setup.ts hobbyMatches 正则逻辑错误
**文件:** `src/cli/setup.ts:92`
Regex `/[喜欢爱](画\S*|猫|狗|咖啡|...)` 中 `[喜欢爱]` 匹配一个字符，但 `matchAll` 只取 `m[1]`（捕获组），丢失了指示词。且字符类 `[喜欢爱]` 匹配"喜"后，下一个字符可能是"欢"而非目标词，导致匹配失败。
**示例:** "喜欢画画" → 不匹配（"喜"匹配后，"欢" ∉ 捕获组），"爱画画" → 匹配 "画画"。

### 🟡 [important] napcat-manager install() 写入 .env 使用了硬编码 userData 路径
**文件:** `src/main/napcat-manager.ts:344`
```ts
const envPath = join(app.getPath("userData"), ".env");
```
但 `main/index.ts:147` 中 dev 模式的 dataRoot 是项目根目录。dev 模式下 NapCat 安装后 `.env` 会写到 userData 位置而非项目根目录，导致配置不生效。
**建议:** 使用 `getDataRoot()` 替代 `app.getPath("userData")`。

### 🟡 [important] writeEnvFile regex 键名未转义
**文件:** `src/core/config.ts:159`
```ts
const re = new RegExp(`^${key}=.*`, "m");
```
如果环境变量键名包含正则特殊字符（当前键名如 `AI_BASE_URL` 是安全的），但带扩展键名会出错。作为防御性编程应做转义。

### 🟢 [nit] wechat-manager 类型不匹配
**文件:** `src/main/wechat-manager.ts:79, 201, 212`
`monitorTimer` 声明为 `ReturnType<typeof setTimeout> | null`，但实际使用 `setInterval`，返回值类型为 `ReturnType<typeof setInterval>`。Node.js 中两者同为 `NodeJS.Timeout` 故不会出错，但 TypeScript 严格模式下可能报错。

### 🟢 [nit] cleanupSessions 的 TTL 淘汰可能漏删
**文件:** `src/core/pipeline.ts:41-55`
如果 `lastActive` Map 中有孤立的 entry（对应的 `summaryStates` entry 已被外部删除），不会被清理。当前代码中不会出现此情况，但如果未来独立操作这两个 Map 则可能泄露。

### 🟢 [nit] postprocess.ts 简易正则提取 topic 字段偏短
**文件:** `src/core/stages/postprocess.ts:80`
```ts
updateFact(match[0].slice(0, 2), match[0]);
```
`topic` 仅取前2个字符，对于中文这是一两个汉字，可能导致 topic 不具辨识度（如 "我是"）。

---

## Architecture & Design

### 🟡 [important] IPC handlers 文件过大 (650+ 行)
**文件:** `src/main/ipc-handlers.ts`
所有 IPC handler 集中在一个文件，包含: app state, setup wizard, chat, export, napcat, wechat, settings, memory, survey, feedback, avatar, version, profile import/export, chat export, data reset, auto-start。职责过多。
**建议:** 拆分为 `handlers/chat.ts`, `handlers/setup.ts`, `handlers/memory.ts`, `handlers/settings.ts`。

### 🟡 [important] "gui-user" 硬编码在多处
**文件:** `src/main/ipc-handlers.ts`, `src/main/index.ts:170`
字符串 `"gui-user"` 出现在至少 4 处。应定义为常量 `GUI_USER_ID`。

### 🟡 [important] 没有单元测试
整个项目没有任何测试文件 (`.test.ts` or `__tests__/`)。核心模块 (`safety.ts`, `memory.ts`, `relationship.ts`, `split.ts`, `semantic.ts`, `config.ts`) 都是纯逻辑，非常适合单元测试。

### 💡 [suggestion] 缺少流式输出支持
**文件:** `src/core/stages/generation.ts`
`generateText` (无 streaming) → 整个回复生成完成后才推送到渲染进程。UI 通过 `setTimeout` 模拟打字延迟（`ipc-handlers.ts:173-178`），但这并不能让用户感知到真正的流式输出。
**建议:** 使用 AI SDK 的 `streamText` API 实现真正的逐字输出。

### 💡 [suggestion] 重复的时区处理逻辑
**文件:** `src/core/girlfriend.ts:110-121, 163-168`
`buildTimeContext()` 和 `buildSensoryContext()` 都有相同的时区 Date 创建逻辑。提取为共享函数。

### 💡 [suggestion] updateSession 副作用函数
**文件:** `src/core/girlfriend.ts:525-535`
`updateSession()` 直接修改传入的 `SessionState` 对象（副作用），且返回同一引用。不符合 pipeline 的纯函数模式。应返回新对象 `{ ...session, ...newValues }`。

---

## Performance

### 🟡 [important] 每条消息都全量读取对话历史文件
**文件:** `src/core/memory.ts:62-81, 100-117`
`loadShortTerm()` 和 `saveShortTerm()` 每条消息都读写整个对话历史 JSON 文件。对话越长（1000+ 轮），磁盘 I/O 开销越大。`saveShortTerm` 试图用字节级追加优化，但实际上仍读取了整个文件。
**建议:** 使用 SQLite 或 JSONL 格式按行追加，避免 O(n) 全量读写。

### 💡 [suggestion] LLM 事实提取在主线程同步触发
**文件:** `src/core/stages/postprocess.ts:30-43`
每 `longTermExtractInterval` 轮（默认 20 轮），pipeline 在 postprocess 阶段同步等待 LLM 调用来提取事实。这会在每 20 轮时增加数秒延迟。
**建议:** 将事实提取改为 fire-and-forget 后台任务。

---

## Code Quality

### 🎉 [praise]

- **Layer isolation 执行得很好** — `src/core/` 完全不依赖 Electron 或浏览器 API
- **TypeScript 类型使用充分** — 接口定义清晰，zod 用于边界验证
- **Atomic file writes** — `writeFileAtomic()` 防止崩溃时文件损坏
- **内容安全设计周到** — 三层安全防御（input → system prompt → output）
- **记忆系统设计精细** — 三维评分 (relevance + recency + importance)、遗忘曲线、重要性反馈
- **CSP 配置合理** — 生产环境限制了资源加载来源
- **IPC 错误处理一致** — 始终返回 `{ success, error }` 格式

### 📚 [learning]

- `conversation_rules` XML 标签格式在系统提示词中很有创意——结构化自然语言的混合体
- `Author's Note` 放在提示词末尾利用 recency bias 是好的 prompt engineering 实践

### Total Summary

| 严重度 | 数量 |
|--------|------|
| 🔴 blocking | 2 |
| 🟡 important | 7 |
| 🟢 nit | 4 |
| 💡 suggestion | 5 |
| 🎉 praise | 7 |
| 📚 learning | 2 |
