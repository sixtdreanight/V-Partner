/**
 * Chat + Memory IPC handlers
 */
import { BrowserWindow, dialog } from "electron";
import { safeHandle } from "../handler-utils.js";
import { processMessage, createAIProvider } from "@sleepnight/companion-core";
import { loadConfig, loadProfile, getDataRoot } from "@sleepnight/companion-core";
import { logger, GUI_USER_ID } from "@sleepnight/companion-core";
import { loadShortTerm, removeLastTurn } from "@sleepnight/companion-core";
import { memoryFactSchema, feedbackSchema } from "../../shared/ipc-schemas.js";
import { saveFeedback } from "@sleepnight/companion-core";
import type { LanguageModel } from "ai";

let pipelineCtx: { model: LanguageModel; config: ReturnType<typeof loadConfig>; profile: ReturnType<typeof loadProfile> } | null = null;

function createPipelineContext() {
  const config = loadConfig();
  const profile = loadProfile();
  if (!profile) throw new Error("Profile not found");
  const model = createAIProvider(config.ai);
  return { model, config, profile };
}

export function pipelineInvalidate() {
  pipelineCtx = null;
}

function win() { return BrowserWindow.getAllWindows()[0] ?? null; }

export function registerChatHandlers() {
  // ---- 聊天 ----
  safeHandle("chat:send", async (_, message: string) => {
    try {
      if (!pipelineCtx) pipelineCtx = createPipelineContext();
      const replies = await processMessage(GUI_USER_ID, message, pipelineCtx);

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

      return { success: true, data: { replies } };
    } catch (err) {
      const errorText = `抱歉，出了点问题: ${err instanceof Error ? err.message : "未知错误"}`;
      const w = win();
      if (w) {
        w.webContents.send("chat:reply-chunk", { index: 0, total: 1, text: errorText });
      }
      return { success: false, error: String(err) };
    }
  });

  safeHandle("chat:load-history", (_, limit?: number) => {
    return loadShortTerm(GUI_USER_ID, limit ?? 24);
  });

  safeHandle("chat:export", async (_, format: "txt" | "md") => {
    try {
      const w = win();
      if (!w) return { success: false, error: "无窗口" };
      const { exportToTXT, exportToMarkdown } = await import("@sleepnight/companion-core");
      const profile = loadProfile();
      const content = format === "md"
        ? exportToMarkdown(GUI_USER_ID, profile)
        : exportToTXT(GUI_USER_ID, profile);
      const ext = format === "md" ? "md" : "txt";
      const result = await dialog.showSaveDialog(w, {
        title: "导出聊天记录",
        defaultPath: `yumema-chat-${Date.now()}.${ext}`,
        filters: [
          { name: ext === "md" ? "Markdown" : "文本文件", extensions: [ext] },
        ],
      });
      if (result.canceled || !result.filePath) {
        return { success: false, error: "已取消" };
      }
      const { writeFileSync } = await import("node:fs");
      writeFileSync(result.filePath, content, "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, error: `导出失败: ${err instanceof Error ? err.message : String(err)}` };
    }
  });

  safeHandle("chat:regenerate", async () => {
    try {
      const lastUserMsg = removeLastTurn(GUI_USER_ID);
      if (!lastUserMsg) {
        return { success: false, error: "没有可重新生成的消息" };
      }
      if (!pipelineCtx) pipelineCtx = createPipelineContext();
      const replies = await processMessage(GUI_USER_ID, lastUserMsg, pipelineCtx);

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

  safeHandle("chat:search", async (_, query: string) => {
    const { searchConversations } = await import("@sleepnight/companion-core");
    return searchConversations(query);
  });

  // ---- 记忆 ----
  safeHandle("memory:get-facts", async () => {
    const { loadLongTerm } = await import("@sleepnight/companion-core");
    return loadLongTerm().facts;
  });

  safeHandle("memory:update-fact", async (_, raw: unknown) => {
    try {
      const parsed = memoryFactSchema.safeParse(raw);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
      }
      const fact = parsed.data;
      const { loadLongTerm, updateFact, adjustFactImportance } = await import("@sleepnight/companion-core");
      const memory = loadLongTerm();
      const exists = memory.facts.some((f) => f.topic === fact.topic);
      if (exists) {
        adjustFactImportance(fact.topic, 0, fact.content);
      } else {
        updateFact(fact.topic, fact.content);
      }
      return { success: true, data: loadLongTerm().facts };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  safeHandle("memory:delete-fact", async (_, topic: string) => {
    try {
      const { deleteFact, loadLongTerm } = await import("@sleepnight/companion-core");
      deleteFact(topic);
      return { success: true, data: loadLongTerm().facts };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // ---- 消息反馈 ----
  safeHandle("feedback:submit", async (_, raw: unknown) => {
    try {
      const parsed = feedbackSchema.safeParse(raw);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
      }
      saveFeedback(GUI_USER_ID, {
        ...parsed.data,
        timestamp: new Date().toISOString(),
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // ---- 窗口控制 ----
  safeHandle("window:transition-to-chat", () => {
    const w = win();
    if (w) {
      w.setMinimumSize(700, 500);
      w.setResizable(true);
      w.setSize(900, 680, true);
    }
    return { success: true };
  });
}
