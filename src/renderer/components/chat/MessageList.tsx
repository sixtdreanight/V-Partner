import { type RefObject, useEffect, useMemo } from "react";
import { Users, Heart } from "lucide-react";
import type { ChatMessage } from "../../hooks/useChat";
import MessageBubble from "./MessageBubble";
import { Avatar, AvatarFallback } from "../ui/avatar";

function formatDateLabel(ts: string): string | null {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (target.getTime() === today.getTime()) return "今天";
  if (target.getTime() === yesterday.getTime()) return "昨天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

interface GroupedMessages {
  label: string | null;
  messages: { msg: ChatMessage; idx: number }[];
}

function groupByDate(messages: ChatMessage[]): GroupedMessages[] {
  const groups: GroupedMessages[] = [];
  let lastLabel: string | null = null;
  messages.forEach((msg, idx) => {
    const label = formatDateLabel(msg.time);
    if (label !== lastLabel) {
      groups.push({ label, messages: [] });
      lastLabel = label;
    }
    groups[groups.length - 1].messages.push({ msg, idx });
  });
  return groups;
}

export default function MessageList({
  messages, typing, messagesEndRef,
}: {
  messages: ChatMessage[];
  typing: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}) {
  const groups = useMemo(() => groupByDate(messages), [messages]);

  useEffect(() => {
    const el = messagesEndRef.current;
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  if (messages.length === 0) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }} className="bounce-in">
          <div style={{
            width: 64, height: 64, margin: "0 auto 16px",
            borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--vp-primary-soft)",
          }}>
            <Users size={28} style={{ color: "var(--primary)" }} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 500 }}>开始聊天吧</h3>
          <p style={{ fontSize: 13, marginTop: 6, color: "var(--muted-foreground)" }}>
            发送第一条消息，TA 会回复你
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {groups.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 12 }}>
          {group.label && (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
              <span style={{
                fontSize: 11,
                fontFamily: "var(--vp-font-mono)",
                color: "var(--muted-foreground)",
              }}>
                {group.label}
              </span>
            </div>
          )}
          {group.messages.map(({ msg, idx }, mi) => (
            <MessageBubble
              key={idx}
              message={msg}
              showAvatar={mi === 0 || group.messages[mi - 1]?.msg.role !== msg.role}
            />
          ))}
        </div>
      ))}

      {typing && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingTop: 4 }}
          className="slide-up">
          <Avatar style={{ width: 32, height: 32, background: "var(--vp-primary-soft)" }}>
            <AvatarFallback className="bg-transparent">
              <Heart size={16} style={{ color: "var(--primary)" }} fill="currentColor" />
            </AvatarFallback>
          </Avatar>
          <div style={{
            padding: "10px 14px",
            background: "var(--vp-bubble-partner)",
            border: "1px solid var(--border)",
            borderRadius: "18px 18px 18px 4px",
          }}>
            <span className="bounce-dot" />
            <span className="bounce-dot" style={{ marginLeft: 4 }} />
            <span className="bounce-dot" style={{ marginLeft: 4 }} />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </>
  );
}
