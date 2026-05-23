/**
 * IPC 处理器安全工具 — 白名单校验
 *
 * 所有 ipcMain.handle 注册必须通过 safeHandle，拒绝未列名的通道。
 */
import { ipcMain } from "electron";
import { logger } from "../core/utils.js";

/** 所有允许注册的 IPC 通道名 */
export const ALLOWED_CHANNELS = new Set([
  // ---- 聊天 ----
  "chat:send",
  "chat:load-history",
  "chat:export",
  "chat:regenerate",
  "chat:search",
  // ---- 窗口 ----
  "window:transition-to-chat",
  // ---- 设置 ----
  "settings:get-config",
  "settings:update-config",
  "settings:update-profile",
  // ---- 记忆 ----
  "memory:get-facts",
  "memory:update-fact",
  "memory:delete-fact",
  // ---- 反馈 ----
  "feedback:submit",
  // ---- 调查 ----
  "survey:submit",
  // ---- 应用状态 / 工具 ----
  "app:get-state",
  "app:get-mbti-types",
  "app:get-version",
  "app:pick-avatar",
  "app:get-avatar",
  "app:export-chat",
  "app:reset-data",
  "app:export-profile",
  "app:import-profile",
  "app:check-update",
  "app:download-update",
  "app:install-update",
  // ---- 设置向导 ----
  "setup:parse-description",
  "setup:import-card",
  "setup:save-profile",
  // ---- NapCatQQ ----
  "napcat:get-status",
  "napcat:start",
  "napcat:stop",
  // ---- WeChat ----
  "wechat:get-status",
  "wechat:start",
  "wechat:stop",
]);

/** 带白名单校验的 ipcMain.handle 包装 */
export function safeHandle(
  channel: string,
  listener: (...args: any[]) => any,
): void {
  if (!ALLOWED_CHANNELS.has(channel)) {
    logger.warn(`[SECURITY] Blocked registration of unlisted IPC channel: "${channel}"`);
    return;
  }
  ipcMain.handle(channel, listener);
}
