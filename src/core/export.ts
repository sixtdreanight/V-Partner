/**
 * 聊天记录导出
 * 支持 TXT 和 Markdown 格式
 */

import { loadShortTerm } from "./memory.js";
import type { Profile } from "./config.js";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function exportToTXT(userId: string, profile?: Profile | null): string {
  const history = loadShortTerm(userId, 9999);
  const lines: string[] = [];
  const partnerName = profile?.name || "TA";

  lines.push(`=== 梦间 Yumema 聊天记录 ===`);
  lines.push(`对方: ${partnerName}`);
  lines.push(`导出时间: ${new Date().toLocaleString("zh-CN")}`);
  lines.push("=".repeat(40));
  lines.push("");

  for (const turn of history) {
    const name = turn.role === "user"
      ? (profile?.user_nickname || "你")
      : partnerName;
    const time = turn.timestamp ? formatTime(turn.timestamp) : "";
    lines.push(`[${time}] ${name}:`);
    lines.push(turn.content);
    lines.push("");
  }

  return lines.join("\n");
}

export function exportToMarkdown(userId: string, profile?: Profile | null): string {
  const history = loadShortTerm(userId, 9999);
  const lines: string[] = [];
  const partnerName = profile?.name || "TA";

  lines.push(`# 梦间 Yumema 聊天记录`);
  lines.push("");
  lines.push(`**对方**: ${partnerName}`);
  lines.push(`**导出时间**: ${new Date().toLocaleString("zh-CN")}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const turn of history) {
    const name = turn.role === "user"
      ? (profile?.user_nickname || "你")
      : partnerName;
    const time = turn.timestamp ? formatTime(turn.timestamp) : "";
    lines.push(`### ${name} \`${time}\``);
    lines.push("");
    lines.push(turn.content);
    lines.push("");
  }

  return lines.join("\n");
}

export function exportToHTML(userId: string, profile?: Profile | null): string {
  const history = loadShortTerm(userId, 9999);
  const partnerName = profile?.name || "TA";
  const userName = profile?.user_nickname || "你";
  const exportTime = new Date().toLocaleString("zh-CN");

  const messages = history.map((turn) => {
    const isUser = turn.role === "user";
    const safeContent = turn.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    return `
    <div class="msg ${isUser ? "user" : "partner"}">
      <div class="bubble ${isUser ? "user-bubble" : "partner-bubble"}">${safeContent}</div>
      <div class="meta"><span class="name">${isUser ? userName : partnerName}</span><span class="time">${turn.timestamp ? formatTime(turn.timestamp) : ""}</span></div>
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>梦间 Yumema 聊天记录</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; background: linear-gradient(135deg, rgba(135,206,250,0.15), rgba(255,182,193,0.15), rgba(216,180,254,0.15)); min-height: 100vh; padding: 40px 20px; }
  .container { max-width: 680px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 32px; }
  .header h1 { font-size: 24px; color: #18181b; margin-bottom: 8px; }
  .header p { font-size: 14px; color: #8c8c94; }
  .msg { margin-bottom: 20px; }
  .msg.user { text-align: right; }
  .bubble { display: inline-block; max-width: 75%; padding: 12px 16px; border-radius: 16px; font-size: 15px; line-height: 1.6; word-break: break-word; }
  .user-bubble { background: rgba(147,197,253,0.35); color: #1e293b; border-radius: 16px 16px 4px 16px; }
  .partner-bubble { background: rgba(255,192,203,0.3); color: #18181b; border-radius: 16px 16px 16px 4px; }
  .meta { margin-top: 4px; font-size: 12px; color: #8c8c94; padding: 0 8px; }
  .name { font-weight: 500; margin-right: 8px; }
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>梦间 Yumema</h1><p>${userName} 与 ${partnerName} 的聊天记录 · ${exportTime}</p></div>
  ${messages}
</div>
</body>
</html>`;
}
