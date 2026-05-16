import { contextBridge, ipcRenderer } from "electron";

const VALID_INVOKE_CHANNELS = [
  "app:get-state",
  "app:get-mbti-types",
  "app:get-version",
  "app:check-update",
  "app:download-update",
  "app:install-update",
  "app:pick-avatar",
  "app:get-avatar",
  "app:export-profile",
  "app:import-profile",
  "app:export-chat",
  "app:reset-data",
  "setup:parse-description",
  "setup:save-profile",
  "setup:import-card",
  "chat:send",
  "chat:load-history",
  "chat:regenerate",
  "chat:search",
  "window:transition-to-chat",
  "napcat:get-status",
  "napcat:start",
  "napcat:stop",
  "wechat:get-status",
  "wechat:start",
  "wechat:stop",
  "settings:get-config",
  "settings:update-config",
  "settings:update-profile",
  "memory:get-facts",
  "memory:update-fact",
  "memory:delete-fact",
  "survey:submit",
  "feedback:submit",
];

const VALID_ON_CHANNELS = [
  "napcat:status-changed",
  "napcat:qr-ready",
  "wechat:status-changed",
  "chat:reply-chunk",
  "chat:typing",
  "app:update-status",
];

function safeInvoke(channel: string, ...args: unknown[]) {
  if (!VALID_INVOKE_CHANNELS.includes(channel)) {
    return Promise.reject(new Error(`Blocked invoke on unlisted channel: ${channel}`));
  }
  return ipcRenderer.invoke(channel, ...args);
}

/** 提供给渲染进程的类型安全 API */
const api = {
  // 应用状态
  getState: () => safeInvoke("app:get-state"),
  getPlatform: () => process.platform,

  // 设置向导
  parseDescription: (desc: string) =>
    safeInvoke("setup:parse-description", desc),
  saveProfile: (data: Record<string, unknown>) =>
    safeInvoke("setup:save-profile", data),
  importCard: () =>
    safeInvoke("setup:import-card"),
  getMBTITypes: () =>
    safeInvoke("app:get-mbti-types"),
  getMemoryFacts: () =>
    safeInvoke("memory:get-facts"),
  updateMemoryFact: (fact: { topic: string; content: string }) =>
    safeInvoke("memory:update-fact", fact),
  deleteMemoryFact: (topic: string) =>
    safeInvoke("memory:delete-fact", topic),
  searchChat: (query: string) =>
    safeInvoke("chat:search", query),

  // 聊天
  sendMessage: (message: string) =>
    safeInvoke("chat:send", message),
  loadHistory: (limit?: number) =>
    safeInvoke("chat:load-history", limit),
  regenerateLast: () =>
    safeInvoke("chat:regenerate"),

  // 窗口控制
  transitionToChat: () => safeInvoke("window:transition-to-chat"),

  // NapCatQQ
  getNapCatStatus: () => safeInvoke("napcat:get-status"),
  startNapCat: () => safeInvoke("napcat:start"),
  stopNapCat: () => safeInvoke("napcat:stop"),

  // WeChat
  getWeChatStatus: () => safeInvoke("wechat:get-status"),
  startWeChat: () => safeInvoke("wechat:start"),
  stopWeChat: () => safeInvoke("wechat:stop"),

  // 设置
  getConfig: () => safeInvoke("settings:get-config"),
  updateConfig: (config: Record<string, unknown>) =>
    safeInvoke("settings:update-config", config),
  updateProfile: (data: Record<string, unknown>) =>
    safeInvoke("settings:update-profile", data),
  submitSurvey: (data: { satisfaction: number; features: string[]; problems: string[]; missing: string; notes: string }) =>
    safeInvoke("survey:submit", data),

  // 头像
  pickAvatar: () => safeInvoke("app:pick-avatar"),
  getAvatar: () => safeInvoke("app:get-avatar"),

  // 版本
  getVersion: () => safeInvoke("app:get-version"),

  // 角色卡导入导出
  exportProfile: () => safeInvoke("app:export-profile"),
  importProfile: () => safeInvoke("app:import-profile"),

  // 聊天记录导出
  exportChat: (format: "json" | "txt" | "md") => safeInvoke("app:export-chat", format),

  // 消息反馈
  submitFeedback: (data: { type: string; userMessage: string; aiReply: string; correctionText?: string }) =>
    safeInvoke("feedback:submit", data),

  // 重置数据
  resetAllData: () => safeInvoke("app:reset-data"),

  // 自动更新
  checkUpdate: () => safeInvoke("app:check-update"),
  downloadUpdate: () => safeInvoke("app:download-update"),
  installUpdate: () => safeInvoke("app:install-update"),

  // 监听主进程推送事件
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    if (VALID_ON_CHANNELS.includes(channel)) {
      const listener = (_: Electron.IpcRendererEvent, ...args: unknown[]) =>
        callback(...args);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    }
    return () => {};
  },
};

contextBridge.exposeInMainWorld("api", api);

export type VPapi = typeof api;
