# Changelog

## v1.0.0-beta.4 (2026-04-28)

### Bug 修复
- 修复 `electron-updater` named import 导致的运行时崩溃 — CJS 模块在 ESM 上下文加载失败
- 修复 `hardenedRuntime: true` 导致 ad-hoc 签名校验失败，arm64 启动即 SIGABRT 崩溃
- 全量 ESM/CJS 兼容性审计通过，无同类隐患

---

## v1.0.0-beta.3 (2026-04-28)

### Bug 修复
- 移除未使用的 `lchwxbot` 依赖，修复 `better-sqlite3` 原生模块与 Electron 41 V8 API 不兼容导致打包失败的问题
- 修复 `scripts/notarize.js` ESM/CJS 冲突，重命名为 `.cjs`

### 打包验证
- 本地 `package:mac` 通过，产出 x64 + arm64 双架构 `.dmg` 和 `.zip`

---

## v1.0.0-beta.2 (2026-04-28)

### Bug 修复
- **P0** 修复 preload 文件名不匹配导致 release 包 `window.api` 不可用
- **P0** 修复 `electron-builder.yml` publish 配置错误，自动更新不可用
- **P0** 修复设置向导完成后应用卡死 — defer pipeline 初始化到首次聊天，添加文件写入验证
- **P0** 添加 ErrorBoundary 捕获渲染错误，transition 超时 10s 显示重试按钮

### UI 重构
- 聊天界面 IM 风格重新设计：不对称圆角、气泡尾翼、渐变用户气泡
- 消息列表时间分组：今天/昨天/日期分割线
- 输入区域仿 Telegram 风格，添加表情/附件占位按钮
- 新增 IM 专用 CSS 设计令牌（`--vp-bubble-*`、`--vp-bg-chat`）
- 更新 UpdateToast 使用设计令牌替换硬编码色值

### CI/CD
- 新增 GitHub Actions 自动发布工作流（`.github/workflows/release.yml`）
- 推送 `v*` 标签自动构建 macOS / Windows / Linux 三平台并发布到 Releases

### 其他
- 移除 scheduler 中无操作的兴趣学习 cron 任务
- WeChat 适配器添加 `onQRCode` 回调支持
- 新增 `docs/CHANGELOG.md`，更新 README / 架构 / 开发文档

---

## v1.0.0-beta.1 (2026-04-26)

### 新功能
- 桌面应用支持 macOS / Windows / Linux 三平台
- 14 步设置向导，引导完成 AI 伴侣配置
- 应用内即时聊天
- QQ 机器人接入（NapCatQQ OneBot v11），应用内一键下载启动
- 微信机器人接入（Gewechat Docker），应用内一键启动容器
- 多 AI 后端支持（Anthropic Claude / OpenAI / OpenAI 兼容）
- AI 伴侣人格系统：年龄、职业、爱好、性格、说话风格
- 时间感知：早晚问候、周末/节日主动话题
- 记忆系统：常聊话题加强，不常提的逐渐衰减
- 关系养成：直接情侣 / 慢热培养两种模式
- 安全过滤：敏感内容过滤、隐私保护
- 自动更新：基于 GitHub Releases 的 electron-updater
- 内置测试问卷：帮助产品持续改进
- 暗色模式：跟随系统自动切换

### 已知问题
- macOS App Store QQ 阻止 LiteLoader 注入，NapCatQQ 在 macOS 上不可用，需用 Windows
- 微信适配需要预装 Docker 环境
- 头像/表情/附件功能尚未实现（UI 占位已就绪）
- 安全过滤规则较简单，需持续完善
