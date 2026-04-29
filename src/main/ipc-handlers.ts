import { ipcMain, BrowserWindow, app, dialog } from "electron";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadProfile, loadConfig, initDataRoot, getDataRoot,
  writeEnvFile, writeFileAtomic,
  type AppConfig, type AIConfig, type QQConfig, type WeChatConfig,
} from "../core/config.js";
import { processMessage, createAIProvider } from "../core/pipeline.js";
import { loadShortTerm, removeLastTurn } from "../core/memory.js";
import { parseDescription } from "../cli/setup.js";
import { mkdirSync, existsSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { createRelationshipState } from "../core/relationship.js";
import { validateProfile } from "../core/safety.js";
import { napCatManager } from "./napcat-manager.js";
import { weChatManager } from "./wechat-manager.js";

let pipelineCtx: ReturnType<typeof createPipelineContext> | null = null;

function createPipelineContext() {
  const config = loadConfig();
  const profile = loadProfile();
  if (!profile) throw new Error("Profile not found");
  const model = createAIProvider(config.ai);
  return { model, config, profile };
}

function pipelineInvalidate() {
  pipelineCtx = null;
}

export function registerIpcHandlers() {
  // 初始化数据根目录 — 开发模式用项目目录，生产模式用 userData
  const isDev = !!process.env.ELECTRON_RENDERER_URL;
  const __dirname = fileURLToPath(new URL(".", import.meta.url));
  const dataRoot = isDev ? resolve(__dirname, "..", "..") : app.getPath("userData");
  initDataRoot(dataRoot);

  // 确保 data 目录存在
  const dataDir = resolve(getDataRoot(), "data");
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  const win = () => BrowserWindow.getAllWindows()[0] ?? null;

  // ---- 应用状态 ----
  ipcMain.handle("app:get-state", () => {
    const profile = loadProfile();
    return {
      hasProfile: !!profile,
      profile: profile ?? null,
      config: loadConfig(),
    };
  });

  // ---- 设置向导 ----
  ipcMain.handle("setup:parse-description", (_, desc: string) => {
    return parseDescription(desc);
  });

  ipcMain.handle("setup:save-profile", (_, data: Record<string, unknown>) => {
    try {
      const root = getDataRoot();
      const dDir = resolve(root, "data");
      if (!existsSync(dDir)) mkdirSync(dDir, { recursive: true });

      const profile = data.profile;
      if (!profile || typeof profile !== "object") {
        return { success: false, error: "profile 数据无效" };
      }

      // 内容审核
      const validation = validateProfile(profile as Record<string, unknown>);
      if (!validation.ok) {
        return { success: false, error: validation.errors[0] };
      }
      const relationshipMode = (profile as Record<string, string>).relationship_mode || "direct";

      const profilePath = resolve(dDir, "profile.json");
      writeFileAtomic(profilePath, JSON.stringify(profile, null, 2));

      // 验证写入：立即读回确认文件存在且内容非空
      if (!existsSync(profilePath)) {
        return { success: false, error: "profile.json 写入后验证失败：文件不存在" };
      }

      writeFileAtomic(
        resolve(dDir, "relationship.json"),
        JSON.stringify(createRelationshipState(relationshipMode as "direct" | "slow_burn"), null, 2),
      );

      // 持久化 AI / QQ / WeChat 配置到 .env
      const ai = data.ai as Record<string, string> | undefined;
      const qq = data.qq as Record<string, string> | undefined;
      const wechat = data.wechat as Record<string, string> | undefined;
      if (ai || qq || wechat) {
        writeEnvFile({
          ai: ai ? {
            provider: ai.provider as AIConfig["provider"],
            model: ai.model,
            apiKey: ai.apiKey,
            baseUrl: ai.baseUrl,
            maxTokens: ai.maxTokens as number | undefined,
            temperature: ai.temperature as number | undefined,
          } : undefined,
          qq: qq ? {
            wsUrl: qq.wsUrl,
            accessToken: qq.accessToken,
          } : undefined,
          wechat: wechat ? {
            baseUrl: wechat.baseUrl,
            fileUrl: wechat.fileUrl,
            token: wechat.token,
            appid: wechat.appid,
          } : undefined,
        });
      }

      // 延迟到首次聊天时初始化 pipeline，避免 setup 阶段因配置异常导致 IPC 卡死
      pipelineCtx = null;

      return { success: true };
    } catch (err) {
      return { success: false, error: `保存失败: ${err instanceof Error ? err.message : String(err)}` };
    }
  });

  // ---- 聊天 ----
  ipcMain.handle("chat:send", async (_, message: string) => {
    try {
      if (!pipelineCtx) pipelineCtx = createPipelineContext();
      const userId = "gui-user";
      const replies = await processMessage(userId, message, pipelineCtx);

      const w = win();
      if (w) {
        // 第一条前模拟打字延迟
        await new Promise(r => setTimeout(r, 800 + Math.random() * 1500));
        w.webContents.send("chat:reply-chunk", { index: 0, total: replies.length, text: replies[0] });
        for (let i = 1; i < replies.length; i++) {
          w.webContents.send("chat:typing", { active: true });
          await new Promise(r => setTimeout(r, 600 + Math.random() * 1000));
          w.webContents.send("chat:reply-chunk", { index: i, total: replies.length, text: replies[i] });
        }
      }

      return replies;
    } catch (err) {
      return [`抱歉，出了点问题: ${err instanceof Error ? err.message : "未知错误"}`];
    }
  });

  ipcMain.handle("chat:load-history", (_, limit?: number) => {
    return loadShortTerm("gui-user", limit ?? 24);
  });

  ipcMain.handle("chat:regenerate", async () => {
    try {
      const userId = "gui-user";
      const lastUserMsg = removeLastTurn(userId);
      if (!lastUserMsg) {
        return { success: false, error: "没有可重新生成的消息" };
      }
      if (!pipelineCtx) pipelineCtx = createPipelineContext();
      const replies = await processMessage(userId, lastUserMsg, pipelineCtx);

      const w = win();
      if (w) {
        await new Promise(r => setTimeout(r, 800 + Math.random() * 1500));
        w.webContents.send("chat:reply-chunk", { index: 0, total: replies.length, text: replies[0] });
        for (let i = 1; i < replies.length; i++) {
          w.webContents.send("chat:typing", { active: true });
          await new Promise(r => setTimeout(r, 600 + Math.random() * 1000));
          w.webContents.send("chat:reply-chunk", { index: i, total: replies.length, text: replies[i] });
        }
      }

      return { success: true, replies };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // ---- 窗口控制 ----
  ipcMain.handle("window:transition-to-chat", () => {
    const w = win();
    if (w) {
      w.setMinimumSize(700, 500);
      w.setResizable(true);
      w.setSize(900, 680, true);
    }
    return { success: true };
  });

  // ---- NapCatQQ ----
  // 将 manager 的状态变化推送到所有窗口
  napCatManager.onStateChange((state) => {
    for (const w of BrowserWindow.getAllWindows()) {
      w.webContents.send("napcat:status-changed", state);
    }
  });

  ipcMain.handle("napcat:get-status", () => {
    return napCatManager.getState();
  });

  ipcMain.handle("napcat:start", async () => {
    try {
      // 首次使用：自动下载安装
      if (!napCatManager.isInstalled()) {
        await napCatManager.install();
      }
      await napCatManager.start();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle("napcat:stop", () => {
    napCatManager.stop();
    return { success: true };
  });

  // ---- WeChat ----
  weChatManager.onStateChange((state) => {
    for (const w of BrowserWindow.getAllWindows()) {
      w.webContents.send("wechat:status-changed", state);
    }
  });

  ipcMain.handle("wechat:get-status", () => {
    return weChatManager.getState();
  });

  ipcMain.handle("wechat:start", async () => {
    try {
      await weChatManager.start();
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle("wechat:stop", async () => {
    try {
      await weChatManager.stop();
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // ---- 设置 ----
  ipcMain.handle("settings:get-config", () => {
    return loadConfig();
  });

  ipcMain.handle("settings:update-config", (_, partial: Record<string, unknown>) => {
    const ai = partial.ai as Record<string, string> | undefined;
    const qq = partial.qq as Record<string, string> | undefined;
    const wechat = partial.wechat as Record<string, string> | undefined;
    writeEnvFile({
      ai: ai ? {
        provider: ai.provider as AIConfig["provider"],
        model: ai.model,
        apiKey: ai.apiKey,
        baseUrl: ai.baseUrl,
      } : undefined,
      qq: qq ? {
        wsUrl: qq.wsUrl,
        accessToken: qq.accessToken,
      } : undefined,
      wechat: wechat ? {
        baseUrl: wechat.baseUrl,
        fileUrl: wechat.fileUrl,
        token: wechat.token,
        appid: wechat.appid,
      } : undefined,
    });
    pipelineInvalidate();
    return { success: true };
  });

  // 角色卡更新
  ipcMain.handle("settings:update-profile", (_, data: Record<string, unknown>) => {
    try {
      if (!data || typeof data !== "object") {
        return { success: false, error: "数据无效" };
      }

      // 加载现有 profile 并合并
      const existing = loadProfile();
      if (!existing) {
        return { success: false, error: "角色卡不存在" };
      }
      const merged = { ...existing, ...data };

      // 内容审核
      const validation = validateProfile(merged as Record<string, unknown>);
      if (!validation.ok) {
        return { success: false, error: validation.errors[0] };
      }

      const dDir = resolve(getDataRoot(), "data");
      const profilePath = resolve(dDir, "profile.json");
      writeFileAtomic(profilePath, JSON.stringify(merged, null, 2));
      pipelineInvalidate();
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // 问卷反馈
  ipcMain.handle("survey:submit", (_, data: { satisfaction: number; features: string[]; problems: string[]; missing: string; notes: string }) => {
    try {
      const feedbackDir = resolve(getDataRoot(), "data", "feedback");
      if (!existsSync(feedbackDir)) mkdirSync(feedbackDir, { recursive: true });

      const filename = `feedback-${Date.now()}.json`;
      const content = {
        ...data,
        platform: process.platform,
        version: app.getVersion(),
        time: new Date().toISOString(),
      };
      writeFileAtomic(resolve(feedbackDir, filename), JSON.stringify(content, null, 2));
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // ---- 头像上传 ----
  ipcMain.handle("app:pick-avatar", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "图片", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const data = readFileSync(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() || "png";
    const mime = ext === "jpg" ? "jpeg" : ext;
    const base64 = `data:image/${mime};base64,${data.toString("base64")}`;
    // persist to data/avatar
    const dataDir = resolve(getDataRoot(), "data");
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    writeFileSync(resolve(dataDir, "avatar"), base64, "utf-8");
    return base64;
  });

  ipcMain.handle("app:get-avatar", () => {
    const avatarPath = resolve(getDataRoot(), "data", "avatar");
    if (existsSync(avatarPath)) {
      return readFileSync(avatarPath, "utf-8");
    }
    return null;
  });

  // ---- 版本 ----
  ipcMain.handle("app:get-version", () => {
    return app.getVersion();
  });

  // ---- 角色卡导入导出 ----
  ipcMain.handle("app:export-profile", async () => {
    try {
      const profilePath = resolve(getDataRoot(), "data", "profile.json");
      if (!existsSync(profilePath)) {
        return { success: false, error: "角色卡不存在" };
      }
      const result = await dialog.showSaveDialog({
        defaultPath: "profile.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (result.canceled) return { success: false, error: "已取消" };
      const data = readFileSync(profilePath, "utf-8");
      writeFileSync(result.filePath!, data, "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle("app:import-profile", async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: "已取消" };
      }
      const raw = readFileSync(result.filePaths[0], "utf-8");
      const data = JSON.parse(raw);
      // 验证基本结构
      if (!data.name || !data.relationship_type) {
        return { success: false, error: "文件格式不正确，缺少必要字段（name、relationship_type）" };
      }
      // 内容审核
      const validation = validateProfile(data as Record<string, unknown>);
      if (!validation.ok) {
        return { success: false, error: validation.errors[0] };
      }
      const dDir = resolve(getDataRoot(), "data");
      if (!existsSync(dDir)) mkdirSync(dDir, { recursive: true });
      writeFileAtomic(resolve(dDir, "profile.json"), raw);
      pipelineInvalidate();
      return { success: true };
    } catch (err) {
      return { success: false, error: `导入失败: ${String(err)}` };
    }
  });

  // ---- 聊天记录导出 ----
  ipcMain.handle("app:export-chat", async (_, format: "json" | "txt") => {
    try {
      const history = loadShortTerm("gui-user", 1000);
      const ext = format === "json" ? "json" : "txt";
      const result = await dialog.showSaveDialog({
        defaultPath: `chat-history.${ext}`,
        filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
      });
      if (result.canceled) return { success: false, error: "已取消" };
      if (format === "json") {
        writeFileSync(result.filePath!, JSON.stringify(history, null, 2), "utf-8");
      } else {
        const lines = history.map(
          (t) => `[${t.role === "user" ? "用户" : "伴侣"}] ${new Date(t.timestamp).toLocaleString("zh-CN")}\n${t.content}\n`
        );
        writeFileSync(result.filePath!, lines.join("\n"), "utf-8");
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // ---- 重置所有数据 ----
  ipcMain.handle("app:reset-data", async () => {
    try {
      const dataRoot = getDataRoot();
      const dataDir = resolve(dataRoot, "data");
      const envPath = resolve(dataRoot, ".env");
      if (existsSync(dataDir)) rmSync(dataDir, { recursive: true, force: true });
      if (existsSync(envPath)) rmSync(envPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // ---- 自动启动已配置的服务 ----
  const profile = loadProfile();
  if (profile) {
    const config = loadConfig();
    if (config.qq.wsUrl && config.qq.accessToken) {
      try {
        napCatManager.start().catch((err) => {
          console.error("NapCatQQ auto-start failed:", err);
        });
      } catch (err) {
        console.error("NapCatQQ auto-start failed:", err);
      }
    }
    if (config.wechat.baseUrl) {
      weChatManager.checkStatus().then(() => {
        if (weChatManager.getState().status === "stopped") {
          weChatManager.start().catch(() => {});
        }
      });
    }
  }
}
