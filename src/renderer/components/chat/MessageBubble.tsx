import { useState, useCallback } from "react";
import { Heart, Smile } from "lucide-react";
import type { ChatMessage } from "../../hooks/useChat";
import { Avatar, AvatarFallback } from "../ui/Avatar";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({
  message, showAvatar, canRegenerate, onRegenerate,
}: {
  message: ChatMessage;
  showAvatar: boolean;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
}) {
  const isPartner = message.role === "partner";
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!canRegenerate || !onRegenerate) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, [canRegenerate, onRegenerate]);

  const handleRegenerate = useCallback(() => {
    setMenuPos(null);
    onRegenerate?.();
  }, [onRegenerate]);

  return (
    <>
      <div
        className="float-up"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "6px 0",
          flexDirection: isPartner ? "row" : "row-reverse",
        }}
        onContextMenu={handleContextMenu}
      >
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {showAvatar ? (
            <Avatar
              style={{
                width: 32, height: 32,
                background: isPartner ? "var(--vp-primary-soft)" : "var(--muted)",
              }}
            >
              <AvatarFallback className="bg-transparent">
                {isPartner
                  ? <Heart size={16} style={{ color: "var(--primary)" }} fill="currentColor" />
                  : <Smile size={16} />
                }
              </AvatarFallback>
            </Avatar>
          ) : (
            <div style={{ width: 32 }} />
          )}
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "75%",
          alignItems: isPartner ? "flex-start" : "flex-end",
        }}>
          <div
            style={{
              padding: "10px 14px",
              fontSize: 15,
              lineHeight: 1.65,
              wordBreak: "break-word",
              background: isPartner ? "var(--vp-bubble-partner)" : "var(--vp-bubble-user)",
              color: isPartner ? "var(--vp-bubble-partner-text)" : "var(--vp-bubble-user-text)",
              borderRadius: isPartner
                ? "18px 18px 18px 4px"
                : "18px 18px 4px 18px",
              border: isPartner ? "1px solid var(--border)" : "none",
            }}
          >
            {message.content}
          </div>

          {showAvatar && (
            <time style={{
              fontSize: 10,
              marginTop: 6,
              padding: "0 4px",
              fontFamily: "var(--vp-font-mono)",
              color: "var(--muted-foreground)",
            }}>
              {formatTime(message.time)}
            </time>
          )}
        </div>
      </div>

      {menuPos && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setMenuPos(null)} />
          <div
            className="fixed z-50 rounded-lg border border-border bg-popover shadow-lg py-1 min-w-[120px]"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <button
              className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
              onClick={handleRegenerate}
            >
              重新生成
            </button>
          </div>
        </>
      )}
    </>
  );
}
