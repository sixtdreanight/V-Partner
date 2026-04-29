/**
 * 对话摘要引擎 — 压缩早期对话历史，解决 "lost in the middle" 问题
 *
 * 当对话轮次超过阈值时，将早期对话压缩为 150-200 字中文摘要，
 * 注入 system prompt Layer 2，让 AI 在关注最近对话的同时不丢失早期上下文。
 */

import type { ConversationTurn } from "./memory.js";
import { logger } from "./utils.js";

/**
 * 使用 AI model 从对话轮次中生成摘要
 * 聚焦：关键话题、用户提到的重要信息、情绪变化、决定/共识
 */
export async function generateConversationSummary(
  turns: ConversationTurn[],
  generateText: (prompt: string) => Promise<string>,
): Promise<string> {
  const conversationText = turns
    .map((t) => `[${t.role === "user" ? "用户" : "伴侣"}]: ${t.content}`)
    .join("\n");

  const prompt = `请将以下对话压缩为一段 150-200 字的中文摘要。
摘要需要覆盖：
- 聊了哪些关键话题（按时间顺序）
- 用户提到的个人信息或重要事件
- 用户明显的情绪变化
- 达成的共识或做的决定

对话:
${conversationText}

请直接输出摘要文本，不需要前缀或格式。`;

  try {
    const result = await generateText(prompt);
    return result.trim();
  } catch (err) {
    logger.warn("对话摘要生成失败:", err);
    return "";
  }
}

/** 将摘要格式化为注入 system prompt 的 XML 块 */
export function formatSummaryBlock(summary: string): string {
  if (!summary) return "";
  return [
    "<conversation_summary>",
    "以下是更早之前的对话摘要，帮助你记住之前聊过什么：",
    summary,
    "当对方提到'刚才说的那个''之前提到的'等回指词时，",
    "如果最近记录里找不到，就从这个摘要里找。",
    "</conversation_summary>",
    "",
  ].join("\n");
}
